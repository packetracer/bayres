import { notFound } from "next/navigation";
import { ReservationForm } from "@/components/reservation-form";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateReservationAction } from "../../../actions";

export default async function EditReservationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({ where: { id } });
  if (!reservation) notFound();
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Edit {reservation.reservationCode}</h1>
      <ReservationForm reservation={reservation} action={updateReservationAction.bind(null, id)} />
    </div>
  );
}
