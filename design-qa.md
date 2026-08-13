# Impostor Arcade Design QA

## Source visual truth

- Landing page: `impostor_arcade_experiment/impostor_arcade_files/landing-page-reference.png`
- Game application: `impostor_arcade_experiment/impostor_game_mobile_ui-goal.png`
- Supplied character and cabinet artwork: `impostor_arcade_experiment/impostor_arcade_files/`

The landing reference is a single 841 x 1870 composition and was compared against an implementation capture at that exact width. The game reference is a 1728 x 921 board containing two mobile frames and two desktop frames, so each implementation surface was compared against the corresponding frame and interaction state rather than treating the outer board as one browser viewport.

## Implementation evidence

| Surface    | Viewport   | State                                           | Screenshot                                    |
| ---------- | ---------- | ----------------------------------------------- | --------------------------------------------- |
| Landing    | 841 x 1870 | Full landing route                              | `output/playwright/landing-arcade-841.png`    |
| Landing    | 390 x 844  | Responsive first viewport                       | `output/playwright/landing-arcade-mobile.png` |
| Play home  | 390 x 844  | Pre-room mobile setup                           | `output/playwright/play-arcade-mobile.png`    |
| Host setup | 390 x 844  | Mobile host form                                | `output/playwright/play-host-mobile.png`      |
| Host setup | 1440 x 900 | Desktop host form                               | `output/playwright/play-host-desktop.png`     |
| Live round | 1440 x 900 | Three-player Suspicion round, non-impostor view | `output/playwright/play-round-desktop.png`    |

Full-view comparisons were performed with each source image and the matching implementation screenshot in the same visual-review input. Focused mobile and live-round captures were also reviewed because the game source is a multi-frame board.

## QA passes and fixes

### Pass 1 findings

- P1: the landing page was materially taller than the source and the below-hero sections did not follow its compact rhythm.
- P1: the final call to action used a different composition from the source.
- P1: the mobile cabinet used a fixed oversized crop that could hide controls and focus rings.
- P2: the how-it-works illustrations approximated source artwork with generic boxes.
- P2: mobile section navigation disappeared, small labels were difficult to read, and selected-mode semantics did not match the control behavior.
- P2: decorative CSS art substituted for a missing UFO asset, hero images loaded late, decorative character alt text was repetitive, and focus treatment could be clipped.

### Fixes applied

- Rebuilt the hero from the supplied full cabinet, wordmark, and character art, with proportional responsive sizing.
- Reworked vertical spacing, how-it-works, lobby, modes, and the final call to action to follow the source composition at 841px.
- Kept compact section navigation visible on mobile and preserved keyboard focus visibility.
- Replaced approximate decorative art with supplied assets or library icons; omitted unsupported source art instead of fabricating it.
- Made mode controls honest pressed-state buttons and added explicit player-selection feedback.
- Reserved character image dimensions, prioritized above-the-fold assets, added reduced-motion handling, and scoped the new visual system to landing and play surfaces.
- Rebuilt `/play` around real room state while preserving create, join, ready, start, accuse, suspicion, results, reset, copy-code, leave, and connection behavior.
- Removed fake global leaderboard, quick-play, pre-creation QR, and unsupported Clear claims while keeping the reference's structure and hierarchy.
- Corrected mobile focus handoff, the compact Leave control's accessible name, setup-group semantics, and light-theme card/status contrast during the final independent audit.

## Final comparison

- Typography: the supplied wordmark, Press Start 2P display face, Space Mono supporting face, pixel scale, glow hierarchy, and uppercase labels visually match the arcade language.
- Spacing and layout: the 841px landing composition, mobile cabinet, section rhythm, desktop sidebar, host grid, live-round panels, and first-viewport fit were checked directly.
- Color and effects: cyan, hot pink, purple, yellow, near-black panels, scanlines, grid treatments, borders, and focus rings remain consistent across both routes.
- Image quality: all 17 optimized WebP assets decode successfully, retain alpha, and render without stretched or approximate substitutes.
- Copy and product truth: visible actions describe behavior that exists. Unsupported reference features are clearly unavailable or absent rather than simulated.
- Icons: touched controls use the installed pixel icon library; no emoji, handcrafted SVG, or text-symbol substitutes remain.
- States and responsiveness: landing selection, host and join setup, live lobby, Accusation and Suspicion rounds, results, 390 x 844 mobile, 841px reference width, and 1440 x 900 desktop were covered.
- Accessibility: semantic headings and forms, pressed states, disabled unavailable mode, decorative alt handling, skip navigation, focus-visible styles, reduced motion, and horizontal overflow were checked.
- Runtime: Playwright covered the core journey in both mobile and desktop Chrome. Landing and play routes emitted no console errors or uncaught page errors.

## Remaining P3 polish

- Custom coin and UFO sprites were not supplied; the landing uses library icons for coins and omits the UFO rather than inventing artwork.
- The supplied character art is richer than the simplified figures in the landing mock, by design.
- A custom `LET'S PLAY` mini-cabinet screen could tighten the final call-to-action illustration if that asset is produced later.
- The game reference depicts public matchmaking, a pre-creation QR preview, a global leaderboard, and a Clear action that are outside the current product capability. The implementation generates its QR only after a real room exists and keeps the remaining visual hierarchy without false functional claims.

No actionable P0, P1, or P2 visual findings remain.

Baseline final result: passed

# System-wide wordmark revalidation — 2026-07-17

## Source visual truth

- Clean wordmark: `apps/web/public/arcade/wordmark-hq.png`
- Production asset: `apps/web/public/arcade/wordmark-hq.webp`

## Intended implementation evidence

| Surface  | Viewport   | State                             | Screenshot  |
| -------- | ---------- | --------------------------------- | ----------- |
| Landing  | 841 x 1870 | Navigation and cabinet marquee    | unavailable |
| Landing  | 390 x 844  | Responsive navigation and marquee | unavailable |
| Play app | 1440 x 900 | Shared desktop app top bar        | unavailable |
| Play app | 390 x 844  | Shared mobile app top bar         | unavailable |

The shared `BrandWordmark` implementation is present in the landing navigation, hero marquee, and the `AppTopBar` used by setup, lobby, live-round, and results states. Formatting, lint, type checking, unit tests, and the production web build pass.

## Findings

- No code-level or asset-level P0/P1/P2 finding remains.
- Browser-rendered comparison evidence is missing. The selected Codex in-app browser refused navigation to the local `https://impostor.localhost` URL under its URL policy, so the revised brand surfaces could not be captured without user action.

## Comparison evidence

- Full-view comparison: blocked because no post-change browser capture is available.
- Focused wordmark comparison: blocked for the same reason; the source asset is available, but Design QA requires the rendered implementation in the same comparison input.
- Comparison history: no visual fix iteration was performed because the first implementation capture could not be produced.

## Implementation checklist

- Refresh the already-open `https://impostor.localhost/` page in the in-app browser.
- Capture the landing navigation/marquee and the `/play` app header at desktop and mobile widths.
- Compare each rendered logo with the clean source asset in one visual input, then resolve any sizing or contrast issue before changing this result to `passed`.

final result: blocked
