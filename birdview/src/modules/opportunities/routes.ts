import { Router } from 'express'

import { idParamSchema, tenantIdParamSchema } from '../../lib/validation/common'
import { asyncHandler, parseOrThrow, sendNoContent } from '../../server/http'
import {
  opportunityCreateSchema,
  opportunityUpdateSchema,
  salesStageCreateSchema,
  salesStageUpdateSchema,
  stageEventCreateSchema,
} from './schemas'
import {
  createOpportunity,
  createOpportunityStageEvent,
  createSalesStage,
  deleteOpportunity,
  deleteSalesStage,
  listOpportunities,
  listOpportunityStageEvents,
  listSalesStages,
  updateOpportunity,
  updateSalesStage,
} from './service'

export const opportunitiesRouter = Router()

opportunitiesRouter.get(
  '/tenants/:tenantId/stages',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await listSalesStages(tenantId))
  })
)

opportunitiesRouter.post(
  '/tenants/:tenantId/stages',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(salesStageCreateSchema, request.body)
    response.status(201).json(await createSalesStage(tenantId, body))
  })
)

opportunitiesRouter.patch(
  '/stages/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(salesStageUpdateSchema, request.body)
    response.json(await updateSalesStage(id, body))
  })
)

opportunitiesRouter.delete(
  '/stages/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    await deleteSalesStage(id)
    sendNoContent(response)
  })
)

opportunitiesRouter.get(
  '/tenants/:tenantId/opportunities',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await listOpportunities(tenantId))
  })
)

opportunitiesRouter.post(
  '/tenants/:tenantId/opportunities',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(opportunityCreateSchema, request.body)
    response.status(201).json(await createOpportunity(tenantId, body))
  })
)

opportunitiesRouter.patch(
  '/opportunities/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(opportunityUpdateSchema, request.body)
    response.json(await updateOpportunity(id, body))
  })
)

opportunitiesRouter.delete(
  '/opportunities/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    await deleteOpportunity(id)
    sendNoContent(response)
  })
)

opportunitiesRouter.get(
  '/tenants/:tenantId/opportunity-stage-events',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await listOpportunityStageEvents(tenantId))
  })
)

opportunitiesRouter.post(
  '/tenants/:tenantId/opportunity-stage-events',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(stageEventCreateSchema, request.body)
    response.status(201).json(await createOpportunityStageEvent(tenantId, body))
  })
)
