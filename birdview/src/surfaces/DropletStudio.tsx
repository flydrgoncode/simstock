import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { DropletRenderer } from '../components/droplets/DropletRenderer'
import { APP_VERSION } from '../lib/appMeta'
import { apiFetch } from '../lib/api'
import {
  dropletEntityConfigs,
  type DropletEntity,
} from '../lib/droplets/entities'
import {
  buildDefaultReadonlyTableDropletDefinition,
  buildShadowDefinitionFromReadonlyTable,
} from '../lib/droplets/schema'
import {
  Input,
  Panel,
  PrimaryButton,
  SecondaryButton,
  Select,
  StatusPill,
  SurfaceShell,
  Table,
  Textarea,
} from '../components/admin/ui'

type Vertical = {
  id: string
  name: string
  key: string
}

type Tenant = {
  id: string
  name: string
}

type StudioOverview = {
  totalsByVertical: Array<{
    verticalId: string
    verticalName: string
    total: number
    draft: number
    published: number
    deprecated: number
  }>
  statusCounts: {
    draft: number
    published: number
    deprecated: number
  }
  commandCoverage: {
    total: number
    withCommand: number
  }
  validationWarnings: number
}

type CatalogDroplet = {
  id: string
  verticalId: string
  name: string
  slug: string
  description: string | null
  dropletType: string
  command: string
  commandAliasesJson: string[]
  commandHelpText: string | null
  authorHintText: string | null
  generationPromptVersion: string | null
  generationStatus: string
  generationWarningsJson: string[] | null
  previewDummyDataConfigJson: Record<string, unknown> | null
  shadowSkillDefinitionJson: Record<string, unknown> | null
  dropletDefinitionJson: {
    type: 'readonly_table'
    entity: DropletEntity
    title: string
    description?: string
    fields: string[]
    labels?: Record<string, string>
    defaultSort?: { field: string; direction: 'asc' | 'desc' }
    grouping?: { field: string }
    summary?: { enabled: boolean; fields?: string[] }
    placement?: string
  }
  supportedEntitiesJson: string[]
  status: string
  version: number
  vertical?: { id: string; name: string }
  versions?: Array<{
    id: string
    version: number
    statusSnapshot: string
    generationPromptVersion: string | null
    createdAt: string
  }>
}

type PromptTemplate = {
  id: string
  verticalId: string | null
  key: string
  name: string
  purpose: string
  templateText: string
  version: number
  status: string
  vertical?: { name: string } | null
}

type DummyDataScenario = {
  id: string
  verticalId: string | null
  key: string
  name: string
  description: string | null
  entity: string
  scenarioJson: Record<string, unknown>
  status: string
  vertical?: { name: string } | null
}

type ExecutionPreview = {
  success: boolean
  summaryText: string
  blocks: Array<Record<string, unknown>>
  warnings?: string[]
  errors?: string[]
  debug?: Record<string, unknown>
}

const nav = [
  { to: '/droplet-studio', label: 'Overview' },
  { to: '/droplet-studio/droplets/new', label: 'Droplets' },
  { to: '/droplet-studio/catalog', label: 'Catalog' },
  { to: '/droplet-studio/preview-lab', label: 'Preview Lab' },
  { to: '/droplet-studio/prompt-templates', label: 'Prompt Templates' },
  { to: '/droplet-studio/dummy-data', label: 'Dummy Data' },
  { to: '/droplet-studio/versions', label: 'Versions' },
]

const dropletTypeOptions = [
  'READONLY_TABLE',
  'ANALYSIS_CARD',
  'EDITABLE_TABLE',
  'FORM',
  'MIXED_OUTPUT',
] as const

const sectionByPath = (pathname: string) => {
  if (pathname.startsWith('/droplet-studio/catalog')) return 'catalog'
  if (pathname.startsWith('/droplet-studio/preview')) return 'preview'
  if (pathname.startsWith('/droplet-studio/prompt-templates')) return 'prompt-templates'
  if (pathname.startsWith('/droplet-studio/dummy-data')) return 'dummy-data'
  if (pathname.startsWith('/droplet-studio/versions')) return 'versions'
  if (pathname.startsWith('/droplet-studio/droplets')) return 'droplets'
  return 'overview'
}

function emptyPromptTemplate() {
  return {
    id: '',
    verticalId: '',
    key: 'droplet-shadow-generator',
    name: 'Droplet Shadow Generator',
    purpose: 'Convert hints to shadow definitions',
    templateText:
      'Given Birdview vertical context and allowed entities, output only valid shadow skill definition JSON.',
    version: '1',
    status: 'ACTIVE',
  }
}

function emptyDummyScenario() {
  return {
    id: '',
    verticalId: '',
    key: '',
    name: '',
    description: '',
    entity: 'RevenueTarget',
    scenarioJson: JSON.stringify({ rows: [] }, null, 2),
    status: 'ACTIVE',
  }
}

function makeInitialDropletForm() {
  const base = buildDefaultReadonlyTableDropletDefinition('customers', {
    title: 'Customers Explorer',
    placement: 'customers',
  })

  return {
    id: '',
    name: 'Customers Explorer',
    slug: 'customers-explorer',
    description: 'Read-only customer exploration droplet.',
    dropletType: 'READONLY_TABLE',
    command: '/customers',
    aliases: '/accounts',
    commandHelpText: 'Open the customer portfolio explorer.',
    authorHintText: 'Show customers with segment, geography, industry and status.',
    entity: 'customers' as DropletEntity,
    title: base.title,
    detail: base.description ?? '',
    fields: [...base.fields],
    labelsJson: JSON.stringify(base.labels ?? {}, null, 2),
    defaultSortField: base.defaultSort?.field ?? '',
    defaultSortDirection: base.defaultSort?.direction ?? 'asc',
    groupingField: '',
    placement: base.placement ?? 'customers',
    summaryEnabled: base.summary?.enabled ?? true,
    summaryFields: (base.summary?.fields ?? []).join(', '),
    supportedEntities: ['customers'],
    previewDummyScenarioKey: 'customers_basic',
    shadowJson: JSON.stringify(
      buildShadowDefinitionFromReadonlyTable(base, {
        name: 'Customers Explorer',
        command: '/customers',
        aliases: ['/accounts'],
        helpText: 'Open the customer portfolio explorer.',
        category: 'explorer',
        mode: 'read',
        outputType: 'table',
        dummyScenario: 'customers_basic',
      }),
      null,
      2
    ),
    status: 'DRAFT',
    version: '1',
  }
}

export function DropletStudio() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = useParams()
  const section = sectionByPath(location.pathname)

  const [errorMessage, setErrorMessage] = useState('')
  const [verticals, setVerticals] = useState<Vertical[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedVerticalId, setSelectedVerticalId] = useState('')
  const [previewTenantId, setPreviewTenantId] = useState('')
  const [overview, setOverview] = useState<StudioOverview | null>(null)
  const [droplets, setDroplets] = useState<CatalogDroplet[]>([])
  const [catalog, setCatalog] = useState<CatalogDroplet[]>([])
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([])
  const [dummyScenarios, setDummyScenarios] = useState<DummyDataScenario[]>([])
  const [preview, setPreview] = useState<ExecutionPreview | null>(null)
  const [runDebug, setRunDebug] = useState('')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [form, setForm] = useState(makeInitialDropletForm())
  const [advancedMode, setAdvancedMode] = useState(false)
  const [promptForm, setPromptForm] = useState(emptyPromptTemplate())
  const [dummyForm, setDummyForm] = useState(emptyDummyScenario())

  const availableFields = useMemo(
    () => dropletEntityConfigs[form.entity].fields,
    [form.entity]
  )

  function hydrateDropletForm(droplet: CatalogDroplet) {
    const definition = droplet.dropletDefinitionJson
    setForm({
      id: droplet.id,
      name: droplet.name,
      slug: droplet.slug,
      description: droplet.description ?? '',
      dropletType: droplet.dropletType,
      command: droplet.command,
      aliases: (droplet.commandAliasesJson ?? []).join(', '),
      commandHelpText: droplet.commandHelpText ?? '',
      authorHintText: droplet.authorHintText ?? '',
      entity: definition.entity,
      title: definition.title,
      detail: definition.description ?? '',
      fields: definition.fields,
      labelsJson: JSON.stringify(definition.labels ?? {}, null, 2),
      defaultSortField: definition.defaultSort?.field ?? '',
      defaultSortDirection: definition.defaultSort?.direction ?? 'asc',
      groupingField: definition.grouping?.field ?? '',
      placement: definition.placement ?? 'overview',
      summaryEnabled: definition.summary?.enabled ?? false,
      summaryFields: (definition.summary?.fields ?? []).join(', '),
      supportedEntities: droplet.supportedEntitiesJson ?? [definition.entity],
      previewDummyScenarioKey:
        String(droplet.previewDummyDataConfigJson?.scenarioKey ?? ''),
      shadowJson: JSON.stringify(droplet.shadowSkillDefinitionJson ?? {}, null, 2),
      status: droplet.status,
      version: String(droplet.version),
    })
    navigate(`/droplet-studio/droplets/${droplet.id}`)
  }

  async function loadSurfaceData() {
    const [verticalsData, tenantsData, overviewData, templatesData, dummyData] =
      await Promise.all([
        apiFetch<Vertical[]>('/api/verticals'),
        apiFetch<Tenant[]>('/api/tenants'),
        apiFetch<StudioOverview>('/api/droplet-studio/overview'),
        apiFetch<PromptTemplate[]>('/api/prompt-templates'),
        apiFetch<DummyDataScenario[]>('/api/dummy-data-scenarios'),
      ])

    setVerticals(verticalsData)
    setTenants(tenantsData)
    setOverview(overviewData)
    setPromptTemplates(templatesData)
    setDummyScenarios(dummyData)

    const nextVerticalId =
      params.verticalId || selectedVerticalId || verticalsData[0]?.id || ''
    const nextTenantId = previewTenantId || tenantsData[0]?.id || ''
    setSelectedVerticalId(nextVerticalId)
    setPreviewTenantId(nextTenantId)

    if (nextVerticalId) {
      const items = await apiFetch<CatalogDroplet[]>(
        `/api/verticals/${nextVerticalId}/droplets`
      )
      setDroplets(items)
      if (params.id) {
        const current = items.find((item) => item.id === params.id)
        if (current) {
          hydrateDropletForm(current)
        }
      }
    }

    setCatalog(await apiFetch<CatalogDroplet[]>('/api/catalog/droplets'))
  }

  useEffect(() => {
    void loadSurfaceData().catch((error) =>
      setErrorMessage(error instanceof Error ? error.message : 'Loading failed.')
    )
  }, [])

  useEffect(() => {
    if (!selectedVerticalId) return
    void apiFetch<CatalogDroplet[]>(`/api/verticals/${selectedVerticalId}/droplets`)
      .then(setDroplets)
      .catch((error) =>
        setErrorMessage(error instanceof Error ? error.message : 'Loading droplets failed.')
      )
  }, [selectedVerticalId])

  useEffect(() => {
    if (section === 'versions' && params.id) {
      void apiFetch<CatalogDroplet>(`/api/droplets/${params.id}`)
        .then(hydrateDropletForm)
        .catch((error) =>
          setErrorMessage(error instanceof Error ? error.message : 'Loading version data failed.')
        )
    }
  }, [params.id, section])

  function hydrateFromEntity(entity: DropletEntity) {
    const definition = buildDefaultReadonlyTableDropletDefinition(entity, {
      title: `${dropletEntityConfigs[entity].label} Explorer`,
      placement: entity,
    })
    const shadow = buildShadowDefinitionFromReadonlyTable(definition, {
      name: `${dropletEntityConfigs[entity].label} Explorer`,
      command: form.command,
      aliases: form.aliases
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      helpText: form.commandHelpText,
      category: form.dropletType === 'EDITABLE_TABLE' ? 'editor' : 'explorer',
      mode: form.dropletType === 'EDITABLE_TABLE' ? 'write' : 'read',
      outputType: form.dropletType === 'EDITABLE_TABLE' ? 'editable_table' : 'table',
      ...(form.previewDummyScenarioKey
        ? { dummyScenario: form.previewDummyScenarioKey }
        : {}),
    })
    setForm((current) => ({
      ...current,
      entity,
      title: definition.title,
      detail: definition.description ?? '',
      fields: [...definition.fields],
      labelsJson: JSON.stringify(definition.labels ?? {}, null, 2),
      defaultSortField: definition.defaultSort?.field ?? '',
      defaultSortDirection: definition.defaultSort?.direction ?? 'asc',
      groupingField: definition.grouping?.field ?? '',
      placement: definition.placement ?? entity,
      summaryEnabled: definition.summary?.enabled ?? false,
      summaryFields: (definition.summary?.fields ?? []).join(', '),
      supportedEntities: [entity],
      shadowJson: JSON.stringify(shadow, null, 2),
    }))
  }

  function currentReadonlyDefinition() {
    return {
      type: 'readonly_table' as const,
      entity: form.entity,
      title: form.title,
      description: form.detail || undefined,
      fields: form.fields,
      labels: JSON.parse(form.labelsJson || '{}') as Record<string, string>,
      defaultSort: form.defaultSortField
        ? {
            field: form.defaultSortField,
            direction: form.defaultSortDirection as 'asc' | 'desc',
          }
        : undefined,
      grouping: form.groupingField ? { field: form.groupingField } : undefined,
      summary: {
        enabled: form.summaryEnabled,
        fields: form.summaryEnabled
          ? form.summaryFields
              .split(',')
              .map((value) => value.trim())
              .filter(Boolean)
          : [],
      },
      placement: form.placement,
    }
  }

  function currentShadowDefinition() {
    if (advancedMode && form.shadowJson.trim()) {
      return JSON.parse(form.shadowJson)
    }
    return buildShadowDefinitionFromReadonlyTable(currentReadonlyDefinition(), {
      name: form.name,
      command: form.command,
      aliases: form.aliases
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      helpText: form.commandHelpText,
      category:
        form.dropletType === 'EDITABLE_TABLE'
          ? 'editor'
          : form.dropletType === 'ANALYSIS_CARD' || form.dropletType === 'MIXED_OUTPUT'
            ? 'analysis'
            : 'explorer',
      mode:
        form.dropletType === 'EDITABLE_TABLE' || form.dropletType === 'FORM'
          ? 'write'
          : form.dropletType === 'ANALYSIS_CARD' || form.dropletType === 'MIXED_OUTPUT'
            ? 'mixed'
            : 'read',
      outputType:
        form.dropletType === 'EDITABLE_TABLE'
          ? 'editable_table'
          : form.dropletType === 'FORM'
            ? 'form'
            : form.dropletType === 'ANALYSIS_CARD' || form.dropletType === 'MIXED_OUTPUT'
            ? 'mixed'
              : 'table',
      ...(form.previewDummyScenarioKey
        ? { dummyScenario: form.previewDummyScenarioKey }
        : {}),
    })
  }

  async function refreshCollections() {
    const [catalogData, templatesData, dummyData] = await Promise.all([
      apiFetch<CatalogDroplet[]>('/api/catalog/droplets'),
      apiFetch<PromptTemplate[]>('/api/prompt-templates'),
      apiFetch<DummyDataScenario[]>('/api/dummy-data-scenarios'),
    ])
    setCatalog(catalogData)
    setPromptTemplates(templatesData)
    setDummyScenarios(dummyData)
    if (selectedVerticalId) {
      setDroplets(
        await apiFetch<CatalogDroplet[]>(`/api/verticals/${selectedVerticalId}/droplets`)
      )
    }
    setOverview(await apiFetch<StudioOverview>('/api/droplet-studio/overview'))
  }

  async function saveDroplet() {
    setErrorMessage('')
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      dropletType: form.dropletType,
      command: form.command,
      commandAliasesJson: form.aliases
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      commandHelpText: form.commandHelpText,
      authorHintText: form.authorHintText || null,
      shadowSkillDefinitionJson: currentShadowDefinition(),
      generationPromptVersion: null,
      generationStatus: 'draft',
      generationWarningsJson: [],
      previewDummyDataConfigJson: form.previewDummyScenarioKey
        ? { scenarioKey: form.previewDummyScenarioKey }
        : {},
      dropletDefinitionJson: currentReadonlyDefinition(),
      supportedEntitiesJson: form.supportedEntities,
      status: form.status,
      version: Number(form.version),
    }

    if (form.id) {
      await apiFetch(`/api/droplets/${form.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      navigate(`/droplet-studio/droplets/${form.id}`)
    } else {
      const created = await apiFetch<CatalogDroplet>(
        `/api/verticals/${selectedVerticalId}/droplets`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      )
      navigate(`/droplet-studio/droplets/${created.id}`)
    }
    await refreshCollections()
  }

  async function generateShadow() {
    if (!form.id) {
      await saveDroplet()
      return
    }
    const generated = await apiFetch<CatalogDroplet>(`/api/droplets/${form.id}/generate`, {
      method: 'POST',
    })
    setForm((current) => ({
      ...current,
      shadowJson: JSON.stringify(generated.shadowSkillDefinitionJson ?? {}, null, 2),
    }))
    await refreshCollections()
  }

  async function validateDroplet() {
    if (!form.id) {
      return
    }
    const result = await apiFetch<{ warnings: string[] }>(`/api/droplets/${form.id}/validate`, {
      method: 'POST',
    })
    if (result.warnings.length > 0) {
      setErrorMessage(result.warnings.join(' '))
    }
    await refreshCollections()
  }

  async function publishDroplet(id: string) {
    setErrorMessage('')
    await apiFetch(`/api/droplets/${id}/publish`, { method: 'POST' })
    await refreshCollections()
  }

  async function deprecateDroplet(id: string) {
    await apiFetch(`/api/droplets/${id}/deprecate`, { method: 'POST' })
    await refreshCollections()
  }

  async function deleteDroplet(id: string) {
    await apiFetch(`/api/droplets/${id}`, { method: 'DELETE' })
    setForm(makeInitialDropletForm())
    navigate('/droplet-studio/droplets/new')
    await refreshCollections()
  }

  async function previewCurrent() {
    const response = await apiFetch<ExecutionPreview>(
      `/api/tenants/${previewTenantId}/droplets/preview`,
      {
        method: 'POST',
        body: JSON.stringify({
          shadowSkillDefinitionJson: currentShadowDefinition(),
          dummyScenarioKey: form.previewDummyScenarioKey || undefined,
        }),
      }
    )
    setPreview(response)
    setRunDebug(JSON.stringify(response.debug ?? {}, null, 2))
  }

  async function runCurrentDroplet() {
    if (!form.id) return
    const response = await apiFetch<ExecutionPreview>(`/api/droplets/${form.id}/run`, {
      method: 'POST',
      body: JSON.stringify({
        dummyScenarioKey: form.previewDummyScenarioKey || undefined,
      }),
    })
    setPreview(response)
    setRunDebug(JSON.stringify(response.debug ?? {}, null, 2))
    navigate(`/droplet-studio/droplets/${form.id}/preview`)
  }

  async function savePromptTemplate() {
    const payload = {
      verticalId: promptForm.verticalId || null,
      key: promptForm.key,
      name: promptForm.name,
      purpose: promptForm.purpose,
      templateText: promptForm.templateText,
      version: Number(promptForm.version),
      status: promptForm.status,
    }
    if (promptForm.id) {
      await apiFetch(`/api/prompt-templates/${promptForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/prompt-templates', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setPromptForm(emptyPromptTemplate())
    await refreshCollections()
  }

  async function removePromptTemplate(id: string) {
    await apiFetch(`/api/prompt-templates/${id}`, { method: 'DELETE' })
    await refreshCollections()
  }

  async function saveDummyScenario() {
    const payload = {
      verticalId: dummyForm.verticalId || null,
      key: dummyForm.key,
      name: dummyForm.name,
      description: dummyForm.description || null,
      entity: dummyForm.entity,
      scenarioJson: JSON.parse(dummyForm.scenarioJson),
      status: dummyForm.status,
    }
    if (dummyForm.id) {
      await apiFetch(`/api/dummy-data-scenarios/${dummyForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/dummy-data-scenarios', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setDummyForm(emptyDummyScenario())
    await refreshCollections()
  }

  async function removeDummyScenario(id: string) {
    await apiFetch(`/api/dummy-data-scenarios/${id}`, { method: 'DELETE' })
    await refreshCollections()
  }

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase()
    return catalog.filter((item) => {
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.command.toLowerCase().includes(q) ||
        item.dropletType.toLowerCase().includes(q) ||
        item.vertical?.name.toLowerCase().includes(q)
      )
    })
  }, [catalog, catalogSearch])

  const currentVersions = useMemo(
    () => droplets.find((item) => item.id === form.id)?.versions ?? [],
    [droplets, form.id]
  )

  return (
    <SurfaceShell
      surface="droplet-studio"
      eyebrow="Droplet Studio"
      title="Droplet Studio"
      version={APP_VERSION}
      description="Build and publish executable droplets for each vertical."
      nav={nav}
      sidePanel={
        <Panel
          title="Studio Context"
          description="Droplet Studio is vertical-scoped authoring with one-click preview."
        >
          <div className="space-y-3">
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Vertical
              <Select
                value={selectedVerticalId}
                onChange={(event) => setSelectedVerticalId(event.target.value)}
              >
                <option value="">Select vertical</option>
                {verticals.map((vertical) => (
                  <option key={vertical.id} value={vertical.id}>
                    {vertical.name}
                  </option>
                ))}
              </Select>
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-700">
              Preview tenant
              <Select
                value={previewTenantId}
                onChange={(event) => setPreviewTenantId(event.target.value)}
              >
                <option value="">Select tenant</option>
                {tenants.map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </Select>
            </label>
            {errorMessage ? (
              <div className="rounded-2xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">
                {errorMessage}
              </div>
            ) : null}
            <div className="flex gap-2">
              <PrimaryButton onClick={() => void previewCurrent()}>
                Preview
              </PrimaryButton>
              <SecondaryButton onClick={() => void runCurrentDroplet()}>
                Run Droplet
              </SecondaryButton>
            </div>
            <DropletRenderer
              {...(form.id
                ? { droplet: { id: form.id, name: form.name, status: form.status } }
                : {})}
              preview={preview}
            />
          </div>
        </Panel>
      }
    >
      {section === 'overview' ? (
        <>
          <Panel title="Overview" description="Studio totals, command coverage, and warnings.">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Draft</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {overview?.statusCounts.draft ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Published</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {overview?.statusCounts.published ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Deprecated</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {overview?.statusCounts.deprecated ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Validation warnings</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {overview?.validationWarnings ?? 0}
                </p>
              </div>
            </div>
          </Panel>
          <Panel title="Totals by vertical" description="Draft, published, and deprecated counts by vertical.">
            <Table
              headers={['Vertical', 'Total', 'Draft', 'Published', 'Deprecated']}
              rows={(overview?.totalsByVertical ?? []).map((item) => [
                item.verticalName,
                item.total,
                item.draft,
                item.published,
                item.deprecated,
              ])}
            />
          </Panel>
          <Panel title="Command coverage" description="Every droplet must have a command.">
            <p className="text-sm text-slate-700">
              {overview?.commandCoverage.withCommand ?? 0} of {overview?.commandCoverage.total ?? 0} droplets currently have primary commands.
            </p>
          </Panel>
        </>
      ) : null}

      {section === 'droplets' ? (
        <>
          <Panel title="Droplets" description="Create, update, delete, generate, validate, preview, publish, and deprecate vertical droplets.">
            <Table
              headers={['Droplet', 'Command', 'Mode', 'Status', 'Actions']}
              rows={droplets.map((droplet) => [
                `${droplet.name} (${droplet.slug})`,
                `${droplet.command} ${droplet.commandAliasesJson.length > 0 ? `· ${droplet.commandAliasesJson.join(', ')}` : ''}`,
                droplet.shadowSkillDefinitionJson &&
                typeof droplet.shadowSkillDefinitionJson === 'object' &&
                'execution' in droplet.shadowSkillDefinitionJson
                  ? String((droplet.shadowSkillDefinitionJson as { execution?: { mode?: string } }).execution?.mode ?? 'read')
                  : 'read',
                <div key={`${droplet.id}-status`} className="flex flex-wrap gap-2">
                  <StatusPill>{droplet.status}</StatusPill>
                  <StatusPill>{droplet.generationStatus}</StatusPill>
                </div>,
                <div key={droplet.id} className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => hydrateDropletForm(droplet)}>
                    Edit
                  </SecondaryButton>
                  <SecondaryButton onClick={() => void apiFetch(`/api/droplets/${droplet.id}/generate`, { method: 'POST' }).then(refreshCollections)}>
                    Generate
                  </SecondaryButton>
                  <SecondaryButton onClick={() => void apiFetch(`/api/droplets/${droplet.id}/validate`, { method: 'POST' }).then(refreshCollections)}>
                    Validate
                  </SecondaryButton>
                  <SecondaryButton onClick={() => void publishDroplet(droplet.id)}>
                    Publish
                  </SecondaryButton>
                  <SecondaryButton onClick={() => void deprecateDroplet(droplet.id)}>
                    Deprecate
                  </SecondaryButton>
                  <SecondaryButton onClick={() => void deleteDroplet(droplet.id)}>
                    Delete
                  </SecondaryButton>
                </div>,
              ])}
            />
          </Panel>

          <Panel title="Droplet Editor" description="Simple mode first, advanced mode for full shadow-skill control.">
            <div className="mb-4 flex gap-2">
              <PrimaryButton onClick={() => navigate('/droplet-studio/droplets/new')}>
                New droplet
              </PrimaryButton>
              <SecondaryButton onClick={() => setAdvancedMode((current) => !current)}>
                {advancedMode ? 'Simple mode' : 'Advanced mode'}
              </SecondaryButton>
              <SecondaryButton onClick={() => void generateShadow()}>
                Generate structured definition
              </SecondaryButton>
              <SecondaryButton onClick={() => void validateDroplet()}>
                Validate
              </SecondaryButton>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                value={selectedVerticalId}
                onChange={(event) => {
                  setSelectedVerticalId(event.target.value)
                  if (event.target.value) {
                    navigate(`/droplet-studio/verticals/${event.target.value}/droplets`)
                  }
                }}
              >
                <option value="">Select vertical</option>
                {verticals.map((vertical) => (
                  <option key={vertical.id} value={vertical.id}>
                    {vertical.name}
                  </option>
                ))}
              </Select>
              <Select
                value={form.dropletType}
                onChange={(event) =>
                  setForm((current) => ({ ...current, dropletType: event.target.value }))
                }
              >
                {dropletTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Name" />
              <Input value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="Slug" />
              <Input value={form.command} onChange={(event) => setForm((current) => ({ ...current, command: event.target.value }))} placeholder="/command" />
              <Input value={form.aliases} onChange={(event) => setForm((current) => ({ ...current, aliases: event.target.value }))} placeholder="/alias-one, /alias-two" />
              <Input value={form.commandHelpText} onChange={(event) => setForm((current) => ({ ...current, commandHelpText: event.target.value }))} placeholder="Help text" />
              <Select
                value={form.entity}
                onChange={(event) => hydrateFromEntity(event.target.value as DropletEntity)}
              >
                {Object.keys(dropletEntityConfigs).map((entity) => (
                  <option key={entity} value={entity}>
                    {dropletEntityConfigs[entity as DropletEntity].label}
                  </option>
                ))}
              </Select>
            </div>

            <Textarea
              className="mt-4"
              rows={2}
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Description"
            />
            <Textarea
              className="mt-4"
              rows={3}
              value={form.authorHintText}
              onChange={(event) => setForm((current) => ({ ...current, authorHintText: event.target.value }))}
              placeholder="Author hint text"
            />

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Display title" />
              <Input value={form.placement} onChange={(event) => setForm((current) => ({ ...current, placement: event.target.value }))} placeholder="Placement suggestion" />
              <Select
                value={form.previewDummyScenarioKey}
                onChange={(event) => setForm((current) => ({ ...current, previewDummyScenarioKey: event.target.value }))}
              >
                <option value="">Select dummy scenario</option>
                {dummyScenarios.map((scenario) => (
                  <option key={scenario.id} value={scenario.key}>
                    {scenario.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-sm font-medium text-slate-700">Visible fields</p>
              <div className="grid gap-2 md:grid-cols-2">
                {availableFields.map((field) => (
                  <label key={field.key} className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.fields.includes(field.key)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          fields: event.target.checked
                            ? [...current.fields, field.key]
                            : current.fields.filter((item) => item !== field.key),
                        }))
                      }
                    />
                    {field.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Input value={form.defaultSortField} onChange={(event) => setForm((current) => ({ ...current, defaultSortField: event.target.value }))} placeholder="Default sort field" />
              <Select value={form.defaultSortDirection} onChange={(event) => setForm((current) => ({ ...current, defaultSortDirection: event.target.value as 'asc' | 'desc' }))}>
                <option value="asc">asc</option>
                <option value="desc">desc</option>
              </Select>
              <Input value={form.groupingField} onChange={(event) => setForm((current) => ({ ...current, groupingField: event.target.value }))} placeholder="Grouping field" />
            </div>

            <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.summaryEnabled}
                onChange={(event) => setForm((current) => ({ ...current, summaryEnabled: event.target.checked }))}
              />
              Summary enabled
            </label>
            <Input
              className="mt-3"
              value={form.summaryFields}
              onChange={(event) => setForm((current) => ({ ...current, summaryFields: event.target.value }))}
              placeholder="Summary fields comma-separated"
            />
            <Textarea
              className="mt-4"
              rows={5}
              value={form.labelsJson}
              onChange={(event) => setForm((current) => ({ ...current, labelsJson: event.target.value }))}
              placeholder="Labels JSON"
            />

            {advancedMode ? (
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">Advanced sections</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Identity, Data Sources, Logic, Presentation, Interaction, Writeback, Preview, Raw JSON.
                  </p>
                </div>
                <Textarea
                  rows={18}
                  value={form.shadowJson}
                  onChange={(event) => setForm((current) => ({ ...current, shadowJson: event.target.value }))}
                  placeholder="Shadow skill definition JSON"
                />
              </div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <PrimaryButton onClick={() => void saveDroplet()}>
                {form.id ? 'Update droplet' : 'Add droplet'}
              </PrimaryButton>
              <SecondaryButton onClick={() => void previewCurrent()}>
                Preview
              </SecondaryButton>
              {form.id ? (
                <SecondaryButton onClick={() => void publishDroplet(form.id)}>
                  Publish
                </SecondaryButton>
              ) : null}
            </div>
          </Panel>
        </>
      ) : null}

      {section === 'catalog' ? (
        <Panel title="Public Catalog" description="Published droplets grouped by vertical with command-first visibility.">
          <Input
            value={catalogSearch}
            onChange={(event) => setCatalogSearch(event.target.value)}
            placeholder="Search command, name, type, or vertical"
          />
          <div className="mt-4">
            <Table
              headers={['Vertical', 'Droplet', 'Command', 'Type', 'Version', 'Status']}
              rows={filteredCatalog.map((item) => [
                item.vertical?.name ?? 'Unknown',
                item.name,
                item.command,
                item.dropletType,
                item.version,
                item.status,
              ])}
            />
          </div>
        </Panel>
      ) : null}

      {section === 'preview' ? (
        <>
          <Panel title="Preview Lab" description="Run droplets against dummy data or sample tenant data without publishing.">
            <div className="flex flex-wrap gap-3">
              <PrimaryButton onClick={() => void previewCurrent()}>
                Preview current draft
              </PrimaryButton>
              <SecondaryButton onClick={() => void runCurrentDroplet()}>
                Run selected droplet
              </SecondaryButton>
            </div>
          </Panel>
          <Panel title="Execution Log" description="Debug view of selected entities, transforms, output blocks, and writeback target.">
            <Textarea rows={14} value={runDebug} readOnly />
          </Panel>
        </>
      ) : null}

      {section === 'prompt-templates' ? (
        <>
          <Panel title="Prompt Templates" description="Manage internal prompt templates used for hint to shadow generation.">
            <Table
              headers={['Template', 'Scope', 'Version', 'Status', 'Actions']}
              rows={promptTemplates.map((template) => [
                `${template.name} (${template.key})`,
                template.vertical?.name ?? 'Global',
                template.version,
                template.status,
                <div key={template.id} className="flex gap-2">
                  <SecondaryButton
                    onClick={() =>
                      setPromptForm({
                        id: template.id,
                        verticalId: template.verticalId ?? '',
                        key: template.key,
                        name: template.name,
                        purpose: template.purpose,
                        templateText: template.templateText,
                        version: String(template.version),
                        status: template.status,
                      })
                    }
                  >
                    Edit
                  </SecondaryButton>
                  <SecondaryButton onClick={() => void removePromptTemplate(template.id)}>
                    Delete
                  </SecondaryButton>
                </div>,
              ])}
            />
          </Panel>
          <Panel title="Prompt Template Editor" description="CRUD prompt templates with version tracking.">
            <div className="grid gap-4 md:grid-cols-2">
              <Select value={promptForm.verticalId} onChange={(event) => setPromptForm((current) => ({ ...current, verticalId: event.target.value }))}>
                <option value="">Global template</option>
                {verticals.map((vertical) => (
                  <option key={vertical.id} value={vertical.id}>
                    {vertical.name}
                  </option>
                ))}
              </Select>
              <Input value={promptForm.version} onChange={(event) => setPromptForm((current) => ({ ...current, version: event.target.value }))} placeholder="Version" />
              <Input value={promptForm.key} onChange={(event) => setPromptForm((current) => ({ ...current, key: event.target.value }))} placeholder="Key" />
              <Input value={promptForm.name} onChange={(event) => setPromptForm((current) => ({ ...current, name: event.target.value }))} placeholder="Name" />
              <Input value={promptForm.purpose} onChange={(event) => setPromptForm((current) => ({ ...current, purpose: event.target.value }))} placeholder="Purpose" />
              <Select value={promptForm.status} onChange={(event) => setPromptForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
            </div>
            <Textarea
              className="mt-4"
              rows={8}
              value={promptForm.templateText}
              onChange={(event) => setPromptForm((current) => ({ ...current, templateText: event.target.value }))}
            />
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void savePromptTemplate()}>
                {promptForm.id ? 'Update template' : 'Add template'}
              </PrimaryButton>
              <SecondaryButton onClick={() => setPromptForm(emptyPromptTemplate())}>
                Reset
              </SecondaryButton>
            </div>
          </Panel>
        </>
      ) : null}

      {section === 'dummy-data' ? (
        <>
          <Panel title="Dummy Data" description="Manage preview scenarios for supported entities and domains.">
            <Table
              headers={['Scenario', 'Entity', 'Scope', 'Status', 'Actions']}
              rows={dummyScenarios.map((scenario) => [
                `${scenario.name} (${scenario.key})`,
                scenario.entity,
                scenario.vertical?.name ?? 'Global',
                scenario.status,
                <div key={scenario.id} className="flex gap-2">
                  <SecondaryButton
                    onClick={() =>
                      setDummyForm({
                        id: scenario.id,
                        verticalId: scenario.verticalId ?? '',
                        key: scenario.key,
                        name: scenario.name,
                        description: scenario.description ?? '',
                        entity: scenario.entity,
                        scenarioJson: JSON.stringify(scenario.scenarioJson, null, 2),
                        status: scenario.status,
                      })
                    }
                  >
                    Edit
                  </SecondaryButton>
                  <SecondaryButton onClick={() => void removeDummyScenario(scenario.id)}>
                    Delete
                  </SecondaryButton>
                </div>,
              ])}
            />
          </Panel>
          <Panel title="Dummy Scenario Editor" description="Create preview data for droplets and test runs.">
            <div className="grid gap-4 md:grid-cols-2">
              <Select value={dummyForm.verticalId} onChange={(event) => setDummyForm((current) => ({ ...current, verticalId: event.target.value }))}>
                <option value="">Global scenario</option>
                {verticals.map((vertical) => (
                  <option key={vertical.id} value={vertical.id}>
                    {vertical.name}
                  </option>
                ))}
              </Select>
              <Select value={dummyForm.status} onChange={(event) => setDummyForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </Select>
              <Input value={dummyForm.key} onChange={(event) => setDummyForm((current) => ({ ...current, key: event.target.value }))} placeholder="Key" />
              <Input value={dummyForm.name} onChange={(event) => setDummyForm((current) => ({ ...current, name: event.target.value }))} placeholder="Name" />
              <Input value={dummyForm.entity} onChange={(event) => setDummyForm((current) => ({ ...current, entity: event.target.value }))} placeholder="Entity" />
              <Input value={dummyForm.description} onChange={(event) => setDummyForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description" />
            </div>
            <Textarea
              className="mt-4"
              rows={12}
              value={dummyForm.scenarioJson}
              onChange={(event) => setDummyForm((current) => ({ ...current, scenarioJson: event.target.value }))}
            />
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void saveDummyScenario()}>
                {dummyForm.id ? 'Update scenario' : 'Add scenario'}
              </PrimaryButton>
              <SecondaryButton onClick={() => setDummyForm(emptyDummyScenario())}>
                Reset
              </SecondaryButton>
            </div>
          </Panel>
        </>
      ) : null}

      {section === 'versions' ? (
        <Panel title="Versions" description="Inspect previous droplet versions and status snapshots.">
          {form.id ? (
            <Table
              headers={['Version', 'Status snapshot', 'Prompt version', 'Created']}
              rows={(currentVersions ?? []).map((version) => [
                version.version,
                version.statusSnapshot,
                version.generationPromptVersion ?? 'none',
                new Date(version.createdAt).toLocaleString(),
              ])}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              Select a droplet first to inspect versions.
            </div>
          )}
        </Panel>
      ) : null}
    </SurfaceShell>
  )
}
