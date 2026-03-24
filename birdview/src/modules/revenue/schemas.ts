import { z } from 'zod'

import {
  decimalInputSchema,
  monthSchema,
  nullableStringSchema,
} from '../../lib/validation/common'

export const revenueCreateSchema = z.object({
  month: monthSchema,
  actualRevenue: decimalInputSchema,
  forecastRevenue: decimalInputSchema,
  targetRevenue: decimalInputSchema,
  notes: nullableStringSchema,
})

export const revenueUpdateSchema = revenueCreateSchema.partial()
