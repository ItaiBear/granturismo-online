"use strict";

const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");

const PLACEHOLDER = "______";

/**
 * JSON-file backed, fixed-size top-N leaderboard. Ported from the original
 * game's granturismo/game/leaderboard.py:
 *   - always padded to `size` entries (placeholder name, score 0)
 *   - rankFor: 1-based slot a score would take (score >= entry.score), else null
 *   - submit: insert if it qualifies, truncate to size, persist atomically
 *
 * Writes are serialized through an in-process promise queue so concurrent
 * submissions never interleave (Node is single-threaded, so this is enough —
 * no native SQLite dependency / build toolchain needed).
 */
class Leaderboard {
  constructor(filePath, size, nameMaxLength) {
    this.path = filePath;
    this.size = size;
    this.nameMaxLength = nameMaxLength;
    this.entries = this._pad([]);
    this._writeChain = Promise.resolve();
    this._load();
  }

  _load() {
    try {
      const raw = JSON.parse(fs.readFileSync(this.path, "utf-8"));
      const entries = raw.map((e) => ({
        name: this._sanitizeName(String(e.name)),
        score: Math.trunc(Number(e.score)) || 0,
      }));
      this.entries = this._pad(entries);
    } catch (err) {
      // Missing / corrupt file -> start fresh and write a clean one.
      this.entries = this._pad([]);
      this._enqueueWrite();
    }
  }

  list() {
    return this.entries.map((e) => ({ name: e.name, score: e.score }));
  }

  /** 1-based rank a score would slot into, or null if it doesn't qualify. */
  rankFor(score) {
    for (let i = 0; i < this.entries.length; i++) {
      if (score >= this.entries[i].score) return i + 1;
    }
    return null;
  }

  /**
   * Insert a score if it qualifies. Returns { rank, entries } where rank is
   * null when the score didn't make the board.
   */
  async submit(name, score) {
    const rank = this.rankFor(score);
    if (rank === null) {
      return { rank: null, entries: this.list() };
    }
    const entry = { name: this._sanitizeName(name), score };
    this.entries.splice(rank - 1, 0, entry);
    this.entries = this.entries.slice(0, this.size);
    await this._enqueueWrite();
    return { rank, entries: this.list() };
  }

  _pad(entries) {
    const result = entries.slice(0, this.size);
    while (result.length < this.size) {
      result.push({ name: PLACEHOLDER, score: 0 });
    }
    // Keep it sorted high-to-low so rankFor stays correct even if the file
    // was hand-edited out of order.
    result.sort((a, b) => b.score - a.score);
    return result;
  }

  _sanitizeName(name) {
    if (!name) return PLACEHOLDER;
    // Keep only letters/digits (any script), then cap length — matches the
    // client-side name filter and keeps the board free of junk/markup.
    const out = String(name).replace(/[^\p{L}\p{N}]/gu, "").slice(0, this.nameMaxLength);
    return out.length ? out : PLACEHOLDER;
  }

  _enqueueWrite() {
    this._writeChain = this._writeChain.then(
      () => this._writeNow(),
      () => this._writeNow()
    );
    return this._writeChain;
  }

  async _writeNow() {
    await fsp.mkdir(path.dirname(this.path), { recursive: true });
    const tmp = `${this.path}.${process.pid}.${Date.now()}.tmp`;
    const payload = JSON.stringify(this.entries, null, 2);
    await fsp.writeFile(tmp, payload, "utf-8");
    await fsp.rename(tmp, this.path);
  }
}

module.exports = { Leaderboard, PLACEHOLDER };
