import { NextResponse } from "next/server";
import { handleInboundReply } from "@/lib/inbound";
import { inboundReplySchema } from "@/lib/validation";

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = inboundReplySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }
  try {
    const reply = await handleInboundReply(parsed.data);
    return NextResponse.json({ ok: true, replyId: reply.id, classification: reply.classification });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "Inbound reply failed" }, { status: 400 });
  }
}
