import { describe, expect, it } from "vitest";
import { generateReservationCode, nextSequenceFromCode } from "@/lib/reservation-code";

describe("reservation code generation", () => {
  it("generates a human-readable Bayhouse code", () => {
    expect(generateReservationCode(2026, 1)).toBe("BAY-2026-000001");
    expect(generateReservationCode(2026, 42)).toBe("BAY-2026-000042");
  });

  it("increments a prior code", () => {
    expect(nextSequenceFromCode("BAY-2026-000123")).toBe(124);
  });
});
