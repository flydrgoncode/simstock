import {
  formatDropletValue,
  getDropletFieldType,
} from '../../lib/droplets/format'

type LegacyExploreResult = {
  entity: string
  title: string
  visibleFields: string[]
  labels: Record<string, string>
  rows: Array<Record<string, unknown>>
  grouping?:
    | Array<{
        group: string
        rows: Array<Record<string, unknown>>
      }>
    | undefined
  summary?: Record<string, number> | undefined
  totalRows?: number | undefined
}

type DropletBlock =
  | {
      type: 'text'
      title?: string
      text?: string
    }
  | {
      type: 'kpi_cards'
      title?: string
      entity?: string
      metrics: string[]
      labels?: Record<string, string>
      summary?: Record<string, number>
    }
  | {
      type: 'table' | 'editable_table'
      title?: string
      entity?: string
      columns: Array<{
        key: string
        label: string
        type: 'string' | 'number' | 'currency' | 'percentage' | 'date' | 'boolean'
        editable?: boolean
      }>
      rows: Array<Record<string, unknown>>
      labels?: Record<string, string>
      summary?: Record<string, number>
    }
  | {
      type: 'chart'
      title?: string
      chartType?: string
      metric: string
      x: string
      points: Array<{ x: unknown; y: number }>
    }
  | {
      type: 'form'
      title?: string
      fields: Array<{ key: string; label: string; type: string; required?: boolean }>
      values?: Record<string, unknown>
    }

type ExecutionPreview = {
  success: boolean
  summaryText: string
  blocks: Array<Record<string, unknown>>
  warnings?: string[] | undefined
  errors?: string[] | undefined
  debug?: Record<string, unknown> | undefined
}

type DropletPayload = {
  id?: string
  tenantId?: string
  name?: string
  type?: string | null
  placement?: string | null
  status?: string
  active?: boolean
  dropletDefinitionJson?: {
    entity: string
    title: string
    description?: string
  }
  preview?: LegacyExploreResult | ExecutionPreview
}

function renderSummaryCards(
  entity: string,
  labels: Record<string, string>,
  summary?: Record<string, number>
) {
  if (!summary || Object.keys(summary).length === 0) {
    return null
  }
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {Object.entries(summary).map(([field, value]) => (
        <div
          key={field}
          className="rounded-2xl border border-teal-100 bg-teal-50 p-4"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-teal-700">
            {labels[field] ?? field}
          </p>
          <p className="mt-2 text-xl font-semibold text-slate-900">
            {formatDropletValue(getDropletFieldType(entity, field), value)}
          </p>
        </div>
      ))}
    </div>
  )
}

function renderTableBlock(block: Extract<DropletBlock, { type: 'table' | 'editable_table' }>) {
  const entity = block.entity ?? 'customers'
  const labels =
    block.labels ??
    Object.fromEntries(block.columns.map((column) => [column.key, column.label]))

  return (
    <div className="space-y-4">
      {block.title ? (
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{block.title}</h4>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
            {block.type === 'editable_table' ? 'Editable table preview' : 'Table'}
          </p>
        </div>
      ) : null}
      {renderSummaryCards(entity, labels, block.summary)}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              {block.columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {block.rows.map((row, index) => (
              <tr key={index}>
                {block.columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-slate-800">
                    <div className="flex items-center gap-2">
                      <span>
                        {formatDropletValue(
                          getDropletFieldType(entity, column.key),
                          row[column.key]
                        )}
                      </span>
                      {block.type === 'editable_table' && column.editable ? (
                        <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-amber-700">
                          mock
                        </span>
                      ) : null}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
          No rows matched this droplet.
        </div>
      ) : null}
    </div>
  )
}

function renderKpiCardsBlock(block: Extract<DropletBlock, { type: 'kpi_cards' }>) {
  const entity = block.entity ?? 'customers'
  const labels = block.labels ?? {}
  const summary = Object.fromEntries(
    block.metrics
      .map((metric) => [metric, block.summary?.[metric]])
      .filter((entry): entry is [string, number] => typeof entry[1] === 'number')
  )

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {block.title ? (
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{block.title}</h4>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
            KPI cards
          </p>
        </div>
      ) : null}
      {renderSummaryCards(entity, labels, summary)}
    </div>
  )
}

function renderChartBlock(block: Extract<DropletBlock, { type: 'chart' }>) {
  const maxValue = Math.max(...block.points.map((point) => point.y), 0)

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h4 className="text-sm font-semibold text-slate-900">{block.title ?? 'Chart'}</h4>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
          {block.metric} by {block.x}
        </p>
      </div>
      <div className="space-y-3">
        {block.points.map((point, index) => {
          const width = maxValue > 0 ? `${Math.max((point.y / maxValue) * 100, 6)}%` : '6%'
          return (
            <div key={index} className="grid gap-2 md:grid-cols-[140px_minmax(0,1fr)_90px] md:items-center">
              <span className="text-sm text-slate-600">{String(point.x)}</span>
              <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                <div className="h-full rounded-full bg-teal-500" style={{ width }} />
              </div>
              <span className="text-right text-sm font-medium text-slate-800">
                {point.y.toLocaleString()}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function renderFormBlock(block: Extract<DropletBlock, { type: 'form' }>) {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      {block.title ? <h4 className="text-sm font-semibold text-slate-900">{block.title}</h4> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {block.fields.map((field) => (
          <label key={field.key} className="flex flex-col gap-2 text-sm text-slate-700">
            <span>
              {field.label}
              {field.required ? ' *' : ''}
            </span>
            <input
              disabled
              value={String(block.values?.[field.key] ?? '')}
              readOnly
              className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-500"
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function renderLegacy(result: LegacyExploreResult) {
  const block: Extract<DropletBlock, { type: 'table' | 'editable_table' }> = {
    type: 'table',
    title: result.title,
    entity: result.entity,
    columns: result.visibleFields.map((field) => ({
      key: field,
      label: result.labels[field] ?? field,
      type: getDropletFieldType(result.entity, field),
    })),
    rows: result.rows,
    labels: result.labels,
    ...(result.summary ? { summary: result.summary } : {}),
  }
  return renderTableBlock(block)
}

function isExecutionPreview(value: LegacyExploreResult | ExecutionPreview): value is ExecutionPreview {
  return 'blocks' in value
}

export function DropletRenderer({
  droplet,
  preview,
}: {
  droplet?: DropletPayload
  preview?: LegacyExploreResult | ExecutionPreview | null
}) {
  const result = preview ?? droplet?.preview

  if (!result) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        No droplet preview available yet.
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {isExecutionPreview(result)
              ? droplet?.name ?? 'Droplet preview'
              : result.title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            {isExecutionPreview(result)
              ? result.summaryText
              : `${result.totalRows ?? result.rows.length} rows · ${result.entity}`}
          </p>
        </div>
        {droplet?.status ? (
          <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-700">
            {droplet.status.toLowerCase()}
          </span>
        ) : null}
      </div>

      {isExecutionPreview(result) ? (
        <div className="space-y-4">
          {result.warnings && result.warnings.length > 0 ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              {result.warnings.join(' ')}
            </div>
          ) : null}
          {result.errors && result.errors.length > 0 ? (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">
              {result.errors.join(' ')}
            </div>
          ) : null}
          {result.blocks.map((rawBlock, index) => {
            const block = rawBlock as DropletBlock
            return (
            <div key={index}>
              {block.type === 'text' ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  {block.title ? (
                    <h4 className="text-sm font-semibold text-slate-900">{block.title}</h4>
                  ) : null}
                  <p className="mt-1 text-sm text-slate-700">{block.text ?? ''}</p>
                </div>
              ) : null}
              {block.type === 'kpi_cards' ? renderKpiCardsBlock(block) : null}
              {(block.type === 'table' || block.type === 'editable_table') ? renderTableBlock(block) : null}
              {block.type === 'chart' ? renderChartBlock(block) : null}
              {block.type === 'form' ? renderFormBlock(block) : null}
            </div>
            )
          })}
          {result.debug ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Debug panel</p>
              <p className="mt-2">Mode: {String(result.debug.mode ?? 'unknown')}</p>
              <p>
                Selected entities:{' '}
                {Array.isArray(result.debug.selectedEntities)
                  ? result.debug.selectedEntities.join(', ')
                  : 'n/a'}
              </p>
              <p>
                Transforms applied:{' '}
                {Array.isArray(result.debug.transformsApplied)
                  ? result.debug.transformsApplied.join(', ') || 'none'
                  : 'none'}
              </p>
              <p>
                Output blocks:{' '}
                {Array.isArray(result.debug.outputBlocks)
                  ? result.debug.outputBlocks.join(', ')
                  : 'n/a'}
              </p>
              <p>Writeback target: {String(result.debug.writebackTarget ?? 'none')}</p>
              <p>
                Validation:{' '}
                {Array.isArray(result.debug.validationResults)
                  ? result.debug.validationResults.join(' · ')
                  : 'n/a'}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        renderLegacy(result)
      )}
    </div>
  )
}
