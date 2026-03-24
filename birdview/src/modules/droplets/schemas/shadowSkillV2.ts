import { z } from 'zod'

import {
  dropletEntities,
  dropletEntityConfigs,
  type DropletEntity,
} from '../../../lib/droplets/entities'

export const shadowSkillV2CategorySchema = z.enum([
  'explorer',
  'analysis',
  'editor',
  'workflow',
])

export const shadowSkillV2ModeSchema = z.enum(['read', 'write', 'mixed'])

export const shadowSkillV2OutputTypeSchema = z.enum([
  'summary_text',
  'kpi_cards',
  'table',
  'chart',
  'editable_table',
  'form',
  'mixed',
])

export const canonicalDropletEntitySchema = z.enum([
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
] as const)

export const canonicalDropletEntities = canonicalDropletEntitySchema.options

export const commandSchema = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^\/[a-z0-9-]+$/)

export const commandAliasArraySchema = z
  .array(commandSchema)
  .default([])
  .refine((value) => new Set(value).size === value.length, 'Aliases must be unique.')

export const dropletFilterOperatorSchema = z.enum([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'in',
])

export const readonlyFilterSchema = z.object({
  field: z.string().min(1),
  operator: dropletFilterOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean()]),
})

const blockColumnSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum([
    'string',
    'number',
    'currency',
    'percentage',
    'date',
    'boolean',
  ]),
  editable: z.boolean().optional(),
})

const inputFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['string', 'number', 'currency', 'date', 'boolean']),
  required: z.boolean().optional(),
})

export const shadowSkillV2PresentationBlockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('summary_text'),
    title: z.string().optional(),
    template: z.string().optional(),
  }),
  z.object({
    type: z.literal('kpi_cards'),
    title: z.string().optional(),
    metrics: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    type: z.literal('table'),
    title: z.string().optional(),
    entity: canonicalDropletEntitySchema.optional(),
    columns: z.array(blockColumnSchema).min(1),
  }),
  z.object({
    type: z.literal('chart'),
    title: z.string().optional(),
    chartType: z.enum(['bar', 'line', 'comparison']).default('bar'),
    metric: z.string().min(1),
    x: z.string().min(1),
  }),
  z.object({
    type: z.literal('editable_table'),
    title: z.string().optional(),
    entity: canonicalDropletEntitySchema.optional(),
    columns: z.array(blockColumnSchema).min(1),
  }),
  z.object({
    type: z.literal('form'),
    title: z.string().optional(),
    fields: z.array(inputFieldSchema).min(1),
  }),
  z.object({
    type: z.literal('mixed'),
    title: z.string().optional(),
    blocks: z
      .array(
        z.union([
          z.object({
            type: z.literal('summary_text'),
            title: z.string().optional(),
            template: z.string().optional(),
          }),
          z.object({
            type: z.literal('kpi_cards'),
            title: z.string().optional(),
            metrics: z.array(z.string().min(1)).min(1),
          }),
          z.object({
            type: z.literal('table'),
            title: z.string().optional(),
            entity: canonicalDropletEntitySchema.optional(),
            columns: z.array(blockColumnSchema).min(1),
          }),
          z.object({
            type: z.literal('chart'),
            title: z.string().optional(),
            chartType: z.enum(['bar', 'line', 'comparison']).default('bar'),
            metric: z.string().min(1),
            x: z.string().min(1),
          }),
          z.object({
            type: z.literal('editable_table'),
            title: z.string().optional(),
            entity: canonicalDropletEntitySchema.optional(),
            columns: z.array(blockColumnSchema).min(1),
          }),
          z.object({
            type: z.literal('form'),
            title: z.string().optional(),
            fields: z.array(inputFieldSchema).min(1),
          }),
        ])
      )
      .min(1),
  }),
])

export const shadowSkillDefinitionV2Schema = z
  .object({
    identity: z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      category: shadowSkillV2CategorySchema,
    }),
    commandDefinition: z.object({
      command: commandSchema,
      aliases: commandAliasArraySchema,
      helpText: z.string().min(1),
    }),
    execution: z.object({
      mode: shadowSkillV2ModeSchema,
      dataSources: z.array(canonicalDropletEntitySchema).min(1),
      entityScope: z.enum(['company', 'vertical']),
      supportsDummyData: z.boolean().default(true),
    }),
    logic: z.object({
      operation: z.string().min(1),
      calculations: z.array(z.record(z.string(), z.unknown())).default([]),
      transforms: z.array(z.record(z.string(), z.unknown())).default([]),
      filters: z.array(readonlyFilterSchema).default([]),
      grouping: z
        .object({
          field: z.string().min(1),
        })
        .nullable()
        .default(null),
      timeDimension: z.string().nullable().optional(),
    }),
    presentation: z.object({
      outputType: shadowSkillV2OutputTypeSchema,
      blocks: z.array(shadowSkillV2PresentationBlockSchema).min(1),
    }),
    interaction: z.object({
      inputParams: z
        .array(
          z.object({
            name: z.string().min(1),
            type: z.enum(['string', 'number', 'boolean', 'date']),
            required: z.boolean().default(false),
          })
        )
        .default([]),
      draftSupported: z.boolean().default(false),
      confirmBeforeCommit: z.boolean().default(false),
    }),
    writeback: z.object({
      enabled: z.boolean(),
      entity: canonicalDropletEntitySchema.optional(),
      strategy: z.enum(['create', 'update', 'upsert', 'bulk_upsert']).optional(),
      allowedFields: z.array(z.string().min(1)).optional(),
      validationRules: z
        .array(
          z.object({
            field: z.string().min(1),
            rule: z.string().min(1),
          })
        )
        .default([]),
    }),
    preview: z.object({
      dummyScenario: z.string().optional(),
    }),
  })
  .superRefine((value, context) => {
    if (
      (value.execution.mode === 'write' || value.execution.mode === 'mixed') &&
      !value.writeback.enabled
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['writeback', 'enabled'],
        message: 'Write or mixed droplets require explicit writeback.',
      })
    }

    if (value.writeback.enabled) {
      if (!value.writeback.entity) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['writeback', 'entity'],
          message: 'Writeback entity is required when writeback is enabled.',
        })
      }
      if (!value.writeback.strategy) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['writeback', 'strategy'],
          message: 'Writeback strategy is required when writeback is enabled.',
        })
      }
    }
  })

export type ShadowSkillDefinitionV2 = z.infer<typeof shadowSkillDefinitionV2Schema>

export function buildShadowSkillDefinitionV2FromReadonlyTable(
  definition: {
    entity: DropletEntity
    title: string
    description?: string
    fields: string[]
    labels?: Record<string, string>
    defaultFilter?: Array<{
      field: string
      operator: z.infer<typeof dropletFilterOperatorSchema>
      value: string | number | boolean
    }>
    grouping?: { field: string }
    summary?: { enabled: boolean; fields?: string[] }
  },
  options?: {
    name?: string
    command?: string
    aliases?: string[]
    helpText?: string
    category?: z.infer<typeof shadowSkillV2CategorySchema>
    mode?: z.infer<typeof shadowSkillV2ModeSchema>
    outputType?: z.infer<typeof shadowSkillV2OutputTypeSchema>
    dummyScenario?: string
  }
): ShadowSkillDefinitionV2 {
  const config = dropletEntityConfigs[definition.entity]
  const presentationBlocks: ShadowSkillDefinitionV2['presentation']['blocks'] =
    options?.outputType === 'summary_text'
      ? [{ type: 'summary_text', title: definition.title }]
      : options?.outputType === 'kpi_cards'
        ? [
            {
              type: 'kpi_cards',
              title: definition.title,
              metrics: definition.summary?.fields?.length
                ? definition.summary.fields
                : definition.fields.slice(0, 3),
            },
          ]
        : [
            {
              type:
                options?.outputType === 'editable_table'
                  ? 'editable_table'
                  : 'table',
              entity: definition.entity,
              columns: definition.fields.map((field) => {
                const fieldConfig = config.fields.find((item) => item.key === field)
                return {
                  key: field,
                  label: definition.labels?.[field] ?? fieldConfig?.label ?? field,
                  type: fieldConfig?.type ?? 'string',
                  ...(options?.outputType === 'editable_table'
                    ? { editable: field !== definition.fields[0] }
                    : {}),
                }
              }),
            },
          ]

  const outputType = options?.outputType ?? 'table'

  return {
    identity: {
      name: options?.name ?? definition.title,
      description:
        definition.description ??
        `${config.label} droplet for curated company exploration.`,
      category: options?.category ?? 'explorer',
    },
    commandDefinition: {
      command: options?.command ?? '/explore',
      aliases: options?.aliases ?? [],
      helpText: options?.helpText ?? `Open ${definition.title}.`,
    },
    execution: {
      mode: options?.mode ?? 'read',
      dataSources: [definition.entity],
      entityScope: 'company',
      supportsDummyData: true,
    },
    logic: {
      operation: 'explore',
      calculations: [],
      transforms: [],
      filters: definition.defaultFilter ?? [],
      grouping: definition.grouping ?? null,
      timeDimension: definition.entity.includes('Snapshot') ? 'month' : null,
    },
    presentation: {
      outputType,
      blocks: presentationBlocks,
    },
    interaction: {
      inputParams: [],
      draftSupported: false,
      confirmBeforeCommit: false,
    },
    writeback: {
      enabled: outputType === 'editable_table' || options?.mode === 'write',
      ...(outputType === 'editable_table' || options?.mode === 'write'
        ? {
            entity: definition.entity,
            strategy: 'bulk_upsert' as const,
            allowedFields: definition.fields.filter(
              (field) => field !== definition.fields[0]
            ),
          }
        : {}),
      validationRules: [],
    },
    preview: {
      ...(options?.dummyScenario ? { dummyScenario: options.dummyScenario } : {}),
    },
  }
}
