"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ReservationStatus } from "@prisma/client";
import { StatusBadge } from "@/components/status-badge";

type CalendarReservation = {
  id: string;
  guestName: string;
  notes: string | null;
  status: ReservationStatus;
};

type CalendarDay = {
  key: string;
  dayNumber: string;
  weekdayLabel: string;
  inCurrentMonth: boolean;
  reservations: CalendarReservation[];
};

export function CalendarBookingDialog({
  days,
  monthLabel,
  nextMonthHref,
  previousMonthHref,
  isPendingApproval,
  showPendingMessage,
  createReservationAction
}: {
  days: CalendarDay[];
  monthLabel: string;
  nextMonthHref: string;
  previousMonthHref: string;
  isPendingApproval: boolean;
  showPendingMessage: boolean;
  createReservationAction: (formData: FormData) => void;
}) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDay = useMemo(() => days.find((day) => day.key === selectedDate), [days, selectedDate]);

  return (
    <>
      {showPendingMessage ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Your account is waiting for admin approval. You can browse the calendar, but an admin must approve your account before you can request a reservation.
        </p>
      ) : null}

      <section className="card p-0">
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">{monthLabel}</h2>
          <div className="flex gap-2">
            <Link className="button" href={previousMonthHref}>Previous</Link>
            <Link className="button" href={nextMonthHref}>Next</Link>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b bg-slate-50 text-center text-xs font-semibold uppercase text-slate-500">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="p-2">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-7">
          {days.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => setSelectedDate(day.key)}
              className={`block min-h-36 rounded-none border-0 border-b border-r p-3 text-left shadow-none hover:bg-bay-50 ${
                day.inCurrentMonth ? "bg-white text-slate-900" : "bg-slate-50 text-slate-400"
              }`}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-semibold">{day.dayNumber}</span>
                <span className="text-xs md:hidden">{day.weekdayLabel}</span>
              </div>
              <div className="grid gap-2">
                {day.reservations.map((reservation) => (
                  <Link
                    key={reservation.id}
                    href={`/reservations/${reservation.id}`}
                    onClick={(event) => event.stopPropagation()}
                    className="rounded-md border border-slate-200 bg-slate-50 p-2 text-xs hover:bg-white"
                  >
                    <div className="font-semibold text-slate-900">{reservation.guestName}</div>
                    <div className="mt-1"><StatusBadge status={reservation.status} /></div>
                    {reservation.notes ? <div className="mt-1 text-slate-500">{reservation.notes}</div> : null}
                  </Link>
                ))}
                {!day.reservations.length ? <span className="text-xs text-slate-400">Click to request</span> : null}
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedDate ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6" role="dialog" aria-modal="true">
          <div className="card grid w-full max-w-lg gap-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Request Bay House date</h2>
                <p className="text-sm text-slate-500">{selectedDay?.weekdayLabel}, {selectedDate}</p>
              </div>
              <button type="button" onClick={() => setSelectedDate(null)} aria-label="Close booking dialog">Close</button>
            </div>
            {isPendingApproval ? (
              <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
                Your account is waiting for admin approval. You can browse the calendar, but an admin must approve your account before you can request a reservation.
              </p>
            ) : (
              <form action={createReservationAction} className="grid gap-3">
                <input name="reservationDate" type="hidden" value={selectedDate} />
                <label className="grid gap-1 text-sm font-medium">
                  Guests
                  <input name="partySize" type="number" min="1" max="50" defaultValue={1} required />
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  Notes
                  <textarea name="notes" rows={4} placeholder="Optional note for the admin" />
                </label>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setSelectedDate(null)}>Cancel</button>
                  <button className="button-primary" type="submit">Request date</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
