import type { Prisma } from '@prisma/client'
import { Router } from 'express'

import { idParamSchema, tenantIdParamSchema } from '../../lib/validation/common'
import { asyncHandler, parseOrThrow } from '../../server/http'
import {
  createPerson,
  createTenant,
  getTenant,
  getTenantSettings,
  listPeople,
  listTenants,
  updatePerson,
  updateTenant,
  upsertTenantSettings,
} from './service'
import {
  personUpdateSchema,
  tenantCreateSchema,
  tenantScopedPersonSchema,
  tenantSettingsSchema,
  tenantUpdateSchema,
} from './schemas'

export const tenantsRouter = Router()

tenantsRouter.get(
  '/tenants',
  asyncHandler(async (_request, response) => {
    response.json(await listTenants())
  })
)

tenantsRouter.post(
  '/tenants',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(tenantCreateSchema, request.body)
    response.status(201).json(await createTenant(body))
  })
)

tenantsRouter.get(
  '/tenants/:tenantId',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getTenant(tenantId))
  })
)

tenantsRouter.patch(
  '/tenants/:tenantId',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(tenantUpdateSchema, request.body)
    response.json(await updateTenant(tenantId, body))
  })
)

tenantsRouter.get(
  '/tenants/:tenantId/settings',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getTenantSettings(tenantId))
  })
)

tenantsRouter.put(
  '/tenants/:tenantId/settings',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(tenantSettingsSchema, request.body)
    response.json(
      await upsertTenantSettings(
        tenantId,
        body.configJson as Prisma.InputJsonValue
      )
    )
  })
)

tenantsRouter.get(
  '/tenants/:tenantId/people',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await listPeople(tenantId))
  })
)

tenantsRouter.post(
  '/tenants/:tenantId/people',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(tenantScopedPersonSchema, request.body)
    response
      .status(201)
      .json(await createPerson(tenantId, { tenantId, ...body }))
  })
)

tenantsRouter.patch(
  '/people/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(personUpdateSchema, request.body)
    response.json(await updatePerson(id, body))
  })
)
