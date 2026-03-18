# SimStock

SimStock is a local-first ETF simulation cockpit with:

- wallet in EUR
- simulated trading
- signals
- strategies
- agent workflows
- SQLite persistence
- email token login

## Local development

Run:

```bash
npm run dev -- --port 3010
```

Open:

- [http://localhost:3010](http://localhost:3010)

## Hostinger VPS

The recommended deployment path right now is:

- Ubuntu VPS
- Node.js
- PM2
- Nginx

Guide:

- [HOSTINGER_VPS_DEPLOY.md](/Users/ruipereira/Documents/New%20project/simstock/HOSTINGER_VPS_DEPLOY.md)
- [OPERATIONS.md](/Users/ruipereira/Documents/New%20project/simstock/OPERATIONS.md)

## Cloudflare foundation

Cloudflare groundwork already exists in the repo:

- `wrangler.jsonc`
- `open-next.config.ts`
- `migrations/0001_simstock_base.sql`

The app is not fully migrated to D1 yet, but the project is prepared for the next phase.

## Useful scripts

```bash
npm run dev
npm run build
npm run start:prod
npm run lint
npm run cf:typegen
npm run cf:build
```
