import { Prisma } from '@prisma/client'

import { prisma } from '../../lib/db/prisma'
import { dropletEntities, dropletEntityConfigs, type DropletEntity } from '../../lib/droplets/entities'
import {
  buildDefaultReadonlyTableDropletDefinition,
  buildShadowDefinitionFromReadonlyTable,
  deriveReadonlyTableFromShadow,
  type DropletExecutionResult,
  type ShadowSkillDefinition,
  shadowSkillDefinitionSchema,
} from '../../lib/droplets/schema'
import { previewStoredDroplet, runShadowSkillPreview } from '../dummy-data'
import { AppError } from '../../server/http'
import { ensureExists } from '../../server/utils'
import { createAuditLog } from '../shared/audit'

function toNullableInputJson(value: Prisma.JsonValue | null | undefined) {
  if (typeof value === 'undefined' || value === null) {
    return Prisma.JsonNull
  }
  return value as Prisma.InputJsonValue | typeof Prisma.JsonNull
}

function normalizeAliases(value: Prisma.JsonValue | null | undefined) {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter((item): item is string => typeof item === 'string')
}

function parseJsonRecord(value: Prisma.JsonValue | null | undefined) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function parseShadow(value: Prisma.JsonValue | null | undefined) {
  return shadowSkillDefinitionSchema.safeParse(value)
}

function parseGenerationWarnings(value: Prisma.JsonValue | null | undefined) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }
  return []
}

function inferEntityFromHint(hint: string, supportedEntities: string[]): DropletEntity {
  const lower = hint.toLowerCase()
  const match = dropletEntities.find((entity) => lower.includes(entity.toLowerCase()))
  if (match) return match
  const mapped = supportedEntities.find((entity): entity is DropletEntity =>
    dropletEntities.includes(entity as DropletEntity)
  )
  if (mapped) return mapped
  if (lower.includes('pipeline')) return 'opportunities'
  if (lower.includes('revenue')) return 'revenueSnapshots'
  if (lower.includes('headcount')) return 'headcountSnapshots'
  if (lower.includes('customer')) return 'customers'
  if (lower.includes('order')) return 'orders'
  if (lower.includes('stage')) return 'salesStages'
  return 'customers'
}

function inferCategory(hint: string) {
  const lower = hint.toLowerCase()
  if (lower.includes('input') || lower.includes('edit') || lower.includes('enter')) {
    return 'editor' as const
  }
  if (lower.includes('compare') || lower.includes('variance') || lower.includes('analysis')) {
    return 'analysis' as const
  }
  if (lower.includes('workflow')) {
    return 'workflow' as const
  }
  return 'explorer' as const
}

function inferOutputType(hint: string, dropletType: string) {
  const lower = hint.toLowerCase()
  if (dropletType === 'EDITABLE_TABLE') return 'editable_table' as const
  if (dropletType === 'FORM') return 'form' as const
  if (dropletType === 'ANALYSIS_CARD') return 'mixed' as const
  if (dropletType === 'MIXED_OUTPUT') return 'mixed' as const
  if (lower.includes('chart') && lower.includes('table')) return 'mixed' as const
  if (lower.includes('chart')) return 'chart' as const
  return 'table' as const
}

function inferExecutionMode(hint: string, dropletType: string) {
  const lower = hint.toLowerCase()
  if (dropletType === 'EDITABLE_TABLE' || dropletType === 'FORM') return 'write' as const
  if (
    lower.includes('write') ||
    lower.includes('input') ||
    lower.includes('edit') ||
    lower.includes('target')
  ) {
    return 'write' as const
  }
  if (lower.includes('compare') || lower.includes('variance')) {
    return 'mixed' as const
  }
  return 'read' as const
}

function makeChartBlock(entity: DropletEntity, metric?: string) {
  const numericField =
    metric ??
    dropletEntityConfigs[entity].fields.find((field) =>
      ['currency', 'number', 'percentage'].includes(field.type)
    )?.key ??
    dropletEntityConfigs[entity].defaultFields[1] ??
    dropletEntityConfigs[entity].defaultFields[0]
  return {
    type: 'chart',
    title: `${dropletEntityConfigs[entity].label} trend`,
    chartType: 'bar' as const,
    metric: numericField,
    x: dropletEntityConfigs[entity].defaultFields[0] ?? 'name',
  } as const
}

function buildGeneratedShadowDefinition(droplet: {
  name: string
  description: string | null
  command: string
  commandAliasesJson: Prisma.JsonValue | null
  commandHelpText: string | null
  authorHintText: string | null
  dropletType: string
  supportedEntitiesJson: Prisma.JsonValue | null
  previewDummyDataConfigJson: Prisma.JsonValue | null
}) {
  const supportedEntities = normalizeAliases(droplet.supportedEntitiesJson)
  const hint = droplet.authorHintText?.trim() || droplet.description || droplet.name
  const entity = inferEntityFromHint(hint, supportedEntities)
  const category = inferCategory(hint)
  const executionMode = inferExecutionMode(hint, droplet.dropletType)
  const outputType = inferOutputType(hint, droplet.dropletType)
  const readonly = buildDefaultReadonlyTableDropletDefinition(entity, {
    title: droplet.name,
    description: droplet.description ?? undefined,
    placement: entity,
  })
  const dummyScenarioKey = parseJsonRecord(droplet.previewDummyDataConfigJson)
    .scenarioKey
  const shadow = buildShadowDefinitionFromReadonlyTable(readonly, {
    name: droplet.name,
    command: droplet.command,
    aliases: normalizeAliases(droplet.commandAliasesJson),
    helpText: droplet.commandHelpText ?? `Open ${droplet.name}.`,
    category,
    mode: executionMode,
    outputType,
    ...(typeof dummyScenarioKey === 'string'
      ? { dummyScenario: dummyScenarioKey }
      : {}),
  })

  if (outputType === 'mixed') {
    shadow.presentation.blocks = [
      {
        type: 'summary_text',
        title: 'Summary',
      },
      {
        type: 'kpi_cards',
        title: 'Key metrics',
        metrics:
          readonly.summary?.fields && readonly.summary.fields.length > 0
            ? readonly.summary.fields
            : readonly.fields.slice(0, 2),
      },
      shadow.presentation.blocks[0],
      makeChartBlock(entity),
    ] as ShadowSkillDefinition['presentation']['blocks']
  } else if (outputType === 'chart') {
    shadow.presentation.blocks = [
      makeChartBlock(entity),
    ] as ShadowSkillDefinition['presentation']['blocks']
  } else if (outputType === 'editable_table') {
    shadow.presentation.blocks = [
      {
        type: 'editable_table',
        title: droplet.name,
        entity,
        columns: readonly.fields.map((field) => {
          const cfg = dropletEntityConfigs[entity].fields.find((item) => item.key === field)
          return {
            key: field,
            label: readonly.labels?.[field] ?? cfg?.label ?? field,
            type: cfg?.type ?? 'string',
            editable: field !== readonly.fields[0],
          }
        }),
      },
      {
        type: 'chart',
        title: 'Preview',
        chartType: 'bar',
        metric:
          readonly.summary?.fields?.[0] ??
          readonly.fields.find((field) =>
            ['actualRevenue', 'targetRevenue', 'amount'].includes(field)
          ) ??
          readonly.fields[1] ??
          readonly.fields[0],
        x: readonly.fields[0] ?? 'month',
      },
    ] as ShadowSkillDefinition['presentation']['blocks']
    shadow.interaction.inputParams = [{ name: 'year', type: 'number', required: true }]
    shadow.interaction.draftSupported = true
    shadow.writeback = {
      enabled: true,
      entity: 'RevenueTarget',
      strategy: 'bulk_upsert',
      allowedFields: ['month', 'targetRevenue'],
      validationRules: [{ field: 'targetRevenue', rule: 'non_negative' }],
    }
    shadow.preview.dummyScenario = 'default_revenue_targets_year'
  }

  return shadow
}

async function assertCommandSpace(
  verticalId: string,
  command: string,
  aliases: string[],
  currentDropletId?: string
) {
  const droplets = await prisma.verticalDroplet.findMany({
    where: { verticalId, ...(currentDropletId ? { NOT: { id: currentDropletId } } : {}) },
  })
  const taken = new Set<string>()
  for (const droplet of droplets) {
    taken.add(droplet.command)
    for (const alias of normalizeAliases(droplet.commandAliasesJson)) {
      taken.add(alias)
    }
  }
  if (taken.has(command)) {
    throw new AppError(400, `Command collision detected for ${command}.`)
  }
  const duplicateAlias = aliases.find((alias) => taken.has(alias))
  if (duplicateAlias) {
    throw new AppError(400, `Command alias collision detected for ${duplicateAlias}.`)
  }
}

async function snapshotVerticalDropletVersion(verticalDropletId: string) {
  const droplet = ensureExists(
    await prisma.verticalDroplet.findUnique({ where: { id: verticalDropletId } }),
    'Droplet not found'
  )
  if (!droplet.shadowSkillDefinitionJson) {
    return null
  }
  return prisma.verticalDropletVersion.upsert({
    where: {
      verticalDropletId_version: {
        verticalDropletId,
        version: droplet.version,
      },
    },
    update: {
      shadowSkillDefinitionJson: droplet.shadowSkillDefinitionJson,
      authorHintText: droplet.authorHintText,
      generationPromptVersion: droplet.generationPromptVersion,
      ...(typeof droplet.generationWarningsJson !== 'undefined'
        ? {
            generationWarningsJson: toNullableInputJson(
              droplet.generationWarningsJson
            ),
          }
        : {}),
      statusSnapshot: droplet.status,
    },
    create: {
      verticalDropletId,
      version: droplet.version,
      shadowSkillDefinitionJson: droplet.shadowSkillDefinitionJson,
      authorHintText: droplet.authorHintText,
      generationPromptVersion: droplet.generationPromptVersion,
      ...(typeof droplet.generationWarningsJson !== 'undefined'
        ? {
            generationWarningsJson: toNullableInputJson(
              droplet.generationWarningsJson
            ),
          }
        : {}),
      statusSnapshot: droplet.status,
    },
  })
}

export async function getDropletStudioOverview() {
  const [verticals, droplets] = await Promise.all([
    prisma.vertical.findMany({ orderBy: { name: 'asc' } }),
    prisma.verticalDroplet.findMany({ include: { vertical: true } }),
  ])

  return {
    totalsByVertical: verticals.map((vertical) => {
      const matches = droplets.filter((droplet) => droplet.verticalId === vertical.id)
      return {
        verticalId: vertical.id,
        verticalName: vertical.name,
        total: matches.length,
        draft: matches.filter((item) => item.status === 'DRAFT').length,
        published: matches.filter((item) => item.status === 'PUBLISHED').length,
        deprecated: matches.filter((item) => item.status === 'DEPRECATED').length,
      }
    }),
    statusCounts: {
      draft: droplets.filter((item) => item.status === 'DRAFT').length,
      published: droplets.filter((item) => item.status === 'PUBLISHED').length,
      deprecated: droplets.filter((item) => item.status === 'DEPRECATED').length,
    },
    commandCoverage: {
      total: droplets.length,
      withCommand: droplets.filter((item) => item.command.startsWith('/')).length,
    },
    validationWarnings: droplets.filter(
      (item) => parseGenerationWarnings(item.generationWarningsJson).length > 0
    ).length,
  }
}

export async function listCatalogDroplets() {
  return prisma.verticalDroplet.findMany({
    where: { status: 'PUBLISHED' },
    include: { vertical: true },
    orderBy: [{ vertical: { name: 'asc' } }, { name: 'asc' }],
  })
}

export async function getVerticalDropletById(id: string) {
  return ensureExists(
    await prisma.verticalDroplet.findUnique({
      where: { id },
      include: { vertical: true, versions: { orderBy: { version: 'desc' } } },
    }),
    'Droplet not found'
  )
}

export async function listVerticalDropletVersions(id: string) {
  return prisma.verticalDropletVersion.findMany({
    where: { verticalDropletId: id },
    orderBy: { version: 'desc' },
  })
}

export async function listPromptTemplates() {
  return prisma.promptTemplate.findMany({
    include: { vertical: true },
    orderBy: [{ key: 'asc' }, { version: 'desc' }],
  })
}

export async function createPromptTemplate(data: Prisma.PromptTemplateUncheckedCreateInput) {
  const template = await prisma.promptTemplate.create({ data })
  await createAuditLog({
    entityType: 'PromptTemplate',
    entityId: template.id,
    action: 'created',
    payloadJson: { key: template.key, version: template.version },
  })
  return template
}

export async function updatePromptTemplate(id: string, data: Prisma.PromptTemplateUpdateInput) {
  const template = await prisma.promptTemplate.update({ where: { id }, data })
  await createAuditLog({
    entityType: 'PromptTemplate',
    entityId: id,
    action: 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return template
}

export async function deletePromptTemplate(id: string) {
  await prisma.promptTemplate.delete({ where: { id } })
  await createAuditLog({ entityType: 'PromptTemplate', entityId: id, action: 'deleted' })
  return { ok: true }
}

export async function listDummyDataScenarios() {
  return prisma.dummyDataScenario.findMany({
    include: { vertical: true },
    orderBy: [{ entity: 'asc' }, { key: 'asc' }],
  })
}

export async function createDummyDataScenario(data: Prisma.DummyDataScenarioUncheckedCreateInput) {
  const scenario = await prisma.dummyDataScenario.create({ data })
  await createAuditLog({
    entityType: 'DummyDataScenario',
    entityId: scenario.id,
    action: 'created',
    payloadJson: { key: scenario.key, entity: scenario.entity },
  })
  return scenario
}

export async function updateDummyDataScenario(id: string, data: Prisma.DummyDataScenarioUpdateInput) {
  const scenario = await prisma.dummyDataScenario.update({ where: { id }, data })
  await createAuditLog({
    entityType: 'DummyDataScenario',
    entityId: id,
    action: 'updated',
    payloadJson: data as Prisma.InputJsonValue,
  })
  return scenario
}

export async function deleteDummyDataScenario(id: string) {
  await prisma.dummyDataScenario.delete({ where: { id } })
  await createAuditLog({ entityType: 'DummyDataScenario', entityId: id, action: 'deleted' })
  return { ok: true }
}

export async function generateVerticalDroplet(id: string) {
  const droplet = await getVerticalDropletById(id)
  const promptTemplate = await prisma.promptTemplate.findFirst({
    where: {
      OR: [{ verticalId: droplet.verticalId }, { verticalId: null }],
      status: 'ACTIVE',
    },
    orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
  })
  const generated = buildGeneratedShadowDefinition({
    name: droplet.name,
    description: droplet.description,
    command: droplet.command,
    commandAliasesJson: droplet.commandAliasesJson,
    commandHelpText: droplet.commandHelpText,
    authorHintText: droplet.authorHintText,
    dropletType: droplet.dropletType,
    supportedEntitiesJson: droplet.supportedEntitiesJson,
    previewDummyDataConfigJson: droplet.previewDummyDataConfigJson,
  })
  const warnings: string[] = []
  if (!droplet.authorHintText) {
    warnings.push('Author hint text was empty, so generation used the droplet name and description.')
  }
  const readonly = deriveReadonlyTableFromShadow(generated)
  const updated = await prisma.verticalDroplet.update({
    where: { id },
    data: {
      shadowSkillDefinitionJson: generated as Prisma.InputJsonValue,
      dropletDefinitionJson: readonly as Prisma.InputJsonValue,
      generationPromptVersion: promptTemplate ? `${promptTemplate.key}@v${promptTemplate.version}` : 'built-in@v1',
      generationStatus: 'generated',
      generationWarningsJson: warnings as Prisma.InputJsonValue,
    },
  })
  await snapshotVerticalDropletVersion(id)
  await createAuditLog({
    entityType: 'VerticalDroplet',
    entityId: id,
    action: 'generated',
    payloadJson: { generationPromptVersion: updated.generationPromptVersion, warnings },
  })
  return updated
}

export async function validateVerticalDroplet(id: string) {
  const droplet = await getVerticalDropletById(id)
  await assertCommandSpace(
    droplet.verticalId,
    droplet.command,
    normalizeAliases(droplet.commandAliasesJson),
    droplet.id
  )
  const warnings: string[] = []
  const parsedShadow = parseShadow(droplet.shadowSkillDefinitionJson)
  if (!parsedShadow.success) {
    await prisma.verticalDroplet.update({
      where: { id },
      data: {
        generationStatus: 'error',
        generationWarningsJson: parsedShadow.error.issues.map((issue) => issue.message) as Prisma.InputJsonValue,
      },
    })
    throw new AppError(400, parsedShadow.error.issues.map((issue) => issue.message).join('; '))
  }
  if (parsedShadow.data.commandDefinition.command !== droplet.command) {
    warnings.push('Primary command in shadow definition does not match droplet metadata.')
  }
  if (
    parsedShadow.data.execution.mode !== 'read' &&
    !parsedShadow.data.writeback.enabled
  ) {
    warnings.push('Write or mixed droplets should define explicit writeback behavior.')
  }
  const updated = await prisma.verticalDroplet.update({
    where: { id },
    data: {
      generationStatus: 'validated',
      generationWarningsJson: warnings as Prisma.InputJsonValue,
      dropletDefinitionJson: deriveReadonlyTableFromShadow(parsedShadow.data) as Prisma.InputJsonValue,
    },
  })
  await snapshotVerticalDropletVersion(id)
  return {
    droplet: updated,
    warnings,
    valid: true,
  }
}

export async function runShadowSkillDefinition(
  tenantId: string,
  shadow: ShadowSkillDefinition,
  options?: { dummyScenarioKey?: string | null; inputParams?: Record<string, unknown> }
): Promise<DropletExecutionResult> {
  return runShadowSkillPreview(tenantId, shadow, options)
}

export async function previewVerticalDroplet(
  id: string,
  tenantId: string,
  options?: { dummyScenarioKey?: string | null; inputParams?: Record<string, unknown> }
) {
  return previewStoredDroplet(id, tenantId, options)
}

export async function runVerticalDroplet(
  id: string,
  tenantId: string,
  options?: { dummyScenarioKey?: string | null; inputParams?: Record<string, unknown> }
) {
  return previewVerticalDroplet(id, tenantId, options)
}

export async function canPublishDroplet(id: string) {
  const droplet = await getVerticalDropletById(id)
  const parsed = parseShadow(droplet.shadowSkillDefinitionJson)
  if (!parsed.success) {
    throw new AppError(400, 'Shadow skill definition is invalid.')
  }
  await assertCommandSpace(
    droplet.verticalId,
    droplet.command,
    normalizeAliases(droplet.commandAliasesJson),
    droplet.id
  )
  if (droplet.generationStatus === 'error') {
    throw new AppError(400, 'Droplet generation status is error.')
  }
  const preview = await runShadowSkillDefinition(
    ensureExists(await prisma.tenant.findFirst({ orderBy: { createdAt: 'asc' } }), 'Missing tenant').id,
    parsed.data,
    (() => {
      const scenarioKey =
        (parseJsonRecord(droplet.previewDummyDataConfigJson).scenarioKey as
          | string
          | undefined) ?? parsed.data.preview.dummyScenario

      return scenarioKey ? { dummyScenarioKey: scenarioKey } : {}
    })()
  )
  if (!preview.success) {
    throw new AppError(400, 'Droplet preview did not complete successfully.')
  }
}
