# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**GranTurismo Online** — a web (HTML5 Canvas) port of the original GranTurismo pygame
driving game, served by a Node/Express backend with a globally shared leaderboard. It is
deployed on this VPS at **http://localhost:9000** behind a cloudflare tunnel.

The original Python/pygame game (the behavioral source of truth for this port) is a separate
repo, [ItaiBear/GranTurismo](https://github.com/ItaiBear/GranTurismo). On this VPS it also
exists locally at `./GranTurismo/` (gitignored — its own git repo, not vendored here). When
porting/fixing gameplay, that package is the reference: gameplay values live in
`GranTurismo/config.json` and are mirrored into `public/js/config.js`.

## Commands

```bash
npm install
PORT=9000 npm start            # run locally -> http://localhost:9000

# Service (production on this VPS)
systemctl restart granturismo  # after server/ changes
systemctl status granturismo
journalctl -u granturismo -n 50

# Quick checks (no test framework configured)
node --check server/server.js                       # CommonJS syntax check
node --check --input-type=module < public/js/app.js # ESM syntax check
```

There is **no build step** — the client is plain ES modules loaded directly by the browser.
Note `package.json` is `type: commonjs` (for `server/`), so `node --check` on a `public/js`
file fails unless you pipe it with `--input-type=module` (as above).

## Architecture

Two halves that meet only at the leaderboard HTTP API:

### Client (`public/`, browser ES modules, no bundler)
A faithful re-implementation of the pygame original. Two ideas carry over from it:

- **`app.js` is a scene state-machine over a single persistent `World`** (`world.js`). The
  World (road, scroll speed, AI cars, trees, player, mute/volume) is never torn down; scenes
  mutate it. Scenes swap via `app.setScene(SceneClass, ...args)`; they reference each other
  only through `app.scenes.*` (no inter-scene imports → no cycles).
- **Fixed-timestep loop** (60 logic updates/sec via an accumulator in `App.start`). The
  original's movement is per-frame integer math at 60fps; this preserves feel on any refresh
  rate. Wall-clock timing (difficulty ramp, countdown) uses `app.now()` = `performance.now()`.

Scene flow (`public/js/scenes/`): `MainMenu → Transition → Countdown → Gameplay → GameOver`,
with `Pause` as a modal overlay. `public/js/game/` holds the ported pure logic (road,
entities, spawner, collision); `public/js/ui/` holds rounded-panel / sliding-panel / text
helpers.

Conventions specific to the web port:
- **Sprites use runtime colorkey → alpha** (`assets.js`): source PNGs have a solid colorkey
  background (magenta `255,174,201`; player green `34,177,76`) converted to transparency on
  load. All surfaces are **preloaded in `main.js`** so scenes can use the synchronous
  `image(src, colorkey)` accessor during render.
- **Canvas renders at internal 1300×700** and is scaled to fit (CSS `aspect-ratio`); pointer
  coords are mapped back to internal space in `App._toInternal`.
- **Input**: keyboard via `config.keys` tokens (`input.js` normalizes DOM keys); touch via
  tap-left/right halves to steer (in `gameplay.js`). Name entry uses a focused HTML `<input>`
  overlay (`#nameEntry`) so the mobile keyboard works — while it's focused, `app.js` suppresses
  canvas keydown dispatch.
- Fonts: `Carlito` (Calibri-metric) and `Comic Neue` (Comic-Sans-like), bundled under
  `public/assets/fonts/` and mapped from the original SysFont names in `ui/text.js`.

### Server (`server/`, Node + Express)
`server.js` serves `public/` statically and the leaderboard API; `leaderboard.js` is a
JSON-file store (`server/data/leaderboard.json`, gitignored) ported from the original's
`leaderboard.py` — fixed-size padded top-N, atomic temp-file+rename writes serialized through
an in-process promise queue (no native DB dependency).

- `GET /api/leaderboard` → `{ entries, size, nameMaxLength }`
- `POST /api/score {name, score}` → `{ rank, entries }` (`rank` null if it didn't qualify)

**Pragmatic anti-abuse** (scores are client-computed, so this only raises the bar): name
sanitized to letters/digits + length cap, score must be a non-negative int ≤
`MAX_PLAUSIBLE_SCORE`, and per-IP rate limiting (`express-rate-limit`, `trust proxy` on for
the cloudflare-forwarded IP). The original's destructive "reset leaderboard" button is
intentionally **omitted** here because the board is now global/shared.
