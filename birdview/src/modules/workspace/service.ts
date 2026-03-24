import { prisma } from '../../lib/db/prisma'
import { ensureExists } from '../../server/utils'
import { listActiveTenantDroplets } from '../droplets/service'
import { listPromptTemplates } from '../droplets/studio'
import {
  workspaceConfigSchema,
  type WorkspaceQuickQuestion,
  type WorkspaceTheme,
} from './schemas'

const defaultWorkspaceThemes: WorkspaceTheme[] = [
  {
    key: 'overview',
    label: 'Overview',
    description: 'Cross-functional starting point for the company workspace.',
    command: '/revenue-variance',
    quickQuestions: [
      { label: 'How is revenue versus target?', command: '/revenue-variance' },
      { label: 'Open the revenue explorer', command: '/revenue' },
      { label: 'Show the active droplets', command: '/droplet list' },
    ],
  },
  {
    key: 'revenue',
    label: 'Revenue',
    description: 'Revenue performance and comparison over time.',
    command: '/revenue',
    quickQuestions: [
      { label: 'Show revenue', command: '/revenue' },
      { label: 'Show revenue variance', command: '/revenue-variance' },
      { label: 'List revenue snapshots', command: '/list revenueSnapshots' },
    ],
  },
  {
    key: 'targets',
    label: 'Targets',
    description: 'Planning and target-setting workflows.',
    command: '/sales-targets',
    quickQuestions: [
      { label: 'Open sales targets', command: '/sales-targets' },
      { label: 'Compare revenue to target', command: '/revenue-variance' },
      { label: 'List revenue snapshots', command: '/list revenueSnapshots' },
    ],
  },
  {
    key: 'customers',
    label: 'Customers',
    description: 'Customer portfolio and segment exploration.',
    command: '/customers',
    quickQuestions: [
      { label: 'Show customers', command: '/customers' },
      { label: 'List customers', command: '/list customers' },
      { label: 'Group customers by geography', command: '/group customers --by geography' },
    ],
  },
  {
    key: 'opportunities',
    label: 'Opportunities',
    description: 'Pipeline and opportunity movement.',
    command: '/pipeline',
    quickQuestions: [
      { label: 'Open pipeline', command: '/pipeline' },
      { label: 'Show opportunities', command: '/show opportunities' },
      { label: 'Filter proposal stage', command: '/filter opportunities --field stageName --op eq --value Proposal' },
    ],
  },
  {
    key: 'orders',
    label: 'Orders',
    description: 'Orders and commercial fulfilment signals.',
    command: '/orders',
    quickQuestions: [
      { label: 'Open orders', command: '/orders' },
      { label: 'List orders', command: '/list orders' },
      { label: 'Sort orders by amount', command: '/sort orders --by amount --dir desc' },
    ],
  },
  {
    key: 'products',
    label: 'Products',
    description: 'Product and offer-level exploration seams for the workspace.',
    command: '/droplet list',
    quickQuestions: [
      { label: 'Show available droplets', command: '/droplet list' },
      { label: 'Open customers explorer', command: '/droplet open Customers Explorer' },
      { label: 'Open orders explorer', command: '/droplet open Orders Explorer' },
    ],
  },
  {
    key: 'inventory',
    label: 'Inventory',
    description: 'Inventory and warehouse exploration seam for this vertical.',
    command: '/droplet list',
    quickQuestions: [
      { label: 'Show available droplets', command: '/droplet list' },
      { label: 'Open orders explorer', command: '/droplet open Orders Explorer' },
      { label: 'Show help', command: '/help' },
    ],
  },
  {
    key: 'marketing',
    label: 'Marketing',
    description: 'Marketing funnel and campaign-oriented exploration.',
    command: '/marketing-funnel',
    quickQuestions: [
      { label: 'Open marketing funnel', command: '/marketing-funnel' },
      { label: 'Show help', command: '/help' },
      { label: 'Show active droplets', command: '/droplet list' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    description: 'Finance-adjacent performance review through current droplets.',
    command: '/revenue-variance',
    quickQuestions: [
      { label: 'Show revenue variance', command: '/revenue-variance' },
      { label: 'Open revenue explorer', command: '/revenue' },
      { label: 'Show help', command: '/help' },
    ],
  },
  {
    key: 'risks-decisions',
    label: 'Risks & Decisions',
    description: 'Decision support and exception review seam.',
    command: '/help',
    quickQuestions: [
      { label: 'Show help', command: '/help' },
      { label: 'Open pipeline', command: '/pipeline' },
      { label: 'Open revenue variance', command: '/revenue-variance' },
    ],
  },
]

function mergeThemeQuickQuestions(
  themes: WorkspaceTheme[],
  promptTemplates: Awaited<ReturnType<typeof listPromptTemplates>>
) {
  return themes.map((theme) => {
    if (theme.quickQuestions.length > 0) {
      return theme
    }

    const promptQuestions: WorkspaceQuickQuestion[] = promptTemplates
      .filter((template) => template.key.startsWith(`workspace-${theme.key}-`))
      .slice(0, 3)
      .map((template) => ({
        label: template.name,
        command: template.templateText.trim(),
      }))

    return {
      ...theme,
      quickQuestions: promptQuestions,
    }
  })
}

function parseWorkspaceThemes(
  commandPackJson: unknown,
  promptTemplates: Awaited<ReturnType<typeof listPromptTemplates>>
) {
  const source =
    commandPackJson && typeof commandPackJson === 'object' && !Array.isArray(commandPackJson)
      ? (commandPackJson as Record<string, unknown>)
      : {}
  const parsed = workspaceConfigSchema.safeParse(source.workspace)
  const themes =
    parsed.success && parsed.data.themes.length > 0
      ? parsed.data.themes
      : defaultWorkspaceThemes

  return mergeThemeQuickQuestions(themes, promptTemplates)
}

export async function getWorkspaceContext(companyId: string) {
  const company = ensureExists(
    await prisma.company.findUnique({
      where: { id: companyId },
      include: {
        vertical: true,
        tenant: true,
      },
    }),
    'Company not found'
  )

  const tenantId = ensureExists(company.tenantId, 'Workspace requires a company linked to a tenant.')

  const [verticalDefinition, activeDroplets, promptTemplates] = await Promise.all([
    prisma.verticalDefinition.findFirst({
      where: {
        verticalId: company.verticalId,
        status: 'PUBLISHED',
      },
      orderBy: [{ version: 'desc' }, { createdAt: 'desc' }],
    }),
    listActiveTenantDroplets(tenantId),
    listPromptTemplates(),
  ])

  const scopedPromptTemplates = promptTemplates.filter(
    (template) => !template.verticalId || template.verticalId === company.verticalId
  )

  const themes = parseWorkspaceThemes(verticalDefinition?.commandPackJson, scopedPromptTemplates)

  return {
    company: {
      id: company.id,
      tenantId,
      name: company.name,
      slug: company.slug,
      status: company.status,
      vertical: {
        id: company.vertical.id,
        key: company.vertical.key,
        name: company.vertical.name,
      },
    },
    verticalDefinition: verticalDefinition
      ? {
          id: verticalDefinition.id,
          version: verticalDefinition.version,
          status: verticalDefinition.status,
        }
      : null,
    themes,
    activeDroplets: activeDroplets.map((droplet) => ({
      id: droplet.id,
      name: droplet.name,
      command: droplet.command,
      aliases: droplet.aliases,
      helpText: droplet.helpText,
      placement: droplet.placement,
      type: droplet.type,
    })),
    promptTemplates: scopedPromptTemplates.map((template) => ({
      id: template.id,
      key: template.key,
      name: template.name,
      purpose: template.purpose,
    })),
  }
}
