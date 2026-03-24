import type {
  ActiveDropletCommand,
  ResolvedBirdviewCommand,
  ValidatedBirdviewCommand,
} from './models'

export function resolveBirdviewCommand(
  parsed: ValidatedBirdviewCommand,
  activeDroplets: ActiveDropletCommand[]
): ResolvedBirdviewCommand {
  const direct = activeDroplets.find((droplet) => droplet.command === parsed.raw)
  if (direct) {
    return {
      kind: 'active-droplet',
      matchedBy: 'command',
      droplet: direct,
    }
  }

  const alias = activeDroplets.find((droplet) => droplet.aliases.includes(parsed.raw))
  if (alias) {
    return {
      kind: 'active-droplet',
      matchedBy: 'alias',
      droplet: alias,
    }
  }

  if (parsed.kind === 'droplet-command') {
    const directByCommand = activeDroplets.find(
      (droplet) => droplet.command === parsed.command
    )
    if (directByCommand) {
      return {
        kind: 'active-droplet',
        matchedBy: 'command',
        droplet: directByCommand,
      }
    }

    const aliasByCommand = activeDroplets.find((droplet) =>
      droplet.aliases.includes(parsed.command)
    )
    if (aliasByCommand) {
      return {
        kind: 'active-droplet',
        matchedBy: 'alias',
        droplet: aliasByCommand,
      }
    }
  }

  switch (parsed.kind) {
    case 'help':
      return { kind: 'help' }
    case 'theme-list':
      return { kind: 'theme-list' }
    case 'theme-open':
      return { kind: 'theme-open' }
    case 'droplet-list':
      return { kind: 'droplet-list' }
    case 'droplet-open':
      return { kind: 'droplet-open' }
    case 'list-entity':
      return { kind: 'list-entity' }
    case 'show-entity':
      return { kind: 'show-entity' }
    case 'filter-entity':
      return { kind: 'filter-entity' }
    case 'group-entity':
      return { kind: 'group-entity' }
    case 'sort-entity':
      return { kind: 'sort-entity' }
    case 'droplet-command':
      return {
        kind: 'error',
        message: 'No active droplet matches that command for this tenant.',
      }
  }
}
