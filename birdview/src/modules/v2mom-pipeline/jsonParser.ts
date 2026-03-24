import type {
  ActionItem,
  Method,
  Metric,
  Obstacle,
  SubMethod,
  ValueItem,
  V2momDocument,
  Vision,
} from './types'
import { JsonExtractionError, JsonValidationError } from './types'
import { PipelineLogger } from './logger'

const ALLOWED_UNIT_TYPES = new Set(['currency', 'numeric', 'percentage', 'date'])
const ALLOWED_METRIC_TYPES = new Set(['actual', 'target', 'progress'])
const ALLOWED_ACTION_STATUS = new Set(['planned', 'in_progress', 'done', 'blocked'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function readString(value: unknown, field: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new JsonValidationError(`Field "${field}" must be a non-empty string`)
  }
  return value.trim()
}

function readNullableString(value: unknown, field: string) {
  if (value == null) return null
  if (typeof value !== 'string') {
    throw new JsonValidationError(`Field "${field}" must be string or null`)
  }
  const trimmed = value.trim()
  return trimmed || null
}

function readBoolean(value: unknown, field: string) {
  if (typeof value !== 'boolean') {
    throw new JsonValidationError(`Field "${field}" must be boolean`)
  }
  return value
}

function readStringArray(value: unknown, field: string) {
  if (!Array.isArray(value)) {
    throw new JsonValidationError(`Field "${field}" must be an array`)
  }
  return value.map((entry, index) => readString(entry, `${field}[${index}]`))
}

function readMetric(value: unknown, field: string): Metric {
  if (!isRecord(value)) {
    throw new JsonValidationError(`Field "${field}" must be an object`)
  }

  const unitType = readString(value.unit_type, `${field}.unit_type`)
  if (!ALLOWED_UNIT_TYPES.has(unitType)) {
    throw new JsonValidationError(`Unsupported unit_type "${unitType}" in "${field}"`)
  }

  const metricType = readString(value.metric_type, `${field}.metric_type`)
  if (!ALLOWED_METRIC_TYPES.has(metricType)) {
    throw new JsonValidationError(`Unsupported metric_type "${metricType}" in "${field}"`)
  }

  return {
    id: readString(value.id, `${field}.id`),
    name: readString(value.name, `${field}.name`),
    description: readString(value.description, `${field}.description`),
    value: (value.value as number | string | null | undefined) ?? null,
    target: (value.target as number | string | null | undefined) ?? null,
    unit_type: unitType as Metric['unit_type'],
    unit_label: typeof value.unit_label === 'string' ? value.unit_label.trim() : '',
    period: readNullableString(value.period, `${field}.period`),
    metric_type: metricType as Metric['metric_type'],
    suggested: readBoolean(value.suggested, `${field}.suggested`),
  }
}

function readAction(value: unknown, field: string): ActionItem {
  if (!isRecord(value)) {
    throw new JsonValidationError(`Field "${field}" must be an object`)
  }

  const status = readString(value.status, `${field}.status`)
  if (!ALLOWED_ACTION_STATUS.has(status)) {
    throw new JsonValidationError(`Unsupported status "${status}" in "${field}"`)
  }

  return {
    id: readString(value.id, `${field}.id`),
    sub_method_code: readString(value.sub_method_code, `${field}.sub_method_code`),
    title: readString(value.title, `${field}.title`),
    description: readString(value.description, `${field}.description`),
    owner_email: readNullableString(value.owner_email, `${field}.owner_email`),
    due_date: readNullableString(value.due_date, `${field}.due_date`),
    status: status as ActionItem['status'],
    suggested: readBoolean(value.suggested, `${field}.suggested`),
  }
}

function readSubMethod(value: unknown, field: string): SubMethod {
  if (!isRecord(value)) {
    throw new JsonValidationError(`Field "${field}" must be an object`)
  }

  if (!Array.isArray(value.metrics) || value.metrics.length < 1) {
    throw new JsonValidationError(`Field "${field}.metrics" must contain at least one metric`)
  }

  if (!Array.isArray(value.actions) || value.actions.length < 1) {
    throw new JsonValidationError(`Field "${field}.actions" must contain at least one action`)
  }

  return {
    id: readString(value.id, `${field}.id`),
    method_code: readString(value.method_code, `${field}.method_code`),
    code: readString(value.code, `${field}.code`),
    title: readString(value.title, `${field}.title`),
    objective: readString(value.objective, `${field}.objective`),
    owner_email: readNullableString(value.owner_email, `${field}.owner_email`),
    suggested: readBoolean(value.suggested, `${field}.suggested`),
    metrics: value.metrics.map((entry, index) => readMetric(entry, `${field}.metrics[${index}]`)),
    actions: value.actions.map((entry, index) => readAction(entry, `${field}.actions[${index}]`)),
  }
}

function readMethod(value: unknown, field: string): Method {
  if (!isRecord(value)) {
    throw new JsonValidationError(`Field "${field}" must be an object`)
  }

  if (!Array.isArray(value.metrics) || value.metrics.length !== 1) {
    throw new JsonValidationError(`Field "${field}.metrics" must contain exactly one metric`)
  }

  if (!Array.isArray(value.sub_methods) || value.sub_methods.length < 1) {
    throw new JsonValidationError(`Field "${field}.sub_methods" must contain at least one sub-method`)
  }

  return {
    id: readString(value.id, `${field}.id`),
    code: readString(value.code, `${field}.code`),
    title: readString(value.title, `${field}.title`),
    objective: readString(value.objective, `${field}.objective`),
    owner_email: readNullableString(value.owner_email, `${field}.owner_email`),
    suggested: readBoolean(value.suggested, `${field}.suggested`),
    metrics: [readMetric(value.metrics[0], `${field}.metrics[0]`)],
    sub_methods: value.sub_methods.map((entry, index) => readSubMethod(entry, `${field}.sub_methods[${index}]`)),
  }
}

function validateDocument(document: V2momDocument) {
  const methodCodes = new Set(document.methods.map((method) => method.code))
  const metricSignatures = new Map<string, string>()

  for (const method of document.methods) {
    for (const subMethod of method.sub_methods) {
      if (subMethod.method_code !== method.code) {
        throw new JsonValidationError(`Sub-method "${subMethod.code}" references method "${subMethod.method_code}" but belongs to "${method.code}"`)
      }

      for (const action of subMethod.actions) {
        if (action.sub_method_code !== subMethod.code) {
          throw new JsonValidationError(`Action "${action.id}" references sub-method "${action.sub_method_code}" but belongs to "${subMethod.code}"`)
        }
      }

      for (const metric of subMethod.metrics) {
        const signature = JSON.stringify({
          name: metric.name,
          description: metric.description,
          unit_type: metric.unit_type,
          unit_label: metric.unit_label,
          period: metric.period,
          metric_type: metric.metric_type,
        })
        const existing = metricSignatures.get(metric.id)
        if (existing && existing !== signature) {
          throw new JsonValidationError(`Shared metric "${metric.id}" was reused with a different definition`)
        }
        metricSignatures.set(metric.id, signature)
      }
    }
  }

  for (const obstacle of document.obstacles) {
    for (const code of obstacle.related_method_codes) {
      if (!methodCodes.has(code)) {
        throw new JsonValidationError(`Obstacle "${obstacle.id}" references unknown method code "${code}"`)
      }
    }
  }
}

export function extractJson(rawText: string) {
  const start = rawText.indexOf('{')
  if (start < 0) {
    throw new JsonExtractionError('No JSON object found in LLM response')
  }

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < rawText.length; index += 1) {
    const char = rawText[index]
    if (escaped) {
      escaped = false
      continue
    }
    if (char === '\\') {
      escaped = true
      continue
    }
    if (char === '"') {
      inString = !inString
      continue
    }
    if (inString) {
      continue
    }
    if (char === '{') depth += 1
    if (char === '}') depth -= 1
    if (depth === 0) {
      return rawText.slice(start, index + 1)
    }
  }

  throw new JsonExtractionError('Could not extract a complete JSON payload from response')
}

export class JsonParser {
  constructor(private readonly logger: PipelineLogger) {}

  async parse(rawText: string): Promise<V2momDocument> {
    try {
      const jsonText = extractJson(rawText)

      await this.logger.info('json_extracted', {
        step: 'json_extracted',
        status: 'ok',
        extracted_length: jsonText.length,
        extracted_preview: jsonText.slice(0, 1000),
      })

      const parsed = JSON.parse(jsonText) as unknown
      if (!isRecord(parsed)) {
        throw new JsonValidationError('Top-level JSON payload must be an object')
      }

      const document: V2momDocument = {
        vision: (() => {
          if (!isRecord(parsed.vision)) {
            throw new JsonValidationError('Field "vision" must be an object')
          }
          const vision = parsed.vision
          return {
            id: readString(vision.id, 'vision.id'),
            text: readString(vision.text, 'vision.text'),
            suggested: readBoolean(vision.suggested, 'vision.suggested'),
          } satisfies Vision
        })(),
        values: Array.isArray(parsed.values)
          ? parsed.values.map((entry, index) => {
              if (!isRecord(entry)) {
                throw new JsonValidationError(`Field "values[${index}]" must be an object`)
              }
              return {
                id: readString(entry.id, `values[${index}].id`),
                text: readString(entry.text, `values[${index}].text`),
                suggested: readBoolean(entry.suggested, `values[${index}].suggested`),
              } satisfies ValueItem
            })
          : (() => {
              throw new JsonValidationError('Field "values" must be an array')
            })(),
        obstacles: Array.isArray(parsed.obstacles)
          ? parsed.obstacles.map((entry, index) => {
              if (!isRecord(entry)) {
                throw new JsonValidationError(`Field "obstacles[${index}]" must be an object`)
              }
              return {
                id: readString(entry.id, `obstacles[${index}].id`),
                text: readString(entry.text, `obstacles[${index}].text`),
                related_method_codes: readStringArray(entry.related_method_codes ?? [], `obstacles[${index}].related_method_codes`),
                suggested: readBoolean(entry.suggested, `obstacles[${index}].suggested`),
              } satisfies Obstacle
            })
          : (() => {
              throw new JsonValidationError('Field "obstacles" must be an array')
            })(),
        methods: Array.isArray(parsed.methods)
          ? parsed.methods.map((entry, index) => readMethod(entry, `methods[${index}]`))
          : (() => {
              throw new JsonValidationError('Field "methods" must be an array')
            })(),
      }

      validateDocument(document)

      await this.logger.info('json_validated', {
        step: 'json_validated',
        status: 'ok',
        methods_count: document.methods.length,
        sub_methods_count: document.methods.reduce((sum, method) => sum + method.sub_methods.length, 0),
        actions_count: document.methods.reduce((sum, method) => sum + method.sub_methods.reduce((nested, subMethod) => nested + subMethod.actions.length, 0), 0),
        values_count: document.values.length,
        obstacles_count: document.obstacles.length,
      })

      return document
    } catch (error) {
      await this.logger.error('json_validation_failed', {
        step: 'json_validation',
        status: 'error',
        error,
      })

      if (error instanceof JsonExtractionError || error instanceof JsonValidationError) {
        throw error
      }

      throw new JsonValidationError('Failed to parse or validate JSON', undefined, error)
    }
  }
}
