# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

- Standardized product terminology, package names, role values, result states, and documentation on the `Impostor` spelling.
- Refreshed the game UI around a playful mystery direction, including stronger lobby, reveal, timer, accusation, results, and leaderboard treatments.
- Updated generated room links and QR codes to use `/play?room=CODE`.
- Renamed internal workspace packages to the `@impostor/*` scope.

### Fixed

- Made `pnpm dev` build the domain package before starting web and worker services.
- Made Vite resolve `@impostor/domain` from source during local development.
- Fixed the local Worker compatibility date so invalid local API routes return responses instead of hanging.

## [0.1.0] - 2026-05-08

### Added

- Initial clean rebuild baseline.
