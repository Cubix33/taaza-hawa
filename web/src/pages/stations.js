import '../air-lens.css';
import { state, set, ls } from '../lib/store.js';
import { esc, ageText, icon } from '../lib/ui.js';
import { loadStations } from '../lib/actions.js';
import { api } from '../lib/api.js';
import { mountAirLens } from '../lib/air-lens-map.js';
import { stationReading, nearestStation, readingColor } from '../lib/air-lens-data.js';
import { detailPanel, words as w, statusName, pollutantName } from '../lib/air-lens-panel.js';
import { skyLook, skyCaption, cityReading, atIST } from '../lib/air-lens-sky.js';

// `sky` is the Live/Dusk/Day choice; `night` (dark palette) and `look` are derived from it in refreshSky().
const lens = { card: null, loading: false, error: false, pollutant: 'pm25', filter: 'all', query: '', sky: 'live', night: true, look: null, evidence: true, pin: null, placing: false, orbit: false, failed: false, tileError: false, ready: false, view: 'city', locationMessage: '', locating: false };
let scene = null, request = null, refreshTimer = null, skyTimer = null, active = false, generation = 0, locationRequest = 0, renderedUid = null;
const current = () => state.stations.find((s) => s.uid === state.uid);
const visible = () => state.stations.filter((s) => (lens.filter === 'all' || stationReading(s, lens.pollutant).status === lens.filter) && s.name.toLowerCase().includes(lens.query.toLowerCase().trim()));
const button = (action, label, selected = false, extra = '') => `<button type="button" data-lens="${action}" class="${selected ? 'active' : ''}" aria-pressed="${selected}" ${extra}>${label}</button>`;

// Dev-only screenshot hooks, e.g. #/stations?hazeTest=320&skyTime=18:05 (IST). `import.meta.env.DEV`
// is statically false in production builds, so Vite drops this branch and the params do nothing there.
function devSky() {
  if (!import.meta.env.DEV) return {};
  const q = { ...Object.fromEntries(new URLSearchParams(location.search)), ...state.params }, out = {};
  if (q.hazeTest != null && q.hazeTest !== '' && Number.isFinite(Number(q.hazeTest))) out.reading = Number(q.hazeTest);
  const time = /^(\d{1,2}):(\d{2})$/.exec(q.skyTime || '');
  if (time) out.date = atIST(Number(time[1]), Number(time[2]));
  return out;
}
function refreshSky() {
  const dev = devSky();
  lens.look = skyLook({ mode: lens.sky, date: dev.date || new Date(), reading: dev.reading ?? cityReading(state.stations), test: dev.reading != null });
  lens.night = lens.look.night;
  return lens.look;
}
// Live mode follows the sun minute by minute without re-rendering the page (unless day turns to night).
function tickSky() {
  if (!active || document.hidden || lens.sky !== 'live') return;
  const wasNight = lens.night;
  refreshSky();
  if (lens.night !== wasNight) { set({}); return; }
  scene?.api?.sky?.();
  const caption = document.getElementById('lens-sky-caption');
  if (caption) caption.textContent = skyCaption(lens.look, w);
}

export async function load() {
  active = true;
  const epoch = ++generation;
  try {
    await loadStations(true);
    if (!active || epoch !== generation) return;
    state.error = null;
    set({});
    await loadEvidence();
    if (active && epoch === generation && !refreshTimer) refreshTimer = setInterval(() => { if (active && !document.hidden) load(); }, 5 * 60 * 1000);
  } catch (error) {
    if (active && epoch === generation) {
      if (state.stations.length) { lens.locationMessage = w('Refresh failed. Showing the previous readings; try reloading.', 'अपडेट नहीं मिला। पिछली रीडिंग दिखा रहे हैं; फिर लोड करें।'); set({}); }
      else set({ error: error.message });
    }
  }
}

async function loadEvidence() {
  request?.abort();
  const controller = new AbortController(); request = controller;
  const uid = state.uid;
  lens.loading = true; lens.error = false; lens.card = null;
  set({});
  try {
    const card = await api(`/card?uid=${uid}`, { signal: controller.signal });
    if (!active || controller.signal.aborted || uid !== state.uid) return;
    lens.card = card; state.demo = state.demo || !!card.demo;
  } catch (error) { if (error.name !== 'AbortError' && active && uid === state.uid) lens.error = true; }
  finally { if (active && !controller.signal.aborted && uid === state.uid) { lens.loading = false; set({}); } }
}

function select(uid, fly = true) {
  if (!state.stations.some((s) => s.uid === uid)) return;
  state.uid = uid; state.card = null; ls.set('uid', uid);
  if (fly) { lens.view = 'station'; scene?.api?.focus(uid); }
  loadEvidence();
}

function stationRows() {
  const stations = visible();
  return stations.length ? stations.map((s) => {
    const r = stationReading(s, lens.pollutant);
    return `<li><button class="lens-station-row ${s.uid === state.uid ? 'selected' : ''}" data-station="${s.uid}" aria-pressed="${s.uid === state.uid}"><span class="lens-list-value ${r.status}" style="--reading:${readingColor(r.value)}">${r.value ?? '—'}</span><span class="lens-list-name"><b>${esc(s.name)}</b><small>${statusName(r.status)} · ${ageText(s.age_min)}</small></span>${icon.arrow}</button></li>`;
  }).join('') : `<li class="lens-no-match">${w('No stations match. Try another name or filter.', 'कोई स्टेशन नहीं मिला। दूसरा नाम या फ़िल्टर चुनें।')}</li>`;
}

export function view() {
  const fresh = state.stations.filter((s) => stationReading(s, lens.pollutant).status === 'fresh').length;
  const look = refreshSky();
  return `<div class="lens-page">
    <header class="lens-heading"><div><p class="lens-overline"><span class="lens-orbit-logo" aria-hidden="true">◉</span> TAAZA HAWA / ${w('DELHI OBSERVATORY', 'दिल्ली की हवा')}</p><h1>Air <em>Lens.</em><span>${w('A little perspective.<br>A clearer picture.', 'हवा को देखें।<br>समझकर फ़ैसला लें।')}</span></h1></div><div class="lens-heading-meta"><span>${w('ONE CITY. MANY READINGS.', 'एक शहर। कई रीडिंग।')}</span><p><b>${String(state.stations.length).padStart(2, '0')}</b> ${w('stations', 'स्टेशन')} <i></i> <b>${String(fresh).padStart(2, '0')}</b> ${w('fresh', 'ताज़ा')}</p></div></header>
    <div class="lens-workspace">
      <section class="lens-stage ${look.night ? 'night' : 'day'}" aria-label="${w('Interactive Delhi air map', 'दिल्ली की हवा का नक्शा')}">
        <div id="air-lens-map" class="lens-map" aria-label="${w('Delhi station map. Use the station list for keyboard selection.', 'दिल्ली के स्टेशन। कीबोर्ड के लिए नीचे स्टेशन सूची चुनें।')}"></div>
        <div class="lens-map-shade"></div>
        <div class="lens-scene-top"><div class="lens-scene-location"><span>NEW DELHI</span><small>28.6139° N &nbsp; 77.2090° E</small></div><div class="lens-scene-theme" aria-label="${w('Map appearance', 'नक्शे का रंग')}">${button('live', `<i class="lens-live-dot" aria-hidden="true"></i>${w('Live', 'लाइव')}`, lens.sky === 'live', `title="${w('Follow Delhi’s real sun and live air', 'दिल्ली का असली सूरज और लाइव हवा')}"`)}${button('night', w('Dusk', 'शाम'), lens.sky === 'dusk')}${button('day', w('Day', 'दिन'), lens.sky === 'day')}</div></div>
        <div class="lens-camera-controls" role="group" aria-label="${w('Camera view', 'नक्शे का दृश्य')}">${button('city', w('City', 'शहर'), lens.view === 'city')}${button('close', w('Neighbourhood', 'आस-पास'), lens.view === 'close')}${button('flat', w('Flat', 'सपाट'), lens.view === 'flat')}</div>
        <div class="lens-map-tools">
          <button data-lens="north" class="lens-compass" title="${w('Face north', 'उत्तर दिशा')}" aria-label="${w('Face north', 'उत्तर दिशा')}"><span>N</span><i id="lens-compass-needle">↑</i></button>
          <div class="lens-zoom"><button data-lens="in" aria-label="${w('Zoom in', 'बड़ा करें')}">+</button><button data-lens="out" aria-label="${w('Zoom out', 'छोटा करें')}">−</button></div>
          <button data-lens="orbit" class="lens-tool ${lens.orbit ? 'active' : ''}" aria-pressed="${lens.orbit}" title="${w('Slow camera orbit', 'धीरे नक्शा घुमाएँ')}" aria-label="${w('Slow camera orbit', 'धीरे नक्शा घुमाएँ')}">↻</button>
        </div>
        <div class="lens-scene-bottom"><span class="lens-scene-caption">${w('A city in perspective.', 'अपने शहर की हवा देखें।')}</span><p><span class="lens-desktop-hint">${w('Drag to explore · right-drag to tilt', 'खींचकर देखें · दाएँ बटन से झुकाएँ')}</span><span class="lens-touch-hint">${w('Pinch to zoom · drag to explore', 'दो उँगलियों से ज़ूम · खींचकर देखें')}</span></p><p class="lens-sky-caption" id="lens-sky-caption">${esc(skyCaption(look, w))}</p><div class="lens-landmarks"><span>${w('EXPLORE', 'देखें')}</span>${button('india-gate', w('India Gate', 'इंडिया गेट'))}${button('old-delhi', w('Old Delhi', 'पुरानी दिल्ली'))}${button('yamuna', w('Yamuna', 'यमुना'))}</div></div>
        ${!lens.ready || lens.failed ? `<div class="lens-map-status ${lens.failed ? 'failed' : ''}" role="status"><span class="lens-loading-ring"></span><h2>${lens.failed ? w('The map is taking a break.', 'नक्शा अभी नहीं खुल रहा।') : w('Bringing Delhi into view', 'दिल्ली का नक्शा खुल रहा है')}</h2><p>${lens.failed ? w('Your station readings are still available below.', 'स्टेशन की रीडिंग नीचे उपलब्ध हैं।') : w('Loading the city, then its air.', 'पहले शहर, फिर उसकी हवा।')}</p>${lens.failed ? `<button data-lens="retry-map">${w('Reload map', 'नक्शा फिर खोलें')}</button>` : ''}</div>` : ''}
        ${lens.tileError && !lens.failed ? `<p class="lens-tile-notice" role="status">${w('Some map detail is unavailable. Station readings remain usable.', 'नक्शे के कुछ हिस्से नहीं खुले। स्टेशन रीडिंग उपलब्ध हैं।')}</p>` : ''}
        ${lens.placing ? `<p class="lens-pin-prompt" role="status">${w('Click the map to place your pin', 'अपना पिन रखने के लिए नक्शे पर क्लिक करें')}</p>` : ''}
      </section>
      <aside class="lens-detail" aria-label="${w('Selected station evidence', 'चुने गए स्टेशन की जानकारी')}" id="lens-detail">${detailPanel(current(), lens)}</aside>
      <div class="lens-map-footer"><div class="lens-pollutants"><span>${w('MAP READINGS', 'नक्शे की रीडिंग')}</span>${button('pm25', 'PM₂.₅', lens.pollutant === 'pm25')}${button('pm10', 'PM₁₀', lens.pollutant === 'pm10')}<small>${w('sub-index', 'उप-सूचकांक')}</small></div><div class="lens-map-key"><span><i class="solid"></i>${w('Fresh', 'ताज़ा')}</span><span><i class="dashed"></i>${w('Over 3h old', '3 घंटे से पुरानी')}</span><span><i class="missing"></i>${w('Missing', 'रीडिंग नहीं')}</span></div></div>
    </div>
    <div class="lens-actions"><div>${button('locate', `${icon.target}${lens.locating ? w('Locating…', 'स्थान खोज रहे हैं…') : w('Use my location', 'मेरा स्थान')}`, false, lens.locating ? 'disabled' : '')}${button('pin', `${icon.pin}${w('Drop a pin', 'पिन रखें')}`, lens.placing)}${lens.pin ? button('clear-pin', w('Clear pin', 'पिन हटाएँ')) : ''}<span class="lens-location-message" role="status">${esc(lens.locationMessage)}</span></div><label class="lens-evidence-toggle"><input id="lens-evidence-toggle" type="checkbox" ${lens.evidence ? 'checked' : ''}>${w('Show estimate connections', 'अंदाज़े के संबंध दिखाएँ')}</label></div>
    <div class="lens-colour-scale"><span>${pollutantName(lens.pollutant)} ${w('sub-index', 'उप-सूचकांक')}</span><div>${[50, 100, 200, 300, 400, 500].map((v) => `<span><i style="background:${readingColor(v)}"></i><small>${v}</small></span>`).join('')}</div><span>${w('Higher = more polluted · zoom for more markers', 'ज़्यादा = अधिक प्रदूषण · और रीडिंग के लिए ज़ूम करें')}</span></div>
    <p class="lens-footnote">${w('Connections show inputs to an estimate, not the movement of pollution. Buildings give geographic context; their heights do not describe air quality.', 'रेखाएँ अंदाज़े में इस्तेमाल हुई रीडिंग दिखाती हैं, प्रदूषण की गति नहीं। इमारतों की ऊँचाई केवल भौगोलिक जानकारी है।')}</p>
    <section class="lens-directory" aria-labelledby="lens-directory-title"><div class="lens-directory-head"><div><span class="lens-overline">${w('THE STATION NETWORK', 'स्टेशन नेटवर्क')}</span><h2 id="lens-directory-title">${w('Find your corner of Delhi.', 'दिल्ली में अपना इलाक़ा खोजें।')}</h2></div><label class="lens-search">${icon.search}<input id="lens-search" type="search" placeholder="${w('Search a station…', 'स्टेशन खोजें…')}" aria-label="${w('Search stations', 'स्टेशन खोजें')}" value="${esc(lens.query)}"></label></div>
      <div class="lens-filter-row">${button('all', w('All stations', 'सभी स्टेशन'), lens.filter === 'all')}${button('fresh', w('Fresh readings', 'ताज़ा रीडिंग'), lens.filter === 'fresh')}${button('stale', w('Old readings', 'पुरानी रीडिंग'), lens.filter === 'stale')}${button('missing', w('Missing readings', 'रीडिंग नहीं'), lens.filter === 'missing')}<span id="lens-result-count">${visible().length} ${w('stations', 'स्टेशन')}</span></div><ul class="lens-station-list" id="lens-station-list">${stationRows()}</ul>
    </section>
  </div>`;
}

function mapData() {
  return { ...lens, current: state.uid, allStations: state.stations, stations: visible(),
    markerLabel: (s, r) => `${s.name}: ${pollutantName(lens.pollutant)} ${r.value ?? w('unavailable', 'उपलब्ध नहीं')}, ${statusName(r.status)}, ${ageText(s.age_min)}` };
}

function pin(point) {
  lens.placing = false;
  const nearest = nearestStation(point, state.stations);
  if (point[0] < 76.8 || point[0] > 77.4 || point[1] < 28.4 || point[1] > 28.9 || !nearest || nearest.distance > 35) {
    lens.locationMessage = w('Coverage is limited to Delhi. Choose a station below.', 'अभी केवल दिल्ली में सेवा है। नीचे स्टेशन चुनें।'); set({}); return;
  }
  lens.pin = point; lens.locationMessage = w('Pin linked to the nearest available station.', 'पिन सबसे पास के उपलब्ध स्टेशन से जुड़ा है।'); select(nearest.station.uid);
}

function locate() {
  if (!navigator.geolocation) { lens.locationMessage = w('Location unavailable. Choose a station below.', 'स्थान उपलब्ध नहीं। नीचे स्टेशन चुनें।'); set({}); return; }
  const epoch = ++locationRequest;
  lens.locating = true; set({});
  navigator.geolocation.getCurrentPosition((position) => {
    if (!active || epoch !== locationRequest) return;
    lens.locating = false; pin([position.coords.longitude, position.coords.latitude]);
  }, () => {
    if (!active || epoch !== locationRequest) return;
    lens.locating = false; lens.locationMessage = w('Location unavailable. Drop a pin or choose a station.', 'स्थान नहीं मिला। पिन रखें या स्टेशन चुनें।'); set({});
  }, { timeout: 10000, maximumAge: 60000 });
}

function action(name) {
  const controls = scene?.api;
  if (['city', 'close', 'flat'].includes(name)) { lens.view = name; if (name === 'close') controls?.focus(state.uid, true); else controls?.[name](); }
  else if (['live', 'night', 'day'].includes(name)) lens.sky = name === 'night' ? 'dusk' : name;
  else if (['pm25', 'pm10'].includes(name)) lens.pollutant = name;
  else if (['all', 'fresh', 'stale', 'missing'].includes(name)) lens.filter = name;
  else if (name === 'in' || name === 'out') controls?.zoom(name === 'in' ? 1 : -1);
  else if (name === 'north') controls?.north();
  else if (name === 'orbit') controls?.orbit();
  else if (name === 'pin') lens.placing = !lens.placing;
  else if (name === 'clear-pin') { lens.pin = null; lens.locationMessage = ''; }
  else if (name === 'locate') { locate(); return; }
  else if (name === 'retry-card') { loadEvidence(); return; }
  else if (name === 'retry-map') { scene?.controller.abort(); scene = null; lens.failed = false; lens.ready = false; }
  else {
    const places = { 'india-gate': [77.2295, 28.6129], 'old-delhi': [77.2335, 28.6562], yamuna: [77.256, 28.632] };
    if (places[name]) { lens.view = 'close'; controls?.landmark(places[name]); }
  }
  set({});
}

export function bind() {
  document.querySelectorAll('[data-lens]').forEach((b) => b.addEventListener('click', () => action(b.dataset.lens)));
  document.querySelectorAll('[data-evidence-station]').forEach((b) => b.addEventListener('click', () => select(Number(b.dataset.evidenceStation))));
  document.getElementById('lens-station-list')?.addEventListener('click', (event) => {
    const row = event.target.closest('[data-station]'); if (row) select(Number(row.dataset.station));
  });
  document.getElementById('lens-search')?.addEventListener('input', (event) => {
    lens.query = event.target.value;
    document.getElementById('lens-station-list').innerHTML = stationRows();
    document.getElementById('lens-result-count').textContent = `${visible().length} ${w('stations', 'स्टेशन')}`;
    scene?.api?.update();
  });
  document.getElementById('lens-evidence-toggle')?.addEventListener('change', (event) => { lens.evidence = event.target.checked; scene?.api?.update(); });
  if (!skyTimer) skyTimer = setInterval(tickSky, 60 * 1000);
  const slot = document.getElementById('air-lens-map');
  if (!slot) { scene?.controller.abort(); scene = null; lens.ready = false; return; }
  if (lens.failed) return;
  if (scene) { slot.replaceWith(scene.el); scene.api?.update(); scene.api?.resize(); return; }
  const instance = { el: slot, api: null, controller: new AbortController() }; scene = instance;
  mountAirLens(slot, mapData, {
    onSelect: select, onPin: pin,
    onOrbit: (orbit) => { lens.orbit = orbit; const b = document.querySelector('[data-lens="orbit"]'); b?.classList.toggle('active', orbit); b?.setAttribute('aria-pressed', String(orbit)); },
    onCamera: ({ bearing }) => { const needle = document.getElementById('lens-compass-needle'); if (needle) needle.style.transform = `rotate(${-bearing}deg)`; },
    onFailure: () => { if (scene === instance) { instance.controller.abort(); scene = null; lens.failed = true; lens.ready = false; set({}); } },
    onTileError: () => { if (scene === instance && !lens.tileError) { lens.tileError = true; set({}); } },
  }, instance.controller.signal).then((controller) => {
    if (scene !== instance) { controller.destroy(); return; }
    instance.api = controller; lens.ready = true; lens.tileError = false; set({}); controller.city();
  }).catch((error) => { if (error.name !== 'AbortError' && scene === instance) { scene = null; lens.failed = true; lens.ready = false; set({}); } });
}

// The shell replaces its HTML on updates. Preserve the map node, keyboard focus,
// and the evidence scroll position so language/data changes don't restart exploration.
export function beforeRender() {
  const focused = document.activeElement;
  const id = focused?.id;
  const attribute = ['data-lens', 'data-station', 'data-evidence-station'].find((a) => focused?.hasAttribute(a));
  const value = attribute ? focused.getAttribute(attribute) : null;
  const detailScroll = renderedUid === state.uid ? document.getElementById('lens-detail')?.scrollTop || 0 : 0;
  renderedUid = state.uid;
  return () => {
    const panel = document.getElementById('lens-detail'); if (panel) panel.scrollTop = detailScroll;
    const target = focused?.isConnected ? focused : id ? document.getElementById(id) : attribute ? document.querySelector(`[${attribute}="${CSS.escape(value)}"]`) : null;
    if (target && target !== document.body) target.focus({ preventScroll: true });
  };
}

export function unmount() {
  active = false; generation++; locationRequest++; request?.abort(); clearInterval(refreshTimer); refreshTimer = null; clearInterval(skyTimer); skyTimer = null;
  scene?.controller.abort(); scene = null; lens.ready = false; lens.failed = false; lens.tileError = false; lens.locating = false; lens.orbit = false;
}
