import { z } from 'zod'

import { monthSchema, nullableStringSchema } from '../../lib/validation/common'

export const headcountCreateSchema = z.object({
  month: monthSchema,
  actualHeadcount: z.coerce.number().int().nonnegative(),
  forecastHeadcount: z.coerce.number().int().nonnegative(),
  targetHeadcount: z.coerce.number().int().nonnegative(),
  notes: nullableStringSchema,
})

export const headcountUpdateSchema = headcountCreateSchema.partial()
