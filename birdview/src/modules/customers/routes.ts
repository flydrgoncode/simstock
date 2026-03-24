import { Router } from 'express'

import { idParamSchema, tenantIdParamSchema } from '../../lib/validation/common'
import { asyncHandler, parseOrThrow, sendNoContent } from '../../server/http'
import { customerCreateSchema, customerUpdateSchema } from './schemas'
import {
  createCustomer,
  deleteCustomer,
  listCustomers,
  updateCustomer,
} from './service'

export const customersRouter = Router()

customersRouter.get(
  '/tenants/:tenantId/customers',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await listCustomers(tenantId))
  })
)

customersRouter.post(
  '/tenants/:tenantId/customers',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(customerCreateSchema, request.body)
    response.status(201).json(await createCustomer(tenantId, body))
  })
)

customersRouter.patch(
  '/customers/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(customerUpdateSchema, request.body)
    response.json(await updateCustomer(id, body))
  })
)

customersRouter.delete(
  '/customers/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    await deleteCustomer(id)
    sendNoContent(response)
  })
)
