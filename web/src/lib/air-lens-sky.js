// Living sky for Air Lens. Two honest inputs drive the scene's light and haze:
//  1. The real sun over Delhi, computed locally (no network) with NOAA's "General Solar
//     Position Calculations": https://gml.noaa.gov/grad/solcalc/solareqns.PDF
//  2. Delhi's live median reading, mapped to an illustrative haze veil.
// It is a picture of the air, not a camera, and skyCaption() says so on screen.
// Everything above mountSky() is pure and unit-tested in tests/air-lens-sky.test.js.
import { baseLight } from './air-lens-style.js';

export const DELHI = { lat: 28.6139, lon: 77.209 };
const RAD = Math.PI / 180;
const MINUTE = 6e4, DAY = 864e5, IST = 330; // IST is UTC+5:30, in minutes
const clamp = (v, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (e0, e1, x) => { const t = clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const hex = (rgb) => `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
const round = (v, step) => Number((Math.round(v / step) * step).toFixed(3));

// NOAA fractional-year series: equation of time (minutes) and declination (radians).
function solarTerms(date) {
  const year = date.getUTCFullYear(), start = Date.UTC(year, 0, 1);
  const days = (Date.UTC(year + 1, 0, 1) - start) / DAY; // 365, or 366 in leap years
  const dayOfYear = Math.floor((date.getTime() - start) / DAY) + 1;
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const g = (2 * Math.PI / days) * (dayOfYear - 1 + (hour - 12) / 24);
  const eqtime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g)
    + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  return { eqtime, decl, minutes: hour * 60 };
}

// Sun position for any instant. Elevation is geometric (no refraction), in degrees;
// azimuth is degrees clockwise from north, the convention MapLibre's map-anchored light uses.
export function sunPosition(date, lat = DELHI.lat, lon = DELHI.lon) {
  const { eqtime, decl, minutes } = solarTerms(date);
  const ha = ((minutes + eqtime + 4 * lon) / 4 - 180) * RAD; // hour angle from true solar time (UTC, so timezone 0)
  const phi = lat * RAD;
  const zenith = Math.acos(clamp(Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(ha), -1, 1)) / RAD;
  const azimuth = (Math.atan2(Math.sin(ha), Math.cos(ha) * Math.sin(phi) - Math.tan(decl) * Math.cos(phi)) / RAD + 540) % 360;
  return { elevation: 90 - zenith, azimuth, zenith };
}

// Solar noon on the UTC calendar day of `date` (NOAA: snoon = 720 - 4*longitude - eqtime, UTC minutes).
export function solarNoon(date, lon = DELHI.lon) {
  const day = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const { eqtime } = solarTerms(new Date(day + (720 - 4 * lon) * MINUTE));
  return new Date(day + (720 - 4 * lon - eqtime) * MINUTE);
}

export function istClock(date) {
  const m = Math.floor(date.getTime() / MINUTE + IST) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// The instant of hh:mm IST on the IST calendar day of `base`.
export function atIST(hours, minutes = 0, base = new Date()) {
  const midnight = Math.floor((base.getTime() + IST * MINUTE) / DAY) * DAY - IST * MINUTE;
  return new Date(midnight + (hours * 60 + minutes) * MINUTE);
}

// City median of fresh overall readings (same rule as the home skyline: readings older than
// 3 hours are left out). Falls back to the larger PM sub-index when `aqi` is missing.
export function cityReading(stations = []) {
  const values = stations
    .filter((s) => Number.isFinite(s?.age_min) && s.age_min <= 180)
    .map((s) => (Number.isFinite(s.aqi) ? s.aqi : Math.max(...['pm25', 'pm10'].map((p) => s.values?.[p]).filter(Number.isFinite))))
    .filter((v) => Number.isFinite(v) && v >= 0)
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2 ? values[mid] : Math.round((values[mid - 1] + values[mid]) / 2);
}

// Reading -> vertical aerosol optical depth (AOD) of the haze. The breakpoints are the same
// 0-500 band cut-offs readingColor() uses, so it works on either AQI scale. AOD stops are
// illustrative but sit inside Delhi's observed range (MODIS 2000-2019: 0.07-3.49; post-monsoon
// mean about 1.0), and through a ~1 km mixed layer they give believable visual ranges by
// Koschmieder's law (V = 3.912 / extinction): about 30 km at 50, 4 km at 300, 2 km at 500.
export const MIXED_LAYER_KM = 1;
const HAZE_STOPS = [[0, 0.04], [50, 0.12], [100, 0.26], [200, 0.55], [300, 0.9], [400, 1.3], [500, 1.75]];

export function hazeFromReading(value) {
  if (value == null || !Number.isFinite(value)) return { known: false, value: null, aod: 0, tint: 0, visibilityKm: null };
  const v = clamp(value, 0, 500);
  const i = Math.max(1, HAZE_STOPS.findIndex(([x]) => v <= x));
  const [[x0, a0], [x1, a1]] = [HAZE_STOPS[i - 1], HAZE_STOPS[i]];
  const aod = lerp(a0, a1, (v - x0) / (x1 - x0));
  return { known: true, value: Math.round(v), aod, tint: clamp((aod - 0.04) / 0.86), visibilityKm: (3.912 * MIXED_LAYER_KM) / aod };
}

// Daylight and warmth from the sun's elevation: civil twilight ends at -6 degrees.
export function skyPhase(elevation) {
  return {
    daylight: smooth(-6, 4, elevation),
    golden: smooth(-6, -1, elevation) * (1 - smooth(4, 14, elevation)),
    name: elevation >= 8 ? 'day' : elevation >= -0.833 ? 'golden' : elevation >= -6 ? 'twilight' : 'night',
  };
}

// Airlight ([clean, smoggy]) is the colour haze adds over distance. Clean distance haze is
// bluish (Rayleigh scattering); smog turns yellow-brown-grey because particles and NO2 absorb
// blue light; at night aerosols scatter city light into an orange-brown glow.
const AIRLIGHT = { day: [[205, 222, 238], [206, 194, 168]], golden: [[247, 208, 170], [218, 156, 104]], night: [[22, 44, 54], [128, 96, 70]] };
const SKY = { day: [[128, 184, 234], [196, 186, 162]], golden: [[236, 172, 128], [196, 140, 98]], night: [[10, 26, 34], [52, 42, 34]] };
// Dusk and Day keep their fixed looks; only the haze follows the reading.
const FIXED = { dusk: { elevation: -2.5, azimuth: 262 }, day: { elevation: 45, azimuth: 200 } };

export function skyLook({ mode = 'live', date = new Date(), reading = null, test = false } = {}) {
  const live = mode === 'live';
  const sun = live ? sunPosition(date) : FIXED[mode === 'day' ? 'day' : 'dusk'];
  const night = live ? sun.elevation < -2 : mode !== 'day';
  const { daylight, golden, name } = skyPhase(sun.elevation);
  const haze = hazeFromReading(reading);
  const k = clamp(haze.aod / 1.75);
  const blend = (set) => mix(...[0, 1].map((j) => mix(mix(set.night[j], set.day[j], daylight), set.golden[j], golden * 0.85)), haze.tint);
  const airlight = blend(AIRLIGHT);
  let light = baseLight(night);
  if (live && !night) {
    // Low sun is warm, high sun near-white; absorbing smog reddens and softens it (diffuse light, less contrast).
    const color = mix(mix([255, 190, 132], [255, 247, 230], smooth(0, 35, sun.elevation)), [242, 204, 150], haze.tint * 0.35);
    light = { anchor: 'map', color: hex(color), intensity: round(lerp(0.24, 0.46, smooth(-2, 30, sun.elevation)) * (1 - 0.35 * k), 0.01),
      position: [1.3, round(sun.azimuth, 0.5), round(clamp(90 - sun.elevation, 0, 88), 0.5)] };
  }
  return {
    mode: live ? 'live' : mode === 'day' ? 'day' : 'dusk', night, phase: name, clock: istClock(date), test,
    sun: { elevation: sun.elevation, azimuth: sun.azimuth },
    // Opacity cap keeps the map legible; it also eases off in clean air so clean looks crisp.
    haze: { ...haze, color: airlight, max: round(lerp(0.52, 0.66, daylight) * (0.5 + 0.5 * haze.tint), 0.01) },
    // Sky colours appear above MapLibre's horizon (high pitch); fog-* only render with 3D terrain.
    sky: { 'sky-color': hex(blend(SKY)), 'horizon-color': hex(airlight), 'fog-color': hex(airlight),
      'sky-horizon-blend': round(lerp(0.55, 0.95, k), 0.01), 'horizon-fog-blend': round(lerp(0.4, 0.9, k), 0.01),
      'fog-ground-blend': round(lerp(0.75, 0.25, k), 0.01), 'atmosphere-blend': 0 },
    light,
    // Forward-scattering glow toward a low sun. The fixed Day look keeps its light behind the camera.
    glow: mode === 'day' ? null : { azimuth: round(sun.azimuth, 0.5), elevation: round(sun.elevation, 0.5), color: mix([255, 222, 170], [255, 168, 98], golden),
      strength: round(smooth(-6, 0, sun.elevation) * (0.35 + 0.65 * haze.tint), 0.01) },
  };
}

// Haze veil. Light from the ground crosses the haze layer on its way to the camera:
// transmittance T = exp(-AOD * airMass) (Beer-Lambert), with airMass = 1/sin(angle below the
// horizon), scaled down when the camera sits inside the ~1 km mixed layer (close views). The veil
// is the airlight colour at opacity (1 - T), capped so the map stays readable. hazeUniforms() is
// everything the GPU needs; the fragment shader below evaluates veilAlpha() per pixel row.
export function hazeUniforms(look, cam) {
  const half = Math.tan(((cam.fov || 36.87) / 2) * RAD), pitch = clamp(cam.pitch, 0, 89) * RAD;
  const metresPerPixel = (40075016.686 * Math.cos((cam.lat ?? DELHI.lat) * RAD)) / (512 * 2 ** cam.zoom);
  const altitudeKm = ((cam.height / 2 / half) * metresPerPixel * Math.cos(pitch)) / 1000;
  const glow = sunGlow(look, cam);
  return { color: look.haze.color.map((v) => v / 255), max: look.haze.max, depth: look.haze.aod * Math.min(1, altitudeKm / MIXED_LAYER_KM),
    pitch, half, glow: glow ? [glow.x / 100, glow.alpha] : [0.5, 0], glowColor: (glow?.color || [255, 255, 255]).map((v) => v / 255) };
}
// `at` is the screen row from the top (0) to the bottom (1).
export const veilAlpha = (u, at) => u.max * (1 - Math.exp(-u.depth / Math.sin(Math.max(Math.PI / 2 - u.pitch - Math.atan((1 - 2 * at) * u.half), 0.035))));
export function veilStops(look, cam, rows = [0, 0.1, 0.25, 0.5, 0.75, 1]) {
  if (!look.haze.aod) return [];
  const u = hazeUniforms(look, cam);
  return rows.map((at) => ({ at, alpha: veilAlpha(u, at) }));
}
export function mixUniforms(a, b, t) {
  const m = (x, y) => (Array.isArray(x) ? x.map((v, i) => lerp(v, y[i], t)) : lerp(x, y, t));
  return Object.fromEntries(Object.keys(b).map((key) => [key, m(a[key], b[key])]));
}

// Where (and how strongly) the low-sun glow shows along the top edge of the view.
export function sunGlow(look, cam) {
  const s = look.glow;
  if (!s || s.strength < 0.01) return null;
  const top = -(90 - cam.pitch - (cam.fov || 36.87) / 2) * RAD; // elevation the top edge looks along
  const rel = ((s.azimuth - cam.bearing + 540) % 360) - 180; // 0 = straight ahead
  const cosGamma = Math.sin(top) * Math.sin(s.elevation * RAD) + Math.cos(top) * Math.cos(s.elevation * RAD) * Math.cos(rel * RAD);
  const alpha = 0.55 * s.strength * Math.exp(-Math.acos(clamp(cosGamma, -1, 1)) / RAD / 38);
  return alpha < 0.01 ? null : { x: clamp(50 + 62 * Math.sin(rel * RAD), -15, 115), alpha, color: s.color };
}

export function skyCaption(look, w) {
  const parts = [w('Illustrative sky, not a camera', 'चित्रात्मक आसमान, कैमरा नहीं'),
    look.haze.known ? w(`haze from Delhi’s live median AQI ${look.haze.value}`, `धुंध: दिल्ली का लाइव औसत AQI ${look.haze.value}`)
      : w('no fresh readings, so no haze', 'ताज़ा रीडिंग नहीं, इसलिए धुंध नहीं'),
    look.mode === 'dusk' ? w('fixed dusk light', 'शाम की तय रोशनी') : look.mode === 'day' ? w('fixed daylight', 'दिन की तय रोशनी')
      : look.sun.elevation > -0.833 ? w(`light follows the sun at ${look.clock} IST`, `रोशनी ${look.clock} IST के सूरज के अनुसार`)
        : w(`sun below the horizon at ${look.clock} IST`, `${look.clock} IST, सूरज क्षितिज के नीचे`)];
  if (look.test) parts.push('DEV TEST VALUE');
  return parts.join(' · ');
}

// ---- Browser adapter (not used by the node tests) ----
// The veil is a full-screen MapLibre custom layer placed under the basemap labels, so roads,
// water and buildings sit in the haze while labels, evidence lines and DOM markers stay crisp.
const VERTEX = `#version 300 es
in vec2 a_pos;
out vec2 v_uv;
void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;
const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform vec3 u_color, u_glow_color;
uniform vec2 u_glow;
uniform float u_max, u_depth, u_pitch, u_half;
void main() {
  float below = 1.5707963 - u_pitch - atan((v_uv.y * 2.0 - 1.0) * u_half);
  float a = u_max * (1.0 - exp(-u_depth / sin(max(below, 0.035))));
  float g = u_glow.y * clamp(1.0 - length(vec2((v_uv.x - u_glow.x) / 0.75, (1.08 - v_uv.y) / 0.6)) / 0.7, 0.0, 1.0);
  fragColor = vec4(u_glow_color * g + u_color * a * (1.0 - g), g + a * (1.0 - g));
}`;
const UNIFORMS = ['u_color', 'u_glow_color', 'u_glow', 'u_max', 'u_depth', 'u_pitch', 'u_half'];

function hazeLayer(uniformsFor) {
  let gpu = null, failed = false;
  // GL objects are created inside render(): MapLibre resets its cached GL state right after it.
  const setup = (gl) => {
    const compile = (type, source) => { const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s); return s; };
    const program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { failed = true; return null; } // decorative: skip the haze, keep the map
    const vao = gl.createVertexArray(), buffer = gl.createBuffer();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_pos');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
    return { program, vao, buffer, at: Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)])) };
  };
  return {
    id: 'lens-haze', type: 'custom', renderingMode: '2d',
    render(gl, args) {
      const u = failed ? null : uniformsFor(args.fov / RAD);
      if (!u || (u.depth <= 0 && u.glow[1] <= 0)) return;
      gpu ||= setup(gl);
      if (!gpu) return;
      gl.useProgram(gpu.program);
      gl.bindVertexArray(gpu.vao);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.STENCIL_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); // premultiplied output
      gl.uniform3fv(gpu.at.u_color, u.color);
      gl.uniform3fv(gpu.at.u_glow_color, u.glowColor);
      gl.uniform2fv(gpu.at.u_glow, u.glow);
      for (const key of ['max', 'depth', 'pitch', 'half']) gl.uniform1f(gpu.at[`u_${key}`], u[key]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
    },
    onRemove(map, gl) {
      if (!gpu || gl.isContextLost()) return;
      gl.deleteProgram(gpu.program); gl.deleteBuffer(gpu.buffer); gl.deleteVertexArray(gpu.vao);
    },
  };
}

// Applies a look to the map: light and sky through MapLibre's style API, haze through the layer.
// Changes ease over 900 ms; with prefers-reduced-motion they are instant.
export function mountSky(map, reduce) {
  let look = null, from = null, start = 0, lightKey = '', skyKey = '', hazeKey = '';
  const duration = () => (reduce.matches ? 0 : 900);
  const timed = (spec, fixed = []) => Object.fromEntries(Object.entries(spec).flatMap(([key, value]) => (fixed.includes(key) ? [[key, value]]
    : [[key, value], [`${key}-transition`, { duration: duration(), delay: 0 }]])));
  const uniformsFor = (fov) => {
    if (!look) return null;
    const cam = { pitch: map.getPitch(), bearing: map.getBearing(), zoom: map.getZoom(), lat: map.getCenter().lat, fov,
      height: map.getCanvas().height / map.getPixelRatio() };
    const target = hazeUniforms(look, cam), k = from && duration() ? Math.min(1, (performance.now() - start) / duration()) : 1;
    if (k >= 1) { from = null; return target; }
    map.triggerRepaint();
    return mixUniforms(hazeUniforms(from, cam), target, k * k * (3 - 2 * k));
  };
  map.addLayer(hazeLayer(uniformsFor), map.getStyle().layers.find((l) => l.type === 'symbol')?.id);
  function apply(next, restyled = false) {
    if (!next) return;
    const haze = JSON.stringify([next.haze, next.glow]);
    if (look && haze !== hazeKey) { from = look; start = performance.now(); }
    look = next; hazeKey = haze;
    const light = JSON.stringify(next.light), sky = JSON.stringify(next.sky);
    if (restyled || light !== lightKey) { map.setLight(timed(next.light, ['anchor'])); lightKey = light; }
    if (sky !== skyKey) { map.setSky(timed(next.sky)); skyKey = sky; }
    map.triggerRepaint();
  }
  return { apply };
}
