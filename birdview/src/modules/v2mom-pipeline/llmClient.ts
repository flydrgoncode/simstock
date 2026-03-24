import type { LlmClientConfig, LlmResponse } from './types'
import { LLMExecutionError } from './types'
import { PipelineLogger } from './logger'

function extractRawText(payload: unknown): string {
  if (typeof payload === 'string') {
    return payload
  }

  if (!payload || typeof payload !== 'object') {
    return ''
  }

  const record = payload as Record<string, unknown>

  if (typeof record.output_text === 'string') {
    return record.output_text
  }

  if (Array.isArray(record.content)) {
    const textContent = record.content
      .flatMap((entry) => {
        if (!entry || typeof entry !== 'object') {
          return []
        }
        const block = entry as Record<string, unknown>
        return typeof block.text === 'string' ? [block.text] : []
      })
      .join('\n')
      .trim()
    if (textContent) {
      return textContent
    }
  }

  if (Array.isArray(record.choices)) {
    const choice = record.choices[0] as Record<string, unknown> | undefined
    const message = choice?.message as Record<string, unknown> | undefined
    const content = message?.content
    if (typeof content === 'string') {
      return content
    }
  }

  if (typeof record.response === 'string') {
    return record.response
  }

  return ''
}

export class LlmClient {
  constructor(
    private readonly logger: PipelineLogger,
    private readonly config: LlmClientConfig,
  ) {}

  async execute(prompt: string): Promise<LlmResponse> {
    const startedAt = new Date()
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 60000)

    await this.logger.info('llm_request_started', {
      step: 'llm_request_started',
      status: 'started',
      model: this.config.model,
      request_timestamp: startedAt.toISOString(),
      prompt_length: prompt.length,
      has_system_prompt: Boolean(this.config.systemPrompt?.trim()),
      parsing_readiness: 'awaiting_response',
    })

    try {
      const normalizedProvider = this.config.providerKey?.trim().toLowerCase()
      const isAnthropic = normalizedProvider === 'anthropic'
      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          accept: 'application/json',
          ...(this.config.apiKey
            ? isAnthropic
              ? {
                  'x-api-key': this.config.apiKey,
                  'anthropic-version': '2023-06-01',
                }
              : { authorization: `Bearer ${this.config.apiKey}` }
            : {}),
          ...this.config.extraHeaders,
        },
        body: JSON.stringify({
          ...(isAnthropic
            ? {
                model: this.config.model,
                temperature: this.config.temperature ?? 0,
                max_tokens: 2048,
                ...(this.config.systemPrompt?.trim()
                  ? { system: this.config.systemPrompt.trim() }
                  : {}),
                messages: [{ role: 'user', content: prompt }],
              }
            : {
                model: this.config.model,
                temperature: this.config.temperature ?? 0,
                messages: [
                  ...(this.config.systemPrompt?.trim()
                    ? [{ role: 'system', content: this.config.systemPrompt.trim() }]
                    : []),
                  { role: 'user', content: prompt },
                ],
              }),
        }),
        signal: controller.signal,
      })

      const completedAt = new Date()
      const latencyMs = completedAt.getTime() - startedAt.getTime()
      const rawBody = await response.text()
      let parsedBody: unknown = rawBody
      try {
        parsedBody = rawBody ? JSON.parse(rawBody) : {}
      } catch {
        parsedBody = rawBody
      }

      if (!response.ok) {
        throw new LLMExecutionError('LLM request failed', {
          status: response.status,
          body_preview: rawBody.slice(0, 1200),
        })
      }

      const llmResponse: LlmResponse = {
        rawText: extractRawText(parsedBody),
        model: this.config.model,
        status: response.status,
        startedAt: startedAt.toISOString(),
        completedAt: completedAt.toISOString(),
        latencyMs,
        responseId: response.headers.get('x-request-id') ?? undefined,
        usage:
          parsedBody && typeof parsedBody === 'object' && 'usage' in parsedBody
            ? {
                inputTokens:
                  typeof (parsedBody as { usage?: { prompt_tokens?: unknown } }).usage?.prompt_tokens === 'number'
                    ? (parsedBody as { usage: { prompt_tokens: number } }).usage.prompt_tokens
                    : undefined,
                outputTokens:
                  typeof (parsedBody as { usage?: { completion_tokens?: unknown } }).usage?.completion_tokens === 'number'
                    ? (parsedBody as { usage: { completion_tokens: number } }).usage.completion_tokens
                    : undefined,
                totalTokens:
                  typeof (parsedBody as { usage?: { total_tokens?: unknown } }).usage?.total_tokens === 'number'
                    ? (parsedBody as { usage: { total_tokens: number } }).usage.total_tokens
                    : undefined,
              }
            : undefined,
      }

      await this.logger.info('llm_response_received', {
        step: 'llm_response_received',
        status: 'ok',
        model: llmResponse.model,
        request_timestamp: llmResponse.startedAt,
        response_timestamp: llmResponse.completedAt,
        latency_ms: llmResponse.latencyMs,
        response_length: llmResponse.rawText.length,
        provider_status: llmResponse.status,
        usage: llmResponse.usage,
        parsing_readiness: 'ready_for_json_extraction',
      })

      return llmResponse
    } catch (error) {
      await this.logger.error('llm_request_failed', {
        step: 'llm_request',
        status: 'error',
        model: this.config.model,
        endpoint: this.config.endpoint,
        error,
      })

      if (error instanceof LLMExecutionError) {
        throw error
      }

      throw new LLMExecutionError('Failed to execute LLM request', {
        endpoint: this.config.endpoint,
        model: this.config.model,
      }, error)
    } finally {
      clearTimeout(timeout)
    }
  }
}
