import { Router } from 'express'

import { idParamSchema, tenantIdParamSchema } from '../../lib/validation/common'
import { asyncHandler, parseOrThrow, sendNoContent } from '../../server/http'
import { orderCreateSchema, orderUpdateSchema } from './schemas'
import { createOrder, deleteOrder, listOrders, updateOrder } from './service'

export const ordersRouter = Router()

ordersRouter.get(
  '/tenants/:tenantId/orders',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await listOrders(tenantId))
  })
)

ordersRouter.post(
  '/tenants/:tenantId/orders',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(orderCreateSchema, request.body)
    response.status(201).json(await createOrder(tenantId, body))
  })
)

ordersRouter.patch(
  '/orders/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(orderUpdateSchema, request.body)
    response.json(await updateOrder(id, body))
  })
)

ordersRouter.delete(
  '/orders/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    await deleteOrder(id)
    sendNoContent(response)
  })
)
