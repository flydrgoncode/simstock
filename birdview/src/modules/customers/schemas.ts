import { CustomerStatus } from '@prisma/client'
import { z } from 'zod'

import {
  cuidSchema,
  nullableStringSchema,
  optionalNullableStringSchema,
} from '../../lib/validation/common'

export const customerCreateSchema = z.object({
  name: z.string().trim().min(2).max(140),
  segment: nullableStringSchema,
  geography: nullableStringSchema,
  industry: nullableStringSchema,
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.PROSPECT),
  ownerId: cuidSchema.nullish().transform((value) => value ?? null),
})

export const customerUpdateSchema = z.object({
  name: z.string().trim().min(2).max(140).optional(),
  segment: optionalNullableStringSchema,
  geography: optionalNullableStringSchema,
  industry: optionalNullableStringSchema,
  status: z.nativeEnum(CustomerStatus).optional(),
  ownerId: z.union([cuidSchema, z.null()]).optional(),
})
