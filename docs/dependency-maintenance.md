# Dependency Maintenance

This document records the dependency baseline reviewed on 2026-07-11 and the process for
keeping it current. The committed `pnpm-lock.yaml` remains the source of truth for exact
transitive versions.

## Runtime And Toolchain

| Tool                          | Baseline    | Policy                                                                               |
| ----------------------------- | ----------- | ------------------------------------------------------------------------------------ |
| Node.js                       | 24.18.0 LTS | Pinned in `.node-version`; `engines.node` accepts the Node 24 LTS line from 24.11.0. |
| pnpm                          | 11.11.0     | Pinned by `packageManager`; run through Corepack.                                    |
| Cloudflare compatibility date | 2026-07-10  | Shared by the Pages and Worker Wrangler configurations.                              |

Node.js 26 is the current, non-LTS release line as of this review. The project stays on Node.js
24 until the next LTS migration is reviewed and verified.

## Direct Dependency Baseline

| Package                       | Version      | Used By                                        |
| ----------------------------- | ------------ | ---------------------------------------------- |
| `@eslint/js`                  | 10.0.1       | Workspace lint configuration                   |
| `@types/node`                 | 24.13.3      | Workspace tooling types                        |
| `eslint`                      | 10.6.0       | Workspace linting                              |
| `eslint-plugin-react-hooks`   | 7.1.1        | Web linting                                    |
| `eslint-plugin-react-refresh` | 0.5.3        | Web linting                                    |
| `globals`                     | 17.7.0       | Workspace lint configuration                   |
| `prettier`                    | 3.9.5        | Workspace formatting                           |
| `typescript`                  | 6.0.3        | Workspace and web compilation                  |
| `typescript-eslint`           | 8.63.0       | TypeScript linting                             |
| `vitest`                      | 4.1.10       | Workspace, web, Worker, and domain tests       |
| `gsap`                        | 3.15.0       | Landing-page motion                            |
| `lucide-react`                | 1.24.0       | Web icons                                      |
| `qrcode`                      | 1.5.4        | Room invite QR codes                           |
| `react`                       | 19.2.7       | Web runtime                                    |
| `react-dom`                   | 19.2.7       | Web runtime                                    |
| `three`                       | 0.185.1      | Landing-page canvas scene                      |
| `@playwright/test`            | 1.61.1       | Browser end-to-end tests                       |
| `@tailwindcss/vite`           | 4.3.2        | Web CSS build integration                      |
| `@types/qrcode`               | 1.5.6        | QR code types                                  |
| `@types/react`                | 19.2.17      | React types                                    |
| `@types/react-dom`            | 19.2.3       | React DOM types                                |
| `@types/three`                | 0.185.1      | Three.js types                                 |
| `@vitejs/plugin-react`        | 6.0.3        | React build integration                        |
| `tailwindcss`                 | 4.3.2        | Web styling                                    |
| `vite`                        | 8.1.4        | Web development and production build           |
| `wrangler`                    | 4.110.0      | Local Worker runtime and Cloudflare deployment |
| `@cloudflare/workers-types`   | 5.20260710.1 | Worker runtime types                           |

`@impostor/domain` is an internal workspace dependency and uses `workspace:*`; it is not fetched
from a package registry.

## Intentional Holds

- TypeScript 7.0.2 is not adopted because `typescript-eslint` 8.63.0 declares support for
  TypeScript versions below 6.1.0. Upgrade both together after that peer range includes TypeScript 7.
- `@types/node` remains on major 24 so compile-time APIs match the Node.js 24 LTS runtime.
- ESLint 10.7.0 was published during this review and was still inside pnpm's release-age
  quarantine. The baseline uses 10.6.0 rather than adding a supply-chain policy exception.

The Dependabot configuration mirrors the TypeScript and Node type holds so it does not create
known-incompatible pull requests.

## Current Audit Residual

The 2026-07-11 full audit reports one low-severity, development-only advisory:
`@babel/core` 7.29.0 is pulled in by `eslint-plugin-react-hooks` 7.1.1. The advisory identifies
7.29.1 as the first patched Babel 7 release, but that version is not published. Babel 8 is outside
the plugin's declared `^7.24.4` dependency range, so the repository does not force an incompatible
override. There are no known moderate, high, or critical advisories in the refreshed tree.

Recheck this item when either Babel 7.29.1 or a React hooks plugin release with a patched range is
available.

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
