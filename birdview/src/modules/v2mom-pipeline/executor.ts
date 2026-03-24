import type { Company, Tenant } from '@prisma/client'

import {
  resolveCompanyByTenantName,
  resolveMissionControlLlmConfigByCompanyId,
  PromptBuilder,
} from './promptBuilder'
import { PipelineLogger } from './logger'
import { LlmClient } from './llmClient'
import { JsonParser } from './jsonParser'
import { ApiClient } from './apiClient'
import type { ExecutionContext, ExecutionResult, Metric, V2momDocument } from './types'

function createExecutionId() {
  return `exec-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function metricSignature(metric: Metric) {
  return JSON.stringify({
    name: metric.name,
    description: metric.description,
    unit_type: metric.unit_type,
    unit_label: metric.unit_label,
    period: metric.period,
    metric_type: metric.metric_type,
    value: metric.value,
    target: metric.target,
    suggested: metric.suggested,
  })
}

function createExecutionContext(tenant: Tenant, company: Company): ExecutionContext {
  return {
    correlation_id: createExecutionId(),
    execution_id: createExecutionId(),
    tenant_id: tenant.id,
    company_id: company.id,
    company_name: company.name,
    started_at: new Date().toISOString(),
  }
}

export async function runV2momPipelineByTenantName(tenantName: string): Promise<ExecutionResult> {
  const { tenant, company } = await resolveCompanyByTenantName(tenantName)
  const context = createExecutionContext(tenant, company)
  const logger = new PipelineLogger(context)

  await logger.info('pipeline_started', {
    step: 'pipeline_started',
    status: 'started',
    tenant_name: tenant.name,
    tenant_slug: tenant.slug,
  })

  try {
    const promptBuilder = new PromptBuilder(logger)
    const promptResult = await promptBuilder.build(company.id)
    const missionControlLlm = await resolveMissionControlLlmConfigByCompanyId(company.id)

    if (!missionControlLlm.endpoint.trim()) {
      throw new Error('Mission Control LLM configuration has no endpoint/baseUrl configured')
    }

    await logger.info('llm_config_resolved', {
      step: 'llm_config_resolved',
      status: 'ok',
      llm_source: 'mission_control',
      resolution_source: missionControlLlm.source,
      vertical_id: missionControlLlm.verticalId,
      vertical_llm_config_id: missionControlLlm.verticalLlmConfigId ?? null,
      vertical_llm_purpose: missionControlLlm.verticalLlmPurpose ?? null,
      provider_config_id: missionControlLlm.providerConfigId,
      provider_key: missionControlLlm.providerKey,
      provider_name: missionControlLlm.providerName,
      model_config_id: missionControlLlm.modelConfigId,
      model_key: missionControlLlm.modelKey,
      model_display_name: missionControlLlm.modelDisplayName,
      endpoint: missionControlLlm.endpoint,
      api_key_ref: missionControlLlm.apiKeyRef ?? null,
      has_api_key: Boolean(missionControlLlm.apiKey),
      has_system_prompt: Boolean(missionControlLlm.systemPrompt?.trim()),
    })

    const llmClient = new LlmClient(logger, {
      providerKey: missionControlLlm.providerKey,
      endpoint: missionControlLlm.endpoint,
      apiKey: missionControlLlm.apiKey,
      model: missionControlLlm.modelKey,
      temperature: missionControlLlm.temperature ?? 0,
      timeoutMs: process.env.LLM_TIMEOUT_MS ? Number(process.env.LLM_TIMEOUT_MS) : 60000,
      extraHeaders: missionControlLlm.extraHeaders,
      systemPrompt: missionControlLlm.systemPrompt ?? undefined,
    })
    const llmResponse = await llmClient.execute(promptResult.prompt)

    const parser = new JsonParser(logger)
    const document = await parser.parse(llmResponse.rawText)

    const apiClient = new ApiClient(logger, {
      baseUrl: process.env.V2MOM_API_BASE_URL ?? '',
      authToken: process.env.V2MOM_API_TOKEN,
      timeoutMs: process.env.V2MOM_API_TIMEOUT_MS ? Number(process.env.V2MOM_API_TIMEOUT_MS) : 15000,
      retryCount: process.env.V2MOM_API_RETRY_COUNT ? Number(process.env.V2MOM_API_RETRY_COUNT) : 2,
      retryDelayMs: process.env.V2MOM_API_RETRY_DELAY_MS ? Number(process.env.V2MOM_API_RETRY_DELAY_MS) : 500,
    })

    const result = await persistDocument(document, context, logger, apiClient)

    await logger.info('pipeline_completed', {
      step: 'pipeline_completed',
      status: 'ok',
      persisted_summary: {
        values: result.persisted.values.length,
        methods: result.persisted.methods.length,
        sub_methods: result.persisted.subMethods.length,
        actions: result.persisted.actions.length,
        metrics: result.persisted.metrics.length,
        obstacles: result.persisted.obstacles.length,
      },
    })

    return result
  } catch (error) {
    await logger.error('pipeline_failed', {
      step: 'pipeline_failed',
      status: 'error',
      root_cause: error instanceof Error ? error.message : String(error),
      error,
    })
    throw error
  }
}

async function persistDocument(
  document: V2momDocument,
  context: ExecutionContext,
  logger: PipelineLogger,
  apiClient: ApiClient,
): Promise<ExecutionResult> {
  const methodCodeToMethodId = new Map<string, string>()
  const subMethodCodeToSubMethodId = new Map<string, string>()
  const metricIdToPersistedId = new Map<string, string>()
  const metricIdToSignature = new Map<string, string>()
  const metricIdToSubMethodIds = new Map<string, Set<string>>()
  const metricIdToSubMethodCodes = new Map<string, Set<string>>()

  const persistedValues: ExecutionResult['persisted']['values'] = []
  const persistedMethods: ExecutionResult['persisted']['methods'] = []
  const persistedSubMethods: ExecutionResult['persisted']['subMethods'] = []
  const persistedActions: ExecutionResult['persisted']['actions'] = []
  const persistedMetrics: ExecutionResult['persisted']['metrics'] = []
  const persistedObstacles: ExecutionResult['persisted']['obstacles'] = []

  const vision = await apiClient.upsertVision({
    external_id: document.vision.id,
    company_id: context.company_id,
    text: document.vision.text,
    suggested: document.vision.suggested,
  })

  await logger.info('vision_persisted', {
    step: 'vision_persisted',
    status: 'ok',
    entity_id: vision.id,
    external_id: vision.externalId,
  })

  for (const value of document.values) {
    const result = await apiClient.upsertValue({
      external_id: value.id,
      company_id: context.company_id,
      text: value.text,
      suggested: value.suggested,
    })
    persistedValues.push(result)
    await logger.info('value_persisted', {
      step: 'value_persisted',
      status: 'ok',
      entity_id: result.id,
      external_id: result.externalId,
    })
  }

  for (const method of document.methods) {
    const methodResult = await apiClient.upsertMethod({
      external_id: method.id,
      company_id: context.company_id,
      code: method.code,
      title: method.title,
      objective: method.objective,
      owner_email: method.owner_email,
      suggested: method.suggested,
    })
    methodCodeToMethodId.set(method.code, methodResult.id)
    persistedMethods.push(methodResult)
    await logger.info('method_persisted', {
      step: 'method_persisted',
      status: 'ok',
      method_code: method.code,
      entity_id: methodResult.id,
    })

    const methodMetric = method.metrics[0]
    const methodMetricResult = await apiClient.upsertMetric({
      external_id: methodMetric.id,
      company_id: context.company_id,
      name: methodMetric.name,
      description: methodMetric.description,
      value: methodMetric.value,
      target: methodMetric.target,
      unit_type: methodMetric.unit_type,
      unit_label: methodMetric.unit_label,
      period: methodMetric.period,
      metric_type: methodMetric.metric_type,
      suggested: methodMetric.suggested,
      scope: 'method',
      method_id: methodResult.id,
      method_code: method.code,
    })
    metricIdToPersistedId.set(methodMetric.id, methodMetricResult.id)
    metricIdToSignature.set(methodMetric.id, metricSignature(methodMetric))
    persistedMetrics.push(methodMetricResult)
    await logger.info('method_metric_persisted', {
      step: 'method_metric_persisted',
      status: 'ok',
      method_code: method.code,
      metric_external_id: methodMetric.id,
      metric_id: methodMetricResult.id,
    })

    for (const subMethod of method.sub_methods) {
      const subMethodResult = await apiClient.upsertSubMethod({
        external_id: subMethod.id,
        company_id: context.company_id,
        method_id: methodResult.id,
        method_code: method.code,
        code: subMethod.code,
        title: subMethod.title,
        objective: subMethod.objective,
        owner_email: subMethod.owner_email,
        suggested: subMethod.suggested,
      })
      subMethodCodeToSubMethodId.set(subMethod.code, subMethodResult.id)
      persistedSubMethods.push(subMethodResult)
      await logger.info('sub_method_persisted', {
        step: 'sub_method_persisted',
        status: 'ok',
        sub_method_code: subMethod.code,
        entity_id: subMethodResult.id,
      })

      for (const metric of subMethod.metrics) {
        const signature = metricSignature(metric)
        const existingSignature = metricIdToSignature.get(metric.id)
        if (existingSignature && existingSignature !== signature) {
          throw new Error(`Shared metric "${metric.id}" was reused with a different definition`)
        }

        metricIdToSignature.set(metric.id, signature)

        if (!metricIdToSubMethodIds.has(metric.id)) {
          metricIdToSubMethodIds.set(metric.id, new Set())
          metricIdToSubMethodCodes.set(metric.id, new Set())
        }

        metricIdToSubMethodIds.get(metric.id)?.add(subMethodResult.id)
        metricIdToSubMethodCodes.get(metric.id)?.add(subMethod.code)

        const metricResult = await apiClient.upsertMetric({
          external_id: metric.id,
          company_id: context.company_id,
          name: metric.name,
          description: metric.description,
          value: metric.value,
          target: metric.target,
          unit_type: metric.unit_type,
          unit_label: metric.unit_label,
          period: metric.period,
          metric_type: metric.metric_type,
          suggested: metric.suggested,
          scope: 'sub_method',
          sub_method_ids: [...(metricIdToSubMethodIds.get(metric.id) ?? new Set<string>())],
          sub_method_codes: [...(metricIdToSubMethodCodes.get(metric.id) ?? new Set<string>())],
        })

        const sharedMetricAlreadySeen = metricIdToPersistedId.has(metric.id)
        metricIdToPersistedId.set(metric.id, metricResult.id)
        if (!sharedMetricAlreadySeen) {
          persistedMetrics.push(metricResult)
        }

        await logger.info('sub_method_metric_persisted', {
          step: 'sub_method_metric_persisted',
          status: 'ok',
          sub_method_code: subMethod.code,
          metric_external_id: metric.id,
          metric_id: metricResult.id,
          shared_metric: sharedMetricAlreadySeen,
          shared_sub_method_count: metricIdToSubMethodIds.get(metric.id)?.size ?? 0,
        })
      }

      for (const action of subMethod.actions) {
        const actionResult = await apiClient.upsertAction({
          external_id: action.id,
          company_id: context.company_id,
          sub_method_id: subMethodResult.id,
          sub_method_code: action.sub_method_code,
          title: action.title,
          description: action.description,
          owner_email: action.owner_email,
          due_date: action.due_date,
          status: action.status,
          suggested: action.suggested,
        })
        persistedActions.push(actionResult)
        await logger.info('action_persisted', {
          step: 'action_persisted',
          status: 'ok',
          sub_method_code: action.sub_method_code,
          action_external_id: action.id,
          action_id: actionResult.id,
        })
      }
    }
  }

  for (const obstacle of document.obstacles) {
    const relatedMethodIds = obstacle.related_method_codes
      .map((code) => methodCodeToMethodId.get(code))
      .filter((entry): entry is string => Boolean(entry))

    const obstacleResult = await apiClient.upsertObstacle({
      external_id: obstacle.id,
      company_id: context.company_id,
      text: obstacle.text,
      related_method_codes: obstacle.related_method_codes,
      related_method_ids: relatedMethodIds,
      suggested: obstacle.suggested,
    })
    persistedObstacles.push(obstacleResult)
    await logger.info('obstacle_persisted', {
      step: 'obstacle_persisted',
      status: 'ok',
      obstacle_external_id: obstacle.id,
      obstacle_id: obstacleResult.id,
    })
  }

  return {
    executionId: context.execution_id,
    tenantId: context.tenant_id,
    companyId: context.company_id,
    persisted: {
      vision,
      values: persistedValues,
      methods: persistedMethods,
      subMethods: persistedSubMethods,
      actions: persistedActions,
      metrics: persistedMetrics,
      obstacles: persistedObstacles,
    },
  }
}
