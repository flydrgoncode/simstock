# Birdview

Birdview is now a multi-surface platform with a vertical-aware droplet catalog.

Surfaces:

- Birdview Runtime: `/`
- Mission Control: `/mission-control`
- Droplet Studio: `/droplet-studio`
- Home Control: `/backoffice`

Core hierarchy:

- Platform
- Vertical
- Tenant
- User

Canonical model groups:

- Platform / Mission Control
- Identity & Organization
- External Parties
- Commercial Flow
- Ecommerce & Orders
- Product & Pricing
- Inventory & Warehousing
- Suppliers & Procurement
- Finance & Ledger
- Metrics / Planning / Performance
- Marketing Operating Model
- Operational Knowledge
- AI-native Semantics
- Droplets / Runtime

## Architecture

Birdview uses:

- React + TypeScript + Vite
- Tauri-ready desktop shell
- Express + TypeScript REST API
- Prisma ORM
- PostgreSQL
- Zod validation
- Zustand state

Platform concepts:

- `Vertical`
- `Skill`
- `VerticalSkill`
- `Company`
- `User`
- `UserCompanyMembership`
- `UserVerticalMembership`
- `LLMProviderConfig`
- `LLMModelConfig`
- `VerticalLLMConfig`
- `EmailProviderConfig`
- `EmailTemplate`
- `VerticalDefinition`
- `VerticalDroplet`
- `TenantShell`
- `TenantDropletAssignment`

Tenant business data remains:

- `Person`
- `RevenueSnapshot`
- `HeadcountSnapshot`
- `Customer`
- `Order`
- `Opportunity`
- `SalesStage`
- `OpportunityStageEvent`

Canonical company-rooted model adds:

- `OrgUnit`, `Team`
- `Account`, `Contact`, `Address`, `Lead`
- `OpportunityStage`, `Quote`, `QuoteLine`
- `EcommerceChannel`, `Cart`, `CartLine`, `SalesOrder`, `SalesOrderLine`, `Fulfillment`, `SalesReturn`
- `ProductCategory`, `Product`, `PriceList`, `PriceListItem`
- `Warehouse`, `InventoryItem`, `InventoryTransaction`, `StockAdjustment`, `StockAdjustmentLine`, `InventoryTransfer`, `InventoryTransferLine`
- `PurchaseOrder`, `PurchaseOrderLine`, `GoodsReceipt`, `GoodsReceiptLine`
- `FiscalPeriod`, `Ledger`, `LedgerAccount`, `JournalEntry`, `JournalEntryLine`, `Invoice`, `InvoiceLine`, `Payment`, `Expense`
- `TimePeriod`, `MetricDefinition`, `MetricSeries`, `MetricPoint`, `ForecastModel`, `PlanVersion`
- `MarketingWorkspace`, `MarketingCampaign`, `ContentAsset`, `SocialPost`, `LandingPage`, `MarketingContact`, `MarketingLead`, `FunnelStageDefinition`, `FunnelEvent`
- `Document`, `Meeting`, `Transcript`, `Note`, `Task`, `Decision`, `Risk`
- `EntityLink`, `Observation`, `QueryContext`, `CommandDefinition`, `SkillDefinition`

## Setup

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL`
3. Install dependencies
4. Generate Prisma client
5. Apply migrations
6. Seed demo data
7. Start the app

```bash
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Web links:

- Runtime: [http://localhost:1420](http://localhost:1420)
- Mission Control: [http://localhost:1420/mission-control](http://localhost:1420/mission-control)
- Mission Control / Verticals: [http://localhost:1420/mission-control/verticals](http://localhost:1420/mission-control/verticals)
- Mission Control / Skills: [http://localhost:1420/mission-control/skills](http://localhost:1420/mission-control/skills)
- Mission Control / Companies: [http://localhost:1420/mission-control/companies](http://localhost:1420/mission-control/companies)
- Mission Control / Users: [http://localhost:1420/mission-control/users](http://localhost:1420/mission-control/users)
- Mission Control / LLM Config: [http://localhost:1420/mission-control/config/llms](http://localhost:1420/mission-control/config/llms)
- Mission Control / Email Config: [http://localhost:1420/mission-control/config/email](http://localhost:1420/mission-control/config/email)
- Droplet Studio: [http://localhost:1420/droplet-studio](http://localhost:1420/droplet-studio)
- Home Control: [http://localhost:1420/backoffice](http://localhost:1420/backoffice)
- API health: [http://127.0.0.1:3011/api/health](http://127.0.0.1:3011/api/health)

## Tauri

Run the desktop shell:

```bash
PATH="$HOME/.cargo/bin:$PATH" npm run tauri:dev
```

Build the desktop app:

```bash
PATH="$HOME/.cargo/bin:$PATH" npm run tauri:build
```

## Seeded Platform

The seed creates:

- 1 vertical: `sales-motion`
- 1 additional vertical: `commerce-ops`
- 3 platform skills
- 1 published vertical definition
- 5 published vertical droplets
- 2 LLM providers and seeded models
- 1 vertical LLM override
- 1 email provider and 1 email template
- 2 tenants
- 2 linked companies
- 2 active tenant shells
- active tenant droplet assignments for each tenant
- global users with company and vertical memberships
- tenant org-chart people
- sales-motion demo data
- canonical company periods, accounts, products, inventory, finance, marketing, knowledge, and AI-semantic records

Seeded droplet commands:

- `/customers`
- `/orders`
- `/revenue`
- `/headcount`
- `/pipeline`

Global commands:

- `/help`
- `/droplet list`
- `/open droplet <name>`

## API Surface

Platform:

- `GET /api/verticals`
- `POST /api/verticals`
- `PATCH /api/verticals/:id`
- `DELETE /api/verticals/:id`
- `GET /api/skills`
- `POST /api/skills`
- `PATCH /api/skills/:id`
- `DELETE /api/skills/:id`
- `POST /api/vertical-skills`
- `PATCH /api/vertical-skills/:id`
- `DELETE /api/vertical-skills/:id`
- `GET /api/companies`
- `POST /api/companies`
- `PATCH /api/companies/:id`
- `DELETE /api/companies/:id`
- `GET /api/vertical-definitions`
- `POST /api/vertical-definitions`
- `PATCH /api/vertical-definitions/:id`
- `POST /api/vertical-definitions/:id/publish`
- `DELETE /api/vertical-definitions/:id`
- `GET /api/tenants`
- `POST /api/tenants`
- `GET /api/tenants/:tenantId`
- `PATCH /api/tenants/:tenantId`
- `DELETE /api/tenants/:tenantId`
- `GET /api/tenant-shells`
- `POST /api/tenant-shells`
- `PATCH /api/tenant-shells/:id`
- `DELETE /api/tenant-shells/:id`
- `GET /api/tenants/:tenantId/shell`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`
- `DELETE /api/users/:id`
- `GET /api/tenants/:tenantId/users`
- `POST /api/user-company-memberships`
- `PATCH /api/user-company-memberships/:id`
- `DELETE /api/user-company-memberships/:id`
- `POST /api/user-vertical-memberships`
- `PATCH /api/user-vertical-memberships/:id`
- `DELETE /api/user-vertical-memberships/:id`
- `GET /api/llm-provider-configs`
- `POST /api/llm-provider-configs`
- `PATCH /api/llm-provider-configs/:id`
- `DELETE /api/llm-provider-configs/:id`
- `GET /api/llm-model-configs`
- `POST /api/llm-model-configs`
- `PATCH /api/llm-model-configs/:id`
- `DELETE /api/llm-model-configs/:id`
- `GET /api/vertical-llm-configs`
- `POST /api/vertical-llm-configs`
- `PATCH /api/vertical-llm-configs/:id`
- `DELETE /api/vertical-llm-configs/:id`
- `GET /api/email-provider-configs`
- `POST /api/email-provider-configs`
- `PATCH /api/email-provider-configs/:id`
- `DELETE /api/email-provider-configs/:id`
- `GET /api/email-templates`
- `POST /api/email-templates`
- `PATCH /api/email-templates/:id`
- `DELETE /api/email-templates/:id`
- `GET /api/tenants/:tenantId/company`
- `GET /api/tenants/:tenantId/runtime-context`
- `GET /api/tenants/:tenantId/time-periods`
- `GET /api/tenants/:tenantId/metrics/overview`

Droplet catalog and assignment:

- `GET /api/verticals/:verticalId/droplets`
- `POST /api/verticals/:verticalId/droplets`
- `PATCH /api/droplets/:id`
- `DELETE /api/droplets/:id`
- `POST /api/droplets/:id/publish`
- `POST /api/droplets/:id/deprecate`
- `GET /api/tenants/:tenantId/droplets`
- `POST /api/tenants/:tenantId/droplets/:id/activate`
- `POST /api/tenants/:tenantId/droplets/:id/deactivate`
- `PATCH /api/tenant-droplets/:id`
- `GET /api/tenants/:tenantId/droplets/active`
- `POST /api/tenants/:tenantId/droplets/preview`
- `POST /api/tenants/:tenantId/explore`
- `POST /api/tenants/:tenantId/command`

Tenant business data:

- `GET/POST /api/tenants/:tenantId/revenue`
- `PATCH/DELETE /api/revenue/:id`
- `GET/POST /api/tenants/:tenantId/headcount`
- `PATCH/DELETE /api/headcount/:id`
- `GET/POST /api/tenants/:tenantId/customers`
- `PATCH/DELETE /api/customers/:id`
- `GET/POST /api/tenants/:tenantId/orders`
- `PATCH/DELETE /api/orders/:id`
- `GET/POST /api/tenants/:tenantId/stages`
- `PATCH/DELETE /api/stages/:id`
- `GET/POST /api/tenants/:tenantId/opportunities`
- `PATCH/DELETE /api/opportunities/:id`
- `GET/POST /api/tenants/:tenantId/opportunity-stage-events`
- `GET/POST /api/tenants/:tenantId/people`
- `PATCH/DELETE /api/people/:id`

Analytics and demo:

- `GET /api/tenants/:tenantId/analytics/revenue-summary`
- `GET /api/tenants/:tenantId/analytics/pipeline-summary`
- `GET /api/tenants/:tenantId/analytics/customer-summary`
- `POST /api/tenants/:tenantId/demo/seed`
- `POST /api/tenants/:tenantId/demo/reset`

## Notes

- In Birdview, `manage` means full CRUD unless a surface explicitly says otherwise.
- Home Control does not create droplets from scratch.
- Runtime consumes only published and active tenant droplet assignments.
- Every catalog droplet has a command, aliases, and help text.
