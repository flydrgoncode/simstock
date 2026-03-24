import { Prisma } from '@prisma/client'

import { AppError } from './http'

export function asNumber(
  value: Prisma.Decimal | number | string | null | undefined
) {
  if (value == null) {
    return null
  }

  return Number(value)
}

export function ensureExists<T>(
  value: T | null,
  message: string,
  statusCode = 404
): T {
  if (!value) {
    throw new AppError(statusCode, message)
  }

  return value
}

export function toMonthString(value: Date) {
  return value.toISOString().slice(0, 7)
}
