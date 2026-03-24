import { prisma } from '../../lib/db/prisma'
import {
  getDefaultDropletFields,
  getDropletEntityConfig,
  getDropletFieldKeys,
  type DropletEntity,
  type DropletFilterOperator,
} from '../../lib/droplets/entities'
import { getDropletFieldLabel } from '../../lib/droplets/format'
import type { ReadonlyTableDropletDefinition } from '../../lib/droplets/schema'
import { AppError } from '../../server/http'

type ExploreRow = Record<string, string | number | boolean | null>

type ExploreRequest = {
  entity: DropletEntity
  fields?: string[]
  filters?: Array<{
    field: string
    operator: DropletFilterOperator
    value: string | number | boolean
  }>
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  grouping?: {
    field: string
  }
  labels?: Record<string, string>
  summary?: {
    enabled: boolean
    fields?: string[]
  }
  limit?: number
}

function assertAllowedFields(entity: DropletEntity, fields: string[]) {
  const allowed = new Set(getDropletFieldKeys(entity))
  const invalid = fields.filter((field) => !allowed.has(field))
  if (invalid.length > 0) {
    throw new AppError(
      400,
      `Unsupported fields for ${entity}: ${invalid.join(', ')}`
    )
  }
}

function compareValues(left: unknown, right: unknown) {
  if (left == null && right == null) return 0
  if (left == null) return -1
  if (right == null) return 1
  if (typeof left === 'number' && typeof right === 'number') return left - right
  if (typeof left === 'boolean' && typeof right === 'boolean')
    return Number(left) - Number(right)
  return String(left).localeCompare(String(right))
}

function matchesFilter(
  value: unknown,
  operator: DropletFilterOperator,
  filterValue: string | number | boolean
) {
  switch (operator) {
    case 'eq':
      return value === filterValue
    case 'neq':
      return value !== filterValue
    case 'gt':
      return compareValues(value, filterValue) > 0
    case 'gte':
      return compareValues(value, filterValue) >= 0
    case 'lt':
      return compareValues(value, filterValue) < 0
    case 'lte':
      return compareValues(value, filterValue) <= 0
    case 'contains':
      return String(value ?? '')
        .toLowerCase()
        .includes(String(filterValue).toLowerCase())
    case 'in':
      return String(filterValue)
        .split(',')
        .map((part) => part.trim())
        .includes(String(value))
  }
}

async function getEntityRows(
  tenantId: string,
  entity: DropletEntity
): Promise<ExploreRow[]> {
  const company = await prisma.company.findUnique({
    where: { tenantId },
  })

  if (entity === 'revenueSnapshots') {
    const rows = await prisma.revenueSnapshot.findMany({
      where: company ? { companyId: company.id } : { tenantId },
      orderBy: { month: 'asc' },
    })
    return rows.map((row) => ({
      month: row.month.toISOString().slice(0, 10),
      actualRevenue: Number(row.actualRevenue),
      forecastRevenue: Number(row.forecastRevenue),
      targetRevenue: Number(row.targetRevenue),
      notes: row.notes,
    }))
  }

  if (entity === 'headcountSnapshots') {
    const rows = await prisma.headcountSnapshot.findMany({
      where: company ? { companyId: company.id } : { tenantId },
      orderBy: { month: 'asc' },
    })
    return rows.map((row) => ({
      month: row.month.toISOString().slice(0, 10),
      actualHeadcount: row.actualHeadcount,
      forecastHeadcount: row.forecastHeadcount,
      targetHeadcount: row.targetHeadcount,
      notes: row.notes,
    }))
  }

  if (entity === 'customers') {
    if (company) {
      const rows = await prisma.account.findMany({
        where: {
          companyId: company.id,
          type: 'CUSTOMER',
        },
        include: { ownerPerson: true },
        orderBy: { name: 'asc' },
      })

      if (rows.length > 0) {
        return rows.map((row) => ({
          name: row.name,
          segment: row.segment,
          geography: row.geography,
          industry: row.industry,
          status: row.status,
          ownerName: row.ownerPerson?.name ?? null,
        }))
      }
    }

    const rows = await prisma.customer.findMany({
      where: { tenantId },
      include: { owner: true },
      orderBy: { name: 'asc' },
    })
    return rows.map((row) => ({
      name: row.name,
      segment: row.segment,
      geography: row.geography,
      industry: row.industry,
      status: row.status,
      ownerName: row.owner?.name ?? null,
    }))
  }

  if (entity === 'orders') {
    if (company) {
      const rows = await prisma.salesOrder.findMany({
        where: { companyId: company.id },
        include: { account: true },
        orderBy: { orderDate: 'desc' },
      })

      if (rows.length > 0) {
        return rows.map((row) => ({
          orderDate: row.orderDate.toISOString().slice(0, 10),
          orderNumber: row.orderNumber,
          customerName: row.account.name,
          amount: Number(row.totalAmount),
          status: row.status,
          productLine: null,
          notes: null,
        }))
      }
    }

    const rows = await prisma.order.findMany({
      where: { tenantId },
      include: { customer: true },
      orderBy: { orderDate: 'desc' },
    })
    return rows.map((row) => ({
      orderDate: row.orderDate.toISOString().slice(0, 10),
      orderNumber: row.orderNumber,
      customerName: row.customer.name,
      amount: Number(row.amount),
      status: row.status,
      productLine: row.productLine,
      notes: row.notes,
    }))
  }

  if (entity === 'opportunities') {
    const rows = await prisma.opportunity.findMany({
      where: company ? { companyId: company.id } : { tenantId },
      include: { customer: true, owner: true, stage: true, account: true, primaryContact: true },
      orderBy: { updatedAt: 'desc' },
    })
    return rows.map((row) => ({
      name: row.name,
      customerName: row.account?.name ?? row.customer?.name ?? null,
      stageName: row.stage.name,
      ownerName: row.owner?.name ?? null,
      amount: Number(row.amount),
      probability: row.probability,
      expectedCloseDate:
        row.expectedCloseDate?.toISOString().slice(0, 10) ?? null,
      status: row.status,
      source: row.source,
    }))
  }

  if (entity === 'salesStages') {
    if (company) {
      const rows = await prisma.opportunityStage.findMany({
        where: { companyId: company.id },
        orderBy: { stageOrder: 'asc' },
      })

      if (rows.length > 0) {
        return rows.map((row) => ({
          name: row.name,
          stageOrder: row.stageOrder,
          defaultProbability: row.defaultProbability,
          isClosedWon: row.isClosedWon,
          isClosedLost: row.isClosedLost,
        }))
      }
    }

    const rows = await prisma.salesStage.findMany({
      where: { tenantId },
      orderBy: { stageOrder: 'asc' },
    })
    return rows.map((row) => ({
      name: row.name,
      stageOrder: row.stageOrder,
      defaultProbability: row.defaultProbability,
      isClosedWon: row.isClosedWon,
      isClosedLost: row.isClosedLost,
    }))
  }

  const rows = await prisma.opportunityStageEvent.findMany({
    where: company ? { companyId: company.id } : { tenantId },
    include: {
      opportunity: true,
      fromStage: true,
      toStage: true,
      changedBy: true,
    },
    orderBy: { eventDate: 'desc' },
  })
  return rows.map((row) => ({
    eventDate: row.eventDate.toISOString().slice(0, 10),
    opportunityName: row.opportunity.name,
    fromStageName: row.fromStage?.name ?? null,
    toStageName: row.toStage.name,
    changedByName: row.changedBy?.name ?? null,
  }))
}

function buildSummary(rows: ExploreRow[], fields: string[]) {
  const summary: Record<string, number> = {}
  for (const field of fields) {
    const values = rows
      .map((row) => row[field])
      .filter((value): value is number => typeof value === 'number')
    if (values.length > 0) {
      summary[field] = values.reduce((sum, value) => sum + value, 0)
    }
  }
  return summary
}

export async function executeExploreRequest(
  tenantId: string,
  request: ExploreRequest
) {
  const config = getDropletEntityConfig(request.entity)
  const fields =
    request.fields && request.fields.length > 0
      ? request.fields
      : getDefaultDropletFields(request.entity)
  assertAllowedFields(request.entity, fields)

  if (request.sort) {
    assertAllowedFields(request.entity, [request.sort.field])
  }
  if (request.grouping) {
    assertAllowedFields(request.entity, [request.grouping.field])
  }
  if (request.filters) {
    assertAllowedFields(
      request.entity,
      request.filters.map((filter) => filter.field)
    )
  }

  let rows = await getEntityRows(tenantId, request.entity)

  if (request.filters && request.filters.length > 0) {
    rows = rows.filter((row) =>
      request.filters?.every((filter) =>
        matchesFilter(row[filter.field], filter.operator, filter.value)
      )
    )
  }

  if (request.sort) {
    rows = [...rows].sort((left, right) => {
      const result = compareValues(
        left[request.sort!.field],
        right[request.sort!.field]
      )
      return request.sort!.direction === 'asc' ? result : -result
    })
  } else if (config.defaultSort) {
    rows = [...rows].sort((left, right) => {
      const result = compareValues(
        left[config.defaultSort!.field],
        right[config.defaultSort!.field]
      )
      return config.defaultSort!.direction === 'asc' ? result : -result
    })
  }

  const limitedRows = rows
    .slice(0, request.limit ?? 50)
    .map((row) =>
      Object.fromEntries(fields.map((field) => [field, row[field] ?? null]))
    )

  const groupedRows =
    request.grouping?.field != null
      ? Object.entries(
          limitedRows.reduce<Record<string, ExploreRow[]>>(
            (accumulator, row) => {
              const key = String(row[request.grouping!.field] ?? 'Ungrouped')
              accumulator[key] = accumulator[key] ?? []
              accumulator[key].push(row)
              return accumulator
            },
            {}
          )
        ).map(([group, items]) => ({
          group,
          rows: items,
        }))
      : undefined

  const summary =
    request.summary?.enabled === true
      ? buildSummary(limitedRows, request.summary.fields ?? fields)
      : undefined

  return {
    entity: request.entity,
    title: config.label,
    visibleFields: fields,
    labels: Object.fromEntries(
      fields.map((field) => [
        field,
        request.labels?.[field] ?? getDropletFieldLabel(request.entity, field),
      ])
    ),
    rows: limitedRows,
    grouping: groupedRows,
    summary,
    totalRows: rows.length,
  }
}

export async function previewDropletDefinition(
  tenantId: string,
  definition: ReadonlyTableDropletDefinition
) {
  const summary = definition.summary
    ? {
        enabled: definition.summary.enabled,
        ...(definition.summary.fields
          ? { fields: definition.summary.fields }
          : {}),
      }
    : undefined

  return executeExploreRequest(tenantId, {
    entity: definition.entity,
    ...(definition.fields ? { fields: definition.fields } : {}),
    ...(definition.defaultFilter ? { filters: definition.defaultFilter } : {}),
    ...(definition.defaultSort ? { sort: definition.defaultSort } : {}),
    ...(definition.grouping ? { grouping: definition.grouping } : {}),
    ...(definition.labels ? { labels: definition.labels } : {}),
    ...(summary ? { summary } : {}),
    limit: 50,
  })
}
