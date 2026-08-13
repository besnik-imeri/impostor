# Deployment Runbook

## Prerequisites

- Cloudflare account.
- `impostorgame.com` added to Cloudflare DNS.
- `impostorgame.com` connected to the Cloudflare Pages project.
- Node.js 24.19.0 LTS (minimum supported version: 24.19.0).
- pnpm 11.21.0 via Corepack.
- Wrangler authenticated with `pnpm exec wrangler login`.

## Production

- Primary web app: `https://impostorgame.com`
- Worker routes:
  - `https://impostorgame.com/api/*`
  - `https://www.impostorgame.com/api/*`
- Worker name: `impostor-api`
- Pages project name: `impostor`
- Pages deployment domain: `https://d8715086.impostor-dg6.pages.dev`
- Pages custom domain: `impostorgame.com`

The frontend and API are intended to run same-origin in production. The browser calls `/api/*`, and Cloudflare routes those requests to the Worker before Pages handles the SPA.

If `www.impostorgame.com` is used as a public entry point, attach it to the `impostor` Pages project as an additional custom domain or redirect it to `https://impostorgame.com`.

## Secrets

Set a production token secret:

```bash
pnpm --filter @impostor/worker exec wrangler secret put TOKEN_SECRET
```

Use a long random value. Rotating this secret invalidates existing room tokens.
The production `ALLOWED_ORIGINS` and `/api/*` routes are configured in `apps/worker/wrangler.jsonc`.

## Worker Deploy

```bash
pnpm --filter @impostor/worker deploy
```

Wrangler creates the Durable Object class and applies the SQLite migration from `apps/worker/wrangler.jsonc`.
The Worker and Pages configurations use Cloudflare compatibility date `2026-07-10`.

## Web Deploy

```bash
pnpm --filter @impostor/web build
pnpm --filter @impostor/web deploy
```

For Cloudflare Pages Git deployments from the monorepo root, keep the build command as `npm run build`. The root `wrangler.jsonc` sets `pages_build_output_dir` to `apps/web/dist`, which is where the Vite web build writes the production assets.

In Cloudflare Pages, attach the custom domain `impostorgame.com` to the `impostor` Pages project. The `apps/web/public/_redirects` file keeps direct SPA links such as `/play?room=CODE` working.

If the Worker is ever hosted on a different domain than Pages, configure:

```bash
VITE_API_BASE_URL="https://your-worker-domain.example"
```

## Live Verification

```bash
pnpm --filter @impostor/web exec wrangler pages project list
pnpm --filter @impostor/web exec wrangler pages deployment list --project-name impostor
pnpm --filter @impostor/worker exec wrangler secret list
```

Expected live checks:

- `https://impostorgame.com/` returns the web app.
- `https://impostorgame.com/play` returns the web app through the SPA fallback.
- `https://impostorgame.com/api/health` returns `{ "status": "ok" }`.
- `https://impostorgame.com/api/rooms` returns Worker JSON for API routes.
- Creating a room with `POST /api/rooms` returns `200` and sets the room-scoped `impostor_room_session` HttpOnly cookie.
- Opening `GET /api/rooms/:code/socket` with the room cookie upgrades to WebSocket and emits `room.snapshot`.

## Smoke Test

1. Open `https://impostorgame.com` on a phone-sized viewport and confirm the landing page renders at `/`.
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
