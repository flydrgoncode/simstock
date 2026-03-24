import { dropletEntities, type DropletFilterOperator } from '../../lib/droplets/entities'
import { AppError } from '../../server/http'
import type {
  CommandTheme,
  ParsedBirdviewCommand,
  ValidatedBirdviewCommand,
} from './models'

const allowedThemes: CommandTheme[] = ['system', 'light', 'dark']
const filterOperators: DropletFilterOperator[] = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'in',
]

function assertEntity(entity: string) {
  if (!dropletEntities.includes(entity as (typeof dropletEntities)[number])) {
    throw new AppError(
      400,
      `Unsupported entity "${entity}". Use /help to see supported commands.`
    )
  }
}

export function validateBirdviewCommand(
  parsed: ParsedBirdviewCommand
): ValidatedBirdviewCommand {
  switch (parsed.kind) {
    case 'help':
    case 'theme-list':
    case 'droplet-list':
      return parsed
    case 'theme-open':
      if (!allowedThemes.includes(parsed.theme as CommandTheme)) {
        throw new AppError(
          400,
          `Unsupported theme "${parsed.theme}". Available themes: ${allowedThemes.join(', ')}.`
        )
      }
      return parsed
    case 'droplet-open':
      if (!parsed.nameOrId) {
        throw new AppError(400, 'Droplet open requires a droplet name or id.')
      }
      return parsed
    case 'list-entity':
    case 'show-entity':
      assertEntity(parsed.entity)
      return parsed
    case 'filter-entity':
      assertEntity(parsed.entity)
      if (!parsed.field || !parsed.operator || !parsed.value) {
        throw new AppError(
          400,
          'Filter requires --field, --op, and --value.'
        )
      }
      if (!filterOperators.includes(parsed.operator as DropletFilterOperator)) {
        throw new AppError(
          400,
          `Unsupported filter operator "${parsed.operator}".`
        )
      }
      return parsed
    case 'group-entity':
      assertEntity(parsed.entity)
      if (!parsed.by) {
        throw new AppError(400, 'Group requires --by <field>.')
      }
      return parsed
    case 'sort-entity':
      assertEntity(parsed.entity)
      if (!parsed.by) {
        throw new AppError(400, 'Sort requires --by <field>.')
      }
      if (!['asc', 'desc'].includes(parsed.direction)) {
        throw new AppError(400, 'Sort requires --dir <asc|desc>.')
      }
      return parsed
    case 'droplet-command':
      return parsed
    case 'unknown':
      throw new AppError(400, 'Unknown command. Use /help to see available commands.')
  }
}
