export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type MetricUnitType = 'currency' | 'numeric' | 'percentage' | 'date'
export type MetricType = 'actual' | 'target' | 'progress'
export type ActionStatus = 'planned' | 'in_progress' | 'done' | 'blocked'

export interface CompanyRecord {
  id: string
  tenantId: string | null
  name: string
  descricao_de_negocio: string | null
  descricao_do_v2mom: string | null
}

export interface SkillRecord {
  id: string
  name: string
  prompt: string
}

export interface Vision {
  id: string
  text: string
  suggested: boolean
}

export interface ValueItem {
  id: string
  text: string
  suggested: boolean
}

export interface Obstacle {
  id: string
  text: string
  related_method_codes: string[]
  suggested: boolean
}

export interface Metric {
  id: string
  name: string
  description: string
  value: number | string | null
  target: number | string | null
  unit_type: MetricUnitType
  unit_label: string
  period: string | null
  metric_type: MetricType
  suggested: boolean
}

export interface ActionItem {
  id: string
  sub_method_code: string
  title: string
  description: string
  owner_email: string | null
  due_date: string | null
  status: ActionStatus
  suggested: boolean
}

export interface SubMethod {
  id: string
  method_code: string
  code: string
  title: string
  objective: string
  owner_email: string | null
  suggested: boolean
  metrics: Metric[]
  actions: ActionItem[]
}

export interface Method {
  id: string
  code: string
  title: string
  objective: string
  owner_email: string | null
  suggested: boolean
  metrics: [Metric]
  sub_methods: SubMethod[]
}

export interface V2momDocument {
  vision: Vision
  values: ValueItem[]
  obstacles: Obstacle[]
  methods: Method[]
}

export interface ExecutionContext {
  correlation_id: string
  execution_id: string
  tenant_id: string
  company_id: string
  company_name: string
  started_at: string
}

export interface PromptBuildResult {
  prompt: string
  company: CompanyRecord
  skill: SkillRecord
}

export interface LlmClientConfig {
  providerKey?: string
  endpoint: string
  apiKey?: string
  model: string
  temperature?: number
  timeoutMs?: number
  extraHeaders?: Record<string, string>
  systemPrompt?: string
}

export interface LlmResponse {
  rawText: string
  model: string
  status: number
  startedAt: string
  completedAt: string
  latencyMs: number
  responseId?: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
    totalTokens?: number
  }
}

export interface ApiClientConfig {
  baseUrl: string
  authToken?: string
  timeoutMs?: number
  retryCount?: number
  retryDelayMs?: number
}

export interface PersistedRef {
  id: string
  externalId: string
}

export interface ExecutionResult {
  executionId: string
  tenantId: string
  companyId: string
  persisted: {
    vision: PersistedRef
    values: PersistedRef[]
    methods: PersistedRef[]
    subMethods: PersistedRef[]
    actions: PersistedRef[]
    metrics: PersistedRef[]
    obstacles: PersistedRef[]
  }
}

export interface MissionControlLlmResolvedConfig {
  source: 'mission_control_vertical_override' | 'mission_control_default_model'
  companyId: string
  verticalId: string
  providerConfigId: string
  providerKey: string
  providerName: string
  modelConfigId: string
  modelKey: string
  modelDisplayName: string
  endpoint: string
  apiKey?: string
  apiKeyRef?: string | null
  temperature?: number
  maxTokens?: number | null
  extraHeaders?: Record<string, string>
  systemPrompt?: string | null
  verticalLlmConfigId?: string
  verticalLlmPurpose?: string | null
}

export class PipelineError extends Error {
  code: string
  details?: Record<string, unknown>

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>,
    cause?: unknown,
  ) {
    super(message)
    this.name = this.constructor.name
    this.code = code
    this.details = details
    if (cause !== undefined) {
      ;(this as Error & { cause?: unknown }).cause = cause
    }
  }
}

export class MissingSkillError extends PipelineError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super('MISSING_SKILL', message, details, cause)
  }
}

export class PromptBuildError extends PipelineError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super('PROMPT_BUILD_ERROR', message, details, cause)
  }
}

export class LLMExecutionError extends PipelineError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super('LLM_EXECUTION_ERROR', message, details, cause)
  }
}

export class JsonExtractionError extends PipelineError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super('JSON_EXTRACTION_ERROR', message, details, cause)
  }
}

export class JsonValidationError extends PipelineError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super('JSON_VALIDATION_ERROR', message, details, cause)
  }
}

export class ApiPersistenceError extends PipelineError {
  constructor(message: string, details?: Record<string, unknown>, cause?: unknown) {
    super('API_PERSISTENCE_ERROR', message, details, cause)
  }
}
