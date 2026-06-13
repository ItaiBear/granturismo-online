# GranTurismo Online

A web (HTML5 Canvas) remake of the original **GranTurismo** pygame driving game by
Itai Bear (2020), with a **globally shared leaderboard**. The original desktop Python
game lives in its own repository,
[ItaiBear/GranTurismo](https://github.com/ItaiBear/GranTurismo), and is the reference
implementation; the gameplay values and logic here are ported from it 1:1.

Dodge oncoming traffic on an endless three-lane highway. Your speed — and the score —
keep climbing the longer you survive.

## Play

Served at **http://localhost:9000** (exposed publicly via a cloudflare tunnel).

### Controls

| Action        | Desktop            | Mobile / touch              |
| ------------- | ------------------ | --------------------------- |
| Steer lanes   | ← / →              | Tap left / right half       |
| Pause         | `P` or pause icon  | Pause icon                  |
| Mute          | `M` or mute icon   | Mute icon                   |
| Volume        | `+` / `-`          | —                           |
| Reset speed*  | `R` (menu)         | —                           |
| Play again    | `Space` or button  | Button                      |
| Enter name    | type (when ranked) | tap the name field, type    |

\* `R` on the main menu resets the menu's background scroll speed.

## Architecture

```
public/        Static game — ES-module JS + Canvas (no build step)
  js/game/     Road, entities, spawner, collision (ported from granturismo/game/)
  js/scenes/   MainMenu -> Transition -> Countdown -> Gameplay -> GameOver (+ Pause)
  js/ui/       Rounded panels, sliding panel, text helpers
server/        Node + Express: serves public/ and the leaderboard API
  leaderboard.js  JSON-file store, atomic writes, in-process write queue
```

The original Python/pygame game (the reference for this port) is at
[ItaiBear/GranTurismo](https://github.com/ItaiBear/GranTurismo).

The game runs a **fixed-timestep loop** (60 logic updates/sec) so the per-frame
movement feel matches the desktop original on any display refresh rate. The canvas
renders at an internal 1300×700 and scales to fit while preserving aspect ratio.

### Leaderboard API

| Method | Route                | Body                 | Returns                          |
| ------ | -------------------- | -------------------- | -------------------------------- |
| GET    | `/api/leaderboard`   | —                    | `{ entries, size, nameMaxLength }` |
| POST   | `/api/score`         | `{ name, score }`    | `{ rank, entries }` (`rank` null if it didn't qualify) |

**Anti-abuse (pragmatic):** server-side name sanitization + length cap, an implausible-
score ceiling, and per-IP rate limiting. Note: because the score is computed in the
browser, a determined user can still forge submissions — these checks only raise the bar.

The destructive "reset leaderboard" button from the desktop original is intentionally
**omitted** here, since the board is now shared globally.

## Development

```bash
npm install
PORT=9000 npm start        # http://localhost:9000
```

Leaderboard data is stored in `server/data/leaderboard.json` (gitignored).

## Deployment (this VPS)

Runs as a systemd service that auto-starts on boot and restarts on failure:

```bash
cp systemd/granturismo.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now granturismo
```

## Credits

Original game, art, and design by **Itai Bear**, May 2020. Bundled fonts: Carlito and
Comic Neue (SIL Open Font License).
