"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { ReservationStatus } from "@prisma/client";
import { requireAdmin, requireUser } from "@/lib/auth";
import { reservationFormSchema } from "@/lib/validation";
import { createReservation, setReservationStatus, updateReservation } from "@/lib/reservations";
import { sendReservationEmail } from "@/lib/email";

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
  revalidatePath("/");
  redirect(`/reservations/${reservation.id}`);
}

export async function updateReservationAction(id: string, formData: FormData) {
  const user = await requireAdmin();
  await updateReservation(id, parsedReservation(formData), user.userId);
  revalidatePath(`/reservations/${id}`);
  redirect(`/reservations/${id}`);
}

export async function statusAction(id: string, status: ReservationStatus) {
  const user = await requireAdmin();
  await setReservationStatus(id, status, user.userId);
  revalidatePath(`/reservations/${id}`);
}

export async function sendEmailAction(id: string, type: "confirmation_request" | "confirmation" | "cancellation" | "reminder") {
  const user = await requireUser();
  await sendReservationEmail(id, type, user.userId);
  revalidatePath(`/reservations/${id}`);
}
