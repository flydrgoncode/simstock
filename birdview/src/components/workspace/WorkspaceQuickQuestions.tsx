import { StatusPill } from '../admin/ui'
import { useSurfaceUi } from '../admin/surface-ui-context'
import type { WorkspaceTheme } from '../../modules/workspace'

export function WorkspaceQuickQuestions({
  theme,
  activeDropletCount,
  promptTemplateCount,
  onRunCommand,
}: {
  theme: WorkspaceTheme
  activeDropletCount: number
  promptTemplateCount: number
  onRunCommand: (command: string) => void
}) {
  const ui = useSurfaceUi()

  return (
    <aside className="space-y-6">
      <section className={ui.panelClass}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={ui.headerEyebrowClass}>
              Quick Questions
            </p>
            <h3 className={`mt-3 text-xl font-semibold ${ui.panelTitleClass}`}>{theme.label}</h3>
            <p className={`mt-2 text-sm leading-6 ${ui.panelDescriptionClass}`}>{theme.description}</p>
          </div>
          <StatusPill>{theme.command}</StatusPill>
        </div>
        <div className="mt-5 space-y-3">
          {theme.quickQuestions.map((question) => (
            <button
              key={`${theme.key}-${question.command}`}
              className={`w-full rounded-xl border px-3 py-3 text-left text-sm transition ${ui.mode === 'dark' ? 'border-white/10 bg-white/[0.03] text-slate-100 hover:border-white/15 hover:bg-white/[0.05]' : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-200 hover:bg-blue-50'}`}
              onClick={() => onRunCommand(question.command)}
            >
              <p className="font-medium">{question.label}</p>
              <p className={`mt-1 text-xs ${ui.panelDescriptionClass}`}>{question.command}</p>
            </button>
          ))}
        </div>
      </section>

      <section className={ui.panelClass}>
        <p className={`text-sm font-medium ${ui.panelTitleClass}`}>Workspace context</p>
        <div className="mt-4 grid gap-3">
          <div className={`rounded-xl border p-4 ${ui.mode === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`text-xs uppercase tracking-[0.2em] ${ui.panelDescriptionClass}`}>Theme command</p>
            <p className={`mt-2 font-medium ${ui.panelTitleClass}`}>{theme.command}</p>
          </div>
          <div className={`rounded-xl border p-4 ${ui.mode === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`text-xs uppercase tracking-[0.2em] ${ui.panelDescriptionClass}`}>Active droplets</p>
            <p className={`mt-2 font-medium ${ui.panelTitleClass}`}>{activeDropletCount}</p>
          </div>
          <div className={`rounded-xl border p-4 ${ui.mode === 'dark' ? 'border-white/10 bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
            <p className={`text-xs uppercase tracking-[0.2em] ${ui.panelDescriptionClass}`}>Prompt templates</p>
            <p className={`mt-2 font-medium ${ui.panelTitleClass}`}>{promptTemplateCount}</p>
          </div>
        </div>
      </section>
    </aside>
  )
}
