import { z } from "zod";
import { reservationStatuses } from "./status";

export const reservationFormSchema = z.object({
  guestName: z.string().min(1, "Guest name is required"),
  guestEmail: z.string().email("A valid guest email is required"),
  guestPhone: z.string().optional(),
  partySize: z.coerce.number().int().min(1).max(50),
  reservationStart: z.string().min(1, "Start date/time is required"),
  reservationEnd: z.string().min(1, "End date/time is required"),
  status: z.enum(reservationStatuses as [string, ...string[]]),
  notes: z.string().optional(),
  internalOwner: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const userRegistrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("A valid email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "viewer"])
});

export const bayHouseReservationSchema = z.object({
  reservationDate: z.string().min(1, "Reservation date is required"),
  partySize: z.coerce.number().int().min(1).max(50),
  notes: z.string().optional()
});

export const inboundReplySchema = z.object({
  from: z.string().email().or(z.string().min(1)),
  subject: z.string().optional(),
  text: z.string().optional(),
  html: z.string().optional(),
  replyToken: z.string().optional(),
  providerMessageId: z.string().optional()
});
