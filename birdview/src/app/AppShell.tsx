import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes } from 'react-router-dom'

import { SurfaceErrorBoundary } from '../components/app/SurfaceErrorBoundary'
import { CommandChatPanel } from '../components/chat/CommandChatPanel'
import { DropletRenderer } from '../components/droplets/DropletRenderer'
import { APP_VERSION } from '../lib/appMeta'
import { apiFetch } from '../lib/api'
import { useBackofficeStore } from '../store/backoffice'
import { MissionControl } from '../surfaces/MissionControl'
import { DropletStudio } from '../surfaces/DropletStudio'
import { HomeControl } from '../surfaces/HomeControl'
import { Workspace } from '../surfaces/Workspace'

type Tenant = {
  id: string
  name: string
}

type TenantShell = {
  id: string
  name: string
  status: string
  vertical: { name: string }
  verticalDefinition: { version: number; status: string }
}

type RuntimeContext = {
  tenantId: string
  company: { id: string; name: string; slug: string; vertical: { name: string } }
  shell: TenantShell | null
  activeDropletCount: number
}

type ActiveDroplet = {
  id: string
  tenantId: string
  verticalDropletId: string
  name: string
  command: string
  aliases: string[]
  helpText: string
  type: string
  dropletDefinitionJson: unknown
  shadowSkillDefinitionJson?: unknown
  status: string
  active: boolean
  placement: string | null
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

function RuntimeHome() {
  const activeTenantId = useBackofficeStore((state) => state.activeTenantId)
  const setActiveTenantId = useBackofficeStore((state) => state.setActiveTenantId)
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [shell, setShell] = useState<TenantShell | null>(null)
  const [company, setCompany] = useState<RuntimeContext['company'] | null>(null)
  const [droplets, setDroplets] = useState<ActiveDroplet[]>([])
  const [selectedDropletId, setSelectedDropletId] = useState<string | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)

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
    void Promise.all([
      apiFetch<RuntimeContext>(`/api/tenants/${activeTenantId}/runtime-context`).catch(() => null),
      apiFetch<ActiveDroplet[]>(`/api/tenants/${activeTenantId}/droplets/active`),
    ]).then(async ([contextData, dropletData]) => {
      setShell(contextData?.shell ?? null)
      setCompany(contextData?.company ?? null)
      setDroplets(dropletData)
      const firstDroplet = dropletData[0] ?? null
      setSelectedDropletId(firstDroplet?.id ?? null)
      if (firstDroplet) {
        setPreview(
          await apiFetch<Preview>(`/api/tenants/${activeTenantId}/droplets/preview`, {
            method: 'POST',
            body: JSON.stringify({
              shadowSkillDefinitionJson:
                firstDroplet.shadowSkillDefinitionJson ?? undefined,
              dropletDefinitionJson:
                firstDroplet.shadowSkillDefinitionJson
                  ? undefined
                  : firstDroplet.dropletDefinitionJson,
            }),
          })
        )
      } else {
        setPreview(null)
      }
    })
  }, [activeTenantId])

  async function openDroplet(droplet: ActiveDroplet) {
    if (!activeTenantId) return
    setSelectedDropletId(droplet.id)
    setPreview(
      await apiFetch<Preview>(`/api/tenants/${activeTenantId}/droplets/preview`, {
        method: 'POST',
        body: JSON.stringify({
          shadowSkillDefinitionJson: droplet.shadowSkillDefinitionJson ?? undefined,
          dropletDefinitionJson: droplet.shadowSkillDefinitionJson
            ? undefined
            : droplet.dropletDefinitionJson,
        }),
      })
    )
  }

  const selectedDroplet =
    droplets.find((droplet) => droplet.id === selectedDropletId) ?? null

  return (
    <main className="min-h-screen bg-transparent text-slate-900">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-6 px-6 py-10 xl:grid-cols-[minmax(0,1.4fr)_420px]">
        <div className="space-y-6">
          <header className="flex flex-col gap-4 rounded-3xl border border-teal-100 bg-white/92 p-8 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-teal-700">
                  Birdview Runtime
                </p>
                <p className="mt-3 inline-flex rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Version {APP_VERSION}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
                  Vertical command runtime
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800" to="/mission-control">
                  Mission Control
                </Link>
                <Link className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800" to="/droplet-studio">
                  Droplet Studio
                </Link>
                <Link className="rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-teal-200 hover:bg-teal-50 hover:text-teal-800" to={company ? `/workspace/${company.id}` : '/workspace'}>
                  Workspace
                </Link>
                <Link className="rounded-full border border-teal-200 bg-teal-50 px-4 py-2 text-sm font-medium text-teal-800 transition hover:bg-teal-100" to="/backoffice">
                  Mission Home
                </Link>
              </div>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              Runtime loads the active tenant shell, resolves the tenant&apos;s active
              droplet assignments, and maps slash commands to published platform
              droplets.
            </p>
            <div className="grid gap-4 md:grid-cols-[320px_repeat(3,minmax(0,1fr))]">
              <label className="flex flex-col gap-2 text-sm text-slate-700">
                Active tenant
                <select
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none"
                  value={activeTenantId ?? ''}
                  onChange={(event) => setActiveTenantId(event.target.value || null)}
                >
                  <option value="">Select tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Shell</p>
                <p className="mt-1 font-medium text-slate-900">{shell?.name ?? 'No shell'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Company</p>
                <p className="mt-1 font-medium text-slate-900">{company?.name ?? 'Missing'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Vertical</p>
                <p className="mt-1 font-medium text-slate-900">{company?.vertical.name ?? shell?.vertical.name ?? 'Missing'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Definition</p>
                <p className="mt-1 font-medium text-slate-900">
                  {shell ? `v${shell.verticalDefinition.version}` : 'Missing'}
                </p>
              </div>
            </div>
          </header>

          <section className="rounded-3xl border border-slate-200 bg-white/92 p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-950">
                Published active tenant droplets
              </h2>
              <span className="rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                {droplets.length} active
              </span>
            </div>
            <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
              <div className="space-y-3">
                {droplets.map((droplet) => (
                  <button
                    key={droplet.id}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      droplet.id === selectedDropletId
                        ? 'border-teal-300 bg-teal-50'
                        : 'border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/50'
                    }`}
                    onClick={() => void openDroplet(droplet)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium text-slate-900">{droplet.name}</h3>
                        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                          {droplet.command} · {droplet.placement ?? 'unplaced'}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">{droplet.helpText}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div>
                {selectedDroplet ? (
                  <DropletRenderer
                    droplet={selectedDroplet as never}
                    preview={preview as never}
                  />
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
                    No active droplets for this tenant yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        <CommandChatPanel tenantId={activeTenantId} title="Birdview chat" />
      </div>
    </main>
  )
}

export function AppShell() {
  return (
    <Routes>
      <Route path="/" element={<RuntimeHome />} />
      <Route path="/workspace" element={<Workspace />} />
      <Route path="/workspace/:companyId" element={<Workspace />} />
      <Route path="/mission-control" element={<MissionControl />} />
      <Route path="/mission-control/verticals" element={<MissionControl />} />
      <Route path="/mission-control/skills" element={<MissionControl />} />
      <Route path="/mission-control/companies" element={<MissionControl />} />
      <Route path="/mission-control/users" element={<MissionControl />} />
      <Route path="/mission-control/config/llms" element={<MissionControl />} />
      <Route path="/mission-control/config/email" element={<MissionControl />} />
      <Route path="/droplet-studio" element={<DropletStudio />} />
      <Route path="/droplet-studio/catalog" element={<DropletStudio />} />
      <Route path="/droplet-studio/preview" element={<DropletStudio />} />
      <Route path="/droplet-studio/preview-lab" element={<DropletStudio />} />
      <Route path="/droplet-studio/prompt-templates" element={<DropletStudio />} />
      <Route path="/droplet-studio/dummy-data" element={<DropletStudio />} />
      <Route path="/droplet-studio/versions" element={<DropletStudio />} />
      <Route path="/droplet-studio/verticals/:verticalId/droplets" element={<DropletStudio />} />
      <Route path="/droplet-studio/droplets" element={<DropletStudio />} />
      <Route path="/droplet-studio/droplets/new" element={<DropletStudio />} />
      <Route path="/droplet-studio/droplets/:id" element={<DropletStudio />} />
      <Route path="/droplet-studio/droplets/:id/preview" element={<DropletStudio />} />
      <Route
        path="/backoffice"
        element={
          <SurfaceErrorBoundary name="Mission Home">
            <HomeControl />
          </SurfaceErrorBoundary>
        }
      />
      <Route path="/mission-home" element={<Navigate to="/backoffice" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
