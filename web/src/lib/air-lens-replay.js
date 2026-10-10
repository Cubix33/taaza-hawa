// Air Lens 24-hour replay: pure helpers (no DOM, no fetch), unit-tested in tests/air-lens-replay.test.js.
//
// Clock note: the backend's reading timestamps carry a known offset against the API's `now`
// (live sample: newest reading ts ≈ now + 4.3 h). Differences *between* reading timestamps are
// exact because they share one clock, so frames are anchored on the latest hour stations
// actually reported, and labelled "N h before the latest reading". Never wall-clock, never `now - ts`.
//
// Honesty: an hour with no reading is a gap (null). Nothing here interpolates or carries values forward.

export const HOUR = 3600;
export const REPLAY_HOURS = 24;

export const hourSlot = (ts) => Math.floor(ts / HOUR) * HOUR;
const usable = (p) => !!p && Number.isFinite(p.ts) && Number.isFinite(p.aqi) && p.aqi >= 0;

// frames[ago] = the station's reading for the clock hour `ago` hours before `anchor`, or null.
// Several readings in one hour: the latest timestamp wins (ties: the later point in the list).
// Readings after the anchor hour or older than the window are ignored, not clamped.
export function bucketHourly(points, anchor, hours = REPLAY_HOURS) {
  const frames = Array(hours).fill(null);
  if (!Number.isFinite(anchor)) return frames;
  const top = hourSlot(anchor), seen = Array(hours).fill(-Infinity);
  for (const p of Array.isArray(points) ? points : []) {
    if (!usable(p)) continue;
    const ago = (top - hourSlot(p.ts)) / HOUR;
    if (ago < 0 || ago >= hours || p.ts < seen[ago]) continue;
    seen[ago] = p.ts; frames[ago] = Math.round(p.aqi);
  }
  return frames;
}

// The newest hour reported by at least two stations (or by the only station that has data).
// One station with a stray future timestamp cannot drag every other station into a "gap".
export function replayAnchor(pointLists) {
  const counts = new Map();
  let stations = 0;
  for (const points of pointLists || []) {
    const slots = new Set((Array.isArray(points) ? points : []).filter(usable).map((p) => hourSlot(p.ts)));
    if (slots.size) stations++;
    for (const slot of slots) counts.set(slot, (counts.get(slot) || 0) + 1);
  }
  const need = Math.min(2, stations);
  let anchor = null;
  for (const [slot, n] of counts) if (n >= need && (anchor === null || slot > anchor)) anchor = slot;
  return anchor;
}

// Lowest reading in the window. Ties go to the most recent hour. All gaps -> null.
export function bestHour(frames) {
  let best = null;
  (frames || []).forEach((value, ago) => { if (value != null && (best === null || value < best.value)) best = { ago, value }; });
  return best;
}

// A marker reading for the map. `historical` tells the map this is a replay value, not live.
export function replayReading(frames, ago) {
  if (!frames) return { value: null, status: 'missing', historical: true, unavailable: true };
  const value = frames[ago] ?? null;
  return { value, status: value == null ? 'missing' : 'historical', historical: true };
}

// How many of the loaded stations have a reading in hour `ago`.
export function coverage(framesByUid, ago) {
  let have = 0, total = 0;
  for (const frames of framesByUid.values()) { total++; if (frames[ago] != null) have++; }
  return { have, total };
}

export const agoText = (ago, lang) => ago === 0
  ? (lang === 'hi' ? 'नवीनतम घंटा' : 'Latest hour')
  : lang === 'hi' ? `नवीनतम रीडिंग से ${ago} घंटे पहले` : `${ago} h before the latest reading`;

// Run `fn` over `items` with at most `limit` calls in flight; results keep input order.
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => { while (next < items.length) { const i = next++; results[i] = await fn(items[i], i); } };
  await Promise.all(Array.from({ length: Math.max(0, Math.min(limit, items.length)) }, worker));
  return results;
}
