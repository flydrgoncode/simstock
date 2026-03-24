import type { Prisma } from '@prisma/client'

import { prisma } from '../../lib/db/prisma'
import {
  deriveReadonlyTableFromShadow,
  type DropletExecutionResult,
  shadowSkillDefinitionSchema,
} from '../../lib/droplets/schema'
import { dropletEntities, type DropletEntity } from '../../lib/droplets/entities'
import { AppError } from '../../server/http'
import { ensureExists } from '../../server/utils'
import { executeExploreRequest } from '../droplets/explore'
import {
  shadowSkillV2PresentationBlockSchema as dropletPresentationBlockSchema,
  type ShadowSkillDefinitionV2 as ShadowSkillDefinition,
} from '../droplets/schemas/shadowSkillV2'
import {
  dummyDataExecutionLogSchema,
  dummyDataScenarioRowsSchema,
  resolvedPreviewScenarioSchema,
  type DummyDataExecutionLog,
} from './schemas'

type PreviewRunnerOptions = {
  dummyScenarioKey?: string | null
  inputParams?: Record<string, unknown>
}

function scenarioRows(value: Prisma.JsonValue | null | undefined) {
  const parsed = dummyDataScenarioRowsSchema.safeParse(value)
  if (!parsed.success) {
    return []
  }
  return parsed.data.rows
}

async function loadDummyScenarioByKey(key: string | undefined | null) {
  if (!key) return null
  const scenario = await prisma.dummyDataScenario.findUnique({ where: { key } })
  if (!scenario) {
    throw new AppError(404, `Dummy data scenario ${key} was not found.`)
  }
  return resolvedPreviewScenarioSchema.parse({
    key: scenario.key,
    entity: scenario.entity,
    scope: scenario.verticalId ? 'vertical' : 'company',
    description: scenario.description,
    rows: scenarioRows(scenario.scenarioJson),
  })
}

function buildBlocksFromShadow(
  shadow: ShadowSkillDefinition,
  entity: string,
  rows: Array<Record<string, unknown>>,
  labels: Record<string, string>,
  summary?: Record<string, number>,
  summaryText?: string
): Array<Record<string, unknown>> {
  return shadow.presentation.blocks.flatMap((block) => {
    const parsedBlock = dropletPresentationBlockSchema.parse(block)
    if (parsedBlock.type === 'summary_text') {
      return [
        {
          type: 'text',
          title: parsedBlock.title ?? 'Summary',
          text: summaryText ?? `${rows.length} rows available.`,
        },
      ]
    }
    if (parsedBlock.type === 'kpi_cards') {
      return [
        {
          type: 'kpi_cards',
          title: parsedBlock.title ?? shadow.identity.name,
          entity,
          metrics: parsedBlock.metrics,
          labels,
          summary,
        },
      ]
    }
    if (parsedBlock.type === 'mixed') {
      return parsedBlock.blocks.flatMap((nestedBlock) =>
        buildBlocksFromShadow(
          {
            ...shadow,
            presentation: {
              ...shadow.presentation,
              blocks: [nestedBlock],
            },
          },
          entity,
          rows,
          labels,
          summary,
          summaryText
        )
      )
    }
    if (parsedBlock.type === 'table' || parsedBlock.type === 'editable_table') {
      return [
        {
          type: parsedBlock.type,
          title: parsedBlock.title ?? shadow.identity.name,
          entity: parsedBlock.entity ?? entity,
          columns: parsedBlock.columns,
          rows,
          labels,
          summary,
        },
      ]
    }
    if (parsedBlock.type === 'chart') {
      return [
        {
          type: 'chart',
          title: parsedBlock.title ?? shadow.identity.name,
          chartType: parsedBlock.chartType,
          metric: parsedBlock.metric,
          x: parsedBlock.x,
          points: rows.map((row) => ({
            x: row[parsedBlock.x] ?? 'n/a',
            y: Number(row[parsedBlock.metric] ?? 0),
          })),
        },
      ]
    }
    return [
      {
        type: 'form',
        title: parsedBlock.title ?? shadow.identity.name,
        fields: parsedBlock.fields,
        values: rows[0] ?? {},
      },
    ]
  })
}

function buildExecutionLog(input: DummyDataExecutionLog) {
  return dummyDataExecutionLogSchema.parse(input)
}

export async function runShadowSkillPreview(
  tenantId: string,
  shadow: ShadowSkillDefinition,
  options?: PreviewRunnerOptions
): Promise<DropletExecutionResult> {
  const warnings: string[] = []
  const errors: string[] = []
  const dataSource = shadow.execution.dataSources[0] ?? 'customers'
  const entity = dropletEntities.includes(dataSource as DropletEntity)
    ? (dataSource as DropletEntity)
    : null
  let rows: Array<Record<string, unknown>> = []
  let labels: Record<string, string> = {}
  let summary: Record<string, number> | undefined
  const dummyScenario = await loadDummyScenarioByKey(
    options?.dummyScenarioKey ?? shadow.preview.dummyScenario
  )

  if (shadow.execution.mode !== 'read' || !entity || dummyScenario) {
    rows = dummyScenario?.rows ?? []
    if (rows.length === 0 && entity) {
      const readonly = deriveReadonlyTableFromShadow(shadow, entity)
      rows = readonly.fields.map((field, index) => ({
        [readonly.fields[0] ?? 'label']: `Sample ${index + 1}`,
        [field]: index + 1,
      }))
      warnings.push('Preview used generated dummy rows because no dummy scenario rows were found.')
    }
    const firstBlock = shadow.presentation.blocks.find(
      (block) => block.type === 'table' || block.type === 'editable_table'
    )
    labels =
      firstBlock && 'columns' in firstBlock
        ? Object.fromEntries(firstBlock.columns.map((column) => [column.key, column.label]))
        : {}
  } else {
    const readonly = deriveReadonlyTableFromShadow(shadow, entity)
    const summaryRequest = readonly.summary
      ? {
          enabled: readonly.summary.enabled,
          ...(readonly.summary.fields ? { fields: readonly.summary.fields } : {}),
        }
      : undefined
    const result = await executeExploreRequest(tenantId, {
      entity: readonly.entity,
      ...(readonly.fields ? { fields: readonly.fields } : {}),
      ...(shadow.logic.filters ? { filters: shadow.logic.filters } : {}),
      ...(shadow.logic.grouping ? { grouping: shadow.logic.grouping } : {}),
      ...(readonly.labels ? { labels: readonly.labels } : {}),
      ...(summaryRequest ? { summary: summaryRequest } : {}),
      limit: 50,
    })
    rows = result.rows
    labels = result.labels
    summary = result.summary
  }

  const summaryText =
    shadow.execution.mode === 'read'
      ? `${shadow.identity.name} returned ${rows.length} row(s).`
      : `${shadow.identity.name} ran in preview mode with ${rows.length} simulated row(s).`

  const executionLog = buildExecutionLog({
    mode: shadow.execution.mode,
    source: dummyScenario ? 'dummy' : 'live',
    scenarioKey: dummyScenario?.key ?? null,
    dataSources: shadow.execution.dataSources,
    selectedEntities: [entity ?? dataSource],
    transformsApplied: shadow.logic.transforms.map((transform) => JSON.stringify(transform)),
    outputBlocks: shadow.presentation.blocks.map((block) => block.type),
    writebackTarget: shadow.writeback.enabled ? shadow.writeback.entity ?? null : null,
    validationResults: [
      `shadow=${shadow.presentation.outputType}`,
      `dummy=${dummyScenario?.key ?? 'none'}`,
      `inputParams=${Object.keys(options?.inputParams ?? {}).length}`,
    ],
    inputParams: options?.inputParams ?? {},
  })

  return {
    success: errors.length === 0,
    summaryText,
    blocks: buildBlocksFromShadow(
      shadow,
      entity ?? dataSource,
      rows,
      labels,
      summary,
      summaryText
    ),
    warnings,
    errors,
    debug: executionLog,
    executionLog,
  }
}

export async function previewStoredDroplet(
  dropletId: string,
  tenantId: string,
  options?: PreviewRunnerOptions
) {
  const droplet = ensureExists(
    await prisma.verticalDroplet.findUnique({ where: { id: dropletId } }),
    'Droplet not found'
  )
  const parsed = shadowSkillDefinitionSchema.safeParse(droplet.shadowSkillDefinitionJson)
  if (!parsed.success) {
    throw new AppError(400, 'Droplet shadow definition is invalid.')
  }
  return runShadowSkillPreview(tenantId, parsed.data, options)
}
