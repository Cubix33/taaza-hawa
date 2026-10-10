import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sunPosition, solarNoon, istClock, atIST, cityReading, hazeFromReading, skyLook, skyPhase, veilStops, veilAlpha, hazeUniforms, mixUniforms, sunGlow, skyCaption } from '../src/lib/air-lens-sky.js';

const ist = (local) => new Date(`${local}+05:30`);
const minutesApart = (a, b) => Math.abs(a.getTime() - b.getTime()) / 6e4;
const city = { pitch: 45, bearing: -18, zoom: 10.5, lat: 28.64, height: 660, fov: 36.87 };

// Reference for Delhi on 10 Oct 2026 (r-astro.com/delhi/2026-10-10, Asia/Kolkata):
// sunrise 06:18, solar noon 12:09, sunset 17:57.
test('solar noon in Delhi falls at about 12:08 IST in October', () => {
  const noon = solarNoon(ist('2026-10-10T12:00:00'));
  assert.ok(minutesApart(noon, ist('2026-10-10T12:08:30')) <= 2, `got ${istClock(noon)}`);
  // The highest sun of the day matches the computed solar noon, due south, about 55° up.
  let best = null;
  for (let m = 0; m < 1440; m++) {
    const date = new Date(ist('2026-10-10T00:00:00').getTime() + m * 6e4), p = sunPosition(date);
    if (!best || p.elevation > best.p.elevation) best = { date, p };
  }
  assert.ok(minutesApart(best.date, noon) <= 1);
  assert.ok(Math.abs(best.p.azimuth - 180) < 1);
  assert.ok(Math.abs(best.p.elevation - 55.1) < 0.5, `elevation ${best.p.elevation}`);
});

test('sunrise and sunset match the published times within 3 minutes; night at 21:00 IST', () => {
  const crossings = [];
  for (let m = 1; m < 1440; m++) {
    const at = (k) => sunPosition(new Date(ist('2026-10-10T00:00:00').getTime() + k * 6e4)).elevation;
    if ((at(m - 1) < -0.833) !== (at(m) < -0.833)) crossings.push(new Date(ist('2026-10-10T00:00:00').getTime() + m * 6e4));
  }
  assert.equal(crossings.length, 2);
  assert.ok(minutesApart(crossings[0], ist('2026-10-10T06:18:00')) <= 3, `sunrise ${istClock(crossings[0])}`);
  assert.ok(minutesApart(crossings[1], ist('2026-10-10T17:57:00')) <= 3, `sunset ${istClock(crossings[1])}`);
  const night = sunPosition(ist('2026-10-10T21:00:00'));
  assert.ok(night.elevation < -30, `elevation ${night.elevation}`);
  const dawn = sunPosition(ist('2026-10-10T07:00:00')), dusk = sunPosition(ist('2026-10-10T17:00:00'));
  assert.ok(dawn.azimuth > 90 && dawn.azimuth < 130, 'morning sun is in the east-southeast');
  assert.ok(dusk.azimuth > 230 && dusk.azimuth < 270, 'evening sun is in the west-southwest');
});

test('the sun is almost overhead at the June solstice and low in December', () => {
  assert.ok(Math.abs(sunPosition(ist('2026-06-21T12:20:00')).elevation - 84.8) < 0.6);
  assert.ok(Math.abs(sunPosition(ist('2026-12-21T12:15:00')).elevation - 38) < 0.8);
});

test('IST clock helpers', () => {
  assert.equal(istClock(new Date('2026-10-10T03:30:00Z')), '09:00');
  assert.equal(istClock(new Date('2026-10-10T18:31:00Z')), '00:01');
  assert.equal(atIST(18, 5, ist('2026-10-10T00:10:00')).toISOString(), '2026-10-10T12:35:00.000Z');
  assert.equal(atIST(18, 5, ist('2026-10-10T23:50:00')).toISOString(), '2026-10-10T12:35:00.000Z');
});

test('city reading is the median of fresh readings only', () => {
  const s = (aqi, age_min, values) => ({ aqi, age_min, values });
  assert.equal(cityReading([s(100, 10), s(300, 20), s(200, 5)]), 200);
  assert.equal(cityReading([s(100, 10), s(301, 20)]), 201);
  assert.equal(cityReading([s(100, 10), s(400, 181), s(450, null), s(120, 0)]), 110, 'stale and undated readings are ignored');
  assert.equal(cityReading([s(undefined, 10, { pm25: 180, pm10: 150 })]), 180, 'falls back to the larger PM sub-index');
  assert.equal(cityReading([s(-5, 1), s(null, 1)]), null);
  assert.equal(cityReading([]), null);
});

test('reading to haze is pure, monotonic, bounded and believable', () => {
  assert.deepEqual(hazeFromReading(320), hazeFromReading(320));
  let previous = -1;
  for (let v = 0; v <= 500; v += 5) {
    const h = hazeFromReading(v);
    assert.ok(h.aod > previous, `aod rises at ${v}`);
    assert.ok(h.tint >= 0 && h.tint <= 1);
    previous = h.aod;
  }
  assert.equal(hazeFromReading(800).aod, hazeFromReading(500).aod, 'clamped above 500');
  assert.equal(hazeFromReading(-20).aod, hazeFromReading(0).aod, 'clamped below 0');
  // Band cut-offs shared with readingColor() are exact stops.
  assert.equal(hazeFromReading(50).aod, 0.12);
  assert.equal(hazeFromReading(300).aod, 0.9);
  // Visual range stays in a believable band for Delhi: clear air far, smog a few km.
  assert.ok(hazeFromReading(40).visibilityKm > 25);
  assert.ok(hazeFromReading(320).visibilityKm > 2 && hazeFromReading(320).visibilityKm < 6);
  // No reading means no invented haze.
  for (const v of [null, undefined, NaN]) assert.deepEqual(hazeFromReading(v), { known: false, value: null, aod: 0, tint: 0, visibilityKm: null });
});

test('live mode follows the sun: morning day palette with real sun direction, night after dusk', () => {
  const morning = skyLook({ mode: 'live', date: ist('2026-10-10T09:30:00'), reading: 150 });
  assert.equal(morning.night, false);
  assert.equal(morning.light.anchor, 'map');
  assert.ok(Math.abs(morning.light.position[1] - morning.sun.azimuth) <= 0.5, 'light comes from the sun azimuth');
  assert.ok(Math.abs(morning.light.position[2] - (90 - morning.sun.elevation)) <= 0.5, 'polar angle is the zenith angle');
  const late = skyLook({ mode: 'live', date: ist('2026-10-10T21:00:00'), reading: 150 });
  assert.equal(late.night, true);
  assert.equal(late.phase, 'night');
  assert.equal(late.light.anchor, 'viewport', 'night keeps the Dusk lighting');
  assert.equal(late.glow.strength, 0, 'no sun glow at night');
  assert.equal(skyPhase(-10).daylight, 0);
  assert.equal(skyPhase(30).daylight, 1);
  assert.ok(skyPhase(1).golden > 0.9);
});

test('Dusk and Day keep their fixed looks regardless of the clock', () => {
  const noon = ist('2026-10-10T12:00:00'), night = ist('2026-10-10T23:00:00');
  for (const date of [noon, night]) {
    assert.deepEqual(skyLook({ mode: 'dusk', date, reading: 100 }).light, { anchor: 'viewport', color: '#bce5de', intensity: 0.5, position: [1.5, 200, 35] });
    assert.deepEqual(skyLook({ mode: 'day', date, reading: 100 }).light, { anchor: 'viewport', color: '#fff7de', intensity: 0.35, position: [1.5, 200, 35] });
    assert.equal(skyLook({ mode: 'dusk', date }).night, true);
    assert.equal(skyLook({ mode: 'day', date }).night, false);
  }
});

test('smog softens and warms sunlight and browns the haze', () => {
  const date = ist('2026-10-10T10:00:00');
  const clean = skyLook({ mode: 'live', date, reading: 30 }), smog = skyLook({ mode: 'live', date, reading: 350 });
  assert.ok(smog.light.intensity < clean.light.intensity);
  const [r, g, b] = smog.haze.color, [cr, cg, cb] = clean.haze.color;
  assert.ok(r > b && cb > cr, 'smog haze is warm, clean haze is bluish');
  assert.ok(smog.sky['sky-horizon-blend'] > clean.sky['sky-horizon-blend']);
  for (const look of [clean, smog]) {
    for (const key of ['sky-color', 'horizon-color', 'fog-color']) assert.match(look.sky[key], /^#[0-9a-f]{6}$/);
    for (const key of ['sky-horizon-blend', 'horizon-fog-blend', 'fog-ground-blend', 'atmosphere-blend']) assert.ok(look.sky[key] >= 0 && look.sky[key] <= 1);
  }
  assert.ok(g >= 0 && cg <= 255);
});

test('haze veil thickens with distance, with the reading, and stays readable', () => {
  const look = (reading) => skyLook({ mode: 'live', date: ist('2026-10-10T10:00:00'), reading });
  const smog = veilStops(look(320), city), clean = veilStops(look(40), city);
  assert.ok(smog[0].alpha > smog.at(-1).alpha, 'the top of the screen (far away) is hazier than the bottom (near)');
  smog.forEach((s, i) => assert.ok(s.alpha > clean[i].alpha));
  assert.ok(Math.max(...veilStops(look(500), { ...city, pitch: 65 }).map((s) => s.alpha)) <= 0.66, 'capped so the map stays legible');
  assert.ok(Math.max(...clean.map((s) => s.alpha)) < 0.1, 'clean air looks clear');
  assert.deepEqual(veilStops(look(null), city), [], 'no reading, no veil');
  const flat = veilStops(look(320), { ...city, pitch: 0 });
  assert.ok(flat[0].alpha - flat.at(-1).alpha < 0.02, 'a flat view gets an even veil');
  const close = veilStops(look(320), { ...city, zoom: 15.8, pitch: 62 });
  assert.ok(close.at(-1).alpha < smog.at(-1).alpha, 'nearby streets in a close view are crisper');
  assert.ok(close[0].alpha > close.at(-1).alpha * 1.5, 'and the far end fades');
});

test('GPU uniforms carry the same haze, and blend smoothly between looks', () => {
  const look = (reading) => skyLook({ mode: 'live', date: ist('2026-10-10T10:00:00'), reading });
  const u = hazeUniforms(look(320), city);
  assert.equal(u.depth, look(320).haze.aod, 'a city-scale camera is above the ~1 km haze layer');
  assert.ok(u.color.every((c) => c >= 0 && c <= 1) && u.glowColor.every((c) => c >= 0 && c <= 1));
  assert.equal(veilAlpha(u, 0), veilStops(look(320), city, [0])[0].alpha);
  assert.equal(hazeUniforms(look(null), city).depth, 0, 'nothing to draw without a reading');
  const a = hazeUniforms(look(40), city), mid = mixUniforms(a, u, 0.5);
  assert.deepEqual(mixUniforms(a, u, 0), a);
  assert.deepEqual(mixUniforms(a, u, 1), u);
  assert.ok(mid.depth > a.depth && mid.depth < u.depth);
  assert.equal(mid.color.length, 3);
});

test('sun glow appears only when looking toward a low sun', () => {
  const evening = skyLook({ mode: 'live', date: ist('2026-10-10T17:50:00'), reading: 300 });
  const toward = sunGlow(evening, { ...city, bearing: evening.sun.azimuth });
  const away = sunGlow(evening, { ...city, bearing: evening.sun.azimuth + 180 });
  assert.ok(toward && toward.alpha > 0.05 && Math.abs(toward.x - 50) < 1);
  assert.equal(away, null);
  assert.equal(sunGlow(skyLook({ mode: 'day', reading: 300 }), city), null, 'the fixed Day look has no glow');
});

test('caption says illustrative, not a camera, in English and Hindi', () => {
  const en = (e) => e, hi = (_, h) => h;
  const live = skyLook({ mode: 'live', date: ist('2026-10-10T09:05:00'), reading: 212 });
  assert.equal(skyCaption(live, en), 'Illustrative sky, not a camera · haze from Delhi’s live median AQI 212 · light follows the sun at 09:05 IST');
  assert.match(skyCaption(live, hi), /^चित्रात्मक आसमान, कैमरा नहीं · .*212.*09:05 IST/);
  assert.match(skyCaption(skyLook({ mode: 'live', date: ist('2026-10-10T21:00:00'), reading: 212 }), en), /sun below the horizon at 21:00 IST/);
  assert.match(skyCaption(skyLook({ mode: 'dusk', reading: null }), en), /no fresh readings, so no haze · fixed dusk light$/);
  assert.match(skyCaption(skyLook({ mode: 'day', reading: 90 }), hi), /दिन की तय रोशनी$/);
  assert.match(skyCaption(skyLook({ mode: 'day', reading: 90, test: true }), en), /DEV TEST VALUE$/);
});
