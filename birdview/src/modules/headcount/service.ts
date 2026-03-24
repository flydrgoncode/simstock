import { prisma } from '../../lib/db/prisma'
import { ensureExists } from '../../server/utils'
import { createAuditLog } from '../shared/audit'
import { serializeHeadcountSnapshot } from '../shared/serializers'

export async function listHeadcountSnapshots(tenantId: string) {
  const snapshots = await prisma.headcountSnapshot.findMany({
    where: { tenantId },
    orderBy: { month: 'asc' },
  })

  return snapshots.map(serializeHeadcountSnapshot)
}

export async function createHeadcountSnapshot(
  tenantId: string,
  data: {
    month: Date
    actualHeadcount: number
    forecastHeadcount: number
    targetHeadcount: number
    notes: string | null
  }
) {
  const snapshot = await prisma.headcountSnapshot.create({
    data: { tenantId, ...data },
  })

  await createAuditLog({
    tenantId,
    entityType: 'HeadcountSnapshot',
    entityId: snapshot.id,
    action: 'created',
    payloadJson: { month: snapshot.month.toISOString() },
  })

  return serializeHeadcountSnapshot(snapshot)
}

export async function updateHeadcountSnapshot(
  id: string,
  data: Partial<{
    month: Date
    actualHeadcount: number
    forecastHeadcount: number
    targetHeadcount: number
    notes: string | null
  }>
) {
  const existing = ensureExists(
    await prisma.headcountSnapshot.findUnique({ where: { id } }),
    'Headcount snapshot not found'
  )

  const snapshot = await prisma.headcountSnapshot.update({
    where: { id },
    data,
  })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'HeadcountSnapshot',
    entityId: id,
    action: 'updated',
    payloadJson: data,
  })

  return serializeHeadcountSnapshot(snapshot)
}

export async function deleteHeadcountSnapshot(id: string) {
  const existing = ensureExists(
    await prisma.headcountSnapshot.findUnique({ where: { id } }),
    'Headcount snapshot not found'
  )

  await prisma.headcountSnapshot.delete({ where: { id } })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'HeadcountSnapshot',
    entityId: id,
    action: 'deleted',
  })
}
