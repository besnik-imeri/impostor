# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Fresh TypeScript monorepo with `apps/web`, `apps/worker`, and `packages/domain`.
- Mobile-first React web MVP for create room, join room, lobby, reveal, accusations, suspicions, results, and leaderboard.
- Cloudflare Worker API with Durable Object room ownership, signed room tokens, WebSocket commands, snapshots, and timer alarms.
- Shared domain package for room config validation, role assignment, state transitions, scoring, public snapshots, and private snapshots.
- Curated MVP word categories stored in code.
- Unit tests for scoring, timer-expiry imposter win, round starts, ready checks, suspicions, accusations, and token signing.
- Product, architecture, deployment, cost, and ADR documentation.

## [0.1.0] - 2026-05-08

### Added

- Initial clean rebuild baseline.
