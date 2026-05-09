# Game Rules

## Product Shape

Impostor is an in-person social deduction game supported by a mobile-first web app. The app is responsible for logistics: room creation, private role reveal, secret word reveal, timer, accusations, suspicions, scoring, and leaderboard. Conversation and turn-taking happen physically around the group.

The landing page lives at `/` and carries product copy, mode explanation, and the primary play calls to action. The focused game shell lives at `/play`. Room invite URLs and QR codes use `/play?room=CODE`, while legacy `/?room=CODE` URLs remain supported and route into the join flow.

## Players

- Supported players: 3-12.
- Each room has one host.
- Every player chooses a room-scoped nickname, avatar, and color.
- There are no global accounts in MVP.

## Avatars

The game uses app-owned character portraits in `apps/web/public/avatars`.

- Canonical avatar IDs are `boy-1` through `boy-12` and `girl-1` through `girl-12`.
- Avatar IDs are sent as the existing `avatar` string on player payloads.
- Setup groups avatars by boy and girl sets, and the selected portrait appears in lobby, round actions, leaderboard, and results.
- The source asset folder is `impostor-avatars/`; normalized runtime assets live under the web app public directory.

## Room Setup

The host configures:

- Mode: Accusation or Suspicion.
- Category.
- Max players.
- Number of rounds.
- Round duration.

Defaults:

- 6 max players.
- 3 rounds.
- 120 seconds.
- 1 impostor.

## Round Start

When the host starts a round, the server randomly selects:

- One impostor.
- One secret word from the category.
- One starting speaker.

The impostor may be the starting speaker. The app only indicates the starting speaker; it does not track turns after that.

Private reveal:

- Non-impostors see the secret word.
- The impostor sees `IMPOSTOR`.

## Accusation Mode

Any valid accusation immediately ends the round.

Scoring:

- Correct accuser: `+2`.
- Other non-impostors when correct: `+1`.
- Wrong accuser: `-2`.
- Wrongfully accused player: `-1`.
- Impostor accused: `-2`.
- Timer expires or someone else is accused: impostor `+3`.

## Suspicion Mode

Suspicion mode adds one non-retractable suspicion per player during the round. Accusations still resolve the round immediately.

Scoring:

- Correct accuser: `+2`.
- Other non-impostors when correct: `0`.
- Wrong accuser: `-2`.
- Wrongfully accused player: `-1`.
- Non-impostor suspecting impostor: `+1`.
- Non-impostor suspecting wrong player: `-1` per wrong suspicion.
- Impostor accused: `-2`.
- Timer expires or someone else is accused: impostor `+3`.
- Impostor suspected: `-1` per player suspecting.
- Impostor's own suspicions have no point penalty.

## Timer Expiry

When the timer expires, the round resolves immediately as `Impostor got away`. There is no forced accusation phase.

In Suspicion mode, suspicion scoring still applies before the final leaderboard is shown.

## End Of Game

After the configured number of rounds, the game is finished. The player with the highest cumulative score wins.
