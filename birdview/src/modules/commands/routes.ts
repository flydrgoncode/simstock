import { Router } from 'express'

import { tenantIdParamSchema } from '../../lib/validation/common'
import { asyncHandler, parseOrThrow } from '../../server/http'
import {
  executeBirdviewCommand,
  parseBirdviewCommandForTenant,
  resolveBirdviewCommandForTenant,
} from './executor'
import { birdviewCommandBodySchema } from './schemas'

export const commandsRouter = Router()

commandsRouter.post(
  '/tenants/:tenantId/commands/parse',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(birdviewCommandBodySchema, request.body)
    response.json(await parseBirdviewCommandForTenant(tenantId, body.command))
  })
)

commandsRouter.post(
  '/tenants/:tenantId/commands/resolve',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(birdviewCommandBodySchema, request.body)
    response.json(await resolveBirdviewCommandForTenant(tenantId, body.command))
  })
)

commandsRouter.post(
  '/tenants/:tenantId/commands/execute',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(birdviewCommandBodySchema, request.body)
    response.json(await executeBirdviewCommand(tenantId, body.command))
  })
)
