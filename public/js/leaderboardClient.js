// Thin client for the shared leaderboard API served by the Node backend.

export async function fetchLeaderboard() {
  const res = await fetch("/api/leaderboard", { cache: "no-store" });
  if (!res.ok) throw new Error(`leaderboard fetch failed: ${res.status}`);
  return res.json(); // { entries, size, nameMaxLength }
}

export async function submitScore(name, score) {
  const res = await fetch("/api/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, score }),
  });
  if (!res.ok) {
    // Rate-limited or rejected: treat as "didn't make it" rather than crashing.
    return { rank: null, entries: null, error: true };
  }
  return res.json(); // { rank, entries }
}

// Local mirror of the server's rankFor, for showing a provisional rank/name-entry
// UI before the authoritative POST round-trips.
export function rankFor(entries, score) {
  for (let i = 0; i < entries.length; i++) {
    if (score >= entries[i].score) return i + 1;
  }
  return null;
}
