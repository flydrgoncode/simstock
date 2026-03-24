import type { Prisma } from '@prisma/client'

import { createAuditLog } from '../shared/audit'
import type { ExecutionContext, LogLevel } from './types'

type LogDetails = Record<string, unknown>

function sanitize(value: unknown): unknown {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
      cause: sanitize((value as Error & { cause?: unknown }).cause),
    }
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitize(entry))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        sanitize(entry),
      ]),
    )
  }

  if (typeof value === 'string' && value.length > 3000) {
    return `${value.slice(0, 3000)}... [truncated ${value.length - 3000} chars]`
  }

  return value
}

export class PipelineLogger {
  constructor(
    private readonly context: ExecutionContext,
    private readonly entityType = 'V2MOMPipelineExecution',
  ) {}

  child(partial: Partial<ExecutionContext>) {
    return new PipelineLogger(
      {
        ...this.context,
        ...partial,
      },
      this.entityType,
    )
  }

  async debug(event: string, details: LogDetails = {}) {
    await this.write('debug', event, details)
  }

  async info(event: string, details: LogDetails = {}) {
    await this.write('info', event, details)
  }

  async warn(event: string, details: LogDetails = {}) {
    await this.write('warn', event, details)
  }

  async error(event: string, details: LogDetails = {}) {
    await this.write('error', event, details)
  }

  private async write(level: LogLevel, event: string, details: LogDetails) {
    const sanitizedDetails = sanitize(details) as Record<string, unknown>
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      event,
      ...this.context,
      ...sanitizedDetails,
    }

    console.log(JSON.stringify(payload))

    await createAuditLog({
      tenantId: this.context.tenant_id,
      companyId: this.context.company_id,
      entityType: this.entityType,
      entityId: this.context.execution_id,
      action: event,
      payloadJson: payload as Prisma.InputJsonValue,
    })
  }
}
