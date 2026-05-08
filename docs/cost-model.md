# Cost Model

## MVP Principle

Do not pay for services until the product proves the core loop. The MVP should remain playable with Cloudflare's free or very low-cost tiers and code-owned content.

## Included In MVP

- Cloudflare Pages for static hosting.
- Cloudflare Workers for API routing.
- Durable Objects for active rooms.
- Durable Object SQLite storage for short-lived room recovery.
- Curated word categories stored in source control.
- Browser-native telemetry only during development.

## Explicitly Not Included

- Firebase.
- Supabase.
- Paid analytics.
- Paid AI word generation.
- Paid authentication.
- Paid CMS.
- Native app store builds.

## Cost Triggers

Consider adding paid or managed services only when a concrete need appears:

- Analytics: when retention, funnel, or error data is needed for product decisions.
- Accounts: when players need history, progression, purchases, moderation, or cross-device identity.
- CMS: when non-developers must edit words/categories frequently.
- Observability: when Worker logs are not enough to debug live games.
- Native apps: when web conversion or retention data proves the wrapper is worth build and store-maintenance cost.

## Sustainability Notes

Durable Objects are a good fit because rooms are isolated, stateful, and short-lived. The main cost risk is long-lived idle rooms or excessive socket chatter, so the implementation includes heartbeat, hibernatable WebSockets, and 24-hour idle cleanup.
