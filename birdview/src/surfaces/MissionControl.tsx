import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

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
import { apiFetch } from '../lib/api'
import { APP_VERSION } from '../lib/appMeta'

type MissionSection =
  | 'overview'
  | 'verticals'
  | 'skills'
  | 'companies'
  | 'users'
  | 'llm'
  | 'email'

type VerticalSkill = {
  id: string
  verticalId: string
  skillId: string
  priority: number | null
  active: boolean
  skill: { id: string; name: string; key: string; status: string }
}

type Vertical = {
  id: string
  key: string
  name: string
  description: string | null
  category: string | null
  icon: string | null
  color: string | null
  status: string
  version: number
  verticalSkills: VerticalSkill[]
  companies: Array<{ id: string }>
}

type Skill = {
  id: string
  key: string
  name: string
  description: string
  instructions: string
  status: string
  version: number
  verticals: Array<{
    id: string
    verticalId: string
    priority: number | null
    active: boolean
    vertical: { id: string; name: string; key: string }
  }>
}

type Company = {
  id: string
  tenantId: string | null
  key: string
  name: string
  legalName: string | null
  slug: string
  taxId: string | null
  country: string | null
  timezone: string | null
  currency: string | null
  status: string
  verticalId: string
  createdAt: string
  vertical: { id: string; name: string; key: string }
  userMemberships: Array<{ id: string }>
}

type UserMembership = {
  id: string
  role: string
  status: string
}

type UserRecord = {
  id: string
  email: string
  firstName: string
  lastName: string
  displayName: string
  status: string
  globalRole: string | null
  companyMemberships: Array<
    UserMembership & {
      company: { id: string; name: string; slug: string; tenantId: string | null }
    }
  >
  verticalMemberships: Array<
    UserMembership & {
      vertical: { id: string; name: string; key: string }
    }
  >
}

type LlmProvider = {
  id: string
  providerKey: string
  name: string
  status: string
  baseUrl: string | null
  apiKeyRef: string | null
}

type LlmModel = {
  id: string
  providerConfigId: string
  modelKey: string
  displayName: string
  status: string
  isDefault: boolean
  temperature: number | null
  maxTokens: number | null
  supportsTools: boolean | null
  supportsStructuredOutput: boolean | null
  providerConfig: { id: string; name: string; providerKey: string }
}

type VerticalLlmConfig = {
  id: string
  verticalId: string
  providerConfigId: string
  modelConfigId: string
  purpose: string | null
  systemPrompt: string | null
  active: boolean
  vertical: { id: string; name: string }
  providerConfig: { id: string; name: string }
  modelConfig: { id: string; displayName: string }
}

type LlmTestResult = {
  ok: boolean
  providerName: string
  modelDisplayName: string
  status: number
  latencyMs: number
  responsePreview: string
  endpoint: string
  hasSystemPrompt: boolean
}

type EmailProvider = {
  id: string
  providerKey: string
  name: string
  status: string
  host: string | null
  port: number | null
  fromEmail: string | null
  fromName: string | null
}

type EmailTemplate = {
  id: string
  key: string
  name: string
  subjectTemplate: string
  bodyTemplate: string
  type: string | null
  status: string
}

const appNav = [
  { to: '/', label: 'Runtime' },
  { to: '/mission-control', label: 'Mission Control' },
  { to: '/droplet-studio', label: 'Droplet Studio' },
  { to: '/backoffice', label: 'Mission Home' },
]

const sectionMenu: Array<{ key: MissionSection; label: string }> = [
  { key: 'overview', label: 'Overview' },
  { key: 'verticals', label: 'Verticals' },
  { key: 'skills', label: 'Skills' },
  { key: 'companies', label: 'Companies' },
  { key: 'users', label: 'Users' },
  { key: 'llm', label: 'LLM Config' },
  { key: 'email', label: 'Email Config' },
]

const PLATFORM_LAUNCH_DATE = new Date('2026-03-01T00:00:00.000Z')

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat('pt-PT', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

function buildCompanyTimeline(companies: Company[]) {
  const now = new Date()
  const timeline: Array<{ label: string; total: number }> = []
  const companyDates = companies
    .map((company) => new Date(company.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()) && date >= PLATFORM_LAUNCH_DATE)
    .sort((left, right) => left.getTime() - right.getTime())

  let cursor = startOfMonth(PLATFORM_LAUNCH_DATE)
  const end = startOfMonth(now)
  let total = 0
  let index = 0

  while (cursor <= end) {
    const nextMonth = new Date(
      Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1)
    )

    while (index < companyDates.length && companyDates[index]! < nextMonth) {
      total += 1
      index += 1
    }

    timeline.push({
      label: formatMonthLabel(cursor),
      total,
    })

    cursor = nextMonth
  }

  return timeline
}

function buildVerticalCompanyCounts(companies: Company[]) {
  return companies.reduce<Array<{ label: string; total: number }>>((accumulator, company) => {
    const existing = accumulator.find((item) => item.label === company.vertical.name)
    if (existing) {
      existing.total += 1
      return accumulator
    }

    accumulator.push({
      label: company.vertical.name,
      total: 1,
    })
    return accumulator
  }, [])
}

function BarChart({
  title,
  subtitle,
  items,
}: {
  title: string
  subtitle: string
  items: Array<{ label: string; total: number }>
}) {
  const maxValue = Math.max(...items.map((item) => item.total), 1)

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      </div>
      <div className="flex min-h-[280px] items-end gap-3 overflow-x-auto rounded-[1.25rem] border border-white/10 bg-black/10 px-4 py-5">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-[88px] flex-1 flex-col items-center justify-end gap-3">
            <span className="text-sm font-semibold text-slate-200">{item.total}</span>
            <div className="flex h-48 w-full items-end">
              <div
                className="w-full rounded-t-xl bg-amber-400"
                style={{
                  height: `${Math.max((item.total / maxValue) * 100, item.total > 0 ? 10 : 2)}%`,
                }}
              />
            </div>
            <span className="text-center text-xs leading-5 text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SectionButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
        active
          ? 'border-amber-400/30 bg-amber-400/10 text-amber-100'
          : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.05]'
      }`}
    >
      {children}
    </button>
  )
}

function parseJsonInput(value: string) {
  if (!value.trim()) {
    return undefined
  }
  return JSON.parse(value)
}

export function MissionControl() {
  const location = useLocation()
  const navigate = useNavigate()
  const [section, setSection] = useState<MissionSection>('overview')
  const [verticals, setVerticals] = useState<Vertical[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<UserRecord[]>([])
  const [llmProviders, setLlmProviders] = useState<LlmProvider[]>([])
  const [llmModels, setLlmModels] = useState<LlmModel[]>([])
  const [verticalLlmConfigs, setVerticalLlmConfigs] = useState<VerticalLlmConfig[]>([])
  const [emailProviders, setEmailProviders] = useState<EmailProvider[]>([])
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTestingLlm, setIsTestingLlm] = useState(false)
  const [llmTestResult, setLlmTestResult] = useState<LlmTestResult | null>(null)
  const [isClearingLogs, setIsClearingLogs] = useState(false)

  const [verticalForm, setVerticalForm] = useState({
    id: '',
    key: '',
    name: '',
    description: '',
    category: '',
    icon: '',
    color: '',
    status: 'ACTIVE',
    version: '1',
  })
  const [verticalSkillForm, setVerticalSkillForm] = useState({
    id: '',
    verticalId: '',
    skillId: '',
    priority: '',
    active: true,
  })
  const [skillForm, setSkillForm] = useState({
    id: '',
    key: '',
    name: '',
    description: '',
    instructions: '',
    status: 'ACTIVE',
    version: '1',
    tagsJson: '',
    triggerHintsJson: '',
  })
  const [companyForm, setCompanyForm] = useState({
    id: '',
    tenantId: '',
    key: '',
    name: '',
    legalName: '',
    slug: '',
    taxId: '',
    country: '',
    timezone: '',
    currency: '',
    status: 'ACTIVE',
    verticalId: '',
  })
  const [userForm, setUserForm] = useState({
    id: '',
    email: '',
    firstName: '',
    lastName: '',
    displayName: '',
    globalRole: '',
    status: 'ACTIVE',
  })
  const [userCompanyMembershipForm, setUserCompanyMembershipForm] = useState({
    id: '',
    userId: '',
    companyId: '',
    role: 'member',
    status: 'ACTIVE',
  })
  const [userVerticalMembershipForm, setUserVerticalMembershipForm] = useState({
    id: '',
    userId: '',
    verticalId: '',
    role: 'operator',
    status: 'ACTIVE',
  })
  const [llmProviderForm, setLlmProviderForm] = useState({
    id: '',
    providerKey: '',
    name: '',
    status: 'ACTIVE',
    baseUrl: '',
    apiKeyRef: '',
    configJson: '',
  })
  const [llmModelForm, setLlmModelForm] = useState({
    id: '',
    providerConfigId: '',
    modelKey: '',
    displayName: '',
    status: 'ACTIVE',
    isDefault: false,
    temperature: '',
    maxTokens: '',
    supportsTools: false,
    supportsStructuredOutput: false,
    configJson: '',
  })
  const [verticalLlmForm, setVerticalLlmForm] = useState({
    id: '',
    verticalId: '',
    providerConfigId: '',
    modelConfigId: '',
    purpose: '',
    systemPrompt: '',
    active: true,
    configJson: '',
  })
  const [emailProviderForm, setEmailProviderForm] = useState({
    id: '',
    providerKey: '',
    name: '',
    status: 'ACTIVE',
    host: '',
    port: '',
    usernameRef: '',
    passwordRef: '',
    fromEmail: '',
    fromName: '',
    configJson: '',
  })
  const [emailTemplateForm, setEmailTemplateForm] = useState({
    id: '',
    key: '',
    name: '',
    subjectTemplate: '',
    bodyTemplate: '',
    type: '',
    status: 'ACTIVE',
  })

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const [
        verticalData,
        skillData,
        companyData,
        userData,
        llmProviderData,
        llmModelData,
        verticalLlmData,
        emailProviderData,
        emailTemplateData,
      ] = await Promise.all([
        apiFetch<Vertical[]>('/api/verticals'),
        apiFetch<Skill[]>('/api/skills'),
        apiFetch<Company[]>('/api/companies'),
        apiFetch<UserRecord[]>('/api/users'),
        apiFetch<LlmProvider[]>('/api/llm-provider-configs'),
        apiFetch<LlmModel[]>('/api/llm-model-configs'),
        apiFetch<VerticalLlmConfig[]>('/api/vertical-llm-configs'),
        apiFetch<EmailProvider[]>('/api/email-provider-configs'),
        apiFetch<EmailTemplate[]>('/api/email-templates'),
      ])

      setVerticals(verticalData)
      setSkills(skillData)
      setCompanies(companyData)
      setUsers(userData)
      setLlmProviders(llmProviderData)
      setLlmModels(llmModelData)
      setVerticalLlmConfigs(verticalLlmData)
      setEmailProviders(emailProviderData)
      setEmailTemplates(emailTemplateData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load Mission Control.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  useEffect(() => {
    const pathname = location.pathname
    if (pathname.endsWith('/verticals')) setSection('verticals')
    else if (pathname.endsWith('/skills')) setSection('skills')
    else if (pathname.endsWith('/companies')) setSection('companies')
    else if (pathname.endsWith('/users')) setSection('users')
    else if (pathname.endsWith('/config/llms')) setSection('llm')
    else if (pathname.endsWith('/config/email')) setSection('email')
    else setSection('overview')
  }, [location.pathname])

  function navigateToSection(nextSection: MissionSection) {
    setSection(nextSection)
    const routeMap: Record<MissionSection, string> = {
      overview: '/mission-control',
      verticals: '/mission-control/verticals',
      skills: '/mission-control/skills',
      companies: '/mission-control/companies',
      users: '/mission-control/users',
      llm: '/mission-control/config/llms',
      email: '/mission-control/config/email',
    }
    void navigate(routeMap[nextSection])
  }

  const summary = useMemo(
    () => [
      { label: 'Verticals', value: verticals.length },
      { label: 'Skills', value: skills.length },
      { label: 'Companies', value: companies.length },
      { label: 'Users', value: users.length },
      { label: 'LLM providers', value: llmProviders.length },
      { label: 'Email templates', value: emailTemplates.length },
    ],
    [verticals, skills, companies, users, llmProviders, emailTemplates]
  )
  const companyTimeline = useMemo(() => buildCompanyTimeline(companies), [companies])
  const companiesByVertical = useMemo(
    () => buildVerticalCompanyCounts(companies),
    [companies]
  )

  async function submitVertical() {
    const payload = {
      key: verticalForm.key,
      name: verticalForm.name,
      description: verticalForm.description || null,
      category: verticalForm.category || null,
      icon: verticalForm.icon || null,
      color: verticalForm.color || null,
      status: verticalForm.status,
      version: Number(verticalForm.version || 1),
    }
    if (verticalForm.id) {
      await apiFetch(`/api/verticals/${verticalForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/verticals', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setVerticalForm({
      id: '',
      key: '',
      name: '',
      description: '',
      category: '',
      icon: '',
      color: '',
      status: 'ACTIVE',
      version: '1',
    })
    await load()
  }

  async function submitVerticalSkill() {
    const payload = {
      verticalId: verticalSkillForm.verticalId,
      skillId: verticalSkillForm.skillId,
      priority: verticalSkillForm.priority ? Number(verticalSkillForm.priority) : null,
      active: verticalSkillForm.active,
    }
    if (verticalSkillForm.id) {
      await apiFetch(`/api/vertical-skills/${verticalSkillForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/vertical-skills', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setVerticalSkillForm({ id: '', verticalId: '', skillId: '', priority: '', active: true })
    await load()
  }

  async function submitSkill() {
    const payload = {
      key: skillForm.key,
      name: skillForm.name,
      description: skillForm.description,
      instructions: skillForm.instructions,
      status: skillForm.status,
      version: Number(skillForm.version || 1),
      tagsJson: parseJsonInput(skillForm.tagsJson),
      triggerHintsJson: parseJsonInput(skillForm.triggerHintsJson),
    }
    if (skillForm.id) {
      await apiFetch(`/api/skills/${skillForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/skills', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setSkillForm({
      id: '',
      key: '',
      name: '',
      description: '',
      instructions: '',
      status: 'ACTIVE',
      version: '1',
      tagsJson: '',
      triggerHintsJson: '',
    })
    await load()
  }

  async function submitCompany() {
    const payload = {
      tenantId: companyForm.tenantId || null,
      key: companyForm.key,
      name: companyForm.name,
      legalName: companyForm.legalName || null,
      slug: companyForm.slug,
      taxId: companyForm.taxId || null,
      country: companyForm.country || null,
      timezone: companyForm.timezone || null,
      currency: companyForm.currency || null,
      status: companyForm.status,
      verticalId: companyForm.verticalId,
    }
    if (companyForm.id) {
      await apiFetch(`/api/companies/${companyForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/companies', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setCompanyForm({
      id: '',
      tenantId: '',
      key: '',
      name: '',
      legalName: '',
      slug: '',
      taxId: '',
      country: '',
      timezone: '',
      currency: '',
      status: 'ACTIVE',
      verticalId: '',
    })
    await load()
  }

  async function submitUser() {
    const payload = {
      email: userForm.email,
      firstName: userForm.firstName,
      lastName: userForm.lastName,
      displayName: userForm.displayName,
      globalRole: userForm.globalRole || null,
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
    setUserForm({
      id: '',
      email: '',
      firstName: '',
      lastName: '',
      displayName: '',
      globalRole: '',
      status: 'ACTIVE',
    })
    await load()
  }

  async function submitUserCompanyMembership() {
    const payload = {
      userId: userCompanyMembershipForm.userId,
      companyId: userCompanyMembershipForm.companyId,
      role: userCompanyMembershipForm.role,
      status: userCompanyMembershipForm.status,
    }
    if (userCompanyMembershipForm.id) {
      await apiFetch(`/api/user-company-memberships/${userCompanyMembershipForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/user-company-memberships', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setUserCompanyMembershipForm({
      id: '',
      userId: '',
      companyId: '',
      role: 'member',
      status: 'ACTIVE',
    })
    await load()
  }

  async function submitUserVerticalMembership() {
    const payload = {
      userId: userVerticalMembershipForm.userId,
      verticalId: userVerticalMembershipForm.verticalId,
      role: userVerticalMembershipForm.role,
      status: userVerticalMembershipForm.status,
    }
    if (userVerticalMembershipForm.id) {
      await apiFetch(`/api/user-vertical-memberships/${userVerticalMembershipForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/user-vertical-memberships', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setUserVerticalMembershipForm({
      id: '',
      userId: '',
      verticalId: '',
      role: 'operator',
      status: 'ACTIVE',
    })
    await load()
  }

  async function submitLlmProvider() {
    const payload = {
      providerKey: llmProviderForm.providerKey,
      name: llmProviderForm.name,
      status: llmProviderForm.status,
      baseUrl: llmProviderForm.baseUrl || null,
      apiKeyRef: llmProviderForm.apiKeyRef || null,
      configJson: parseJsonInput(llmProviderForm.configJson),
    }
    if (llmProviderForm.id) {
      await apiFetch(`/api/llm-provider-configs/${llmProviderForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/llm-provider-configs', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setLlmProviderForm({
      id: '',
      providerKey: '',
      name: '',
      status: 'ACTIVE',
      baseUrl: '',
      apiKeyRef: '',
      configJson: '',
    })
    await load()
  }

  async function submitLlmModel() {
    const payload = {
      providerConfigId: llmModelForm.providerConfigId,
      modelKey: llmModelForm.modelKey,
      displayName: llmModelForm.displayName,
      status: llmModelForm.status,
      isDefault: llmModelForm.isDefault,
      temperature: llmModelForm.temperature ? Number(llmModelForm.temperature) : null,
      maxTokens: llmModelForm.maxTokens ? Number(llmModelForm.maxTokens) : null,
      supportsTools: llmModelForm.supportsTools,
      supportsStructuredOutput: llmModelForm.supportsStructuredOutput,
      configJson: parseJsonInput(llmModelForm.configJson),
    }
    if (llmModelForm.id) {
      await apiFetch(`/api/llm-model-configs/${llmModelForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/llm-model-configs', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setLlmModelForm({
      id: '',
      providerConfigId: '',
      modelKey: '',
      displayName: '',
      status: 'ACTIVE',
      isDefault: false,
      temperature: '',
      maxTokens: '',
      supportsTools: false,
      supportsStructuredOutput: false,
      configJson: '',
    })
    await load()
  }

  async function submitVerticalLlm() {
    const payload = {
      verticalId: verticalLlmForm.verticalId,
      providerConfigId: verticalLlmForm.providerConfigId,
      modelConfigId: verticalLlmForm.modelConfigId,
      purpose: verticalLlmForm.purpose || null,
      systemPrompt: verticalLlmForm.systemPrompt || null,
      active: verticalLlmForm.active,
      configJson: parseJsonInput(verticalLlmForm.configJson),
    }
    if (verticalLlmForm.id) {
      await apiFetch(`/api/vertical-llm-configs/${verticalLlmForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/vertical-llm-configs', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setVerticalLlmForm({
      id: '',
      verticalId: '',
      providerConfigId: '',
      modelConfigId: '',
      purpose: '',
      systemPrompt: '',
      active: true,
      configJson: '',
    })
    await load()
  }

  async function submitEmailProvider() {
    const payload = {
      providerKey: emailProviderForm.providerKey,
      name: emailProviderForm.name,
      status: emailProviderForm.status,
      host: emailProviderForm.host || null,
      port: emailProviderForm.port ? Number(emailProviderForm.port) : null,
      usernameRef: emailProviderForm.usernameRef || null,
      passwordRef: emailProviderForm.passwordRef || null,
      fromEmail: emailProviderForm.fromEmail || null,
      fromName: emailProviderForm.fromName || null,
      configJson: parseJsonInput(emailProviderForm.configJson),
    }
    if (emailProviderForm.id) {
      await apiFetch(`/api/email-provider-configs/${emailProviderForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/email-provider-configs', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setEmailProviderForm({
      id: '',
      providerKey: '',
      name: '',
      status: 'ACTIVE',
      host: '',
      port: '',
      usernameRef: '',
      passwordRef: '',
      fromEmail: '',
      fromName: '',
      configJson: '',
    })
    await load()
  }

  async function submitEmailTemplate() {
    const payload = {
      key: emailTemplateForm.key,
      name: emailTemplateForm.name,
      subjectTemplate: emailTemplateForm.subjectTemplate,
      bodyTemplate: emailTemplateForm.bodyTemplate,
      type: emailTemplateForm.type || null,
      status: emailTemplateForm.status,
    }
    if (emailTemplateForm.id) {
      await apiFetch(`/api/email-templates/${emailTemplateForm.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
    } else {
      await apiFetch('/api/email-templates', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    }
    setEmailTemplateForm({
      id: '',
      key: '',
      name: '',
      subjectTemplate: '',
      bodyTemplate: '',
      type: '',
      status: 'ACTIVE',
    })
    await load()
  }

  async function testLlmModel(id: string) {
    setIsTestingLlm(true)
    setError(null)
    try {
      const result = await apiFetch<LlmTestResult>(`/api/llm-model-configs/${id}/test`, {
        method: 'POST',
      })
      setLlmTestResult(result)
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'Failed to test LLM model.')
    } finally {
      setIsTestingLlm(false)
    }
  }

  async function testVerticalLlm(id: string) {
    setIsTestingLlm(true)
    setError(null)
    try {
      const result = await apiFetch<LlmTestResult>(`/api/vertical-llm-configs/${id}/test`, {
        method: 'POST',
      })
      setLlmTestResult(result)
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : 'Failed to test vertical LLM config.')
    } finally {
      setIsTestingLlm(false)
    }
  }

  async function clearMissionControlLogs() {
    if (!window.confirm('Clear all universal Mission Control logs? This cannot be undone.')) {
      return
    }

    setIsClearingLogs(true)
    setError(null)
    try {
      await apiFetch<{ ok: boolean; deletedCount: number }>('/api/audit-logs', {
        method: 'DELETE',
      })
      setLlmTestResult(null)
    } catch (clearError) {
      setError(clearError instanceof Error ? clearError.message : 'Failed to clear Mission Control logs.')
    } finally {
      setIsClearingLogs(false)
    }
  }

  const sidePanel = (
    <div className="space-y-6">
      <Panel title="Mission Control Map" description="Platform-level administration across platform, vertical, company, user, and config layers.">
        <div className="grid gap-3 sm:grid-cols-2">
          {summary.map((item) => (
            <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">{item.label}</p>
              <p className="mt-2 text-3xl font-semibold text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Structure" description="Manage means full CRUD unless explicitly restricted.">
        <div className="space-y-3 text-sm text-slate-400">
          <p>Overview gives platform health and counts.</p>
          <p>Verticals manage the domain catalog and skill associations.</p>
          <p>Companies map each company to exactly one vertical.</p>
          <p>Users are auth-ready and link to verticals and companies through memberships.</p>
          <p>Config is split into LLM configuration and email configuration.</p>
        </div>
      </Panel>
    </div>
  )

  return (
    <SurfaceShell
      surface="mission-control"
      eyebrow="Birdview Platform"
      title="Mission Control"
      version={APP_VERSION}
      description="Platform-level admin for verticals, skills, companies, users, and shared configuration."
      nav={appNav}
      sidePanel={sidePanel}
    >
      <Panel title="Menu" description="Mission Control information architecture.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {sectionMenu.map((item) => (
            <SectionButton
              key={item.key}
              active={section === item.key}
              onClick={() => navigateToSection(item.key)}
            >
              {item.label}
            </SectionButton>
          ))}
        </div>
      </Panel>

      {error ? (
        <Panel title="Error">
          <p className="text-sm text-rose-600">{error}</p>
        </Panel>
      ) : null}

      {isLoading ? (
        <Panel title="Loading">
          <p className="text-sm text-slate-600">Loading Mission Control data...</p>
        </Panel>
      ) : null}

      {!isLoading && section === 'overview' ? (
        <>
          <Panel
            title="Overview"
            description="Resumo da plataforma desde o lancamento em 1 de marco de 2026."
          >
            <div className="mb-4 flex justify-end">
              <SecondaryButton onClick={() => void clearMissionControlLogs()}>
                {isClearingLogs ? 'Clearing logs...' : 'Clear logs'}
              </SecondaryButton>
            </div>
            <Table
              headers={['Module', 'Records', 'Notes']}
              rows={[
                ['Verticals', verticals.length, 'Reusable industry/domain tracks'],
                ['Skills', skills.length, 'Shared skill definitions linked to verticals'],
                ['Companies', companies.length, 'Each company belongs to exactly one vertical'],
                ['Users', users.length, 'Global auth-ready users with memberships'],
                ['LLM Config', llmProviders.length + llmModels.length + verticalLlmConfigs.length, 'Providers, models, and vertical overrides'],
                ['Email Config', emailProviders.length + emailTemplates.length, 'Providers and templates'],
              ]}
            />
          </Panel>

          <Panel
            title="Empresas Desde O Lancamento"
            description="Grafico de barras com o numero total acumulado de empresas registadas desde 1 de marco de 2026 ate ao momento."
          >
            <BarChart
              title="Total acumulado por mes"
              subtitle="Eixo X: meses desde o lancamento. Eixo Y: total acumulado de empresas registadas."
              items={companyTimeline}
            />
          </Panel>

          <Panel
            title="Empresas Por Vertical"
            description="Grafico de barras com os verticais no eixo X e o numero total de empresas registadas no eixo Y desde o lancamento ate hoje."
          >
            <BarChart
              title="Total por vertical"
              subtitle="Eixo X: verticais. Eixo Y: numero de empresas associadas a cada vertical."
              items={companiesByVertical}
            />
          </Panel>
        </>
      ) : null}

      {!isLoading && section === 'verticals' ? (
        <>
          <Panel title="Verticals" description="Full CRUD for vertical records.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input placeholder="Key" value={verticalForm.key} onChange={(event) => setVerticalForm((current) => ({ ...current, key: event.target.value }))} />
              <Input placeholder="Name" value={verticalForm.name} onChange={(event) => setVerticalForm((current) => ({ ...current, name: event.target.value }))} />
              <Input placeholder="Category" value={verticalForm.category} onChange={(event) => setVerticalForm((current) => ({ ...current, category: event.target.value }))} />
              <Select value={verticalForm.status} onChange={(event) => setVerticalForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
              <Input placeholder="Icon" value={verticalForm.icon} onChange={(event) => setVerticalForm((current) => ({ ...current, icon: event.target.value }))} />
              <Input placeholder="Color" value={verticalForm.color} onChange={(event) => setVerticalForm((current) => ({ ...current, color: event.target.value }))} />
              <Input placeholder="Version" type="number" value={verticalForm.version} onChange={(event) => setVerticalForm((current) => ({ ...current, version: event.target.value }))} />
              <Input placeholder="Description" value={verticalForm.description} onChange={(event) => setVerticalForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void submitVertical()}>{verticalForm.id ? 'Update vertical' : 'Add vertical'}</PrimaryButton>
              <SecondaryButton onClick={() => setVerticalForm({ id: '', key: '', name: '', description: '', category: '', icon: '', color: '', status: 'ACTIVE', version: '1' })}>Clear</SecondaryButton>
            </div>
            <div className="mt-6">
              <Table
                headers={['Vertical', 'Key', 'Status', 'Skills', 'Companies', 'Actions']}
                rows={verticals.map((vertical) => [
                  <div key={vertical.id}>
                    <p className="font-medium text-slate-900">{vertical.name}</p>
                    <p className="text-xs text-slate-500">{vertical.description ?? 'No description'}</p>
                  </div>,
                  vertical.key,
                  <StatusPill key={`${vertical.id}-status`}>{vertical.status}</StatusPill>,
                  vertical.verticalSkills.length,
                  vertical.companies.length,
                  <div key={`${vertical.id}-actions`} className="flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => setVerticalForm({ id: vertical.id, key: vertical.key, name: vertical.name, description: vertical.description ?? '', category: vertical.category ?? '', icon: vertical.icon ?? '', color: vertical.color ?? '', status: vertical.status, version: String(vertical.version) })}>Edit</SecondaryButton>
                    <SecondaryButton onClick={() => void apiFetch(`/api/verticals/${vertical.id}`, { method: 'DELETE' }).then(load)}>Delete</SecondaryButton>
                  </div>,
                ])}
              />
            </div>
          </Panel>

          <Panel title="Vertical Skills" description="Add, update, delete, activate, and deactivate skill associations for each vertical.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select value={verticalSkillForm.verticalId} onChange={(event) => setVerticalSkillForm((current) => ({ ...current, verticalId: event.target.value }))}>
                <option value="">Select vertical</option>
                {verticals.map((vertical) => (
                  <option key={vertical.id} value={vertical.id}>{vertical.name}</option>
                ))}
              </Select>
              <Select value={verticalSkillForm.skillId} onChange={(event) => setVerticalSkillForm((current) => ({ ...current, skillId: event.target.value }))}>
                <option value="">Select skill</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>{skill.name}</option>
                ))}
              </Select>
              <Input placeholder="Priority" type="number" value={verticalSkillForm.priority} onChange={(event) => setVerticalSkillForm((current) => ({ ...current, priority: event.target.value }))} />
              <Select value={verticalSkillForm.active ? 'true' : 'false'} onChange={(event) => setVerticalSkillForm((current) => ({ ...current, active: event.target.value === 'true' }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
            </div>
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void submitVerticalSkill()}>{verticalSkillForm.id ? 'Update association' : 'Add association'}</PrimaryButton>
              <SecondaryButton onClick={() => setVerticalSkillForm({ id: '', verticalId: '', skillId: '', priority: '', active: true })}>Clear</SecondaryButton>
            </div>
            <div className="mt-6">
              <Table
                headers={['Vertical', 'Skill', 'Priority', 'Active', 'Actions']}
                rows={verticals.flatMap((vertical) =>
                  vertical.verticalSkills.map((association) => [
                    vertical.name,
                    association.skill.name,
                    association.priority ?? '—',
                    <StatusPill key={`${association.id}-active`}>{association.active ? 'ACTIVE' : 'INACTIVE'}</StatusPill>,
                    <div key={`${association.id}-actions`} className="flex flex-wrap gap-2">
                      <SecondaryButton onClick={() => setVerticalSkillForm({ id: association.id, verticalId: association.verticalId, skillId: association.skillId, priority: association.priority == null ? '' : String(association.priority), active: association.active })}>Edit</SecondaryButton>
                      <SecondaryButton onClick={() => void apiFetch(`/api/vertical-skills/${association.id}`, { method: 'DELETE' }).then(load)}>Delete</SecondaryButton>
                    </div>,
                  ])
                )}
              />
            </div>
          </Panel>
        </>
      ) : null}

      {!isLoading && section === 'skills' ? (
        <Panel title="Skills" description="Full CRUD for reusable skills.">
          <div className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Key" value={skillForm.key} onChange={(event) => setSkillForm((current) => ({ ...current, key: event.target.value }))} />
            <Input placeholder="Name" value={skillForm.name} onChange={(event) => setSkillForm((current) => ({ ...current, name: event.target.value }))} />
            <Textarea placeholder="Description" value={skillForm.description} onChange={(event) => setSkillForm((current) => ({ ...current, description: event.target.value }))} />
            <Textarea placeholder="Instructions" value={skillForm.instructions} onChange={(event) => setSkillForm((current) => ({ ...current, instructions: event.target.value }))} />
            <Textarea placeholder="Tags JSON" value={skillForm.tagsJson} onChange={(event) => setSkillForm((current) => ({ ...current, tagsJson: event.target.value }))} />
            <Textarea placeholder="Trigger hints JSON" value={skillForm.triggerHintsJson} onChange={(event) => setSkillForm((current) => ({ ...current, triggerHintsJson: event.target.value }))} />
            <Input placeholder="Version" type="number" value={skillForm.version} onChange={(event) => setSkillForm((current) => ({ ...current, version: event.target.value }))} />
            <Select value={skillForm.status} onChange={(event) => setSkillForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
          <div className="mt-4 flex gap-3">
            <PrimaryButton onClick={() => void submitSkill()}>{skillForm.id ? 'Update skill' : 'Add skill'}</PrimaryButton>
            <SecondaryButton onClick={() => setSkillForm({ id: '', key: '', name: '', description: '', instructions: '', status: 'ACTIVE', version: '1', tagsJson: '', triggerHintsJson: '' })}>Clear</SecondaryButton>
          </div>
          <div className="mt-6">
            <Table
              headers={['Skill', 'Key', 'Status', 'Verticals', 'Actions']}
              rows={skills.map((skill) => [
                <div key={skill.id}>
                  <p className="font-medium text-slate-900">{skill.name}</p>
                  <p className="text-xs text-slate-500">{skill.description}</p>
                </div>,
                skill.key,
                <StatusPill key={`${skill.id}-status`}>{skill.status}</StatusPill>,
                skill.verticals.map((item) => item.vertical.name).join(', ') || '—',
                <div key={`${skill.id}-actions`} className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => setSkillForm({ id: skill.id, key: skill.key, name: skill.name, description: skill.description, instructions: skill.instructions, status: skill.status, version: String(skill.version), tagsJson: '', triggerHintsJson: '' })}>Edit</SecondaryButton>
                  <SecondaryButton onClick={() => void apiFetch(`/api/skills/${skill.id}`, { method: 'DELETE' }).then(load)}>Delete</SecondaryButton>
                </div>,
              ])}
            />
          </div>
        </Panel>
      ) : null}

      {!isLoading && section === 'companies' ? (
        <Panel title="Companies" description="Full CRUD for companies. Every company belongs to one and only one vertical.">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input placeholder="Tenant ID (optional bridge)" value={companyForm.tenantId} onChange={(event) => setCompanyForm((current) => ({ ...current, tenantId: event.target.value }))} />
            <Input placeholder="Key" value={companyForm.key} onChange={(event) => setCompanyForm((current) => ({ ...current, key: event.target.value }))} />
            <Input placeholder="Name" value={companyForm.name} onChange={(event) => setCompanyForm((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="Legal name" value={companyForm.legalName} onChange={(event) => setCompanyForm((current) => ({ ...current, legalName: event.target.value }))} />
            <Input placeholder="Slug" value={companyForm.slug} onChange={(event) => setCompanyForm((current) => ({ ...current, slug: event.target.value }))} />
            <Input placeholder="Tax ID" value={companyForm.taxId} onChange={(event) => setCompanyForm((current) => ({ ...current, taxId: event.target.value }))} />
            <Input placeholder="Country" value={companyForm.country} onChange={(event) => setCompanyForm((current) => ({ ...current, country: event.target.value }))} />
            <Input placeholder="Timezone" value={companyForm.timezone} onChange={(event) => setCompanyForm((current) => ({ ...current, timezone: event.target.value }))} />
            <Input placeholder="Currency" value={companyForm.currency} onChange={(event) => setCompanyForm((current) => ({ ...current, currency: event.target.value }))} />
            <Select value={companyForm.verticalId} onChange={(event) => setCompanyForm((current) => ({ ...current, verticalId: event.target.value }))}>
              <option value="">Select vertical</option>
              {verticals.map((vertical) => (
                <option key={vertical.id} value={vertical.id}>{vertical.name}</option>
              ))}
            </Select>
            <Select value={companyForm.status} onChange={(event) => setCompanyForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
          <div className="mt-4 flex gap-3">
            <PrimaryButton onClick={() => void submitCompany()}>{companyForm.id ? 'Update company' : 'Add company'}</PrimaryButton>
            <SecondaryButton onClick={() => setCompanyForm({ id: '', tenantId: '', key: '', name: '', legalName: '', slug: '', taxId: '', country: '', timezone: '', currency: '', status: 'ACTIVE', verticalId: '' })}>Clear</SecondaryButton>
          </div>
          <div className="mt-6">
            <Table
              headers={['Company', 'Slug', 'Vertical', 'Status', 'Members', 'Actions']}
              rows={companies.map((company) => [
                <div key={company.id}>
                  <p className="font-medium text-slate-900">{company.name}</p>
                  <p className="text-xs text-slate-500">{company.legalName ?? 'No legal name'}</p>
                </div>,
                company.slug,
                company.vertical.name,
                <StatusPill key={`${company.id}-status`}>{company.status}</StatusPill>,
                company.userMemberships.length,
                <div key={`${company.id}-actions`} className="flex flex-wrap gap-2">
                  <SecondaryButton onClick={() => setCompanyForm({ id: company.id, tenantId: company.tenantId ?? '', key: company.key, name: company.name, legalName: company.legalName ?? '', slug: company.slug, taxId: company.taxId ?? '', country: company.country ?? '', timezone: company.timezone ?? '', currency: company.currency ?? '', status: company.status, verticalId: company.verticalId })}>Edit</SecondaryButton>
                  <SecondaryButton onClick={() => void apiFetch(`/api/companies/${company.id}`, { method: 'DELETE' }).then(load)}>Delete</SecondaryButton>
                </div>,
              ])}
            />
          </div>
        </Panel>
      ) : null}

      {!isLoading && section === 'users' ? (
        <>
          <Panel title="Users" description="Full CRUD for global users, ready for future authentication and access control.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Input placeholder="Email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} />
              <Input placeholder="First name" value={userForm.firstName} onChange={(event) => setUserForm((current) => ({ ...current, firstName: event.target.value }))} />
              <Input placeholder="Last name" value={userForm.lastName} onChange={(event) => setUserForm((current) => ({ ...current, lastName: event.target.value }))} />
              <Input placeholder="Display name" value={userForm.displayName} onChange={(event) => setUserForm((current) => ({ ...current, displayName: event.target.value }))} />
              <Input placeholder="Global role" value={userForm.globalRole} onChange={(event) => setUserForm((current) => ({ ...current, globalRole: event.target.value }))} />
              <Select value={userForm.status} onChange={(event) => setUserForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INVITED">Invited</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void submitUser()}>{userForm.id ? 'Update user' : 'Add user'}</PrimaryButton>
              <SecondaryButton onClick={() => setUserForm({ id: '', email: '', firstName: '', lastName: '', displayName: '', globalRole: '', status: 'ACTIVE' })}>Clear</SecondaryButton>
            </div>
            <div className="mt-6">
              <Table
                headers={['User', 'Email', 'Status', 'Verticals', 'Companies', 'Actions']}
                rows={users.map((user) => [
                  <div key={user.id}>
                    <p className="font-medium text-slate-900">{user.displayName}</p>
                    <p className="text-xs text-slate-500">{user.globalRole ?? 'No global role'}</p>
                  </div>,
                  user.email,
                  <StatusPill key={`${user.id}-status`}>{user.status}</StatusPill>,
                  user.verticalMemberships.map((item) => `${item.vertical.name} (${item.role})`).join(', ') || '—',
                  user.companyMemberships.map((item) => `${item.company.name} (${item.role})`).join(', ') || '—',
                  <div key={`${user.id}-actions`} className="flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => setUserForm({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, displayName: user.displayName, globalRole: user.globalRole ?? '', status: user.status })}>Edit</SecondaryButton>
                    <SecondaryButton onClick={() => void apiFetch(`/api/users/${user.id}`, { method: 'DELETE' }).then(load)}>Delete</SecondaryButton>
                  </div>,
                ])}
              />
            </div>
          </Panel>

          <Panel title="User to Company Memberships" description="Full CRUD for company memberships.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select value={userCompanyMembershipForm.userId} onChange={(event) => setUserCompanyMembershipForm((current) => ({ ...current, userId: event.target.value }))}>
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.displayName}</option>
                ))}
              </Select>
              <Select value={userCompanyMembershipForm.companyId} onChange={(event) => setUserCompanyMembershipForm((current) => ({ ...current, companyId: event.target.value }))}>
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </Select>
              <Input placeholder="Role" value={userCompanyMembershipForm.role} onChange={(event) => setUserCompanyMembershipForm((current) => ({ ...current, role: event.target.value }))} />
              <Select value={userCompanyMembershipForm.status} onChange={(event) => setUserCompanyMembershipForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INVITED">Invited</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void submitUserCompanyMembership()}>{userCompanyMembershipForm.id ? 'Update membership' : 'Add membership'}</PrimaryButton>
              <SecondaryButton onClick={() => setUserCompanyMembershipForm({ id: '', userId: '', companyId: '', role: 'member', status: 'ACTIVE' })}>Clear</SecondaryButton>
            </div>
          </Panel>

          <Panel title="User to Vertical Memberships" description="Full CRUD for vertical memberships.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select value={userVerticalMembershipForm.userId} onChange={(event) => setUserVerticalMembershipForm((current) => ({ ...current, userId: event.target.value }))}>
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.displayName}</option>
                ))}
              </Select>
              <Select value={userVerticalMembershipForm.verticalId} onChange={(event) => setUserVerticalMembershipForm((current) => ({ ...current, verticalId: event.target.value }))}>
                <option value="">Select vertical</option>
                {verticals.map((vertical) => (
                  <option key={vertical.id} value={vertical.id}>{vertical.name}</option>
                ))}
              </Select>
              <Input placeholder="Role" value={userVerticalMembershipForm.role} onChange={(event) => setUserVerticalMembershipForm((current) => ({ ...current, role: event.target.value }))} />
              <Select value={userVerticalMembershipForm.status} onChange={(event) => setUserVerticalMembershipForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INVITED">Invited</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
            </div>
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void submitUserVerticalMembership()}>{userVerticalMembershipForm.id ? 'Update membership' : 'Add membership'}</PrimaryButton>
              <SecondaryButton onClick={() => setUserVerticalMembershipForm({ id: '', userId: '', verticalId: '', role: 'operator', status: 'ACTIVE' })}>Clear</SecondaryButton>
            </div>
          </Panel>
        </>
      ) : null}

      {!isLoading && section === 'llm' ? (
        <>
          <Panel
            title="LLM Testability"
            description="LLM configs can now be tested from Mission Control using the provider, model, and optional vertical system prompt."
          >
            <div className="space-y-3 text-sm text-slate-400">
              <p>Model tests use the provider endpoint, API key reference, and model selected in Mission Control.</p>
              <p>Vertical override tests also include the configured system prompt for that vertical override.</p>
              <p>For tests to work, the provider must be active and its API key env var must exist on the server.</p>
            </div>
            {llmTestResult ? (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
                <p className="font-medium text-white">
                  Last test: {llmTestResult.providerName} / {llmTestResult.modelDisplayName}
                </p>
                <p className="mt-1">Status {llmTestResult.status} in {llmTestResult.latencyMs} ms</p>
                <p className="mt-1">Endpoint: {llmTestResult.endpoint}</p>
                <p className="mt-1">System prompt: {llmTestResult.hasSystemPrompt ? 'Yes' : 'No'}</p>
                <pre className="mt-3 overflow-auto rounded-lg bg-black/20 p-3 text-xs text-slate-200">
                  {llmTestResult.responsePreview || '[empty response]'}
                </pre>
              </div>
            ) : null}
          </Panel>

          <Panel title="LLM Providers" description="Full CRUD for provider configuration.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Input placeholder="Provider key" value={llmProviderForm.providerKey} onChange={(event) => setLlmProviderForm((current) => ({ ...current, providerKey: event.target.value }))} />
              <Input placeholder="Name" value={llmProviderForm.name} onChange={(event) => setLlmProviderForm((current) => ({ ...current, name: event.target.value }))} />
              <Select value={llmProviderForm.status} onChange={(event) => setLlmProviderForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
              <Input placeholder="Base URL" value={llmProviderForm.baseUrl} onChange={(event) => setLlmProviderForm((current) => ({ ...current, baseUrl: event.target.value }))} />
              <Input placeholder="API key ref" value={llmProviderForm.apiKeyRef} onChange={(event) => setLlmProviderForm((current) => ({ ...current, apiKeyRef: event.target.value }))} />
              <Textarea placeholder="Config JSON" value={llmProviderForm.configJson} onChange={(event) => setLlmProviderForm((current) => ({ ...current, configJson: event.target.value }))} />
            </div>
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void submitLlmProvider()}>{llmProviderForm.id ? 'Update provider' : 'Add provider'}</PrimaryButton>
              <SecondaryButton onClick={() => setLlmProviderForm({ id: '', providerKey: '', name: '', status: 'ACTIVE', baseUrl: '', apiKeyRef: '', configJson: '' })}>Clear</SecondaryButton>
            </div>
            <div className="mt-6">
              <Table
                headers={['Provider', 'Key', 'Status', 'Actions']}
                rows={llmProviders.map((provider) => [
                  provider.name,
                  provider.providerKey,
                  <StatusPill key={`${provider.id}-status`}>{provider.status}</StatusPill>,
                  <div key={`${provider.id}-actions`} className="flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => setLlmProviderForm({ id: provider.id, providerKey: provider.providerKey, name: provider.name, status: provider.status, baseUrl: provider.baseUrl ?? '', apiKeyRef: provider.apiKeyRef ?? '', configJson: '' })}>Edit</SecondaryButton>
                    <SecondaryButton onClick={() => void apiFetch(`/api/llm-provider-configs/${provider.id}`, { method: 'DELETE' }).then(load)}>Delete</SecondaryButton>
                  </div>,
                ])}
              />
            </div>
          </Panel>

          <Panel title="LLM Models" description="Full CRUD for provider models.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select value={llmModelForm.providerConfigId} onChange={(event) => setLlmModelForm((current) => ({ ...current, providerConfigId: event.target.value }))}>
                <option value="">Select provider</option>
                {llmProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>{provider.name}</option>
                ))}
              </Select>
              <Input placeholder="Model key" value={llmModelForm.modelKey} onChange={(event) => setLlmModelForm((current) => ({ ...current, modelKey: event.target.value }))} />
              <Input placeholder="Display name" value={llmModelForm.displayName} onChange={(event) => setLlmModelForm((current) => ({ ...current, displayName: event.target.value }))} />
              <Select value={llmModelForm.status} onChange={(event) => setLlmModelForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
              <Input placeholder="Temperature" value={llmModelForm.temperature} onChange={(event) => setLlmModelForm((current) => ({ ...current, temperature: event.target.value }))} />
              <Input placeholder="Max tokens" value={llmModelForm.maxTokens} onChange={(event) => setLlmModelForm((current) => ({ ...current, maxTokens: event.target.value }))} />
              <Select value={llmModelForm.isDefault ? 'true' : 'false'} onChange={(event) => setLlmModelForm((current) => ({ ...current, isDefault: event.target.value === 'true' }))}>
                <option value="false">Not default</option>
                <option value="true">Default</option>
              </Select>
              <Textarea placeholder="Config JSON" value={llmModelForm.configJson} onChange={(event) => setLlmModelForm((current) => ({ ...current, configJson: event.target.value }))} />
            </div>
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void submitLlmModel()}>{llmModelForm.id ? 'Update model' : 'Add model'}</PrimaryButton>
              <SecondaryButton onClick={() => setLlmModelForm({ id: '', providerConfigId: '', modelKey: '', displayName: '', status: 'ACTIVE', isDefault: false, temperature: '', maxTokens: '', supportsTools: false, supportsStructuredOutput: false, configJson: '' })}>Clear</SecondaryButton>
            </div>
            <div className="mt-6">
              <Table
                headers={['Model', 'Provider', 'Status', 'Default', 'Actions']}
                rows={llmModels.map((model) => [
                  model.displayName,
                  model.providerConfig.name,
                  <StatusPill key={`${model.id}-status`}>{model.status}</StatusPill>,
                  model.isDefault ? 'Yes' : 'No',
                  <div key={`${model.id}-actions`} className="flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => void testLlmModel(model.id)}>
                      {isTestingLlm ? 'Testing...' : 'Test'}
                    </SecondaryButton>
                    <SecondaryButton onClick={() => setLlmModelForm({ id: model.id, providerConfigId: model.providerConfigId, modelKey: model.modelKey, displayName: model.displayName, status: model.status, isDefault: model.isDefault, temperature: model.temperature == null ? '' : String(model.temperature), maxTokens: model.maxTokens == null ? '' : String(model.maxTokens), supportsTools: model.supportsTools ?? false, supportsStructuredOutput: model.supportsStructuredOutput ?? false, configJson: '' })}>Edit</SecondaryButton>
                    <SecondaryButton onClick={() => void apiFetch(`/api/llm-model-configs/${model.id}`, { method: 'DELETE' }).then(load)}>Delete</SecondaryButton>
                  </div>,
                ])}
              />
            </div>
          </Panel>

          <Panel title="Vertical LLM Overrides" description="Full CRUD for vertical-specific LLM choices and prompts.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Select value={verticalLlmForm.verticalId} onChange={(event) => setVerticalLlmForm((current) => ({ ...current, verticalId: event.target.value }))}>
                <option value="">Select vertical</option>
                {verticals.map((vertical) => (
                  <option key={vertical.id} value={vertical.id}>{vertical.name}</option>
                ))}
              </Select>
              <Select value={verticalLlmForm.providerConfigId} onChange={(event) => setVerticalLlmForm((current) => ({ ...current, providerConfigId: event.target.value }))}>
                <option value="">Select provider</option>
                {llmProviders.map((provider) => (
                  <option key={provider.id} value={provider.id}>{provider.name}</option>
                ))}
              </Select>
              <Select value={verticalLlmForm.modelConfigId} onChange={(event) => setVerticalLlmForm((current) => ({ ...current, modelConfigId: event.target.value }))}>
                <option value="">Select model</option>
                {llmModels.map((model) => (
                  <option key={model.id} value={model.id}>{model.displayName}</option>
                ))}
              </Select>
              <Select value={verticalLlmForm.active ? 'true' : 'false'} onChange={(event) => setVerticalLlmForm((current) => ({ ...current, active: event.target.value === 'true' }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </Select>
              <Input placeholder="Purpose" value={verticalLlmForm.purpose} onChange={(event) => setVerticalLlmForm((current) => ({ ...current, purpose: event.target.value }))} />
              <Textarea placeholder="System prompt" value={verticalLlmForm.systemPrompt} onChange={(event) => setVerticalLlmForm((current) => ({ ...current, systemPrompt: event.target.value }))} />
              <Textarea placeholder="Config JSON" value={verticalLlmForm.configJson} onChange={(event) => setVerticalLlmForm((current) => ({ ...current, configJson: event.target.value }))} />
            </div>
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void submitVerticalLlm()}>{verticalLlmForm.id ? 'Update override' : 'Add override'}</PrimaryButton>
              <SecondaryButton onClick={() => setVerticalLlmForm({ id: '', verticalId: '', providerConfigId: '', modelConfigId: '', purpose: '', systemPrompt: '', active: true, configJson: '' })}>Clear</SecondaryButton>
            </div>
            <div className="mt-6">
              <Table
                headers={['Vertical', 'Provider', 'Model', 'Active', 'Actions']}
                rows={verticalLlmConfigs.map((config) => [
                  config.vertical.name,
                  config.providerConfig.name,
                  config.modelConfig.displayName,
                  <StatusPill key={`${config.id}-status`}>{config.active ? 'ACTIVE' : 'INACTIVE'}</StatusPill>,
                  <div key={`${config.id}-actions`} className="flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => void testVerticalLlm(config.id)}>
                      {isTestingLlm ? 'Testing...' : 'Test'}
                    </SecondaryButton>
                    <SecondaryButton onClick={() => setVerticalLlmForm({ id: config.id, verticalId: config.verticalId, providerConfigId: config.providerConfigId, modelConfigId: config.modelConfigId, purpose: config.purpose ?? '', systemPrompt: config.systemPrompt ?? '', active: config.active, configJson: '' })}>Edit</SecondaryButton>
                    <SecondaryButton onClick={() => void apiFetch(`/api/vertical-llm-configs/${config.id}`, { method: 'DELETE' }).then(load)}>Delete</SecondaryButton>
                  </div>,
                ])}
              />
            </div>
          </Panel>
        </>
      ) : null}

      {!isLoading && section === 'email' ? (
        <>
          <Panel title="Email Providers" description="Full CRUD for email provider configuration.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Input placeholder="Provider key" value={emailProviderForm.providerKey} onChange={(event) => setEmailProviderForm((current) => ({ ...current, providerKey: event.target.value }))} />
              <Input placeholder="Name" value={emailProviderForm.name} onChange={(event) => setEmailProviderForm((current) => ({ ...current, name: event.target.value }))} />
              <Select value={emailProviderForm.status} onChange={(event) => setEmailProviderForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
              <Input placeholder="Host" value={emailProviderForm.host} onChange={(event) => setEmailProviderForm((current) => ({ ...current, host: event.target.value }))} />
              <Input placeholder="Port" value={emailProviderForm.port} onChange={(event) => setEmailProviderForm((current) => ({ ...current, port: event.target.value }))} />
              <Input placeholder="Username ref" value={emailProviderForm.usernameRef} onChange={(event) => setEmailProviderForm((current) => ({ ...current, usernameRef: event.target.value }))} />
              <Input placeholder="Password ref" value={emailProviderForm.passwordRef} onChange={(event) => setEmailProviderForm((current) => ({ ...current, passwordRef: event.target.value }))} />
              <Input placeholder="From email" value={emailProviderForm.fromEmail} onChange={(event) => setEmailProviderForm((current) => ({ ...current, fromEmail: event.target.value }))} />
              <Input placeholder="From name" value={emailProviderForm.fromName} onChange={(event) => setEmailProviderForm((current) => ({ ...current, fromName: event.target.value }))} />
              <Textarea placeholder="Config JSON" value={emailProviderForm.configJson} onChange={(event) => setEmailProviderForm((current) => ({ ...current, configJson: event.target.value }))} />
            </div>
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void submitEmailProvider()}>{emailProviderForm.id ? 'Update provider' : 'Add provider'}</PrimaryButton>
              <SecondaryButton onClick={() => setEmailProviderForm({ id: '', providerKey: '', name: '', status: 'ACTIVE', host: '', port: '', usernameRef: '', passwordRef: '', fromEmail: '', fromName: '', configJson: '' })}>Clear</SecondaryButton>
            </div>
            <div className="mt-6">
              <Table
                headers={['Provider', 'Host', 'Status', 'Actions']}
                rows={emailProviders.map((provider) => [
                  provider.name,
                  provider.host ?? '—',
                  <StatusPill key={`${provider.id}-status`}>{provider.status}</StatusPill>,
                  <div key={`${provider.id}-actions`} className="flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => setEmailProviderForm({ id: provider.id, providerKey: provider.providerKey, name: provider.name, status: provider.status, host: provider.host ?? '', port: provider.port == null ? '' : String(provider.port), usernameRef: '', passwordRef: '', fromEmail: provider.fromEmail ?? '', fromName: provider.fromName ?? '', configJson: '' })}>Edit</SecondaryButton>
                    <SecondaryButton onClick={() => void apiFetch(`/api/email-provider-configs/${provider.id}`, { method: 'DELETE' }).then(load)}>Delete</SecondaryButton>
                  </div>,
                ])}
              />
            </div>
          </Panel>

          <Panel title="Email Templates" description="Full CRUD for email templates.">
            <div className="grid gap-3 md:grid-cols-2">
              <Input placeholder="Key" value={emailTemplateForm.key} onChange={(event) => setEmailTemplateForm((current) => ({ ...current, key: event.target.value }))} />
              <Input placeholder="Name" value={emailTemplateForm.name} onChange={(event) => setEmailTemplateForm((current) => ({ ...current, name: event.target.value }))} />
              <Input placeholder="Type" value={emailTemplateForm.type} onChange={(event) => setEmailTemplateForm((current) => ({ ...current, type: event.target.value }))} />
              <Select value={emailTemplateForm.status} onChange={(event) => setEmailTemplateForm((current) => ({ ...current, status: event.target.value }))}>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </Select>
              <Textarea placeholder="Subject template" value={emailTemplateForm.subjectTemplate} onChange={(event) => setEmailTemplateForm((current) => ({ ...current, subjectTemplate: event.target.value }))} />
              <Textarea placeholder="Body template" value={emailTemplateForm.bodyTemplate} onChange={(event) => setEmailTemplateForm((current) => ({ ...current, bodyTemplate: event.target.value }))} />
            </div>
            <div className="mt-4 flex gap-3">
              <PrimaryButton onClick={() => void submitEmailTemplate()}>{emailTemplateForm.id ? 'Update template' : 'Add template'}</PrimaryButton>
              <SecondaryButton onClick={() => setEmailTemplateForm({ id: '', key: '', name: '', subjectTemplate: '', bodyTemplate: '', type: '', status: 'ACTIVE' })}>Clear</SecondaryButton>
            </div>
            <div className="mt-6">
              <Table
                headers={['Template', 'Key', 'Type', 'Status', 'Actions']}
                rows={emailTemplates.map((template) => [
                  template.name,
                  template.key,
                  template.type ?? '—',
                  <StatusPill key={`${template.id}-status`}>{template.status}</StatusPill>,
                  <div key={`${template.id}-actions`} className="flex flex-wrap gap-2">
                    <SecondaryButton onClick={() => setEmailTemplateForm({ id: template.id, key: template.key, name: template.name, subjectTemplate: template.subjectTemplate, bodyTemplate: template.bodyTemplate, type: template.type ?? '', status: template.status })}>Edit</SecondaryButton>
                    <SecondaryButton onClick={() => void apiFetch(`/api/email-templates/${template.id}`, { method: 'DELETE' }).then(load)}>Delete</SecondaryButton>
                  </div>,
                ])}
              />
            </div>
          </Panel>
        </>
      ) : null}
    </SurfaceShell>
  )
}
