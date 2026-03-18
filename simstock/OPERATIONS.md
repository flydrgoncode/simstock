# SimStock Operations

## Current VPS layout

- `SimStock app`: `127.0.0.1:3000`
- `Nginx public entry`: `80`
- `Ollama local`: `127.0.0.1:11434`

## Current serving model

- users access the app through `Nginx`
- `Nginx` proxies to the local Next.js app on port `3000`
- `Ollama` stays local-only and is not exposed publicly

## Port convention for future apps

- keep one internal port per app
- keep `Nginx` as the public entrypoint
- do not expose app ports publicly unless there is a strong reason

Suggested convention:

- `3000`: SimStock
- `3001`: second app
- `3002`: third app
- `11434`: Ollama local only

## PM2 convention

- one PM2 app per deployed service
- keep each app in its own working directory
- keep each app with its own environment file

## Nginx convention

- one site config per app
- route by domain, subdomain, or path
- always proxy to `127.0.0.1:<internal-port>`

## Secrets

- keep secrets only in server env files or secret managers
- do not store API keys in app settings or the database
- current LLM env vars:
  - `OPENAI_API_KEY`
  - `ANTHROPIC_API_KEY`
  - `OLLAMA_API_KEY`

## Useful checks

```bash
pm2 status
curl -I http://127.0.0.1:3000
curl http://127.0.0.1:11434/api/tags
```
