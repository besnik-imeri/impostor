source visual truth path: user-supplied conversation attachment for the neon Impostor mobile/desktop redesign (visible in thread; no local filesystem path)

implementation screenshots:

- `output/playwright/splash-mobile.png`
- `output/playwright/play-mobile.png`
- `output/playwright/host-desktop.png`
- `output/playwright/round-desktop.png`

viewport:

- mobile splash: 390 x 844
- mobile play/lobby: 390 x 844
- desktop host: 1440 x 900
- desktop live round: 1440 x 900

state:

- splash route at `/`
- pre-room play setup at `/play`
- live three-player round after creating a room locally and starting round 1

full-view comparison evidence:

- Mobile splash now matches the reference structure: phone frame, status bar, large glitch wordmark, centered split mascot slot, three stat cells, neon host/join/rules controls, and bottom tagline.
- Mobile lobby now matches the reference structure: status bar, wordmark/action topbar, current lobby card, quick play row, four neon action tiles, profile strip, and leaderboard preview.
- Desktop host now matches the reference structure: sidebar navigation, neon topbar, host setup panel with mode cards/settings, and lobby preview panel with code, QR slot, avatar row, and create CTA.
- Desktop live round now matches the reference structure: sidebar/topbar, how-to-play instruction cards, round/player score panel, and take-action panel with accuse/suspect/clear controls plus real player targets.

focused region comparison evidence:

- Typography: checked wordmark/title scale, neon text shadows, compact labels, and button weights across mobile and desktop captures.
- Spacing/layout rhythm: checked phone borders, card gaps, desktop sidebar width, host grid columns, preview panel fit, and first-viewport clipping.
- Colors/tokens: checked hot pink, cyan, purple, yellow, dark panel backgrounds, borders, and glow hierarchy.
- Image quality/assets: checked avatar rendering, QR placeholder treatment, mascot placeholder slot, and icon consistency.
- Copy/content: checked visible labels against the mock: Host Game, Join Game, Game Modes, How To Play, Current Lobby, Lobby Preview, Take Action, Accuse, Suspect, Clear.

findings:

- No actionable P0/P1/P2 findings remain.

patches made since previous QA pass:

- Tightened splash vertical spacing so the rules button and footer fit at 390 x 844.
- Restored the mobile play status bar and moved app topbar actions to the right edge.
- Enlarged the mobile wordmark.
- Compressed desktop host form spacing so the host board and preview fit in the first viewport.
- Added a live-round three-panel layout while preserving real player action buttons.
- Added placeholder inventory at `design/placeholders.md`.

follow-up polish:

- P3: Replace temporary wordmark, mascot, QR frame, pixel icon set, texture overlays, and score badge with final designed assets from `design/placeholders.md`.
- P3: If a licensed/brand display font is chosen, tune the wordmark/title metrics to that exact font.

final result: passed
