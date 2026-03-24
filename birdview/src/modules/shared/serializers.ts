import type {
  Customer,
  HeadcountSnapshot,
  Opportunity,
  Order,
  Person,
  RevenueSnapshot,
  SalesStage,
} from '@prisma/client'

import { asNumber } from '../../server/utils'

export function serializeRevenueSnapshot(item: RevenueSnapshot) {
  return {
    ...item,
    month: item.month.toISOString(),
    actualRevenue: asNumber(item.actualRevenue),
    forecastRevenue: asNumber(item.forecastRevenue),
    targetRevenue: asNumber(item.targetRevenue),
  }
}

export function serializeHeadcountSnapshot(item: HeadcountSnapshot) {
  return {
    ...item,
    month: item.month.toISOString(),
  }
}

export function serializeOrder(
  item: Order & {
    customer?: Customer | null
  }
) {
  return {
    ...item,
    orderDate: item.orderDate.toISOString(),
    amount: asNumber(item.amount),
    customer: item.customer,
  }
}

export function serializeOpportunity(
  item: Opportunity & {
    customer?: Customer | null
    owner?: Person | null
    stage?: SalesStage | null
  }
) {
  return {
    ...item,
    amount: asNumber(item.amount),
    expectedCloseDate: item.expectedCloseDate?.toISOString() ?? null,
    customer: item.customer,
    owner: item.owner,
    stage: item.stage,
  }
}
