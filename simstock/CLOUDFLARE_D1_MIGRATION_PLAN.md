# SimStock Cloudflare + D1 Migration Plan

## Goal

Move SimStock from a laptop-first Next.js + local SQLite setup to a Cloudflare-aligned production architecture with:

- Next.js on Cloudflare Workers
- D1 for relational application data
- R2 for exports/imports and generated artifacts
- Cloudflare Cron Triggers for scheduled refreshes
- Email login with role-based access
- Secrets managed outside the database

This plan is based on the current codebase in:

- `/Users/ruipereira/Documents/New project/simstock/src/lib/server/db.ts`
- `/Users/ruipereira/Documents/New project/simstock/src/lib/server/simstock-service.ts`
- `/Users/ruipereira/Documents/New project/simstock/src/app/api`

Official references used:

- Cloudflare Next.js on Workers: <https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/>
- Cloudflare D1: <https://developers.cloudflare.com/d1/>
- Cloudflare Durable Objects: <https://developers.cloudflare.com/durable-objects/>
- Cloudflare R2: <https://developers.cloudflare.com/r2/>

## Current Architecture

The current app is a monolithic Next.js application with:

- App Router API routes under `src/app/api`
- direct SQLite access through `better-sqlite3`
- local file-backed database in `data/simstock.db`
- Python subprocess execution for Yahoo market-data fetches
- application settings, users, wallet, signals, agents and logs mixed between relational tables and JSON in `app_state`
- no real authentication session layer
- role checks implemented in business logic, but not backed by real login identity

## What Blocks Cloudflare Today

### 1. `better-sqlite3` is local Node-native

Current file:

- `/Users/ruipereira/Documents/New project/simstock/src/lib/server/db.ts`

Why it blocks:

- Cloudflare Workers do not run native Node SQLite bindings like `better-sqlite3`.
- D1 is the Cloudflare replacement path.

### 2. Python subprocesses are used in the runtime

Current code:

- `/Users/ruipereira/Documents/New project/simstock/src/lib/server/simstock-service.ts`

Observed dependency:

- `execFile("python3", ...)`
- `scripts/fetch_yahoo_chart.py`

Why it blocks:

- Workers cannot spawn local Python processes.
- Runtime data collection must move to HTTP-native fetch logic or external ingestion jobs.

### 3. Local filesystem assumptions

Current usage:

- `data/simstock.db`
- export/import files written locally
- market-data comparison files in `data/provider-comparison`

Why it blocks:

- Workers do not provide a normal writable server filesystem.
- Persisted files should move to R2 or be generated client-side.

### 4. No production authentication

Current state:

- users exist as records
- user switching is exposed through `/api/users/select`
- no real login, no verified identity, no secure session cookie

Why it blocks:

- a public deployment needs authentication, session management and route authorization

## Recommended Target Architecture

### Core stack

- Next.js App Router
- Cloudflare Workers runtime
- D1 for app data
- R2 for exports/imports
- Cloudflare Cron Triggers for:
  - FX refresh
  - stock item refresh
  - signal refresh
  - agent cycle execution

### Optional additions

- Durable Objects only if agent state becomes highly concurrent or long-lived
- KV only for lightweight cache, not as primary system of record

## Data Architecture Recommendation

### Move from mixed `app_state` JSON to more explicit tables

Today a lot of business state sits in `app_state` JSON blobs. That makes local prototyping easy, but it becomes fragile for:

- migrations
- multi-user isolation
- auditing
- partial updates
- D1 queryability

Recommended direction in D1:

- `users`
- `sessions`
- `settings_global`
- `user_settings`
- `wallets`
- `stock_items`
- `stock_item_history_daily`
- `stock_item_history_intraday`
- `fx_rates`
- `trades`
- `strategies`
- `agents`
- `agent_logs`
- `agent_trade_proposals`
- `signal_runs`
- `signal_outputs`
- `activity_logs`

Keep only very small config blobs in JSON columns where that makes sense, for example:

- strategy prompt hints
- agent influence hints

## Authentication Recommendation

### Use email login

Best fit for this app:

- passwordless email login with magic link or OTP

Why:

- lower friction
- less password handling risk
- good fit for admin-style app with a small user base

Recommended model:

- `users` table stores:
  - `id`
  - `email`
  - `name`
  - `role`
  - `email_verified_at`
  - `status`
- `sessions` table stores:
  - `id`
  - `user_id`
  - `token_hash`
  - `expires_at`
  - `created_at`
  - `ip_hash`
  - `user_agent`

Recommended session behavior:

- secure, httpOnly, sameSite cookies
- short session TTL with rotation
- server-side session validation on every protected route

Email flow:

1. user submits email
2. app issues signed one-time login token
3. email link is sent
4. callback verifies token and creates session
5. session cookie is set

Cloudflare-aligned options:

- use a transactional email provider
- keep email API keys in Workers Secrets

## Security Gaps to Fix Before Public Deployment

### Critical

1. Real authentication

- user switching cannot remain an open API action
- every route needs identity derived from session, not request body

2. Route-level authorization

- current `assertSuperuser(...)` style checks should remain
- but must be bound to an authenticated server identity

3. Secrets management

- LLM API keys are currently treated like normal settings data
- move provider keys to Cloudflare secrets, not D1

4. Tenant isolation

- business data is currently swapped in and out by active user selection
- in production, user-scoped data must be filtered by `user_id` in queries
- do not overwrite global tables when switching user context

### High

5. CSRF protection for mutating actions

- all POST, PUT, PATCH, DELETE routes should use CSRF protection

6. Rate limiting

- add per-IP and per-user rate limits to:
  - login
  - LLM test
  - signals refresh
  - trades
  - import/export

7. Audit logging

- logs already exist, which is good
- they should become append-only and user-attributed

8. Input validation

- formal schema validation should be added on every API route
- recommended: `zod` or equivalent

### Medium

9. Turnstile on sensitive public entry points

- login initiation
- signup/invite flow

10. Data protection for exports

- exports should go to R2
- only superusers should generate/download
- add short-lived signed download URLs

11. Safer LLM controls

- never store raw provider secrets in user-editable records
- separate model config from secrets

## Codebase Changes Recommended

### A. Database access layer

Introduce a storage abstraction:

- `src/lib/server/store/types.ts`
- `src/lib/server/store/local-sqlite.ts`
- `src/lib/server/store/d1.ts`

Goal:

- stop calling `better-sqlite3` directly from service code
- keep business logic portable

### B. Split service responsibilities

Current file:

- `/Users/ruipereira/Documents/New project/simstock/src/lib/server/simstock-service.ts`

This file is too broad.

Recommended split:

- `auth-service.ts`
- `market-data-service.ts`
- `signal-service.ts`
- `trade-service.ts`
- `agent-service.ts`
- `user-service.ts`
- `settings-service.ts`
- `audit-service.ts`

### C. Replace Python market-data runtime

Current implementation:

- Python subprocess for Yahoo chart fetch

Recommended direction:

- move runtime fetching to pure HTTP from Worker-compatible code
- or run external ingestion jobs and write normalized results into D1

Preferred model for Cloudflare:

- one scheduled ingestion worker
- normalized price rows written into D1
- app reads only from D1

### D. Redesign multi-user persistence

Current design:

- active user switch snapshots business state in/out of shared tables

Recommended production design:

- every business table has `user_id`
- no dataset swapping
- selecting a user should only exist for super-admin impersonation, if at all

### E. Scheduled jobs

Move these to Cron Triggers:

- FX refresh every 1 hour
- stock item refresh cadence by market
- signal engine refresh on demand and optionally scheduled
- agent loop scheduler

## Recommended D1 Schema Direction

Suggested additions:

- add `user_id` to:
  - `wallets`
  - `trades`
  - `strategies`
  - `agents`
  - `agent_logs`
  - `signal_runs`
  - `activity_logs`
- keep market reference data global where appropriate:
  - `stock_items`
  - `markets`
  - `fx_rates`
  - `stock_item_history_*`

Recommended approach:

- separate global reference data from user portfolio data

## Login and Roles

Roles should become:

- `view_only`
- `superuser`

Server behavior:

- `view_only` can read portfolio/dashboard content only
- `superuser` can mutate settings, strategies, trading and autotrade

Recommended future addition:

- `operator`

This can later allow:

- run agents
- approve trades
- but not modify global configuration

## Git and Cloudflare Alignment

### Current git concern

The workspace currently does not appear to be an initialized git repository at the app level, so PR-based deployment flow is not ready yet.

### What to do next

1. Initialize git if not already managed in a parent repository

2. Add a branch strategy

- `main` for production
- `develop` optional
- feature branches prefixed with `codex/`

Recommended first migration branches:

- `codex/cloudflare-d1-foundation`
- `codex/auth-email-login`
- `codex/d1-data-model`
- `codex/cloudflare-cron-jobs`
- `codex/hardening-and-audit`

3. Protect `main`

- require PR reviews
- require CI
- require successful preview deploy

4. Add CI

Recommended checks:

- lint
- typecheck
- build
- route smoke tests
- migration tests

5. Add Cloudflare deployment config

- `wrangler.toml`
- environment separation:
  - `preview`
  - `production`

6. Keep secrets out of git

- no API keys in D1 exports committed to repo
- no `.env*` committed
- no local database files committed

### Recommended `.gitignore` additions

The repo should ignore:

- `data/*.db`
- `data/*.db-wal`
- `data/*.db-shm`
- `data/provider-comparison/*.json`
- export artifacts

## Migration Phases

### Phase 1. Foundation

- initialize git and branch workflow
- add `wrangler.toml`
- create storage abstraction
- stop direct SQLite coupling in service layer

### Phase 2. Auth and security

- add email login
- add sessions
- add route auth middleware
- add CSRF and rate limiting

### Phase 3. D1 migration

- define D1 schema and migrations
- move app_state heavy blobs into explicit tables
- add `user_id` scoping

### Phase 4. Market-data migration

- replace Python subprocess runtime
- move ingestion to Worker-friendly fetch and scheduled refresh

### Phase 5. Exports and files

- move export/import to R2-backed flow
- add signed download/upload workflow

### Phase 6. Agent runtime hardening

- cron-driven agent cycles
- proposal queue
- approval actions fully session-bound
- append-only audit records

## Immediate Recommendations

If we start now, the best first implementation slice is:

1. create git repo and branch workflow
2. add `wrangler.toml`
3. add auth/session model
4. abstract database access
5. prepare D1 schema without changing UI yet

This keeps UI momentum while removing the highest deployment risk.

## Suggested First PR Set

### PR 1. Cloudflare foundation

- `wrangler.toml`
- build target for Cloudflare
- storage abstraction

### PR 2. Email login

- login request
- email callback
- session middleware
- role enforcement

### PR 3. D1 schema migration

- table redesign
- migration scripts
- query rewrites

### PR 4. Market-data ingestion rewrite

- remove Python subprocess dependency
- D1-backed historical writes

### PR 5. Security hardening

- CSRF
- rate limiting
- audit attribution
- R2 export/import

## Bottom Line

The app is a good local MVP, but before Cloudflare deployment it needs:

- D1-compatible persistence
- Worker-compatible market-data ingestion
- real email login and secure sessions
- tenant-safe user data model
- secrets moved out of application data
- git + CI + preview deployment workflow

The highest-risk architectural issue is not the UI or Next.js. It is the current server/data model:

- local SQLite
- Python subprocesses
- no authenticated identity
- user dataset swapping instead of user-scoped persistence
