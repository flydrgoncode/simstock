import { Link } from 'react-router-dom'

import { useSurfaceUi } from '../admin/surface-ui-context'
import { APP_VERSION } from '../../lib/appMeta'
import type { WorkspaceTheme } from '../../modules/workspace'

export function WorkspaceThemeSidebar({
  companyName,
  verticalName,
  themes,
  selectedThemeKey,
  onSelectTheme,
}: {
  companyName: string
  verticalName: string
  themes: WorkspaceTheme[]
  selectedThemeKey: string | null
  onSelectTheme: (themeKey: string) => void
}) {
  const ui = useSurfaceUi()

  return (
    <aside className={ui.sidebarClass}>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <span className={ui.headerMarkClass}>WS</span>
          <div>
            <p className={ui.headerEyebrowClass}>Workspace</p>
            <h1 className={ui.headerTitleClass}>{companyName}</h1>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={ui.badgeClass}>Version {APP_VERSION}</span>
          <span className={ui.badgeClass}>{verticalName}</span>
        </div>
        <p className={`mt-3 ${ui.headerDescriptionClass}`}>
          {verticalName} themes drive the workspace navigation and quick questions.
        </p>
      </div>

      <nav className="space-y-1.5">
        {themes.map((theme) => (
          <button
            key={theme.key}
            className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition ${
              selectedThemeKey === theme.key
                ? ui.navActiveClass
                : ui.navIdleClass
            }`}
            onClick={() => onSelectTheme(theme.key)}
          >
            <p className="font-medium">{theme.label}</p>
            <p className="mt-1 text-xs opacity-80">{theme.command}</p>
          </button>
        ))}
      </nav>

      <div className={`mt-6 space-y-2 rounded-xl border p-4 text-sm ${ui.sidebarMetaClass} ${ui.mode === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
        <p className={`font-medium ${ui.panelTitleClass}`}>Surface links</p>
        <Link className="block underline-offset-4 hover:underline" to="/">
          Birdview Runtime
        </Link>
        <Link className="block underline-offset-4 hover:underline" to="/mission-control">
          Mission Control
        </Link>
        <Link className="block underline-offset-4 hover:underline" to="/droplet-studio">
          Droplet Studio
        </Link>
        <Link className="block underline-offset-4 hover:underline" to="/backoffice">
          Mission Home
        </Link>
      </div>
    </aside>
  )
}
