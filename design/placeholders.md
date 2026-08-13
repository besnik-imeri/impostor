# Impostor Design Asset Inventory

The supplied arcade cabinet, distorted wordmark, and complete 13-character roster are now production assets under `apps/web/public/arcade`. Pixel UI actions use the installed `pixelarticons` library.

The remaining items are optional polish rather than placeholders blocking the current implementation.

| Optional asset              | Potential use                             | Notes                                                                                                     |
| --------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Mascot shield key art       | Future splash or marketing surface        | A transparent split blue/pink Impostor shield could support a separate splash treatment.                  |
| Glitch texture pack         | Background variation                      | Current scanlines and gradients are CSS effects; a tileable texture is only needed for richer art detail. |
| Decorative QR frame         | Live room-sharing polish                  | Live QR generation appears after room creation; this would style the generated code, not simulate one.    |
| Lobby particle frame        | Future lobby embellishment                | Current lobby uses lightweight CSS framing around real room state.                                        |
| Score/star badge            | Future score-strip embellishment          | The live leaderboard is implemented without an image badge dependency.                                    |
| Reference coin/UFO sprites  | Landing-page fidelity polish              | These were not included in the supplied asset set, so the page uses library icons or omits them.          |
| Mini-cabinet screen artwork | Final landing call-to-action illustration | The supplied cabinet is reused honestly; custom `LET'S PLAY` screen art could tighten the last detail.    |
