import type { ReservationStatus } from "@prisma/client";
import { publicStatusLabels } from "@/lib/status";
import clsx from "clsx";

const tones: Record<ReservationStatus, string> = {
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  declined: "bg-red-50 text-red-800 ring-red-200",
  cancelled: "bg-slate-100 text-slate-700 ring-slate-200",
  completed: "bg-blue-50 text-blue-800 ring-blue-200",
  no_show: "bg-orange-50 text-orange-800 ring-orange-200",
  confirmed_pending_review: "bg-teal-50 text-teal-800 ring-teal-200",
  declined_pending_review: "bg-rose-50 text-rose-800 ring-rose-200"
};

export function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span className={clsx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", tones[status])}>
      {publicStatusLabels[status]}
    </span>
  );
}
