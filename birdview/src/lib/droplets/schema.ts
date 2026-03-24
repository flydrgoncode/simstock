import { z } from 'zod'

import {
  dropletEntities,
  dropletEntityConfigs,
  type DropletEntity,
} from './entities'
import {
  buildShadowSkillDefinitionV2FromReadonlyTable,
  readonlyFilterSchema,
  shadowSkillDefinitionV2Schema,
  shadowSkillV2CategorySchema as dropletCategorySchema,
  shadowSkillV2ModeSchema as dropletExecutionModeSchema,
  shadowSkillV2OutputTypeSchema as dropletOutputTypeSchema,
  type ShadowSkillDefinitionV2 as ShadowSkillDefinition,
} from '../../modules/droplets/schemas/shadowSkillV2'

export const dropletGenerationStatusSchema = z.enum([
  'draft',
  'generated',
  'validated',
  'error',
])

export const dropletSupportedEntities = [
  ...dropletEntities,
  'RevenueTarget',
  'RevenueSnapshot',
  'Opportunity',
  'OpportunityStage',
  'Account',
  'SalesOrder',
  'HeadcountSnapshot',
  'MarketingCampaign',
  'MarketingLead',
  'FunnelEvent',
] as const

export const dropletFilterOperatorSchema = readonlyFilterSchema.shape.operator

export const readonlyTableDropletDefinitionSchema = z.object({
  type: z.literal('readonly_table'),
  entity: z.enum(dropletEntities),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(z.string().min(1)).min(1),
  labels: z.record(z.string(), z.string()).optional(),
  hiddenFields: z.array(z.string()).optional(),
  defaultSort: z
    .object({
      field: z.string().min(1),
      direction: z.enum(['asc', 'desc']),
    })
    .optional(),
  defaultFilter: z.array(readonlyFilterSchema).optional(),
  grouping: z
    .object({
      field: z.string().min(1),
    })
    .optional(),
  summary: z
    .object({
      enabled: z.boolean(),
      fields: z.array(z.string()).optional(),
    })
    .optional(),
  placement: z.string().optional(),
})

export type ReadonlyTableDropletDefinition = z.infer<
  typeof readonlyTableDropletDefinitionSchema
>

export const shadowSkillDefinitionSchema = shadowSkillDefinitionV2Schema
export type { ShadowSkillDefinition }

export const dropletRunInputSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()])
)

export type DropletExecutionResult = {
  success: boolean
  summaryText: string
  blocks: Array<Record<string, unknown>>
  warnings: string[]
  errors: string[]
  debug: {
    mode: z.infer<typeof dropletExecutionModeSchema>
    dataSources: string[]
    selectedEntities: string[]
    transformsApplied: string[]
    outputBlocks: string[]
    writebackTarget: string | null
    validationResults: string[]
    inputParams?: Record<string, unknown>
    source?: 'dummy' | 'live'
    scenarioKey?: string | null
  }
  executionLog?: {
    mode: z.infer<typeof dropletExecutionModeSchema>
    dataSources: string[]
    selectedEntities: string[]
    transformsApplied: string[]
    outputBlocks: string[]
    writebackTarget: string | null
    validationResults: string[]
    inputParams?: Record<string, unknown>
    source?: 'dummy' | 'live'
    scenarioKey?: string | null
  }
}

export function buildDefaultReadonlyTableDropletDefinition(
  entity: DropletEntity,
  overrides?: Partial<ReadonlyTableDropletDefinition>
): ReadonlyTableDropletDefinition {
  const config = dropletEntityConfigs[entity]
  return {
    type: 'readonly_table',
    entity,
    title: `${config.label} explorer`,
    fields: [...config.defaultFields],
    labels: Object.fromEntries(
      config.fields.map((field) => [field.key, field.label])
    ),
    defaultSort: config.defaultSort,
    summary: {
      enabled: true,
      fields: config.fields
        .filter((field) =>
          ['currency', 'number', 'percentage'].includes(field.type)
        )
        .slice(0, 2)
        .map((field) => field.key),
    },
    ...overrides,
  }
}

export function buildShadowDefinitionFromReadonlyTable(
  definition: ReadonlyTableDropletDefinition,
  options?: {
    name?: string
    command?: string
    aliases?: string[]
    helpText?: string
    category?: z.infer<typeof dropletCategorySchema>
    mode?: z.infer<typeof dropletExecutionModeSchema>
    outputType?: z.infer<typeof dropletOutputTypeSchema>
    authorHintText?: string
    dummyScenario?: string
  }
): ShadowSkillDefinition {
  const summary = definition.summary
    ? {
        enabled: definition.summary.enabled,
        ...(definition.summary.fields ? { fields: definition.summary.fields } : {}),
      }
    : undefined

  return buildShadowSkillDefinitionV2FromReadonlyTable(
    {
      entity: definition.entity,
      title: definition.title,
      ...(definition.description ? { description: definition.description } : {}),
      fields: definition.fields,
      ...(definition.labels ? { labels: definition.labels } : {}),
      ...(definition.defaultFilter ? { defaultFilter: definition.defaultFilter } : {}),
      ...(definition.grouping ? { grouping: definition.grouping } : {}),
      ...(summary ? { summary } : {}),
    },
    options
  )
}

export function deriveReadonlyTableFromShadow(
  shadow: ShadowSkillDefinition,
  fallbackEntity?: DropletEntity
): ReadonlyTableDropletDefinition {
  const tableLikeBlock =
    shadow.presentation.blocks.find(
      (block) =>
        block.type === 'table' || block.type === 'editable_table'
    ) ?? null

  const firstEntity =
    (shadow.execution.dataSources.find((item): item is DropletEntity =>
      dropletEntities.includes(item as DropletEntity)
    ) as DropletEntity | undefined) ?? fallbackEntity ?? 'customers'

  const entityConfig = dropletEntityConfigs[firstEntity]
  const tableColumns =
    tableLikeBlock && 'columns' in tableLikeBlock ? tableLikeBlock.columns : []
  const fields =
    tableColumns.length > 0
      ? tableColumns.map((column) => column.key)
      : [...entityConfig.defaultFields]

  return {
    type: 'readonly_table',
    entity: firstEntity,
    title: shadow.identity.name,
    description: shadow.identity.description,
    fields,
    labels: Object.fromEntries(
      tableColumns.map((column) => [column.key, column.label])
    ),
    defaultFilter: shadow.logic.filters,
    grouping: shadow.logic.grouping ?? undefined,
    summary: {
      enabled:
        shadow.presentation.outputType === 'table' ||
        shadow.presentation.outputType === 'mixed',
      fields: fields.filter((field) =>
        ['currency', 'number', 'percentage'].includes(
          entityConfig.fields.find((item) => item.key === field)?.type ?? ''
        )
      ),
    },
    placement: firstEntity,
  }
}
