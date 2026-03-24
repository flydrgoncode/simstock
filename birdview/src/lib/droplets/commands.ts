import type { ReadonlyTableDropletDefinition } from './schema'
import { dropletEntities } from './entities'

type CommandFilter = {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'in'
  value: string | number | boolean
}

export type ParsedDropletCommand =
  | { kind: 'help' }
  | { kind: 'droplet_list' }
  | { kind: 'open_droplet'; identifier: string }
  | {
      kind: 'explore'
      entity: (typeof dropletEntities)[number]
      mode: 'list' | 'show' | 'inspect'
      filters?: CommandFilter[]
      sort?: NonNullable<ReadonlyTableDropletDefinition['defaultSort']>
      grouping?: NonNullable<ReadonlyTableDropletDefinition['grouping']>
    }

function stripQuotes(value: string) {
  return value.replace(/^["']|["']$/g, '')
}

function extractFlag(input: string, flag: string) {
  const pattern = new RegExp(`${flag}\\s+("[^"]+"|'[^']+'|\\S+)`)
  const match = input.match(pattern)
  return match ? stripQuotes(match[1] ?? '') : null
}

export function parseDropletCommand(input: string): ParsedDropletCommand {
  const trimmed = input.trim()

  if (trimmed === '/help') {
    return { kind: 'help' }
  }

  if (trimmed === '/droplet list') {
    return { kind: 'droplet_list' }
  }

  if (trimmed.startsWith('/open droplet ')) {
    return {
      kind: 'open_droplet',
      identifier: stripQuotes(trimmed.replace('/open droplet ', '').trim()),
    }
  }

  const entity = dropletEntities.find(
    (candidate) =>
      trimmed.startsWith(`/list ${candidate}`) ||
      trimmed.startsWith(`/show ${candidate}`) ||
      trimmed.startsWith(`/inspect ${candidate}`) ||
      trimmed.startsWith(`/filter ${candidate}`) ||
      trimmed.startsWith(`/group ${candidate}`) ||
      trimmed.startsWith(`/sort ${candidate}`)
  )

  if (!entity) {
    throw new Error('Unsupported command. Use /help to see available commands.')
  }

  if (
    trimmed.startsWith(`/list ${entity}`) ||
    trimmed.startsWith(`/show ${entity}`) ||
    trimmed.startsWith(`/inspect ${entity}`)
  ) {
    const mode = trimmed.startsWith('/list')
      ? 'list'
      : trimmed.startsWith('/show')
        ? 'show'
        : 'inspect'

    return { kind: 'explore', entity, mode }
  }

  if (trimmed.startsWith(`/filter ${entity}`)) {
    const field = extractFlag(trimmed, '--field')
    const operator = extractFlag(trimmed, '--op')
    const value = extractFlag(trimmed, '--value')

    if (!field || !operator || value == null) {
      throw new Error(
        'Expected /filter <entity> --field <field> --op <operator> --value <value>.'
      )
    }

    const numericValue = Number(value)
    const normalizedValue =
      value === 'true'
        ? true
        : value === 'false'
          ? false
          : Number.isFinite(numericValue) && value.trim() !== ''
            ? numericValue
            : value

    return {
      kind: 'explore',
      entity,
      mode: 'inspect',
      filters: [{ field, operator: operator as never, value: normalizedValue }],
    }
  }

  if (trimmed.startsWith(`/group ${entity}`)) {
    const groupField = extractFlag(trimmed, '--by')
    if (!groupField) {
      throw new Error('Expected /group <entity> --by <field>.')
    }

    return {
      kind: 'explore',
      entity,
      mode: 'inspect',
      grouping: { field: groupField },
    }
  }

  const sortField = extractFlag(trimmed, '--by')
  const sortDirection = extractFlag(trimmed, '--dir') ?? 'asc'

  if (!sortField) {
    throw new Error('Expected /sort <entity> --by <field> --dir <asc|desc>.')
  }

  return {
    kind: 'explore',
    entity,
    mode: 'inspect',
    sort: {
      field: sortField,
      direction: sortDirection === 'desc' ? 'desc' : 'asc',
    },
  }
}

export const dropletCommandHelp = [
  '/list <entity>',
  '/show <entity>',
  '/inspect <entity>',
  '/filter <entity> --field <field> --op <operator> --value <value>',
  '/group <entity> --by <field>',
  '/sort <entity> --by <field> --dir <asc|desc>',
  '/open droplet <name-or-id>',
  '/droplet list',
  '/help',
]
