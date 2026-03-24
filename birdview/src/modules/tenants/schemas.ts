import { TenantStatus } from '@prisma/client'
import { z } from 'zod'

import {
  cuidSchema,
  jsonValueSchema,
  nullableStringSchema,
} from '../../lib/validation/common'

export const tenantCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/),
  status: z.nativeEnum(TenantStatus).default(TenantStatus.ACTIVE),
  defaultCurrency: z.string().trim().min(3).max(3),
  defaultTimezone: z.string().trim().min(2).max(120),
})

export const tenantUpdateSchema = tenantCreateSchema.partial()

export const tenantSettingsSchema = z.object({
  configJson: jsonValueSchema,
})

export const tenantScopedPersonSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: nullableStringSchema,
  role: nullableStringSchema,
  department: nullableStringSchema,
  active: z.coerce.boolean().default(true),
})

export const personUpdateSchema = tenantScopedPersonSchema.partial()

export const tenantIdOnlySchema = z.object({
  tenantId: cuidSchema,
})
