import { z } from 'zod'

export const dropletCategorySchema = z.enum([
  'explorer',
  'analysis',
  'editor',
  'workflow',
])

export const dropletExecutionModeSchema = z.enum(['read', 'write', 'mixed'])

export const dropletOutputTypeSchema = z.enum([
  'text',
  'list',
  'chart',
  'table',
  'editable_table',
  'form',
  'mixed',
])

export const dropletIdentitySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: dropletCategorySchema,
  command: z.string().startsWith('/'),
  aliases: z.array(z.string().startsWith('/')).default([]),
  helpText: z.string().min(1),
})

export const dropletExecutionSchema = z.object({
  mode: dropletExecutionModeSchema,
  dataSources: z.array(z.string()).default([]),
  entityScope: z.enum(['company', 'vertical']),
  supportsDummyData: z.boolean().default(true),
})

export const dropletShadowSkillDefinitionSchema = z.object({
  identity: dropletIdentitySchema,
  execution: dropletExecutionSchema,
  logic: z.record(z.string(), z.unknown()).default({}),
  presentation: z.record(z.string(), z.unknown()).default({}),
  interaction: z.record(z.string(), z.unknown()).default({}),
  writeback: z.record(z.string(), z.unknown()).default({}),
  preview: z.record(z.string(), z.unknown()).default({}),
})

export type DropletShadowSkillDefinition = z.infer<
  typeof dropletShadowSkillDefinitionSchema
>
