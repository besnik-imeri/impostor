# Game Rules

## Product Shape

Imposter is an in-person social deduction game supported by a mobile-first web app. The app is responsible for logistics: room creation, private role reveal, secret word reveal, timer, accusations, suspicions, scoring, and leaderboard. Conversation and turn-taking happen physically around the group.

## Players

- Supported players: 3-12.
- Each room has one host.
- Every player chooses a room-scoped nickname, avatar, and color.
- There are no global accounts in MVP.

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
- 1 imposter.

## Round Start

When the host starts a round, the server randomly selects:

- One imposter.
- One secret word from the category.
- One starting speaker.

The imposter may be the starting speaker. The app only indicates the starting speaker; it does not track turns after that.

Private reveal:

- Non-imposters see the secret word.
- The imposter sees `IMPOSTER`.

## Accusation Mode

Any valid accusation immediately ends the round.

Scoring:

- Correct accuser: `+2`.
- Other non-imposters when correct: `+1`.
- Wrong accuser: `-2`.
- Wrongfully accused player: `-1`.
- Imposter accused: `-2`.
- Timer expires or someone else is accused: imposter `+3`.

## Suspicion Mode

Suspicion mode adds one non-retractable suspicion per player during the round. Accusations still resolve the round immediately.

Scoring:

- Correct accuser: `+2`.
- Other non-imposters when correct: `0`.
- Wrong accuser: `-2`.
- Wrongfully accused player: `-1`.
- Non-imposter suspecting imposter: `+1`.
- Non-imposter suspecting wrong player: `-1` per wrong suspicion.
- Imposter accused: `-2`.
- Timer expires or someone else is accused: imposter `+3`.
- Imposter suspected: `-1` per player suspecting.
- Imposter's own suspicions have no point penalty.

## Timer Expiry

When the timer expires, the round resolves immediately as `Imposter got away`. There is no forced accusation phase.

In Suspicion mode, suspicion scoring still applies before the final leaderboard is shown.

## End Of Game

After the configured number of rounds, the game is finished. The player with the highest cumulative score wins.
