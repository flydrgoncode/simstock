import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { NavLink } from 'react-router-dom'
import { getSurfaceUiConfig, type SurfaceId } from '../../modules/shared/ui/surfaces/config'
import { SurfaceUiProvider } from './surface-ui'
import { useSurfaceUi } from './surface-ui-context'

export function SurfaceShell({
  surface = 'default',
  eyebrow,
  title,
  version,
  description,
  nav,
  children,
  sidePanel,
}: {
  surface?: SurfaceId
  eyebrow: string
  title: string
  version: string
  description: string
  nav: Array<{ to: string; label: string }>
  children: ReactNode
  sidePanel?: ReactNode
}) {
  const ui = getSurfaceUiConfig(surface)

  return (
    <SurfaceUiProvider surface={surface}>
      <div className={`min-h-screen ${ui.pageClass}`}>
        <div className={ui.layoutClass}>
          <aside className={ui.sidebarClass}>
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <span className={ui.headerMarkClass}>{ui.mark}</span>
                <div>
                  <p className={ui.headerEyebrowClass}>{eyebrow}</p>
                  <h1 className={`mt-1 ${ui.headerTitleClass}`}>{title}</h1>
                </div>
              </div>
              <p className={`mt-3 ${ui.headerDescriptionClass}`}>{description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className={ui.badgeClass}>Version {version}</span>
                <span className={ui.badgeClass}>{ui.descriptor}</span>
              </div>
            </div>
            <nav className="flex flex-col gap-1.5">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2.5 text-sm transition ${isActive ? ui.navActiveClass : ui.navIdleClass}`
                  }
                  end
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>
          <div className="space-y-5">{children}</div>
          {sidePanel ?? <div />}
        </div>
      </div>
    </SurfaceUiProvider>
  )
}

export function Panel({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  const ui = useSurfaceUi()
  return (
    <section className={ui.panelClass}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className={`text-lg font-semibold ${ui.panelTitleClass}`}>{title}</h2>
          {description ? (
            <p className={`mt-1 text-sm ${ui.panelDescriptionClass}`}>{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Table({
  headers,
  rows,
}: {
  headers: string[]
  rows: Array<Array<ReactNode>>
}) {
  const ui = useSurfaceUi()
  return (
    <div className={ui.tableWrapClass}>
      <table className="min-w-full divide-y divide-slate-200/70 text-sm">
        <thead className={ui.tableHeadClass}>
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2.5 font-medium">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={ui.tableBodyClass}>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-3 py-2.5 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const ui = useSurfaceUi()
  return (
    <input
      {...props}
      className={`${ui.inputClass} ${props.className ?? ''}`}
    />
  )
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const ui = useSurfaceUi()
  return (
    <select
      {...props}
      className={`${ui.inputClass} ${props.className ?? ''}`}
    />
  )
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ui = useSurfaceUi()
  return (
    <textarea
      {...props}
      className={`${ui.inputClass} ${props.className ?? ''}`}
    />
  )
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ui = useSurfaceUi()
  return (
    <button
      {...props}
      className={`${ui.primaryButtonClass} ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ui = useSurfaceUi()
  return (
    <button
      {...props}
      className={`${ui.secondaryButtonClass} ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function StatusPill({ children }: { children: ReactNode }) {
  const ui = useSurfaceUi()
  return <span className={ui.badgeClass}>{children}</span>
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ui = useSurfaceUi()
  return (
    <button
      {...props}
      className={`${ui.ghostButtonClass} ${className ?? ''}`}
    >
      {children}
    </button>
  )
}

export function DangerButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ui = useSurfaceUi()
  return (
    <button
      {...props}
      className={`${ui.dangerButtonClass} ${className ?? ''}`}
    >
      {children}
    </button>
  )
}
