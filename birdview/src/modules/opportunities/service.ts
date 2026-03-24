import { prisma } from '../../lib/db/prisma'
import { AppError } from '../../server/http'
import { ensureExists } from '../../server/utils'
import { createAuditLog } from '../shared/audit'
import { serializeOpportunity } from '../shared/serializers'

async function ensureCustomerInTenant(
  tenantId: string,
  customerId: string | null
) {
  if (!customerId) {
    return
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, tenantId },
  })
  if (!customer) {
    throw new AppError(
      400,
      'Referenced customer must belong to the same tenant'
    )
  }
}

async function ensurePersonInTenant(tenantId: string, personId: string | null) {
  if (!personId) {
    return
  }

  const person = await prisma.person.findFirst({
    where: { id: personId, tenantId },
  })
  if (!person) {
    throw new AppError(400, 'Referenced person must belong to the same tenant')
  }
}

async function ensureStageInTenant(tenantId: string, stageId: string) {
  const stage = await prisma.salesStage.findFirst({
    where: { id: stageId, tenantId },
  })
  if (!stage) {
    throw new AppError(
      400,
      'Referenced sales stage must belong to the same tenant'
    )
  }
}

export async function listSalesStages(tenantId: string) {
  return prisma.salesStage.findMany({
    where: { tenantId },
    orderBy: { stageOrder: 'asc' },
  })
}

export async function createSalesStage(
  tenantId: string,
  data: {
    name: string
    stageOrder: number
    defaultProbability: number | null
    isClosedWon: boolean
    isClosedLost: boolean
  }
) {
  const stage = await prisma.salesStage.create({ data: { tenantId, ...data } })

  await createAuditLog({
    tenantId,
    entityType: 'SalesStage',
    entityId: stage.id,
    action: 'created',
    payloadJson: { name: stage.name, stageOrder: stage.stageOrder },
  })

  return stage
}

export async function updateSalesStage(
  id: string,
  data: Partial<{
    name: string
    stageOrder: number
    defaultProbability: number | null
    isClosedWon: boolean
    isClosedLost: boolean
  }>
) {
  const existing = ensureExists(
    await prisma.salesStage.findUnique({ where: { id } }),
    'Sales stage not found'
  )

  const stage = await prisma.salesStage.update({ where: { id }, data })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'SalesStage',
    entityId: id,
    action: 'updated',
    payloadJson: data,
  })

  return stage
}

export async function deleteSalesStage(id: string) {
  const existing = ensureExists(
    await prisma.salesStage.findUnique({ where: { id } }),
    'Sales stage not found'
  )

  await prisma.salesStage.delete({ where: { id } })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'SalesStage',
    entityId: id,
    action: 'deleted',
  })
}

export async function listOpportunities(tenantId: string) {
  const opportunities = await prisma.opportunity.findMany({
    where: { tenantId },
    include: {
      customer: true,
      owner: true,
      stage: true,
    },
    orderBy: [{ updatedAt: 'desc' }],
  })

  return opportunities.map(serializeOpportunity)
}

export async function createOpportunity(
  tenantId: string,
  data: {
    customerId: string | null
    ownerId: string | null
    name: string
    stageId: string
    amount: number
    probability: number
    expectedCloseDate: Date | null
    source: string | null
    status: 'OPEN' | 'WON' | 'LOST'
  }
) {
  await ensureCustomerInTenant(tenantId, data.customerId)
  await ensurePersonInTenant(tenantId, data.ownerId)
  await ensureStageInTenant(tenantId, data.stageId)

  const opportunity = await prisma.opportunity.create({
    data: { tenantId, ...data },
    include: { customer: true, owner: true, stage: true },
  })

  await createAuditLog({
    tenantId,
    entityType: 'Opportunity',
    entityId: opportunity.id,
    action: 'created',
    payloadJson: { name: opportunity.name },
  })

  return serializeOpportunity(opportunity)
}

export async function updateOpportunity(
  id: string,
  data: Partial<{
    customerId: string | null
    ownerId: string | null
    name: string
    stageId: string
    amount: number
    probability: number
    expectedCloseDate: Date | null
    source: string | null
    status: 'OPEN' | 'WON' | 'LOST'
  }>
) {
  const existing = ensureExists(
    await prisma.opportunity.findUnique({ where: { id } }),
    'Opportunity not found'
  )

  if ('customerId' in data) {
    await ensureCustomerInTenant(existing.tenantId, data.customerId ?? null)
  }
  if ('ownerId' in data) {
    await ensurePersonInTenant(existing.tenantId, data.ownerId ?? null)
  }
  if (data.stageId) {
    await ensureStageInTenant(existing.tenantId, data.stageId)
  }

  const opportunity = await prisma.opportunity.update({
    where: { id },
    data,
    include: { customer: true, owner: true, stage: true },
  })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'Opportunity',
    entityId: id,
    action: 'updated',
    payloadJson: data,
  })

  return serializeOpportunity(opportunity)
}

export async function deleteOpportunity(id: string) {
  const existing = ensureExists(
    await prisma.opportunity.findUnique({ where: { id } }),
    'Opportunity not found'
  )

  await prisma.opportunity.delete({ where: { id } })

  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'Opportunity',
    entityId: id,
    action: 'deleted',
  })
}

export async function listOpportunityStageEvents(tenantId: string) {
  return prisma.opportunityStageEvent.findMany({
    where: { tenantId },
    include: {
      opportunity: true,
      fromStage: true,
      toStage: true,
      changedBy: true,
    },
    orderBy: [{ eventDate: 'desc' }, { createdAt: 'desc' }],
  })
}

export async function createOpportunityStageEvent(
  tenantId: string,
  data: {
    opportunityId: string
    fromStageId: string | null
    toStageId: string
    eventDate: Date
    changedById: string | null
  }
) {
  const opportunity = await prisma.opportunity.findFirst({
    where: { id: data.opportunityId, tenantId },
  })

  if (!opportunity) {
    throw new AppError(
      400,
      'Referenced opportunity must belong to the same tenant'
    )
  }

  if (data.fromStageId) {
    await ensureStageInTenant(tenantId, data.fromStageId)
  }
  await ensureStageInTenant(tenantId, data.toStageId)
  await ensurePersonInTenant(tenantId, data.changedById)

  const event = await prisma.opportunityStageEvent.create({
    data: { tenantId, ...data },
    include: {
      opportunity: true,
      fromStage: true,
      toStage: true,
      changedBy: true,
    },
  })

  await createAuditLog({
    tenantId,
    entityType: 'OpportunityStageEvent',
    entityId: event.id,
    action: 'created',
    payloadJson: {
      opportunityId: event.opportunityId,
      fromStageId: event.fromStageId,
      toStageId: event.toStageId,
    },
  })

  return event
}
