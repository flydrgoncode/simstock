import { dropletEntityConfigs, type DropletFieldType } from './entities'

export function getDropletFieldLabel(entity: string, field: string) {
  const config =
    dropletEntityConfigs[entity as keyof typeof dropletEntityConfigs]
  return (
    config?.fields.find((candidate) => candidate.key === field)?.label ?? field
  )
}

export function getDropletFieldType(
  entity: string,
  field: string
): DropletFieldType | 'string' {
  const config =
    dropletEntityConfigs[entity as keyof typeof dropletEntityConfigs]
  return (
    config?.fields.find((candidate) => candidate.key === field)?.type ??
    'string'
  )
}

export function formatDropletValue(
  type: DropletFieldType | 'string',
  value: unknown
) {
  if (value == null || value === '') {
    return '—'
  }

  if (type === 'currency' && typeof value === 'number') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (type === 'percentage' && typeof value === 'number') {
    return `${value}%`
  }

  if (type === 'date') {
    const date = new Date(String(value))
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10)
    }
  }

  if (type === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  return String(value)
}
