import { prisma } from '../../lib/db/prisma'
import { AppError } from '../../server/http'
import { ensureExists } from '../../server/utils'
import { createAuditLog } from '../shared/audit'

async function ensureOwnerInTenant(
  tenantId: string,
  ownerId: string | null | undefined
) {
  if (!ownerId) {
    return
  }

  const owner = await prisma.person.findFirst({
    where: { id: ownerId, tenantId },
  })

  if (!owner) {
    throw new AppError(400, 'Customer owner must belong to the same tenant')
  }
}

export async function listCustomers(tenantId: string) {
  return prisma.customer.findMany({
    where: { tenantId },
    include: { owner: true },
    orderBy: { name: 'asc' },
  })
}

export async function createCustomer(
  tenantId: string,
  data: {
    name: string
    segment: string | null
    geography: string | null
    industry: string | null
    status: 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'CHURNED'
    ownerId: string | null
  }
) {
  await ensureOwnerInTenant(tenantId, data.ownerId)

  const customer = await prisma.customer.create({
    data: { tenantId, ...data },
    include: { owner: true },
  })

  await createAuditLog({
    tenantId,
    entityType: 'Customer',
    entityId: customer.id,
    action: 'created',
    payloadJson: { name: customer.name },
  })

  return customer
}

export async function updateCustomer(
  id: string,
  data: Partial<{
    name: string
    segment: string | null
    geography: string | null
    industry: string | null
    status: 'PROSPECT' | 'ACTIVE' | 'INACTIVE' | 'CHURNED'
    ownerId: string | null
  }>
) {
  const existing = ensureExists(
    await prisma.customer.findUnique({ where: { id } }),
    'Customer not found'
  )

  if ('ownerId' in data) {
    await ensureOwnerInTenant(existing.tenantId, data.ownerId)
  }

  const customer = await prisma.customer.update({
    where: { id },
    data,
    include: { owner: true },
  })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'Customer',
    entityId: id,
    action: 'updated',
    payloadJson: data,
  })

  return customer
}

export async function deleteCustomer(id: string) {
  const existing = ensureExists(
    await prisma.customer.findUnique({ where: { id } }),
    'Customer not found'
  )

  await prisma.customer.delete({ where: { id } })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'Customer',
    entityId: id,
    action: 'deleted',
  })
}
