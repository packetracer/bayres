import { ReservationForm } from "@/components/reservation-form";
import { createReservationAction } from "../../actions";

export default function NewReservationPage() {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Create reservation</h1>
      <ReservationForm action={createReservationAction} submitLabel="Create reservation" />
    </div>
  );
}
