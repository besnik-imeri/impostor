# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Immersive neon arcade landing experience with GSAP scroll motion and a lazily loaded Three.js attract-mode canvas.
- Design QA report, placeholder asset inventory, and Playwright reference captures covering mobile and desktop game states.
- Weekly Dependabot checks for npm workspace packages and GitHub Actions.
- Dependency maintenance documentation, outdated/audit scripts, and a high-severity CI audit gate.
- Product landing page at `/`, with the playable room flow moved to `/play`.
- Backward-compatible room routing so legacy `/?room=CODE` links open `/play?room=CODE`.
- Asset-backed player avatars using the 24 canonical `boy-1` through `boy-12` and `girl-1` through `girl-12` IDs.
- Fresh TypeScript monorepo with `apps/web`, `apps/worker`, and `packages/domain`.
- Mobile-first React web MVP for create room, join room, lobby, reveal, accusations, suspicions, results, and leaderboard.
- Cloudflare Worker API with Durable Object room ownership, signed room tokens, WebSocket commands, snapshots, and timer alarms.
- Shared domain package for room config validation, role assignment, state transitions, scoring, public snapshots, and private snapshots.
- Curated MVP word categories stored in code.
- Unit tests for scoring, timer-expiry impostor win, round starts, ready checks, suspicions, accusations, and token signing.
- Product, architecture, deployment, cost, and ADR documentation.

### Changed

- Refreshed every direct dependency to the latest compatible stable baseline eligible on 2026-08-14, including React 19.2.8, Vite 8.2.1, ESLint 10.8.1, Wrangler 4.122.0, and pnpm 11.21.0.
- Pinned local, CI, and Cloudflare Pages tooling to Node.js 24.19.0 LTS and upgraded the GitHub checkout and setup-node actions to v6.
- Aligned Cloudflare Pages and Worker compatibility dates to 2026-07-10.
- Added formatting and dependency-audit checks to CI.
- Standardized product terminology, package names, role values, result states, and documentation on the `Impostor` spelling.
- Reworked the responsive game shell around the neon arcade direction, including mobile status/navigation treatments, desktop sidebars, mode cards, lobby previews, and live-round action panels.
- Strengthened the lobby, reveal, timer, accusation, results, and leaderboard presentation while preserving the existing multiplayer flows.
- Updated generated room links and QR codes to use `/play?room=CODE`.
- Renamed internal workspace packages to the `@impostor/*` scope.

### Fixed

- Made Playwright start and independently await the web and Worker development servers through a binding-free Worker health endpoint.
- Cleared all known dependency advisories, including vulnerable Babel, Brace Expansion, Nano ID, PostCSS, Sharp, and Undici transitive releases.
- Made `pnpm dev` build the domain package before starting web and worker services.
- Made Vite resolve `@impostor/domain` from source during local development.
- Fixed the local Worker compatibility date so invalid local API routes return responses instead of hanging.

## [0.1.0] - 2026-05-08

### Added

- Initial clean rebuild baseline.
