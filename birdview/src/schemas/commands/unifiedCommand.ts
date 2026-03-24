import { z } from 'zod'

export const commandTargetSchema = z.object({
  scope: z.enum(['company', 'vertical']),
  refId: z.string().min(1),
})

export const unifiedCommandInputSchema = z.object({
  raw: z.string().trim().min(1),
  target: commandTargetSchema.optional(),
})

export const unifiedCommandArgumentSchema = z.object({
  key: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean()]),
})

export const unifiedCommandAstSchema = z.object({
  command: z.string().startsWith('/'),
  noun: z.string().min(1).optional(),
  args: z.array(unifiedCommandArgumentSchema),
  target: commandTargetSchema.optional(),
})

export const unifiedCommandParseResultSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('parsed'),
    ast: unifiedCommandAstSchema,
    warnings: z.array(z.string()).default([]),
  }),
  z.object({
    status: z.literal('unparsed'),
    reason: z.string().min(1),
    warnings: z.array(z.string()).default([]),
  }),
])

export type UnifiedCommandInput = z.infer<typeof unifiedCommandInputSchema>
export type UnifiedCommandAst = z.infer<typeof unifiedCommandAstSchema>
export type UnifiedCommandParseResult = z.infer<
  typeof unifiedCommandParseResultSchema
>
