import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/status-badge";

export default async function ReservationsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const params = await searchParams;
  const reservations = await prisma.reservation.findMany({
    where: {
      status: params.status ? (params.status as never) : undefined,
      OR: params.q
        ? [
            { guestName: { contains: params.q, mode: "insensitive" } },
            { guestEmail: { contains: params.q, mode: "insensitive" } },
            { reservationCode: { contains: params.q, mode: "insensitive" } }
          ]
        : undefined
    },
    orderBy: { reservationStart: "asc" },
    take: 100
  });

  return (
    <div className="grid gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold">Reservations</h1>
        <Link href="/reservations/new" className="button button-primary">Create reservation</Link>
      </div>
      <form className="card grid gap-3 md:grid-cols-[1fr_auto]">
        <input name="q" placeholder="Search name, email, or code" defaultValue={params.q ?? ""} />
        <button type="submit">Search</button>
      </form>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Code</th>
              <th className="p-3">Guest</th>
              <th className="p-3">When</th>
              <th className="p-3">Party</th>
              <th className="p-3">Status</th>
              <th className="p-3">Owner</th>
            </tr>
          </thead>
          <tbody>
            {reservations.map((reservation) => (
              <tr key={reservation.id} className="border-b last:border-0">
                <td className="p-3"><Link className="font-semibold text-bay-600" href={`/reservations/${reservation.id}`}>{reservation.reservationCode}</Link></td>
                <td className="p-3">{reservation.guestName}<br /><span className="text-slate-500">{reservation.guestEmail}</span></td>
                <td className="p-3">{format(reservation.reservationStart, "PPp")}</td>
                <td className="p-3">{reservation.partySize}</td>
                <td className="p-3"><StatusBadge status={reservation.status} /></td>
                <td className="p-3">{reservation.internalOwner || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
