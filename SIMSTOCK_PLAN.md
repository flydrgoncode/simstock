# SimStock - Product and Technical Plan

## 1. Objective

Build a euro-denominated stock market simulation app focused on investing in ETFs that track the top 10 aggregate indices across:

- Europe
- United States
- Asia
- China
- Brazil
- India

The app is a simulation platform, not a brokerage. Users can inspect index performance, simulate ETF trades, automate buy/sell actions via rules, and use an AI agent to recommend or execute portfolio actions in a controlled environment.

## 2. Core Product Pillars

### 2.1 Market Explorer

Expose the top 10 tracked indices/aggregates with:

- Current value
- Daily change
- Historical chart
- Time filters:
  - Intraday
  - 1 week
  - 1 month
  - Last 12 months
  - YTD
- Manual "Update indices now" button

### 2.2 Simulation Wallet

Each user has a wallet in EUR with:

- Configurable starting budget
- Cash balance
- ETF positions
- Average cost
- Realized gains/losses
- Unrealized gains/losses
- Transaction history

The user can simulate:

- Buy ETF units
- Sell ETF units
- Transaction fees per trade

### 2.3 Portfolio Dashboard

Dashboard showing:

- Total portfolio value
- Cash vs invested allocation
- Daily P/L
- Total P/L
- Realized vs unrealized gains/losses
- Best and worst performing ETF positions
- Allocation by region/index

### 2.4 Rules Engine

Allow users/admins to define automation rules such as:

- Buy ETF if price drops X% in Y days
- Sell ETF if gain exceeds X%
- Stop-loss at X%
- Rebalance portfolio monthly
- Buy fixed EUR amount every week

Rules can run in:

- Suggestion mode
- Auto-execution mode

### 2.5 AI Market Agent

Agent analyzes market data and decides whether to:

- Buy
- Sell
- Hold

Agent must be configurable from backoffice:

- LLM provider
- Model name
- Endpoint/local host
- Temperature
- Max tokens
- Analysis cadence
- Risk profile
- Max capital per trade
- Max open positions
- Whether agent can auto-execute or only recommend

### 2.6 Backoffice

Admin area to configure:

- LLM provider and local/remote endpoint
- Supported models
- Market data refresh settings
- Transaction fee
- Wallet defaults
- Agent parameters
- Rule execution parameters
- ETF to index mappings

## 3. Index Coverage Proposal

To avoid ambiguity, use curated benchmark indices and map each one to a tradeable ETF used in simulation.

Suggested list of 10 tracked instruments:

1. STOXX Europe 600
2. EURO STOXX 50
3. S&P 500
4. Nasdaq-100
5. Dow Jones Industrial Average
6. MSCI Asia Pacific
7. CSI 300
8. Hang Seng
9. Bovespa
10. Nifty 50

Notes:

- The user asked for regional coverage plus top aggregates. This set gives strong regional representation while keeping the tracked universe manageable.
- Each index should have one default ETF proxy for trading simulation.
- ETF quotes should be stored separately from index quotes because the user buys the ETF, not the raw index.

## 4. Functional Flows

### 4.1 View Indices

1. User opens dashboard
2. App fetches latest index and ETF snapshots
3. User selects region/index
4. User changes chart range: day, week, month, 12m, YTD
5. User optionally triggers manual refresh

### 4.2 Simulate Buy

1. User selects an index
2. App shows mapped ETF
3. User enters EUR amount or number of units
4. App calculates estimated fee
5. App executes simulated trade
6. Wallet and portfolio metrics update

### 4.3 Simulate Sell

1. User opens held position
2. User chooses units or % to sell
3. App calculates fee and realized P/L
4. Position and wallet update after confirmation

### 4.4 Automated Rule Execution

1. Scheduler triggers rule engine
2. Rule engine evaluates signals against latest market data
3. Matching actions create:
   - Recommendation
   - Or simulated order
4. Action is logged with reason and traceability

### 4.5 AI Agent Run

1. Agent receives market context, portfolio state, and risk config
2. LLM returns structured decision per ETF: buy, sell, hold
3. App validates decision against guardrails
4. App stores rationale and optionally executes trade

## 5. Recommended Architecture

## 5.1 Frontend

Recommendation:

- Next.js
- TypeScript
- Tailwind CSS
- Recharts or Apache ECharts for historical charts
- TanStack Query for data fetching/cache

Key pages:

- `/` Market dashboard
- `/wallet`
- `/portfolio`
- `/rules`
- `/agent`
- `/backoffice`
- `/history`

## 5.2 Backend

Recommendation:

- Next.js API routes or standalone NestJS backend
- TypeScript
- PostgreSQL
- Prisma ORM
- Background jobs via BullMQ + Redis

Modules:

- Market Data Service
- Portfolio Service
- Trading Simulation Engine
- Rules Engine
- AI Agent Service
- Backoffice Config Service
- Scheduler/Jobs

## 5.3 Data Sources

Need two data layers:

- Index market data
- ETF market data

Options:

- Paid APIs for reliable intraday and historical coverage
- Free providers for prototype, with lower guarantees

Recommendation by phase:

- Phase 1 prototype: mock/hybrid market data with daily snapshots
- Phase 2 MVP: real historical daily data + limited intraday refresh
- Phase 3: near-real-time refresh for supported instruments

## 6. Suggested Domain Model

### 6.1 Main Entities

- User
- Wallet
- WalletTransaction
- Position
- MarketIndex
- ETF
- PriceSnapshot
- TradeOrder
- Rule
- RuleExecution
- AgentConfig
- AgentRun
- ModelProviderConfig
- AppSetting

### 6.2 Table Sketch

#### User

- id
- email
- name
- role
- createdAt

#### Wallet

- id
- userId
- baseCurrency = EUR
- initialBudget
- cashBalance
- createdAt

#### MarketIndex

- id
- name
- symbol
- region
- currency
- provider
- active

#### ETF

- id
- marketIndexId
- name
- ticker
- exchange
- currency
- isin
- active

#### PriceSnapshot

- id
- assetType
- assetId
- interval
- timestamp
- open
- high
- low
- close
- volume

#### Position

- id
- walletId
- etfId
- units
- averageCost
- currentPrice
- marketValue
- realizedPnL
- unrealizedPnL

#### TradeOrder

- id
- walletId
- etfId
- side
- units
- unitPrice
- grossAmount
- feeAmount
- netAmount
- source
- sourceRef
- status
- executedAt

#### Rule

- id
- userId
- name
- enabled
- mode
- conditionType
- conditionConfig
- actionType
- actionConfig
- priority

#### AgentConfig

- id
- providerType
- modelName
- endpointUrl
- apiKeyRef
- isLocalModel
- temperature
- maxTokens
- riskProfile
- maxTradeEur
- maxPortfolioExposurePct
- autoExecute

#### AgentRun

- id
- agentConfigId
- startedAt
- completedAt
- portfolioSnapshot
- marketSnapshot
- llmInput
- llmOutput
- decisionSummary
- executionStatus

## 7. Trading Simulation Rules

Simulation engine rules:

- Base currency is EUR
- If ETF trades in non-EUR, convert using latest FX rate snapshot
- Buy order validation:
  - Enough cash
  - Fee included
  - Market price available
- Sell order validation:
  - Enough units
- Portfolio valuation updates after every trade and scheduled refresh

P/L calculations:

- Realized P/L after closing units
- Unrealized P/L from current ETF price vs average cost
- Fees always reduce returns

## 8. Rules Engine Design

Represent rules as structured configs, not free text, so they are testable and deterministic.

Example rule types:

- `price_drop_percent`
- `price_rise_percent`
- `moving_average_cross`
- `periodic_investment`
- `take_profit`
- `stop_loss`
- `rebalance`

Execution process:

1. Load enabled rules
2. Resolve required indicators and prices
3. Evaluate conditions
4. Validate cash/risk constraints
5. Emit recommendation or trade
6. Log result

## 9. AI Agent Design

The AI agent should not directly trade without controls. Use a guarded architecture:

### 9.1 Inputs

- Current prices and trends
- Selected historical windows
- Portfolio status
- Cash available
- Open positions
- Rule outputs
- Risk limits
- Transaction fee

### 9.2 Outputs

Require structured JSON:

- action: buy | sell | hold
- etfTicker
- eurAmount or units
- confidence
- rationale
- riskNotes

### 9.3 Guardrails

- Reject malformed output
- Reject trades above configured cap
- Reject unsupported ETF tickers
- Reject insufficient cash or insufficient holdings
- Keep audit trail for every recommendation

### 9.4 Agent Modes

- Advisory only
- Advisory + confirmation
- Full simulated auto-execution

## 10. Backoffice Requirements

Backoffice sections:

### 10.1 LLM Settings

- Provider: OpenAI, local Ollama, LM Studio, custom OpenAI-compatible endpoint
- Endpoint URL
- Model name
- API key reference
- Timeout
- Temperature
- Max tokens

### 10.2 Agent Settings

- Analysis schedule
- Regions/universe allowed
- Max trade size in EUR
- Max daily trade count
- Max exposure per ETF
- Stop trading threshold
- Auto-execute toggle

### 10.3 Simulation Settings

- Default wallet budget in EUR
- Per-transaction fee
- Slippage percentage
- FX source

### 10.4 Market Data Settings

- Data provider
- Update intervals
- Manual refresh action
- Last refresh status

## 11. UI/UX Outline

### 11.1 Main Dashboard

Widgets:

- Top 10 indices cards
- Region filter
- Performance heatmap
- Main historical chart
- Manual update button
- Agent recommendation panel

### 11.2 Wallet

Widgets:

- EUR cash balance
- Buy/sell panel
- Active positions
- Transaction history

### 11.3 Portfolio

Widgets:

- Total account value
- P/L KPIs
- Allocation charts
- Position table

### 11.4 Backoffice

Tabs:

- Market Data
- LLM
- Agent
- Fees
- Rules
- ETFs and mappings

## 12. Suggested API Surface

Example endpoints:

- `GET /api/indices`
- `GET /api/indices/:id/history?range=1D|1W|1M|12M|YTD`
- `POST /api/indices/refresh`
- `GET /api/etfs`
- `GET /api/wallet`
- `POST /api/trades/buy`
- `POST /api/trades/sell`
- `GET /api/portfolio/summary`
- `GET /api/portfolio/performance`
- `GET /api/rules`
- `POST /api/rules`
- `POST /api/rules/:id/toggle`
- `GET /api/backoffice/settings`
- `PUT /api/backoffice/settings`
- `POST /api/agent/run`
- `GET /api/agent/runs`

## 13. Non-Functional Requirements

- Full audit log for every simulated trade
- Deterministic rule evaluation
- Explainable AI decisions
- Currency consistency in EUR
- Retry-safe market refresh jobs
- Configurable providers for portability
- Good seed/demo data for product demos

## 14. Recommended Delivery Phases

### Phase 1 - Foundation

- Project bootstrap
- Auth and roles
- Static list of 10 indices + ETF mappings
- Historical chart with mock/demo data
- EUR wallet
- Manual buy/sell simulation
- Portfolio dashboard

### Phase 2 - Automation

- Rules engine
- Transaction fees
- Manual market refresh
- Scheduled data sync
- Better historical datasets

### Phase 3 - AI Layer

- Backoffice LLM config
- Local/remote model support
- Agent recommendations
- Guardrails and audit logs
- Agent parameter tuning

### Phase 4 - Operational Maturity

- Intraday data improvements
- Advanced analytics
- Notifications
- Scenario testing and backtesting

## 15. Recommended MVP Scope

To keep first delivery realistic, MVP should include:

- 10 indices and mapped ETFs
- Historical charts with day/week/month/12m/YTD
- EUR wallet with starting budget
- Buy/sell simulation with fees
- Portfolio dashboard
- Backoffice for fee and LLM config
- Manual refresh
- Basic rules engine
- AI agent in advisory mode

Defer from MVP:

- Fully autonomous trading by default
- Complex technical indicators
- Multi-user collaboration
- Real-money brokerage integration

## 16. Risks and Key Decisions

Open decisions to confirm before implementation:

1. Which exact ETF mapping to use per index
2. Which market data provider to use in MVP
3. Whether auth is single-admin or multi-user
4. Whether the agent can execute automatically in MVP
5. Whether intraday data needs to be truly real-time or delayed

Main risks:

- Licensing/availability of market data
- Local LLM reliability and output consistency
- FX conversion correctness for non-EUR ETFs
- Rules and agent conflicting on the same asset

## 17. Recommended Build Stack

Recommended implementation stack:

- Frontend: Next.js + TypeScript + Tailwind
- Charts: Recharts or Apache ECharts
- Backend: Next.js server routes or NestJS
- Database: PostgreSQL + Prisma
- Jobs: Redis + BullMQ
- Auth: NextAuth or Clerk
- AI integration: provider abstraction with OpenAI-compatible API support
- Deployment: Vercel for frontend/backend plus managed Postgres/Redis

## 18. Immediate Next Step

Best next step is to turn this plan into:

1. Product requirements document
2. Database schema
3. Wireframes for dashboard, wallet, portfolio, and backoffice
4. Initial app scaffold

If implementation starts now, the first vertical slice should be:

- Dashboard with 10 indices
- ETF mapping
- Wallet with EUR 10,000 seed budget
- Buy/sell simulation
- Portfolio P/L

## 19. UX And Domain Updates

Additional confirmed product rules:

### 19.1 Main Page vs Portfolio Area

- Transactions should not sit on the main landing area.
- The main page focuses on:
  - App identity
  - Quick index selection
  - Selected index performance
  - Period chart
- Buy/sell flows belong in the portfolio performance area.

### 19.2 Backoffice Scope

Backoffice must include:

- LLM configuration
  - Provider
  - Model
  - Local endpoint
  - Remote endpoint if applicable
- Tracked indices and their mapped ETFs
- Initial wallet budget
- Transaction fees
- FX conversion settings
  - EUR to USD
  - USD to EUR

Important wallet rule:

- Wallet base currency is EUR
- ETF orders execute in USD
- Order previews and ledger entries must show FX conversion assumptions

### 19.3 Index Chart Semantics

- `YTD` means from January 1 of the current calendar year until now
- `1W` must use actual dates on the X axis rather than weekday names only
- The UI must always show the performance obtained in the selected period
- Changing the selected period must update:
  - X axis labels
  - Performance summary
  - Chart interpretation text

### 19.4 Strategy Model

Agent trading must support multiple named strategies.

Each strategy has:

- A unique name
- A free-form strategy brief
- Buy criteria
- Sell criteria
- Risk profile
- A dedicated budget carved out from the global wallet budget

### 19.5 Agent Model

- One agent run uses exactly one strategy
- The system can launch multiple agents
- Each agent is associated with one named strategy
- Agents operate independently through API on top of the same portfolio model
- Agent execution uses backoffice-defined LLM/logging/management settings

### 19.6 Agent Auditability

For every agent-created transaction, store:

- Agent id
- Strategy name
- Trade side
- ETF ticker
- FX rate used
- Fee used
- Reasoning summary
- Timestamp
