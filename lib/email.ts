import type { EmailType } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "./prisma";
import { generateReplyToken } from "./reply-token";
import { addHistory } from "./history";

function resendClient() {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }
  return new Resend(process.env.RESEND_API_KEY);
}

export function replyAddress(token: string) {
  const from = process.env.FROM_EMAIL || "";
  const match = from.match(/<([^>]+)>/)?.[1] || from;
  const [local, domain] = match.split("@");
  if (!local || !domain) return undefined;
  return `${local}+${token}@${domain}`;
}

export function reservationEmailBody(input: {
  guestName: string;
  reservationCode: string;
  reservationStart: Date;
  partySize: number;
  type: EmailType;
  replyToken: string;
}) {
  const date = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short"
  }).format(input.reservationStart);
  const action =
    input.type === "confirmation_request"
      ? "Please reply to confirm or decline this reservation."
      : input.type === "confirmation"
        ? "Your reservation is confirmed."
        : input.type === "cancellation"
          ? "Your reservation has been cancelled."
          : "This is a reminder for your upcoming reservation.";
  return `Hello ${input.guestName},

${action}

Reservation: ${input.reservationCode}
When: ${date}
Party size: ${input.partySize}

Reply token: ${input.replyToken}

Thank you,
Bayhouse Reservations`;
}

export async function sendReservationEmail(reservationId: string, type: EmailType, changedBy?: string | null) {
  const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } });
  const replyToken = generateReplyToken();
  const subject = `[${reservation.reservationCode}] ${
    type === "confirmation_request"
      ? "Please confirm your reservation"
      : type === "confirmation"
        ? "Reservation confirmed"
        : type === "cancellation"
          ? "Reservation cancelled"
          : "Reservation reminder"
  }`;
  const body = reservationEmailBody({
    guestName: reservation.guestName,
    reservationCode: reservation.reservationCode,
    reservationStart: reservation.reservationStart,
    partySize: reservation.partySize,
    type,
    replyToken
  });
  const email = await prisma.email.create({
    data: {
      reservationId,
      recipientEmail: reservation.guestEmail,
      subject,
      body,
      type,
      replyToken,
      deliveryStatus: "queued"
    }
  });

  const result = await resendClient().emails.send({
    from: process.env.FROM_EMAIL!,
    to: reservation.guestEmail,
    subject,
    text: body,
    replyTo: replyAddress(replyToken)
  });

  const providerMessageId = result.data?.id ?? null;
  const sent = await prisma.email.update({
    where: { id: email.id },
    data: {
      providerMessageId,
      deliveryStatus: providerMessageId ? "sent" : "failed",
      sentAt: providerMessageId ? new Date() : null
    }
  });
  await addHistory({
    reservationId,
    changeType: type === "reminder" ? "reminder_sent" : "email_sent",
    changedBy,
    metadata: { emailId: email.id, type, providerMessageId }
  });
  return sent;
}
