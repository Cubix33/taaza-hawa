import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rankNearby, shortName, validPoint, otherPollutant, NEARBY } from '../src/lib/air-lens-nearby.js';

const PIN = [77.2, 28.6];
const KM = 1 / 111.2; // ≈ degrees of latitude per km
const at = (uid, km, pm25, extra = {}) => ({ uid, name: `S${uid}`, lat: PIN[1] + km * KM, lon: PIN[0], age_min: 10, values: { pm25, pm10: pm25 + 50 }, ...extra });
const uids = (r) => r.rows.map((x) => x.uid);

test('only fresh readings rank: stale, missing and undated stations are left out', () => {
  const r = rankNearby(PIN, [
    at(1, 1, 90), at(2, 2, 40, { age_min: 181 }), at(3, 3, 50, { age_min: 180 }),
    at(4, 4, 30, { age_min: null }), at(5, 5, 20, { values: { pm10: 20 } }), at(6, 6, 70),
  ], 'pm25');
  assert.deepEqual(uids(r), [3, 6, 1]);
  assert.equal(r.total, 3);
});

test('radius is 8 km, widening to 15 km only when fewer than 3 stations qualify', () => {
  const close = rankNearby(PIN, [at(1, 1, 90), at(2, 5, 80), at(3, 7.9, 70), at(4, 10, 10)], 'pm25');
  assert.equal(close.radiusKm, 8);
  assert.equal(close.widened, false);
  assert.deepEqual(uids(close), [3, 2, 1]);

  const sparse = rankNearby(PIN, [at(1, 2.6, 99), at(2, 11.4, 77), at(3, 14.9, 89), at(4, 16, 10)], 'pm25');
  assert.equal(sparse.radiusKm, 15);
  assert.equal(sparse.widened, true);
  assert.deepEqual(uids(sparse), [2, 3, 1]);

  const none = rankNearby(PIN, [at(1, 20, 50)], 'pm25');
  assert.equal(none.widened, true);
  assert.equal(none.total, 0);
  assert.deepEqual(none.rows, []);
  assert.equal(none.comparison.kind, 'none');
  assert.deepEqual(NEARBY, { radiusKm: 8, widerKm: 15, minStations: 3, limit: 5, similarShare: 0.1 });
});

test('lowest reading first, ties broken by distance', () => {
  const r = rankNearby(PIN, [at(1, 6, 60), at(2, 1, 80), at(3, 3, 60), at(4, 2, 100)], 'pm25');
  assert.deepEqual(uids(r), [3, 1, 2, 4]);
  assert.deepEqual(r.rows.map((x) => x.rank), [1, 2, 3, 4]);
  assert.ok(r.rows.every((x, i, a) => !i || a[i - 1].value <= x.value));
});

test('invalid pins, coordinates and values never throw and never rank', () => {
  for (const bad of [null, undefined, [], [Number.NaN, 28.6], [200, 28.6], [77.2, -91], 'here', { lon: 77, lat: 28 }]) {
    const r = rankNearby(bad, [at(1, 1, 50)], 'pm25');
    assert.equal(r.comparison.kind, 'invalid');
    assert.deepEqual(r.rows, []);
  }
  assert.equal(rankNearby(PIN, null, 'pm25').comparison.kind, 'invalid');
  const r = rankNearby(PIN, [
    null, {}, at(1, 1, 50, { lat: null }), at(2, 1, 50, { lat: 91 }), at(3, 1, 50, { lon: '77.2' }),
    at(4, 1, -5), at(5, 1, Number.NaN), at(6, 1, '40'), at(7, 1, 60, { values: null }), at(8, 2, 55),
  ], 'pm25');
  assert.deepEqual(uids(r), [8]);
  assert.equal(r.comparison.kind, 'only');
  assert.equal(validPoint([77.2, 28.6]), true);
  assert.equal(validPoint([77.2]), false);
});

test('uses the chosen pollutant and records the other sub-index for context', () => {
  const stations = [at(1, 1, 90, { values: { pm25: 90, pm10: 120 } }), at(2, 2, 60, { values: { pm25: 60, pm10: 300 } }), at(3, 3, 80, { values: { pm25: 80, pm10: 100 } })];
  const pm25 = rankNearby(PIN, stations, 'pm25');
  assert.deepEqual(uids(pm25), [2, 3, 1]);
  assert.equal(pm25.rows[0].other, 300);
  assert.deepEqual(pm25.comparison, { kind: 'lower', difference: 30, otherHigher: true });
  const pm10 = rankNearby(PIN, stations, 'pm10');
  assert.deepEqual(uids(pm10), [3, 1, 2]);
  assert.deepEqual(pm10.comparison, { kind: 'lower', difference: 20, otherHigher: false });
  assert.equal(otherPollutant('pm25'), 'pm10');
  assert.equal(otherPollutant('pm10'), 'pm25');
});

test('comparison is relative to the nearest fresh station', () => {
  const lower = rankNearby(PIN, [at(1, 1, 124), at(2, 4.8, 89), at(3, 3.9, 151)], 'pm25');
  assert.equal(lower.nearest.uid, 1);
  assert.equal(lower.best.uid, 2);
  assert.equal(lower.best.delta, -35);
  assert.equal(lower.nearest.isNearest, true);
  assert.deepEqual(lower.comparison, { kind: 'lower', difference: 35, otherHigher: false });

  assert.equal(rankNearby(PIN, [at(1, 1, 50), at(2, 2, 70), at(3, 3, 90)], 'pm25').comparison.kind, 'nearest-lowest');
  assert.deepEqual(rankNearby(PIN, [at(1, 1, 100), at(2, 2, 95), at(3, 3, 140)], 'pm25').comparison, { kind: 'similar', difference: 5 });
  assert.equal(rankNearby(PIN, [at(1, 1, 0), at(2, 2, 0), at(3, 3, 0)], 'pm25').comparison.kind, 'nearest-lowest');
});

test('the baseline row stays visible when it ranks below the limit, and staleness is reported honestly', () => {
  const stations = [at(1, 0.5, 300), ...[2, 3, 4, 5, 6, 7].map((uid) => at(uid, uid, uid * 10))];
  const r = rankNearby(PIN, stations, 'pm25');
  assert.equal(r.rows.length, NEARBY.limit);
  assert.deepEqual(uids(r), [2, 3, 4, 5, 1]);
  assert.equal(r.rows.at(-1).rank, 7);
  assert.equal(r.nearestIsClosest, true);

  const staleClosest = rankNearby(PIN, [at(9, 0.2, 10, { age_min: 400 }), at(1, 1, 50), at(2, 2, 60), at(3, 3, 40)], 'pm25');
  assert.equal(staleClosest.nearest.uid, 1);
  assert.equal(staleClosest.nearestIsClosest, false);
  assert.ok(!uids(staleClosest).includes(9));
});

test('short names drop only the city and country suffix', () => {
  assert.equal(shortName('Pusa, Delhi, Delhi, India'), 'Pusa');
  assert.equal(shortName('National Institute of Malaria Research, Sector 8, Dwarka, Delhi, Delhi, India'), 'National Institute of Malaria Research, Sector 8, Dwarka');
  assert.equal(shortName('Anand Vihar, New Delhi, India'), 'Anand Vihar');
  assert.equal(shortName('Delhi, India'), 'Delhi');
  assert.equal(shortName(', India'), ', India');
  assert.equal(shortName(null), '');
});
