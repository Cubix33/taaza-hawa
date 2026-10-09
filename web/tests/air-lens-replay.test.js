import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HOUR, REPLAY_HOURS, bucketHourly, replayAnchor, bestHour, replayReading, coverage, agoText, mapLimit } from '../src/lib/air-lens-replay.js';

const T = 1791568800; // an exact hour, as the live API returns them

test('hourly frames: one per hour, newest first, sized to the window', () => {
  const frames = bucketHourly([{ ts: T - 2 * HOUR, aqi: 140 }, { ts: T - HOUR, aqi: 120.4 }, { ts: T, aqi: 99.6 }], T);
  assert.equal(frames.length, REPLAY_HOURS);
  assert.deepEqual(frames.slice(0, 4), [100, 120, 140, null]);
});

test('gaps stay gaps: an hour without a reading is null, never interpolated or carried forward', () => {
  const frames = bucketHourly([{ ts: T - 5 * HOUR, aqi: 200 }, { ts: T, aqi: 100 }], T);
  assert.deepEqual(frames.slice(0, 6), [100, null, null, null, null, 200]);
  assert.equal(frames.filter((v) => v != null).length, 2);
});

test('several readings in one hour: the latest timestamp wins, whatever the list order', () => {
  const frames = bucketHourly([{ ts: T + 1800, aqi: 90 }, { ts: T + 600, aqi: 300 }, { ts: T + 1200, aqi: 150 }], T);
  assert.equal(frames[0], 90);
  // equal timestamps: the later point in the list wins
  assert.equal(bucketHourly([{ ts: T, aqi: 10 }, { ts: T, aqi: 20 }], T)[0], 20);
});

test('readings after the anchor hour or older than the window are dropped, not clamped', () => {
  const frames = bucketHourly([{ ts: T + HOUR, aqi: 50 }, { ts: T - 24 * HOUR, aqi: 60 }, { ts: T - 23 * HOUR, aqi: 70 }], T);
  assert.equal(frames[0], null);
  assert.equal(frames[23], 70);
  assert.equal(frames.filter((v) => v != null).length, 1);
});

test('unusable points are ignored instead of becoming zero', () => {
  const frames = bucketHourly([{ ts: T, aqi: null }, { ts: T - HOUR, aqi: -4 }, { ts: 'x', aqi: 80 }, null, { ts: T - 2 * HOUR, aqi: 0 }], T);
  assert.deepEqual(frames.slice(0, 3), [null, null, 0]);
  assert.deepEqual(bucketHourly(undefined, T), Array(REPLAY_HOURS).fill(null));
  assert.deepEqual(bucketHourly([{ ts: T, aqi: 5 }], null), Array(REPLAY_HOURS).fill(null));
});

test('anchor is the newest hour that at least two stations reported', () => {
  const fresh = [{ ts: T - HOUR, aqi: 1 }, { ts: T, aqi: 1 }];
  const stray = [{ ts: T + 9 * HOUR, aqi: 1 }];
  const stale = [{ ts: T - 10 * HOUR, aqi: 1 }];
  assert.equal(replayAnchor([fresh, fresh, stray, stale]), T);
  assert.equal(replayAnchor([stale]), T - 10 * HOUR); // a single station anchors on itself
  assert.equal(replayAnchor([[], undefined]), null);
  // a stale station keeps its old readings and shows gaps in recent hours
  const frames = bucketHourly(stale, replayAnchor([fresh, fresh, stale]));
  assert.equal(frames[0], null);
  assert.equal(frames[10], 1);
});

test('best hour is the lowest reading; ties go to the most recent hour; all gaps -> null', () => {
  assert.deepEqual(bestHour([140, null, 95, 120, 95]), { ago: 2, value: 95 });
  assert.deepEqual(bestHour([0, 10]), { ago: 0, value: 0 });
  assert.equal(bestHour([null, null]), null);
  assert.equal(bestHour(undefined), null);
});

test('replay readings are marked historical; missing history is unavailable, not zero', () => {
  assert.deepEqual(replayReading([80, null], 0), { value: 80, status: 'historical', historical: true });
  assert.deepEqual(replayReading([80, null], 1), { value: null, status: 'missing', historical: true });
  assert.equal(replayReading(undefined, 0).unavailable, true);
  assert.equal(replayReading(undefined, 0).value, null);
});

test('coverage counts stations with a reading in that hour', () => {
  const m = new Map([[1, [10, null]], [2, [null, null]], [3, [5, 6]]]);
  assert.deepEqual(coverage(m, 0), { have: 2, total: 3 });
  assert.deepEqual(coverage(m, 1), { have: 1, total: 3 });
});

test('labels are relative to the latest reading, in English and Hindi', () => {
  assert.equal(agoText(0, 'en'), 'Latest hour');
  assert.equal(agoText(12, 'en'), '12 h before the latest reading');
  assert.equal(agoText(12, 'hi'), 'नवीनतम रीडिंग से 12 घंटे पहले');
});

test('mapLimit never runs more than the limit at once and keeps input order', async () => {
  let inFlight = 0, peak = 0;
  const items = Array.from({ length: 24 }, (_, i) => i);
  const out = await mapLimit(items, 4, async (n) => {
    inFlight++; peak = Math.max(peak, inFlight);
    await new Promise((r) => setTimeout(r, (n * 7) % 5));
    inFlight--; return n * 2;
  });
  assert.equal(peak, 4);
  assert.deepEqual(out, items.map((n) => n * 2));
  assert.deepEqual(await mapLimit([], 4, async () => 1), []);
});
