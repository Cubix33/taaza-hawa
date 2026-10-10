import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WIND_BOUNDS, WIND_GRID, WIND_TTL_MS, WIND_CACHE_KEY, CALM_KMH, COMPASS_WORDS, WIND_WORDS,
  windGrid, windUrl, parseWind, validField, toVector, fromVector, towardDegrees, compassIndex, compassLabel,
  sampleInto, sampleWind, windHeadline, windWord, modelTime, readCache, writeCache, createWindLoader,
  solveHomography, invertHomography, applyHomography,
} from '../src/lib/air-lens-wind.js';

const close = (a, b, eps = 1e-9, msg) => assert.ok(Math.abs(a - b) <= eps, msg || `${a} ≉ ${b}`);
const N = WIND_GRID;

// An Open-Meteo style multi-location response: an array in request order; the first result has
// no location_id, later ones do (as observed from the live API on 9 Oct 2026).
function response(n = N, at = (i) => ({ s: 5 + i * 0.25, d: (i * 10) % 360 })) {
  return windGrid(n).map((p, i) => ({
    latitude: p.lat - 0.03, longitude: p.lon - 0.02, generationtime_ms: 0.05, utc_offset_seconds: 0, timezone: 'GMT', elevation: 215,
    ...(i ? { location_id: i } : {}),
    current_units: { time: 'unixtime', interval: 'seconds', wind_speed_10m: 'km/h', wind_direction_10m: '°' },
    current: { time: 1791552600, interval: 900, wind_speed_10m: at(i).s, wind_direction_10m: at(i).d },
  }));
}
const uniform = (s, d, n = N) => parseWind(response(n, () => ({ s, d })), n);

test('grid covers the Delhi bounds row-major from the south-west, rounded to 3 decimals', () => {
  const g = windGrid();
  assert.equal(g.length, N * N);
  assert.deepEqual(g[0], { lat: WIND_BOUNDS.south, lon: WIND_BOUNDS.west });
  assert.deepEqual(g[N - 1], { lat: WIND_BOUNDS.south, lon: WIND_BOUNDS.east });
  assert.deepEqual(g[N * N - 1], { lat: WIND_BOUNDS.north, lon: WIND_BOUNDS.east });
  assert.deepEqual(g[N], { lat: 28.496, lon: 76.84 }); // second row is one step north
  for (const p of g) assert.equal(String(p.lat).split('.')[1]?.length <= 3 && String(p.lon).split('.')[1].length <= 3, true);
  assert.equal(windGrid(7).length, 49);
  assert.throws(() => windGrid(1), RangeError);
});

test('one keyless URL asks for current 10 m wind at every grid point in km/h', () => {
  const url = new URL(windUrl());
  assert.equal(url.origin + url.pathname, 'https://api.open-meteo.com/v1/forecast');
  assert.equal(url.searchParams.get('current'), 'wind_speed_10m,wind_direction_10m');
  assert.equal(url.searchParams.get('wind_speed_unit'), 'kmh');
  assert.equal(url.searchParams.get('timeformat'), 'unixtime');
  const lats = url.searchParams.get('latitude').split(','), lons = url.searchParams.get('longitude').split(',');
  assert.equal(lats.length, N * N);
  assert.equal(lons.length, N * N);
  assert.equal(lats[0], '28.4');
  assert.equal(lons[N - 1], '77.35');
  assert.equal(url.searchParams.has('apikey'), false);
  assert.ok(windUrl().length < 2000, 'URL stays well under common length limits');
});

test('parsing keeps request order, honours location_id, and builds toward-vectors', () => {
  const f = parseWind(response());
  assert.ok(f && validField(f));
  assert.equal(f.n, N);
  assert.equal(f.time, 1791552600);
  assert.equal(f.speed[0], 5);
  assert.equal(f.from[3], 30);
  close(f.max, 5 + (N * N - 1) * 0.25);
  // A wind from the north (index 0, 0°) moves the air south: u = 0, v = -speed.
  close(f.u[0], 0); close(f.v[0], -5);
  // Shuffled results land in their location_id slot (the id-less first result means index 0).
  assert.equal(parseWind(response().reverse()), null, 'an id-less result out of place collides and is rejected');
  const ids = response().map((r, i) => ({ ...r, location_id: i })).reverse();
  assert.deepEqual(parseWind(ids).speed, f.speed);
  // 360° is north.
  assert.equal(parseWind(response(N, () => ({ s: 4, d: 360 }))).from[0], 0);
});

test('parsing rejects anything that is not a complete, sane km/h grid', () => {
  assert.equal(parseWind(null), null);
  assert.equal(parseWind({ error: true, reason: 'Too many requests' }), null);
  assert.equal(parseWind(response().slice(1)), null);
  assert.equal(parseWind(response(N, (i) => ({ s: i === 7 ? null : 5, d: 90 }))), null);
  assert.equal(parseWind(response(N, (i) => ({ s: 5, d: i === 7 ? Number.NaN : 90 }))), null);
  assert.equal(parseWind(response(N, () => ({ s: -1, d: 90 }))), null);
  const ms = response(); ms[4].current_units.wind_speed_10m = 'm/s';
  assert.equal(parseWind(ms), null);
  const dup = response(); dup[5].location_id = 4;
  assert.equal(parseWind(dup), null);
  const noCurrent = response(); delete noCurrent[2].current;
  assert.equal(parseWind(noCurrent), null);
});

test('"from" degrees become a vector pointing where the air goes (direction + 180°)', () => {
  const cases = [[0, 0, -1], [360, 0, -1], [90, -1, 0], [180, 0, 1], [270, 1, 0], [45, -Math.SQRT1_2, -Math.SQRT1_2], [315, Math.SQRT1_2, -Math.SQRT1_2]];
  for (const [from, u, v] of cases) {
    const vec = toVector(from, 1);
    close(vec.u, u, 1e-12, `u for ${from}`); close(vec.v, v, 1e-12, `v for ${from}`);
  }
  const fast = toVector(225, 10); // from the south-west → toward the north-east
  assert.ok(fast.u > 0 && fast.v > 0);
  close(Math.hypot(fast.u, fast.v), 10);
  for (let d = 0; d < 360; d += 7.5) close(fromVector(toVector(d, 6).u, toVector(d, 6).v), d, 1e-9, `round trip ${d}`);
  close(fromVector(...Object.values(toVector(360, 3))), 0, 1e-9);
  assert.equal(fromVector(0, 0), null, 'calm has no direction');
  assert.equal(towardDegrees(0), 180);
  assert.equal(towardDegrees(360), 180);
  assert.equal(towardDegrees(180), 0);
  assert.equal(towardDegrees(315), 135);
  assert.equal(towardDegrees(-90), 90);
});

test('compass labels wrap at 0/360 for 8 and 16 points', () => {
  for (const [deg, label] of [[0, 'N'], [360, 'N'], [720, 'N'], [-0, 'N'], [359, 'N'], [22.4, 'N'], [22.5, 'NE'], [90, 'E'], [180, 'S'], [225, 'SW'], [315, 'NW'], [-45, 'NW'], [337.4, 'NW'], [337.5, 'N']]) {
    assert.equal(compassLabel(deg, 8), label, `8-point ${deg}`);
  }
  for (const [deg, label] of [[0, 'N'], [360, 'N'], [11.2, 'N'], [11.25, 'NNE'], [33.7, 'NNE'], [33.75, 'NE'], [67.5, 'ENE'], [202.5, 'SSW'], [337.5, 'NNW'], [348.7, 'NNW'], [348.75, 'N']]) {
    assert.equal(compassLabel(deg, 16), label, `16-point ${deg}`);
  }
  assert.equal(compassLabel(Number.NaN), null);
  assert.equal(compassLabel(null), null);
  assert.equal(compassIndex(90, 4), null);
  assert.equal(COMPASS_WORDS.en[compassIndex(315)], 'north-west');
  assert.equal(COMPASS_WORDS.hi[compassIndex(315)], 'उत्तर-पश्चिम');
});

test('the station readout interpolates between grid points and stays honest at the edges', () => {
  const f = uniform(9, 315);
  const mid = sampleWind(f, 77.1, 28.6);
  close(mid.speed, 9, 1e-9); close(mid.from, 315, 1e-9);
  assert.equal(mid.calm, false);
  // halfway between two columns with 350° and 10° → north (0°), not south
  const wrap = parseWind(response(N, (i) => ({ s: 8, d: i % N === 0 ? 350 : 10 })));
  const between = sampleWind(wrap, WIND_BOUNDS.west + (WIND_BOUNDS.east - WIND_BOUNDS.west) / (N - 1) / 2, 28.5);
  assert.ok(Math.min(between.from, 360 - between.from) < 1e-6, `got ${between.from}`);
  // speeds interpolate as scalars
  const ramp = parseWind(response(N, (i) => ({ s: i % N === 0 ? 4 : 8, d: 90 })));
  close(sampleWind(ramp, WIND_BOUNDS.west + (WIND_BOUNDS.east - WIND_BOUNDS.west) / (N - 1) / 2, 28.5).speed, 6, 1e-9);
  // exact grid node = that node's values
  const f2 = parseWind(response());
  const node = sampleWind(f2, windGrid()[N + 2].lon, windGrid()[N + 2].lat);
  close(node.speed, f2.speed[N + 2], 1e-9);
  // a little outside uses the edge; far outside gives no readout
  close(sampleWind(f, WIND_BOUNDS.east + 0.03, 28.6).speed, 9, 1e-9);
  assert.equal(sampleWind(f, 77.9, 28.6), null);
  assert.equal(sampleWind(null, 77.1, 28.6), null);
  assert.equal(sampleWind(f, Number.NaN, 28.6), null);
  // calm, and directions that cancel out
  assert.equal(sampleWind(uniform(1.2, 90), 77.1, 28.6).calm, true);
  const opposed = parseWind(response(N, (i) => ({ s: 6, d: i % N < N / 2 ? 90 : 270 })));
  const centre = (WIND_BOUNDS.west + WIND_BOUNDS.east) / 2;
  const v = sampleWind(opposed, centre, 28.6);
  assert.equal(v.variable, true); assert.equal(v.from, null);
  // the animation sampler writes into a caller-owned buffer and reports the bounds
  const out = new Float64Array(2);
  assert.equal(sampleInto(f, 77.1, 28.6, out), true);
  close(out[0], toVector(315, 9).u, 1e-9); close(out[1], toVector(315, 9).v, 1e-9);
  assert.equal(sampleInto(f, 77.36, 28.6, out), false);
});

test('readout wording: plain compass words, km/h, Hindi and English, calm and variable', () => {
  const s = sampleWind(uniform(8.4, 315), 77.1, 28.6);
  assert.equal(windHeadline(s, 'en'), 'Wind from the north-west · 8 km/h');
  assert.equal(windHeadline(s, 'hi'), 'हवा उत्तर-पश्चिम से आ रही है · 8 किमी/घंटा');
  assert.equal(windHeadline(sampleWind(uniform(1, 200), 77.1, 28.6), 'en'), WIND_WORDS.calm.en);
  assert.equal(windHeadline({ speed: 6.2, from: null, calm: false, variable: true }, 'hi'), 'हवा की दिशा बदलती हुई · 6 किमी/घंटा');
  assert.equal(windHeadline(null), null);
  assert.equal(windWord('toggle', 'hi'), 'हवा का बहाव दिखाएँ (मॉडल)');
  assert.equal(windWord('toggle', 'en'), 'Show wind (model)');
  assert.match(modelTime(1791552600, 'en'), /^7:00\s?pm$/i); // 13:30 UTC = 19:00 IST
  assert.equal(modelTime(0), '');
  assert.ok(CALM_KMH > 1.8 && CALM_KMH <= 2, 'calm is under about 1 knot');
});

test('no wind wording ever links the wind to pollution, smoke or a reading moving', () => {
  const strings = Object.values(WIND_WORDS).flatMap((e) => [e.en, e.hi]);
  for (let d = 0; d < 360; d += 22.5) for (const lang of ['en', 'hi']) strings.push(windHeadline({ speed: 9, from: d, calm: false, variable: false }, lang));
  strings.push(windHeadline({ speed: 9, from: null, calm: false, variable: true }, 'en'), windHeadline({ speed: 9, from: null, calm: false, variable: true }, 'hi'));
  const banned = /pollut|smoke|carr(y|ies|ied)|bring|brought|blow(s|ing)? (in|over)|caus|toxic|प्रदूषण|धुआँ|धुएँ|लाती|लाता|ला रही|फैला/i;
  for (const s of strings) assert.doesNotMatch(s, banned, s);
  for (const [key, e] of Object.entries(WIND_WORDS)) {
    assert.ok(e.en && e.hi && e.en !== e.hi, `${key} has both languages`);
    assert.match(e.hi, /[ऀ-ॿ]/, `${key} Hindi is in Devanagari`);
  }
  assert.match(WIND_WORDS.model.en, /model/i, 'the model is labelled as a model');
  assert.match(WIND_WORDS.attribution.en, /^Weather data by Open-Meteo\.com$/, 'CC BY 4.0 credit text');
});

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), map: m };
}

test('sessionStorage cache round-trips a compact field and expires after ~30 minutes', () => {
  const store = memoryStorage(), f = parseWind(response());
  writeCache(store, f, 1000);
  const raw = JSON.parse(store.map.get(WIND_CACHE_KEY));
  assert.equal('u' in raw.field, false, 'derived vectors are not stored');
  const back = readCache(store, 1000 + WIND_TTL_MS - 1);
  assert.deepEqual(back.field.speed, f.speed);
  close(back.field.u[5], f.u[5], 1e-12);
  assert.equal(readCache(store, 1000 + WIND_TTL_MS), null);
  assert.equal(readCache(store, 999), null, 'a cache from the future is ignored');
  store.setItem(WIND_CACHE_KEY, '{not json');
  assert.equal(readCache(store, 1000), null);
  store.setItem(WIND_CACHE_KEY, JSON.stringify({ fetched: 1000, field: { n: 6, bounds: WIND_BOUNDS, speed: [1], from: [2] } }));
  assert.equal(readCache(store, 1000), null);
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } };
  assert.equal(readCache(broken, 1000), null);
  assert.doesNotThrow(() => writeCache(broken, f, 1000));
  assert.equal(readCache(null, 1000), null);
});

test('the loader fetches once per ~30 minutes, shares in-flight requests and never rejects', async () => {
  let now = 0, calls = 0, mode = 'ok';
  const fetchImpl = async (url) => {
    calls++;
    assert.ok(url.startsWith('https://api.open-meteo.com/v1/forecast?'));
    if (mode === 'down' || (mode === 'flaky' && calls % 2 === 1)) throw new TypeError('Failed to fetch');
    if (mode === '429') return { ok: false, status: 429, json: async () => ({ error: true }) };
    if (mode === '503') return { ok: false, status: 503, json: async () => ({}) };
    if (mode === 'junk') return { ok: true, json: async () => ({ hello: 'world' }) };
    return { ok: true, json: async () => response() };
  };
  const store = memoryStorage();
  const options = { fetchImpl, clock: () => now, retryDelayMs: 0 };
  const load = createWindLoader({ ...options, storage: store });
  const [a, b] = await Promise.all([load(), load()]);
  assert.equal(calls, 1); assert.equal(a, b); assert.ok(validField(a));
  now += WIND_TTL_MS - 1;
  assert.equal(await load(), a); assert.equal(calls, 1);
  // a fresh page load in the same tab reuses sessionStorage
  const again = createWindLoader({ ...options, storage: store });
  assert.deepEqual((await again()).speed, a.speed); assert.equal(calls, 1);
  // after expiry a failed refresh (tried twice) keeps the last field for a while, then hides it
  now += 2; mode = 'down';
  assert.equal(await load(), a); assert.equal(calls, 3);
  assert.equal(await load(), a); assert.equal(calls, 3, 'backs off after a failure');
  now += 60 * 60 * 1000;
  assert.equal(await load(), null); assert.equal(calls, 5);
  // cold failures resolve to null; only network errors and 5xx are retried
  for (const [m, tries] of [['down', 2], ['503', 2], ['429', 1], ['junk', 1]]) {
    mode = m; calls = 0;
    assert.equal(await createWindLoader(options)(), null, m);
    assert.equal(calls, tries, `${m} attempts`);
  }
  // one blip is absorbed by the retry
  mode = 'flaky'; calls = 0;
  assert.ok(validField(await createWindLoader(options)()));
  assert.equal(calls, 2);
  assert.equal(await createWindLoader({ fetchImpl: null, clock: () => now, retryDelayMs: 0 })(), null);
});

test('a homography fitted to 4 points reproduces a pitched-camera projection', () => {
  // A known perspective map from ground (x, y) to screen pixels.
  const H0 = [420, -95, 640, 30, 210, 900, 0.08, -0.42, 1];
  const p = new Float64Array(2), q = new Float64Array(2);
  const ground = [0, 0, 1, 0, 1, -1, 0, -1], screen = new Float64Array(8);
  for (let k = 0; k < 4; k++) { applyHomography(H0, ground[2 * k], ground[2 * k + 1], p); screen[2 * k] = p[0]; screen[2 * k + 1] = p[1]; }
  const H = new Float64Array(9), Hi = new Float64Array(9);
  assert.equal(solveHomography(ground, screen, H), true);
  for (let i = 0; i < 9; i++) close(H[i], H0[i], 1e-6, `h${i}`);
  for (const [x, y] of [[0.3, 0.7], [-0.5, 1.2], [2, -0.4]]) {
    applyHomography(H, x, y, p); applyHomography(H0, x, y, q);
    close(p[0], q[0], 1e-6); close(p[1], q[1], 1e-6);
  }
  assert.equal(invertHomography(H, Hi), true);
  applyHomography(H, 0.25, -0.6, p);
  applyHomography(Hi, p[0], p[1], q);
  close(q[0], 0.25, 1e-9); close(q[1], -0.6, 1e-9);
  // points past the vanishing line come back with w ≤ 0 (behind the camera)
  assert.ok(applyHomography(H, 0, 5, p) <= 0);
  assert.equal(solveHomography([0, 0, 1, 1, 2, 2, 3, 3], screen, H), false, 'collinear points are rejected');
  assert.equal(invertHomography([1, 2, 3, 2, 4, 6, 0, 0, 1], Hi), false);
});
