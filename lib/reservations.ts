import type { ReservationStatus } from "@prisma/client";
import { addMinutes } from "date-fns";
import { prisma } from "./prisma";
import { generateReservationCode, nextSequenceFromCode } from "./reservation-code";
import { addHistory, recordReservationDiff } from "./history";
import { dateInputToReservationRange } from "./calendar";

export async function allocateReservationCode(date = new Date()) {
  const year = date.getFullYear();
  const latest = await prisma.reservation.findFirst({
    where: { reservationCode: { startsWith: `BAY-${year}-` } },
    orderBy: { reservationCode: "desc" },
    select: { reservationCode: true }
  });
  return generateReservationCode(year, nextSequenceFromCode(latest?.reservationCode));
}

export async function upsertGuest(input: { name: string; email: string; phone?: string | null }) {
  const email = input.email.toLowerCase();
  const existing = await prisma.guest.findFirst({ where: { email, phone: input.phone || null } });
  if (existing) {
    return prisma.guest.update({
      where: { id: existing.id },
      data: { name: input.name, email, phone: input.phone || null }
    });
  }
  return prisma.guest.create({ data: { name: input.name, email, phone: input.phone || null } });
}

export async function createReservation(input: {
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  partySize: number;
  reservationStart: Date;
  reservationEnd?: Date;
  status?: ReservationStatus;
  notes?: string | null;
  internalOwner?: string | null;
  createdBy?: string | null;
}) {
  const guest = await upsertGuest({
    name: input.guestName,
    email: input.guestEmail,
    phone: input.guestPhone
  });
  const reservation = await prisma.reservation.create({
    data: {
      reservationCode: await allocateReservationCode(input.reservationStart),
      guestId: guest.id,
      guestName: input.guestName,
      guestEmail: input.guestEmail.toLowerCase(),
      guestPhone: input.guestPhone || null,
      partySize: input.partySize,
      reservationStart: input.reservationStart,
      reservationEnd: input.reservationEnd ?? addMinutes(input.reservationStart, 90),
      status: input.status ?? "pending",
      notes: input.notes || null,
      internalOwner: input.internalOwner || null,
      createdBy: input.createdBy || null
    }
  });
  await addHistory({
    reservationId: reservation.id,
    changeType: "created",
    changedBy: input.createdBy,
    newValue: reservation.status
  });
  return reservation;
}

export async function updateReservation(
  id: string,
  input: {
    guestName: string;
    guestEmail: string;
    guestPhone?: string | null;
    partySize: number;
    reservationStart: Date;
    reservationEnd: Date;
    status: ReservationStatus;
    notes?: string | null;
    internalOwner?: string | null;
  },
  changedBy?: string | null
) {
  const before = await prisma.reservation.findUniqueOrThrow({ where: { id } });
  const guest = await upsertGuest({ name: input.guestName, email: input.guestEmail, phone: input.guestPhone });
  const after = await prisma.reservation.update({
    where: { id },
    data: {
      guestId: guest.id,
      guestName: input.guestName,
      guestEmail: input.guestEmail.toLowerCase(),
      guestPhone: input.guestPhone || null,
      partySize: input.partySize,
      reservationStart: input.reservationStart,
      reservationEnd: input.reservationEnd,
      status: input.status,
      notes: input.notes || null,
      internalOwner: input.internalOwner || null
    }
  });
  await recordReservationDiff(before, after, changedBy);
  return after;
}

export async function setReservationStatus(id: string, status: ReservationStatus, changedBy?: string | null) {
  const before = await prisma.reservation.findUniqueOrThrow({ where: { id } });
  const after = await prisma.reservation.update({ where: { id }, data: { status } });
  if (before.status !== after.status) {
    await addHistory({
      reservationId: id,
      changeType: status === "cancelled" ? "cancelled" : "status_changed",
      changedBy,
      fieldName: "status",
      oldValue: before.status,
      newValue: after.status
    });
  }
  return after;
}

export async function createBayHouseReservationRequest(input: {
  userId: string;
  userName: string;
  userEmail: string;
  reservationDate: string;
  partySize: number;
  notes?: string | null;
}) {
  const { start, end } = dateInputToReservationRange(input.reservationDate);
  const existing = await prisma.reservation.findFirst({
    where: {
      reservationStart: { gte: new Date(`${input.reservationDate}T00:00:00`), lt: new Date(`${input.reservationDate}T23:59:59`) },
      status: { notIn: ["cancelled", "declined"] }
    }
  });
  if (existing) {
    throw new Error("That date already has a reservation request.");
  }
  return createReservation({
    guestName: input.userName,
    guestEmail: input.userEmail,
    partySize: input.partySize,
    reservationStart: start,
    reservationEnd: end,
    status: "pending",
    notes: input.notes || null,
    internalOwner: "Bay House",
    createdBy: input.userId
  });
}
