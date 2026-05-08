# Deployment Runbook

## Prerequisites

- Cloudflare account.
- Node.js 24 LTS.
- pnpm 10.
- Wrangler authenticated with `pnpm exec wrangler login`.

## Secrets

Set a production token secret:

```bash
pnpm --filter @imposter/worker exec wrangler secret put TOKEN_SECRET
```

Use a long random value. Rotating this secret invalidates existing room tokens.

Set the allowed browser origin if Pages and the Worker are not served from the same origin:

```bash
pnpm --filter @imposter/worker exec wrangler deploy --var ALLOWED_ORIGIN:https://your-pages-domain.example
```

For a permanent production value, set `ALLOWED_ORIGIN` in the Cloudflare Worker environment configuration.

## Worker Deploy

```bash
pnpm --filter @imposter/worker deploy
```

Wrangler creates the Durable Object class and applies the SQLite migration from `apps/worker/wrangler.jsonc`.

## Web Deploy

```bash
pnpm --filter @imposter/web build
pnpm --filter @imposter/web deploy
```

If the Worker is hosted on a different domain than Pages, configure:

```bash
VITE_API_BASE_URL="https://your-worker-domain.example"
```

## Smoke Test

1. Open the Pages URL on a phone-sized viewport.
2. Create a room as host.
3. Join from at least three separate browser contexts or devices.
4. Ready all players.
5. Start Accusation mode.
6. Confirm non-imposters see the secret word and the imposter sees `IMPOSTER`.
7. Accuse correctly and confirm scoring.
8. Start Suspicion mode.
9. Add suspicions, let the timer expire, and confirm the imposter got-away result.

## Rollback

- Roll back the Pages deployment from the Cloudflare dashboard.
- Roll back Worker deployments with Wrangler or the Cloudflare dashboard.
- Avoid schema changes that require destructive Durable Object migrations until production traffic justifies a migration plan.
