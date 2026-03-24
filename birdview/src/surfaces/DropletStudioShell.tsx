import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import {
  Panel,
  SecondaryButton,
  StatusPill,
  SurfaceShell,
} from '../components/admin/ui'
import { APP_VERSION } from '../lib/appMeta'
import { parseBirdviewCommand } from '../modules/commands'
import { dummyDataRunnerStatus } from '../modules/dummy-data'
import { dropletStudioSections } from '../modules/droplet-studio'

const sectionByPath = (pathname: string) => {
  if (pathname.startsWith('/droplet-studio/catalog')) return 'catalog'
  if (pathname.startsWith('/droplet-studio/preview-lab')) return 'preview-lab'
  if (pathname.startsWith('/droplet-studio/prompt-templates')) return 'prompt-templates'
  if (pathname.startsWith('/droplet-studio/dummy-data')) return 'dummy-data'
  if (pathname.startsWith('/droplet-studio/versions')) return 'versions'
  if (pathname.startsWith('/droplet-studio/droplets')) return 'droplets'
  return 'overview'
}

export function DropletStudioShell() {
  const location = useLocation()
  const activeSection = sectionByPath(location.pathname)
  const [hintPreview, setHintPreview] = useState('/revenue company=default')

  const parsedCommand = useMemo(
    () => parseBirdviewCommand(hintPreview),
    [hintPreview]
  )

  return (
    <SurfaceShell
      surface="droplet-studio"
      eyebrow="Droplet Studio"
      title="Droplet Studio"
      version={APP_VERSION}
      description="Phase 1 introduces the standalone surface, route namespace, schema seams, and preview foundations for future droplet authoring."
      nav={dropletStudioSections.map((section) => ({
        to: section.to,
        label: section.label,
      }))}
      sidePanel={
        <div className="space-y-6">
          <Panel
            title="Studio status"
            description="This surface is intentionally shell-first in phase 1."
          >
            <div className="flex flex-wrap gap-2">
              <StatusPill>{activeSection}</StatusPill>
              <StatusPill>{dummyDataRunnerStatus.status}</StatusPill>
            </div>
            <p className="mt-4 text-sm text-slate-600">
              {dummyDataRunnerStatus.message}
            </p>
          </Panel>

          <Panel
            title="Surface links"
            description="Keep the platform surfaces adjacent while the new foundations settle."
          >
            <div className="space-y-2 text-sm">
              <Link className="block text-teal-700 underline-offset-4 hover:underline" to="/workspace">
                Workspace
              </Link>
              <Link className="block text-teal-700 underline-offset-4 hover:underline" to="/mission-control">
                Mission Control
              </Link>
              <Link className="block text-teal-700 underline-offset-4 hover:underline" to="/backoffice">
                Mission Home
              </Link>
            </div>
          </Panel>
        </div>
      }
    >
      <Panel
        title="Droplet Studio shell"
        description="The authoring environment is separated from Mission Home and ready for the next implementation phases."
        action={<StatusPill>Phase 1 only</StatusPill>}
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Overview</p>
            <p className="mt-2 text-sm text-slate-600">
              Vertical-level authoring metrics and validation warnings will live here.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Droplets</p>
            <p className="mt-2 text-sm text-slate-600">
              CRUD flows come later. This phase creates the route and module seams.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-900">Preview Lab</p>
            <p className="mt-2 text-sm text-slate-600">
              Dummy-data execution stays stubbed until the runner phase.
            </p>
          </div>
        </div>
      </Panel>

      <Panel
        title="Unified command language preview"
        description="Every droplet must have a command, so the shell already exposes the shared parser seam."
      >
        <label className="block text-sm text-slate-700">
          Command sample
          <input
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none"
            value={hintPreview}
            onChange={(event) => setHintPreview(event.target.value)}
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <SecondaryButton onClick={() => setHintPreview('/customers list')}>
            /customers list
          </SecondaryButton>
          <SecondaryButton onClick={() => setHintPreview('/sales-targets year=2027')}>
            /sales-targets year=2027
          </SecondaryButton>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-950 p-4 text-xs text-slate-100">
          {JSON.stringify(parsedCommand, null, 2)}
        </pre>
      </Panel>

      <Panel
        title="Schema seams"
        description="The new shared folders keep the next Birdview phase consistent across authoring, runtime, and preview."
      >
        <ul className="space-y-3 text-sm text-slate-600">
          <li>`src/schemas/commands` holds the unified command language contracts.</li>
          <li>`src/schemas/droplets` holds the shadow skill definition contracts.</li>
          <li>`src/schemas/dummy-data` holds preview scenario contracts.</li>
        </ul>
      </Panel>
    </SurfaceShell>
  )
}
