import {
  unifiedCommandInputSchema,
  type UnifiedCommandParseResult,
} from '../../schemas/commands'
import { parseBirdviewCommand } from '../commands'

export function parseUnifiedCommand(input: unknown): UnifiedCommandParseResult {
  const parsedInput = unifiedCommandInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      status: 'unparsed',
      reason: 'Invalid command input payload.',
      warnings: ['Command parser wrapper requires the shared command input schema.'],
    }
  }

  const parsed = parseBirdviewCommand(parsedInput.data.raw)
  if (parsed.kind === 'unknown') {
    return {
      status: 'unparsed',
      reason: 'Unknown command.',
      warnings: [],
    }
  }

  const args =
    'args' in parsed
      ? parsed.args.map((value, index) => ({
          key: `arg${index + 1}`,
          value,
        }))
      : []

  const noun =
    'entity' in parsed
      ? parsed.entity
      : 'theme' in parsed
        ? parsed.theme
        : 'nameOrId' in parsed
          ? parsed.nameOrId
          : undefined

  return {
    status: 'parsed',
    ast: {
      command:
        'command' in parsed
          ? parsed.command
          : parsed.raw.split(/\s+/)[0] ?? '/unknown',
      noun,
      args,
      target: parsedInput.data.target,
    },
    warnings: [],
  }
}
