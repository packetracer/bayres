import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import type { EmailType, ReservationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { StatusBadge } from "@/components/status-badge";
import { publicStatusLabels, reservationStatuses } from "@/lib/status";
import { deleteReservationAction, sendEmailAction, statusAction } from "../../actions";

export default async function ReservationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      history: { orderBy: { changedAt: "desc" }, include: { user: true } },
      emails: { orderBy: { createdAt: "desc" } },
      inboundReplies: { orderBy: { createdAt: "desc" } }
    }
  });
  if (!reservation) notFound();
  const isAdmin = user.role === "admin";

  async function updateStatus(formData: FormData) {
    "use server";
    await statusAction(id, formData.get("status") as ReservationStatus);
  }

  async function sendEmail(formData: FormData) {
    "use server";
    await sendEmailAction(id, formData.get("type") as EmailType);
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-bay-600">{reservation.reservationCode}</p>
          <h1 className="text-2xl font-bold">{reservation.guestName}</h1>
          <p className="text-slate-500">{reservation.guestEmail} · {reservation.guestPhone || "No phone"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {isAdmin ? <Link className="button" href={`/reservations/${id}/edit`}>Edit</Link> : null}
          <StatusBadge status={reservation.status} />
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <h2 className="mb-3 font-semibold">Reservation</h2>
          <dl className="grid gap-3 md:grid-cols-2">
            <div><dt className="text-sm text-slate-500">Start</dt><dd className="font-medium">{format(reservation.reservationStart, "PPp")}</dd></div>
            <div><dt className="text-sm text-slate-500">End</dt><dd className="font-medium">{format(reservation.reservationEnd, "PPp")}</dd></div>
            <div><dt className="text-sm text-slate-500">Party size</dt><dd className="font-medium">{reservation.partySize}</dd></div>
            <div><dt className="text-sm text-slate-500">Owner</dt><dd className="font-medium">{reservation.internalOwner || "-"}</dd></div>
          </dl>
          {reservation.notes ? <p className="mt-4 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm">{reservation.notes}</p> : null}
        </div>

        {isAdmin ? (
          <div className="card grid gap-4">
            <form action={updateStatus} className="grid gap-2">
              <label className="text-sm font-medium">Approve or change status</label>
              <select name="status" defaultValue={reservation.status}>
                {reservationStatuses.map((status) => (
                  <option key={status} value={status}>{publicStatusLabels[status]}</option>
                ))}
              </select>
              <button type="submit">Update status</button>
            </form>
            <form action={sendEmail} className="grid gap-2">
              <label className="text-sm font-medium">Send email</label>
              <select name="type" defaultValue="confirmation_request">
                <option value="confirmation_request">Confirmation request</option>
                <option value="confirmation">Confirmation</option>
                <option value="cancellation">Cancellation</option>
                <option value="reminder">Reminder</option>
              </select>
              <button type="submit">Send email</button>
            </form>
            <form action={deleteReservationAction.bind(null, id)} className="border-t border-slate-200 pt-4">
              <button type="submit" className="w-full border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
                Delete reservation
              </button>
              <p className="mt-2 text-xs text-slate-500">This removes it from the active calendar by marking it cancelled and keeps the audit trail.</p>
            </form>
          </div>
        ) : (
          <div className="card">
            <h2 className="font-semibold">Request status</h2>
            <p className="mt-2 text-sm text-slate-500">An admin will review pending Bay House requests.</p>
          </div>
        )}
      </section>

      {isAdmin ? <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-3 font-semibold">Email activity</h2>
          <div className="grid gap-3">
            {reservation.emails.map((email) => (
              <div key={email.id} className="rounded-md border border-slate-100 p-3">
                <div className="flex items-center justify-between gap-3">
                  <strong>{email.subject}</strong>
                  <span className="text-xs text-slate-500">{email.deliveryStatus} · {email.replyStatus}</span>
                </div>
                <p className="text-sm text-slate-500">{email.recipientEmail} · {email.sentAt ? format(email.sentAt, "PPp") : "Not sent"}</p>
              </div>
            ))}
            {!reservation.emails.length ? <p className="text-sm text-slate-500">No emails yet.</p> : null}
          </div>
        </div>

        <div className="card">
          <h2 className="mb-3 font-semibold">Activity timeline</h2>
          <div className="grid gap-3">
            {reservation.history.map((event) => (
              <div key={event.id} className="border-l-2 border-bay-100 pl-3">
                <p className="text-sm font-semibold">{event.changeType.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-500">{format(event.changedAt, "PPp")} {event.user ? `· ${event.user.name}` : ""}</p>
                {event.fieldName ? <p className="text-sm text-slate-600">{event.fieldName}: {event.oldValue || "-"} → {event.newValue || "-"}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section> : null}

      {isAdmin && reservation.inboundReplies.length ? (
        <section className="card">
          <h2 className="mb-3 font-semibold">Inbound replies</h2>
          <div className="grid gap-3">
            {reservation.inboundReplies.map((reply) => (
              <div key={reply.id} className="rounded-md border border-slate-100 p-3">
                <p className="text-sm font-semibold">{reply.fromEmail} · {reply.classification}</p>
                <div className="prose prose-sm mt-2 max-w-none" dangerouslySetInnerHTML={{ __html: reply.sanitizedBody }} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
