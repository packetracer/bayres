import crypto from "crypto";

export function generateReplyToken() {
  return `rsv_${crypto.randomBytes(18).toString("base64url")}`;
}

export function findReplyToken(input: string) {
  const match = input.match(/rsv_[A-Za-z0-9_-]{16,}/);
  return match?.[0] ?? null;
}
