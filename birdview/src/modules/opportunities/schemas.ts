import { OpportunityStatus } from '@prisma/client'
import { z } from 'zod'

import {
  cuidSchema,
  dateSchema,
  decimalInputSchema,
  nullableStringSchema,
  optionalNullableStringSchema,
} from '../../lib/validation/common'

export const salesStageCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  stageOrder: z.coerce.number().int().nonnegative(),
  defaultProbability: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .nullish()
    .transform((value) => value ?? null),
  isClosedWon: z.coerce.boolean().default(false),
  isClosedLost: z.coerce.boolean().default(false),
})

export const salesStageUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  stageOrder: z.coerce.number().int().nonnegative().optional(),
  defaultProbability: z.coerce
    .number()
    .int()
    .min(0)
    .max(100)
    .nullable()
    .optional(),
  isClosedWon: z.coerce.boolean().optional(),
  isClosedLost: z.coerce.boolean().optional(),
})

export const opportunityCreateSchema = z.object({
  customerId: z
    .union([cuidSchema, z.null()])
    .optional()
    .transform((value) => value ?? null),
  ownerId: z
    .union([cuidSchema, z.null()])
    .optional()
    .transform((value) => value ?? null),
  name: z.string().trim().min(2).max(160),
  stageId: cuidSchema,
  amount: decimalInputSchema,
  probability: z.coerce.number().int().min(0).max(100),
  expectedCloseDate: dateSchema.nullish().transform((value) => value ?? null),
  source: nullableStringSchema,
  status: z.nativeEnum(OpportunityStatus).default(OpportunityStatus.OPEN),
})

export const opportunityUpdateSchema = z.object({
  customerId: z.union([cuidSchema, z.null()]).optional(),
  ownerId: z.union([cuidSchema, z.null()]).optional(),
  name: z.string().trim().min(2).max(160).optional(),
  stageId: cuidSchema.optional(),
  amount: decimalInputSchema.optional(),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  expectedCloseDate: dateSchema.nullable().optional(),
  source: optionalNullableStringSchema,
  status: z.nativeEnum(OpportunityStatus).optional(),
})

export const stageEventCreateSchema = z.object({
  opportunityId: cuidSchema,
  fromStageId: z
    .union([cuidSchema, z.null()])
    .optional()
    .transform((value) => value ?? null),
  toStageId: cuidSchema,
  eventDate: dateSchema,
  changedById: z
    .union([cuidSchema, z.null()])
    .optional()
    .transform((value) => value ?? null),
})
