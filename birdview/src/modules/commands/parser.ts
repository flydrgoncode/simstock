import type { ParsedBirdviewCommand } from './models'

function tokenizeCommand(input: string) {
  return input.match(/"[^"]+"|'[^']+'|\S+/g) ?? []
}

function normalizeToken(token: string) {
  return token.replace(/^["']|["']$/g, '')
}

function parseFlag(tokens: string[], flag: string) {
  const index = tokens.findIndex((token) => token === flag)
  if (index === -1) return null
  return normalizeToken(tokens[index + 1] ?? '')
}

export function parseBirdviewCommand(rawInput: string): ParsedBirdviewCommand {
  const raw = rawInput.trim()
  const tokens = tokenizeCommand(raw)
  const [commandWord = null, ...rest] = tokens

  if (!commandWord || !commandWord.startsWith('/')) {
    return { kind: 'unknown', raw, commandWord, args: rest.map(normalizeToken) }
  }

  if (commandWord === '/help' && rest.length === 0) {
    return { kind: 'help', raw }
  }

  if (commandWord === '/theme' && rest[0] === 'list') {
    return { kind: 'theme-list', raw }
  }

  if (commandWord === '/theme' && rest[0] === 'open') {
    return {
      kind: 'theme-open',
      raw,
      theme: normalizeToken(rest.slice(1).join(' ')),
    }
  }

  if (commandWord === '/droplet' && rest[0] === 'list') {
    return { kind: 'droplet-list', raw }
  }

  if (commandWord === '/droplet' && rest[0] === 'open') {
    return {
      kind: 'droplet-open',
      raw,
      nameOrId: normalizeToken(rest.slice(1).join(' ')),
    }
  }

  if (commandWord === '/list' && rest[0]) {
    return { kind: 'list-entity', raw, entity: normalizeToken(rest[0]) }
  }

  if (commandWord === '/show' && rest[0]) {
    return { kind: 'show-entity', raw, entity: normalizeToken(rest[0]) }
  }

  if (commandWord === '/filter' && rest[0]) {
    return {
      kind: 'filter-entity',
      raw,
      entity: normalizeToken(rest[0]),
      field: parseFlag(rest, '--field') ?? '',
      operator: parseFlag(rest, '--op') ?? '',
      value: parseFlag(rest, '--value') ?? '',
    }
  }

  if (commandWord === '/group' && rest[0]) {
    return {
      kind: 'group-entity',
      raw,
      entity: normalizeToken(rest[0]),
      by: parseFlag(rest, '--by') ?? '',
    }
  }

  if (commandWord === '/sort' && rest[0]) {
    return {
      kind: 'sort-entity',
      raw,
      entity: normalizeToken(rest[0]),
      by: parseFlag(rest, '--by') ?? '',
      direction: parseFlag(rest, '--dir') ?? '',
    }
  }

  return {
    kind: 'droplet-command',
    raw,
    command: commandWord,
    args: rest.map(normalizeToken),
  }
}
