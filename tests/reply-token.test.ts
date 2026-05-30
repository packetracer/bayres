import { describe, expect, it } from "vitest";
import { findReplyToken, generateReplyToken } from "@/lib/reply-token";

describe("reply token matching", () => {
  it("generates and finds reply tokens", () => {
    const token = generateReplyToken();
    expect(token).toMatch(/^rsv_/);
    expect(findReplyToken(`Reply token: ${token}`)).toBe(token);
  });
});
