# Impostor

Impostor is a mobile-first web party game for in-person social deduction. One host creates a room, players join by code, QR, or link, and the app handles private roles, secret words, timers, suspicions, accusations, scoring, and the leaderboard.

## Current Scope

- Web app only.
- In-person play only.
- Room-scoped profiles; no accounts.
- MVP modes: Accusation and Suspicion.
- Public landing page at `/`.
- Playable room flow at `/play`.
- Room invite links use `/play?room=CODE`; old `/?room=CODE` links remain supported.
- Cloudflare Pages for the web app.
- Cloudflare Workers + Durable Objects for authoritative realtime rooms.
- Curated word lists stored in code.
- App-owned avatar assets in `apps/web/public/avatars`.

## Monorepo Layout

```text
apps/web       React + Vite mobile-first SPA
apps/worker    Cloudflare Worker + Durable Object API
packages/domain Shared rules, state transitions, scoring, words, and snapshots
docs           Product, architecture, runbook, cost, and ADR docs
```

## Requirements

- Node.js 24.19.0 LTS (the repository supports Node.js 24.19.0 or newer in the 24.x line)
- pnpm 11.21.0 via Corepack
- Cloudflare account for deployment

## Local Development

Browser-facing local development runs through the global Caddy reverse proxy:

- Main app: `https://impostor.localhost`
- API: `https://impostor.localhost/api/*`
- Web upstream: `http://127.0.0.1:3400`
- Worker upstream: `http://127.0.0.1:3401`

```bash
corepack enable
pnpm install
pnpm dev
```

The web app and Worker bind to `127.0.0.1` only. Vite proxies `/api` requests to the
local Worker upstream, and Caddy is the browser-facing entrypoint.

Use `https://impostor.localhost/` for the landing page and
`https://impostor.localhost/play` for the game shell. The API is available at
`https://impostor.localhost/api/*`.

For local Worker development, create `apps/worker/.dev.vars`:

```bash
TOKEN_SECRET="replace-with-a-long-random-local-secret"
ALLOWED_ORIGINS="https://impostor.localhost"
```

No databases, caches, queues, search services, mail catchers, or object storage
emulators are used by this repo in local development. Durable Object storage is
managed internally by Wrangler and is not exposed as a host port.

### Local Caddy Snippet

The repo-local Caddy snippet lives at `ops/caddy/impostor.caddy`. Install or
symlink it into the global local-dev Caddy project directory:

```powershell
New-Item -ItemType Directory -Force D:/_tools/caddy/projects
New-Item -ItemType SymbolicLink -Force D:/_tools/caddy/projects/impostor.caddy -Target (Resolve-Path ops/caddy/impostor.caddy)
```

If symlinks are not available on your machine, copy the file instead:

```powershell
Copy-Item -Force ops/caddy/impostor.caddy D:/_tools/caddy/projects/impostor.caddy
```

Validate and reload the global Caddy config from the Caddy config directory:

```powershell
caddy validate --config Caddyfile --adapter caddyfile
caddy reload --config Caddyfile --adapter caddyfile
```

If `pnpm dev` reports a port conflict, stop the process using `127.0.0.1:3400`
or `127.0.0.1:3401` and rerun it. Vite uses strict port behavior and exits
instead of falling back to a random available port.

If Windows reports `No such host is known` for the `.localhost` name, add a
loopback hosts entry for `impostor.localhost`.

## Quality Gates

```bash
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm deps:audit
pnpm test:e2e
```

Playwright uses its bundled Chromium by default (`pnpm exec playwright install chromium`). To
reuse an installed Google Chrome for a local run, set `PLAYWRIGHT_CHANNEL=chrome` for that command.

`pnpm deps:audit` fails on high- or critical-severity advisories. See the
[dependency maintenance guide](docs/dependency-maintenance.md) for the complete dependency
inventory, intentional version holds, update procedure, and automation policy.

## Deployment

Production is hosted on Cloudflare:

- Web app: `https://impostorgame.com`
- API route: `https://impostorgame.com/api/*`
- Pages project: `impostor`
- Worker: `impostor-api`

See [docs/runbooks/deployment.md](docs/runbooks/deployment.md).

## Documentation

- [Game rules](docs/product/game-rules.md)
- [Architecture](docs/architecture.md)
- [Dependency maintenance](docs/dependency-maintenance.md)
- [Cost model](docs/cost-model.md)
- [Cloudflare Durable Objects ADR](docs/adr/0001-cloudflare-durable-objects.md)
- [Changelog](CHANGELOG.md)
