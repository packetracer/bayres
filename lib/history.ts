import type { HistoryChangeType, Prisma, Reservation } from "@prisma/client";
import { prisma } from "./prisma";

export async function addHistory(input: {
  reservationId: string;
  changeType: HistoryChangeType;
  changedBy?: string | null;
  fieldName?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.reservationHistory.create({
    data: {
      reservationId: input.reservationId,
      changeType: input.changeType,
      changedBy: input.changedBy ?? null,
      fieldName: input.fieldName ?? null,
      oldValue: input.oldValue === undefined || input.oldValue === null ? null : String(input.oldValue),
      newValue: input.newValue === undefined || input.newValue === null ? null : String(input.newValue),
      metadata: input.metadata
    }
  });
}

const trackedFields: (keyof Reservation)[] = [
  "guestName",
  "guestEmail",
  "guestPhone",
  "partySize",
  "reservationStart",
  "reservationEnd",
  "status",
  "notes",
  "internalOwner"
];

export async function recordReservationDiff(before: Reservation, after: Reservation, changedBy?: string | null) {
  for (const field of trackedFields) {
    const oldValue = before[field];
    const newValue = after[field];
    if (String(oldValue ?? "") !== String(newValue ?? "")) {
      await addHistory({
        reservationId: after.id,
        changeType: field === "status" ? "status_changed" : "edited",
        changedBy,
        fieldName: String(field),
        oldValue,
        newValue
      });
    }
  }
}
