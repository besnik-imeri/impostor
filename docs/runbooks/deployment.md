# Deployment Runbook

## Prerequisites

- Cloudflare account.
- Node.js 24 LTS.
- pnpm 11.
- Wrangler authenticated with `pnpm exec wrangler login`.

## Secrets

Set a production token secret:

```bash
pnpm --filter @impostor/worker exec wrangler secret put TOKEN_SECRET
```

Use a long random value. Rotating this secret invalidates existing room tokens.

Set the allowed browser origin if Pages and the Worker are not served from the same origin:

```bash
pnpm --filter @impostor/worker exec wrangler deploy --var ALLOWED_ORIGIN:https://your-pages-domain.example
```

For a permanent production value, set `ALLOWED_ORIGIN` in the Cloudflare Worker environment configuration.

## Worker Deploy

```bash
pnpm --filter @impostor/worker deploy
```

Wrangler creates the Durable Object class and applies the SQLite migration from `apps/worker/wrangler.jsonc`.

## Web Deploy

```bash
pnpm --filter @impostor/web build
pnpm --filter @impostor/web deploy
```

If the Worker is hosted on a different domain than Pages, configure:

```bash
VITE_API_BASE_URL="https://your-worker-domain.example"
```

## Smoke Test

1. Open the Pages URL on a phone-sized viewport and confirm the landing page renders at `/`.
2. Use the primary CTA to open `/play`.
3. Create a room as host.
4. Confirm the join link and QR code use `/play?room=CODE`.
5. Join from at least three separate browser contexts or devices.
6. Ready all players.
7. Start Accusation mode.
8. Confirm non-impostors see the secret word and the impostor sees `IMPOSTOR`.
9. Accuse correctly and confirm scoring.
10. Start Suspicion mode.
11. Add suspicions, let the timer expire, and confirm the impostor got-away result.

## Rollback

- Roll back the Pages deployment from the Cloudflare dashboard.
- Roll back Worker deployments with Wrangler or the Cloudflare dashboard.
- Avoid schema changes that require destructive Durable Object migrations until production traffic justifies a migration plan.
