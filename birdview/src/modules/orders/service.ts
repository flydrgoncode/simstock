import { prisma } from '../../lib/db/prisma'
import { AppError } from '../../server/http'
import { ensureExists } from '../../server/utils'
import { createAuditLog } from '../shared/audit'
import { serializeOrder } from '../shared/serializers'

async function ensureCustomerInTenant(tenantId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
  })

  if (!customer) {
    throw new AppError(400, 'Order customer must belong to the same tenant')
  }
}

export async function listOrders(tenantId: string) {
  const orders = await prisma.order.findMany({
    where: { tenantId },
    include: { customer: true },
    orderBy: [{ orderDate: 'desc' }, { createdAt: 'desc' }],
  })

  return orders.map(serializeOrder)
}

export async function createOrder(
  tenantId: string,
  data: {
    customerId: string
    orderNumber: string | null
    orderDate: Date
    amount: number
    status: 'DRAFT' | 'BOOKED' | 'INVOICED' | 'CANCELLED'
    productLine: string | null
    notes: string | null
  }
) {
  await ensureCustomerInTenant(tenantId, data.customerId)

  const order = await prisma.order.create({
    data: { tenantId, ...data },
    include: { customer: true },
  })

  await createAuditLog({
    tenantId,
    entityType: 'Order',
    entityId: order.id,
    action: 'created',
    payloadJson: { orderNumber: order.orderNumber },
  })

  return serializeOrder(order)
}

export async function updateOrder(
  id: string,
  data: Partial<{
    customerId: string
    orderNumber: string | null
    orderDate: Date
    amount: number
    status: 'DRAFT' | 'BOOKED' | 'INVOICED' | 'CANCELLED'
    productLine: string | null
    notes: string | null
  }>
) {
  const existing = ensureExists(
    await prisma.order.findUnique({ where: { id } }),
    'Order not found'
  )

  if (data.customerId) {
    await ensureCustomerInTenant(existing.tenantId, data.customerId)
  }

  const order = await prisma.order.update({
    where: { id },
    data,
    include: { customer: true },
  })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'Order',
    entityId: id,
    action: 'updated',
    payloadJson: data,
  })

  return serializeOrder(order)
}

export async function deleteOrder(id: string) {
  const existing = ensureExists(
    await prisma.order.findUnique({ where: { id } }),
    'Order not found'
  )

  await prisma.order.delete({ where: { id } })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'Order',
    entityId: id,
    action: 'deleted',
  })
}
