import Link from "next/link";
import { format } from "date-fns";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function EmailsPage() {
  await requireAdmin();
  const emails = await prisma.email.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { reservation: true }
  });
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Email activity</h1>
      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="p-3">Reservation</th>
              <th className="p-3">Recipient</th>
              <th className="p-3">Subject</th>
              <th className="p-3">Status</th>
              <th className="p-3">Sent</th>
            </tr>
          </thead>
          <tbody>
            {emails.map((email) => (
              <tr key={email.id} className="border-b last:border-0">
                <td className="p-3"><Link className="font-semibold text-bay-600" href={`/reservations/${email.reservationId}`}>{email.reservation.reservationCode}</Link></td>
                <td className="p-3">{email.recipientEmail}</td>
                <td className="p-3">{email.subject}</td>
                <td className="p-3">{email.deliveryStatus} · {email.replyStatus}</td>
                <td className="p-3">{email.sentAt ? format(email.sentAt, "PPp") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
