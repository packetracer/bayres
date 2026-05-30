import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addHistory } from "@/lib/history";

function verifySignature(rawBody: string, signature: string | null) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("resend-signature") || request.headers.get("x-resend-signature");
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const eventType = String(payload.type || payload.event || "unknown");
  const providerMessageId = payload.data?.email_id || payload.data?.id || payload.email_id || null;
  const email = providerMessageId
    ? await prisma.email.findFirst({ where: { providerMessageId } })
    : null;

  const event = await prisma.emailEvent.create({
    data: {
      emailId: email?.id,
      reservationId: email?.reservationId,
      eventType,
      payload
    }
  });

  if (email) {
    const deliveryStatus = eventType.includes("opened")
      ? "opened"
      : eventType.includes("delivered")
        ? "delivered"
        : eventType.includes("bounced")
          ? "bounced"
          : eventType.includes("failed")
            ? "failed"
            : undefined;
    if (deliveryStatus) {
      await prisma.email.update({ where: { id: email.id }, data: { deliveryStatus } });
    }
    if (eventType.includes("opened")) {
      await addHistory({
        reservationId: email.reservationId,
        changeType: "email_opened",
        metadata: { emailId: email.id, emailEventId: event.id }
      });
    }
  }

  return NextResponse.json({ ok: true });
}
