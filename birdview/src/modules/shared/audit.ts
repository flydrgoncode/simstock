import type { Prisma } from '@prisma/client'

import { prisma } from '../../lib/db/prisma'

export async function createAuditLog(entry: {
  tenantId?: string | null
  companyId?: string | null
  actorUserId?: string | null
  entityType: string
  entityId: string
  action: string
  payloadJson?: Prisma.InputJsonValue
}) {
  const data: Prisma.AuditLogUncheckedCreateInput = {
    tenantId: entry.tenantId ?? null,
    companyId: entry.companyId ?? null,
    actorUserId: entry.actorUserId ?? null,
    entityType: entry.entityType,
    entityId: entry.entityId,
    action: entry.action,
  }

  if (entry.payloadJson !== undefined) {
    data.payloadJson = entry.payloadJson
  }

  await prisma.auditLog.create({
    data,
  })
}
