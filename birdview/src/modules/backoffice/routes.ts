import { Router } from 'express'

import { tenantIdParamSchema } from '../../lib/validation/common'
import { prisma } from '../../lib/db/prisma'
import { asyncHandler, parseOrThrow } from '../../server/http'
import {
  getCustomerAnalytics,
  getPipelineAnalytics,
  getRevenueAnalytics,
} from './analytics'
import {
  resetTenantDemoData,
  seedPlatformCatalog,
  seedTenantDemoData,
} from './demo'

export const backofficeRouter = Router()

backofficeRouter.get(
  '/tenants/:tenantId/mission-home/context',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const [tenant, shell, company, activeDropletCount] = await Promise.all([
      prisma.tenant.findUnique({ where: { id: tenantId } }),
      prisma.tenantShell.findFirst({
        where: { tenantId, status: 'ACTIVE' },
        include: { vertical: true, verticalDefinition: true },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.company.findUnique({
        where: { tenantId },
        include: { vertical: true },
      }),
      prisma.tenantDropletAssignment.count({
        where: { tenantId, active: true },
      }),
    ])

    const catalogDropletCount = shell
      ? await prisma.verticalDroplet.count({
          where: {
            verticalId: shell.verticalId,
            status: 'PUBLISHED',
          },
        })
      : 0

    response.json({
      tenant,
      shell,
      company,
      activeDropletCount,
      catalogDropletCount,
    })
  })
)

backofficeRouter.get(
  '/tenants/:tenantId/analytics/mission-home-overview',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const [auditLogs, activeUsers, activePeople] = await Promise.all([
      prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.user.count({
        where: {
          companyMemberships: {
            some: {
              company: { tenantId },
              status: 'ACTIVE',
            },
          },
        },
      }),
      prisma.person.count({
        where: {
          tenantId,
          active: true,
        },
      }),
    ])

    const actionsByType = auditLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.action] = (acc[log.action] ?? 0) + 1
      return acc
    }, {})

    const actionsByEntity = auditLogs.reduce<Record<string, number>>((acc, log) => {
      acc[log.entityType] = (acc[log.entityType] ?? 0) + 1
      return acc
    }, {})

    response.json({
      totalUserActions: auditLogs.length,
      activeUsers,
      activePeople,
      actionsByType,
      actionsByEntity,
      recentActions: auditLogs.slice(0, 8).map((log) => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        createdAt: log.createdAt,
      })),
    })
  })
)

backofficeRouter.get(
  '/tenants/:tenantId/analytics/revenue-summary',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getRevenueAnalytics(tenantId))
  })
)

backofficeRouter.get(
  '/tenants/:tenantId/analytics/pipeline-summary',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getPipelineAnalytics(tenantId))
  })
)

backofficeRouter.get(
  '/tenants/:tenantId/analytics/customer-summary',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getCustomerAnalytics(tenantId))
  })
)

backofficeRouter.post(
  '/tenants/:tenantId/demo/seed',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    await seedPlatformCatalog(prisma)
    await seedTenantDemoData(prisma, tenantId)
    response.json({ ok: true })
  })
)

backofficeRouter.post(
  '/tenants/:tenantId/demo/reset',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    await resetTenantDemoData(prisma, tenantId)
    response.json({ ok: true })
  })
)
