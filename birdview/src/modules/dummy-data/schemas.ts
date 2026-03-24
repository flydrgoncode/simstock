import { z } from 'zod'

import { previewScenarioSchema } from '../../schemas/dummy-data'

export const dummyDataScenarioRowsSchema = z.object({
  rows: z.array(z.record(z.string(), z.unknown())).default([]),
})

export const dummyDataExecutionLogSchema = z.object({
  mode: z.enum(['read', 'write', 'mixed']),
  source: z.enum(['dummy', 'live']),
  scenarioKey: z.string().nullable(),
  dataSources: z.array(z.string()),
  selectedEntities: z.array(z.string()),
  transformsApplied: z.array(z.string()),
  outputBlocks: z.array(z.string()),
  writebackTarget: z.string().nullable(),
  validationResults: z.array(z.string()),
  inputParams: z.record(z.string(), z.unknown()),
})

export const resolvedPreviewScenarioSchema = previewScenarioSchema.extend({
  description: z.string().nullable().optional(),
})

export type DummyDataExecutionLog = z.infer<typeof dummyDataExecutionLogSchema>
export type ResolvedPreviewScenario = z.infer<typeof resolvedPreviewScenarioSchema>
