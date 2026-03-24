export type CommandPreview =
  | {
      entity: string
      title: string
      visibleFields: string[]
      labels: Record<string, string>
      rows: Array<Record<string, unknown>>
      grouping?: Array<{ group: string; rows: Array<Record<string, unknown>> }> | undefined
      summary?: Record<string, number> | undefined
      totalRows?: number | undefined
    }
  | {
      success: boolean
      summaryText: string
      blocks: Array<Record<string, unknown>>
      warnings?: string[] | undefined
      errors?: string[] | undefined
      debug?: Record<string, unknown> | undefined
    }

export type CommandTheme = 'system' | 'light' | 'dark'

export type ParsedBirdviewCommand =
  | { kind: 'help'; raw: string }
  | { kind: 'theme-list'; raw: string }
  | { kind: 'theme-open'; raw: string; theme: string }
  | { kind: 'droplet-list'; raw: string }
  | { kind: 'droplet-open'; raw: string; nameOrId: string }
  | { kind: 'list-entity'; raw: string; entity: string }
  | { kind: 'show-entity'; raw: string; entity: string }
  | {
      kind: 'filter-entity'
      raw: string
      entity: string
      field: string
      operator: string
      value: string
    }
  | { kind: 'group-entity'; raw: string; entity: string; by: string }
  | {
      kind: 'sort-entity'
      raw: string
      entity: string
      by: string
      direction: string
    }
  | { kind: 'droplet-command'; raw: string; command: string; args: string[] }
  | { kind: 'unknown'; raw: string; commandWord: string | null; args: string[] }

export type ValidatedBirdviewCommand =
  | Extract<
      ParsedBirdviewCommand,
      | { kind: 'help' }
      | { kind: 'theme-list' }
      | { kind: 'theme-open' }
      | { kind: 'droplet-list' }
      | { kind: 'droplet-open' }
      | { kind: 'list-entity' }
      | { kind: 'show-entity' }
      | { kind: 'filter-entity' }
      | { kind: 'group-entity' }
      | { kind: 'sort-entity' }
      | { kind: 'droplet-command' }
    >

export type ActiveDropletCommand = {
  id: string
  tenantId: string
  verticalDropletId: string
  name: string
  command: string
  aliases: string[]
  helpText: string | null
  type: string
  dropletDefinitionJson: unknown
  shadowSkillDefinitionJson?: unknown
  status: string
  active: boolean
  placement: string | null
  configOverrideJson?: unknown
}

export type ResolvedBirdviewCommand =
  | { kind: 'active-droplet'; matchedBy: 'command'; droplet: ActiveDropletCommand }
  | { kind: 'active-droplet'; matchedBy: 'alias'; droplet: ActiveDropletCommand }
  | {
      kind:
        | 'help'
        | 'theme-list'
        | 'theme-open'
        | 'droplet-list'
        | 'droplet-open'
    }
  | {
      kind:
        | 'list-entity'
        | 'show-entity'
        | 'filter-entity'
        | 'group-entity'
        | 'sort-entity'
    }
  | { kind: 'error'; message: string }

export type BirdviewCommandResult = {
  status: 'ok' | 'error'
  summaryText: string
  preview: CommandPreview | null
  parsed: ParsedBirdviewCommand
  resolution: ResolvedBirdviewCommand
  warnings: string[]
  errors: string[]
}

export type BirdviewCommandExecutor = (context: {
  tenantId: string
  parsed: ValidatedBirdviewCommand
  resolution: ResolvedBirdviewCommand
  activeDroplets: ActiveDropletCommand[]
}) => Promise<BirdviewCommandResult>
