import { Router } from 'express'

import { idParamSchema, tenantIdParamSchema } from '../../lib/validation/common'
import { asyncHandler, parseOrThrow, sendNoContent } from '../../server/http'
import {
  createHeadcountSnapshot,
  deleteHeadcountSnapshot,
  listHeadcountSnapshots,
  updateHeadcountSnapshot,
} from './service'
import { headcountCreateSchema, headcountUpdateSchema } from './schemas'

export const headcountRouter = Router()

headcountRouter.get(
  '/tenants/:tenantId/headcount',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await listHeadcountSnapshots(tenantId))
  })
)

headcountRouter.post(
  '/tenants/:tenantId/headcount',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(headcountCreateSchema, request.body)
    response.status(201).json(await createHeadcountSnapshot(tenantId, body))
  })
)

headcountRouter.patch(
  '/headcount/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(headcountUpdateSchema, request.body)
    response.json(await updateHeadcountSnapshot(id, body))
  })
)

headcountRouter.delete(
  '/headcount/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    await deleteHeadcountSnapshot(id)
    sendNoContent(response)
  })
)
