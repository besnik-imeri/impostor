# Dependency Maintenance

This document records the dependency and runtime baseline verified on 2026-08-14 and the process
for keeping both current. The committed `pnpm-lock.yaml` remains the source of truth for exact
transitive versions.

## Runtime And Toolchain

| Tool                          | Baseline    | Policy                                                                  |
| ----------------------------- | ----------- | ----------------------------------------------------------------------- |
| Node.js                       | 24.19.0 LTS | Pinned in `.node-version`; `engines.node` accepts Node 24 from 24.19.0. |
| pnpm                          | 11.21.0     | Pinned by `packageManager`; run through Corepack.                       |
| Cloudflare compatibility date | 2026-07-10  | Shared by the Pages and Worker Wrangler configurations.                 |

Node.js 26 is the current, non-LTS release line as of this review. The project stays on Node.js
24 until the next LTS migration is reviewed and verified.

## Direct Dependency Baseline

| Package                       | Version      | Used By                                        |
| ----------------------------- | ------------ | ---------------------------------------------- |
| `@eslint/js`                  | 10.0.1       | Workspace lint configuration                   |
| `@types/node`                 | 24.13.3      | Workspace tooling types                        |
| `eslint`                      | 10.8.1       | Workspace linting                              |
| `eslint-plugin-react-hooks`   | 7.1.1        | Web linting                                    |
| `eslint-plugin-react-refresh` | 0.5.4        | Web linting                                    |
| `globals`                     | 17.11.0      | Workspace lint configuration                   |
| `prettier`                    | 3.9.6        | Workspace formatting                           |
| `typescript`                  | 6.0.3        | Workspace and web compilation                  |
| `typescript-eslint`           | 8.67.0       | TypeScript linting                             |
| `vitest`                      | 4.1.10       | Workspace, web, Worker, and domain tests       |
| `@fontsource/press-start-2p`  | 5.3.0        | Self-hosted web display font                   |
| `@fontsource/space-mono`      | 5.3.0        | Self-hosted web text font                      |
| `gsap`                        | 3.15.0       | Landing-page motion                            |
| `lucide-react`                | 1.31.0       | Web icons                                      |
| `pixelarticons`               | 2.3.0        | Web arcade icons                               |
| `qrcode`                      | 1.5.4        | Room invite QR codes                           |
| `react`                       | 19.2.8       | Web runtime                                    |
| `react-dom`                   | 19.2.8       | Web runtime                                    |
| `three`                       | 0.185.1      | Landing-page canvas scene                      |
| `@playwright/test`            | 1.62.1       | Browser end-to-end tests                       |
| `@tailwindcss/vite`           | 4.3.3        | Web CSS build integration                      |
| `@types/qrcode`               | 1.5.6        | QR code types                                  |
| `@types/react`                | 19.2.18      | React types                                    |
| `@types/react-dom`            | 19.2.4       | React DOM types                                |
| `@types/three`                | 0.185.4      | Three.js types                                 |
| `@vitejs/plugin-react`        | 6.0.5        | React build integration                        |
| `tailwindcss`                 | 4.3.3        | Web styling                                    |
| `vite`                        | 8.2.1        | Web development and production build           |
| `wrangler`                    | 4.122.0      | Local Worker runtime and Cloudflare deployment |
| `@cloudflare/workers-types`   | 5.20260812.1 | Worker runtime types                           |

`@impostor/domain` is an internal workspace dependency and uses `workspace:*`; it is not fetched
from a package registry.

## Intentional Holds

- TypeScript 7.0.2 is not adopted because `typescript-eslint` 8.67.0 declares support for
  TypeScript versions below 6.1.0. Upgrade both together after that peer range includes TypeScript 7.
- `@types/node` remains on major 24 so compile-time APIs match the Node.js 24 LTS runtime.
- pnpm 11's default 24-hour minimum release age remains active. Newly published packages are not
  promoted into this baseline until they pass that supply-chain quarantine and the checks below.

The Dependabot configuration mirrors the TypeScript and Node type holds so it does not create
known-incompatible pull requests.

## Current Audit Status

The 2026-08-14 full audit reports no known advisories. The refreshed lockfile resolves the patched
compatible lines for Babel, Brace Expansion, Nano ID, PostCSS, Sharp, and Undici without package
manager overrides.

## Routine Checks

Install exactly what is committed:

```bash
corepack pnpm install --frozen-lockfile
```

Check direct dependencies and all known advisories:

```bash
corepack pnpm deps:outdated
corepack pnpm audit
```

The repository's CI audit gate is intentionally narrower and fails on high or critical findings:

```bash
corepack pnpm deps:audit
```

Dependabot checks npm dependencies and GitHub Actions every Monday. Production and development
package updates are grouped separately; action updates are grouped together.

## Update Procedure

1. Read the official release and migration notes for every major update.
2. Confirm runtime engines and peer dependency ranges with `pnpm view <package> engines peerDependencies`.
3. Raise direct dependency ranges deliberately in the owning `package.json` files.
4. Run `corepack pnpm install` and review both manifest and lockfile changes.
5. Run `corepack pnpm audit`, then format, lint, typecheck, unit tests, and builds.
6. Run Playwright through `https://impostor.localhost` with the local Caddy route active.
7. Update this baseline, the changelog, and any affected runbooks or architecture documentation.

Do not use `pnpm update --latest` as an unattended merge step. Major versions and runtime type
packages require the compatibility review above.
