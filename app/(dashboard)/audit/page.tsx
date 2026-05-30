import Link from "next/link";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AuditPage() {
  await requireAdmin();
  const [events, history] = await Promise.all([
    prisma.auditEvent.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    prisma.reservationHistory.findMany({
      include: { reservation: true, user: true },
      orderBy: { changedAt: "desc" },
      take: 100
    })
  ]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Admin audit trail</h1>
        <p className="text-sm text-slate-500">Recent user, role, reservation, status, and email actions.</p>
      </div>

      <section className="card overflow-x-auto p-0">
        <div className="border-b p-4">
          <h2 className="font-semibold">Audit queue</h2>
        </div>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Who</th>
              <th className="p-3">Action</th>
              <th className="p-3">Summary</th>
              <th className="p-3">Target</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">{format(event.createdAt, "PPp")}</td>
                <td className="p-3">{event.actor ? event.actor.name : "System"}</td>
                <td className="p-3 font-mono text-xs">{event.action}</td>
                <td className="p-3">{event.summary}</td>
                <td className="p-3">
                  {event.targetType === "reservation" && event.targetId ? (
                    <Link className="font-semibold text-bay-600" href={`/reservations/${event.targetId}`}>Reservation</Link>
                  ) : (
                    event.targetType
                  )}
                </td>
              </tr>
            ))}
            {!events.length ? (
              <tr>
                <td className="p-3 text-slate-500" colSpan={5}>No audit events yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>

      <section className="card overflow-x-auto p-0">
        <div className="border-b p-4">
          <h2 className="font-semibold">Reservation history</h2>
        </div>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">When</th>
              <th className="p-3">Who</th>
              <th className="p-3">Reservation</th>
              <th className="p-3">Change</th>
              <th className="p-3">Before</th>
              <th className="p-3">After</th>
            </tr>
          </thead>
          <tbody>
            {history.map((event) => (
              <tr key={event.id} className="border-b last:border-0">
                <td className="p-3 whitespace-nowrap">{format(event.changedAt, "PPp")}</td>
                <td className="p-3">{event.user ? event.user.name : "System"}</td>
                <td className="p-3">
                  <Link className="font-semibold text-bay-600" href={`/reservations/${event.reservationId}`}>
                    {event.reservation.reservationCode}
                  </Link>
                </td>
                <td className="p-3">{event.changeType.replaceAll("_", " ")}</td>
                <td className="p-3 text-slate-500">{event.oldValue || "-"}</td>
                <td className="p-3 text-slate-700">{event.newValue || "-"}</td>
              </tr>
            ))}
            {!history.length ? (
              <tr>
                <td className="p-3 text-slate-500" colSpan={6}>No reservation history yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </div>
  );
}
