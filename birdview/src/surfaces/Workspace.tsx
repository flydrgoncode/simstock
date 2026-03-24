import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'

import { StatusPill } from '../components/admin/ui'
import { SurfaceUiProvider } from '../components/admin/surface-ui'
import { useSurfaceUi } from '../components/admin/surface-ui-context'
import { WorkspaceChat } from '../components/workspace/WorkspaceChat'
import { WorkspaceQuickQuestions } from '../components/workspace/WorkspaceQuickQuestions'
import { WorkspaceThemeSidebar } from '../components/workspace/WorkspaceThemeSidebar'
import { apiFetch } from '../lib/api'
import type { WorkspaceTheme } from '../modules/workspace'
import { useWorkspaceStore } from '../store/workspace'

type CompanyOption = {
  id: string
  name: string
  vertical: { name: string }
}

type WorkspaceContext = {
  company: {
    id: string
    tenantId: string
    name: string
    slug: string
    status: string
    vertical: {
      id: string
      key: string
      name: string
    }
  }
  verticalDefinition: {
    id: string
    version: number
    status: string
  } | null
  themes: WorkspaceTheme[]
  activeDroplets: Array<{
    id: string
    name: string
    command: string
    aliases: string[]
    helpText: string | null
    placement: string | null
    type: string
  }>
  promptTemplates: Array<{
    id: string
    key: string
    name: string
    purpose: string
  }>
}

function WorkspaceChooser() {
  const ui = useSurfaceUi()
  const [companies, setCompanies] = useState<CompanyOption[]>([])

  useEffect(() => {
    void apiFetch<CompanyOption[]>('/api/companies').then(setCompanies)
  }, [])

  if (companies[0]) {
    return <Navigate replace to={`/workspace/${companies[0].id}`} />
  }

  return (
    <main className="min-h-screen bg-transparent px-6 py-10 text-slate-900">
      <div className={`mx-auto max-w-3xl ${ui.panelClass}`}>
        <h1 className="text-3xl font-semibold text-slate-950">Workspace</h1>
        <p className="mt-3 text-sm text-slate-600">
          No company is available yet for the workspace route.
        </p>
      </div>
    </main>
  )
}

export function Workspace() {
  const navigate = useNavigate()
  const { companyId } = useParams<{ companyId: string }>()
  const [context, setContext] = useState<WorkspaceContext | null>(null)
  const [queuedCommand, setQueuedCommand] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const selectedThemeMap = useWorkspaceStore((state) => state.selectedThemeKeyByCompanyId)
  const setSelectedTheme = useWorkspaceStore((state) => state.setSelectedTheme)

  useEffect(() => {
    if (!companyId) return
    setErrorMessage(null)
    void apiFetch<WorkspaceContext>(`/api/workspace/companies/${companyId}/context`)
      .then((response) => {
        setContext(response)
        const remembered = selectedThemeMap[companyId]
        const firstTheme = response.themes[0]?.key ?? null
        if (!remembered && firstTheme) {
          setSelectedTheme(companyId, firstTheme)
        }
      })
      .catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load workspace.')
      })
  }, [companyId, selectedThemeMap, setSelectedTheme])

  const selectedTheme = useMemo(() => {
    if (!context || !companyId) return null
    const remembered = selectedThemeMap[companyId]
    return (
      context.themes.find((theme) => theme.key === remembered) ??
      context.themes[0] ??
      null
    )
  }, [companyId, context, selectedThemeMap])

  if (!companyId) {
    return (
      <SurfaceUiProvider surface="workspace">
        <WorkspaceChooser />
      </SurfaceUiProvider>
    )
  }

  if (errorMessage) {
    return (
      <SurfaceUiProvider surface="workspace">
      <main className="min-h-screen bg-transparent px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-[1.5rem] border border-rose-200 bg-white/96 p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-950">Workspace</h1>
          <p className="mt-3 text-sm text-rose-700">{errorMessage}</p>
        </div>
      </main>
      </SurfaceUiProvider>
    )
  }

  if (!context || !selectedTheme) {
    return (
      <SurfaceUiProvider surface="workspace">
      <main className="min-h-screen bg-transparent px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-4xl rounded-[1.5rem] border border-slate-200 bg-white/96 p-8 shadow-sm">
          <h1 className="text-3xl font-semibold text-slate-950">Workspace</h1>
          <p className="mt-3 text-sm text-slate-600">Loading workspace...</p>
        </div>
      </main>
      </SurfaceUiProvider>
    )
  }

  return (
    <SurfaceUiProvider surface="workspace">
    <main className="min-h-screen bg-[#f7f8fb] text-slate-900">
      <div className="mx-auto grid min-h-screen max-w-[1700px] gap-5 px-5 py-5 xl:grid-cols-[248px_minmax(0,1fr)_332px]">
        <WorkspaceThemeSidebar
          companyName={context.company.name}
          verticalName={context.company.vertical.name}
          themes={context.themes}
          selectedThemeKey={selectedTheme.key}
          onSelectTheme={(themeKey) => {
            setSelectedTheme(companyId, themeKey)
            const theme = context.themes.find((item) => item.key === themeKey)
            if (theme?.command) {
              setQueuedCommand(theme.command)
            }
          }}
        />

        <div className="space-y-5">
          <section className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white/98 px-5 py-4 shadow-[0_12px_34px_rgba(15,23,42,0.045)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-700">
                Workspace
              </p>
              <h2 className="mt-2 text-[2rem] font-semibold tracking-tight text-slate-950">
                {context.company.name}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Vertical-scoped themes on the left, chat-first exploration in the center, quick questions on the right.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill>{context.company.vertical.name}</StatusPill>
              <StatusPill>{selectedTheme.label}</StatusPill>
              {context.verticalDefinition ? (
                <StatusPill>{`v${context.verticalDefinition.version}`}</StatusPill>
              ) : null}
            </div>
          </section>

          <WorkspaceChat
            tenantId={context.company.tenantId}
            companyName={context.company.name}
            themeLabel={selectedTheme.label}
            queuedCommand={queuedCommand}
            onQueuedCommandHandled={() => setQueuedCommand(null)}
          />
        </div>

        <div className="space-y-6">
          <WorkspaceQuickQuestions
            theme={selectedTheme}
            activeDropletCount={context.activeDroplets.length}
            promptTemplateCount={context.promptTemplates.length}
            onRunCommand={(command) => setQueuedCommand(command)}
          />

          <section className="rounded-[1.5rem] border border-slate-200 bg-white/98 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.045)]">
            <p className="text-sm font-medium text-slate-900">Active droplets</p>
            <div className="mt-4 space-y-3">
              {context.activeDroplets.slice(0, 6).map((droplet) => (
                <button
                  key={droplet.id}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-blue-200 hover:bg-blue-50"
                  onClick={() => setQueuedCommand(droplet.command)}
                >
                  <p className="font-medium text-slate-900">{droplet.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {droplet.command}
                    {droplet.placement ? ` · ${droplet.placement}` : ''}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[1.5rem] border border-slate-200 bg-white/98 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.045)]">
            <p className="text-sm font-medium text-slate-900">Navigate</p>
            <div className="mt-4 space-y-2 text-sm text-slate-600">
              <Link className="block text-teal-700 underline-offset-4 hover:underline" to="/">
                Birdview Runtime
              </Link>
              <Link className="block text-teal-700 underline-offset-4 hover:underline" to="/mission-control">
                Mission Control
              </Link>
              <Link className="block text-teal-700 underline-offset-4 hover:underline" to="/droplet-studio">
                Droplet Studio
              </Link>
              <button
                className="block text-left text-teal-700 underline-offset-4 hover:underline"
                onClick={() => navigate('/workspace')}
              >
                Change company
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
    </SurfaceUiProvider>
  )
}
