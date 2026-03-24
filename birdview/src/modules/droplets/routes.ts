import type { Prisma } from '@prisma/client'
import { Router } from 'express'

import { prisma } from '../../lib/db/prisma'
import { idParamSchema, tenantIdParamSchema } from '../../lib/validation/common'
import { asyncHandler, parseOrThrow } from '../../server/http'
import { executeExploreRequest, previewDropletDefinition } from './explore'
import {
  activateTenantDroplet,
  createVerticalDroplet,
  deleteVerticalDroplet,
  deprecateVerticalDroplet,
  getTenantCatalog,
  listActiveTenantDroplets,
  listVerticalDroplets,
  publishVerticalDroplet,
  updateTenantDropletAssignment,
  updateVerticalDroplet,
  deactivateTenantDroplet,
} from './service'
import {
  dropletRunSchema,
  dummyDataScenarioCreateSchema,
  dummyDataScenarioUpdateSchema,
  exploreRequestSchema,
  previewDropletSchema,
  promptTemplateCreateSchema,
  promptTemplateUpdateSchema,
  tenantDropletActivationSchema,
  tenantDropletAssignmentUpdateSchema,
  verticalDropletCreateSchema,
  verticalDropletUpdateSchema,
  verticalIdSchema,
} from './schemas'
import {
  createDummyDataScenario,
  createPromptTemplate,
  deleteDummyDataScenario,
  deletePromptTemplate,
  generateVerticalDroplet,
  getDropletStudioOverview,
  getVerticalDropletById,
  listCatalogDroplets,
  listDummyDataScenarios,
  listPromptTemplates,
  listVerticalDropletVersions,
  previewVerticalDroplet,
  runShadowSkillDefinition,
  runVerticalDroplet,
  updateDummyDataScenario,
  updatePromptTemplate,
  validateVerticalDroplet,
} from './studio'

export const dropletsRouter = Router()

dropletsRouter.get(
  '/droplet-studio/overview',
  asyncHandler(async (_request, response) => {
    response.json(await getDropletStudioOverview())
  })
)

dropletsRouter.get(
  '/verticals/:verticalId/droplets',
  asyncHandler(async (request, response) => {
    const { verticalId } = parseOrThrow(verticalIdSchema, request.params)
    response.json(await listVerticalDroplets(verticalId))
  })
)

dropletsRouter.post(
  '/verticals/:verticalId/droplets',
  asyncHandler(async (request, response) => {
    const { verticalId } = parseOrThrow(verticalIdSchema, request.params)
    const body = parseOrThrow(verticalDropletCreateSchema, request.body)
    response.status(201).json(
      await createVerticalDroplet(verticalId, {
        ...body,
        shadowSkillDefinitionJson:
          body.shadowSkillDefinitionJson as Prisma.InputJsonValue | undefined,
        generationWarningsJson:
          body.generationWarningsJson as Prisma.InputJsonValue | undefined,
        previewDummyDataConfigJson:
          body.previewDummyDataConfigJson as Prisma.InputJsonValue | undefined,
        dropletDefinitionJson:
          body.dropletDefinitionJson as Prisma.InputJsonValue,
        supportedEntitiesJson:
          body.supportedEntitiesJson as Prisma.InputJsonValue,
        commandAliasesJson: body.commandAliasesJson as Prisma.InputJsonValue,
      })
    )
  })
)

dropletsRouter.get(
  '/droplets/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await getVerticalDropletById(id))
  })
)

dropletsRouter.patch(
  '/droplets/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(verticalDropletUpdateSchema, request.body)
    response.json(
      await updateVerticalDroplet(id, {
        ...body,
        shadowSkillDefinitionJson:
          body.shadowSkillDefinitionJson as Prisma.InputJsonValue | undefined,
        generationWarningsJson:
          body.generationWarningsJson as Prisma.InputJsonValue | undefined,
        previewDummyDataConfigJson:
          body.previewDummyDataConfigJson as Prisma.InputJsonValue | undefined,
        dropletDefinitionJson:
          body.dropletDefinitionJson as Prisma.InputJsonValue | undefined,
        supportedEntitiesJson:
          body.supportedEntitiesJson as Prisma.InputJsonValue | undefined,
        commandAliasesJson:
          body.commandAliasesJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

dropletsRouter.post(
  '/droplets/:id/generate',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await generateVerticalDroplet(id))
  })
)

dropletsRouter.post(
  '/droplets/:id/validate',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await validateVerticalDroplet(id))
  })
)

dropletsRouter.delete(
  '/droplets/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteVerticalDroplet(id))
  })
)

dropletsRouter.post(
  '/droplets/:id/preview',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(dropletRunSchema, request.body ?? {})
    const firstTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
    const tenantId = ensureTenantId(firstTenant?.id ?? null)
    response.json(
      await previewVerticalDroplet(id, tenantId, {
        dummyScenarioKey: body.dummyScenarioKey,
        inputParams: body.inputParams,
      })
    )
  })
)

dropletsRouter.post(
  '/droplets/:id/run',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(dropletRunSchema, request.body ?? {})
    const firstTenant = await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } })
    const tenantId = ensureTenantId(firstTenant?.id ?? null)
    response.json(
      await runVerticalDroplet(id, tenantId, {
        dummyScenarioKey: body.dummyScenarioKey,
        inputParams: body.inputParams,
      })
    )
  })
)

dropletsRouter.post(
  '/droplets/:id/publish',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await publishVerticalDroplet(id))
  })
)

dropletsRouter.post(
  '/droplets/:id/deprecate',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deprecateVerticalDroplet(id))
  })
)

dropletsRouter.get(
  '/droplets/:id/versions',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await listVerticalDropletVersions(id))
  })
)

dropletsRouter.get(
  '/catalog/droplets',
  asyncHandler(async (_request, response) => {
    response.json(await listCatalogDroplets())
  })
)

dropletsRouter.get(
  '/prompt-templates',
  asyncHandler(async (_request, response) => {
    response.json(await listPromptTemplates())
  })
)

dropletsRouter.post(
  '/prompt-templates',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(promptTemplateCreateSchema, request.body)
    response.status(201).json(await createPromptTemplate(body))
  })
)

dropletsRouter.patch(
  '/prompt-templates/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(promptTemplateUpdateSchema, request.body)
    response.json(await updatePromptTemplate(id, body))
  })
)

dropletsRouter.delete(
  '/prompt-templates/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deletePromptTemplate(id))
  })
)

dropletsRouter.get(
  '/dummy-data-scenarios',
  asyncHandler(async (_request, response) => {
    response.json(await listDummyDataScenarios())
  })
)

dropletsRouter.post(
  '/dummy-data-scenarios',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(dummyDataScenarioCreateSchema, request.body)
    response.status(201).json(
      await createDummyDataScenario({
        ...body,
        scenarioJson: body.scenarioJson as Prisma.InputJsonValue,
      })
    )
  })
)

dropletsRouter.patch(
  '/dummy-data-scenarios/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(dummyDataScenarioUpdateSchema, request.body)
    response.json(
      await updateDummyDataScenario(id, {
        ...body,
        scenarioJson: body.scenarioJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

dropletsRouter.delete(
  '/dummy-data-scenarios/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteDummyDataScenario(id))
  })
)

dropletsRouter.get(
  '/tenants/:tenantId/droplets',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getTenantCatalog(tenantId))
  })
)

dropletsRouter.post(
  '/tenants/:tenantId/droplets/:id/activate',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(tenantDropletActivationSchema, request.body ?? {})
    response.json(
      await activateTenantDroplet(tenantId, id, {
        placement: body.placement,
        configOverrideJson: body.configOverrideJson as Prisma.InputJsonValue,
      })
    )
  })
)

dropletsRouter.post(
  '/tenants/:tenantId/droplets/:id/deactivate',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deactivateTenantDroplet(tenantId, id))
  })
)

dropletsRouter.patch(
  '/tenant-droplets/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(tenantDropletAssignmentUpdateSchema, request.body)
    response.json(
      await updateTenantDropletAssignment(id, {
        ...body,
        configOverrideJson:
          body.configOverrideJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

dropletsRouter.get(
  '/tenants/:tenantId/droplets/active',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await listActiveTenantDroplets(tenantId))
  })
)

dropletsRouter.post(
  '/tenants/:tenantId/droplets/preview',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(previewDropletSchema, request.body)
    if (body.shadowSkillDefinitionJson) {
      response.json(
        await runShadowSkillDefinition(tenantId, body.shadowSkillDefinitionJson, {
          dummyScenarioKey: body.dummyScenarioKey,
          inputParams: body.inputParams,
        })
      )
      return
    }
    if (!body.dropletDefinitionJson) {
      throw new Error('Preview requires a droplet or shadow definition.')
    }
    response.json(
      await previewDropletDefinition(tenantId, body.dropletDefinitionJson)
    )
  })
)

dropletsRouter.post(
  '/tenants/:tenantId/explore',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(exploreRequestSchema, request.body)
    response.json(await executeExploreRequest(tenantId, body))
  })
)
function ensureTenantId(value: string | null) {
  if (!value) {
    throw new Error('No tenant available.')
  }
  return value
}
