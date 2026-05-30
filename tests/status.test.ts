import { describe, expect, it } from "vitest";
import { isTerminalStatus } from "@/lib/status";
import { classifyReply } from "@/lib/reply-classifier";

describe("status and reply behavior", () => {
  it("identifies terminal reservation states", () => {
    expect(isTerminalStatus("cancelled")).toBe(true);
    expect(isTerminalStatus("confirmed")).toBe(false);
  });

  it("classifies clear positive and negative replies", () => {
    expect(classifyReply("Yes, we will be there.")).toBe("positive");
    expect(classifyReply("Please cancel, we cannot make it.")).toBe("negative");
    expect(classifyReply("Can we talk about changing time?")).toBe("ambiguous");
  });
});
