import type { ReservationStatus } from "@prisma/client";

export const reservationStatuses: ReservationStatus[] = [
  "pending",
  "confirmed",
  "declined",
  "cancelled",
  "completed",
  "no_show",
  "confirmed_pending_review",
  "declined_pending_review"
];

export const publicStatusLabels: Record<ReservationStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
  completed: "Completed",
  no_show: "No Show",
  confirmed_pending_review: "Confirmed - Review",
  declined_pending_review: "Declined - Review"
};

export function isTerminalStatus(status: ReservationStatus) {
  return ["declined", "cancelled", "completed", "no_show"].includes(status);
}
