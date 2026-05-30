import bcrypt from "bcryptjs";
import { addDays, setHours, setMinutes } from "date-fns";
import { PrismaClient } from "@prisma/client";
import { createReservation } from "../lib/reservations";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "change-me";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Bayhouse Admin",
      role: "admin",
      passwordHash: await bcrypt.hash(adminPassword, 12)
    }
  });

  const count = await prisma.reservation.count();
  if (count === 0) {
    await createReservation({
      guestName: "Mara Jensen",
      guestEmail: "mara@example.com",
      guestPhone: "555-0101",
      partySize: 4,
      reservationStart: setMinutes(setHours(addDays(new Date(), 2), 18), 30),
      status: "pending",
      notes: "Window table if available.",
      internalOwner: "Host desk",
      createdBy: admin.id
    });
    await createReservation({
      guestName: "Devon Lee",
      guestEmail: "devon@example.com",
      guestPhone: "555-0132",
      partySize: 2,
      reservationStart: setMinutes(setHours(addDays(new Date(), 4), 20), 0),
      status: "confirmed",
      notes: "Anniversary.",
      internalOwner: "Events",
      createdBy: admin.id
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
