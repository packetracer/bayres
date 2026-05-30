import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";

export default async function DashboardPage() {
  const now = new Date();
  const [upcoming, pending, recentHistory] = await Promise.all([
    prisma.reservation.findMany({
      where: { reservationStart: { gte: now }, status: { notIn: ["cancelled", "declined"] } },
      orderBy: { reservationStart: "asc" },
      take: 8
    }),
    prisma.reservation.findMany({ where: { status: { in: ["pending", "confirmed_pending_review", "declined_pending_review"] } }, orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.reservationHistory.findMany({ orderBy: { changedAt: "desc" }, take: 10, include: { reservation: true } })
  ]);

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <p className="text-sm text-slate-500">Upcoming</p>
          <p className="text-3xl font-bold">{upcoming.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Pending responses</p>
          <p className="text-3xl font-bold">{pending.length}</p>
        </div>
        <div className="card">
          <p className="text-sm text-slate-500">Recent activity</p>
          <p className="text-3xl font-bold">{recentHistory.length}</p>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming reservations</h2>
            <Link className="text-sm font-semibold text-bay-600" href="/reservations">View all</Link>
          </div>
          <div className="grid gap-3">
            {upcoming.map((reservation) => (
              <Link key={reservation.id} href={`/reservations/${reservation.id}`} className="rounded-md border border-slate-100 p-3 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <strong>{reservation.guestName}</strong>
                  <StatusBadge status={reservation.status} />
                </div>
                <p className="text-sm text-slate-500">{format(reservation.reservationStart, "PPp")} · {reservation.partySize} guests</p>
              </Link>
            ))}
            {!upcoming.length ? <p className="text-sm text-slate-500">No upcoming reservations.</p> : null}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">Recent activity</h2>
          <div className="grid gap-3">
            {recentHistory.map((event) => (
              <Link key={event.id} href={`/reservations/${event.reservationId}`} className="rounded-md border border-slate-100 p-3 hover:bg-slate-50">
                <p className="text-sm font-semibold">{event.changeType.replaceAll("_", " ")}</p>
                <p className="text-sm text-slate-500">{event.reservation.reservationCode} · {format(event.changedAt, "PPp")}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
