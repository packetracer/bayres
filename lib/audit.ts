import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export async function recordAuditEvent(input: {
  actorId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.auditEvent.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId ?? null,
      summary: input.summary,
      metadata: input.metadata
    }
  });
}
