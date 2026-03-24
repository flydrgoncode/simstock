import { PeriodGranularity } from '@prisma/client'

import { prisma } from '../../lib/db/prisma'
import { ensureExists } from '../../server/utils'

export async function getCompanyForTenant(tenantId: string) {
  return ensureExists(
    await prisma.company.findUnique({
      where: { tenantId },
      include: {
        vertical: true,
        tenant: true,
      },
    }),
    'Company not found for tenant'
  )
}

export async function getRuntimeContext(tenantId: string) {
  const [company, shell, activeDropletCount] = await Promise.all([
    getCompanyForTenant(tenantId),
    prisma.tenantShell.findFirst({
      where: { tenantId, status: 'ACTIVE' },
      include: {
        vertical: true,
        verticalDefinition: true,
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.tenantDropletAssignment.count({
      where: { tenantId, active: true },
    }),
  ])

  return {
    tenantId,
    company,
    shell,
    activeDropletCount,
  }
}

export async function listCompanyTimePeriods(
  tenantId: string,
  granularity: PeriodGranularity = PeriodGranularity.MONTH
) {
  const company = await getCompanyForTenant(tenantId)
  return prisma.timePeriod.findMany({
    where: {
      companyId: company.id,
      granularity,
    },
    orderBy: [{ startDate: 'asc' }],
  })
}

export async function getMetricOverview(tenantId: string) {
  const company = await getCompanyForTenant(tenantId)

  const [revenueSnapshots, headcountSnapshots, metricPoints] = await Promise.all([
    prisma.revenueSnapshot.findMany({
      where: { companyId: company.id },
      include: { timePeriod: true },
      orderBy: { month: 'asc' },
      take: 12,
    }),
    prisma.headcountSnapshot.findMany({
      where: { companyId: company.id },
      include: { timePeriod: true },
      orderBy: { month: 'asc' },
      take: 12,
    }),
    prisma.metricPoint.findMany({
      where: { companyId: company.id },
      include: {
        metricSeries: {
          include: { metricDefinition: true },
        },
        timePeriod: true,
      },
      orderBy: [{ createdAt: 'desc' }],
      take: 24,
    }),
  ])

  return {
    companyId: company.id,
    revenueSnapshots,
    headcountSnapshots,
    metricPoints,
  }
}
