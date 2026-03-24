import { z } from 'zod'

export const cuidSchema = z.string().cuid()
export const tenantIdParamSchema = z.object({ tenantId: cuidSchema })
export const idParamSchema = z.object({ id: z.string().min(1) })

export const monthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Expected month in YYYY-MM format')
  .transform((value) => new Date(`${value}-01T00:00:00.000Z`))

export const dateSchema = z.coerce.date()

export const nullableStringSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .nullish()
  .transform((value) => value ?? null)

export const optionalNullableStringSchema = z
  .union([z.string().trim().min(1).max(255), z.null()])
  .optional()

export const decimalInputSchema = z
  .union([z.number(), z.string()])
  .transform((value) => Number(value))
  .refine((value) => Number.isFinite(value), 'Expected a valid number')

export const booleanFromUnknownSchema = z.coerce.boolean()

export const jsonValueSchema: z.ZodType<unknown> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ])
)

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(500).optional(),
})
