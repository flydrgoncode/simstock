import { useEffect, useMemo, useState } from 'react'

import { APP_VERSION } from '../lib/appMeta'
import { apiFetch } from '../lib/api'
import { CommandChatPanel } from '../components/chat/CommandChatPanel'
import { DropletRenderer } from '../components/droplets/DropletRenderer'
import {
  Input,
  Panel,
  PrimaryButton,
  SecondaryButton,
  Select,
  SurfaceShell,
  Table,
  Textarea,
} from '../components/admin/ui'
import { useBackofficeStore } from '../store/backoffice'

type Tenant = {
  id: string
  name: string
  slug: string
  status: string
  defaultCurrency: string
  defaultTimezone: string
}

type TenantShell = {
  id: string
  tenantId: string
  verticalId: string
  verticalDefinitionId: string
  name: string
  slug: string
  status: string
  vertical: { name: string }
  verticalDefinition?: { version: number; status: string }
}

type User = {
  id: string
  tenantId: string
  name: string
  email: string
  title: string | null
  status: string
}

type Person = {
  id: string
  tenantId: string
  managerId: string | null
  name: string
  email: string | null
  role: string | null
  department: string | null
  active: boolean
}

type Revenue = {
  id: string
  month: string
  actualRevenue: number
  forecastRevenue: number
  targetRevenue: number
  notes: string | null
}

type Headcount = {
  id: string
  month: string
  actualHeadcount: number
  forecastHeadcount: number
  targetHeadcount: number
  notes: string | null
}

type Customer = {
  id: string
  name: string
  segment: string | null
  geography: string | null
  industry: string | null
  status: string
  ownerId?: string | null
  owner?: { name: string } | null
}

type Order = {
  id: string
  customerId: string
  orderNumber: string | null
  orderDate: string
  amount: number
  status: string
  productLine: string | null
  notes: string | null
  customer?: { name: string }
}

type Stage = {
  id: string
  name: string
  stageOrder: number
  defaultProbability: number | null
  isClosedWon: boolean
  isClosedLost: boolean
}

type Opportunity = {
  id: string
  customerId: string | null
  ownerId: string | null
  stageId: string
  name: string
  amount: number
  probability: number
  expectedCloseDate: string | null
  source: string | null
  status: string
  customer?: { name: string } | null
  owner?: { name: string } | null
  stage?: { name: string } | null
}

type Analytics = {
  months?: Array<unknown>
  summary?: Record<string, unknown>
}

type MissionHomeOverview = {
  totalUserActions: number
  activeUsers: number
  activePeople: number
  actionsByType: Record<string, number>
  actionsByEntity: Record<string, number>
  recentActions: Array<{
    id: string
    action: string
    entityType: string
    createdAt: string
  }>
}

type MissionHomeContext = {
  tenant: Tenant | null
  shell: TenantShell | null
  company: {
    id: string
    name: string
    slug: string
    status: string
    vertical: { id: string; name: string; key: string }
  } | null
  activeDropletCount: number
  catalogDropletCount: number
}

type TenantCatalogDroplet = {
  id: string
  name: string
  slug: string
  description: string | null
  dropletType: string
  command: string
  commandAliasesJson?: string[]
  commandHelpText: string | null
  authorHintText?: string | null
  generationStatus?: string
  previewDummyDataConfigJson?: Record<string, unknown> | null
  shadowSkillDefinitionJson?: unknown
  supportedEntitiesJson?: string[]
  status: string
  dropletDefinitionJson: unknown
  assignment: {
    id: string
    nameOverride: string | null
    placement: string | null
    active: boolean
    configOverrideJson?: Record<string, unknown> | null
  } | null
}

type TenantCatalogResponse = {
  shell: TenantShell
  droplets: TenantCatalogDroplet[]
}

type Preview =
  | {
      entity: string
      title: string
      visibleFields: string[]
      labels: Record<string, string>
      rows: Array<Record<string, unknown>>
      grouping?: Array<{ group: string; rows: Array<Record<string, unknown>> }>
      summary?: Record<string, number>
      totalRows?: number
    }
  | {
      success: boolean
      summaryText: string
      blocks: Array<Record<string, unknown>>
      warnings?: string[]
      errors?: string[]
      debug?: Record<string, unknown>
    }

const nav = [
  { to: '/', label: 'Runtime' },
  { to: '/mission-control', label: 'Mission Control' },
  { to: '/droplet-studio', label: 'Droplet Studio' },
  { to: '/backoffice', label: 'Mission Home' },
]

function toMonthInput(value: string) {
  return value.slice(0, 7)
}

function toDateInput(value: string | null) {
  return value ? value.slice(0, 10) : ''
}

export function HomeControl() {
  const missionHomeSections = [
    { key: 'company', label: 'Company Overview' },
    { key: 'users', label: 'Users' },
    { key: 'org', label: 'Org Chart' },
    { key: 'data', label: 'Data Operations' },
    { key: 'droplets', label: 'Droplet Activation' },
  ] as const

  const activeTenantId = useBackofficeStore((state) => state.activeTenantId)
  const setActiveTenantId = useBackofficeStore((state) => state.setActiveTenantId)
  const [activeSection, setActiveSection] = useState<
    (typeof missionHomeSections)[number]['key']
  >('company')
  const [activeDataSection, setActiveDataSection] = useState<
    'revenue' | 'headcount' | 'customers' | 'orders' | 'stages' | 'opportunities'
  >('revenue')
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [shell, setShell] = useState<TenantShell | null>(null)
  const [missionContext, setMissionContext] = useState<MissionHomeContext | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [people, setPeople] = useState<Person[]>([])
  const [revenue, setRevenue] = useState<Revenue[]>([])
  const [headcount, setHeadcount] = useState<Headcount[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [catalog, setCatalog] = useState<TenantCatalogDroplet[]>([])
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedCatalogDropletId, setSelectedCatalogDropletId] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [missionHomeOverview, setMissionHomeOverview] =
    useState<MissionHomeOverview | null>(null)
  const [analytics, setAnalytics] = useState<{
    revenue: Analytics | null
    pipeline: Analytics | null
    customers: Analytics | null
  }>({ revenue: null, pipeline: null, customers: null })

  const [userForm, setUserForm] = useState({
    id: '',
    name: '',
    email: '',
    title: '',
    status: 'ACTIVE',
  })
  const [personForm, setPersonForm] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
    department: '',
    managerId: '',
    active: true,
  })
  const [revenueForm, setRevenueForm] = useState({
    id: '',
    month: '',
    actualRevenue: '',
    forecastRevenue: '',
    targetRevenue: '',
    notes: '',
  })
  const [headcountForm, setHeadcountForm] = useState({
    id: '',
    month: '',
    actualHeadcount: '',
    forecastHeadcount: '',
    targetHeadcount: '',
    notes: '',
  })
  const [customerForm, setCustomerForm] = useState({
    id: '',
    name: '',
    segment: '',
    geography: '',
    industry: '',
    status: 'PROSPECT',
    ownerId: '',
  })
  const [orderForm, setOrderForm] = useState({
    id: '',
    customerId: '',
    orderNumber: '',
    orderDate: '',
    amount: '',
    status: 'DRAFT',
    productLine: '',
    notes: '',
  })
  const [stageForm, setStageForm] = useState({
    id: '',
    name: '',
    stageOrder: '',
    defaultProbability: '',
    isClosedWon: false,
    isClosedLost: false,
  })
  const [opportunityForm, setOpportunityForm] = useState({
    id: '',
    customerId: '',
    ownerId: '',
    stageId: '',
    name: '',
    amount: '',
    probability: '',
    expectedCloseDate: '',
    source: '',
    status: 'OPEN',
  })
  const [assignmentForm, setAssignmentForm] = useState({
    id: '',
    dropletId: '',
    nameOverride: '',
    placement: '',
    configOverrideJson: '{}',
  })

  async function loadTenantData(tenantId: string) {
    const [
      tenantsData,
      missionContextData,
      shellData,
      usersData,
      peopleData,
      revenueData,
      headcountData,
      customersData,
      ordersData,
      stagesData,
      opportunitiesData,
      catalogData,
      missionOverviewData,
      revenueAnalytics,
      pipelineAnalytics,
      customerAnalytics,
    ] = await Promise.all([
      apiFetch<Tenant[]>('/api/tenants'),
      apiFetch<MissionHomeContext>(`/api/tenants/${tenantId}/mission-home/context`),
      apiFetch<TenantShell>(`/api/tenants/${tenantId}/shell`).catch(() => null),
      apiFetch<User[]>(`/api/tenants/${tenantId}/users`),
      apiFetch<Person[]>(`/api/tenants/${tenantId}/people`),
      apiFetch<Revenue[]>(`/api/tenants/${tenantId}/revenue`),
      apiFetch<Headcount[]>(`/api/tenants/${tenantId}/headcount`),
      apiFetch<Customer[]>(`/api/tenants/${tenantId}/customers`),
      apiFetch<Order[]>(`/api/tenants/${tenantId}/orders`),
      apiFetch<Stage[]>(`/api/tenants/${tenantId}/stages`),
      apiFetch<Opportunity[]>(`/api/tenants/${tenantId}/opportunities`),
      apiFetch<TenantCatalogResponse>(`/api/tenants/${tenantId}/droplets`),
      apiFetch<MissionHomeOverview>(
        `/api/tenants/${tenantId}/analytics/mission-home-overview`
      ),
      apiFetch<Analytics>(`/api/tenants/${tenantId}/analytics/revenue-summary`),
      apiFetch<Analytics>(`/api/tenants/${tenantId}/analytics/pipeline-summary`),
      apiFetch<Analytics>(`/api/tenants/${tenantId}/analytics/customer-summary`),
    ])

    setTenants(tenantsData)
    setMissionContext(missionContextData)
    setShell(shellData ?? (catalogData as TenantCatalogResponse).shell ?? null)
    setUsers(usersData)
    setPeople(peopleData)
    setRevenue(revenueData)
    setHeadcount(headcountData)
    setCustomers(customersData)
    setOrders(ordersData)
    setStages(stagesData)
    setOpportunities(opportunitiesData)
    setCatalog(catalogData.droplets)
    setMissionHomeOverview(missionOverviewData)
    setSelectedCatalogDropletId((current) =>
      current && catalogData.droplets.some((droplet) => droplet.id === current)
        ? current
        : catalogData.droplets[0]?.id ?? null
    )
    setAnalytics({
      revenue: revenueAnalytics,
      pipeline: pipelineAnalytics,
      customers: customerAnalytics,
    })
  }

  useEffect(() => {
    void apiFetch<Tenant[]>('/api/tenants').then((items) => {
      setTenants(items)
      if (!activeTenantId && items[0]) {
        setActiveTenantId(items[0].id)
      }
    })
  }, [activeTenantId, setActiveTenantId])

  useEffect(() => {
    if (!activeTenantId) return
    void loadTenantData(activeTenantId)
  }, [activeTenantId])

  const orgRows = useMemo(
    () =>
      people.map((person) => ({
        ...person,
        managerName: people.find((candidate) => candidate.id === person.managerId)?.name ?? 'Top level',
      })),
    [people]
  )

  const filteredCatalog = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase()
    return catalog.filter((droplet) => {
      if (!query) return true
      return (
        droplet.name.toLowerCase().includes(query) ||
        droplet.command.toLowerCase().includes(query) ||
        (droplet.description ?? '').toLowerCase().includes(query) ||
        droplet.dropletType.toLowerCase().includes(query)
      )
    })
  }, [catalog, catalogSearch])

  const activeCatalogCount = useMemo(
    () => catalog.filter((droplet) => droplet.assignment?.active).length,
    [catalog]
  )

  const selectedCatalogDroplet =
    filteredCatalog.find((droplet) => droplet.id === selectedCatalogDropletId) ??
    catalog.find((droplet) => droplet.id === selectedCatalogDropletId) ??
    null

  async function refresh() {
    if (activeTenantId) {
      await loadTenantData(activeTenantId)
    }
  }

  async function saveUser() {
    if (!activeTenantId) return
    const payload = {
      tenantId: activeTenantId,
      name: userForm.name,
      email: userForm.email,
      title: userForm.title || null,
      status: userForm.status,
    }
    if (userForm.id) {
      await apiFetch(`/api/users/${userForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setUserForm({ id: '', name: '', email: '', title: '', status: 'ACTIVE' })
    await refresh()
  }

  async function deleteUser(id: string) {
    await apiFetch(`/api/users/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function savePerson() {
    if (!activeTenantId) return
    const payload = {
      name: personForm.name,
      email: personForm.email || null,
      role: personForm.role || null,
      department: personForm.department || null,
      managerId: personForm.managerId || null,
      active: personForm.active,
    }
    if (personForm.id) {
      await apiFetch(`/api/people/${personForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/tenants/${activeTenantId}/people`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setPersonForm({
      id: '',
      name: '',
      email: '',
      role: '',
      department: '',
      managerId: '',
      active: true,
    })
    await refresh()
  }

  async function deletePerson(id: string) {
    await apiFetch(`/api/people/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function saveRevenue() {
    if (!activeTenantId) return
    const payload = {
      month: revenueForm.month,
      actualRevenue: Number(revenueForm.actualRevenue),
      forecastRevenue: Number(revenueForm.forecastRevenue),
      targetRevenue: Number(revenueForm.targetRevenue),
      notes: revenueForm.notes || null,
    }
    if (revenueForm.id) {
      await apiFetch(`/api/revenue/${revenueForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/tenants/${activeTenantId}/revenue`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setRevenueForm({
      id: '',
      month: '',
      actualRevenue: '',
      forecastRevenue: '',
      targetRevenue: '',
      notes: '',
    })
    await refresh()
  }

  async function deleteRevenue(id: string) {
    await apiFetch(`/api/revenue/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function saveHeadcount() {
    if (!activeTenantId) return
    const payload = {
      month: headcountForm.month,
      actualHeadcount: Number(headcountForm.actualHeadcount),
      forecastHeadcount: Number(headcountForm.forecastHeadcount),
      targetHeadcount: Number(headcountForm.targetHeadcount),
      notes: headcountForm.notes || null,
    }
    if (headcountForm.id) {
      await apiFetch(`/api/headcount/${headcountForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/tenants/${activeTenantId}/headcount`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setHeadcountForm({
      id: '',
      month: '',
      actualHeadcount: '',
      forecastHeadcount: '',
      targetHeadcount: '',
      notes: '',
    })
    await refresh()
  }

  async function deleteHeadcount(id: string) {
    await apiFetch(`/api/headcount/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function saveCustomer() {
    if (!activeTenantId) return
    const payload = {
      name: customerForm.name,
      segment: customerForm.segment || null,
      geography: customerForm.geography || null,
      industry: customerForm.industry || null,
      status: customerForm.status,
      ownerId: customerForm.ownerId || null,
    }
    if (customerForm.id) {
      await apiFetch(`/api/customers/${customerForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/tenants/${activeTenantId}/customers`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setCustomerForm({
      id: '',
      name: '',
      segment: '',
      geography: '',
      industry: '',
      status: 'PROSPECT',
      ownerId: '',
    })
    await refresh()
  }

  async function deleteCustomer(id: string) {
    await apiFetch(`/api/customers/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function saveOrder() {
    if (!activeTenantId) return
    const payload = {
      customerId: orderForm.customerId,
      orderNumber: orderForm.orderNumber || null,
      orderDate: orderForm.orderDate,
      amount: Number(orderForm.amount),
      status: orderForm.status,
      productLine: orderForm.productLine || null,
      notes: orderForm.notes || null,
    }
    if (orderForm.id) {
      await apiFetch(`/api/orders/${orderForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/tenants/${activeTenantId}/orders`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setOrderForm({
      id: '',
      customerId: '',
      orderNumber: '',
      orderDate: '',
      amount: '',
      status: 'DRAFT',
      productLine: '',
      notes: '',
    })
    await refresh()
  }

  async function deleteOrder(id: string) {
    await apiFetch(`/api/orders/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function saveStage() {
    if (!activeTenantId) return
    const payload = {
      name: stageForm.name,
      stageOrder: Number(stageForm.stageOrder),
      defaultProbability:
        stageForm.defaultProbability === ''
          ? null
          : Number(stageForm.defaultProbability),
      isClosedWon: stageForm.isClosedWon,
      isClosedLost: stageForm.isClosedLost,
    }
    if (stageForm.id) {
      await apiFetch(`/api/stages/${stageForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/tenants/${activeTenantId}/stages`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setStageForm({
      id: '',
      name: '',
      stageOrder: '',
      defaultProbability: '',
      isClosedWon: false,
      isClosedLost: false,
    })
    await refresh()
  }

  async function deleteStage(id: string) {
    await apiFetch(`/api/stages/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function saveOpportunity() {
    if (!activeTenantId) return
    const payload = {
      customerId: opportunityForm.customerId || null,
      ownerId: opportunityForm.ownerId || null,
      stageId: opportunityForm.stageId,
      name: opportunityForm.name,
      amount: Number(opportunityForm.amount),
      probability: Number(opportunityForm.probability),
      expectedCloseDate: opportunityForm.expectedCloseDate || null,
      source: opportunityForm.source || null,
      status: opportunityForm.status,
    }
    if (opportunityForm.id) {
      await apiFetch(`/api/opportunities/${opportunityForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch(`/api/tenants/${activeTenantId}/opportunities`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setOpportunityForm({
      id: '',
      customerId: '',
      ownerId: '',
      stageId: '',
      name: '',
      amount: '',
      probability: '',
      expectedCloseDate: '',
      source: '',
      status: 'OPEN',
    })
    await refresh()
  }

  async function deleteOpportunity(id: string) {
    await apiFetch(`/api/opportunities/${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function activateDroplet(dropletId: string) {
    if (!activeTenantId) return
    await apiFetch(`/api/tenants/${activeTenantId}/droplets/${dropletId}/activate`, {
      method: 'POST',
      body: JSON.stringify({
        placement: assignmentForm.placement || null,
        configOverrideJson: JSON.parse(assignmentForm.configOverrideJson || '{}'),
      }),
    })
    await refresh()
  }

  async function deactivateDroplet(dropletId: string) {
    if (!activeTenantId) return
    await apiFetch(
      `/api/tenants/${activeTenantId}/droplets/${dropletId}/deactivate`,
      { method: 'POST' }
    )
    await refresh()
  }

  async function saveAssignmentOverride() {
    if (!assignmentForm.id) return
    await apiFetch(`/api/tenant-droplets/${assignmentForm.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        nameOverride: assignmentForm.nameOverride || null,
        placement: assignmentForm.placement || null,
        configOverrideJson: JSON.parse(assignmentForm.configOverrideJson || '{}'),
      }),
    })
    await refresh()
  }

  function selectCatalogDroplet(droplet: TenantCatalogDroplet) {
    setSelectedCatalogDropletId(droplet.id)
    setAssignmentForm({
      id: droplet.assignment?.id ?? '',
      dropletId: droplet.id,
      nameOverride: droplet.assignment?.nameOverride ?? '',
      placement: droplet.assignment?.placement ?? '',
      configOverrideJson: JSON.stringify(
        droplet.assignment?.configOverrideJson ?? {},
        null,
        2
      ),
    })
  }

  async function previewDroplet(droplet: TenantCatalogDroplet) {
    if (!activeTenantId) return
    setPreview(
      await apiFetch<Preview>(`/api/tenants/${activeTenantId}/droplets/preview`, {
        method: 'POST',
        body: JSON.stringify({
          ...(droplet.shadowSkillDefinitionJson
            ? { shadowSkillDefinitionJson: droplet.shadowSkillDefinitionJson }
            : { dropletDefinitionJson: droplet.dropletDefinitionJson }),
          dummyScenarioKey:
            typeof droplet.previewDummyDataConfigJson?.scenarioKey === 'string'
              ? droplet.previewDummyDataConfigJson.scenarioKey
              : undefined,
        }),
      })
    )
  }

  async function seedDemo() {
    if (!activeTenantId) return
    await apiFetch(`/api/tenants/${activeTenantId}/demo/seed`, { method: 'POST' })
    await refresh()
  }

  async function resetDemo() {
    if (!activeTenantId) return
    await apiFetch(`/api/tenants/${activeTenantId}/demo/reset`, { method: 'POST' })
    await refresh()
  }

  return (
    <SurfaceShell
      surface="mission-home"
      eyebrow="Mission Home"
      title="Mission Home"
      version={APP_VERSION}
      description="Configure this company environment, manage operations, and activate public droplets from the vertical catalog."
      nav={nav}
      sidePanel={<CommandChatPanel tenantId={activeTenantId} title="Mission Home chat" />}
    >
      <Panel title="Mission Home Context" description="Mission Home configures one tenant/company context at a time.">
        <div className="grid gap-4 md:grid-cols-[minmax(0,320px)_1fr]">
          <Select
            value={activeTenantId ?? ''}
            onChange={(event) => setActiveTenantId(event.target.value || null)}
          >
            <option value="">Select tenant</option>
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.name}
              </option>
            ))}
          </Select>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Company</p>
              <p className="mt-1 font-medium text-slate-900">
                {missionContext?.company?.name ?? 'No company'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Vertical</p>
              <p className="mt-1 font-medium text-slate-900">
                {missionContext?.company?.vertical.name ?? shell?.vertical.name ?? 'Missing'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Shell</p>
              <p className="mt-1 font-medium text-slate-900">
                {shell?.name ?? 'Not configured'}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <PrimaryButton onClick={() => void seedDemo()}>Seed demo data</PrimaryButton>
          <SecondaryButton onClick={() => void resetDemo()}>Reset tenant demo data</SecondaryButton>
        </div>
      </Panel>

      <Panel title="Mission Home Menu" description="Use the internal menu to focus on one management area at a time.">
        <div className="flex flex-wrap gap-2">
          {missionHomeSections.map((section) => (
            <button
              key={section.key}
              className={`rounded-2xl px-4 py-3 text-sm transition ${
                activeSection === section.key
                  ? 'bg-teal-100 text-teal-800'
                  : 'border border-slate-300 bg-slate-50 text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800'
              }`}
              onClick={() => setActiveSection(section.key)}
            >
              {section.label}
            </button>
          ))}
        </div>
      </Panel>

      {activeSection === 'company' ? (
      <Panel title="Company Overview" description="Company context, shell health, activity, and tenant analytics.">
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <p className="text-sm text-teal-700">Company</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {missionContext?.company?.name ?? '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <p className="text-sm text-teal-700">User actions</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {missionHomeOverview?.totalUserActions ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Active users</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {missionHomeOverview?.activeUsers ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Active people</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {missionHomeOverview?.activePeople ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Catalog droplets</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {missionContext?.catalogDropletCount ?? catalog.length}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Active droplets</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">
              {missionContext?.activeDropletCount ?? activeCatalogCount}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Company slug</p>
            <p className="mt-1 font-medium text-slate-900">
              {missionContext?.company?.slug ?? '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Company status</p>
            <p className="mt-1 font-medium text-slate-900">
              {missionContext?.company?.status ?? '—'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Vertical definition</p>
            <p className="mt-1 font-medium text-slate-900">
              {shell?.verticalDefinition?.version ? `v${shell.verticalDefinition.version}` : 'Missing'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Tenant shell</p>
            <p className="mt-1 font-medium text-slate-900">
              {shell?.name ?? 'Not configured'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Actions by type</p>
            <div className="mt-3 space-y-2">
              {Object.entries(missionHomeOverview?.actionsByType ?? {}).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm">
                  <span className="text-slate-600">{key}</span>
                  <span className="font-medium text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Recent tenant actions</p>
            <div className="mt-3 space-y-2">
              {(missionHomeOverview?.recentActions ?? []).map((item) => (
                <div key={item.id} className="rounded-2xl bg-white px-3 py-2 text-sm">
                  <p className="font-medium text-slate-900">
                    {item.action} · {item.entityType}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <p className="text-sm text-teal-700">Revenue analytics</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-800">
              {JSON.stringify(analytics.revenue?.summary ?? {}, null, 2)}
            </pre>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <p className="text-sm text-teal-700">Pipeline analytics</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-800">
              {JSON.stringify(analytics.pipeline?.summary ?? {}, null, 2)}
            </pre>
          </div>
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-4">
            <p className="text-sm text-teal-700">Customer analytics</p>
            <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-800">
              {JSON.stringify(analytics.customers?.summary ?? {}, null, 2)}
            </pre>
          </div>
        </div>
      </Panel>
      ) : null}

      {activeSection === 'users' ? (
      <Panel title="Users" description="Full CRUD for tenant users.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <Table
            headers={['User', 'Title', 'Status', 'Actions']}
            rows={users.map((user) => [
              `${user.name} (${user.email})`,
              user.title ?? '—',
              user.status,
              <div key={user.id} className="flex gap-2">
                <SecondaryButton onClick={() => setUserForm({
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  title: user.title ?? '',
                  status: user.status,
                })}>Edit</SecondaryButton>
                <SecondaryButton onClick={() => void deleteUser(user.id)}>Delete</SecondaryButton>
              </div>,
            ])}
          />
          <div className="space-y-3">
            <Input placeholder="Name" value={userForm.name} onChange={(event) => setUserForm((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="Email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} />
            <Input placeholder="Title" value={userForm.title} onChange={(event) => setUserForm((current) => ({ ...current, title: event.target.value }))} />
            <Select value={userForm.status} onChange={(event) => setUserForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INVITED">INVITED</option>
              <option value="INACTIVE">INACTIVE</option>
            </Select>
            <PrimaryButton onClick={() => void saveUser()}>
              {userForm.id ? 'Update user' : 'Add user'}
            </PrimaryButton>
          </div>
        </div>
      </Panel>
      ) : null}

      {activeSection === 'org' ? (
      <Panel title="Org Chart" description="Full CRUD for business people and reporting lines.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_360px]">
          <Table
            headers={['Person', 'Manager', 'Department', 'Actions']}
            rows={orgRows.map((person) => [
              `${person.name} (${person.role ?? 'No role'})`,
              person.managerName,
              person.department ?? '—',
              <div key={person.id} className="flex gap-2">
                <SecondaryButton onClick={() => setPersonForm({
                  id: person.id,
                  name: person.name,
                  email: person.email ?? '',
                  role: person.role ?? '',
                  department: person.department ?? '',
                  managerId: person.managerId ?? '',
                  active: person.active,
                })}>Edit</SecondaryButton>
                <SecondaryButton onClick={() => void deletePerson(person.id)}>Delete</SecondaryButton>
              </div>,
            ])}
          />
          <div className="space-y-3">
            <Input placeholder="Name" value={personForm.name} onChange={(event) => setPersonForm((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="Email" value={personForm.email} onChange={(event) => setPersonForm((current) => ({ ...current, email: event.target.value }))} />
            <Input placeholder="Role" value={personForm.role} onChange={(event) => setPersonForm((current) => ({ ...current, role: event.target.value }))} />
            <Input placeholder="Department" value={personForm.department} onChange={(event) => setPersonForm((current) => ({ ...current, department: event.target.value }))} />
            <Select value={personForm.managerId} onChange={(event) => setPersonForm((current) => ({ ...current, managerId: event.target.value }))}>
              <option value="">Top level</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={personForm.active} onChange={(event) => setPersonForm((current) => ({ ...current, active: event.target.checked }))} />
              Active
            </label>
            <PrimaryButton onClick={() => void savePerson()}>
              {personForm.id ? 'Update person' : 'Add person'}
            </PrimaryButton>
          </div>
        </div>
      </Panel>
      ) : null}

      {activeSection === 'data' ? (
      <Panel title="Data Operations" description="Full CRUD for tenant data operations by domain area.">
        <div className="mb-5 flex flex-wrap gap-2">
          {[
            { key: 'revenue', label: 'Revenue' },
            { key: 'headcount', label: 'Headcount' },
            { key: 'customers', label: 'Customers' },
            { key: 'orders', label: 'Orders' },
            { key: 'stages', label: 'Sales Stages' },
            { key: 'opportunities', label: 'Opportunities' },
          ].map((section) => (
            <button
              key={section.key}
              className={`rounded-2xl px-4 py-3 text-sm transition ${
                activeDataSection === section.key
                  ? 'bg-teal-100 text-teal-800'
                  : 'border border-slate-300 bg-slate-50 text-slate-700 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800'
              }`}
              onClick={() =>
                setActiveDataSection(
                  section.key as
                    | 'revenue'
                    | 'headcount'
                    | 'customers'
                    | 'orders'
                    | 'stages'
                    | 'opportunities'
                )
              }
            >
              {section.label}
            </button>
          ))}
        </div>
      {activeDataSection === 'revenue' ? (
      <Panel title="Revenue" description="Full CRUD for monthly revenue snapshots.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <Table headers={['Month', 'Actual', 'Forecast', 'Target', 'Actions']} rows={revenue.map((item) => [
            item.month.slice(0, 7),
            item.actualRevenue.toString(),
            item.forecastRevenue.toString(),
            item.targetRevenue.toString(),
            <div key={item.id} className="flex gap-2">
              <SecondaryButton onClick={() => setRevenueForm({
                id: item.id,
                month: toMonthInput(item.month),
                actualRevenue: String(item.actualRevenue),
                forecastRevenue: String(item.forecastRevenue),
                targetRevenue: String(item.targetRevenue),
                notes: item.notes ?? '',
              })}>Edit</SecondaryButton>
              <SecondaryButton onClick={() => void deleteRevenue(item.id)}>Delete</SecondaryButton>
            </div>,
          ])} />
          <div className="space-y-3">
            <Input placeholder="YYYY-MM" value={revenueForm.month} onChange={(event) => setRevenueForm((current) => ({ ...current, month: event.target.value }))} />
            <Input placeholder="Actual" value={revenueForm.actualRevenue} onChange={(event) => setRevenueForm((current) => ({ ...current, actualRevenue: event.target.value }))} />
            <Input placeholder="Forecast" value={revenueForm.forecastRevenue} onChange={(event) => setRevenueForm((current) => ({ ...current, forecastRevenue: event.target.value }))} />
            <Input placeholder="Target" value={revenueForm.targetRevenue} onChange={(event) => setRevenueForm((current) => ({ ...current, targetRevenue: event.target.value }))} />
            <Textarea rows={3} placeholder="Notes" value={revenueForm.notes} onChange={(event) => setRevenueForm((current) => ({ ...current, notes: event.target.value }))} />
            <PrimaryButton onClick={() => void saveRevenue()}>{revenueForm.id ? 'Update revenue' : 'Add revenue'}</PrimaryButton>
          </div>
        </div>
      </Panel>
      ) : null}

      {activeDataSection === 'headcount' ? (
      <Panel title="Headcount" description="Full CRUD for monthly headcount snapshots.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <Table headers={['Month', 'Actual', 'Forecast', 'Target', 'Actions']} rows={headcount.map((item) => [
            item.month.slice(0, 7),
            item.actualHeadcount.toString(),
            item.forecastHeadcount.toString(),
            item.targetHeadcount.toString(),
            <div key={item.id} className="flex gap-2">
              <SecondaryButton onClick={() => setHeadcountForm({
                id: item.id,
                month: toMonthInput(item.month),
                actualHeadcount: String(item.actualHeadcount),
                forecastHeadcount: String(item.forecastHeadcount),
                targetHeadcount: String(item.targetHeadcount),
                notes: item.notes ?? '',
              })}>Edit</SecondaryButton>
              <SecondaryButton onClick={() => void deleteHeadcount(item.id)}>Delete</SecondaryButton>
            </div>,
          ])} />
          <div className="space-y-3">
            <Input placeholder="YYYY-MM" value={headcountForm.month} onChange={(event) => setHeadcountForm((current) => ({ ...current, month: event.target.value }))} />
            <Input placeholder="Actual" value={headcountForm.actualHeadcount} onChange={(event) => setHeadcountForm((current) => ({ ...current, actualHeadcount: event.target.value }))} />
            <Input placeholder="Forecast" value={headcountForm.forecastHeadcount} onChange={(event) => setHeadcountForm((current) => ({ ...current, forecastHeadcount: event.target.value }))} />
            <Input placeholder="Target" value={headcountForm.targetHeadcount} onChange={(event) => setHeadcountForm((current) => ({ ...current, targetHeadcount: event.target.value }))} />
            <Textarea rows={3} placeholder="Notes" value={headcountForm.notes} onChange={(event) => setHeadcountForm((current) => ({ ...current, notes: event.target.value }))} />
            <PrimaryButton onClick={() => void saveHeadcount()}>{headcountForm.id ? 'Update headcount' : 'Add headcount'}</PrimaryButton>
          </div>
        </div>
      </Panel>
      ) : null}

      {activeDataSection === 'customers' ? (
      <Panel title="Customers" description="Full CRUD for customers.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <Table headers={['Customer', 'Owner', 'Status', 'Actions']} rows={customers.map((customer) => [
            customer.name,
            customer.owner?.name ?? '—',
            customer.status,
            <div key={customer.id} className="flex gap-2">
              <SecondaryButton onClick={() => setCustomerForm({
                id: customer.id,
                name: customer.name,
                segment: customer.segment ?? '',
                geography: customer.geography ?? '',
                industry: customer.industry ?? '',
                status: customer.status,
                ownerId: customer.ownerId ?? '',
              })}>Edit</SecondaryButton>
              <SecondaryButton onClick={() => void deleteCustomer(customer.id)}>Delete</SecondaryButton>
            </div>,
          ])} />
          <div className="space-y-3">
            <Input placeholder="Name" value={customerForm.name} onChange={(event) => setCustomerForm((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="Segment" value={customerForm.segment} onChange={(event) => setCustomerForm((current) => ({ ...current, segment: event.target.value }))} />
            <Input placeholder="Geography" value={customerForm.geography} onChange={(event) => setCustomerForm((current) => ({ ...current, geography: event.target.value }))} />
            <Input placeholder="Industry" value={customerForm.industry} onChange={(event) => setCustomerForm((current) => ({ ...current, industry: event.target.value }))} />
            <Select value={customerForm.status} onChange={(event) => setCustomerForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="PROSPECT">PROSPECT</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="CHURNED">CHURNED</option>
            </Select>
            <Select value={customerForm.ownerId} onChange={(event) => setCustomerForm((current) => ({ ...current, ownerId: event.target.value }))}>
              <option value="">No owner</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
            <PrimaryButton onClick={() => void saveCustomer()}>{customerForm.id ? 'Update customer' : 'Add customer'}</PrimaryButton>
          </div>
        </div>
      </Panel>
      ) : null}

      {activeDataSection === 'orders' ? (
      <Panel title="Orders" description="Full CRUD for orders.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <Table headers={['Order', 'Customer', 'Amount', 'Actions']} rows={orders.map((order) => [
            order.orderNumber ?? 'Draft',
            order.customer?.name ?? '—',
            String(order.amount),
            <div key={order.id} className="flex gap-2">
              <SecondaryButton onClick={() => setOrderForm({
                id: order.id,
                customerId: order.customerId,
                orderNumber: order.orderNumber ?? '',
                orderDate: toDateInput(order.orderDate),
                amount: String(order.amount),
                status: order.status,
                productLine: order.productLine ?? '',
                notes: order.notes ?? '',
              })}>Edit</SecondaryButton>
              <SecondaryButton onClick={() => void deleteOrder(order.id)}>Delete</SecondaryButton>
            </div>,
          ])} />
          <div className="space-y-3">
            <Select value={orderForm.customerId} onChange={(event) => setOrderForm((current) => ({ ...current, customerId: event.target.value }))}>
              <option value="">Select customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
            <Input placeholder="Order number" value={orderForm.orderNumber} onChange={(event) => setOrderForm((current) => ({ ...current, orderNumber: event.target.value }))} />
            <Input type="date" value={orderForm.orderDate} onChange={(event) => setOrderForm((current) => ({ ...current, orderDate: event.target.value }))} />
            <Input placeholder="Amount" value={orderForm.amount} onChange={(event) => setOrderForm((current) => ({ ...current, amount: event.target.value }))} />
            <Select value={orderForm.status} onChange={(event) => setOrderForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="DRAFT">DRAFT</option>
              <option value="BOOKED">BOOKED</option>
              <option value="INVOICED">INVOICED</option>
              <option value="CANCELLED">CANCELLED</option>
            </Select>
            <Input placeholder="Product line" value={orderForm.productLine} onChange={(event) => setOrderForm((current) => ({ ...current, productLine: event.target.value }))} />
            <Textarea rows={3} placeholder="Notes" value={orderForm.notes} onChange={(event) => setOrderForm((current) => ({ ...current, notes: event.target.value }))} />
            <PrimaryButton onClick={() => void saveOrder()}>{orderForm.id ? 'Update order' : 'Add order'}</PrimaryButton>
          </div>
        </div>
      </Panel>
      ) : null}

      {activeDataSection === 'stages' ? (
      <Panel title="Sales Stages" description="Full CRUD for stage definitions.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <Table headers={['Stage', 'Order', 'Probability', 'Actions']} rows={stages.map((stage) => [
            stage.name,
            String(stage.stageOrder),
            stage.defaultProbability?.toString() ?? '—',
            <div key={stage.id} className="flex gap-2">
              <SecondaryButton onClick={() => setStageForm({
                id: stage.id,
                name: stage.name,
                stageOrder: String(stage.stageOrder),
                defaultProbability: stage.defaultProbability?.toString() ?? '',
                isClosedWon: stage.isClosedWon,
                isClosedLost: stage.isClosedLost,
              })}>Edit</SecondaryButton>
              <SecondaryButton onClick={() => void deleteStage(stage.id)}>Delete</SecondaryButton>
            </div>,
          ])} />
          <div className="space-y-3">
            <Input placeholder="Stage name" value={stageForm.name} onChange={(event) => setStageForm((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="Stage order" value={stageForm.stageOrder} onChange={(event) => setStageForm((current) => ({ ...current, stageOrder: event.target.value }))} />
            <Input placeholder="Default probability" value={stageForm.defaultProbability} onChange={(event) => setStageForm((current) => ({ ...current, defaultProbability: event.target.value }))} />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={stageForm.isClosedWon} onChange={(event) => setStageForm((current) => ({ ...current, isClosedWon: event.target.checked }))} />
              Closed won
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={stageForm.isClosedLost} onChange={(event) => setStageForm((current) => ({ ...current, isClosedLost: event.target.checked }))} />
              Closed lost
            </label>
            <PrimaryButton onClick={() => void saveStage()}>{stageForm.id ? 'Update stage' : 'Add stage'}</PrimaryButton>
          </div>
        </div>
      </Panel>
      ) : null}

      {activeDataSection === 'opportunities' ? (
      <Panel title="Opportunities" description="Full CRUD for opportunities.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_360px]">
          <Table headers={['Opportunity', 'Stage', 'Amount', 'Actions']} rows={opportunities.map((opportunity) => [
            opportunity.name,
            opportunity.stage?.name ?? '—',
            String(opportunity.amount),
            <div key={opportunity.id} className="flex gap-2">
              <SecondaryButton onClick={() => setOpportunityForm({
                id: opportunity.id,
                customerId: opportunity.customerId ?? '',
                ownerId: opportunity.ownerId ?? '',
                stageId: opportunity.stageId,
                name: opportunity.name,
                amount: String(opportunity.amount),
                probability: String(opportunity.probability),
                expectedCloseDate: toDateInput(opportunity.expectedCloseDate),
                source: opportunity.source ?? '',
                status: opportunity.status,
              })}>Edit</SecondaryButton>
              <SecondaryButton onClick={() => void deleteOpportunity(opportunity.id)}>Delete</SecondaryButton>
            </div>,
          ])} />
          <div className="space-y-3">
            <Input placeholder="Opportunity name" value={opportunityForm.name} onChange={(event) => setOpportunityForm((current) => ({ ...current, name: event.target.value }))} />
            <Select value={opportunityForm.customerId} onChange={(event) => setOpportunityForm((current) => ({ ...current, customerId: event.target.value }))}>
              <option value="">No customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </Select>
            <Select value={opportunityForm.ownerId} onChange={(event) => setOpportunityForm((current) => ({ ...current, ownerId: event.target.value }))}>
              <option value="">No owner</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
            <Select value={opportunityForm.stageId} onChange={(event) => setOpportunityForm((current) => ({ ...current, stageId: event.target.value }))}>
              <option value="">Select stage</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </Select>
            <Input placeholder="Amount" value={opportunityForm.amount} onChange={(event) => setOpportunityForm((current) => ({ ...current, amount: event.target.value }))} />
            <Input placeholder="Probability" value={opportunityForm.probability} onChange={(event) => setOpportunityForm((current) => ({ ...current, probability: event.target.value }))} />
            <Input type="date" value={opportunityForm.expectedCloseDate} onChange={(event) => setOpportunityForm((current) => ({ ...current, expectedCloseDate: event.target.value }))} />
            <Input placeholder="Source" value={opportunityForm.source} onChange={(event) => setOpportunityForm((current) => ({ ...current, source: event.target.value }))} />
            <Select value={opportunityForm.status} onChange={(event) => setOpportunityForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="OPEN">OPEN</option>
              <option value="WON">WON</option>
              <option value="LOST">LOST</option>
            </Select>
            <PrimaryButton onClick={() => void saveOpportunity()}>{opportunityForm.id ? 'Update opportunity' : 'Add opportunity'}</PrimaryButton>
          </div>
        </div>
      </Panel>
      ) : null}
      </Panel>
      ) : null}

      {activeSection === 'droplets' ? (
      <Panel title="Droplet Activation" description="Activate, deactivate, preview, and configure public catalog droplets for this company. Mission Home does not create droplets.">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_420px]">
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Published catalog</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {missionContext?.catalogDropletCount ?? catalog.length}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Active for tenant</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">
                  {missionContext?.activeDropletCount ?? activeCatalogCount}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Tenant shell</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {shell?.name ?? 'Not configured'}
                </p>
              </div>
            </div>
            <Input
              placeholder="Search droplets by name, command, description, or type"
              value={catalogSearch}
              onChange={(event) => setCatalogSearch(event.target.value)}
            />
            <Table headers={['Droplet', 'Command', 'Type', 'State', 'Actions']} rows={filteredCatalog.map((droplet) => [
              <button
                key={`${droplet.id}-select`}
                className="text-left"
                onClick={() => selectCatalogDroplet(droplet)}
              >
                <span className="font-medium text-slate-900">
                  {droplet.name}
                </span>
                <span className="mt-1 block text-xs text-slate-500">
                  {droplet.assignment?.nameOverride
                    ? `Override: ${droplet.assignment.nameOverride}`
                    : droplet.slug}
                </span>
              </button>,
              <div key={`${droplet.id}-command`}>
                <div className="font-medium text-slate-900">{droplet.command}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {(droplet.commandAliasesJson ?? []).join(', ') || 'No aliases'}
                </div>
              </div>,
              <div key={`${droplet.id}-type`}>
                <div className="font-medium text-slate-900">{droplet.dropletType}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {droplet.generationStatus ?? 'draft'}
                </div>
              </div>,
              droplet.assignment?.active ? 'ACTIVE' : 'INACTIVE',
              <div key={droplet.id} className="flex flex-wrap gap-2">
                <SecondaryButton onClick={() => void previewDroplet(droplet)}>Preview</SecondaryButton>
                {droplet.assignment?.active ? (
                  <SecondaryButton onClick={() => void deactivateDroplet(droplet.id)}>
                    Deactivate
                  </SecondaryButton>
                ) : (
                  <SecondaryButton
                    onClick={() => {
                      selectCatalogDroplet(droplet)
                      void activateDroplet(droplet.id)
                    }}
                  >
                    Activate
                  </SecondaryButton>
                )}
                <SecondaryButton onClick={() => selectCatalogDroplet(droplet)}>
                  Configure
                </SecondaryButton>
              </div>,
            ])} />
          </div>
            <div className="space-y-4">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              Mission Home only consumes the public droplet catalog for this vertical. Droplet creation and publishing stay in Droplet Studio.
            </div>
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">Local override</p>
              {selectedCatalogDroplet ? (
                <>
                  <div className="rounded-2xl border border-white bg-white p-4">
                    <p className="font-medium text-slate-900">
                      {selectedCatalogDroplet.name}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedCatalogDroplet.description ?? 'No description'}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                      {selectedCatalogDroplet.command} · {selectedCatalogDroplet.dropletType}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      Help: {selectedCatalogDroplet.commandHelpText ?? 'No help text'}
                    </p>
                  </div>
                  <Input placeholder="Name override" value={assignmentForm.nameOverride} onChange={(event) => setAssignmentForm((current) => ({ ...current, nameOverride: event.target.value }))} />
                  <Input placeholder="Placement" value={assignmentForm.placement} onChange={(event) => setAssignmentForm((current) => ({ ...current, placement: event.target.value }))} />
                  <Textarea
                    rows={6}
                    placeholder="Local config override JSON"
                    value={assignmentForm.configOverrideJson}
                    onChange={(event) =>
                      setAssignmentForm((current) => ({
                        ...current,
                        configOverrideJson: event.target.value,
                      }))
                    }
                  />
                  <div className="flex gap-3">
                    <PrimaryButton
                      onClick={() =>
                        selectedCatalogDroplet.assignment?.active
                          ? void saveAssignmentOverride()
                          : void activateDroplet(selectedCatalogDroplet.id)
                      }
                    >
                      {selectedCatalogDroplet.assignment?.active
                        ? 'Save override'
                        : 'Activate with override'}
                    </PrimaryButton>
                    <SecondaryButton onClick={() => void previewDroplet(selectedCatalogDroplet)}>
                      Preview
                    </SecondaryButton>
                  </div>
                </>
              ) : (
                <p className="text-sm text-slate-500">
                  Select a droplet from the catalog to preview or configure it.
                </p>
              )}
            </div>
            <DropletRenderer preview={preview} />
          </div>
        </div>
      </Panel>
      ) : null}
    </SurfaceShell>
  )
}
