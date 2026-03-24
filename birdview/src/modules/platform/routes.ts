import type { Prisma } from '@prisma/client'
import { Router } from 'express'

import { idParamSchema, tenantIdParamSchema } from '../../lib/validation/common'
import { asyncHandler, parseOrThrow } from '../../server/http'
import {
  companyCreateSchema,
  companyUpdateSchema,
  emailProviderConfigCreateSchema,
  emailProviderConfigUpdateSchema,
  emailTemplateCreateSchema,
  emailTemplateUpdateSchema,
  llmModelConfigCreateSchema,
  llmModelConfigUpdateSchema,
  llmProviderConfigCreateSchema,
  llmProviderConfigUpdateSchema,
  personCreateSchema,
  personUpdateSchema,
  skillCreateSchema,
  skillUpdateSchema,
  tenantCreateSchema,
  tenantSettingsSchema,
  tenantShellCreateSchema,
  tenantShellUpdateSchema,
  tenantUpdateSchema,
  userCompanyMembershipCreateSchema,
  userCompanyMembershipUpdateSchema,
  userCreateSchema,
  userUpdateSchema,
  userVerticalMembershipCreateSchema,
  userVerticalMembershipUpdateSchema,
  verticalCreateSchema,
  verticalDefinitionCreateSchema,
  verticalDefinitionUpdateSchema,
  verticalLlmConfigCreateSchema,
  verticalLlmConfigUpdateSchema,
  verticalSkillCreateSchema,
  verticalSkillUpdateSchema,
  verticalUpdateSchema,
} from './schemas'
import {
  createCompany,
  createEmailProviderConfig,
  createEmailTemplate,
  createLlmModelConfig,
  createLlmProviderConfig,
  createPerson,
  createSkill,
  createTenant,
  createTenantShell,
  createUser,
  createUserCompanyMembership,
  createUserVerticalMembership,
  createVertical,
  createVerticalDefinition,
  createVerticalLlmConfig,
  createVerticalSkill,
  deleteCompany,
  deleteEmailProviderConfig,
  deleteEmailTemplate,
  deleteLlmModelConfig,
  deleteLlmProviderConfig,
  deletePerson,
  deleteSkill,
  deleteTenant,
  deleteTenantShell,
  deleteUser,
  deleteUserCompanyMembership,
  deleteUserVerticalMembership,
  deleteVertical,
  deleteVerticalDefinition,
  deleteVerticalLlmConfig,
  deleteVerticalSkill,
  clearAuditLogs,
  getTenant,
  getTenantSettings,
  getTenantShellForTenant,
  listCompanies,
  listEmailProviderConfigs,
  listEmailTemplates,
  listLlmModelConfigs,
  listLlmProviderConfigs,
  listPeople,
  listSkills,
  listTenantShells,
  listTenants,
  listUsers,
  listVerticalDefinitions,
  listVerticalLlmConfigs,
  listVerticals,
  publishVerticalDefinition,
  testLlmModelConfig,
  testVerticalLlmConfig,
  updateCompany,
  updateEmailProviderConfig,
  updateEmailTemplate,
  updateLlmModelConfig,
  updateLlmProviderConfig,
  updatePerson,
  updateSkill,
  updateTenant,
  updateTenantShell,
  updateUser,
  updateUserCompanyMembership,
  updateUserVerticalMembership,
  updateVertical,
  updateVerticalDefinition,
  updateVerticalLlmConfig,
  updateVerticalSkill,
  upsertTenantSettings,
} from './service'

export const platformRouter = Router()

platformRouter.delete(
  '/audit-logs',
  asyncHandler(async (_request, response) => {
    response.json(await clearAuditLogs())
  })
)

platformRouter.get(
  '/verticals',
  asyncHandler(async (_request, response) => {
    response.json(await listVerticals())
  })
)

platformRouter.post(
  '/verticals',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(verticalCreateSchema, request.body)
    response.status(201).json(
      await createVertical({
        ...body,
        metadataJson: body.metadataJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.patch(
  '/verticals/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(verticalUpdateSchema, request.body)
    response.json(
      await updateVertical(id, {
        ...body,
        metadataJson: body.metadataJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.delete(
  '/verticals/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteVertical(id))
  })
)

platformRouter.get(
  '/vertical-definitions',
  asyncHandler(async (request, response) => {
    const verticalId =
      typeof request.query.verticalId === 'string'
        ? request.query.verticalId
        : undefined
    response.json(await listVerticalDefinitions(verticalId))
  })
)

platformRouter.post(
  '/vertical-definitions',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(verticalDefinitionCreateSchema, request.body)
    response.status(201).json(
      await createVerticalDefinition({
        ...body,
        commonModelConfigJson: body.commonModelConfigJson as Prisma.InputJsonValue,
        verticalModelConfigJson:
          body.verticalModelConfigJson as Prisma.InputJsonValue,
        llmConfigJson: body.llmConfigJson as Prisma.InputJsonValue,
        commandPackJson: body.commandPackJson as Prisma.InputJsonValue,
        skillPackJson: body.skillPackJson as Prisma.InputJsonValue,
        orgChartTemplateJson:
          body.orgChartTemplateJson as Prisma.InputJsonValue,
      })
    )
  })
)

platformRouter.patch(
  '/vertical-definitions/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(verticalDefinitionUpdateSchema, request.body)
    response.json(
      await updateVerticalDefinition(id, {
        ...body,
        commonModelConfigJson:
          body.commonModelConfigJson as Prisma.InputJsonValue | undefined,
        verticalModelConfigJson:
          body.verticalModelConfigJson as Prisma.InputJsonValue | undefined,
        llmConfigJson: body.llmConfigJson as Prisma.InputJsonValue | undefined,
        commandPackJson:
          body.commandPackJson as Prisma.InputJsonValue | undefined,
        skillPackJson: body.skillPackJson as Prisma.InputJsonValue | undefined,
        orgChartTemplateJson:
          body.orgChartTemplateJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.post(
  '/vertical-definitions/:id/publish',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await publishVerticalDefinition(id))
  })
)

platformRouter.delete(
  '/vertical-definitions/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteVerticalDefinition(id))
  })
)

platformRouter.get(
  '/skills',
  asyncHandler(async (_request, response) => {
    response.json(await listSkills())
  })
)

platformRouter.post(
  '/skills',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(skillCreateSchema, request.body)
    response.status(201).json(
      await createSkill({
        ...body,
        triggerHintsJson: body.triggerHintsJson as Prisma.InputJsonValue | undefined,
        inputSchemaJson: body.inputSchemaJson as Prisma.InputJsonValue | undefined,
        outputSchemaJson: body.outputSchemaJson as Prisma.InputJsonValue | undefined,
        toolsConfigJson: body.toolsConfigJson as Prisma.InputJsonValue | undefined,
        examplesJson: body.examplesJson as Prisma.InputJsonValue | undefined,
        tagsJson: body.tagsJson as Prisma.InputJsonValue | undefined,
        metadataJson: body.metadataJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.patch(
  '/skills/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(skillUpdateSchema, request.body)
    response.json(
      await updateSkill(id, {
        ...body,
        triggerHintsJson: body.triggerHintsJson as Prisma.InputJsonValue | undefined,
        inputSchemaJson: body.inputSchemaJson as Prisma.InputJsonValue | undefined,
        outputSchemaJson: body.outputSchemaJson as Prisma.InputJsonValue | undefined,
        toolsConfigJson: body.toolsConfigJson as Prisma.InputJsonValue | undefined,
        examplesJson: body.examplesJson as Prisma.InputJsonValue | undefined,
        tagsJson: body.tagsJson as Prisma.InputJsonValue | undefined,
        metadataJson: body.metadataJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.delete(
  '/skills/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteSkill(id))
  })
)

platformRouter.post(
  '/vertical-skills',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(verticalSkillCreateSchema, request.body)
    response.status(201).json(await createVerticalSkill(body))
  })
)

platformRouter.patch(
  '/vertical-skills/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(verticalSkillUpdateSchema, request.body)
    response.json(await updateVerticalSkill(id, body))
  })
)

platformRouter.delete(
  '/vertical-skills/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteVerticalSkill(id))
  })
)

platformRouter.get(
  '/tenants',
  asyncHandler(async (_request, response) => {
    response.json(await listTenants())
  })
)

platformRouter.post(
  '/tenants',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(tenantCreateSchema, request.body)
    response.status(201).json(await createTenant(body))
  })
)

platformRouter.get(
  '/tenants/:tenantId',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getTenant(tenantId))
  })
)

platformRouter.patch(
  '/tenants/:tenantId',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(tenantUpdateSchema, request.body)
    response.json(await updateTenant(tenantId, body))
  })
)

platformRouter.delete(
  '/tenants/:tenantId',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await deleteTenant(tenantId))
  })
)

platformRouter.get(
  '/companies',
  asyncHandler(async (_request, response) => {
    response.json(await listCompanies())
  })
)

platformRouter.post(
  '/companies',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(companyCreateSchema, request.body)
    response.status(201).json(
      await createCompany({
        ...body,
        metadataJson: body.metadataJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.patch(
  '/companies/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(companyUpdateSchema, request.body)
    response.json(
      await updateCompany(id, {
        ...body,
        metadataJson: body.metadataJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.delete(
  '/companies/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteCompany(id))
  })
)

platformRouter.get(
  '/tenants/:tenantId/settings',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getTenantSettings(tenantId))
  })
)

platformRouter.put(
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

platformRouter.get(
  '/tenant-shells',
  asyncHandler(async (request, response) => {
    const tenantId =
      typeof request.query.tenantId === 'string'
        ? request.query.tenantId
        : undefined
    response.json(await listTenantShells(tenantId))
  })
)

platformRouter.get(
  '/tenants/:tenantId/shell',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await getTenantShellForTenant(tenantId))
  })
)

platformRouter.post(
  '/tenant-shells',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(tenantShellCreateSchema, request.body)
    response.status(201).json(
      await createTenantShell({
        ...body,
        configJson: body.configJson as Prisma.InputJsonValue,
      })
    )
  })
)

platformRouter.patch(
  '/tenant-shells/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(tenantShellUpdateSchema, request.body)
    response.json(
      await updateTenantShell(id, {
        ...body,
        configJson: body.configJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.delete(
  '/tenant-shells/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteTenantShell(id))
  })
)

platformRouter.get(
  '/users',
  asyncHandler(async (request, response) => {
    const tenantId =
      typeof request.query.tenantId === 'string'
        ? request.query.tenantId
        : undefined
    response.json(await listUsers(tenantId))
  })
)

platformRouter.get(
  '/tenants/:tenantId/users',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await listUsers(tenantId))
  })
)

platformRouter.post(
  '/users',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(userCreateSchema, request.body)
    response.status(201).json(
      await createUser({
        ...body,
        metadataJson: body.metadataJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.patch(
  '/users/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(userUpdateSchema, request.body)
    response.json(
      await updateUser(id, {
        ...body,
        metadataJson: body.metadataJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.delete(
  '/users/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteUser(id))
  })
)

platformRouter.post(
  '/user-company-memberships',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(userCompanyMembershipCreateSchema, request.body)
    response.status(201).json(await createUserCompanyMembership(body))
  })
)

platformRouter.patch(
  '/user-company-memberships/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(userCompanyMembershipUpdateSchema, request.body)
    response.json(await updateUserCompanyMembership(id, body))
  })
)

platformRouter.delete(
  '/user-company-memberships/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteUserCompanyMembership(id))
  })
)

platformRouter.post(
  '/user-vertical-memberships',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(userVerticalMembershipCreateSchema, request.body)
    response.status(201).json(await createUserVerticalMembership(body))
  })
)

platformRouter.patch(
  '/user-vertical-memberships/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(userVerticalMembershipUpdateSchema, request.body)
    response.json(await updateUserVerticalMembership(id, body))
  })
)

platformRouter.delete(
  '/user-vertical-memberships/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteUserVerticalMembership(id))
  })
)

platformRouter.get(
  '/tenants/:tenantId/people',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    response.json(await listPeople(tenantId))
  })
)

platformRouter.post(
  '/tenants/:tenantId/people',
  asyncHandler(async (request, response) => {
    const { tenantId } = parseOrThrow(tenantIdParamSchema, request.params)
    const body = parseOrThrow(personCreateSchema, request.body)
    response.status(201).json(await createPerson(tenantId, { tenantId, ...body }))
  })
)

platformRouter.patch(
  '/people/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(personUpdateSchema, request.body)
    response.json(await updatePerson(id, body))
  })
)

platformRouter.delete(
  '/people/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deletePerson(id))
  })
)

platformRouter.get(
  '/llm-provider-configs',
  asyncHandler(async (_request, response) => {
    response.json(await listLlmProviderConfigs())
  })
)

platformRouter.post(
  '/llm-provider-configs',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(llmProviderConfigCreateSchema, request.body)
    response.status(201).json(
      await createLlmProviderConfig({
        ...body,
        configJson: body.configJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.patch(
  '/llm-provider-configs/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(llmProviderConfigUpdateSchema, request.body)
    response.json(
      await updateLlmProviderConfig(id, {
        ...body,
        configJson: body.configJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.delete(
  '/llm-provider-configs/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteLlmProviderConfig(id))
  })
)

platformRouter.get(
  '/llm-model-configs',
  asyncHandler(async (_request, response) => {
    response.json(await listLlmModelConfigs())
  })
)

platformRouter.post(
  '/llm-model-configs',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(llmModelConfigCreateSchema, request.body)
    response.status(201).json(
      await createLlmModelConfig({
        ...body,
        configJson: body.configJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.patch(
  '/llm-model-configs/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(llmModelConfigUpdateSchema, request.body)
    response.json(
      await updateLlmModelConfig(id, {
        ...body,
        configJson: body.configJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.delete(
  '/llm-model-configs/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteLlmModelConfig(id))
  })
)

platformRouter.post(
  '/llm-model-configs/:id/test',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await testLlmModelConfig(id))
  })
)

platformRouter.get(
  '/vertical-llm-configs',
  asyncHandler(async (_request, response) => {
    response.json(await listVerticalLlmConfigs())
  })
)

platformRouter.post(
  '/vertical-llm-configs',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(verticalLlmConfigCreateSchema, request.body)
    response.status(201).json(
      await createVerticalLlmConfig({
        ...body,
        configJson: body.configJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.patch(
  '/vertical-llm-configs/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(verticalLlmConfigUpdateSchema, request.body)
    response.json(
      await updateVerticalLlmConfig(id, {
        ...body,
        configJson: body.configJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.delete(
  '/vertical-llm-configs/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteVerticalLlmConfig(id))
  })
)

platformRouter.post(
  '/vertical-llm-configs/:id/test',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await testVerticalLlmConfig(id))
  })
)

platformRouter.get(
  '/email-provider-configs',
  asyncHandler(async (_request, response) => {
    response.json(await listEmailProviderConfigs())
  })
)

platformRouter.post(
  '/email-provider-configs',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(emailProviderConfigCreateSchema, request.body)
    response.status(201).json(
      await createEmailProviderConfig({
        ...body,
        configJson: body.configJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.patch(
  '/email-provider-configs/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(emailProviderConfigUpdateSchema, request.body)
    response.json(
      await updateEmailProviderConfig(id, {
        ...body,
        configJson: body.configJson as Prisma.InputJsonValue | undefined,
      })
    )
  })
)

platformRouter.delete(
  '/email-provider-configs/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteEmailProviderConfig(id))
  })
)

platformRouter.get(
  '/email-templates',
  asyncHandler(async (_request, response) => {
    response.json(await listEmailTemplates())
  })
)

platformRouter.post(
  '/email-templates',
  asyncHandler(async (request, response) => {
    const body = parseOrThrow(emailTemplateCreateSchema, request.body)
    response.status(201).json(await createEmailTemplate(body))
  })
)

platformRouter.patch(
  '/email-templates/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    const body = parseOrThrow(emailTemplateUpdateSchema, request.body)
    response.json(await updateEmailTemplate(id, body))
  })
)

platformRouter.delete(
  '/email-templates/:id',
  asyncHandler(async (request, response) => {
    const { id } = parseOrThrow(idParamSchema, request.params)
    response.json(await deleteEmailTemplate(id))
  })
)
