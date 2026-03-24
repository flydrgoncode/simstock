import { prisma } from '../../lib/db/prisma'
import { ensureExists } from '../../server/utils'
import { createAuditLog } from '../shared/audit'
import { serializeRevenueSnapshot } from '../shared/serializers'

export async function listRevenueSnapshots(tenantId: string) {
  const snapshots = await prisma.revenueSnapshot.findMany({
    where: { tenantId },
    orderBy: { month: 'asc' },
  })

  return snapshots.map(serializeRevenueSnapshot)
}

export async function createRevenueSnapshot(
  tenantId: string,
  data: {
    month: Date
    actualRevenue: number
    forecastRevenue: number
    targetRevenue: number
    notes: string | null
  }
) {
  const snapshot = await prisma.revenueSnapshot.create({
    data: { tenantId, ...data },
  })

  await createAuditLog({
    tenantId,
    entityType: 'RevenueSnapshot',
    entityId: snapshot.id,
    action: 'created',
    payloadJson: { month: snapshot.month.toISOString() },
  })

  return serializeRevenueSnapshot(snapshot)
}

export async function updateRevenueSnapshot(
  id: string,
  data: Partial<{
    month: Date
    actualRevenue: number
    forecastRevenue: number
    targetRevenue: number
    notes: string | null
  }>
) {
  const existing = ensureExists(
    await prisma.revenueSnapshot.findUnique({ where: { id } }),
    'Revenue snapshot not found'
  )

  const snapshot = await prisma.revenueSnapshot.update({
    where: { id },
    data,
  })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'RevenueSnapshot',
    entityId: id,
    action: 'updated',
    payloadJson: data,
  })

  return serializeRevenueSnapshot(snapshot)
}

export async function deleteRevenueSnapshot(id: string) {
  const existing = ensureExists(
    await prisma.revenueSnapshot.findUnique({ where: { id } }),
    'Revenue snapshot not found'
  )

  await prisma.revenueSnapshot.delete({ where: { id } })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'RevenueSnapshot',
    entityId: id,
    action: 'deleted',
  })
}
