import { Router } from 'express'
import { z } from 'zod'

import { asyncHandler, parseOrThrow } from '../../server/http'
import { tenantIdParamSchema } from '../../lib/validation/common'
import { prisma } from '../../lib/db/prisma'
import { ensureExists } from '../../server/utils'
import { runV2momPipelineByTenantName } from './executor'

const tenantExecutionBodySchema = z.object({
  tenantName: z.string().trim().min(1).optional(),
})

export const v2momPipelineRouter = Router()

v2momPipelineRouter.post(
  '/tenants/:tenantId/v2mom/generate',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(tenantExecutionBodySchema, request.body ?? {})

    const tenant = ensureExists(
      await prisma.tenant.findUnique({ where: { id: tenantId } }),
      'Tenant not found',
    )

    const result = await runV2momPipelineByTenantName(body.tenantName ?? tenant.name)
    response.json(result)
  }),
)
