import type {
  ActionStatus,
  ApiClientConfig,
  Metric,
  PersistedRef,
} from './types'
import { ApiPersistenceError } from './types'
import { PipelineLogger } from './logger'

function summarizePayload(payload: Record<string, unknown>) {
  return {
    external_id: payload.external_id,
    company_id: payload.company_id,
    code: payload.code,
    title: payload.title,
    name: payload.name,
    method_code: payload.method_code,
    sub_method_code: payload.sub_method_code,
    scope: payload.scope,
  }
}

export class ApiClient {
  constructor(
    private readonly logger: PipelineLogger,
    private readonly config: ApiClientConfig,
  ) {}

  private async requestWithRetry(
    path: string,
    method: 'POST' | 'PUT',
    body: Record<string, unknown>,
    metadata: Record<string, unknown>,
  ) {
    const retryCount = this.config.retryCount ?? 2
    const retryDelayMs = this.config.retryDelayMs ?? 500
    let attempt = 0
    let lastError: unknown

    while (attempt <= retryCount) {
      attempt += 1
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 15000)

      try {
        await this.logger.debug('api_request_started', {
          step: 'api_request',
          status: 'started',
          path,
          method,
          attempt,
          ...metadata,
        })

        const response = await fetch(`${this.config.baseUrl.replace(/\/$/, '')}${path}`, {
          method,
          headers: {
            'content-type': 'application/json',
            accept: 'application/json',
            ...(this.config.authToken ? { authorization: `Bearer ${this.config.authToken}` } : {}),
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        const rawText = await response.text()
        let parsedBody: unknown = {}
        try {
          parsedBody = rawText ? JSON.parse(rawText) : {}
        } catch {
          parsedBody = { raw: rawText }
        }

        if (!response.ok) {
          throw new ApiPersistenceError('API request failed', {
            path,
            response_status: response.status,
            response_body_summary: parsedBody,
            attempt,
            ...metadata,
          })
        }

        await this.logger.info('api_request_succeeded', {
          step: 'api_request',
          status: 'ok',
          path,
          method,
          response_status: response.status,
          attempt,
          ...metadata,
        })

        return parsedBody as { id?: string; external_id?: string; created?: boolean }
      } catch (error) {
        lastError = error
        await this.logger.warn('api_request_retryable_failure', {
          step: 'api_request',
          status: attempt > retryCount ? 'failed' : 'retrying',
          path,
          method,
          attempt,
          retry_count: retryCount,
          error,
          ...metadata,
        })

        if (attempt > retryCount) {
          break
        }

        await new Promise((resolve) => setTimeout(resolve, retryDelayMs * attempt))
      } finally {
        clearTimeout(timeout)
      }
    }

    throw new ApiPersistenceError('API request failed after retries', metadata, lastError)
  }

  private async upsert(path: string, body: Record<string, unknown>, metadata: Record<string, unknown>): Promise<PersistedRef> {
    const response = await this.requestWithRetry(path, 'POST', body, {
      payload_summary: summarizePayload(body),
      ...metadata,
    })

    return {
      id: typeof response.id === 'string' ? response.id : String(body.external_id),
      externalId: typeof response.external_id === 'string' ? response.external_id : String(body.external_id),
    }
  }

  upsertVision(body: {
    external_id: string
    company_id: string
    text: string
    suggested: boolean
  }) {
    return this.upsert('/vision', body, {
      entity_type: 'vision',
      entity_code: body.external_id,
    })
  }

  upsertValue(body: {
    external_id: string
    company_id: string
    text: string
    suggested: boolean
  }) {
    return this.upsert('/values', body, {
      entity_type: 'value',
      entity_code: body.external_id,
    })
  }

  upsertMethod(body: {
    external_id: string
    company_id: string
    code: string
    title: string
    objective: string
    owner_email: string | null
    suggested: boolean
  }) {
    return this.upsert('/methods', body, {
      entity_type: 'method',
      entity_code: body.code,
    })
  }

  upsertSubMethod(body: {
    external_id: string
    company_id: string
    method_id: string
    method_code: string
    code: string
    title: string
    objective: string
    owner_email: string | null
    suggested: boolean
  }) {
    return this.upsert('/sub-methods', body, {
      entity_type: 'sub_method',
      entity_code: body.code,
    })
  }

  upsertAction(body: {
    external_id: string
    company_id: string
    sub_method_id: string
    sub_method_code: string
    title: string
    description: string
    owner_email: string | null
    due_date: string | null
    status: ActionStatus
    suggested: boolean
  }) {
    return this.upsert('/actions', body, {
      entity_type: 'action',
      entity_code: body.external_id,
    })
  }

  upsertMetric(body: {
    external_id: string
    company_id: string
    name: string
    description: string
    value: Metric['value']
    target: Metric['target']
    unit_type: Metric['unit_type']
    unit_label: string
    period: string | null
    metric_type: Metric['metric_type']
    suggested: boolean
    scope: 'method' | 'sub_method'
    method_id?: string
    method_code?: string
    sub_method_ids?: string[]
    sub_method_codes?: string[]
  }) {
    return this.upsert('/metrics', body, {
      entity_type: 'metric',
      entity_code: body.external_id,
    })
  }

  upsertObstacle(body: {
    external_id: string
    company_id: string
    text: string
    related_method_codes: string[]
    related_method_ids: string[]
    suggested: boolean
  }) {
    return this.upsert('/obstacles', body, {
      entity_type: 'obstacle',
      entity_code: body.external_id,
    })
  }
}
