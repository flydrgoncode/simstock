export const dropletEntities = [
  'revenueSnapshots',
  'headcountSnapshots',
  'customers',
  'orders',
  'opportunities',
  'salesStages',
  'opportunityStageEvents',
] as const

export type DropletEntity = (typeof dropletEntities)[number]

export type DropletFieldType =
  | 'string'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'date'
  | 'boolean'

export type DropletFilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'contains'
  | 'in'

export type DropletFieldConfig = {
  key: string
  label: string
  type: DropletFieldType
}

export type DropletEntityConfig = {
  label: string
  fields: DropletFieldConfig[]
  defaultFields: string[]
  defaultSort?: {
    field: string
    direction: 'asc' | 'desc'
  }
}

export const dropletEntityConfigs: Record<DropletEntity, DropletEntityConfig> =
  {
    revenueSnapshots: {
      label: 'Revenue snapshots',
      fields: [
        { key: 'month', label: 'Month', type: 'date' },
        { key: 'actualRevenue', label: 'Actual revenue', type: 'currency' },
        { key: 'forecastRevenue', label: 'Forecast revenue', type: 'currency' },
        { key: 'targetRevenue', label: 'Target revenue', type: 'currency' },
        { key: 'notes', label: 'Notes', type: 'string' },
      ],
      defaultFields: [
        'month',
        'actualRevenue',
        'forecastRevenue',
        'targetRevenue',
      ],
      defaultSort: { field: 'month', direction: 'asc' },
    },
    headcountSnapshots: {
      label: 'Headcount snapshots',
      fields: [
        { key: 'month', label: 'Month', type: 'date' },
        { key: 'actualHeadcount', label: 'Actual headcount', type: 'number' },
        {
          key: 'forecastHeadcount',
          label: 'Forecast headcount',
          type: 'number',
        },
        { key: 'targetHeadcount', label: 'Target headcount', type: 'number' },
        { key: 'notes', label: 'Notes', type: 'string' },
      ],
      defaultFields: [
        'month',
        'actualHeadcount',
        'forecastHeadcount',
        'targetHeadcount',
      ],
      defaultSort: { field: 'month', direction: 'asc' },
    },
    customers: {
      label: 'Customers',
      fields: [
        { key: 'name', label: 'Customer', type: 'string' },
        { key: 'segment', label: 'Segment', type: 'string' },
        { key: 'geography', label: 'Geography', type: 'string' },
        { key: 'industry', label: 'Industry', type: 'string' },
        { key: 'status', label: 'Status', type: 'string' },
        { key: 'ownerName', label: 'Owner', type: 'string' },
      ],
      defaultFields: ['name', 'segment', 'geography', 'industry', 'status'],
      defaultSort: { field: 'name', direction: 'asc' },
    },
    orders: {
      label: 'Orders',
      fields: [
        { key: 'orderDate', label: 'Order date', type: 'date' },
        { key: 'orderNumber', label: 'Order number', type: 'string' },
        { key: 'customerName', label: 'Customer', type: 'string' },
        { key: 'amount', label: 'Amount', type: 'currency' },
        { key: 'status', label: 'Status', type: 'string' },
        { key: 'productLine', label: 'Product line', type: 'string' },
        { key: 'notes', label: 'Notes', type: 'string' },
      ],
      defaultFields: [
        'orderDate',
        'orderNumber',
        'customerName',
        'amount',
        'status',
        'productLine',
      ],
      defaultSort: { field: 'orderDate', direction: 'desc' },
    },
    opportunities: {
      label: 'Opportunities',
      fields: [
        { key: 'name', label: 'Opportunity', type: 'string' },
        { key: 'customerName', label: 'Customer', type: 'string' },
        { key: 'stageName', label: 'Stage', type: 'string' },
        { key: 'ownerName', label: 'Owner', type: 'string' },
        { key: 'amount', label: 'Amount', type: 'currency' },
        { key: 'probability', label: 'Probability', type: 'percentage' },
        { key: 'expectedCloseDate', label: 'Expected close', type: 'date' },
        { key: 'status', label: 'Status', type: 'string' },
        { key: 'source', label: 'Source', type: 'string' },
      ],
      defaultFields: [
        'name',
        'customerName',
        'stageName',
        'amount',
        'probability',
        'expectedCloseDate',
        'status',
      ],
      defaultSort: { field: 'amount', direction: 'desc' },
    },
    salesStages: {
      label: 'Sales stages',
      fields: [
        { key: 'name', label: 'Stage', type: 'string' },
        { key: 'stageOrder', label: 'Order', type: 'number' },
        {
          key: 'defaultProbability',
          label: 'Default probability',
          type: 'percentage',
        },
        { key: 'isClosedWon', label: 'Closed won', type: 'boolean' },
        { key: 'isClosedLost', label: 'Closed lost', type: 'boolean' },
      ],
      defaultFields: [
        'name',
        'stageOrder',
        'defaultProbability',
        'isClosedWon',
        'isClosedLost',
      ],
      defaultSort: { field: 'stageOrder', direction: 'asc' },
    },
    opportunityStageEvents: {
      label: 'Opportunity stage events',
      fields: [
        { key: 'eventDate', label: 'Event date', type: 'date' },
        { key: 'opportunityName', label: 'Opportunity', type: 'string' },
        { key: 'fromStageName', label: 'From stage', type: 'string' },
        { key: 'toStageName', label: 'To stage', type: 'string' },
        { key: 'changedByName', label: 'Changed by', type: 'string' },
      ],
      defaultFields: [
        'eventDate',
        'opportunityName',
        'fromStageName',
        'toStageName',
      ],
      defaultSort: { field: 'eventDate', direction: 'desc' },
    },
  }

export function getDropletEntityConfig(entity: DropletEntity) {
  return dropletEntityConfigs[entity]
}

export function getDefaultDropletFields(entity: DropletEntity) {
  return [...dropletEntityConfigs[entity].defaultFields]
}

export function getDropletFieldKeys(entity: DropletEntity) {
  return dropletEntityConfigs[entity].fields.map((field) => field.key)
}
