// Air Lens wind layer: a 2D canvas laid over the MapLibre canvas (under the station markers),
// drawing short wind streaks that drift TOWARD (direction + 180°). The overlay never takes
// pointer events, pauses when the tab is hidden, and draws static arrows instead of moving
// streaks when the user prefers reduced motion.
//
// Projection: a homography fitted to the view on every camera change (see air-lens-wind.js),
// so the per-frame loop is plain arithmetic on preallocated typed arrays, with no allocations.
import { CALM_KMH, sampleInto, solveHomography, invertHomography, applyHomography } from './air-lens-wind.js';

const MAX_PARTICLES = 420;
const PX_PER_KMH = 2.4; // visual time-lapse: on-screen px per second for each km/h of wind
const TAIL_S = 0.7; // streak length, in seconds of on-screen travel
const FADE_S = 0.6; // fade in/out over a streak's life
const EDGE = 0.07; // fade out over the last 7% of the grid, so the data window has soft edges
const ALPHA = [0.16, 0.36, 0.58, 0.84];
const TAIL_ALPHA = 0.38; // the back half of each streak is fainter: a comet, read as direction
const EARTH_M = 40075016.686, M_PER_DEG_LAT = 110574, M_PER_DEG_LON = 111320, RAD = Math.PI / 180;
const COS_DELHI = Math.cos(28.64 * RAD);
const SCREEN_X = [0.15, 0.85, 0.85, 0.15], SCREEN_Y = [0.5, 0.5, 0.95, 0.95]; // always ground, never sky

export function mountWind(map, reduce) {
  const canvas = document.createElement('canvas');
  canvas.className = 'lens-wind-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'none'; // shown only once there is a field and the layer is on
  map.getCanvas().after(canvas); // after the GL canvas, before the HTML markers: markers stay on top
  const ctx = canvas.getContext('2d');
  const container = map.getContainer();
  const coarse = matchMedia('(pointer: coarse)').matches;
  const fpsCap = coarse ? 30 : 60;
  const areaPerParticle = coarse ? 650 : 820; // CSS px² of the visible wind grid per streak

  const lng = new Float64Array(MAX_PARTICLES), lat = new Float64Array(MAX_PARTICLES);
  const age = new Float32Array(MAX_PARTICLES), life = new Float32Array(MAX_PARTICLES);
  const pu = new Float32Array(MAX_PARTICLES), pv = new Float32Array(MAX_PARTICLES);
  const hx = new Float32Array(MAX_PARTICLES), hy = new Float32Array(MAX_PARTICLES);
  const tx = new Float32Array(MAX_PARTICLES), ty = new Float32Array(MAX_PARTICLES);
  const bucket = new Uint8Array(MAX_PARTICLES);
  const H = new Float64Array(9), Hi = new Float64Array(9), src = new Float64Array(8), dst = new Float64Array(8);
  const pt = new Float64Array(2), vel = new Float64Array(2), sample = new Float64Array(3);

  let field = null, on = false, night = true, valid = false, destroyed = false;
  let width = 0, height = 0, dpr = 1, count = 0, frame = 0, last = 0;
  let originLng = 0, originLat = 0, scale = 1, kLng = 0, kLat = 0;
  let spawnX = 0, spawnY = 0, spawnW = 0, spawnH = 0; // screen box around the visible wind grid

  const animating = () => on && field && valid && !destroyed && !document.hidden && !reduce.matches;
  const clear = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); };

  function resize() {
    width = container.clientWidth; height = container.clientHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(width * dpr)); canvas.height = Math.max(1, Math.round(height * dpr));
    camera();
  }

  // Refit ground → screen (and back) for the current camera, then size the streak count to how
  // much of the wind grid is on screen. Four unprojects per camera change; the rest is arithmetic.
  function camera() {
    fit();
    if (!valid || !field) return;
    const b = field.bounds;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, behind = false;
    for (let k = 0; k < 4; k++) {
      if (!project(k & 1 ? b.east : b.west, k & 2 ? b.north : b.south, true)) { behind = true; break; }
      x0 = Math.min(x0, pt[0]); y0 = Math.min(y0, pt[1]); x1 = Math.max(x1, pt[0]); y1 = Math.max(y1, pt[1]);
    }
    if (behind) { x0 = 0; y0 = 0; x1 = width; y1 = height; }
    spawnX = Math.max(0, x0); spawnY = Math.max(0, y0);
    spawnW = Math.max(0, Math.min(width, x1) - spawnX); spawnH = Math.max(0, Math.min(height, y1) - spawnY);
    let inside = 0;
    for (let gy = 0; gy < 8; gy++) for (let gx = 0; gx < 12; gx++) {
      if (groundAt((gx + 0.5) * width / 12, (gy + 0.5) * height / 8) && sampleInto(field, pt[0], pt[1], vel)) inside++;
    }
    const target = inside ? Math.min(MAX_PARTICLES, Math.max(50, Math.round((inside / 96) * width * height / areaPerParticle))) : 0;
    for (let i = count; i < target; i++) { spawn(i); age[i] = Math.random() * life[i]; }
    count = target;
  }

  function fit() {
    valid = false;
    if (!width || !height) return;
    let span = 0;
    for (let k = 0; k < 4; k++) {
      const p = map.unproject([SCREEN_X[k] * width, SCREEN_Y[k] * height]);
      if (k === 0) { originLng = p.lng; originLat = p.lat; }
      src[2 * k] = p.lng - originLng; src[2 * k + 1] = p.lat - originLat;
      span = Math.max(span, Math.abs(src[2 * k]), Math.abs(src[2 * k + 1]));
      dst[2 * k] = SCREEN_X[k] * width; dst[2 * k + 1] = SCREEN_Y[k] * height;
    }
    if (!(span > 0)) return;
    scale = 1 / span;
    for (let k = 0; k < 8; k++) src[k] *= scale;
    valid = solveHomography(src, dst, H) && invertHomography(H, Hi);
    const metresPerPx = EARTH_M * Math.cos(map.getCenter().lat * RAD) / (512 * 2 ** map.getZoom());
    kLat = PX_PER_KMH * metresPerPx / M_PER_DEG_LAT;
    kLng = PX_PER_KMH * metresPerPx / (M_PER_DEG_LON * COS_DELHI);
  }

  // Ground point under a screen pixel → pt (lng, lat). False for sky or points behind the camera.
  function groundAt(sx, sy) {
    applyHomography(Hi, sx, sy, pt);
    const x = pt[0], y = pt[1];
    if (!(applyHomography(H, x, y, pt) > 0)) return false;
    pt[0] = originLng + x / scale; pt[1] = originLat + y / scale;
    return true;
  }

  function spawn(i) {
    for (let tries = 0; tries < 4 && valid && spawnW > 0 && spawnH > 0; tries++) {
      if (!groundAt(spawnX + Math.random() * spawnW, spawnY + Math.random() * spawnH) || !sampleInto(field, pt[0], pt[1], vel)) continue;
      lng[i] = pt[0]; lat[i] = pt[1]; pu[i] = vel[0]; pv[i] = vel[1];
      age[i] = 0; life[i] = 1.6 + Math.random() * 2.6;
      return;
    }
    lng[i] = NaN; age[i] = 0; life[i] = 0.15 + Math.random() * 0.35; // nothing here: retry soon
  }

  function step(dt) {
    for (let i = 0; i < count; i++) {
      age[i] += dt;
      if (age[i] >= life[i] || lng[i] !== lng[i] || !sampleInto(field, lng[i], lat[i], vel)) { spawn(i); continue; }
      pu[i] = vel[0]; pv[i] = vel[1];
      lng[i] += vel[0] * kLng * dt; lat[i] += vel[1] * kLat * dt;
    }
  }

  // Ground (lng, lat) → screen pixel in pt. False behind the camera or (unless loose) off screen.
  function project(x, y, loose = false) {
    return applyHomography(H, (x - originLng) * scale, (y - originLat) * scale, pt) > 0
      && (loose || (pt[0] > -40 && pt[0] < width + 40 && pt[1] > -40 && pt[1] < height + 40));
  }

  function drawStreaks() {
    clear();
    if (!valid || !field) return;
    const b = field.bounds, spanLng = b.east - b.west, spanLat = b.north - b.south;
    for (let i = 0; i < count; i++) {
      bucket[i] = 255;
      if (lng[i] !== lng[i] || !project(lng[i], lat[i])) continue;
      hx[i] = pt[0]; hy[i] = pt[1];
      if (!project(lng[i] - pu[i] * kLng * TAIL_S, lat[i] - pv[i] * kLat * TAIL_S)) continue;
      tx[i] = pt[0]; ty[i] = pt[1];
      const fx = (lng[i] - b.west) / spanLng, fy = (lat[i] - b.south) / spanLat;
      const edge = Math.min(fx, 1 - fx, fy, 1 - fy) / EDGE;
      const fade = Math.min(1, age[i] / FADE_S, (life[i] - age[i]) / FADE_S, edge);
      if (fade > 0) bucket[i] = Math.min(3, Math.floor(fade * 4));
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round'; ctx.lineWidth = 1.5;
    ctx.strokeStyle = night ? '#e4f4ea' : '#1d4a44';
    for (let k = 0; k < 4; k++) {
      ctx.beginPath(); // back half, faint
      for (let i = 0; i < count; i++) if (bucket[i] === k) { ctx.moveTo(tx[i], ty[i]); ctx.lineTo((tx[i] + hx[i]) / 2, (ty[i] + hy[i]) / 2); }
      ctx.globalAlpha = ALPHA[k] * TAIL_ALPHA; ctx.stroke();
      ctx.beginPath(); // front half, toward where the air is going
      for (let i = 0; i < count; i++) if (bucket[i] === k) { ctx.moveTo((tx[i] + hx[i]) / 2, (ty[i] + hy[i]) / 2); ctx.lineTo(hx[i], hy[i]); }
      ctx.globalAlpha = ALPHA[k]; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Reduced motion: a still lattice of arrows (screen-spaced, so density holds at every zoom).
  function drawArrows() {
    clear();
    if (!valid || !field) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 1.7;
    ctx.strokeStyle = night ? '#e4f4ea' : '#1d4a44'; ctx.globalAlpha = 0.8;
    const gap = width < 520 ? 62 : 80;
    ctx.beginPath();
    for (let sy = gap * 0.6; sy < height; sy += gap) {
      for (let sx = gap / 2; sx < width; sx += gap) {
        if (!groundAt(sx, sy)) continue;
        const lo = pt[0], la = pt[1];
        if (!sampleInto(field, lo, la, sample)) continue;
        const u = sample[0], v = sample[1], speed = sample[2], mag = Math.hypot(u, v);
        if (speed < CALM_KMH || mag < 1e-6) { ctx.moveTo(sx + 3, sy); ctx.arc(sx, sy, 3, 0, Math.PI * 2); continue; } // calm: a small ring
        // screen direction of a short step downwind, so arrows follow bearing and pitch
        if (!project(lo + (u / mag) * 0.003 / COS_DELHI, la + (v / mag) * 0.003)) continue;
        let dx = pt[0] - sx, dy = pt[1] - sy;
        const d = Math.hypot(dx, dy);
        if (!(d > 1e-6)) continue;
        dx /= d; dy /= d;
        const len = 9 + 13 * Math.min(speed, 25) / 25, hx0 = sx + dx * len / 2, hy0 = sy + dy * len / 2;
        ctx.moveTo(sx - dx * len / 2, sy - dy * len / 2); ctx.lineTo(hx0, hy0);
        ctx.moveTo(hx0 - dx * 5 - dy * 3.5, hy0 - dy * 5 + dx * 3.5); ctx.lineTo(hx0, hy0); ctx.lineTo(hx0 - dx * 5 + dy * 3.5, hy0 - dy * 5 - dx * 3.5);
      }
    }
    ctx.stroke(); ctx.globalAlpha = 1;
  }

  function tick(time) {
    frame = 0;
    if (!animating()) return;
    frame = requestAnimationFrame(tick);
    if (last && time - last < 1000 / fpsCap - 2) return;
    const dt = last ? Math.min((time - last) / 1000, 0.1) : 1 / 60;
    last = time;
    step(dt); drawStreaks();
  }

  function refresh() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    const show = on && !!field && !destroyed;
    canvas.style.display = show ? '' : 'none';
    if (!show) { clear(); return; }
    if (reduce.matches) { drawArrows(); return; }
    if (!document.hidden) frame = requestAnimationFrame(tick);
  }

  // Camera moved: refit and redraw now, in MapLibre's own frame, so streaks never lag the map.
  const onMove = () => {
    camera();
    if (!on || !field) return;
    if (reduce.matches) drawArrows(); else drawStreaks();
  };
  const onResize = () => { resize(); onMove(); };
  const onVisibility = () => refresh();
  map.on('move', onMove);
  map.on('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  reduce.addEventListener('change', onVisibility);
  resize();

  return {
    update(nextOn, nextField, nextNight) {
      const showNow = !!(nextOn && nextField);
      const changed = showNow !== !!(on && field) || nextField !== field || nextNight !== night;
      if (!changed) return;
      const fresh = nextField && nextField !== field;
      on = !!nextOn; field = nextField || null; night = !!nextNight;
      if (fresh) { count = 0; camera(); } // camera() re-seeds every streak, with staggered ages
      refresh();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true; cancelAnimationFrame(frame);
      map.off('move', onMove); map.off('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      reduce.removeEventListener('change', onVisibility);
      canvas.remove();
    },
  };
}
