import { prisma } from '../../lib/db/prisma'
import { asNumber } from '../../server/utils'

export async function getRevenueAnalytics(tenantId: string) {
  const [revenue, headcount] = await Promise.all([
    prisma.revenueSnapshot.findMany({
      where: { tenantId },
      orderBy: { month: 'asc' },
    }),
    prisma.headcountSnapshot.findMany({
      where: { tenantId },
      orderBy: { month: 'asc' },
    }),
  ])

  return {
    revenueByMonth: revenue.map((item) => ({
      month: item.month.toISOString().slice(0, 7),
      actualRevenue: asNumber(item.actualRevenue),
      forecastRevenue: asNumber(item.forecastRevenue),
      targetRevenue: asNumber(item.targetRevenue),
      notes: item.notes,
    })),
    headcountByMonth: headcount.map((item) => ({
      month: item.month.toISOString().slice(0, 7),
      actualHeadcount: item.actualHeadcount,
      forecastHeadcount: item.forecastHeadcount,
      targetHeadcount: item.targetHeadcount,
      notes: item.notes,
    })),
  }
}

export async function getCustomerAnalytics(tenantId: string) {
  const [customers, orders] = await Promise.all([
    prisma.customer.findMany({
      where: { tenantId },
      include: {
        owner: true,
        _count: {
          select: { orders: true, opportunities: true },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.order.findMany({
      where: { tenantId },
      include: { customer: true },
    }),
  ])

  const revenueByCustomer = orders.reduce<Record<string, number>>(
    (accumulator, order) => {
      const key = order.customerId
      accumulator[key] = (accumulator[key] ?? 0) + Number(order.amount)
      return accumulator
    },
    {}
  )

  return {
    customers: customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      status: customer.status,
      segment: customer.segment,
      geography: customer.geography,
      industry: customer.industry,
      owner: customer.owner?.name ?? null,
      ordersCount: customer._count.orders,
      opportunitiesCount: customer._count.opportunities,
      revenue: revenueByCustomer[customer.id] ?? 0,
    })),
    ordersByCustomer: customers.map((customer) => ({
      customerId: customer.id,
      customerName: customer.name,
      ordersCount: customer._count.orders,
    })),
    revenueByCustomer: customers.map((customer) => ({
      customerId: customer.id,
      customerName: customer.name,
      revenue: revenueByCustomer[customer.id] ?? 0,
    })),
  }
}

export async function getPipelineAnalytics(tenantId: string) {
  const [stages, opportunities, stageEvents] = await Promise.all([
    prisma.salesStage.findMany({
      where: { tenantId },
      orderBy: { stageOrder: 'asc' },
    }),
    prisma.opportunity.findMany({
      where: { tenantId },
      include: { stage: true, customer: true, owner: true },
    }),
    prisma.opportunityStageEvent.findMany({
      where: { tenantId },
      include: {
        opportunity: true,
        fromStage: true,
        toStage: true,
      },
      orderBy: { eventDate: 'asc' },
    }),
  ])

  const opportunitiesByStage = stages.map((stage) => {
    const stageOpportunities = opportunities.filter(
      (opportunity) => opportunity.stageId === stage.id
    )
    return {
      stageId: stage.id,
      stageName: stage.name,
      stageOrder: stage.stageOrder,
      count: stageOpportunities.length,
      totalAmount: stageOpportunities.reduce(
        (sum, opportunity) => sum + Number(opportunity.amount),
        0
      ),
      weightedAmount: stageOpportunities.reduce(
        (sum, opportunity) =>
          sum + Number(opportunity.amount) * (opportunity.probability / 100),
        0
      ),
    }
  })

  const weightedPipeline = opportunities.reduce(
    (sum, opportunity) =>
      sum + Number(opportunity.amount) * (opportunity.probability / 100),
    0
  )

  const stageMovement = stageEvents.map((event) => ({
    id: event.id,
    opportunityId: event.opportunityId,
    opportunityName: event.opportunity.name,
    fromStage: event.fromStage?.name ?? null,
    toStage: event.toStage.name,
    eventDate: event.eventDate,
  }))

  const averageTimeInStage = stages.map((stage) => {
    const durations = stageEvents
      .filter((event) => event.fromStageId === stage.id)
      .map((event, index, allEvents) => {
        const nextEvent = allEvents[index + 1]
        if (!nextEvent) {
          return null
        }

        const durationMs =
          nextEvent.eventDate.getTime() - event.eventDate.getTime()
        return durationMs > 0 ? durationMs / (1000 * 60 * 60 * 24) : null
      })
      .filter((value): value is number => value !== null)

    const averageDays =
      durations.length > 0
        ? durations.reduce((sum, value) => sum + value, 0) / durations.length
        : null

    return {
      stageId: stage.id,
      stageName: stage.name,
      averageDays,
    }
  })

  return {
    opportunitiesByStage,
    weightedPipeline,
    salesCycleMovement: stageMovement,
    averageTimeInStage,
    openOpportunities: opportunities
      .filter((opportunity) => opportunity.status === 'OPEN')
      .map((opportunity) => ({
        id: opportunity.id,
        name: opportunity.name,
        amount: Number(opportunity.amount),
        probability: opportunity.probability,
        stage: opportunity.stage.name,
        customer: opportunity.customer?.name ?? null,
        owner: opportunity.owner?.name ?? null,
      })),
  }
}
