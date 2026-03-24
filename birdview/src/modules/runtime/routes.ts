import { PeriodGranularity } from '@prisma/client'
import { Router } from 'express'

import { tenantIdParamSchema } from '../../lib/validation/common'
import { asyncHandler, parseOrThrow } from '../../server/http'
import {
  getCompanyForTenant,
  getMetricOverview,
  getRuntimeContext,
  listCompanyTimePeriods,
} from './service'

export const runtimeRouter = Router()

runtimeRouter.get(
  '/tenants/:tenantId/company',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getCompanyForTenant(tenantId))
  })
)

runtimeRouter.get(
  '/tenants/:tenantId/runtime-context',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getRuntimeContext(tenantId))
  })
)

runtimeRouter.get(
  '/tenants/:tenantId/time-periods',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const granularity =
      typeof request.query.granularity === 'string'
        ? request.query.granularity.toUpperCase()
        : PeriodGranularity.MONTH

    response.json(
      await listCompanyTimePeriods(
        tenantId,
        (PeriodGranularity as Record<string, PeriodGranularity>)[granularity] ??
          PeriodGranularity.MONTH
      )
    )
  })
)

runtimeRouter.get(
  '/tenants/:tenantId/metrics/overview',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getMetricOverview(tenantId))
  })
)
