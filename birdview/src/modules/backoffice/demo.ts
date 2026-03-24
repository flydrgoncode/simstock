import {
  AccountType,
  CustomerStatus,
  DropletType,
  EcommerceChannelType,
  FiscalPeriodStatus,
  LedgerAccountType,
  LedgerType,
  MarketingAssetType,
  MetricAggregationMethod,
  MetricScenario,
  MetricScope,
  MetricUnit,
  OrderStatus,
  OpportunityStatus,
  PeriodGranularity,
  ProductType,
  Prisma,
  RecordStatus,
  SalesOrderStatus,
  TenantShellStatus,
  TenantStatus,
  UserStatus,
  VerticalDefinitionStatus,
  VerticalDropletStatus,
  VerticalStatus,
} from '@prisma/client'
import type { PrismaClient } from '@prisma/client'

import {
  buildDefaultReadonlyTableDropletDefinition,
  buildShadowDefinitionFromReadonlyTable,
} from '../../lib/droplets/schema'

const SALES_VERTICAL_KEY = 'sales-motion'
const COMMERCE_VERTICAL_KEY = 'commerce-ops'

const segments = ['Enterprise', 'Mid-Market', 'SMB']
const geographies = ['North America', 'EMEA', 'LATAM', 'APAC']
const industries = [
  'Technology',
  'Financial Services',
  'Healthcare',
  'Retail',
  'Manufacturing',
]
const productLines = ['Platform', 'Analytics', 'Services', 'Expansion']

function monthStart(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

function makeCatalogDroplets() {
  return [
    {
      name: 'Customers Explorer',
      slug: 'customers-explorer',
      description: 'Read-only customer portfolio explorer',
      command: '/customers',
      commandAliasesJson: ['/accounts'],
      commandHelpText: 'Open the customer portfolio explorer.',
      placement: 'customers',
      dropletType: DropletType.READONLY_TABLE,
      definition: buildDefaultReadonlyTableDropletDefinition('customers', {
        title: 'Customers Explorer',
        placement: 'customers',
        summary: { enabled: false, fields: [] },
      }),
      shadowDefinition: buildShadowDefinitionFromReadonlyTable(
        buildDefaultReadonlyTableDropletDefinition('customers', {
          title: 'Customers Explorer',
          placement: 'customers',
          summary: { enabled: false, fields: [] },
        }),
        {
          name: 'Customers Explorer',
          command: '/customers',
          aliases: ['/accounts'],
          helpText: 'Open the customer portfolio explorer.',
          category: 'explorer',
          mode: 'read',
          outputType: 'table',
          dummyScenario: 'customers_basic',
        }
      ),
      authorHintText: 'Show customers with segment, geography, industry and status.',
      generationStatus: 'validated',
      generationPromptVersion: 'droplet-shadow-generator@v1',
      previewDummyDataConfigJson: { scenarioKey: 'customers_basic' },
      supportedEntitiesJson: ['customers'],
    },
    {
      name: 'Orders Explorer',
      slug: 'orders-explorer',
      description: 'Read-only orders explorer',
      command: '/orders',
      commandAliasesJson: ['/bookings'],
      commandHelpText: 'Open the orders explorer.',
      placement: 'operations',
      dropletType: DropletType.READONLY_TABLE,
      definition: buildDefaultReadonlyTableDropletDefinition('orders', {
        title: 'Orders Explorer',
        placement: 'operations',
        summary: { enabled: true, fields: ['amount'] },
      }),
      shadowDefinition: buildShadowDefinitionFromReadonlyTable(
        buildDefaultReadonlyTableDropletDefinition('orders', {
          title: 'Orders Explorer',
          placement: 'operations',
          summary: { enabled: true, fields: ['amount'] },
        }),
        {
          name: 'Orders Explorer',
          command: '/orders',
          aliases: ['/bookings'],
          helpText: 'Open the orders explorer.',
          category: 'explorer',
          mode: 'read',
          outputType: 'table',
          dummyScenario: 'orders_by_customer',
        }
      ),
      authorHintText: 'List orders by customer with amount and status.',
      generationStatus: 'validated',
      generationPromptVersion: 'droplet-shadow-generator@v1',
      previewDummyDataConfigJson: { scenarioKey: 'orders_by_customer' },
      supportedEntitiesJson: ['orders'],
    },
    {
      name: 'Revenue Explorer',
      slug: 'revenue-explorer',
      description: 'Read-only monthly revenue explorer',
      command: '/revenue',
      commandAliasesJson: ['/arr'],
      commandHelpText: 'Open the monthly revenue explorer.',
      placement: 'overview',
      dropletType: DropletType.READONLY_TABLE,
      definition: buildDefaultReadonlyTableDropletDefinition('revenueSnapshots', {
        title: 'Revenue Explorer',
        placement: 'overview',
        summary: {
          enabled: true,
          fields: ['actualRevenue', 'forecastRevenue', 'targetRevenue'],
        },
      }),
      shadowDefinition: {
        ...buildShadowDefinitionFromReadonlyTable(
          buildDefaultReadonlyTableDropletDefinition('revenueSnapshots', {
            title: 'Revenue Explorer',
            placement: 'overview',
            summary: {
              enabled: true,
              fields: ['actualRevenue', 'forecastRevenue', 'targetRevenue'],
            },
          }),
          {
            name: 'Revenue Explorer',
            command: '/revenue',
            aliases: ['/arr'],
            helpText: 'Open the monthly revenue explorer.',
            category: 'explorer',
            mode: 'read',
            outputType: 'mixed',
            dummyScenario: 'monthly_revenue_comparison',
          }
        ),
        presentation: {
          outputType: 'mixed',
          blocks: [
            { type: 'summary_text', title: 'Revenue summary' },
            {
              type: 'kpi_cards',
              title: 'Revenue KPIs',
              metrics: ['actualRevenue', 'forecastRevenue', 'targetRevenue'],
            },
            {
              type: 'chart',
              title: 'Revenue trend',
              chartType: 'comparison',
              metric: 'actualRevenue',
              x: 'month',
            },
            {
              type: 'table',
              title: 'Revenue table',
              entity: 'revenueSnapshots',
              columns: [
                { key: 'month', label: 'Month', type: 'date' },
                { key: 'actualRevenue', label: 'Actual revenue', type: 'currency' },
                { key: 'forecastRevenue', label: 'Forecast revenue', type: 'currency' },
                { key: 'targetRevenue', label: 'Target revenue', type: 'currency' },
              ],
            },
          ],
        },
      },
      authorHintText: 'Compare actual revenue versus forecast and target and show a chart.',
      generationStatus: 'validated',
      generationPromptVersion: 'droplet-shadow-generator@v1',
      previewDummyDataConfigJson: { scenarioKey: 'monthly_revenue_comparison' },
      supportedEntitiesJson: ['revenueSnapshots'],
    },
    {
      name: 'Headcount Explorer',
      slug: 'headcount-explorer',
      description: 'Read-only headcount explorer',
      command: '/headcount',
      commandAliasesJson: ['/people'],
      commandHelpText: 'Open the monthly headcount explorer.',
      placement: 'overview',
      dropletType: DropletType.READONLY_TABLE,
      definition: buildDefaultReadonlyTableDropletDefinition(
        'headcountSnapshots',
        {
          title: 'Headcount Explorer',
          placement: 'overview',
          summary: {
            enabled: true,
            fields: [
              'actualHeadcount',
              'forecastHeadcount',
              'targetHeadcount',
            ],
          },
        }
      ),
      shadowDefinition: buildShadowDefinitionFromReadonlyTable(
        buildDefaultReadonlyTableDropletDefinition('headcountSnapshots', {
          title: 'Headcount Explorer',
          placement: 'overview',
          summary: {
            enabled: true,
            fields: [
              'actualHeadcount',
              'forecastHeadcount',
              'targetHeadcount',
            ],
          },
        }),
        {
          name: 'Headcount Explorer',
          command: '/headcount',
          aliases: ['/people'],
          helpText: 'Open the monthly headcount explorer.',
          category: 'explorer',
          mode: 'read',
          outputType: 'table',
          dummyScenario: 'headcount_capacity_plan',
        }
      ),
      authorHintText: 'Show monthly headcount actual, forecast, and target.',
      generationStatus: 'validated',
      generationPromptVersion: 'droplet-shadow-generator@v1',
      previewDummyDataConfigJson: { scenarioKey: 'headcount_capacity_plan' },
      supportedEntitiesJson: ['headcountSnapshots'],
    },
    {
      name: 'Pipeline Explorer',
      slug: 'pipeline-explorer',
      description: 'Read-only pipeline explorer',
      command: '/pipeline',
      commandAliasesJson: ['/opportunities'],
      commandHelpText: 'Open the pipeline explorer.',
      placement: 'pipeline',
      dropletType: DropletType.READONLY_TABLE,
      definition: buildDefaultReadonlyTableDropletDefinition('opportunities', {
        title: 'Pipeline Explorer',
        placement: 'pipeline',
        summary: { enabled: true, fields: ['amount', 'probability'] },
      }),
      shadowDefinition: buildShadowDefinitionFromReadonlyTable(
        buildDefaultReadonlyTableDropletDefinition('opportunities', {
          title: 'Pipeline Explorer',
          placement: 'pipeline',
          summary: { enabled: true, fields: ['amount', 'probability'] },
        }),
        {
          name: 'Pipeline Explorer',
          command: '/pipeline',
          aliases: ['/opportunities'],
          helpText: 'Open the pipeline explorer.',
          category: 'explorer',
          mode: 'read',
          outputType: 'table',
          dummyScenario: 'simple_pipeline_by_stage',
        }
      ),
      authorHintText: 'Show pipeline by stage with amount and probability.',
      generationStatus: 'validated',
      generationPromptVersion: 'droplet-shadow-generator@v1',
      previewDummyDataConfigJson: { scenarioKey: 'simple_pipeline_by_stage' },
      supportedEntitiesJson: ['opportunities', 'salesStages'],
    },
    {
      name: 'Monthly Sales Targets',
      slug: 'monthly-sales-targets',
      description: 'Editable monthly sales targets planner.',
      command: '/sales-targets',
      commandAliasesJson: ['/targets'],
      commandHelpText: 'Open the monthly sales targets editor.',
      placement: 'planning',
      dropletType: DropletType.EDITABLE_TABLE,
      definition: buildDefaultReadonlyTableDropletDefinition('revenueSnapshots', {
        title: 'Monthly Sales Targets',
        placement: 'planning',
        fields: ['month', 'targetRevenue'],
        summary: { enabled: true, fields: ['targetRevenue'] },
      }),
      shadowDefinition: {
        identity: {
          name: 'Monthly Sales Targets',
          description: 'Input monthly sales targets for a selected year',
          category: 'editor',
        },
        commandDefinition: {
          command: '/sales-targets',
          aliases: ['/targets'],
          helpText: 'Open the monthly sales targets editor',
        },
        execution: {
          mode: 'write',
          dataSources: ['RevenueTarget'],
          entityScope: 'company',
          supportsDummyData: true,
        },
        logic: {
          operation: 'bulk_upsert',
          calculations: [],
          transforms: [],
          filters: [],
          grouping: null,
          timeDimension: 'month',
        },
        presentation: {
          outputType: 'editable_table',
          blocks: [
            {
              type: 'editable_table',
              title: 'Monthly target editor',
              entity: 'RevenueTarget',
              columns: [
                { key: 'month', label: 'Month', type: 'string', editable: false },
                {
                  key: 'targetRevenue',
                  label: 'Target Revenue',
                  type: 'currency',
                  editable: true,
                },
              ],
            },
            {
              type: 'chart',
              title: 'Target preview',
              chartType: 'bar',
              metric: 'targetRevenue',
              x: 'month',
            },
          ],
        },
        interaction: {
          inputParams: [{ name: 'year', type: 'number', required: true }],
          draftSupported: true,
          confirmBeforeCommit: false,
        },
        writeback: {
          enabled: true,
          entity: 'RevenueTarget',
          strategy: 'bulk_upsert',
          allowedFields: ['month', 'targetRevenue'],
          validationRules: [{ field: 'targetRevenue', rule: 'non_negative' }],
        },
        preview: {
          dummyScenario: 'default_revenue_targets_year',
        },
      },
      authorHintText: 'Allow entering monthly sales targets for a year.',
      generationStatus: 'validated',
      generationPromptVersion: 'droplet-shadow-generator@v1',
      previewDummyDataConfigJson: { scenarioKey: 'default_revenue_targets_year' },
      supportedEntitiesJson: ['RevenueTarget'],
    },
    {
      name: 'Revenue vs Target Analysis',
      slug: 'revenue-vs-target-analysis',
      description: 'Compare actual revenue versus target and explain the variance.',
      command: '/revenue-variance',
      commandAliasesJson: ['/variance'],
      commandHelpText: 'Open revenue versus target analysis.',
      placement: 'overview',
      dropletType: DropletType.MIXED_OUTPUT,
      definition: buildDefaultReadonlyTableDropletDefinition('revenueSnapshots', {
        title: 'Revenue vs Target Analysis',
        placement: 'overview',
        fields: ['month', 'actualRevenue', 'targetRevenue', 'forecastRevenue'],
        summary: { enabled: true, fields: ['actualRevenue', 'targetRevenue'] },
      }),
      shadowDefinition: {
        identity: {
          name: 'Revenue vs Target Analysis',
          description: 'Compare actual revenue versus target and show a chart plus table.',
          category: 'analysis',
        },
        commandDefinition: {
          command: '/revenue-variance',
          aliases: ['/variance'],
          helpText: 'Open revenue versus target analysis',
        },
        execution: {
          mode: 'mixed',
          dataSources: ['RevenueSnapshot'],
          entityScope: 'company',
          supportsDummyData: true,
        },
        logic: {
          operation: 'compare',
          calculations: [{ metric: 'variance', formula: 'actualRevenue-targetRevenue' }],
          transforms: [{ type: 'variance' }],
          filters: [],
          grouping: null,
          timeDimension: 'month',
        },
        presentation: {
          outputType: 'mixed',
          blocks: [
            { type: 'summary_text', title: 'Variance summary' },
            {
              type: 'kpi_cards',
              title: 'Variance KPIs',
              metrics: ['actualRevenue', 'targetRevenue'],
            },
            {
              type: 'chart',
              title: 'Actual vs target',
              chartType: 'comparison',
              metric: 'actualRevenue',
              x: 'month',
            },
            {
              type: 'table',
              title: 'Variance detail',
              entity: 'revenueSnapshots',
              columns: [
                { key: 'month', label: 'Month', type: 'date' },
                { key: 'actualRevenue', label: 'Actual revenue', type: 'currency' },
                { key: 'targetRevenue', label: 'Target revenue', type: 'currency' },
                { key: 'forecastRevenue', label: 'Forecast revenue', type: 'currency' },
              ],
            },
          ],
        },
        interaction: {
          inputParams: [{ name: 'period', type: 'string', required: false }],
          draftSupported: false,
          confirmBeforeCommit: false,
        },
        writeback: {
          enabled: false,
          validationRules: [],
        },
        preview: {
          dummyScenario: 'monthly_revenue_comparison',
        },
      },
      authorHintText: 'Compare actual revenue versus target and show a chart.',
      generationStatus: 'validated',
      generationPromptVersion: 'droplet-shadow-generator@v1',
      previewDummyDataConfigJson: { scenarioKey: 'monthly_revenue_comparison' },
      supportedEntitiesJson: ['RevenueSnapshot'],
    },
    {
      name: 'Marketing Funnel',
      slug: 'marketing-funnel',
      description: 'Explore funnel events and marketing lead movement.',
      command: '/marketing-funnel',
      commandAliasesJson: ['/funnel'],
      commandHelpText: 'Open the marketing funnel explorer.',
      placement: 'marketing',
      dropletType: DropletType.MIXED_OUTPUT,
      definition: buildDefaultReadonlyTableDropletDefinition('opportunityStageEvents', {
        title: 'Marketing Funnel',
        placement: 'marketing',
        fields: ['eventDate', 'opportunityName', 'toStageName'],
        summary: { enabled: false, fields: [] },
      }),
      shadowDefinition: {
        identity: {
          name: 'Marketing Funnel',
          description: 'Summarize funnel progress and event flow from marketing activity.',
          category: 'analysis',
        },
        commandDefinition: {
          command: '/marketing-funnel',
          aliases: ['/funnel'],
          helpText: 'Open the marketing funnel explorer.',
        },
        execution: {
          mode: 'read',
          dataSources: ['FunnelEvent', 'MarketingLead'],
          entityScope: 'company',
          supportsDummyData: true,
        },
        logic: {
          operation: 'explore',
          calculations: [],
          transforms: [{ type: 'funnel_summary' }],
          filters: [],
          grouping: { field: 'toStageName' },
          timeDimension: 'month',
        },
        presentation: {
          outputType: 'mixed',
          blocks: [
            { type: 'summary_text', title: 'Funnel summary' },
            { type: 'kpi_cards', title: 'Funnel KPIs', metrics: ['value'] },
            {
              type: 'chart',
              title: 'Funnel flow',
              chartType: 'bar',
              metric: 'value',
              x: 'eventDate',
            },
            {
              type: 'table',
              title: 'Funnel events',
              entity: 'FunnelEvent',
              columns: [
                { key: 'eventDate', label: 'Event date', type: 'date' },
                { key: 'opportunityName', label: 'Opportunity', type: 'string' },
                { key: 'toStageName', label: 'Stage', type: 'string' },
              ],
            },
          ],
        },
        interaction: {
          inputParams: [],
          draftSupported: false,
          confirmBeforeCommit: false,
        },
        writeback: {
          enabled: false,
          validationRules: [],
        },
        preview: {
          dummyScenario: 'marketing_funnel_sample',
        },
      },
      authorHintText: 'Show the marketing funnel and stage movement over time.',
      generationStatus: 'validated',
      generationPromptVersion: 'droplet-shadow-generator@v2',
      previewDummyDataConfigJson: { scenarioKey: 'marketing_funnel_sample' },
      supportedEntitiesJson: ['FunnelEvent', 'MarketingLead'],
    },
  ]
}

const platformSkills = [
  {
    key: 'droplet-renderer',
    name: 'Droplet Renderer',
    description: 'Formats droplet payloads into business-friendly read-only output.',
    instructions: 'Render readonly_table droplets with labels, formatting, and summary support.',
    priority: 1,
  },
  {
    key: 'tenant-command-router',
    name: 'Tenant Command Router',
    description: 'Resolves slash commands into tenant-scoped droplet execution.',
    instructions: 'Validate command aliases, resolve the target droplet, and return structured read-only output.',
    priority: 2,
  },
  {
    key: 'summary-writer',
    name: 'Summary Writer',
    description: 'Generates concise business summaries for tables and comparisons.',
    instructions: 'Produce a short operational summary from curated business records without exposing technical noise.',
    priority: 3,
  },
] as const

export async function seedPlatformCatalog(prisma: PrismaClient) {
  const vertical = await prisma.vertical.upsert({
    where: { key: SALES_VERTICAL_KEY },
    update: {
      name: 'Sales Motion',
      description: 'Default sales-motion vertical for Birdview',
      status: VerticalStatus.ACTIVE,
    },
    create: {
      key: SALES_VERTICAL_KEY,
      name: 'Sales Motion',
      description: 'Default sales-motion vertical for Birdview',
      status: VerticalStatus.ACTIVE,
    },
  })

  await prisma.vertical.upsert({
    where: { key: COMMERCE_VERTICAL_KEY },
    update: {
      name: 'Commerce Operations',
      description: 'Commerce, inventory, and order operations vertical',
      status: VerticalStatus.ACTIVE,
    },
    create: {
      key: COMMERCE_VERTICAL_KEY,
      name: 'Commerce Operations',
      description: 'Commerce, inventory, and order operations vertical',
      status: VerticalStatus.ACTIVE,
    },
  })

  for (const skill of platformSkills) {
    const record = await prisma.skill.upsert({
      where: { key: skill.key },
      update: {
        name: skill.name,
        description: skill.description,
        instructions: skill.instructions,
        status: RecordStatus.ACTIVE,
      },
      create: {
        key: skill.key,
        name: skill.name,
        description: skill.description,
        instructions: skill.instructions,
        status: RecordStatus.ACTIVE,
      },
    })

    await prisma.verticalSkill.upsert({
      where: {
        verticalId_skillId: {
          verticalId: vertical.id,
          skillId: record.id,
        },
      },
      update: {
        priority: skill.priority,
        active: true,
      },
      create: {
        verticalId: vertical.id,
        skillId: record.id,
        priority: skill.priority,
        active: true,
      },
    })
  }

  const definition = await prisma.verticalDefinition.upsert({
    where: {
      verticalId_version: {
        verticalId: vertical.id,
        version: 1,
      },
    },
    update: {
      commonModelConfigJson: {
        entities: ['Tenant', 'User', 'Person'],
      },
      verticalModelConfigJson: {
        entities: [
          'RevenueSnapshot',
          'HeadcountSnapshot',
          'Customer',
          'Order',
          'Opportunity',
          'SalesStage',
          'OpportunityStageEvent',
        ],
      },
      llmConfigJson: {
        providers: ['openai', 'anthropic'],
        defaults: {
          provider: 'openai',
          model: 'gpt-5.4-mini',
        },
      },
      commandPackJson: {
        globals: ['/help', '/droplet list', '/open droplet <name>'],
        workspace: {
          themes: [
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
          ],
        },
      },
      skillPackJson: {
        skills: ['droplet_renderer', 'tenant_command_router'],
      },
      orgChartTemplateJson: {
        rootLabel: 'Leadership',
      },
      status: VerticalDefinitionStatus.PUBLISHED,
    },
    create: {
      verticalId: vertical.id,
      version: 1,
      commonModelConfigJson: {
        entities: ['Tenant', 'User', 'Person'],
      },
      verticalModelConfigJson: {
        entities: [
          'RevenueSnapshot',
          'HeadcountSnapshot',
          'Customer',
          'Order',
          'Opportunity',
          'SalesStage',
          'OpportunityStageEvent',
        ],
      },
      llmConfigJson: {
        providers: ['openai', 'anthropic'],
        defaults: {
          provider: 'openai',
          model: 'gpt-5.4-mini',
        },
      },
      commandPackJson: {
        globals: ['/help', '/droplet list', '/open droplet <name>'],
        workspace: {
          themes: [
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
          ],
        },
      },
      skillPackJson: {
        skills: ['droplet_renderer', 'tenant_command_router'],
      },
      orgChartTemplateJson: {
        rootLabel: 'Leadership',
      },
      status: VerticalDefinitionStatus.PUBLISHED,
    },
  })

  const seededCatalog = makeCatalogDroplets()

  await prisma.promptTemplate.upsert({
    where: {
      key_version: {
        key: 'droplet-shadow-generator',
        version: 1,
      },
    },
    update: {
      verticalId: vertical.id,
      name: 'Droplet Shadow Generator',
      purpose: 'Convert author hints into Birdview shadow skill JSON.',
      templateText:
        'Given vertical context, canonical entities, allowed execution modes, output types, and a creator hint, output only valid Birdview shadow skill definition JSON.',
      status: RecordStatus.ACTIVE,
    },
    create: {
      verticalId: vertical.id,
      key: 'droplet-shadow-generator',
      name: 'Droplet Shadow Generator',
      purpose: 'Convert author hints into Birdview shadow skill JSON.',
      templateText:
        'Given vertical context, canonical entities, allowed execution modes, output types, and a creator hint, output only valid Birdview shadow skill definition JSON.',
      version: 1,
      status: RecordStatus.ACTIVE,
    },
  })

  const dummyScenarios = [
    {
      key: 'default_revenue_targets_year',
      name: 'Default Revenue Targets Year',
      entity: 'RevenueTarget',
      description: 'Editable monthly revenue target plan for one year.',
      scenarioJson: {
        rows: Array.from({ length: 12 }, (_, index) => ({
          month: `2027-${String(index + 1).padStart(2, '0')}`,
          targetRevenue: 90000 + index * 4500,
        })),
      },
    },
    {
      key: 'simple_pipeline_by_stage',
      name: 'Simple Pipeline By Stage',
      entity: 'Opportunity',
      description: 'Pipeline sample grouped by stage.',
      scenarioJson: {
        rows: [
          { name: 'Northwind Expansion', stageName: 'Proposal', amount: 145000, probability: 65, status: 'OPEN' },
          { name: 'Contoso Renewal', stageName: 'Negotiation', amount: 98000, probability: 80, status: 'OPEN' },
          { name: 'Globex Pilot', stageName: 'Discovery', amount: 52000, probability: 35, status: 'OPEN' },
        ],
      },
    },
    {
      key: 'monthly_revenue_comparison',
      name: 'Monthly Revenue Comparison',
      entity: 'RevenueSnapshot',
      description: 'Revenue actual, forecast, and target by month.',
      scenarioJson: {
        rows: Array.from({ length: 6 }, (_, index) => ({
          month: `2026-${String(index + 1).padStart(2, '0')}`,
          actualRevenue: 110000 + index * 7000,
          forecastRevenue: 112000 + index * 7500,
          targetRevenue: 120000 + index * 8000,
        })),
      },
    },
    {
      key: 'customers_basic',
      name: 'Customers Basic',
      entity: 'Account',
      description: 'Basic customer list for preview.',
      scenarioJson: {
        rows: [
          { name: 'Northwind', segment: 'Enterprise', geography: 'North America', industry: 'Technology', status: 'ACTIVE' },
          { name: 'Contoso', segment: 'Mid-Market', geography: 'EMEA', industry: 'Retail', status: 'ACTIVE' },
        ],
      },
    },
    {
      key: 'orders_by_customer',
      name: 'Orders By Customer',
      entity: 'SalesOrder',
      description: 'Order list with customer and amount.',
      scenarioJson: {
        rows: [
          { orderDate: '2026-03-05', orderNumber: 'SO-1001', customerName: 'Northwind', amount: 18000, status: 'CONFIRMED', productLine: 'Platform' },
          { orderDate: '2026-03-11', orderNumber: 'SO-1002', customerName: 'Contoso', amount: 25000, status: 'SHIPPED', productLine: 'Analytics' },
        ],
      },
    },
    {
      key: 'marketing_funnel_sample',
      name: 'Marketing Funnel Sample',
      entity: 'FunnelEvent',
      description: 'Marketing funnel sample.',
      scenarioJson: {
        rows: [
          { funnelStage: 'Awareness', value: 1200, eventDate: '2026-03-01' },
          { funnelStage: 'Consideration', value: 430, eventDate: '2026-03-08' },
          { funnelStage: 'Qualified', value: 120, eventDate: '2026-03-15' },
        ],
      },
    },
    {
      key: 'lead_funnel_sample',
      name: 'Lead Funnel Sample',
      entity: 'FunnelEvent',
      description: 'Marketing funnel sample.',
      scenarioJson: {
        rows: [
          { funnelStage: 'Awareness', value: 1200, eventDate: '2026-03-01' },
          { funnelStage: 'Consideration', value: 430, eventDate: '2026-03-08' },
          { funnelStage: 'Qualified', value: 120, eventDate: '2026-03-15' },
        ],
      },
    },
    {
      key: 'customer_portfolio_sample',
      name: 'Customer Portfolio Sample',
      entity: 'Account',
      description: 'Customer portfolio sample for preview.',
      scenarioJson: {
        rows: [
          { name: 'Northwind', segment: 'Enterprise', geography: 'North America', industry: 'Technology', status: 'ACTIVE' },
          { name: 'Contoso', segment: 'Mid-Market', geography: 'EMEA', industry: 'Retail', status: 'ACTIVE' },
        ],
      },
    },
    {
      key: 'headcount_capacity_plan',
      name: 'Headcount Capacity Plan',
      entity: 'HeadcountSnapshot',
      description: 'Headcount plan by month.',
      scenarioJson: {
        rows: Array.from({ length: 6 }, (_, index) => ({
          month: `2026-${String(index + 1).padStart(2, '0')}`,
          actualHeadcount: 60 + index * 2,
          forecastHeadcount: 62 + index * 2,
          targetHeadcount: 64 + index * 2,
        })),
      },
    },
  ]

  for (const scenario of dummyScenarios) {
    await prisma.dummyDataScenario.upsert({
      where: { key: scenario.key },
      update: {
        verticalId: vertical.id,
        name: scenario.name,
        description: scenario.description,
        entity: scenario.entity,
        scenarioJson: scenario.scenarioJson as Prisma.InputJsonValue,
        status: RecordStatus.ACTIVE,
      },
      create: {
        verticalId: vertical.id,
        key: scenario.key,
        name: scenario.name,
        description: scenario.description,
        entity: scenario.entity,
        scenarioJson: scenario.scenarioJson as Prisma.InputJsonValue,
        status: RecordStatus.ACTIVE,
      },
    })
  }

  const openaiProvider = await prisma.lLMProviderConfig.upsert({
    where: { providerKey: 'openai' },
    update: {
      name: 'OpenAI',
      status: RecordStatus.ACTIVE,
      apiKeyRef: 'OPENAI_API_KEY',
    },
    create: {
      providerKey: 'openai',
      name: 'OpenAI',
      status: RecordStatus.ACTIVE,
      apiKeyRef: 'OPENAI_API_KEY',
    },
  })

  const anthropicProvider = await prisma.lLMProviderConfig.upsert({
    where: { providerKey: 'anthropic' },
    update: {
      name: 'Anthropic',
      status: RecordStatus.ACTIVE,
      apiKeyRef: 'ANTHROPIC_API_KEY',
    },
    create: {
      providerKey: 'anthropic',
      name: 'Anthropic',
      status: RecordStatus.ACTIVE,
      apiKeyRef: 'ANTHROPIC_API_KEY',
    },
  })

  const openaiModel = await prisma.lLMModelConfig.upsert({
    where: {
      providerConfigId_modelKey: {
        providerConfigId: openaiProvider.id,
        modelKey: 'gpt-5.4-mini',
      },
    },
    update: {
      displayName: 'GPT-5.4 Mini',
      status: RecordStatus.ACTIVE,
      isDefault: true,
      supportsTools: true,
      supportsStructuredOutput: true,
    },
    create: {
      providerConfigId: openaiProvider.id,
      modelKey: 'gpt-5.4-mini',
      displayName: 'GPT-5.4 Mini',
      status: RecordStatus.ACTIVE,
      isDefault: true,
      supportsTools: true,
      supportsStructuredOutput: true,
    },
  })

  await prisma.lLMModelConfig.upsert({
    where: {
      providerConfigId_modelKey: {
        providerConfigId: anthropicProvider.id,
        modelKey: 'claude-sonnet-4-5',
      },
    },
    update: {
      displayName: 'Claude Sonnet 4.5',
      status: RecordStatus.ACTIVE,
      isDefault: false,
      supportsTools: true,
      supportsStructuredOutput: true,
    },
    create: {
      providerConfigId: anthropicProvider.id,
      modelKey: 'claude-sonnet-4-5',
      displayName: 'Claude Sonnet 4.5',
      status: RecordStatus.ACTIVE,
      isDefault: false,
      supportsTools: true,
      supportsStructuredOutput: true,
    },
  })

  await prisma.verticalLLMConfig.upsert({
    where: {
      id: `vlc-${vertical.id}`,
    },
    update: {
      providerConfigId: openaiProvider.id,
      modelConfigId: openaiModel.id,
      purpose: 'default-runtime',
      systemPrompt: 'You are Birdview Mission Control for the sales-motion vertical.',
      active: true,
    },
    create: {
      id: `vlc-${vertical.id}`,
      verticalId: vertical.id,
      providerConfigId: openaiProvider.id,
      modelConfigId: openaiModel.id,
      purpose: 'default-runtime',
      systemPrompt: 'You are Birdview Mission Control for the sales-motion vertical.',
      active: true,
    },
  })

  await prisma.emailProviderConfig.upsert({
    where: { providerKey: 'smtp-primary' },
    update: {
      name: 'Primary SMTP',
      status: RecordStatus.ACTIVE,
      host: 'smtp.example.com',
      port: 587,
      usernameRef: 'EMAIL_SMTP_USER',
      passwordRef: 'EMAIL_SMTP_PASSWORD',
      fromEmail: 'hello@birdview.dev',
      fromName: 'Birdview',
    },
    create: {
      providerKey: 'smtp-primary',
      name: 'Primary SMTP',
      status: RecordStatus.ACTIVE,
      host: 'smtp.example.com',
      port: 587,
      usernameRef: 'EMAIL_SMTP_USER',
      passwordRef: 'EMAIL_SMTP_PASSWORD',
      fromEmail: 'hello@birdview.dev',
      fromName: 'Birdview',
    },
  })

  await prisma.emailTemplate.upsert({
    where: { key: 'mission-control-invite' },
    update: {
      name: 'Mission Control Invite',
      subjectTemplate: 'You have been invited to Birdview Mission Control',
      bodyTemplate: 'Hello {{displayName}}, you now have access to Birdview Mission Control.',
      type: 'invite',
      status: RecordStatus.ACTIVE,
    },
    create: {
      key: 'mission-control-invite',
      name: 'Mission Control Invite',
      subjectTemplate: 'You have been invited to Birdview Mission Control',
      bodyTemplate: 'Hello {{displayName}}, you now have access to Birdview Mission Control.',
      type: 'invite',
      status: RecordStatus.ACTIVE,
    },
  })

  await prisma.verticalDroplet.deleteMany({
    where: {
      verticalId: vertical.id,
      slug: {
        notIn: seededCatalog.map((droplet) => droplet.slug),
      },
    },
  })

  for (const droplet of seededCatalog) {
    const record = await prisma.verticalDroplet.upsert({
      where: {
        verticalId_slug: {
          verticalId: vertical.id,
          slug: droplet.slug,
        },
      },
      update: {
        name: droplet.name,
        description: droplet.description,
        dropletType: droplet.dropletType,
        command: droplet.command,
        commandAliasesJson: droplet.commandAliasesJson,
        commandHelpText: droplet.commandHelpText,
        authorHintText: droplet.authorHintText,
        shadowSkillDefinitionJson: droplet.shadowDefinition as Prisma.InputJsonValue,
        generationPromptVersion: droplet.generationPromptVersion,
        generationStatus: droplet.generationStatus,
        generationWarningsJson: [] as Prisma.InputJsonValue,
        previewDummyDataConfigJson:
          droplet.previewDummyDataConfigJson as Prisma.InputJsonValue,
        dropletDefinitionJson: droplet.definition as Prisma.InputJsonValue,
        supportedEntitiesJson: droplet.supportedEntitiesJson,
        status: VerticalDropletStatus.PUBLISHED,
        version: 1,
      },
      create: {
        verticalId: vertical.id,
        name: droplet.name,
        slug: droplet.slug,
        description: droplet.description,
        dropletType: droplet.dropletType,
        command: droplet.command,
        commandAliasesJson: droplet.commandAliasesJson,
        commandHelpText: droplet.commandHelpText,
        authorHintText: droplet.authorHintText,
        shadowSkillDefinitionJson: droplet.shadowDefinition as Prisma.InputJsonValue,
        generationPromptVersion: droplet.generationPromptVersion,
        generationStatus: droplet.generationStatus,
        generationWarningsJson: [] as Prisma.InputJsonValue,
        previewDummyDataConfigJson:
          droplet.previewDummyDataConfigJson as Prisma.InputJsonValue,
        dropletDefinitionJson: droplet.definition as Prisma.InputJsonValue,
        supportedEntitiesJson: droplet.supportedEntitiesJson,
        status: VerticalDropletStatus.PUBLISHED,
        version: 1,
      },
    })

    await prisma.verticalDropletVersion.upsert({
      where: {
        verticalDropletId_version: {
          verticalDropletId: record.id,
          version: 1,
        },
      },
      update: {
        shadowSkillDefinitionJson: droplet.shadowDefinition as Prisma.InputJsonValue,
        authorHintText: droplet.authorHintText,
        generationPromptVersion: droplet.generationPromptVersion,
        generationWarningsJson: [] as Prisma.InputJsonValue,
        statusSnapshot: VerticalDropletStatus.PUBLISHED,
      },
      create: {
        verticalDropletId: record.id,
        version: 1,
        shadowSkillDefinitionJson: droplet.shadowDefinition as Prisma.InputJsonValue,
        authorHintText: droplet.authorHintText,
        generationPromptVersion: droplet.generationPromptVersion,
        generationWarningsJson: [] as Prisma.InputJsonValue,
        statusSnapshot: VerticalDropletStatus.PUBLISHED,
      },
    })
  }

  return { vertical, definition }
}

export async function resetTenantDemoData(
  prisma: PrismaClient,
  tenantId: string
) {
  const company = await prisma.company.findUnique({
    where: { tenantId },
  })

  await prisma.$transaction([
    prisma.auditLog.deleteMany({ where: { tenantId } }),
    prisma.dataImportJob.deleteMany({ where: { tenantId } }),
    prisma.opportunityStageEvent.deleteMany({ where: { tenantId } }),
    prisma.opportunity.deleteMany({ where: { tenantId } }),
    prisma.order.deleteMany({ where: { tenantId } }),
    prisma.customer.deleteMany({ where: { tenantId } }),
    prisma.salesStage.deleteMany({ where: { tenantId } }),
    prisma.person.deleteMany({ where: { tenantId } }),
    ...(company
      ? [
          prisma.funnelEvent.deleteMany({ where: { companyId: company.id } }),
          prisma.marketingLead.deleteMany({ where: { companyId: company.id } }),
          prisma.socialPost.deleteMany({ where: { companyId: company.id } }),
          prisma.contentAsset.deleteMany({ where: { companyId: company.id } }),
          prisma.landingPage.deleteMany({ where: { companyId: company.id } }),
          prisma.marketingCampaign.deleteMany({ where: { companyId: company.id } }),
          prisma.marketingWorkspace.deleteMany({ where: { companyId: company.id } }),
          prisma.metricPoint.deleteMany({ where: { companyId: company.id } }),
          prisma.forecastModel.deleteMany({ where: { companyId: company.id } }),
          prisma.metricSeries.deleteMany({ where: { companyId: company.id } }),
          prisma.metricDefinition.deleteMany({ where: { companyId: company.id } }),
          prisma.journalEntryLine.deleteMany({ where: { companyId: company.id } }),
          prisma.journalEntry.deleteMany({ where: { companyId: company.id } }),
          prisma.invoiceLine.deleteMany({ where: { companyId: company.id } }),
          prisma.payment.deleteMany({ where: { companyId: company.id } }),
          prisma.invoice.deleteMany({ where: { companyId: company.id } }),
          prisma.expense.deleteMany({ where: { companyId: company.id } }),
          prisma.ledgerAccount.deleteMany({ where: { companyId: company.id } }),
          prisma.ledger.deleteMany({ where: { companyId: company.id } }),
          prisma.fiscalPeriod.deleteMany({ where: { companyId: company.id } }),
          prisma.goodsReceiptLine.deleteMany({ where: { companyId: company.id } }),
          prisma.goodsReceipt.deleteMany({ where: { companyId: company.id } }),
          prisma.purchaseOrderLine.deleteMany({ where: { companyId: company.id } }),
          prisma.purchaseOrder.deleteMany({ where: { companyId: company.id } }),
          prisma.inventoryTransferLine.deleteMany({ where: { companyId: company.id } }),
          prisma.inventoryTransfer.deleteMany({ where: { companyId: company.id } }),
          prisma.stockAdjustmentLine.deleteMany({ where: { companyId: company.id } }),
          prisma.stockAdjustment.deleteMany({ where: { companyId: company.id } }),
          prisma.inventoryTransaction.deleteMany({ where: { companyId: company.id } }),
          prisma.inventoryItem.deleteMany({ where: { companyId: company.id } }),
          prisma.fulfillment.deleteMany({ where: { companyId: company.id } }),
          prisma.salesReturn.deleteMany({ where: { companyId: company.id } }),
          prisma.salesOrderLine.deleteMany({ where: { companyId: company.id } }),
          prisma.salesOrder.deleteMany({ where: { companyId: company.id } }),
          prisma.cartLine.deleteMany({ where: { companyId: company.id } }),
          prisma.cart.deleteMany({ where: { companyId: company.id } }),
          prisma.ecommerceChannel.deleteMany({ where: { companyId: company.id } }),
          prisma.priceListItem.deleteMany({ where: { companyId: company.id } }),
          prisma.priceList.deleteMany({ where: { companyId: company.id } }),
          prisma.product.deleteMany({ where: { companyId: company.id } }),
          prisma.productCategory.deleteMany({ where: { companyId: company.id } }),
          prisma.quoteLine.deleteMany({ where: { companyId: company.id } }),
          prisma.quote.deleteMany({ where: { companyId: company.id } }),
          prisma.opportunityStage.deleteMany({ where: { companyId: company.id } }),
          prisma.lead.deleteMany({ where: { companyId: company.id } }),
          prisma.contact.deleteMany({ where: { companyId: company.id } }),
          prisma.address.deleteMany({ where: { companyId: company.id } }),
          prisma.account.deleteMany({ where: { companyId: company.id } }),
          prisma.timePeriod.deleteMany({ where: { companyId: company.id } }),
          prisma.marketingContact.deleteMany({ where: { companyId: company.id } }),
          prisma.funnelStageDefinition.deleteMany({ where: { companyId: company.id } }),
          prisma.warehouse.deleteMany({ where: { companyId: company.id } }),
          prisma.planVersion.deleteMany({ where: { companyId: company.id } }),
          prisma.note.deleteMany({ where: { companyId: company.id } }),
          prisma.task.deleteMany({ where: { companyId: company.id } }),
          prisma.decision.deleteMany({ where: { companyId: company.id } }),
          prisma.risk.deleteMany({ where: { companyId: company.id } }),
          prisma.entityLink.deleteMany({ where: { companyId: company.id } }),
          prisma.observation.deleteMany({ where: { companyId: company.id } }),
          prisma.queryContext.deleteMany({ where: { companyId: company.id } }),
          prisma.commandDefinition.deleteMany({ where: { companyId: company.id } }),
          prisma.skillDefinition.deleteMany({ where: { companyId: company.id } }),
          prisma.userCompanyMembership.deleteMany({
            where: { companyId: company.id },
          }),
        ]
      : []),
    prisma.revenueSnapshot.deleteMany({ where: { tenantId } }),
    prisma.headcountSnapshot.deleteMany({ where: { tenantId } }),
    prisma.tenantDropletAssignment.deleteMany({ where: { tenantId } }),
  ])
}

export async function seedTenantDemoData(
  prisma: PrismaClient,
  tenantId: string
) {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  if (!tenant) {
    throw new Error(`Tenant ${tenantId} not found`)
  }

  const { vertical, definition } = await seedPlatformCatalog(prisma)

  const company = await prisma.company.upsert({
    where: { slug: tenant.slug },
    update: {
      tenantId,
      key: tenant.slug,
      name: tenant.name,
      legalName: `${tenant.name} Holdings`,
      country: 'US',
      timezone: tenant.defaultTimezone,
      currency: tenant.defaultCurrency,
      status: RecordStatus.ACTIVE,
      verticalId: vertical.id,
      metadataJson: {
        seededDemoData: true,
      },
    },
    create: {
      tenantId,
      key: tenant.slug,
      name: tenant.name,
      legalName: `${tenant.name} Holdings`,
      slug: tenant.slug,
      country: 'US',
      timezone: tenant.defaultTimezone,
      currency: tenant.defaultCurrency,
      status: RecordStatus.ACTIVE,
      verticalId: vertical.id,
      metadataJson: {
        seededDemoData: true,
      },
    },
  })

  await prisma.tenantSettings.upsert({
    where: { tenantId },
    update: {
      configJson: {
        theme: 'system',
        locale: 'en-US',
        seededDemoData: true,
      },
    },
    create: {
      tenantId,
      configJson: {
        theme: 'system',
        locale: 'en-US',
        seededDemoData: true,
      },
    },
  })

  await prisma.tenantShell.upsert({
    where: {
      tenantId_verticalId: {
        tenantId,
        verticalId: vertical.id,
      },
    },
    update: {
      verticalDefinitionId: definition.id,
      name: `${tenant.name} Sales Motion`,
      slug: `${tenant.slug}-sales-motion`,
      configJson: {
        locale: 'en-US',
      },
      status: TenantShellStatus.ACTIVE,
    },
    create: {
      tenantId,
      verticalId: vertical.id,
      verticalDefinitionId: definition.id,
      name: `${tenant.name} Sales Motion`,
      slug: `${tenant.slug}-sales-motion`,
      configJson: {
        locale: 'en-US',
      },
      status: TenantShellStatus.ACTIVE,
    },
  })

  const userNames = [
    ['Avery Chen', 'Platform Lead'],
    ['Jordan Patel', 'Operations Manager'],
    ['Mia Alvarez', 'Sales Admin'],
  ] as const

  await Promise.all(
    userNames.map(([name, title]) =>
      (async () => {
        const email = `${name.toLowerCase().replaceAll(' ', '.')}@${tenant.slug}.birdview.dev`
        const [rawFirstName, ...rest] = name.split(' ')
        const firstName = rawFirstName || 'Platform'
        const lastName = rest.join(' ') || 'User'
        const user = await prisma.user.upsert({
          where: { email },
          update: {
            firstName,
            lastName,
            displayName: name,
            globalRole: title,
            status: UserStatus.ACTIVE,
          },
          create: {
            email,
            firstName,
            lastName,
            displayName: name,
            globalRole: title,
            status: UserStatus.ACTIVE,
          },
        })

        await prisma.userCompanyMembership.upsert({
          where: {
            userId_companyId: {
              userId: user.id,
              companyId: company.id,
            },
          },
          update: {
            role: 'admin',
            status: 'ACTIVE',
          },
          create: {
            userId: user.id,
            companyId: company.id,
            role: 'admin',
            status: 'ACTIVE',
          },
        })

        await prisma.userVerticalMembership.upsert({
          where: {
            userId_verticalId: {
              userId: user.id,
              verticalId: vertical.id,
            },
          },
          update: {
            role: 'operator',
            status: 'ACTIVE',
          },
          create: {
            userId: user.id,
            verticalId: vertical.id,
            role: 'operator',
            status: 'ACTIVE',
          },
        })
      })()
    )
  )

  const people = [] as Array<{ id: string; name: string }>
  for (const [index, name] of [
    'Avery Chen',
    'Jordan Patel',
    'Mia Alvarez',
    'Luca Rossi',
    'Noah Kim',
  ].entries()) {
    const managerId = index === 0 ? null : people[0]?.id ?? null
    const person = await prisma.person.create({
      data: {
        tenantId,
        companyId: company.id,
        managerId,
        name,
        email: `${name.toLowerCase().replaceAll(' ', '.')}@${tenant.slug}.example.com`,
        title: index === 0 ? 'VP Sales' : 'Account Executive',
        role: index === 0 ? 'VP Sales' : 'Account Executive',
        department: 'Sales',
        active: true,
      },
    })
    people.push({ id: person.id, name: person.name })
  }

  const currentMonth = monthStart(new Date())
  const timePeriods = new Map<string, string>()

  for (let offset = 11; offset >= 0; offset -= 1) {
    const periodDate = monthStart(
      new Date(
        Date.UTC(
          currentMonth.getUTCFullYear(),
          currentMonth.getUTCMonth() - offset,
          1
        )
      )
    )

    const year = periodDate.getUTCFullYear()
    const monthNumber = periodDate.getUTCMonth() + 1
    const quarter = Math.floor((monthNumber - 1) / 3) + 1
    const periodKey = `${year}-${String(monthNumber).padStart(2, '0')}`

    const period = await prisma.timePeriod.upsert({
      where: {
        companyId_granularity_periodKey: {
          companyId: company.id,
          granularity: PeriodGranularity.MONTH,
          periodKey,
        },
      },
      update: {
        label: periodKey,
        year,
        quarter,
        month: monthNumber,
        startDate: periodDate,
        endDate: monthStart(
          new Date(Date.UTC(periodDate.getUTCFullYear(), periodDate.getUTCMonth() + 1, 1))
        ),
      },
      create: {
        companyId: company.id,
        granularity: PeriodGranularity.MONTH,
        periodKey,
        label: periodKey,
        year,
        quarter,
        month: monthNumber,
        startDate: periodDate,
        endDate: monthStart(
          new Date(Date.UTC(periodDate.getUTCFullYear(), periodDate.getUTCMonth() + 1, 1))
        ),
      },
    })

    timePeriods.set(periodKey, period.id)
  }

  for (let offset = 11; offset >= 0; offset -= 1) {
    const month = monthStart(
      new Date(
        Date.UTC(
          currentMonth.getUTCFullYear(),
          currentMonth.getUTCMonth() - offset,
          1
        )
      )
    )
    const index = 11 - offset
    const periodKey = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, '0')}`
    const timePeriodId = timePeriods.get(periodKey) ?? null
    const baseRevenue =
      420000 + index * 28000 + (tenant.slug === 'northstar' ? 55000 : 0)
    const baseHeadcount = 28 + index + (tenant.slug === 'northstar' ? 8 : 0)

    await prisma.revenueSnapshot.upsert({
      where: { tenantId_month: { tenantId, month } },
      update: {
        companyId: company.id,
        timePeriodId,
        actualRevenue: baseRevenue,
        forecastRevenue: baseRevenue * 1.06,
        targetRevenue: baseRevenue * 1.12,
        notes:
          index % 3 === 0 ? 'Quarter-end push on enterprise renewals.' : null,
      },
      create: {
        tenantId,
        companyId: company.id,
        timePeriodId,
        month,
        actualRevenue: baseRevenue,
        forecastRevenue: baseRevenue * 1.06,
        targetRevenue: baseRevenue * 1.12,
        notes:
          index % 3 === 0 ? 'Quarter-end push on enterprise renewals.' : null,
      },
    })

    await prisma.headcountSnapshot.upsert({
      where: { tenantId_month: { tenantId, month } },
      update: {
        companyId: company.id,
        timePeriodId,
        actualHeadcount: baseHeadcount,
        forecastHeadcount: baseHeadcount + 2,
        targetHeadcount: baseHeadcount + 3,
        notes:
          index % 4 === 0
            ? 'Hiring plan aligned with regional expansion.'
            : null,
      },
      create: {
        tenantId,
        companyId: company.id,
        timePeriodId,
        month,
        actualHeadcount: baseHeadcount,
        forecastHeadcount: baseHeadcount + 2,
        targetHeadcount: baseHeadcount + 3,
        notes:
          index % 4 === 0
            ? 'Hiring plan aligned with regional expansion.'
            : null,
      },
    })
  }

  const customers = await Promise.all(
    Array.from({ length: 10 }, async (_, index) => {
      const owner = people[index % people.length]!
      const name = `${tenant.name} Customer ${index + 1}`
      return prisma.customer.upsert({
        where: { tenantId_name: { tenantId, name } },
        update: {
          segment: segments[index % segments.length] ?? null,
          geography: geographies[index % geographies.length] ?? null,
          industry: industries[index % industries.length] ?? null,
          status: index < 7 ? CustomerStatus.ACTIVE : CustomerStatus.PROSPECT,
          ownerId: owner.id,
        },
        create: {
          tenantId,
          name,
          segment: segments[index % segments.length] ?? null,
          geography: geographies[index % geographies.length] ?? null,
          industry: industries[index % industries.length] ?? null,
          status: index < 7 ? CustomerStatus.ACTIVE : CustomerStatus.PROSPECT,
          ownerId: owner.id,
        },
      })
    })
  )

  const accounts = await Promise.all(
    customers.map((customer, index) =>
      prisma.account.upsert({
        where: {
          companyId_name: {
            companyId: company.id,
            name: customer.name,
          },
        },
        update: {
          type: AccountType.CUSTOMER,
          legalName: `${customer.name} LLC`,
          segment: customer.segment,
          geography: customer.geography,
          industry: customer.industry,
          ownerPersonId: people[index % people.length]?.id ?? null,
          status: RecordStatus.ACTIVE,
        },
        create: {
          companyId: company.id,
          type: AccountType.CUSTOMER,
          name: customer.name,
          legalName: `${customer.name} LLC`,
          segment: customer.segment,
          geography: customer.geography,
          industry: customer.industry,
          ownerPersonId: people[index % people.length]?.id ?? null,
          status: RecordStatus.ACTIVE,
        },
      })
    )
  )

  await prisma.account.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: `${tenant.name} Supplier 1`,
      },
    },
    update: {
      type: AccountType.SUPPLIER,
      legalName: `${tenant.name} Supplier 1 Ltd`,
      status: RecordStatus.ACTIVE,
    },
    create: {
      companyId: company.id,
      type: AccountType.SUPPLIER,
      name: `${tenant.name} Supplier 1`,
      legalName: `${tenant.name} Supplier 1 Ltd`,
      status: RecordStatus.ACTIVE,
    },
  })

  const contacts = await Promise.all(
    accounts.slice(0, 6).map((account, index) =>
      prisma.contact.upsert({
        where: {
          companyId_accountId_email: {
            companyId: company.id,
            accountId: account.id,
            email: `contact${index + 1}@${account.name.toLowerCase().replaceAll(' ', '')}.example.com`,
          },
        },
        update: {
          name: `Contact ${index + 1}`,
          title: 'Director',
          status: RecordStatus.ACTIVE,
        },
        create: {
          companyId: company.id,
          accountId: account.id,
          name: `Contact ${index + 1}`,
          email: `contact${index + 1}@${account.name.toLowerCase().replaceAll(' ', '')}.example.com`,
          title: 'Director',
          status: RecordStatus.ACTIVE,
        },
      })
    )
  )

  const stages = await Promise.all(
    [
      { name: 'Discovery', probability: 15, won: false, lost: false },
      { name: 'Solution Fit', probability: 35, won: false, lost: false },
      { name: 'Proposal', probability: 60, won: false, lost: false },
      { name: 'Negotiation', probability: 80, won: false, lost: false },
      { name: 'Closed Won', probability: 100, won: true, lost: false },
    ].map((stage, index) =>
      prisma.salesStage.upsert({
        where: { tenantId_name: { tenantId, name: stage.name } },
        update: {
          stageOrder: index,
          defaultProbability: stage.probability,
          isClosedWon: stage.won,
          isClosedLost: stage.lost,
        },
        create: {
          tenantId,
          name: stage.name,
          stageOrder: index,
          defaultProbability: stage.probability,
          isClosedWon: stage.won,
          isClosedLost: stage.lost,
        },
      })
    )
  )

  await Promise.all(
    stages.map((stage) =>
      prisma.opportunityStage.upsert({
        where: {
          companyId_name: {
            companyId: company.id,
            name: stage.name,
          },
        },
        update: {
          stageOrder: stage.stageOrder,
          defaultProbability: stage.defaultProbability,
          isClosedWon: stage.isClosedWon,
          isClosedLost: stage.isClosedLost,
        },
        create: {
          companyId: company.id,
          name: stage.name,
          stageOrder: stage.stageOrder,
          defaultProbability: stage.defaultProbability,
          isClosedWon: stage.isClosedWon,
          isClosedLost: stage.isClosedLost,
        },
      })
    )
  )

  for (let index = 0; index < 20; index += 1) {
    const customer = customers[index % customers.length]!
    const account = accounts[index % accounts.length]!
    const contact = contacts[index % Math.max(contacts.length, 1)] ?? null
    const owner = people[index % people.length]!
    const stage = stages[index % 4]!
    const name = `${customer.name} Expansion ${index + 1}`
    const opportunity = await prisma.opportunity.create({
      data: {
        tenantId,
        companyId: company.id,
        accountId: account.id,
        primaryContactId: contact?.id ?? null,
        customerId: customer.id,
        ownerId: owner.id,
        name,
        stageId: stage.id,
        amount: 45000 + index * 8500,
        probability: stage.defaultProbability ?? 50,
        expectedCloseDate: new Date(
          Date.UTC(
            currentMonth.getUTCFullYear(),
            currentMonth.getUTCMonth() + (index % 5),
            15
          )
        ),
        source: index % 2 === 0 ? 'Outbound' : 'Partner',
        status:
          index % 7 === 0 ? OpportunityStatus.WON : OpportunityStatus.OPEN,
      },
    })

    for (let eventIndex = 0; eventIndex < 3; eventIndex += 1) {
      const toStage = stages[Math.min(eventIndex, stages.length - 1)]
      const fromStage = eventIndex === 0 ? null : stages[eventIndex - 1]!
      const eventDate = new Date(
        Date.UTC(
          currentMonth.getUTCFullYear(),
          currentMonth.getUTCMonth() - (2 - eventIndex),
          5 + index
        )
      )

      await prisma.opportunityStageEvent.create({
        data: {
          tenantId,
          companyId: company.id,
          opportunityId: opportunity.id,
          fromStageId: fromStage?.id ?? null,
          toStageId: toStage!.id,
          eventDate,
          changedById: owner.id,
        },
      })
    }
  }

  for (let index = 0; index < 20; index += 1) {
    const customer = customers[index % customers.length]!
    const orderDate = new Date(
      Date.UTC(
        currentMonth.getUTCFullYear(),
        currentMonth.getUTCMonth() - (index % 10),
        7 + index
      )
    )

    await prisma.order.upsert({
      where: {
        tenantId_orderNumber: {
          tenantId,
          orderNumber: `${tenant.slug.toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
        },
      },
      update: {
        customerId: customer.id,
        orderDate,
        amount: 18000 + index * 7200,
        status: index % 5 === 0 ? OrderStatus.INVOICED : OrderStatus.BOOKED,
        productLine: productLines[index % productLines.length] ?? null,
        notes: index % 6 === 0 ? 'Linked to multi-region rollout.' : null,
      },
      create: {
        tenantId,
        customerId: customer.id,
        orderNumber: `${tenant.slug.toUpperCase()}-${String(index + 1).padStart(4, '0')}`,
        orderDate,
        amount: 18000 + index * 7200,
        status: index % 5 === 0 ? OrderStatus.INVOICED : OrderStatus.BOOKED,
        productLine: productLines[index % productLines.length] ?? null,
        notes: index % 6 === 0 ? 'Linked to multi-region rollout.' : null,
      },
    })
  }

  const productCategory = await prisma.productCategory.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: 'Platform',
      },
    },
    update: {},
    create: {
      companyId: company.id,
      name: 'Platform',
    },
  })

  const products = await Promise.all(
    Array.from({ length: 4 }, (_, index) =>
      prisma.product.upsert({
        where: {
          companyId_sku: {
            companyId: company.id,
            sku: `${tenant.slug.toUpperCase()}-SKU-${index + 1}`,
          },
        },
        update: {
          name: `Product ${index + 1}`,
          categoryId: productCategory.id,
          brand: 'Birdview',
          status: RecordStatus.ACTIVE,
          productType: ProductType.PHYSICAL,
          defaultUom: 'unit',
        },
        create: {
          companyId: company.id,
          sku: `${tenant.slug.toUpperCase()}-SKU-${index + 1}`,
          name: `Product ${index + 1}`,
          categoryId: productCategory.id,
          brand: 'Birdview',
          status: RecordStatus.ACTIVE,
          productType: ProductType.PHYSICAL,
          defaultUom: 'unit',
        },
      })
    )
  )

  const priceList = await prisma.priceList.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: 'Standard',
      },
    },
    update: {
      currency: tenant.defaultCurrency,
      status: RecordStatus.ACTIVE,
    },
    create: {
      companyId: company.id,
      name: 'Standard',
      currency: tenant.defaultCurrency,
      status: RecordStatus.ACTIVE,
    },
  })

  await Promise.all(
    products.map((product, index) =>
      prisma.priceListItem.upsert({
        where: {
          companyId_priceListId_productId: {
            companyId: company.id,
            priceListId: priceList.id,
            productId: product.id,
          },
        },
        update: {
          unitPrice: 1200 + index * 350,
        },
        create: {
          companyId: company.id,
          priceListId: priceList.id,
          productId: product.id,
          unitPrice: 1200 + index * 350,
        },
      })
    )
  )

  const warehouse = await prisma.warehouse.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: 'Main Warehouse',
      },
    },
    update: {
      code: 'MAIN',
      status: RecordStatus.ACTIVE,
    },
    create: {
      companyId: company.id,
      name: 'Main Warehouse',
      code: 'MAIN',
      status: RecordStatus.ACTIVE,
    },
  })

  await Promise.all(
    products.map((product, index) =>
      prisma.inventoryItem.upsert({
        where: {
          companyId_productId_warehouseId: {
            companyId: company.id,
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
        update: {
          onHandQty: 100 + index * 25,
          reservedQty: 8 + index,
          availableQty: 92 + index * 24,
          reorderPoint: 20,
          reorderQty: 50,
        },
        create: {
          companyId: company.id,
          productId: product.id,
          warehouseId: warehouse.id,
          onHandQty: 100 + index * 25,
          reservedQty: 8 + index,
          availableQty: 92 + index * 24,
          reorderPoint: 20,
          reorderQty: 50,
        },
      })
    )
  )

  const ecommerceChannel = await prisma.ecommerceChannel.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: 'Website',
      },
    },
    update: {
      type: EcommerceChannelType.WEBSITE,
      status: RecordStatus.ACTIVE,
    },
    create: {
      companyId: company.id,
      name: 'Website',
      type: EcommerceChannelType.WEBSITE,
      status: RecordStatus.ACTIVE,
    },
  })

  const canonicalOrder = await prisma.salesOrder.upsert({
    where: {
      companyId_orderNumber: {
        companyId: company.id,
        orderNumber: `${tenant.slug.toUpperCase()}-SO-0001`,
      },
    },
    update: {
      accountId: accounts[0]!.id,
      opportunityId: null,
      channelId: ecommerceChannel.id,
      orderDate: currentMonth,
      status: SalesOrderStatus.CONFIRMED,
      subtotalAmount: 3400,
      taxAmount: 340,
      shippingAmount: 90,
      discountAmount: 120,
      totalAmount: 3710,
    },
    create: {
      companyId: company.id,
      accountId: accounts[0]!.id,
      channelId: ecommerceChannel.id,
      orderNumber: `${tenant.slug.toUpperCase()}-SO-0001`,
      orderDate: currentMonth,
      status: SalesOrderStatus.CONFIRMED,
      subtotalAmount: 3400,
      taxAmount: 340,
      shippingAmount: 90,
      discountAmount: 120,
      totalAmount: 3710,
    },
  })

  await prisma.salesOrderLine.upsert({
    where: {
      companyId_salesOrderId_description: {
        companyId: company.id,
        salesOrderId: canonicalOrder.id,
        description: 'Starter bundle',
      },
    },
    update: {
      productId: products[0]!.id,
      sku: products[0]!.sku,
      quantity: 2,
      unitPrice: 1700,
      discountAmount: 120,
      taxAmount: 340,
      lineTotalAmount: 3620,
    },
    create: {
      companyId: company.id,
      salesOrderId: canonicalOrder.id,
      productId: products[0]!.id,
      sku: products[0]!.sku,
      description: 'Starter bundle',
      quantity: 2,
      unitPrice: 1700,
      discountAmount: 120,
      taxAmount: 340,
      lineTotalAmount: 3620,
    },
  })

  await prisma.fiscalPeriod.upsert({
    where: {
      companyId_periodCode: {
        companyId: company.id,
        periodCode: `${currentMonth.getUTCFullYear()}-01`,
      },
    },
    update: {
      year: currentMonth.getUTCFullYear(),
      startDate: new Date(Date.UTC(currentMonth.getUTCFullYear(), 0, 1)),
      endDate: new Date(Date.UTC(currentMonth.getUTCFullYear(), 11, 31)),
      status: FiscalPeriodStatus.OPEN,
    },
    create: {
      companyId: company.id,
      year: currentMonth.getUTCFullYear(),
      periodCode: `${currentMonth.getUTCFullYear()}-01`,
      startDate: new Date(Date.UTC(currentMonth.getUTCFullYear(), 0, 1)),
      endDate: new Date(Date.UTC(currentMonth.getUTCFullYear(), 11, 31)),
      status: FiscalPeriodStatus.OPEN,
    },
  })

  const ledger = await prisma.ledger.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: 'General Ledger',
      },
    },
    update: {
      currency: tenant.defaultCurrency,
      type: LedgerType.GENERAL,
    },
    create: {
      companyId: company.id,
      name: 'General Ledger',
      currency: tenant.defaultCurrency,
      type: LedgerType.GENERAL,
    },
  })

  await prisma.ledgerAccount.upsert({
    where: {
      companyId_ledgerId_accountCode: {
        companyId: company.id,
        ledgerId: ledger.id,
        accountCode: '4000',
      },
    },
    update: {
      accountName: 'Revenue',
      accountType: LedgerAccountType.REVENUE,
      active: true,
    },
    create: {
      companyId: company.id,
      ledgerId: ledger.id,
      accountCode: '4000',
      accountName: 'Revenue',
      accountType: LedgerAccountType.REVENUE,
      active: true,
    },
  })

  await prisma.ledgerAccount.upsert({
    where: {
      companyId_ledgerId_accountCode: {
        companyId: company.id,
        ledgerId: ledger.id,
        accountCode: '1000',
      },
    },
    update: {
      accountName: 'Cash',
      accountType: LedgerAccountType.ASSET,
      active: true,
    },
    create: {
      companyId: company.id,
      ledgerId: ledger.id,
      accountCode: '1000',
      accountName: 'Cash',
      accountType: LedgerAccountType.ASSET,
      active: true,
    },
  })

  const metricDefinition = await prisma.metricDefinition.upsert({
    where: {
      companyId_key: {
        companyId: company.id,
        key: 'monthly-revenue',
      },
    },
    update: {
      scope: MetricScope.TENANT,
      name: 'Monthly Revenue',
      category: 'Finance',
      unit: MetricUnit.CURRENCY,
      aggregationMethod: MetricAggregationMethod.SUM,
      entityType: 'RevenueSnapshot',
    },
    create: {
      companyId: company.id,
      scope: MetricScope.TENANT,
      key: 'monthly-revenue',
      name: 'Monthly Revenue',
      category: 'Finance',
      unit: MetricUnit.CURRENCY,
      aggregationMethod: MetricAggregationMethod.SUM,
      entityType: 'RevenueSnapshot',
    },
  })

  const metricSeries = await prisma.metricSeries.create({
    data: {
      companyId: company.id,
      metricDefinitionId: metricDefinition.id,
      dimensionJson: { source: 'seed' },
      status: RecordStatus.ACTIVE,
    },
  })

  await Promise.all(
    Array.from(timePeriods.entries()).map(([_periodKey, timePeriodId], index) =>
      prisma.metricPoint.create({
        data: {
          companyId: company.id,
          metricSeriesId: metricSeries.id,
          timePeriodId,
          scenario: MetricScenario.ACTUAL,
          value: 420000 + index * 28000,
          version: 'v1',
          source: 'seed',
        },
      })
    )
  )

  const marketingWorkspace = await prisma.marketingWorkspace.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: 'Growth',
      },
    },
    update: { status: RecordStatus.ACTIVE },
    create: {
      companyId: company.id,
      name: 'Growth',
      status: RecordStatus.ACTIVE,
    },
  })

  const campaign = await prisma.marketingCampaign.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: 'Spring Launch',
      },
    },
    update: {
      workspaceId: marketingWorkspace.id,
      channel: 'paid-social',
      status: RecordStatus.ACTIVE,
    },
    create: {
      companyId: company.id,
      workspaceId: marketingWorkspace.id,
      name: 'Spring Launch',
      objective: 'Pipeline generation',
      channel: 'paid-social',
      budget: 15000,
      status: RecordStatus.ACTIVE,
    },
  })

  await prisma.contentAsset.upsert({
    where: {
      companyId_title: {
        companyId: company.id,
        title: 'Spring Launch LP Copy',
      },
    },
    update: {
      workspaceId: marketingWorkspace.id,
      campaignId: campaign.id,
      type: MarketingAssetType.LANDING_PAGE_COPY,
      status: RecordStatus.ACTIVE,
    },
    create: {
      companyId: company.id,
      workspaceId: marketingWorkspace.id,
      campaignId: campaign.id,
      type: MarketingAssetType.LANDING_PAGE_COPY,
      title: 'Spring Launch LP Copy',
      status: RecordStatus.ACTIVE,
    },
  })

  const marketingContact = await prisma.marketingContact.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: `lead@${tenant.slug}.marketing.example.com`,
      },
    },
    update: {
      accountId: accounts[0]!.id,
      firstName: 'Taylor',
      lastName: 'Morgan',
      status: RecordStatus.ACTIVE,
    },
    create: {
      companyId: company.id,
      accountId: accounts[0]!.id,
      email: `lead@${tenant.slug}.marketing.example.com`,
      firstName: 'Taylor',
      lastName: 'Morgan',
      source: 'campaign',
      status: RecordStatus.ACTIVE,
    },
  })

  const marketingLead = await prisma.marketingLead.create({
    data: {
      companyId: company.id,
      contactId: marketingContact.id,
      campaignId: campaign.id,
      source: 'campaign',
      score: 72,
      lifecycleStage: 'mql',
      status: RecordStatus.ACTIVE,
    },
  })

  const funnelStage = await prisma.funnelStageDefinition.upsert({
    where: {
      companyId_name: {
        companyId: company.id,
        name: 'MQL',
      },
    },
    update: {
      stageOrder: 1,
    },
    create: {
      companyId: company.id,
      name: 'MQL',
      stageOrder: 1,
      category: 'marketing',
    },
  })

  await prisma.funnelEvent.create({
    data: {
      companyId: company.id,
      contactId: marketingContact.id,
      leadId: marketingLead.id,
      campaignId: campaign.id,
      funnelStageId: funnelStage.id,
      eventDate: currentMonth,
      value: 1,
      metadataJson: { source: 'seed' },
    },
  })

  const document = await prisma.document.create({
    data: {
      companyId: company.id,
      type: 'brief',
      title: 'Q2 Operating Brief',
      source: 'seed',
      status: RecordStatus.ACTIVE,
      storageRef: `/docs/${tenant.slug}/q2-brief`,
    },
  })

  const meeting = await prisma.meeting.create({
    data: {
      companyId: company.id,
      title: 'Weekly Revenue Review',
      date: currentMonth,
      type: 'operating-review',
      status: RecordStatus.ACTIVE,
    },
  })

  await prisma.transcript.create({
    data: {
      companyId: company.id,
      meetingId: meeting.id,
      documentId: document.id,
      content: 'Seed transcript for Birdview canonical operating knowledge.',
      language: 'en',
    },
  })

  await prisma.note.create({
    data: {
      companyId: company.id,
      entityType: 'Account',
      entityId: accounts[0]!.id,
      authorPersonId: people[0]!.id,
      content: 'Expansion conversation is trending positively.',
    },
  })

  await prisma.task.create({
    data: {
      companyId: company.id,
      title: 'Review expansion plan',
      description: 'Validate the next renewal proposal.',
      ownerPersonId: people[1]!.id,
      dueDate: new Date(Date.UTC(currentMonth.getUTCFullYear(), currentMonth.getUTCMonth(), 20)),
      status: RecordStatus.ACTIVE,
      relatedEntityType: 'Opportunity',
      relatedEntityId: accounts[0]!.id,
    },
  })

  await prisma.decision.create({
    data: {
      companyId: company.id,
      title: 'Expand EU inventory',
      description: 'Increase stock for the Lisbon region.',
      decisionDate: currentMonth,
      ownerPersonId: people[0]!.id,
      relatedEntityType: 'Warehouse',
      relatedEntityId: warehouse.id,
    },
  })

  await prisma.risk.create({
    data: {
      companyId: company.id,
      title: 'Supplier lead time volatility',
      description: 'Potential 2-week delay on hardware replenishment.',
      severity: 'medium',
      probability: 'medium',
      ownerPersonId: people[2]!.id,
      status: RecordStatus.ACTIVE,
    },
  })

  await prisma.entityLink.create({
    data: {
      companyId: company.id,
      fromEntityType: 'Account',
      fromEntityId: accounts[0]!.id,
      toEntityType: 'Opportunity',
      toEntityId: (await prisma.opportunity.findFirstOrThrow({ where: { companyId: company.id } })).id,
      relationType: 'related_to',
      confidence: 0.92,
    },
  })

  await prisma.observation.create({
    data: {
      companyId: company.id,
      subjectEntityType: 'MetricSeries',
      subjectEntityId: metricSeries.id,
      kind: 'trend',
      text: 'Revenue is growing steadily across the seeded monthly periods.',
      sourceRefsJson: ['seed'],
      confidence: 0.88,
    },
  })

  await prisma.queryContext.create({
    data: {
      companyId: company.id,
      userId: (await prisma.user.findFirstOrThrow({ where: { companyMemberships: { some: { companyId: company.id } } } })).id,
      contextJson: { launchDate: '2026-03-01', companySlug: tenant.slug },
    },
  })

  await prisma.commandDefinition.create({
    data: {
      companyId: company.id,
      scope: 'TENANT',
      scopeRefId: company.id,
      command: '/company-overview',
      aliasesJson: ['/overview'],
      helpText: 'Open the company overview droplet context.',
      handlerType: 'droplet',
      handlerConfigJson: { target: 'revenue-explorer' },
    },
  })

  await prisma.skillDefinition.create({
    data: {
      companyId: company.id,
      scope: 'TENANT',
      scopeRefId: company.id,
      key: `${tenant.slug}-summarizer`,
      name: `${tenant.name} Summarizer`,
      purpose: 'Summarize the seeded canonical company model.',
      configJson: { style: 'concise' },
      active: true,
    },
  })

  const catalogDroplets = await prisma.verticalDroplet.findMany({
    where: {
      verticalId: vertical.id,
      status: VerticalDropletStatus.PUBLISHED,
    },
    orderBy: { name: 'asc' },
  })

  for (const droplet of catalogDroplets) {
    const definition = droplet.dropletDefinitionJson as Prisma.JsonObject
    const placement =
      typeof definition.placement === 'string' ? definition.placement : null

    await prisma.tenantDropletAssignment.upsert({
      where: {
        tenantId_verticalDropletId: {
          tenantId,
          verticalDropletId: droplet.id,
        },
      },
      update: {
        companyId: company.id,
        placement,
        configOverrideJson: {},
        active: true,
      },
      create: {
        tenantId,
        companyId: company.id,
        verticalDropletId: droplet.id,
        placement,
        configOverrideJson: {},
        active: true,
      },
    })
  }

  await prisma.tenant.update({
    where: { id: tenantId },
    data: { status: TenantStatus.ACTIVE },
  })
}
