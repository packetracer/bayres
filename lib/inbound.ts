import sanitizeHtml from "sanitize-html";
import { prisma } from "./prisma";
import { classifyReply } from "./reply-classifier";
import { findReplyToken } from "./reply-token";
import { addHistory } from "./history";

export async function handleInboundReply(input: {
  from: string;
  subject?: string | null;
  text?: string | null;
  html?: string | null;
  replyToken?: string | null;
  providerMessageId?: string | null;
}) {
  const rawBody = input.text || input.html || "";
  const token = input.replyToken || findReplyToken(`${input.subject || ""}\n${rawBody}`);
  if (!token) {
    throw new Error("Could not find a reservation reply token.");
  }

  const email = await prisma.email.findUnique({ where: { replyToken: token } });
  if (!email) {
    throw new Error("Reply token was not matched to an email.");
  }

  const classification = classifyReply(rawBody);
  const sanitizedBody = sanitizeHtml(rawBody, {
    allowedTags: ["p", "br", "strong", "em", "ul", "ol", "li", "a"],
    allowedAttributes: { a: ["href"] }
  });

  const reply = await prisma.inboundReply.create({
    data: {
      reservationId: email.reservationId,
      emailId: email.id,
      replyToken: token,
      fromEmail: input.from,
      subject: input.subject || null,
      rawBody,
      sanitizedBody,
      classification,
      reviewed: classification !== "ambiguous"
    }
  });

  await prisma.email.update({
    where: { id: email.id },
    data: {
      replyStatus: classification === "positive" ? "positive" : classification === "negative" ? "negative" : "ambiguous"
    }
  });

  const nextStatus =
    classification === "positive"
      ? "confirmed_pending_review"
      : classification === "negative"
        ? "declined_pending_review"
        : undefined;
  if (nextStatus) {
    await prisma.reservation.update({
      where: { id: email.reservationId },
      data: { status: nextStatus }
    });
  }

  await addHistory({
    reservationId: email.reservationId,
    changeType: "email_replied",
    fieldName: "replyStatus",
    newValue: classification,
    metadata: { inboundReplyId: reply.id, emailId: email.id }
  });

  return reply;
}
