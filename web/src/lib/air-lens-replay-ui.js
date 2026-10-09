// Air Lens 24-hour replay: timeline UI and lazy history loading.
// The page renders replayView() under the map and feeds replayReadingFor() into the existing
// marker rendering (no second marker set). Frame changes patch the timeline in place and call
// onFrame() so a playing replay never re-renders the whole page or restarts the map.
import { api } from './api.js';
import { state } from './store.js';
import { esc, icon } from './ui.js';
import { readingColor } from './air-lens-data.js';
import { words as w } from './air-lens-panel.js';
import { REPLAY_HOURS, bucketHourly, replayAnchor, bestHour, replayReading, coverage, agoText, mapLimit } from './air-lens-replay.js';

const TTL = 10 * 60 * 1000, CONCURRENCY = 4, LAST = REPLAY_HOURS - 1;
const STEP_MS = 700, REDUCED_STEP_MS = 1400;
const r = { open: false, loading: false, done: 0, total: 0, error: false, ago: 0, playing: false, anchor: null, frames: new Map(), failed: 0, status: '' };
const cache = new Map(); // uid -> { at, points }; survives closing so reopening is instant
let controller = null, timer = 0, statusTimer = 0;
let hooks = { stations: () => [], current: () => null, onFrame: () => {}, rerender: () => {} };

const SVG = {
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5.5" width="4" height="13" rx="1" fill="currentColor"/><rect x="13.5" y="5.5" width="4" height="13" rx="1" fill="currentColor"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};
const when = (ago) => agoText(ago, state.lang);
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const shortName = (name) => String(name || '').replace(/(,\s*(Delhi|India))+\s*$/i, '');
const setText = (id, text) => { const el = document.getElementById(id); if (el && el.textContent !== text) el.textContent = text; };
// Slider value grows left to right (older -> latest); `ago` counts hours back from the latest.
const position = (ago) => (LAST - ago) / LAST;

export const replayActive = () => r.open && !r.loading && r.anchor !== null;
export const replayReadingFor = (uid) => replayReading(r.frames.get(uid), r.ago);
export const replayScaleLabel = () => replayActive() ? w('AQI (highest sub-index), replay', 'AQI (सबसे ऊँचा उप-सूचकांक), रीप्ले') : '';
export function replayMarkerLabel(s, reading) {
  const tag = `${w('replay', 'रीप्ले')}, ${when(r.ago)}`;
  if (reading.unavailable) return `${s.name}: ${w('history unavailable', 'इतिहास नहीं मिला')} · ${tag}`;
  return reading.value == null ? `${s.name}: ${w('no reading', 'रीडिंग नहीं')} · ${tag}` : `${s.name}: AQI ${reading.value} · ${tag}`;
}
export const replayFlag = () => replayActive()
  ? `<p class="lens-replay-flag"><b>${w('REPLAY', 'रीप्ले')}</b><span id="lens-replay-flag-when">${esc(when(r.ago))}</span></p>` : '';

function countText() {
  const total = hooks.stations().length, { have } = coverage(r.frames, r.ago);
  return w(`${have} of ${total} stations reported this hour`, `इस घंटे ${total} में से ${have} स्टेशनों की रीडिंग`);
}
const progressText = () => w(`Loading station history… ${r.done} of ${r.total}`, `स्टेशनों का इतिहास आ रहा है… ${r.total} में से ${r.done}`);
const playLabel = () => r.playing ? w('Pause replay', 'रीप्ले रोकें') : w('Play hour by hour', 'घंटे-दर-घंटे चलाएँ');

function hereHTML() {
  const s = hooks.current();
  if (!s) return '';
  const frames = r.frames.get(s.uid);
  if (!frames) return esc(w('History unavailable for this station.', 'इस स्टेशन का इतिहास नहीं मिला।'));
  const v = frames[r.ago];
  return v == null ? esc(w('No reading in this hour.', 'इस घंटे कोई रीडिंग नहीं।'))
    : `<i style="--reading:${readingColor(v)}"></i>AQI <b>${v}</b> ${esc(w('in this hour', 'इस घंटे'))}`;
}
function valueText() {
  const s = hooks.current(), v = s ? r.frames.get(s.uid)?.[r.ago] : null;
  return `${when(r.ago)}${s ? ` · ${shortName(s.name)}: ${v == null ? w('no reading', 'रीडिंग नहीं') : `AQI ${v}`}` : ''}`;
}

// Bars start at zero; the scale tops out at 300 or the station's own peak, like the Check page's trend.
function stripHTML(frames) {
  const top = Math.max(300, ...(frames || []).filter((v) => v != null));
  return Array.from({ length: REPLAY_HOURS }, (_, i) => {
    const ago = LAST - i, v = frames?.[ago] ?? null;
    const tip = `${when(ago)}: ${v == null ? w('no reading', 'रीडिंग नहीं') : `AQI ${v}`}`;
    return `<i data-ago="${ago}" class="${v == null ? 'gap' : ''} ${ago === r.ago ? 'current' : ''}" title="${esc(tip)}" style="--reading:${readingColor(v)};--h:${v == null ? 0 : Math.max(6, Math.round((v / top) * 100))}%"></i>`;
  }).join('');
}

function stationHTML() {
  const s = hooks.current();
  if (!s) return '';
  const frames = r.frames.get(s.uid), best = bestHour(frames);
  const bestLine = !frames ? '' : best
    ? `<p class="lens-replay-best"><span>${w('Lowest in the last 24 h', 'पिछले 24 घंटों में सबसे कम')}</span><b>AQI ${best.value}</b> · ${esc(when(best.ago))}<button type="button" id="lens-replay-best" data-ago="${best.ago}">${w('Show that hour', 'वह घंटा दिखाएँ')}</button></p>`
    : `<p class="lens-replay-best">${w('No readings from this station in the last 24 h.', 'पिछले 24 घंटों में इस स्टेशन की कोई रीडिंग नहीं।')}</p>`;
  return `<div class="lens-replay-station"><span class="lens-overline">${w('BARS: STATION IN FOCUS', 'बार: चुना गया स्टेशन')}</span><b title="${esc(s.name)}">${esc(shortName(s.name))}</b><p id="lens-replay-here">${hereHTML()}</p>${bestLine}</div>`;
}

export function replayView() {
  const title = `<span class="lens-overline" id="lens-replay-title">${w('24-HOUR REPLAY', '24 घंटे का रीप्ले')}</span>`;
  const status = `<p class="lens-replay-status" id="lens-replay-status" role="status">${esc(r.status)}</p>`;
  if (!r.open) {
    return `<section class="lens-replay is-closed" aria-labelledby="lens-replay-title">
      <div class="lens-replay-intro">${title}<p>${w('See how each station’s air changed, hour by hour.', 'देखें कि हर स्टेशन की हवा घंटे-दर-घंटे कैसे बदली।')}</p></div>
      ${status}<button type="button" id="lens-replay-toggle" class="lens-replay-open" ${hooks.stations().length ? '' : 'disabled'}>${icon.clock}${w('Replay last 24 h', 'पिछले 24 घंटे देखें')}</button>
    </section>`;
  }
  const now = `<button type="button" id="lens-replay-toggle" class="lens-replay-now" aria-label="${w('Now: back to live readings', 'अभी: लाइव रीडिंग पर लौटें')}"><i></i>${w('Now', 'अभी')}</button>`;
  if (!replayActive()) {
    const body = r.loading ? `<p class="lens-replay-message" id="lens-replay-progress">${progressText()}</p>`
      : r.error ? `<p class="lens-replay-message">${w('Station history couldn’t load. Live readings are unchanged.', 'स्टेशनों का इतिहास नहीं मिला। लाइव रीडिंग वैसी ही हैं।')} <button type="button" id="lens-replay-retry">${w('Retry', 'फिर कोशिश करें')}</button></p>`
      : `<p class="lens-replay-message">${w('No station reported in the last 24 hours.', 'पिछले 24 घंटों में किसी स्टेशन की रीडिंग नहीं मिली।')}</p>`;
    return `<section class="lens-replay is-open" aria-labelledby="lens-replay-title" aria-busy="${r.loading}"><div class="lens-replay-head">${title}${body}${now}</div>${status}</section>`;
  }
  const s = hooks.current(), frames = s ? r.frames.get(s.uid) : null;
  const ticks = [LAST, 18, 12, 6, 0].map((ago) => `<span style="--at:${position(ago)}">${ago ? `−${ago} ${w('h', 'घंटे')}` : w('Latest', 'नवीनतम')}</span>`).join('');
  return `<section class="lens-replay is-open is-active ${r.playing ? 'is-playing' : ''}" aria-labelledby="lens-replay-title">
    <div class="lens-replay-head">${title}<p class="lens-replay-when"><b id="lens-replay-when">${esc(when(r.ago))}</b><span id="lens-replay-count">${esc(countText())}</span></p>${now}</div>
    <div class="lens-replay-body">
      <div class="lens-replay-controls" role="group" aria-label="${w('Replay controls', 'रीप्ले नियंत्रण')}">
        <button type="button" id="lens-replay-prev" aria-label="${w('One hour earlier', 'एक घंटा पहले')}" aria-disabled="${r.ago >= LAST}">${SVG.prev}</button>
        <button type="button" id="lens-replay-play" class="${r.playing ? 'active' : ''}" aria-label="${playLabel()}">${r.playing ? SVG.pause : SVG.play}</button>
        <button type="button" id="lens-replay-next" aria-label="${w('One hour later', 'एक घंटा बाद')}" aria-disabled="${r.ago <= 0}">${SVG.next}</button>
      </div>
      <div class="lens-replay-track" style="--at:${position(r.ago)}">
        <b class="lens-replay-playhead" aria-hidden="true"></b><div class="lens-replay-strip" id="lens-replay-strip" aria-hidden="true">${stripHTML(frames)}</div>
        <input id="lens-replay-slider" class="lens-replay-slider" type="range" min="0" max="${LAST}" step="1" value="${LAST - r.ago}" aria-label="${w('Hour shown on the map', 'नक्शे पर दिखाया गया घंटा')}" aria-valuetext="${esc(valueText())}" aria-describedby="lens-replay-note">
        <div class="lens-replay-ticks" aria-hidden="true">${ticks}</div>
      </div>
      ${stationHTML()}
    </div>
    <p class="lens-replay-note" id="lens-replay-note">${w('Past station readings, not a forecast. The map shows each station’s AQI (its highest sub-index) for that hour, so numbers can differ from the PM₂.₅ view. An hour with no reading stays empty; nothing is filled in.', 'ये स्टेशनों की पुरानी रीडिंग हैं, पूर्वानुमान नहीं। नक्शे पर हर स्टेशन का उस घंटे का AQI (सबसे ऊँचा उप-सूचकांक) है, इसलिए अंक PM₂.₅ से अलग हो सकते हैं। जिस घंटे रीडिंग नहीं मिली, वह खाली रहता है; कुछ भी अंदाज़े से नहीं भरा जाता।')}${r.failed ? ` <b>${w(`History unavailable for ${r.failed} station${r.failed === 1 ? '' : 's'}.`, r.failed === 1 ? '1 स्टेशन का इतिहास नहीं मिला।' : `${r.failed} स्टेशनों का इतिहास नहीं मिला।`)}</b>` : ''}</p>
    ${status}
  </section>`;
}

// Patch only what changes per frame: keeps slider drags, focus and the map intact.
function paint() {
  const slider = document.getElementById('lens-replay-slider');
  if (slider) {
    const value = String(LAST - r.ago);
    if (slider.value !== value) slider.value = value;
    slider.setAttribute('aria-valuetext', valueText());
  }
  setText('lens-replay-when', when(r.ago));
  setText('lens-replay-flag-when', when(r.ago));
  setText('lens-replay-count', countText());
  const here = document.getElementById('lens-replay-here');
  if (here) here.innerHTML = hereHTML();
  document.querySelector('.lens-replay-track')?.style.setProperty('--at', String(position(r.ago)));
  document.querySelectorAll('#lens-replay-strip [data-ago]').forEach((cell) => cell.classList.toggle('current', Number(cell.dataset.ago) === r.ago));
  const play = document.getElementById('lens-replay-play');
  if (play) { play.innerHTML = r.playing ? SVG.pause : SVG.play; play.setAttribute('aria-label', playLabel()); play.classList.toggle('active', r.playing); }
  document.querySelector('.lens-replay')?.classList.toggle('is-playing', r.playing);
  document.getElementById('lens-replay-prev')?.setAttribute('aria-disabled', String(r.ago >= LAST));
  document.getElementById('lens-replay-next')?.setAttribute('aria-disabled', String(r.ago <= 0));
  hooks.onFrame();
}

function announce(text) {
  clearTimeout(statusTimer);
  r.status = text; setText('lens-replay-status', text);
  statusTimer = setTimeout(() => { r.status = ''; setText('lens-replay-status', ''); }, 5000);
}

function stopTimer() { clearInterval(timer); timer = 0; }
function pause(reason) {
  stopTimer();
  const was = r.playing;
  r.playing = false; paint();
  if (was && reason !== 'silent') announce(reason === 'end' ? w('Replay reached the latest hour.', 'रीप्ले नवीनतम घंटे तक पहुँच गया।') : `${w('Paused', 'रुका')}: ${when(r.ago)}`);
}
// Each tick jumps one whole hour. With reduced motion the playhead and marker colours also
// stop gliding (CSS) and each hour is held longer, so playback steps instead of animating.
function tick() {
  if (!r.playing || document.hidden || !document.getElementById('lens-replay-slider')) { pause('silent'); return; }
  r.ago = Math.max(0, r.ago - 1);
  if (r.ago === 0) pause('end'); else paint();
}
function play() {
  if (!replayActive()) return;
  stopTimer();
  if (r.ago === 0) r.ago = LAST; // at the latest hour, play from the start of the window
  r.playing = true; paint();
  timer = setInterval(tick, reduced() ? REDUCED_STEP_MS : STEP_MS);
}
function setAgo(ago) {
  if (!replayActive()) return;
  if (r.playing) pause('silent');
  r.ago = Math.max(0, Math.min(LAST, ago)); paint();
}

function build(uids) {
  const loaded = uids.filter((uid) => cache.has(uid));
  r.anchor = replayAnchor(loaded.map((uid) => cache.get(uid).points));
  r.frames = new Map(loaded.map((uid) => [uid, bucketHourly(cache.get(uid).points, r.anchor)]));
  r.failed = uids.length - loaded.length;
  r.error = loaded.length === 0;
}

async function openReplay() {
  stopTimer(); controller?.abort(); controller = null;
  const uids = hooks.stations().map((s) => s.uid), fresh = Date.now() - TTL;
  const need = uids.filter((uid) => !(cache.get(uid)?.at > fresh));
  Object.assign(r, { open: true, error: false, loading: need.length > 0, done: uids.length - need.length, total: uids.length, ago: 0, playing: false, status: '' });
  if (need.length) {
    const c = controller = new AbortController();
    hooks.rerender();
    await mapLimit(need, CONCURRENCY, async (uid) => {
      if (c.signal.aborted) return;
      try {
        const body = await api(`/history?uid=${encodeURIComponent(uid)}&hours=${REPLAY_HOURS}`, { signal: c.signal });
        cache.set(uid, { at: Date.now(), points: Array.isArray(body?.points) ? body.points : [] });
      } catch { /* keep any older cached copy; a station with none counts as unavailable */ }
      if (!c.signal.aborted) { r.done++; setText('lens-replay-progress', progressText()); }
    });
    if (controller !== c || c.signal.aborted) return;
    controller = null;
  }
  build(uids);
  r.loading = false;
  if (replayActive()) announce(w('Replay ready. Use the slider or Play to move through the last 24 hours.', 'रीप्ले तैयार है। स्लाइडर या चलाएँ बटन से पिछले 24 घंटे देखें।'));
  hooks.rerender();
}

// Back to live. Returns true if a replay was open (the caller re-renders).
export function exitReplay(announceLive = true) {
  stopTimer(); controller?.abort(); controller = null;
  const was = r.open;
  Object.assign(r, { open: false, loading: false, playing: false, ago: 0, error: false });
  if (was && announceLive) announce(w('Back to live readings.', 'लाइव रीडिंग पर लौट आए।'));
  return was;
}
export function resetReplay() { exitReplay(false); clearTimeout(statusTimer); r.status = ''; }

export function bindReplay(nextHooks) {
  hooks = nextHooks;
  const on = (id, fn, type = 'click') => document.getElementById(id)?.addEventListener(type, fn);
  on('lens-replay-toggle', () => { if (r.open) { exitReplay(); hooks.rerender(); } else openReplay(); });
  on('lens-replay-retry', () => openReplay());
  on('lens-replay-play', () => (r.playing ? pause() : play()));
  on('lens-replay-prev', () => setAgo(r.ago + 1));
  on('lens-replay-next', () => setAgo(r.ago - 1));
  on('lens-replay-best', (event) => setAgo(Number(event.currentTarget.dataset.ago)));
  on('lens-replay-slider', (event) => setAgo(LAST - Number(event.target.value)), 'input');
  on('lens-replay-strip', (event) => { const cell = event.target.closest('[data-ago]'); if (cell) setAgo(Number(cell.dataset.ago)); });
}
