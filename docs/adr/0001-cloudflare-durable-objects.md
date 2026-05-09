# ADR 0001: Cloudflare Durable Objects For Realtime Rooms

## Status

Accepted

## Context

Impostor needs authoritative realtime game rooms with private per-player state. The MVP should avoid paid databases and avoid splitting room state across multiple services too early.

## Decision

Use Cloudflare Pages for static hosting and Cloudflare Workers with Durable Objects for realtime room ownership. Store active room state in Durable Object SQLite storage.

## Consequences

Positive:

- One room maps to one authoritative writer.
- WebSockets can hibernate to reduce cost.
- Room state and realtime protocol live close together.
- No separate database is required for MVP.
- The architecture can scale by room without a major rewrite.

Negative:

- Durable Objects are Cloudflare-specific.
- Local testing requires Wrangler.
- Long-term history would need a separate persistence strategy later.

## Alternatives Considered

- Firebase: faster to prototype but adds cost, security rules complexity, and client-driven realtime state risks.
- Supabase Realtime: strong Postgres foundation, but more infrastructure than short-lived rooms need.
- Plain serverless functions: poor fit for authoritative realtime room state.
- Self-hosted Node WebSocket server: flexible but higher operational burden for MVP.
