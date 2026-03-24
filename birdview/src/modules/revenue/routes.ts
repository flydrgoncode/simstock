import { Router } from 'express'

import { idParamSchema, tenantIdParamSchema } from '../../lib/validation/common'
import { asyncHandler, parseOrThrow, sendNoContent } from '../../server/http'
import {
  createRevenueSnapshot,
  deleteRevenueSnapshot,
  listRevenueSnapshots,
  updateRevenueSnapshot,
} from './service'
import { revenueCreateSchema, revenueUpdateSchema } from './schemas'

export const revenueRouter = Router()

revenueRouter.get(
  '/tenants/:tenantId/revenue',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await listRevenueSnapshots(tenantId))
  })
)

revenueRouter.post(
  '/tenants/:tenantId/revenue',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(revenueCreateSchema, request.body)
    response.status(201).json(await createRevenueSnapshot(tenantId, body))
  })
)

revenueRouter.patch(
  '/revenue/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(revenueUpdateSchema, request.body)
    response.json(await updateRevenueSnapshot(id, body))
  })
)

revenueRouter.delete(
  '/revenue/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    await deleteRevenueSnapshot(id)
    sendNoContent(response)
  })
)
