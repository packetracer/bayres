import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { prisma } from "./prisma";

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  approvedAt?: Date | null;
}) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role,
      approvedAt: input.approvedAt ?? null
    }
  });
}

export async function setUserRole(userId: string, role: UserRole) {
  return prisma.user.update({
    where: { id: userId },
    data: { role, approvedAt: role === "admin" ? new Date() : undefined }
  });
}

export async function approveUser(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { approvedAt: new Date() }
  });
}
