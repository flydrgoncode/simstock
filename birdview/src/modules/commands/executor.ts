import { prisma } from '../../lib/db/prisma'
import type { DropletEntity, DropletFilterOperator } from '../../lib/droplets/entities'
import { AppError } from '../../server/http'
import { executeExploreRequest, previewDropletDefinition } from '../droplets/explore'
import { listActiveTenantDroplets } from '../droplets/service'
import { runShadowSkillDefinition } from '../droplets/studio'
import type {
  ActiveDropletCommand,
  BirdviewCommandExecutor,
  BirdviewCommandResult,
  CommandTheme,
  ParsedBirdviewCommand,
  ResolvedBirdviewCommand,
  ValidatedBirdviewCommand,
} from './models'
import { parseBirdviewCommand } from './parser'
import { resolveBirdviewCommand } from './resolver'
import { validateBirdviewCommand } from './validator'

const availableThemes: CommandTheme[] = ['system', 'light', 'dark']

type CommandContext = {
  tenantId: string
  parsed: ParsedBirdviewCommand
  activeDroplets: ActiveDropletCommand[]
}

function okResult(
  parsed: ParsedBirdviewCommand,
  resolution: ResolvedBirdviewCommand,
  summaryText: string,
  preview: BirdviewCommandResult['preview'] = null,
  warnings: string[] = []
): BirdviewCommandResult {
  return {
    status: 'ok',
    summaryText,
    preview,
    parsed,
    resolution,
    warnings,
    errors: [],
  }
}

function errorResult(
  parsed: ParsedBirdviewCommand,
  message: string
): BirdviewCommandResult {
  return {
    status: 'error',
    summaryText: message,
    preview: null,
    parsed,
    resolution: { kind: 'error', message },
    warnings: [],
    errors: [message],
  }
}

function coerceFilterValue(value: string) {
  if (value === 'true') return true
  if (value === 'false') return false
  const asNumber = Number(value)
  if (!Number.isNaN(asNumber) && value.trim() !== '') return asNumber
  return value
}

async function getTenantTheme(tenantId: string) {
  const settings = await prisma.tenantSettings.findUnique({
    where: { tenantId },
  })
  const config = (settings?.configJson ?? {}) as { theme?: string }
  return typeof config.theme === 'string' ? config.theme : 'system'
}

async function executeSystemCommand(
  context: CommandContext,
  parsed: ValidatedBirdviewCommand,
  resolution: ResolvedBirdviewCommand
) {
  if (resolution.kind === 'help') {
    const lines = [
      'System commands:',
      '/help',
      '/theme list',
      '/theme open <theme>',
      '/droplet list',
      '/droplet open <name>',
      'Exploration commands:',
      '/list <entity>',
      '/show <entity>',
      '/filter <entity> --field <field> --op <operator> --value <value>',
      '/group <entity> --by <field>',
      '/sort <entity> --by <field> --dir <asc|desc>',
      'Active droplet commands:',
      ...context.activeDroplets.map(
        (droplet) => `${droplet.command} — ${droplet.helpText ?? droplet.name}`
      ),
    ]
    return okResult(parsed, resolution, lines.join('\n'))
  }

  if (resolution.kind === 'theme-list') {
    const activeTheme = await getTenantTheme(context.tenantId)
    return okResult(
      parsed,
      resolution,
      `Available themes: ${availableThemes.join(', ')}. Active theme: ${activeTheme}.`
    )
  }

  if (resolution.kind === 'theme-open' && parsed.kind === 'theme-open') {
    return okResult(
      parsed,
      resolution,
      `Theme ${parsed.theme} is available for this tenant workspace.`
    )
  }

  if (resolution.kind === 'droplet-list') {
    return okResult(
      parsed,
      resolution,
      context.activeDroplets.length > 0
        ? context.activeDroplets
            .map((droplet) => `${droplet.command} — ${droplet.name}`)
            .join('\n')
        : 'No active droplets for this tenant.'
    )
  }

  if (resolution.kind === 'droplet-open' && parsed.kind === 'droplet-open') {
    const identifier = parsed.nameOrId.toLowerCase()
    const droplet = context.activeDroplets.find(
      (item) =>
        item.id === parsed.nameOrId || item.name.toLowerCase() === identifier
    )
    if (!droplet) {
      return errorResult(parsed, `No active droplet found for "${parsed.nameOrId}".`)
    }
    const fallbackPreview = await previewDropletDefinition(
      context.tenantId,
      droplet.dropletDefinitionJson as never
    )
    const preview = droplet.shadowSkillDefinitionJson
      ? await runShadowSkillDefinition(
          context.tenantId,
          droplet.shadowSkillDefinitionJson as never
        ).catch(() => fallbackPreview)
      : fallbackPreview
    return okResult(parsed, resolution, `Opened ${droplet.name}.`, preview)
  }

  throw new AppError(400, 'Unsupported system command.')
}

async function executeExploreCommand(
  context: CommandContext,
  parsed: ValidatedBirdviewCommand,
  resolution: ResolvedBirdviewCommand
) {
  const base = {
    limit: 50,
  } as const

  if (resolution.kind === 'list-entity' && parsed.kind === 'list-entity') {
    const preview = await executeExploreRequest(context.tenantId, {
      ...base,
      entity: parsed.entity as DropletEntity,
    })
    return okResult(parsed, resolution, `Listed ${parsed.entity}.`, preview)
  }

  if (resolution.kind === 'show-entity' && parsed.kind === 'show-entity') {
    const preview = await executeExploreRequest(context.tenantId, {
      ...base,
      entity: parsed.entity as DropletEntity,
    })
    return okResult(parsed, resolution, `Showing ${parsed.entity}.`, preview)
  }

  if (resolution.kind === 'filter-entity' && parsed.kind === 'filter-entity') {
    const preview = await executeExploreRequest(context.tenantId, {
      ...base,
      entity: parsed.entity as DropletEntity,
      filters: [
        {
          field: parsed.field,
          operator: parsed.operator as DropletFilterOperator,
          value: coerceFilterValue(parsed.value),
        },
      ],
    })
    return okResult(
      parsed,
      resolution,
      `Filtered ${parsed.entity} where ${parsed.field} ${parsed.operator} ${parsed.value}.`,
      preview
    )
  }

  if (resolution.kind === 'group-entity' && parsed.kind === 'group-entity') {
    const preview = await executeExploreRequest(context.tenantId, {
      ...base,
      entity: parsed.entity as DropletEntity,
      grouping: { field: parsed.by },
    })
    return okResult(
      parsed,
      resolution,
      `Grouped ${parsed.entity} by ${parsed.by}.`,
      preview
    )
  }

  if (resolution.kind === 'sort-entity' && parsed.kind === 'sort-entity') {
    const preview = await executeExploreRequest(context.tenantId, {
      ...base,
      entity: parsed.entity as DropletEntity,
      sort: { field: parsed.by, direction: parsed.direction as 'asc' | 'desc' },
    })
    return okResult(
      parsed,
      resolution,
      `Sorted ${parsed.entity} by ${parsed.by} ${parsed.direction}.`,
      preview
    )
  }

  throw new AppError(400, 'Unsupported exploration command.')
}

export const executeResolvedBirdviewCommand: BirdviewCommandExecutor = async ({
  tenantId,
  parsed,
  resolution,
  activeDroplets,
}) => {
  const context: CommandContext = { tenantId, parsed, activeDroplets }

  if (resolution.kind === 'active-droplet') {
    const droplet = resolution.droplet
    const fallbackPreview = await previewDropletDefinition(
      tenantId,
      droplet.dropletDefinitionJson as never
    )
    const preview = droplet.shadowSkillDefinitionJson
      ? await runShadowSkillDefinition(
          tenantId,
          droplet.shadowSkillDefinitionJson as never
        ).catch(() => fallbackPreview)
      : fallbackPreview
    return okResult(
      parsed,
      resolution,
      `${droplet.name} opened from ${resolution.matchedBy === 'alias' ? 'alias' : 'command'} ${droplet.command}.`,
      preview
    )
  }

  if (
    resolution.kind === 'help' ||
    resolution.kind === 'theme-list' ||
    resolution.kind === 'theme-open' ||
    resolution.kind === 'droplet-list' ||
    resolution.kind === 'droplet-open'
  ) {
    return executeSystemCommand(context, parsed, resolution)
  }

  if (
    resolution.kind === 'list-entity' ||
    resolution.kind === 'show-entity' ||
    resolution.kind === 'filter-entity' ||
    resolution.kind === 'group-entity' ||
    resolution.kind === 'sort-entity'
  ) {
    return executeExploreCommand(context, parsed, resolution)
  }

  if (resolution.kind === 'error') {
    return errorResult(parsed, resolution.message)
  }

  return errorResult(parsed, 'Unsupported command resolution.')
}

export async function parseBirdviewCommandForTenant(
  tenantId: string,
  commandText: string
) {
  const parsed = parseBirdviewCommand(commandText)
  const activeDroplets = await listActiveTenantDroplets(tenantId)
  return { parsed, activeDroplets }
}

export async function resolveBirdviewCommandForTenant(
  tenantId: string,
  commandText: string
) {
  const { parsed, activeDroplets } = await parseBirdviewCommandForTenant(
    tenantId,
    commandText
  )
  const validated = validateBirdviewCommand(parsed)
  const resolution = resolveBirdviewCommand(validated, activeDroplets)
  return { parsed, validated, resolution, activeDroplets }
}

export async function executeBirdviewCommand(tenantId: string, commandText: string) {
  const { validated, resolution, activeDroplets } =
    await resolveBirdviewCommandForTenant(tenantId, commandText)

  return executeResolvedBirdviewCommand({
    tenantId,
    parsed: validated,
    resolution,
    activeDroplets,
  })
}
