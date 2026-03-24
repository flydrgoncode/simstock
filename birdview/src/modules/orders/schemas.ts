import { OrderStatus } from '@prisma/client'
import { z } from 'zod'

import {
  cuidSchema,
  dateSchema,
  decimalInputSchema,
  nullableStringSchema,
  optionalNullableStringSchema,
} from '../../lib/validation/common'

export const orderCreateSchema = z.object({
  customerId: cuidSchema,
  orderNumber: nullableStringSchema,
  orderDate: dateSchema,
  amount: decimalInputSchema,
  status: z.nativeEnum(OrderStatus).default(OrderStatus.DRAFT),
  productLine: nullableStringSchema,
  notes: nullableStringSchema,
})

export const orderUpdateSchema = z.object({
  customerId: cuidSchema.optional(),
  orderNumber: optionalNullableStringSchema,
  orderDate: dateSchema.optional(),
  amount: decimalInputSchema.optional(),
  status: z.nativeEnum(OrderStatus).optional(),
  productLine: optionalNullableStringSchema,
  notes: optionalNullableStringSchema,
})
