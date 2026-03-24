import { z } from 'zod'

export const previewScenarioSchema = z.object({
  key: z.string().min(1),
  entity: z.string().min(1),
  scope: z.enum(['company', 'vertical']),
  rows: z.array(z.record(z.string(), z.unknown())).default([]),
})

export type PreviewScenario = z.infer<typeof previewScenarioSchema>
