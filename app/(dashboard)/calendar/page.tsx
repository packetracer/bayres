import { format, isSameMonth } from "date-fns";
import { currentUser } from "@/lib/auth";
import { calendarMonth, reservationDateKey } from "@/lib/calendar";
import { prisma } from "@/lib/prisma";
import { CalendarBookingDialog } from "@/components/calendar-booking-dialog";
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
  const days = month.days.map((day) => {
    const key = reservationDateKey(day);
    return {
      key,
      dayNumber: format(day, "d"),
      weekdayLabel: format(day, "EEE"),
      inCurrentMonth: isSameMonth(day, month.current),
      reservations: (byDay.get(key) || []).map((reservation) => ({
        id: reservation.id,
        guestName: reservation.guestName,
        notes: reservation.notes,
        status: reservation.status
      }))
    };
  });

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bay House calendar</h1>
          <p className="text-sm text-slate-500">Request a family reservation date and see who already has dates held.</p>
        </div>
      </div>

      <CalendarBookingDialog
        days={days}
        monthLabel={month.label}
        previousMonthHref={`/calendar?month=${month.prev}`}
        nextMonthHref={`/calendar?month=${month.next}`}
        isPendingApproval={isPendingApproval}
        showPendingMessage={params.approval === "pending" || isPendingApproval}
        createReservationAction={createBayHouseReservationAction}
      />

      {user.role !== "admin" ? (
        <p className="text-sm text-slate-500">Approved guest accounts can submit requests. Requests stay pending until an admin approves the reservation.</p>
      ) : null}
    </div>
  );
}
