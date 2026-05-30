import type { Reservation, ReservationStatus } from "@prisma/client";
import { reservationStatuses, publicStatusLabels } from "@/lib/status";

function toLocalInput(value?: Date | string | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function ReservationForm({
  reservation,
  action,
  submitLabel = "Save reservation"
}: {
  reservation?: Reservation | null;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="card grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Guest name
          <input name="guestName" defaultValue={reservation?.guestName ?? ""} required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Guest email
          <input name="guestEmail" type="email" defaultValue={reservation?.guestEmail ?? ""} required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Guest phone
          <input name="guestPhone" defaultValue={reservation?.guestPhone ?? ""} />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Party size
          <input name="partySize" type="number" min="1" max="50" defaultValue={reservation?.partySize ?? 2} required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Start
          <input name="reservationStart" type="datetime-local" defaultValue={toLocalInput(reservation?.reservationStart)} required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          End
          <input name="reservationEnd" type="datetime-local" defaultValue={toLocalInput(reservation?.reservationEnd)} required />
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Status
          <select name="status" defaultValue={(reservation?.status ?? "pending") as ReservationStatus}>
            {reservationStatuses.map((status) => (
              <option key={status} value={status}>
                {publicStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium">
          Internal owner
          <input name="internalOwner" defaultValue={reservation?.internalOwner ?? ""} />
        </label>
      </div>
      <label className="grid gap-1 text-sm font-medium">
        Notes
        <textarea name="notes" rows={4} defaultValue={reservation?.notes ?? ""} />
      </label>
      <div>
        <button className="button-primary" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
