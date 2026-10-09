// Air Lens wind: pure helpers (no DOM, no MapLibre), unit-tested in tests/air-lens-wind.test.js.
//
// Wind here is WEATHER CONTEXT ONLY: the Open-Meteo forecast model's current 10 m wind.
// Nothing in this file (or its wording) may say the wind carries, brings or moves any
// station's pollution or reading.
//
// Convention (WMO / NWS "WDIR"): direction is where the wind comes FROM, in degrees clockwise
// from true north. The air itself moves TOWARD direction + 180°. Vectors below are the
// meteorological u (toward east) and v (toward north) components:
//   u = -speed · sin(from),  v = -speed · cos(from)

export const WIND_BOUNDS = Object.freeze({ south: 28.40, north: 28.88, west: 76.84, east: 77.35 });
export const WIND_GRID = 6; // 6×6 = 36 points ≈ 10 km apart, close to the model's own cell spacing
export const WIND_TTL_MS = 30 * 60 * 1000; // Open-Meteo "current" updates every 15 min
export const WIND_KEEP_MS = 90 * 60 * 1000; // after a failed refresh, keep showing a field this young
export const WIND_RETRY_MS = 5 * 60 * 1000; // after a failure with nothing to show, wait before retrying
export const CALM_KMH = 2; // Beaufort force 0 ("calm") is under 1 knot ≈ 1.9 km/h
export const WIND_CACHE_KEY = 'taaza-wind-v1';
export const WIND_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
export const OPEN_METEO_URL = 'https://open-meteo.com/';

const RAD = Math.PI / 180;
const round3 = (x) => Number(x.toFixed(3));
const clamp = (x, lo, hi) => (x < lo ? lo : x > hi ? hi : x);

// ---------------------------------------------------------------- grid + request
/** Row-major grid from the south-west corner: index = row * n + col (rows go north, cols go east). */
export function windGrid(n = WIND_GRID, b = WIND_BOUNDS) {
  if (!Number.isInteger(n) || n < 2) throw new RangeError('wind grid needs n >= 2');
  const points = [];
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      points.push({ lat: round3(b.south + (b.north - b.south) * row / (n - 1)), lon: round3(b.west + (b.east - b.west) * col / (n - 1)) });
    }
  }
  return points;
}

/** One keyless GET for every grid point (Open-Meteo accepts comma-separated coordinate lists). */
export function windUrl(points = windGrid()) {
  return `${WIND_ENDPOINT}?latitude=${points.map((p) => p.lat).join(',')}&longitude=${points.map((p) => p.lon).join(',')}`
    + '&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timeformat=unixtime';
}

// ---------------------------------------------------------------- conventions
/** "From" degrees + speed → the vector the air moves along (u east, v north). */
export function toVector(fromDeg, speed = 1) {
  const r = fromDeg * RAD;
  return { u: -speed * Math.sin(r), v: -speed * Math.cos(r) };
}

/** Vector (u east, v north) → "from" degrees in [0, 360); null when there is no direction (calm). */
export function fromVector(u, v) {
  if (!(Math.hypot(u, v) > 1e-9)) return null;
  const deg = (Math.atan2(-u, -v) / RAD + 360) % 360;
  return deg > 360 - 1e-9 ? 0 : deg; // float noise just below 360 is north
}

/** "From" degrees → the compass bearing the air is moving toward, in [0, 360). */
export const towardDegrees = (fromDeg) => (((fromDeg + 180) % 360) + 360) % 360;

export const COMPASS_8 = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
export const COMPASS_16 = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
// Same words the backend's school fire line uses (backend/src/taaza/school.py COMPASS).
export const COMPASS_WORDS = {
  en: ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'],
  hi: ['उत्तर', 'उत्तर-पूर्व', 'पूर्व', 'दक्षिण-पूर्व', 'दक्षिण', 'दक्षिण-पश्चिम', 'पश्चिम', 'उत्तर-पश्चिम'],
};

/** Degrees → index into an 8- or 16-point compass (0 = N). 360 and -0 wrap to N. */
export function compassIndex(deg, points = 8) {
  if (!Number.isFinite(deg) || (points !== 8 && points !== 16)) return null;
  const step = 360 / points;
  return Math.round((((deg % 360) + 360) % 360) / step) % points;
}

/** Degrees → "NW" (8-point) or "NNW" (16-point); null for a missing direction. */
export function compassLabel(deg, points = 8) {
  const i = compassIndex(deg, points);
  return i == null ? null : (points === 16 ? COMPASS_16 : COMPASS_8)[i];
}

// ---------------------------------------------------------------- parsing
/**
 * Open-Meteo multi-location JSON (an array, one result per requested point, in request order;
 * `location_id` is present from the second result on) → a plain, JSON-serialisable field.
 * Returns null on any shape, unit or value problem, so the caller can hide the layer quietly.
 */
export function parseWind(json, n = WIND_GRID, bounds = WIND_BOUNDS) {
  const rows = Array.isArray(json) ? json : null;
  if (!rows || rows.length !== n * n) return null;
  const speed = new Array(n * n).fill(null), from = new Array(n * n).fill(null);
  let time = 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], c = r?.current;
    const at = Number.isInteger(r?.location_id) ? r.location_id : i;
    if (!c || at < 0 || at >= n * n || speed[at] !== null) return null;
    const unit = r.current_units?.wind_speed_10m;
    if (unit !== undefined && unit !== 'km/h') return null;
    const s = c.wind_speed_10m, d = c.wind_direction_10m;
    if (!Number.isFinite(s) || s < 0 || s > 400 || !Number.isFinite(d)) return null;
    speed[at] = s; from[at] = ((d % 360) + 360) % 360;
    if (Number.isFinite(c.time)) time = Math.max(time, c.time);
  }
  return buildField({ n, bounds: { ...bounds }, time, speed, from });
}

/** Adds the u/v arrays (km/h, toward east/north) used for interpolation and animation. */
function buildField({ n, bounds, time, speed, from }) {
  const u = new Array(n * n), v = new Array(n * n);
  let max = 0;
  for (let i = 0; i < n * n; i++) {
    const vec = toVector(from[i], speed[i]);
    u[i] = vec.u; v[i] = vec.v; max = Math.max(max, speed[i]);
  }
  return { n, bounds, time, speed, from, u, v, max };
}

/** Accepts a cached field only if its shape is intact. */
export function validField(f) {
  if (!f || !Number.isInteger(f.n) || f.n < 2 || !f.bounds) return false;
  const size = f.n * f.n;
  return ['south', 'north', 'west', 'east'].every((k) => Number.isFinite(f.bounds[k]))
    && Array.isArray(f.speed) && Array.isArray(f.from) && f.speed.length === size && f.from.length === size
    && f.speed.every((s) => Number.isFinite(s) && s >= 0) && f.from.every(Number.isFinite);
}

// ---------------------------------------------------------------- sampling
/**
 * Bilinear sample at (lon, lat) WITHOUT allocating: writes u, v (km/h) into out[0], out[1].
 * Returns false outside the grid (plus `margin` degrees, clamped to the edge value).
 */
export function sampleInto(field, lon, lat, out, margin = 0) {
  const b = field.bounds, n = field.n;
  if (lon < b.west - margin || lon > b.east + margin || lat < b.south - margin || lat > b.north + margin) return false;
  const gx = clamp((lon - b.west) / (b.east - b.west), 0, 1) * (n - 1);
  const gy = clamp((lat - b.south) / (b.north - b.south), 0, 1) * (n - 1);
  const x0 = Math.min(n - 2, Math.floor(gx)), y0 = Math.min(n - 2, Math.floor(gy));
  const fx = gx - x0, fy = gy - y0, i = y0 * n + x0;
  const w00 = (1 - fx) * (1 - fy), w10 = fx * (1 - fy), w01 = (1 - fx) * fy, w11 = fx * fy;
  const u = field.u, v = field.v;
  out[0] = u[i] * w00 + u[i + 1] * w10 + u[i + n] * w01 + u[i + n + 1] * w11;
  out[1] = v[i] * w00 + v[i + 1] * w10 + v[i + n] * w01 + v[i + n + 1] * w11;
  if (out.length > 2) {
    const s = field.speed;
    out[2] = s[i] * w00 + s[i + 1] * w10 + s[i + n] * w01 + s[i + n + 1] * w11;
  }
  return true;
}

/**
 * Wind at a point for the station readout: direction from the interpolated vector, speed from
 * the interpolated scalar (vector averaging would understate it). Stations a little outside the
 * grid use the nearest edge; far outside → null (no readout).
 */
export function sampleWind(field, lon, lat, margin = 0.06) {
  if (!field || !Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  const out = [0, 0, 0];
  if (!sampleInto(field, lon, lat, out, margin)) return null;
  const [u, v, speed] = out;
  const vector = Math.hypot(u, v);
  // When nearby grid points disagree strongly, the mean vector shrinks: say "variable", not a direction.
  const variable = speed >= CALM_KMH && vector < 0.5 * speed;
  return { u, v, speed, from: variable ? null : fromVector(u, v), calm: speed < CALM_KMH, variable };
}

// ---------------------------------------------------------------- wording (EN + HI)
// Every user-facing wind string lives here so one test can check none of them ever links the
// wind to pollution, smoke or a station's reading.
export const WIND_WORDS = {
  toggle: { en: 'Show wind (model)', hi: 'हवा का बहाव दिखाएँ (मॉडल)' },
  key: { en: 'Wind · Open-Meteo model', hi: 'हवा · Open-Meteo मॉडल' },
  model: { en: 'Open-Meteo weather model', hi: 'Open-Meteo मौसम मॉडल' },
  context: { en: 'weather context, not measured at this station', hi: 'सिर्फ़ मौसम की जानकारी, इस स्टेशन पर मापी नहीं गई' },
  attribution: { en: 'Weather data by Open-Meteo.com', hi: 'मौसम डेटा: Open-Meteo.com' },
  calm: { en: 'Wind nearly calm · under 2 km/h', hi: 'हवा लगभग थमी हुई · 2 किमी/घंटा से कम' },
  footnote: {
    en: 'Wind shows a weather model’s 10 m wind, as context for being outside. It does not show where any reading’s air came from.',
    hi: 'हवा का बहाव मौसम मॉडल की 10 मीटर ऊँचाई की हवा है, बाहर जाने के संदर्भ के लिए। यह नहीं बताता कि किसी रीडिंग की हवा कहाँ से आई।',
  },
};
const pick = (entry, lang) => (lang === 'hi' ? entry.hi : entry.en);
export const windWord = (key, lang) => pick(WIND_WORDS[key], lang);

/** The panel headline for a sample, e.g. "Wind from the north-west · 8 km/h". */
export function windHeadline(sample, lang = 'en') {
  if (!sample) return null;
  const kmh = Math.round(sample.speed);
  if (sample.calm) return windWord('calm', lang);
  if (sample.variable || sample.from == null) return lang === 'hi' ? `हवा की दिशा बदलती हुई · ${kmh} किमी/घंटा` : `Wind direction variable · ${kmh} km/h`;
  const word = COMPASS_WORDS[lang === 'hi' ? 'hi' : 'en'][compassIndex(sample.from, 8)];
  return lang === 'hi' ? `हवा ${word} से आ रही है · ${kmh} किमी/घंटा` : `Wind from the ${word} · ${kmh} km/h`;
}

/** Model valid time (unix seconds) → "7:00 pm" in India Standard Time. */
export function modelTime(seconds, lang = 'en') {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  try {
    return new Intl.DateTimeFormat(lang === 'hi' ? 'hi-IN' : 'en-IN', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: '2-digit' }).format(new Date(seconds * 1000));
  } catch { return ''; }
}

// ---------------------------------------------------------------- loading + cache
/** sessionStorage read; returns the field only if fresh and intact. Never throws. */
export function readCache(storage, now, ttl = WIND_TTL_MS) {
  try {
    const c = JSON.parse(storage?.getItem(WIND_CACHE_KEY) || 'null');
    if (!c || !Number.isFinite(c.fetched) || now - c.fetched < 0 || now - c.fetched >= ttl || !validField(c.field)) return null;
    return { fetched: c.fetched, field: buildField(c.field) };
  } catch { return null; }
}

/** sessionStorage write of the compact field (no derived arrays). Never throws. */
export function writeCache(storage, field, now) {
  try {
    const { n, bounds, time, speed, from } = field;
    storage?.setItem(WIND_CACHE_KEY, JSON.stringify({ fetched: now, field: { n, bounds, time, speed, from } }));
  } catch { /* private mode or quota: the in-memory copy still works */ }
}

/**
 * A wind loader with a ~30 min in-memory cache (plus sessionStorage when given). The returned
 * function resolves to a field or null and never rejects: a failed fetch just hides the layer.
 * A network error, timeout or 5xx is retried once after a short pause; a 4xx (e.g. 429) is not.
 */
export function createWindLoader({ fetchImpl = globalThis.fetch?.bind(globalThis), storage = null, clock = Date.now, timeoutMs = 8000, retryDelayMs = 2500 } = {}) {
  let memo = null, inflight = null, failedAt = -Infinity;
  const attempt = () => {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timer = setTimeout(() => controller?.abort(), timeoutMs);
    return Promise.resolve()
      .then(() => fetchImpl(windUrl(), { signal: controller?.signal, credentials: 'omit' }))
      .then((res) => {
        if (!res?.ok) throw Object.assign(new Error(`wind ${res?.status}`), { final: res?.status >= 400 && res?.status < 500 });
        return res.json();
      })
      .then((json) => {
        const field = parseWind(json);
        if (!field) throw Object.assign(new Error('wind: unexpected response'), { final: true });
        return field;
      })
      .finally(() => clearTimeout(timer));
  };
  return function loadWind() {
    const now = clock();
    if (memo && now - memo.fetched < WIND_TTL_MS) return Promise.resolve(memo.field);
    if (inflight) return inflight;
    const cached = readCache(storage, now);
    if (cached) { memo = cached; return Promise.resolve(cached.field); }
    if (now - failedAt < WIND_RETRY_MS) return Promise.resolve(memo && now - memo.fetched < WIND_KEEP_MS ? memo.field : null);
    inflight = attempt()
      .catch((error) => {
        if (error?.final) throw error;
        return new Promise((resolve) => setTimeout(resolve, retryDelayMs)).then(attempt);
      })
      .then((field) => { memo = { fetched: clock(), field }; writeCache(storage, field, memo.fetched); return field; })
      .catch(() => { failedAt = clock(); return memo && clock() - memo.fetched < WIND_KEEP_MS ? memo.field : null; })
      .finally(() => { inflight = null; });
    return inflight;
  };
}

// ---------------------------------------------------------------- ground → screen projection
// A pitched MapLibre camera maps the flat (Web Mercator) ground plane to the screen by a plane
// projective transform. Over Delhi, lon/lat are close enough to linear in Mercator that a
// homography fitted to the current view maps them to pixels well under a pixel off. Fitting it
// once per camera change lets the animation project thousands of points per frame with plain
// arithmetic and no allocations.

const system = new Float64Array(72); // 8 × 9 augmented matrix, reused

/**
 * Solves the homography H (row-major 3×3, h8 = 1) mapping 4 source points to 4 destination
 * points. src and dst are flat [x0, y0, x1, y1, x2, y2, x3, y3]. Writes into out; returns
 * false if the points are degenerate (e.g. three in a line).
 */
export function solveHomography(src, dst, out) {
  const m = system;
  for (let k = 0; k < 4; k++) {
    const x = src[2 * k], y = src[2 * k + 1], X = dst[2 * k], Y = dst[2 * k + 1];
    let r = (2 * k) * 9;
    m[r] = x; m[r + 1] = y; m[r + 2] = 1; m[r + 3] = 0; m[r + 4] = 0; m[r + 5] = 0; m[r + 6] = -x * X; m[r + 7] = -y * X; m[r + 8] = X;
    r += 9;
    m[r] = 0; m[r + 1] = 0; m[r + 2] = 0; m[r + 3] = x; m[r + 4] = y; m[r + 5] = 1; m[r + 6] = -x * Y; m[r + 7] = -y * Y; m[r + 8] = Y;
  }
  for (let c = 0; c < 8; c++) { // Gaussian elimination with partial pivoting
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(m[r * 9 + c]) > Math.abs(m[p * 9 + c])) p = r;
    if (Math.abs(m[p * 9 + c]) < 1e-12) return false;
    if (p !== c) for (let k = 0; k < 9; k++) { const t = m[c * 9 + k]; m[c * 9 + k] = m[p * 9 + k]; m[p * 9 + k] = t; }
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = m[r * 9 + c] / m[c * 9 + c];
      if (f !== 0) for (let k = c; k < 9; k++) m[r * 9 + k] -= f * m[c * 9 + k];
    }
  }
  for (let r = 0; r < 8; r++) out[r] = m[r * 9 + 8] / m[r * 9 + r];
  out[8] = 1;
  return out.every(Number.isFinite);
}

/** 3×3 inverse (row-major) into out; false if singular. */
export function invertHomography(h, out) {
  const a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], i = h[7], j = h[8];
  const A = e * j - f * i, B = f * g - d * j, C = d * i - e * g;
  const det = a * A + b * B + c * C;
  if (!(Math.abs(det) > 1e-15)) return false;
  out[0] = A / det; out[1] = (c * i - b * j) / det; out[2] = (b * f - c * e) / det;
  out[3] = B / det; out[4] = (a * j - c * g) / det; out[5] = (c * d - a * f) / det;
  out[6] = C / det; out[7] = (b * g - a * i) / det; out[8] = (a * e - b * d) / det;
  return true;
}

/** Applies H to (x, y): writes the point to out[0], out[1] and returns w (≤ 0 means behind the camera). */
export function applyHomography(h, x, y, out) {
  const w = h[6] * x + h[7] * y + h[8];
  out[0] = (h[0] * x + h[1] * y + h[2]) / w;
  out[1] = (h[3] * x + h[4] * y + h[5]) / w;
  return w;
}
