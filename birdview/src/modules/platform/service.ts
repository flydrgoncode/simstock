import type { Prisma, UserStatus } from '@prisma/client'
import { RecordStatus } from '@prisma/client'

import { prisma } from '../../lib/db/prisma'
import { AppError } from '../../server/http'
import { ensureExists } from '../../server/utils'
import { createAuditLog } from '../shared/audit'

const userInclude = {
  companyMemberships: {
    include: {
      company: {
        include: {
          vertical: true,
        },
      },
    },
    orderBy: [{ createdAt: 'asc' }],
  },
  verticalMemberships: {
    include: {
      vertical: true,
    },
    orderBy: [{ createdAt: 'asc' }],
  },
} satisfies Prisma.UserInclude

function mapUserForResponse(
  user: Prisma.UserGetPayload<{ include: typeof userInclude }>
) {
  const primaryMembership = user.companyMemberships[0]

  return {
    ...user,
    name: user.displayName,
    title: user.globalRole ?? null,
    tenantId: primaryMembership?.company.tenantId ?? null,
  }
}

function normalizeUserPayload(data: {
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  name?: string
  passwordHash?: string | null
  authProvider?: string | null
  authProviderUserId?: string | null
  status?: UserStatus
  globalRole?: string | null
  metadataJson?: Prisma.InputJsonValue
}) {
  const fallbackName = (data.name ?? data.displayName ?? '').trim()
  const [fallbackFirst, ...rest] = fallbackName.split(/\s+/).filter(Boolean)
  const firstName = (data.firstName ?? fallbackFirst ?? 'Platform').trim()
  const lastName = (data.lastName ?? rest.join(' ') ?? 'User').trim() || 'User'
  const displayName =
    data.displayName?.trim() || [firstName, lastName].filter(Boolean).join(' ')

  return {
    email: data.email,
    firstName,
    lastName,
    displayName,
    passwordHash: data.passwordHash ?? null,
    authProvider: data.authProvider ?? null,
    authProviderUserId: data.authProviderUserId ?? null,
    status: data.status as UserStatus | undefined,
    globalRole: data.globalRole ?? null,
    metadataJson: data.metadataJson,
  }
}

function readJsonString(record: unknown, key: string) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return null
  }

  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readJsonHeaders(record: unknown) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return undefined
  }

  const rawHeaders = (record as Record<string, unknown>).headers
  if (!rawHeaders || typeof rawHeaders !== 'object' || Array.isArray(rawHeaders)) {
    return undefined
  }

  const headers = Object.fromEntries(
    Object.entries(rawHeaders as Record<string, unknown>).flatMap(([key, value]) =>
      typeof value === 'string' && value.trim() ? [[key, value.trim()]] : [],
    ),
  )

  return Object.keys(headers).length > 0 ? headers : undefined
}

function resolveProviderEndpoint(
  providerKey: string,
  configuredEndpoint: string | null | undefined,
) {
  if (configuredEndpoint?.trim()) {
    return configuredEndpoint.trim()
  }

  const normalized = providerKey.trim().toLowerCase()
  if (normalized === 'openai') {
    return 'https://api.openai.com/v1/chat/completions'
  }
  if (normalized === 'anthropic') {
    return 'https://api.anthropic.com/v1/messages'
  }
  return process.env.LLM_API_URL?.trim() ?? ''
}

async function executeLlmTest(params: {
  providerConfig: {
    id: string
    providerKey: string
    name: string
    baseUrl: string | null
    apiKeyRef: string | null
    configJson: unknown
  }
  modelConfig: {
    id: string
    modelKey: string
    displayName: string
    temperature: Prisma.Decimal | number | null
    maxTokens: number | null
  }
  systemPrompt?: string | null
  verticalLlmConfigId?: string
}) {
  const endpoint = resolveProviderEndpoint(
    params.providerConfig.providerKey,
    readJsonString(params.providerConfig.configJson, 'endpoint') ??
      params.providerConfig.baseUrl,
  )

  if (!endpoint.trim()) {
    throw new AppError(400, 'Selected LLM provider has no base URL or endpoint configured.')
  }

  const apiKeyRef = params.providerConfig.apiKeyRef
  const apiKey = apiKeyRef ? process.env[apiKeyRef] : process.env.LLM_API_KEY

  if (!apiKey?.trim()) {
    throw new AppError(
      400,
      `Selected LLM provider has no usable API key. Missing env for ${apiKeyRef ?? 'LLM_API_KEY'}.`,
    )
  }

  const startedAt = new Date()
  const controller = new AbortController()
  const timeoutMs = Number(process.env.LLM_TIMEOUT_MS ?? 60000)
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const normalizedProvider = params.providerConfig.providerKey.trim().toLowerCase()
    const isAnthropic = normalizedProvider === 'anthropic'
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(isAnthropic
          ? {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
            }
          : {
              authorization: `Bearer ${apiKey}`,
            }),
        ...(readJsonHeaders(params.providerConfig.configJson) ?? {}),
      },
      body: JSON.stringify({
        ...(isAnthropic
          ? {
              model: params.modelConfig.modelKey,
              temperature:
                params.modelConfig.temperature == null
                  ? 0
                  : Number(params.modelConfig.temperature),
              max_tokens: params.modelConfig.maxTokens ?? 256,
              ...(params.systemPrompt?.trim()
                ? { system: params.systemPrompt.trim() }
                : {}),
              messages: [{ role: 'user', content: 'Respond with exactly OK.' }],
            }
          : {
              model: params.modelConfig.modelKey,
              temperature:
                params.modelConfig.temperature == null
                  ? 0
                  : Number(params.modelConfig.temperature),
              max_tokens: params.modelConfig.maxTokens ?? undefined,
              messages: [
                ...(params.systemPrompt?.trim()
                  ? [{ role: 'system', content: params.systemPrompt.trim() }]
                  : []),
                { role: 'user', content: 'Respond with exactly OK.' },
              ],
            }),
      }),
      signal: controller.signal,
    })

    const completedAt = new Date()
    const rawText = await response.text()
    const latencyMs = completedAt.getTime() - startedAt.getTime()

    const result = {
      ok: response.ok,
      providerConfigId: params.providerConfig.id,
      providerKey: params.providerConfig.providerKey,
      providerName: params.providerConfig.name,
      modelConfigId: params.modelConfig.id,
      modelKey: params.modelConfig.modelKey,
      modelDisplayName: params.modelConfig.displayName,
      verticalLlmConfigId: params.verticalLlmConfigId ?? null,
      endpoint,
      apiKeyRef,
      latencyMs,
      status: response.status,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      responsePreview: rawText.slice(0, 500),
      hasSystemPrompt: Boolean(params.systemPrompt?.trim()),
    }

    await createAuditLog({
      entityType: 'LLMConfigTest',
      entityId: params.verticalLlmConfigId ?? params.modelConfig.id,
      action: response.ok ? 'tested' : 'test_failed',
      payloadJson: result as Prisma.InputJsonValue,
    })

    if (!response.ok) {
      throw new AppError(502, `LLM test failed with status ${response.status}.`)
    }

    return result
  } catch (error) {
    if (error instanceof AppError) {
      throw error
    }
    throw new AppError(
      502,
      error instanceof Error ? `LLM test failed: ${error.message}` : 'LLM test failed.',
    )
  } finally {
    clearTimeout(timeout)
  }
}

async function getCompanyForTenant(tenantId: string) {
  return prisma.company.findUnique({
    where: { tenantId },
  })
}

export async function listVerticals() {
  return prisma.vertical.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      createdByUser: true,
      updatedByUser: true,
      definitions: {
        orderBy: [{ version: 'desc' }],
      },
      droplets: {
        orderBy: [{ name: 'asc' }],
      },
      companies: {
        orderBy: [{ name: 'asc' }],
      },
      verticalSkills: {
        include: { skill: true },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      },
      verticalLlmConfigs: {
        include: { providerConfig: true, modelConfig: true },
        orderBy: [{ createdAt: 'asc' }],
      },
    },
  })
}

export async function createVertical(data: Prisma.VerticalUncheckedCreateInput) {
  const vertical = await prisma.vertical.create({ data })
  await createAuditLog({
    entityType: 'Vertical',
    entityId: vertical.id,
    action: 'created',
    payloadJson: { key: vertical.key, name: vertical.name },
  })
  return vertical
}

export async function updateVertical(
  id: string,
  data: Prisma.VerticalUncheckedUpdateInput
) {
  ensureExists(await prisma.vertical.findUnique({ where: { id } }), 'Vertical not found')
  const vertical = await prisma.vertical.update({ where: { id }, data })
  await createAuditLog({
    entityType: 'Vertical',
    entityId: id,
    action: 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return vertical
}

export async function deleteVertical(id: string) {
  const vertical = ensureExists(
    await prisma.vertical.findUnique({
      where: { id },
      include: {
        definitions: true,
        droplets: true,
        tenantShells: true,
        companies: true,
        verticalSkills: true,
        userMemberships: true,
        verticalLlmConfigs: true,
      },
    }),
    'Vertical not found'
  )

  if (
    vertical.definitions.length > 0 ||
    vertical.droplets.length > 0 ||
    vertical.tenantShells.length > 0 ||
    vertical.companies.length > 0 ||
    vertical.verticalSkills.length > 0 ||
    vertical.userMemberships.length > 0 ||
    vertical.verticalLlmConfigs.length > 0
  ) {
    throw new Error(
      'Vertical cannot be deleted while it still has related definitions, droplets, shells, companies, skills, memberships, or LLM configs.'
    )
  }

  await prisma.vertical.delete({ where: { id } })
  await createAuditLog({
    entityType: 'Vertical',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function listVerticalDefinitions(verticalId?: string) {
  return prisma.verticalDefinition.findMany({
    where: verticalId ? { verticalId } : undefined,
    orderBy: [{ createdAt: 'desc' }],
    include: { vertical: true },
  })
}

export async function createVerticalDefinition(
  data: Prisma.VerticalDefinitionUncheckedCreateInput
) {
  const definition = await prisma.verticalDefinition.create({ data })
  await createAuditLog({
    entityType: 'VerticalDefinition',
    entityId: definition.id,
    action: 'created',
    payloadJson: { verticalId: definition.verticalId, version: definition.version },
  })
  return definition
}

export async function updateVerticalDefinition(
  id: string,
  data: Prisma.VerticalDefinitionUpdateInput
) {
  ensureExists(
    await prisma.verticalDefinition.findUnique({ where: { id } }),
    'Vertical definition not found'
  )
  const definition = await prisma.verticalDefinition.update({ where: { id }, data })
  await createAuditLog({
    entityType: 'VerticalDefinition',
    entityId: id,
    action: 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return definition
}

export async function publishVerticalDefinition(id: string) {
  return updateVerticalDefinition(id, { status: 'PUBLISHED' })
}

export async function deleteVerticalDefinition(id: string) {
  ensureExists(
    await prisma.verticalDefinition.findUnique({ where: { id } }),
    'Vertical definition not found'
  )
  await prisma.verticalDefinition.delete({ where: { id } })
  await createAuditLog({
    entityType: 'VerticalDefinition',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function listSkills() {
  return prisma.skill.findMany({
    orderBy: [{ createdAt: 'asc' }],
    include: {
      createdByUser: true,
      updatedByUser: true,
      verticals: {
        include: { vertical: true },
        orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }],
      },
    },
  })
}

export async function createSkill(data: Prisma.SkillUncheckedCreateInput) {
  const skill = await prisma.skill.create({ data })
  await createAuditLog({
    entityType: 'Skill',
    entityId: skill.id,
    action: 'created',
    payloadJson: { key: skill.key, name: skill.name },
  })
  return skill
}

export async function updateSkill(
  id: string,
  data: Prisma.SkillUncheckedUpdateInput
) {
  ensureExists(await prisma.skill.findUnique({ where: { id } }), 'Skill not found')
  const skill = await prisma.skill.update({ where: { id }, data })
  await createAuditLog({
    entityType: 'Skill',
    entityId: id,
    action: 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return skill
}

export async function deleteSkill(id: string) {
  const skill = ensureExists(
    await prisma.skill.findUnique({
      where: { id },
      include: { verticals: true },
    }),
    'Skill not found'
  )

  if (skill.verticals.length > 0) {
    throw new Error('Skill cannot be deleted while it is assigned to one or more verticals.')
  }

  await prisma.skill.delete({ where: { id } })
  await createAuditLog({
    entityType: 'Skill',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function createVerticalSkill(
  data: Prisma.VerticalSkillUncheckedCreateInput
) {
  const record = await prisma.verticalSkill.create({
    data,
    include: {
      vertical: true,
      skill: true,
    },
  })
  await createAuditLog({
    entityType: 'VerticalSkill',
    entityId: record.id,
    action: record.active ? 'activated' : 'created',
    payloadJson: { verticalId: record.verticalId, skillId: record.skillId },
  })
  return record
}

export async function updateVerticalSkill(
  id: string,
  data: Prisma.VerticalSkillUpdateInput
) {
  ensureExists(
    await prisma.verticalSkill.findUnique({ where: { id } }),
    'Vertical skill not found'
  )
  const record = await prisma.verticalSkill.update({
    where: { id },
    data,
    include: { vertical: true, skill: true },
  })
  await createAuditLog({
    entityType: 'VerticalSkill',
    entityId: id,
    action:
      typeof data.active === 'boolean'
        ? data.active
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return record
}

export async function deleteVerticalSkill(id: string) {
  ensureExists(
    await prisma.verticalSkill.findUnique({ where: { id } }),
    'Vertical skill not found'
  )
  await prisma.verticalSkill.delete({ where: { id } })
  await createAuditLog({
    entityType: 'VerticalSkill',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function listTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      settings: true,
      company: {
        include: { vertical: true },
      },
      tenantShells: {
        include: {
          vertical: true,
          verticalDefinition: true,
        },
      },
    },
  })
}

export async function createTenant(data: Prisma.TenantCreateInput) {
  const tenant = await prisma.tenant.create({
    data: {
      ...data,
      settings: {
        create: {
          configJson: {
            theme: 'system',
            locale: 'en-US',
          },
        },
      },
    },
    include: { settings: true, tenantShells: true, company: true },
  })
  await createAuditLog({
    tenantId: tenant.id,
    entityType: 'Tenant',
    entityId: tenant.id,
    action: 'created',
    payloadJson: { name: tenant.name, slug: tenant.slug },
  })
  return tenant
}

export async function getTenant(tenantId: string) {
  return ensureExists(
    await prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        settings: true,
        company: {
          include: { vertical: true },
        },
        tenantShells: {
          include: { vertical: true, verticalDefinition: true },
        },
      },
    }),
    'Tenant not found'
  )
}

export async function updateTenant(
  tenantId: string,
  data: Prisma.TenantUpdateInput
) {
  await getTenant(tenantId)
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data,
    include: { settings: true, tenantShells: true, company: true },
  })
  await createAuditLog({
    tenantId,
    entityType: 'Tenant',
    entityId: tenantId,
    action: 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return tenant
}

export async function deleteTenant(tenantId: string) {
  await getTenant(tenantId)
  await prisma.tenant.delete({ where: { id: tenantId } })
  await createAuditLog({
    tenantId,
    entityType: 'Tenant',
    entityId: tenantId,
    action: 'deleted',
  })
  return { ok: true }
}

export async function listCompanies() {
  return prisma.company.findMany({
    orderBy: [{ createdAt: 'asc' }],
    include: {
      tenant: true,
      vertical: true,
      createdByUser: true,
      updatedByUser: true,
      userMemberships: {
        include: { user: true },
        orderBy: [{ createdAt: 'asc' }],
      },
    },
  })
}

export async function createCompany(data: Prisma.CompanyUncheckedCreateInput) {
  const company = await prisma.company.create({
    data,
    include: { tenant: true, vertical: true },
  })
  await createAuditLog({
    tenantId: company.tenantId ?? null,
    entityType: 'Company',
    entityId: company.id,
    action: 'created',
    payloadJson: { key: company.key, name: company.name },
  })
  return company
}

export async function updateCompany(
  id: string,
  data: Prisma.CompanyUncheckedUpdateInput
) {
  const existing = ensureExists(
    await prisma.company.findUnique({ where: { id } }),
    'Company not found'
  )
  const company = await prisma.company.update({
    where: { id },
    data,
    include: { tenant: true, vertical: true },
  })
  await createAuditLog({
    tenantId: existing.tenantId ?? null,
    entityType: 'Company',
    entityId: id,
    action:
      typeof data.status === 'string'
        ? data.status === 'ACTIVE'
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return company
}

export async function deleteCompany(id: string) {
  const company = ensureExists(
    await prisma.company.findUnique({
      where: { id },
      include: { userMemberships: true },
    }),
    'Company not found'
  )
  if (company.userMemberships.length > 0) {
    throw new Error('Company cannot be deleted while it still has user memberships.')
  }
  await prisma.company.delete({ where: { id } })
  await createAuditLog({
    tenantId: company.tenantId ?? null,
    entityType: 'Company',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function getTenantSettings(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({ where: { tenantId } })
  if (settings) {
    return settings
  }
  await getTenant(tenantId)
  return prisma.tenantSettings.create({
    data: {
      tenantId,
      configJson: {},
    },
  })
}

export async function upsertTenantSettings(
  tenantId: string,
  configJson: Prisma.InputJsonValue
) {
  await getTenant(tenantId)
  const settings = await prisma.tenantSettings.upsert({
    where: { tenantId },
    create: { tenantId, configJson },
    update: { configJson },
  })
  await createAuditLog({
    tenantId,
    entityType: 'TenantSettings',
    entityId: settings.id,
    action: 'updated',
    payloadJson: { configJson },
  })
  return settings
}

export async function listTenantShells(tenantId?: string) {
  return prisma.tenantShell.findMany({
    where: tenantId ? { tenantId } : undefined,
    orderBy: [{ createdAt: 'asc' }],
    include: {
      tenant: true,
      vertical: true,
      verticalDefinition: true,
    },
  })
}

export async function getTenantShellForTenant(tenantId: string) {
  const shell = await prisma.tenantShell.findFirst({
    where: { tenantId, status: 'ACTIVE' },
    include: {
      tenant: true,
      vertical: true,
      verticalDefinition: true,
    },
    orderBy: { createdAt: 'asc' },
  })

  return ensureExists(shell, 'Tenant shell not found')
}

export async function createTenantShell(
  data: Prisma.TenantShellUncheckedCreateInput
) {
  const shell = await prisma.tenantShell.create({
    data,
    include: {
      tenant: true,
      vertical: true,
      verticalDefinition: true,
    },
  })
  await createAuditLog({
    tenantId: shell.tenantId,
    entityType: 'TenantShell',
    entityId: shell.id,
    action: 'created',
    payloadJson: { name: shell.name, verticalId: shell.verticalId },
  })
  return shell
}

export async function updateTenantShell(
  id: string,
  data: Prisma.TenantShellUpdateInput
) {
  const existing = ensureExists(
    await prisma.tenantShell.findUnique({ where: { id } }),
    'Tenant shell not found'
  )
  const shell = await prisma.tenantShell.update({
    where: { id },
    data,
    include: {
      tenant: true,
      vertical: true,
      verticalDefinition: true,
    },
  })
  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'TenantShell',
    entityId: id,
    action:
      typeof data.status === 'string'
        ? data.status === 'ACTIVE'
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return shell
}

export async function deleteTenantShell(id: string) {
  const shell = ensureExists(
    await prisma.tenantShell.findUnique({ where: { id } }),
    'Tenant shell not found'
  )
  await prisma.tenantShell.delete({ where: { id } })
  await createAuditLog({
    tenantId: shell.tenantId,
    entityType: 'TenantShell',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function listUsers(tenantId?: string) {
  const users = await prisma.user.findMany({
    where: tenantId
      ? {
          companyMemberships: {
            some: {
              company: {
                tenantId,
              },
            },
          },
        }
      : undefined,
    orderBy: [{ createdAt: 'asc' }],
    include: userInclude,
  })

  return users.map(mapUserForResponse)
}

export async function createUser(data: {
  tenantId?: string
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  name?: string
  passwordHash?: string | null
  authProvider?: string | null
  authProviderUserId?: string | null
  status?: Prisma.UserCreateInput['status']
  globalRole?: string | null
  metadataJson?: Prisma.InputJsonValue
}) {
  const normalized = normalizeUserPayload(data)
  const user = await prisma.user.create({
    data: normalized,
    include: userInclude,
  })

  if (data.tenantId) {
    const company = await getCompanyForTenant(data.tenantId)
    if (!company) {
      throw new Error('Tenant must be linked to a company before users can be associated with it.')
    }

    await prisma.userCompanyMembership.create({
      data: {
        userId: user.id,
        companyId: company.id,
        role: 'member',
        status: 'ACTIVE',
      },
    })
  }

  await createAuditLog({
    tenantId: data.tenantId ?? null,
    entityType: 'User',
    entityId: user.id,
    action: 'created',
    payloadJson: { displayName: normalized.displayName, email: normalized.email },
  })

  return mapUserForResponse(
    ensureExists(
      await prisma.user.findUnique({
        where: { id: user.id },
        include: userInclude,
      }),
      'User not found after creation'
    )
  )
}

export async function updateUser(
  id: string,
  data: {
    email?: string
    firstName?: string
    lastName?: string
    displayName?: string
    name?: string
    passwordHash?: string | null
    authProvider?: string | null
    authProviderUserId?: string | null
    status?: UserStatus
    globalRole?: string | null
    metadataJson?: Prisma.InputJsonValue
  }
) {
  const existing = ensureExists(
    await prisma.user.findUnique({ where: { id } }),
    'User not found'
  )
  const normalized = normalizeUserPayload({
    email: data.email ?? existing.email,
    firstName: data.firstName ?? existing.firstName,
    lastName: data.lastName ?? existing.lastName,
    displayName: data.displayName ?? existing.displayName,
    name: data.name,
    passwordHash:
      data.passwordHash === undefined ? existing.passwordHash : data.passwordHash,
    authProvider:
      data.authProvider === undefined ? existing.authProvider : data.authProvider,
    authProviderUserId:
      data.authProviderUserId === undefined
        ? existing.authProviderUserId
        : data.authProviderUserId,
    status: data.status ?? existing.status,
    globalRole:
      data.globalRole === undefined ? existing.globalRole : data.globalRole,
    metadataJson:
      data.metadataJson === undefined
        ? (existing.metadataJson as Prisma.InputJsonValue | undefined)
        : data.metadataJson,
  })

  const user = await prisma.user.update({
    where: { id },
    data: normalized,
    include: userInclude,
  })
  await createAuditLog({
    entityType: 'User',
    entityId: id,
    action:
      typeof data.status === 'string'
        ? data.status === 'ACTIVE'
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return mapUserForResponse(user)
}

export async function deleteUser(id: string) {
  ensureExists(await prisma.user.findUnique({ where: { id } }), 'User not found')
  await prisma.user.delete({ where: { id } })
  await createAuditLog({
    entityType: 'User',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function createUserCompanyMembership(
  data: Prisma.UserCompanyMembershipUncheckedCreateInput
) {
  const membership = await prisma.userCompanyMembership.create({
    data,
    include: { user: true, company: true },
  })
  await createAuditLog({
    tenantId: membership.company.tenantId ?? null,
    entityType: 'UserCompanyMembership',
    entityId: membership.id,
    action:
      membership.status === 'ACTIVE' ? 'activated' : membership.status.toLowerCase(),
    payloadJson: { userId: membership.userId, companyId: membership.companyId },
  })
  return membership
}

export async function updateUserCompanyMembership(
  id: string,
  data: Prisma.UserCompanyMembershipUpdateInput
) {
  const existing = ensureExists(
    await prisma.userCompanyMembership.findUnique({
      where: { id },
      include: { company: true },
    }),
    'User-company membership not found'
  )
  const membership = await prisma.userCompanyMembership.update({
    where: { id },
    data,
    include: { user: true, company: true },
  })
  await createAuditLog({
    tenantId: existing.company.tenantId ?? null,
    entityType: 'UserCompanyMembership',
    entityId: id,
    action:
      typeof data.status === 'string'
        ? data.status === 'ACTIVE'
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return membership
}

export async function deleteUserCompanyMembership(id: string) {
  const membership = ensureExists(
    await prisma.userCompanyMembership.findUnique({
      where: { id },
      include: { company: true },
    }),
    'User-company membership not found'
  )
  await prisma.userCompanyMembership.delete({ where: { id } })
  await createAuditLog({
    tenantId: membership.company.tenantId ?? null,
    entityType: 'UserCompanyMembership',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function createUserVerticalMembership(
  data: Prisma.UserVerticalMembershipUncheckedCreateInput
) {
  const membership = await prisma.userVerticalMembership.create({
    data,
    include: { user: true, vertical: true },
  })
  await createAuditLog({
    entityType: 'UserVerticalMembership',
    entityId: membership.id,
    action:
      membership.status === 'ACTIVE' ? 'activated' : membership.status.toLowerCase(),
    payloadJson: { userId: membership.userId, verticalId: membership.verticalId },
  })
  return membership
}

export async function updateUserVerticalMembership(
  id: string,
  data: Prisma.UserVerticalMembershipUpdateInput
) {
  ensureExists(
    await prisma.userVerticalMembership.findUnique({ where: { id } }),
    'User-vertical membership not found'
  )
  const membership = await prisma.userVerticalMembership.update({
    where: { id },
    data,
    include: { user: true, vertical: true },
  })
  await createAuditLog({
    entityType: 'UserVerticalMembership',
    entityId: id,
    action:
      typeof data.status === 'string'
        ? data.status === 'ACTIVE'
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return membership
}

export async function deleteUserVerticalMembership(id: string) {
  ensureExists(
    await prisma.userVerticalMembership.findUnique({ where: { id } }),
    'User-vertical membership not found'
  )
  await prisma.userVerticalMembership.delete({ where: { id } })
  await createAuditLog({
    entityType: 'UserVerticalMembership',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function listPeople(tenantId: string) {
  return prisma.person.findMany({
    where: { tenantId },
    orderBy: [{ name: 'asc' }],
  })
}

export async function createPerson(
  tenantId: string,
  data: Prisma.PersonUncheckedCreateInput
) {
  const person = await prisma.person.create({
    data: {
      ...data,
      tenantId,
    },
  })
  await createAuditLog({
    tenantId,
    entityType: 'Person',
    entityId: person.id,
    action: 'created',
    payloadJson: { name: person.name },
  })
  return person
}

export async function updatePerson(
  id: string,
  data: Prisma.PersonUpdateInput
) {
  const existing = ensureExists(
    await prisma.person.findUnique({ where: { id } }),
    'Person not found'
  )
  const person = await prisma.person.update({
    where: { id },
    data,
  })
  await createAuditLog({
    tenantId: existing.tenantId,
    entityType: 'Person',
    entityId: id,
    action:
      typeof data.active === 'boolean'
        ? data.active
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return person
}

export async function deletePerson(id: string) {
  const person = ensureExists(await prisma.person.findUnique({ where: { id } }), 'Person not found')
  await prisma.person.delete({ where: { id } })
  await createAuditLog({
    tenantId: person.tenantId,
    entityType: 'Person',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function listLlmProviderConfigs() {
  return prisma.lLMProviderConfig.findMany({
    orderBy: [{ createdAt: 'asc' }],
    include: {
      modelConfigs: {
        orderBy: [{ createdAt: 'asc' }],
      },
    },
  })
}

export async function createLlmProviderConfig(
  data: Prisma.LLMProviderConfigUncheckedCreateInput
) {
  const record = await prisma.lLMProviderConfig.create({ data })
  await createAuditLog({
    entityType: 'LLMProviderConfig',
    entityId: record.id,
    action: 'created',
    payloadJson: { providerKey: record.providerKey, name: record.name },
  })
  return record
}

export async function updateLlmProviderConfig(
  id: string,
  data: Prisma.LLMProviderConfigUncheckedUpdateInput
) {
  ensureExists(
    await prisma.lLMProviderConfig.findUnique({ where: { id } }),
    'LLM provider config not found'
  )
  const record = await prisma.lLMProviderConfig.update({ where: { id }, data })
  await createAuditLog({
    entityType: 'LLMProviderConfig',
    entityId: id,
    action:
      typeof data.status === 'string'
        ? data.status === 'ACTIVE'
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return record
}

export async function deleteLlmProviderConfig(id: string) {
  const record = ensureExists(
    await prisma.lLMProviderConfig.findUnique({
      where: { id },
      include: { modelConfigs: true, verticalAssignments: true },
    }),
    'LLM provider config not found'
  )
  if (record.modelConfigs.length > 0 || record.verticalAssignments.length > 0) {
    throw new Error('LLM provider config cannot be deleted while related models or overrides exist.')
  }
  await prisma.lLMProviderConfig.delete({ where: { id } })
  await createAuditLog({
    entityType: 'LLMProviderConfig',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function listLlmModelConfigs() {
  return prisma.lLMModelConfig.findMany({
    orderBy: [{ createdAt: 'asc' }],
    include: {
      providerConfig: true,
    },
  })
}

export async function createLlmModelConfig(
  data: Prisma.LLMModelConfigUncheckedCreateInput
) {
  const record = await prisma.lLMModelConfig.create({
    data,
    include: { providerConfig: true },
  })
  await createAuditLog({
    entityType: 'LLMModelConfig',
    entityId: record.id,
    action: 'created',
    payloadJson: { modelKey: record.modelKey, providerConfigId: record.providerConfigId },
  })
  return record
}

export async function updateLlmModelConfig(
  id: string,
  data: Prisma.LLMModelConfigUncheckedUpdateInput
) {
  ensureExists(
    await prisma.lLMModelConfig.findUnique({ where: { id } }),
    'LLM model config not found'
  )
  const record = await prisma.lLMModelConfig.update({
    where: { id },
    data,
    include: { providerConfig: true },
  })
  await createAuditLog({
    entityType: 'LLMModelConfig',
    entityId: id,
    action:
      typeof data.status === 'string'
        ? data.status === 'ACTIVE'
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return record
}

export async function deleteLlmModelConfig(id: string) {
  const record = ensureExists(
    await prisma.lLMModelConfig.findUnique({
      where: { id },
      include: { verticalAssignments: true },
    }),
    'LLM model config not found'
  )
  if (record.verticalAssignments.length > 0) {
    throw new Error('LLM model config cannot be deleted while vertical overrides still reference it.')
  }
  await prisma.lLMModelConfig.delete({ where: { id } })
  await createAuditLog({
    entityType: 'LLMModelConfig',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function listVerticalLlmConfigs() {
  return prisma.verticalLLMConfig.findMany({
    orderBy: [{ createdAt: 'asc' }],
    include: {
      vertical: true,
      providerConfig: true,
      modelConfig: true,
    },
  })
}

export async function createVerticalLlmConfig(
  data: Prisma.VerticalLLMConfigUncheckedCreateInput
) {
  const record = await prisma.verticalLLMConfig.create({
    data,
    include: {
      vertical: true,
      providerConfig: true,
      modelConfig: true,
    },
  })
  await createAuditLog({
    entityType: 'VerticalLLMConfig',
    entityId: record.id,
    action: record.active ? 'activated' : 'created',
    payloadJson: { verticalId: record.verticalId, modelConfigId: record.modelConfigId },
  })
  return record
}

export async function updateVerticalLlmConfig(
  id: string,
  data: Prisma.VerticalLLMConfigUncheckedUpdateInput
) {
  ensureExists(
    await prisma.verticalLLMConfig.findUnique({ where: { id } }),
    'Vertical LLM config not found'
  )
  const record = await prisma.verticalLLMConfig.update({
    where: { id },
    data,
    include: {
      vertical: true,
      providerConfig: true,
      modelConfig: true,
    },
  })
  await createAuditLog({
    entityType: 'VerticalLLMConfig',
    entityId: id,
    action:
      typeof data.active === 'boolean'
        ? data.active
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return record
}

export async function deleteVerticalLlmConfig(id: string) {
  ensureExists(
    await prisma.verticalLLMConfig.findUnique({ where: { id } }),
    'Vertical LLM config not found'
  )
  await prisma.verticalLLMConfig.delete({ where: { id } })
  await createAuditLog({
    entityType: 'VerticalLLMConfig',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function testLlmModelConfig(id: string) {
  const model = ensureExists(
    await prisma.lLMModelConfig.findUnique({
      where: { id },
      include: {
        providerConfig: true,
      },
    }),
    'LLM model config not found',
  )

  if (model.status !== RecordStatus.ACTIVE || model.providerConfig.status !== RecordStatus.ACTIVE) {
    throw new AppError(400, 'Only active LLM models and providers can be tested.')
  }

  return executeLlmTest({
    providerConfig: model.providerConfig,
    modelConfig: model,
  })
}

export async function testVerticalLlmConfig(id: string) {
  const config = ensureExists(
    await prisma.verticalLLMConfig.findUnique({
      where: { id },
      include: {
        providerConfig: true,
        modelConfig: true,
      },
    }),
    'Vertical LLM config not found',
  )

  if (!config.active) {
    throw new AppError(400, 'Only active vertical LLM overrides can be tested.')
  }

  if (config.providerConfig.status !== RecordStatus.ACTIVE || config.modelConfig.status !== RecordStatus.ACTIVE) {
    throw new AppError(400, 'Only active LLM models and providers can be tested.')
  }

  return executeLlmTest({
    providerConfig: config.providerConfig,
    modelConfig: config.modelConfig,
    systemPrompt: config.systemPrompt,
    verticalLlmConfigId: config.id,
  })
}

export async function clearAuditLogs() {
  const count = await prisma.auditLog.count()
  await prisma.auditLog.deleteMany({})
  return { ok: true, deletedCount: count }
}

export async function listEmailProviderConfigs() {
  return prisma.emailProviderConfig.findMany({
    orderBy: [{ createdAt: 'asc' }],
  })
}

export async function createEmailProviderConfig(
  data: Prisma.EmailProviderConfigUncheckedCreateInput
) {
  const record = await prisma.emailProviderConfig.create({ data })
  await createAuditLog({
    entityType: 'EmailProviderConfig',
    entityId: record.id,
    action: 'created',
    payloadJson: { providerKey: record.providerKey, name: record.name },
  })
  return record
}

export async function updateEmailProviderConfig(
  id: string,
  data: Prisma.EmailProviderConfigUncheckedUpdateInput
) {
  ensureExists(
    await prisma.emailProviderConfig.findUnique({ where: { id } }),
    'Email provider config not found'
  )
  const record = await prisma.emailProviderConfig.update({
    where: { id },
    data,
  })
  await createAuditLog({
    entityType: 'EmailProviderConfig',
    entityId: id,
    action:
      typeof data.status === 'string'
        ? data.status === 'ACTIVE'
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return record
}

export async function deleteEmailProviderConfig(id: string) {
  ensureExists(
    await prisma.emailProviderConfig.findUnique({ where: { id } }),
    'Email provider config not found'
  )
  await prisma.emailProviderConfig.delete({ where: { id } })
  await createAuditLog({
    entityType: 'EmailProviderConfig',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}

export async function listEmailTemplates() {
  return prisma.emailTemplate.findMany({
    orderBy: [{ createdAt: 'asc' }],
  })
}

export async function createEmailTemplate(
  data: Prisma.EmailTemplateUncheckedCreateInput
) {
  const record = await prisma.emailTemplate.create({ data })
  await createAuditLog({
    entityType: 'EmailTemplate',
    entityId: record.id,
    action: 'created',
    payloadJson: { key: record.key, name: record.name },
  })
  return record
}

export async function updateEmailTemplate(
  id: string,
  data: Prisma.EmailTemplateUncheckedUpdateInput
) {
  ensureExists(
    await prisma.emailTemplate.findUnique({ where: { id } }),
    'Email template not found'
  )
  const record = await prisma.emailTemplate.update({ where: { id }, data })
  await createAuditLog({
    entityType: 'EmailTemplate',
    entityId: id,
    action:
      typeof data.status === 'string'
        ? data.status === 'ACTIVE'
          ? 'activated'
          : 'deactivated'
        : 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return record
}

export async function deleteEmailTemplate(id: string) {
  ensureExists(
    await prisma.emailTemplate.findUnique({ where: { id } }),
    'Email template not found'
  )
  await prisma.emailTemplate.delete({ where: { id } })
  await createAuditLog({
    entityType: 'EmailTemplate',
    entityId: id,
    action: 'deleted',
  })
  return { ok: true }
}
