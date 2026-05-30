"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ReservationStatus, UserRole } from "@prisma/client";
import { currentUser, requireAdmin, requireUser } from "@/lib/auth";
import { bayHouseReservationSchema, reservationFormSchema, userRegistrationSchema } from "@/lib/validation";
import { createBayHouseReservationRequest, createReservation, setReservationStatus, updateReservation } from "@/lib/reservations";
import { sendReservationEmail } from "@/lib/email";
import { approveUser, createUser, setUserRole } from "@/lib/users";
import { recordAuditEvent } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

function parsedReservation(formData: FormData) {
  const parsed = reservationFormSchema.parse(Object.fromEntries(formData));
  return {
    ...parsed,
    guestPhone: parsed.guestPhone || null,
    reservationStart: new Date(parsed.reservationStart),
    reservationEnd: new Date(parsed.reservationEnd),
    status: parsed.status as ReservationStatus,
    notes: parsed.notes || null,
    internalOwner: parsed.internalOwner || null
  };
}

export async function createReservationAction(formData: FormData) {
  const user = await requireAdmin();
  const reservation = await createReservation({ ...parsedReservation(formData), createdBy: user.userId });
  await recordAuditEvent({
    actorId: user.userId,
    action: "reservation.created",
    targetType: "reservation",
    targetId: reservation.id,
    summary: `Created reservation ${reservation.reservationCode} for ${reservation.guestName}`
  });
  revalidatePath("/");
  redirect(`/reservations/${reservation.id}`);
}

export async function updateReservationAction(id: string, formData: FormData) {
  const user = await requireAdmin();
  const reservation = await updateReservation(id, parsedReservation(formData), user.userId);
  await recordAuditEvent({
    actorId: user.userId,
    action: "reservation.edited",
    targetType: "reservation",
    targetId: id,
    summary: `Edited reservation ${reservation.reservationCode} for ${reservation.guestName}`
  });
  revalidatePath(`/reservations/${id}`);
  redirect(`/reservations/${id}`);
}

export async function statusAction(id: string, status: ReservationStatus) {
  const user = await requireAdmin();
  const reservation = await setReservationStatus(id, status, user.userId);
  await recordAuditEvent({
    actorId: user.userId,
    action: "reservation.status_changed",
    targetType: "reservation",
    targetId: id,
    summary: `Changed ${reservation.reservationCode} to ${status}`
  });
  revalidatePath(`/reservations/${id}`);
  revalidatePath("/audit");
}

export async function deleteReservationAction(id: string) {
  const user = await requireAdmin();
  const reservation = await setReservationStatus(id, "cancelled", user.userId);
  await recordAuditEvent({
    actorId: user.userId,
    action: "reservation.deleted",
    targetType: "reservation",
    targetId: id,
    summary: `Deleted reservation ${reservation.reservationCode} for ${reservation.guestName}`
  });
  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/reservations");
  revalidatePath("/audit");
  redirect("/reservations");
}

export async function sendEmailAction(id: string, type: "confirmation_request" | "confirmation" | "cancellation" | "reminder") {
  const user = await requireAdmin();
  const email = await sendReservationEmail(id, type, user.userId);
  await recordAuditEvent({
    actorId: user.userId,
    action: "reservation.email_sent",
    targetType: "reservation",
    targetId: id,
    summary: `Sent ${type.replaceAll("_", " ")} email to ${email.recipientEmail}`
  });
  revalidatePath(`/reservations/${id}`);
}

export async function createUserAction(formData: FormData) {
  const admin = await requireAdmin();
  const parsed = userRegistrationSchema.parse(Object.fromEntries(formData));
  const user = await createUser({ ...parsed, role: parsed.role as UserRole, approvedAt: new Date() });
  await recordAuditEvent({
    actorId: admin.userId,
    action: "user.created",
    targetType: "user",
    targetId: user.id,
    summary: `Registered ${user.name} as ${user.role}`
  });
  revalidatePath("/users");
  revalidatePath("/audit");
  redirect("/users");
}

export async function approveUserAction(userId: string) {
  const admin = await requireAdmin();
  const user = await approveUser(userId);
  await recordAuditEvent({
    actorId: admin.userId,
    action: "user.approved",
    targetType: "user",
    targetId: user.id,
    summary: `Approved guest account for ${user.name}`
  });
  revalidatePath("/users");
  revalidatePath("/audit");
}

export async function approveUserAndRequestsAction(userId: string) {
  const admin = await requireAdmin();
  const user = await approveUser(userId);
  await recordAuditEvent({
    actorId: admin.userId,
    action: "user.approved",
    targetType: "user",
    targetId: user.id,
    summary: `Approved guest account for ${user.name}`
  });

  const pendingReservations = await prisma.reservation.findMany({
    where: { createdBy: userId, status: "pending" },
    select: { id: true }
  });
  for (const reservation of pendingReservations) {
    const updated = await setReservationStatus(reservation.id, "confirmed", admin.userId);
    await recordAuditEvent({
      actorId: admin.userId,
      action: "reservation.status_changed",
      targetType: "reservation",
      targetId: updated.id,
      summary: `Confirmed ${updated.reservationCode} while approving ${user.name}`
    });
  }

  revalidatePath("/");
  revalidatePath("/calendar");
  revalidatePath("/users");
  revalidatePath("/audit");
}

export async function setUserRoleAction(userId: string, role: UserRole) {
  const admin = await requireAdmin();
  if (admin.userId === userId && role !== "admin") {
    throw new Error("You cannot remove your own admin access.");
  }
  const user = await setUserRole(userId, role);
  await recordAuditEvent({
    actorId: admin.userId,
    action: "user.role_changed",
    targetType: "user",
    targetId: user.id,
    summary: `Changed ${user.name} to ${user.role}`
  });
  revalidatePath("/users");
  revalidatePath("/audit");
}

export async function createBayHouseReservationAction(formData: FormData) {
  const user = await currentUser();
  if (user.role !== "admin" && !user.approvedAt) {
    redirect("/calendar?approval=pending");
  }
  const parsed = bayHouseReservationSchema.parse(Object.fromEntries(formData));
  const reservation = await createBayHouseReservationRequest({
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    reservationDate: parsed.reservationDate,
    partySize: parsed.partySize,
    notes: parsed.notes || null
  });
  await recordAuditEvent({
    actorId: user.id,
    action: "reservation.requested",
    targetType: "reservation",
    targetId: reservation.id,
    summary: `Requested ${reservation.reservationCode} for ${reservation.guestName}`
  });
  revalidatePath("/calendar");
  redirect(`/reservations/${reservation.id}`);
}
