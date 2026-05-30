import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function ReviewQueuePage() {
  const replies = await prisma.inboundReply.findMany({
    where: { OR: [{ classification: "ambiguous" }, { reviewed: false }] },
    orderBy: { createdAt: "asc" },
    include: { reservation: true }
  });
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Pending reply review</h1>
      <div className="grid gap-3">
        {replies.map((reply) => (
          <Link key={reply.id} href={`/reservations/${reply.reservationId}`} className="card block hover:bg-slate-50">
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <strong>{reply.reservation.reservationCode} · {reply.reservation.guestName}</strong>
              <span className="text-sm text-slate-500">{reply.classification}</span>
            </div>
            <div className="mt-2 line-clamp-3 text-sm text-slate-600" dangerouslySetInnerHTML={{ __html: reply.sanitizedBody }} />
          </Link>
        ))}
        {!replies.length ? <div className="card text-sm text-slate-500">No replies need review.</div> : null}
      </div>
    </div>
  );
}
