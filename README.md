# Imposter

Imposter is a mobile-first web party game for in-person social deduction. One host creates a room, players join by code, QR, or link, and the app handles private roles, secret words, timers, suspicions, accusations, scoring, and the leaderboard.

## Current Scope

- Web app only.
- In-person play only.
- Room-scoped profiles; no accounts.
- MVP modes: Accusation and Suspicion.
- Cloudflare Pages for the web app.
- Cloudflare Workers + Durable Objects for authoritative realtime rooms.
- Curated word lists stored in code.

## Monorepo Layout

```text
apps/web       React + Vite mobile-first SPA
apps/worker    Cloudflare Worker + Durable Object API
packages/domain Shared rules, state transitions, scoring, words, and snapshots
docs           Product, architecture, runbook, cost, and ADR docs
```

## Requirements

- Node.js 24 LTS
- pnpm 11 via Corepack
- Cloudflare account for deployment

## Local Development

```bash
corepack enable
pnpm install
pnpm dev
```

The web app runs on `http://127.0.0.1:5173`. The Worker runs on `http://127.0.0.1:8787`, and Vite proxies `/api` requests to it.

For local Worker development, create `apps/worker/.dev.vars`:

```bash
TOKEN_SECRET="replace-with-a-long-random-local-secret"
```

## Quality Gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Deployment

See [docs/runbooks/deployment.md](docs/runbooks/deployment.md).

## Documentation

- [Game rules](docs/product/game-rules.md)
- [Architecture](docs/architecture.md)
- [Cost model](docs/cost-model.md)
- [Cloudflare Durable Objects ADR](docs/adr/0001-cloudflare-durable-objects.md)
- [Changelog](CHANGELOG.md)
