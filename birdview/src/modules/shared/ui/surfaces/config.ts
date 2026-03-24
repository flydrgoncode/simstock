export type SurfaceId =
  | 'mission-control'
  | 'droplet-studio'
  | 'mission-home'
  | 'workspace'
  | 'default'

export type SurfaceUiConfig = {
  id: SurfaceId
  mark: string
  name: string
  descriptor: string
  mode: 'light' | 'dark'
  pageClass: string
  layoutClass: string
  sidebarClass: string
  sidebarMetaClass: string
  navActiveClass: string
  navIdleClass: string
  panelClass: string
  panelTitleClass: string
  panelDescriptionClass: string
  badgeClass: string
  tableWrapClass: string
  tableHeadClass: string
  tableBodyClass: string
  inputClass: string
  primaryButtonClass: string
  secondaryButtonClass: string
  ghostButtonClass: string
  dangerButtonClass: string
  emptyStateClass: string
  headerMarkClass: string
  headerEyebrowClass: string
  headerTitleClass: string
  headerDescriptionClass: string
}

export const surfaceUiConfig: Record<SurfaceId, SurfaceUiConfig> = {
  default: {
    id: 'default',
    mark: 'BV',
    name: 'Birdview',
    descriptor: 'Shared product surface',
    mode: 'light',
    pageClass: 'bg-[#f4f6f8] text-slate-900',
    layoutClass: 'mx-auto grid min-h-screen max-w-[1600px] gap-5 px-5 py-5 xl:grid-cols-[248px_minmax(0,1fr)_340px]',
    sidebarClass: 'rounded-[1.75rem] border border-slate-200 bg-white/94 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]',
    sidebarMetaClass: 'text-slate-600',
    navActiveClass: 'bg-slate-900 text-white',
    navIdleClass: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    panelClass: 'rounded-[1.5rem] border border-slate-200 bg-white/94 p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)]',
    panelTitleClass: 'text-slate-950',
    panelDescriptionClass: 'text-slate-600',
    badgeClass: 'rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-slate-700',
    tableWrapClass: 'overflow-x-auto rounded-[1.25rem] border border-slate-200 bg-white',
    tableHeadClass: 'bg-slate-50 text-left text-slate-500',
    tableBodyClass: 'divide-y divide-slate-200 bg-white',
    inputClass: 'rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400',
    primaryButtonClass: 'rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60',
    secondaryButtonClass: 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60',
    ghostButtonClass: 'rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60',
    dangerButtonClass: 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60',
    emptyStateClass: 'rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500',
    headerMarkClass: 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[11px] font-semibold tracking-[0.2em] text-slate-700',
    headerEyebrowClass: 'text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500',
    headerTitleClass: 'text-[2rem] font-semibold tracking-tight text-slate-950',
    headerDescriptionClass: 'text-sm leading-6 text-slate-600',
  },
  'mission-control': {
    id: 'mission-control',
    mark: 'MC',
    name: 'Mission Control',
    descriptor: 'Platform governance and orchestration',
    mode: 'dark',
    pageClass: 'bg-[#0a0f17] text-slate-100',
    layoutClass: 'mx-auto grid min-h-screen max-w-[1640px] gap-5 px-5 py-5 xl:grid-cols-[250px_minmax(0,1fr)_340px]',
    sidebarClass: 'rounded-[1.75rem] border border-white/10 bg-[#0f1723] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]',
    sidebarMetaClass: 'text-slate-400',
    navActiveClass: 'bg-[#1a2535] text-white ring-1 ring-amber-400/25',
    navIdleClass: 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
    panelClass: 'rounded-[1.5rem] border border-white/10 bg-[#101826] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.28)]',
    panelTitleClass: 'text-slate-50',
    panelDescriptionClass: 'text-slate-400',
    badgeClass: 'rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-slate-300',
    tableWrapClass: 'overflow-x-auto rounded-[1.25rem] border border-white/10 bg-[#0f1723]',
    tableHeadClass: 'bg-white/[0.04] text-left text-slate-400',
    tableBodyClass: 'divide-y divide-white/10 bg-transparent',
    inputClass: 'rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-amber-400/40',
    primaryButtonClass: 'rounded-xl bg-amber-400 px-3 py-2 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60',
    secondaryButtonClass: 'rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-amber-400/30 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60',
    ghostButtonClass: 'rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-60',
    dangerButtonClass: 'rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60',
    emptyStateClass: 'rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400',
    headerMarkClass: 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-[11px] font-semibold tracking-[0.2em] text-amber-200',
    headerEyebrowClass: 'text-[11px] font-semibold uppercase tracking-[0.32em] text-amber-300/70',
    headerTitleClass: 'text-[2.05rem] font-semibold tracking-tight text-white',
    headerDescriptionClass: 'text-sm leading-6 text-slate-400',
  },
  'droplet-studio': {
    id: 'droplet-studio',
    mark: 'DS',
    name: 'Droplet Studio',
    descriptor: 'Build and publish executable droplets',
    mode: 'dark',
    pageClass: 'bg-[#0d1117] text-slate-100',
    layoutClass: 'mx-auto grid min-h-screen max-w-[1680px] gap-5 px-5 py-5 xl:grid-cols-[250px_minmax(0,1fr)_360px]',
    sidebarClass: 'rounded-[1.75rem] border border-white/10 bg-[#111827] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.28)]',
    sidebarMetaClass: 'text-slate-400',
    navActiveClass: 'bg-cyan-400/10 text-cyan-100 ring-1 ring-cyan-400/20',
    navIdleClass: 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
    panelClass: 'rounded-[1.5rem] border border-white/10 bg-[#121a26] p-5 shadow-[0_14px_40px_rgba(0,0,0,0.24)]',
    panelTitleClass: 'text-slate-50',
    panelDescriptionClass: 'text-slate-400',
    badgeClass: 'rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-slate-300',
    tableWrapClass: 'overflow-x-auto rounded-[1.25rem] border border-white/10 bg-[#0f1722]',
    tableHeadClass: 'bg-white/[0.04] text-left text-slate-400',
    tableBodyClass: 'divide-y divide-white/10 bg-transparent',
    inputClass: 'rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400/40',
    primaryButtonClass: 'rounded-xl bg-cyan-400 px-3 py-2 text-sm font-medium text-slate-950 shadow-sm transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60',
    secondaryButtonClass: 'rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/30 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60',
    ghostButtonClass: 'rounded-xl px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-white/[0.05] hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-60',
    dangerButtonClass: 'rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-60',
    emptyStateClass: 'rounded-[1.25rem] border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400',
    headerMarkClass: 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-[11px] font-semibold tracking-[0.2em] text-cyan-100',
    headerEyebrowClass: 'text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200/70',
    headerTitleClass: 'text-[2.05rem] font-semibold tracking-tight text-white',
    headerDescriptionClass: 'text-sm leading-6 text-slate-400',
  },
  'mission-home': {
    id: 'mission-home',
    mark: 'MH',
    name: 'Mission Home',
    descriptor: 'Configure this company environment',
    mode: 'light',
    pageClass: 'bg-[#f5f7fb] text-slate-900',
    layoutClass: 'mx-auto grid min-h-screen max-w-[1640px] gap-5 px-5 py-5 xl:grid-cols-[248px_minmax(0,1fr)_336px]',
    sidebarClass: 'rounded-[1.75rem] border border-slate-200 bg-white/96 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]',
    sidebarMetaClass: 'text-slate-600',
    navActiveClass: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200',
    navIdleClass: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    panelClass: 'rounded-[1.5rem] border border-slate-200 bg-white/96 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]',
    panelTitleClass: 'text-slate-950',
    panelDescriptionClass: 'text-slate-600',
    badgeClass: 'rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-slate-700',
    tableWrapClass: 'overflow-x-auto rounded-[1.25rem] border border-slate-200 bg-white',
    tableHeadClass: 'bg-slate-50 text-left text-slate-500',
    tableBodyClass: 'divide-y divide-slate-200 bg-white',
    inputClass: 'rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-300',
    primaryButtonClass: 'rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60',
    secondaryButtonClass: 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60',
    ghostButtonClass: 'rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60',
    dangerButtonClass: 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60',
    emptyStateClass: 'rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500',
    headerMarkClass: 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-[11px] font-semibold tracking-[0.2em] text-emerald-800',
    headerEyebrowClass: 'text-[11px] font-semibold uppercase tracking-[0.32em] text-emerald-700',
    headerTitleClass: 'text-[2rem] font-semibold tracking-tight text-slate-950',
    headerDescriptionClass: 'text-sm leading-6 text-slate-600',
  },
  workspace: {
    id: 'workspace',
    mark: 'WS',
    name: 'Workspace',
    descriptor: 'Interact with your company through chat and droplets',
    mode: 'light',
    pageClass: 'bg-[#f7f8fb] text-slate-900',
    layoutClass: 'mx-auto grid min-h-screen max-w-[1700px] gap-5 px-5 py-5 xl:grid-cols-[248px_minmax(0,1fr)_332px]',
    sidebarClass: 'rounded-[1.75rem] border border-slate-200 bg-white/98 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.05)]',
    sidebarMetaClass: 'text-slate-600',
    navActiveClass: 'bg-blue-50 text-blue-800 ring-1 ring-blue-200',
    navIdleClass: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
    panelClass: 'rounded-[1.5rem] border border-slate-200 bg-white/98 p-5 shadow-[0_12px_34px_rgba(15,23,42,0.045)]',
    panelTitleClass: 'text-slate-950',
    panelDescriptionClass: 'text-slate-600',
    badgeClass: 'rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] text-slate-700',
    tableWrapClass: 'overflow-x-auto rounded-[1.25rem] border border-slate-200 bg-white',
    tableHeadClass: 'bg-slate-50 text-left text-slate-500',
    tableBodyClass: 'divide-y divide-slate-200 bg-white',
    inputClass: 'rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-300',
    primaryButtonClass: 'rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60',
    secondaryButtonClass: 'rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-800 disabled:cursor-not-allowed disabled:opacity-60',
    ghostButtonClass: 'rounded-xl px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60',
    dangerButtonClass: 'rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60',
    emptyStateClass: 'rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500',
    headerMarkClass: 'inline-flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-[11px] font-semibold tracking-[0.2em] text-blue-800',
    headerEyebrowClass: 'text-[11px] font-semibold uppercase tracking-[0.32em] text-blue-700',
    headerTitleClass: 'text-[2rem] font-semibold tracking-tight text-slate-950',
    headerDescriptionClass: 'text-sm leading-6 text-slate-600',
  },
}

export function getSurfaceUiConfig(surface?: SurfaceId) {
  if (!surface) return surfaceUiConfig.default
  return surfaceUiConfig[surface]
}
