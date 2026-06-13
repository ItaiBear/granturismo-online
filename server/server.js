"use strict";

const path = require("path");
const express = require("express");
const rateLimit = require("express-rate-limit");

const { Leaderboard } = require("./leaderboard");

const PORT = parseInt(process.env.PORT || "9000", 10);
const PUBLIC_DIR = path.join(__dirname, "..", "public");
const DATA_FILE = path.join(__dirname, "data", "leaderboard.json");

// Mirror of the original game's config (granturismo/config.json -> leaderboard).
const LEADERBOARD_SIZE = 8;
const NAME_MAX_LENGTH = 6;

// Pragmatic anti-abuse ceiling. Score accrues ~speed/frame at 60fps; even a
// multi-hour run stays well under this, so anything above is obviously forged.
const MAX_PLAUSIBLE_SCORE = 100_000_000;

const board = new Leaderboard(DATA_FILE, LEADERBOARD_SIZE, NAME_MAX_LENGTH);

const app = express();
// Behind the cloudflare tunnel: trust the forwarded client IP for rate limiting.
app.set("trust proxy", 1);
app.use(express.json({ limit: "4kb" }));

// ---- API ----

const scoreLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // max score submissions per IP per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions, slow down." },
});

app.get("/api/leaderboard", (req, res) => {
  res.json({ entries: board.list(), size: LEADERBOARD_SIZE, nameMaxLength: NAME_MAX_LENGTH });
});

app.post("/api/score", scoreLimiter, async (req, res) => {
  const body = req.body || {};
  const rawScore = body.score;
  const rawName = typeof body.name === "string" ? body.name : "";

  if (typeof rawScore !== "number" || !Number.isFinite(rawScore)) {
    return res.status(400).json({ error: "score must be a number" });
  }
  const score = Math.trunc(rawScore);
  if (score < 0 || score > MAX_PLAUSIBLE_SCORE) {
    return res.status(400).json({ error: "score out of range" });
  }

  try {
    const result = await board.submit(rawName, score);
    res.json({ rank: result.rank, entries: result.entries });
  } catch (err) {
    console.error("submit failed:", err);
    res.status(500).json({ error: "internal error" });
  }
});

// ---- Static game ----

app.use(express.static(PUBLIC_DIR));

// Fallback to the game page for any non-API route.
app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`GranTurismo Online listening on http://0.0.0.0:${PORT}`);
});
