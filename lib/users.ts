import bcrypt from "bcryptjs";
import type { UserRole } from "@prisma/client";
import { prisma } from "./prisma";

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}) {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(input.password, 12),
      role: input.role
    }
  });
}

export async function setUserRole(userId: string, role: UserRole) {
  return prisma.user.update({
    where: { id: userId },
    data: { role }
  });
}
