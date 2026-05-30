import Link from "next/link";
import { format, isSameMonth } from "date-fns";
import { currentUser } from "@/lib/auth";
import { calendarMonth, reservationDateKey } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";
import { createBayHouseReservationAction } from "../actions";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ approval?: string; month?: string }> }) {
  const user = await currentUser();
  const params = await searchParams;
  const month = calendarMonth(params.month);
  const isPendingApproval = user.role !== "admin" && !user.approvedAt;
  const reservations = await prisma.reservation.findMany({
    where: {
      reservationStart: { gte: month.rangeStart, lt: month.rangeEnd },
      status: { notIn: ["cancelled", "declined"] }
    },
    include: { creator: true },
    orderBy: { reservationStart: "asc" }
  });
  const byDay = new Map<string, typeof reservations>();
  for (const reservation of reservations) {
    const key = reservationDateKey(reservation.reservationStart);
    byDay.set(key, [...(byDay.get(key) || []), reservation]);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bay House calendar</h1>
          <p className="text-sm text-slate-500">Request a family reservation date and see who already has dates held.</p>
        </div>
        <div className="flex gap-2">
          <Link className="button" href={`/calendar?month=${month.prev}`}>Previous</Link>
          <Link className="button" href={`/calendar?month=${month.next}`}>Next</Link>
        </div>
      </div>

      <section className="card grid gap-4">
        <h2 className="font-semibold">Request a date</h2>
        {params.approval === "pending" || isPendingApproval ? (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Your account is waiting for admin approval. You can browse the calendar, but an admin must approve your account before you can request a reservation.
          </p>
        ) : null}
        <form action={createBayHouseReservationAction} className="grid gap-3 md:grid-cols-[1fr_140px_1.5fr_auto]">
          <label className="grid gap-1 text-sm font-medium">
            Date
            <input name="reservationDate" type="date" required />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Guests
            <input name="partySize" type="number" min="1" max="50" defaultValue={1} required />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Notes
            <input name="notes" placeholder="Optional note for the admin" />
          </label>
          <div className="flex items-end">
            <button className="button-primary w-full" type="submit">Request</button>
          </div>
        </form>
      </section>

      <section className="card p-0">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">{month.label}</h2>
        </div>
        <div className="grid grid-cols-7 border-b bg-slate-50 text-center text-xs font-semibold uppercase text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7">
          {month.days.map((day) => {
            const key = reservationDateKey(day);
            const dayReservations = byDay.get(key) || [];
            return (
              <div
                key={key}
                className={`min-h-36 border-b border-r p-3 ${isSameMonth(day, month.current) ? "bg-white" : "bg-slate-50 text-slate-400"}`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold">{format(day, "d")}</span>
                  <span className="text-xs md:hidden">{format(day, "EEE")}</span>
                </div>
                <div className="grid gap-2">
                  {dayReservations.map((reservation) => (
                    <Link
                      key={reservation.id}
                      href={`/reservations/${reservation.id}`}
                      className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs hover:bg-bay-50"
                    >
                      <div className="font-semibold text-slate-900">{reservation.guestName}</div>
                      <div className="mt-1"><StatusBadge status={reservation.status} /></div>
                      {reservation.notes ? <div className="mt-1 text-slate-500">{reservation.notes}</div> : null}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {user.role !== "admin" ? (
        <p className="text-sm text-slate-500">Approved guest accounts can submit requests. Requests stay pending until an admin approves the reservation.</p>
      ) : null}
    </div>
  );
}
