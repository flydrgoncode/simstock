import { RecordStatus } from '@prisma/client'

import { prisma } from '../../lib/db/prisma'
import { ensureExists } from '../../server/utils'
import type {
  CompanyRecord,
  MissionControlLlmResolvedConfig,
  PromptBuildResult,
  SkillRecord,
} from './types'
import { MissingSkillError, PromptBuildError } from './types'
import { PipelineLogger } from './logger'

export const V2MOM_JSON_GENERATION_PROMPT = `BEGIN V2MOM_JSON_GENERATION_PROMPT

You are a structured V2MOM modeling assistant.

Your task is to transform the input text below into a complete, high-quality, execution-ready V2MOM structure and return only valid JSON.

The output JSON will be used to create or update entities in a system via APIs and must be ready for database persistence.

MODE OF OPERATION:
You must operate in a hybrid mode:
1) Extract what exists explicitly in the text
2) Infer what is implicit but clear
3) Complete what is missing using benchmark best practices

You must always produce a complete and coherent V2MOM, even if the source text is incomplete or weak.

When adding inferred or benchmarked content:
- Do NOT invent unsupported company-specific facts
- Do NOT fabricate precise numeric values unless present
- Use null for unknown values
- Mark all inferred or benchmarked elements with "suggested": true

GENERAL RULES:
- Be precise, structured, and concise
- Normalize to clear executive-level English
- Avoid duplication
- Ensure logical consistency:
  - Methods support the Vision
  - Sub-methods operationalize Methods
  - Actions operationalize Sub-methods
  - Metrics measure Methods or Sub-methods
- Titles must be short and business-ready
- Output must be valid JSON only
- No prose outside JSON

V2MOM STRUCTURE RULES:

1) Vision
- Exactly one
- Clear, ambitious, and time-aware if possible

2) Values
- Behavioral principles

3) Obstacles
- Real execution risks
- Link to methods using method codes

METHOD RULES:
- A Method is a strategic execution theme
- Each Method must have:
  - id
  - code (M1, M2, ...)
  - title
  - objective
  - owner_email (optional)
  - suggested
  - exactly 1 metric
  - at least 1 sub-method

SUB-METHOD RULES:
- A Sub-method is an execution block inside a Method
- Must belong to one method
- Must have:
  - id
  - method_code
  - code (M1.S1, etc.)
  - title
  - objective
  - owner_email (optional)
  - suggested
  - at least 1 action
  - at least 1 metric

ACTION RULES:
- Actions are operational tasks
- Must belong to a sub-method
- Must have:
  - id
  - sub_method_code
  - title
  - description
  - owner_email (optional)
  - due_date (YYYY-MM-DD or null)
  - status
  - suggested

Allowed status:
- planned
- in_progress
- done
- blocked

METRIC RULES:
- Metrics can belong to:
  - a method (mandatory: exactly 1 per method)
  - sub-methods (1 or more per sub-method)
- Metrics must NOT belong to actions

Each metric must have:
- id
- name
- description
- value (null if unknown)
- target (null if unknown)
- unit_type
- unit_label
- period
- metric_type
- suggested

Allowed unit_type:
- currency
- numeric
- percentage
- date

Allowed metric_type:
- actual
- target
- progress

SHARED METRICS RULE:
- Sub-method metrics may be shared across multiple sub-methods
- When shared:
  - reuse the same metric id
  - reuse identical definition
- Only share metrics when they represent a real shared outcome

BENCHMARK COMPLETION RULE:
If the input is incomplete:
- Add missing:
  - methods
  - sub-methods
  - actions
  - metrics
  - values
  - obstacles
  - improved vision
- All such elements must have:
  "suggested": true

NAMING & ID RULES:
- Method codes: M1, M2, M3...
- Sub-method codes: M1.S1, M1.S2...
- IDs must be unique (except shared metric reuse)
- Titles must not be empty
- Do not use placeholders like "TBD"

OUTPUT FORMAT (STRICT):

{
  "vision": {
    "id": "",
    "text": "",
    "suggested": false
  },
  "values": [
    {
      "id": "",
      "text": "",
      "suggested": false
    }
  ],
  "obstacles": [
    {
      "id": "",
      "text": "",
      "related_method_codes": [],
      "suggested": false
    }
  ],
  "methods": [
    {
      "id": "",
      "code": "",
      "title": "",
      "objective": "",
      "owner_email": null,
      "suggested": false,
      "metrics": [
        {
          "id": "",
          "name": "",
          "description": "",
          "value": null,
          "target": null,
          "unit_type": "numeric",
          "unit_label": "",
          "period": null,
          "metric_type": "actual",
          "suggested": false
        }
      ],
      "sub_methods": [
        {
          "id": "",
          "method_code": "",
          "code": "",
          "title": "",
          "objective": "",
          "owner_email": null,
          "suggested": false,
          "metrics": [
            {
              "id": "",
              "name": "",
              "description": "",
              "value": null,
              "target": null,
              "unit_type": "numeric",
              "unit_label": "",
              "period": null,
              "metric_type": "actual",
              "suggested": false
            }
          ],
          "actions": [
            {
              "id": "",
              "sub_method_code": "",
              "title": "",
              "description": "",
              "owner_email": null,
              "due_date": null,
              "status": "planned",
              "suggested": false
            }
          ]
        }
      ]
    }
  ]
}

VALIDATION CONSTRAINTS:
- return only valid JSON
- do not include prose outside JSON
- do not create orphan sub-methods
- do not create orphan actions
- do not use unsupported unit_type values
- do not use unsupported status values
- do not leave required titles blank
- every method must have exactly 1 metric
- every sub-method must have at least 1 action
- every sub-method must have at least 1 metric
- shared sub-method metrics must reuse the same id and same definition
- use null instead of guessing unsupported values
- if the source text is weak, still produce a complete, benchmark-improved V2MOM model

FINAL SELF-CHECK BEFORE OUTPUT:
- Is the JSON valid?
- Does every method have exactly 1 metric?
- Does every sub-method belong to an existing method?
- Does every sub-method have at least 1 action?
- Does every sub-method have at least 1 metric?
- Does every action belong to an existing sub-method?
- Are suggested benchmarked additions flagged correctly?
- Are shared metrics reused consistently when appropriate?
- Is the structure ready for database persistence and API creation/update flows?

Return only JSON.

END V2MOM_JSON_GENERATION_PROMPT`

function readCompanyText(metadataJson: unknown, key: string, fallbackKeys: string[] = []) {
  if (!metadataJson || typeof metadataJson !== 'object' || Array.isArray(metadataJson)) {
    return null
  }

  const record = metadataJson as Record<string, unknown>
  const candidates = [key, ...fallbackKeys]

  for (const candidate of candidates) {
    const value = record[candidate]
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }

  return null
}

function readJsonString(record: unknown, key: string) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return null
  }

  const value = (record as Record<string, unknown>)[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readJsonHeaders(record: unknown) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return undefined
  }

  const rawHeaders = (record as Record<string, unknown>).headers
  if (!rawHeaders || typeof rawHeaders !== 'object' || Array.isArray(rawHeaders)) {
    return undefined
  }

  const headers = Object.fromEntries(
    Object.entries(rawHeaders as Record<string, unknown>).flatMap(([key, value]) =>
      typeof value === 'string' && value.trim() ? [[key, value.trim()]] : [],
    ),
  )

  return Object.keys(headers).length > 0 ? headers : undefined
}

function resolveProviderEndpoint(
  providerKey: string,
  configuredEndpoint: string | null | undefined,
) {
  if (configuredEndpoint?.trim()) {
    return configuredEndpoint.trim()
  }

  const normalized = providerKey.trim().toLowerCase()
  if (normalized === 'openai') {
    return 'https://api.openai.com/v1/chat/completions'
  }
  if (normalized === 'anthropic') {
    return 'https://api.anthropic.com/v1/messages'
  }
  return process.env.LLM_API_URL?.trim() ?? ''
}

export async function getCompanyById(companyId: string): Promise<CompanyRecord> {
  const company = ensureExists(
    await prisma.company.findUnique({
      where: { id: companyId },
    }),
    'Company not found',
  )

  return {
    id: company.id,
    tenantId: company.tenantId,
    name: company.name,
    descricao_de_negocio: readCompanyText(company.metadataJson, 'descricao_de_negocio', ['businessDescription', 'descricaoNegocio']),
    descricao_do_v2mom: readCompanyText(company.metadataJson, 'descricao_do_v2mom', ['v2momDescription', 'descricaoV2mom']),
  }
}

export async function getSkillByName(name: string): Promise<SkillRecord | null> {
  const skill = await prisma.skill.findFirst({
    where: {
      name,
      status: 'ACTIVE',
    },
    orderBy: [{ updatedAt: 'desc' }],
  })

  if (!skill) {
    return null
  }

  return {
    id: skill.id,
    name: skill.name,
    prompt: skill.instructions,
  }
}

export async function resolveCompanyByTenantName(tenantName: string) {
  const tenant = ensureExists(
    await prisma.tenant.findFirst({
      where: {
        OR: [
          { name: tenantName },
          { slug: tenantName },
        ],
      },
      include: {
        company: true,
      },
    }),
    `Tenant "${tenantName}" not found`,
  )

  const company = ensureExists(tenant.company, `Tenant "${tenantName}" has no associated company`)
  return { tenant, company }
}

export async function resolveMissionControlLlmConfigByCompanyId(
  companyId: string,
): Promise<MissionControlLlmResolvedConfig> {
  const company = ensureExists(
    await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        verticalId: true,
      },
    }),
    'Company not found',
  )

  const verticalAssignments = await prisma.verticalLLMConfig.findMany({
    where: {
      verticalId: company.verticalId,
      active: true,
      providerConfig: {
        status: RecordStatus.ACTIVE,
      },
      modelConfig: {
        status: RecordStatus.ACTIVE,
      },
    },
    include: {
      providerConfig: true,
      modelConfig: true,
    },
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
  })

  const normalizedPurpose = (value: string | null | undefined) =>
    value?.trim().toLowerCase() ?? ''

  const verticalAssignment =
    verticalAssignments.find((entry) => normalizedPurpose(entry.purpose) === 'setup') ??
    verticalAssignments.find((entry) => normalizedPurpose(entry.purpose) === 'default-runtime') ??
    verticalAssignments[0]

  if (verticalAssignment) {
    const providerConfigJson = verticalAssignment.providerConfig.configJson
    const endpoint = resolveProviderEndpoint(
      verticalAssignment.providerConfig.providerKey,
      readJsonString(providerConfigJson, 'endpoint') ??
        verticalAssignment.providerConfig.baseUrl,
    )
    const apiKeyRef = verticalAssignment.providerConfig.apiKeyRef
    const apiKey = apiKeyRef ? process.env[apiKeyRef] : process.env.LLM_API_KEY

    return {
      source: 'mission_control_vertical_override',
      companyId: company.id,
      verticalId: company.verticalId,
      providerConfigId: verticalAssignment.providerConfig.id,
      providerKey: verticalAssignment.providerConfig.providerKey,
      providerName: verticalAssignment.providerConfig.name,
      modelConfigId: verticalAssignment.modelConfig.id,
      modelKey: verticalAssignment.modelConfig.modelKey,
      modelDisplayName: verticalAssignment.modelConfig.displayName,
      endpoint,
      apiKey: apiKey?.trim() || undefined,
      apiKeyRef,
      temperature:
        verticalAssignment.modelConfig.temperature == null
          ? undefined
          : Number(verticalAssignment.modelConfig.temperature),
      maxTokens: verticalAssignment.modelConfig.maxTokens,
      extraHeaders: readJsonHeaders(providerConfigJson),
      systemPrompt: verticalAssignment.systemPrompt,
      verticalLlmConfigId: verticalAssignment.id,
      verticalLlmPurpose: verticalAssignment.purpose,
    }
  }

  const defaultModel = ensureExists(
    await prisma.lLMModelConfig.findFirst({
      where: {
        status: RecordStatus.ACTIVE,
        isDefault: true,
        providerConfig: {
          status: RecordStatus.ACTIVE,
        },
      },
      include: {
        providerConfig: true,
      },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    }),
    'Mission Control has no active default LLM model configured',
  )

  const providerConfigJson = defaultModel.providerConfig.configJson
  const endpoint = resolveProviderEndpoint(
    defaultModel.providerConfig.providerKey,
    readJsonString(providerConfigJson, 'endpoint') ??
      defaultModel.providerConfig.baseUrl,
  )
  const apiKeyRef = defaultModel.providerConfig.apiKeyRef
  const apiKey = apiKeyRef ? process.env[apiKeyRef] : process.env.LLM_API_KEY

  return {
    source: 'mission_control_default_model',
    companyId: company.id,
    verticalId: company.verticalId,
    providerConfigId: defaultModel.providerConfig.id,
    providerKey: defaultModel.providerConfig.providerKey,
    providerName: defaultModel.providerConfig.name,
    modelConfigId: defaultModel.id,
    modelKey: defaultModel.modelKey,
    modelDisplayName: defaultModel.displayName,
    endpoint,
    apiKey: apiKey?.trim() || undefined,
    apiKeyRef,
    temperature:
      defaultModel.temperature == null ? undefined : Number(defaultModel.temperature),
    maxTokens: defaultModel.maxTokens,
    extraHeaders: readJsonHeaders(providerConfigJson),
    systemPrompt: null,
  }
}

export class PromptBuilder {
  constructor(private readonly logger: PipelineLogger) {}

  async build(companyId: string): Promise<PromptBuildResult> {
    try {
      const company = await getCompanyById(companyId)

      await this.logger.info('company_loaded', {
        step: 'company_loaded',
        status: 'ok',
        company_id: company.id,
        has_descricao_de_negocio: Boolean(company.descricao_de_negocio?.trim()),
        has_descricao_do_v2mom: Boolean(company.descricao_do_v2mom?.trim()),
      })

      const skill = await getSkillByName('Setup Base')
      if (!skill?.prompt?.trim()) {
        throw new MissingSkillError('Skill "Setup Base" not found or without prompt', {
          companyId,
          skillName: 'Setup Base',
        })
      }

      await this.logger.info('skill_loaded', {
        step: 'skill_loaded',
        status: 'ok',
        company_id: company.id,
        skill_id: skill.id,
        skill_name: skill.name,
      })

      const businessDescription = company.descricao_de_negocio?.trim() || '[missing: descricao_de_negocio]'
      const v2momDescription = company.descricao_do_v2mom?.trim() || '[missing: descricao_do_v2mom]'

      if (businessDescription.startsWith('[missing:')) {
        await this.logger.warn('company_business_description_missing', {
          step: 'prompt_build',
          status: 'warning',
          company_id: company.id,
        })
      }

      if (v2momDescription.startsWith('[missing:')) {
        await this.logger.warn('company_v2mom_description_missing', {
          step: 'prompt_build',
          status: 'warning',
          company_id: company.id,
        })
      }

      const prompt = [
        '--------------------------------',
        'SETUP BASE INSTRUCTIONS',
        skill.prompt,
        '--------------------------------',
        '',
        'COMPANY BUSINESS DESCRIPTION',
        businessDescription,
        '--------------------------------',
        '',
        'COMPANY V2MOM DESCRIPTION',
        v2momDescription,
        '--------------------------------',
        '',
        'TASK-SPECIFIC V2MOM JSON GENERATION INSTRUCTIONS',
        V2MOM_JSON_GENERATION_PROMPT,
        '--------------------------------',
      ].join('\n')

      await this.logger.info('prompt_built', {
        step: 'prompt_built',
        status: 'ok',
        company_id: company.id,
        final_prompt_length: prompt.length,
        final_prompt_preview: prompt.slice(0, 1200),
      })

      return {
        prompt,
        company,
        skill,
      }
    } catch (error) {
      await this.logger.error('prompt_build_failed', {
        step: 'prompt_build',
        status: 'error',
        company_id: companyId,
        error,
      })

      if (error instanceof MissingSkillError || error instanceof PromptBuildError) {
        throw error
      }

      throw new PromptBuildError('Failed to build prompt', { companyId }, error)
    }
  }
}
