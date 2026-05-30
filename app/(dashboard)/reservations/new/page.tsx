import { ReservationForm } from "@/components/reservation-form";
import { requireAdmin } from "@/lib/auth";
import { createReservationAction } from "../../actions";

export default async function NewReservationPage() {
  await requireAdmin();
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Create reservation</h1>
      <ReservationForm action={createReservationAction} submitLabel="Create reservation" />
    </div>
  );
}
