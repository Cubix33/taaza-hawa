import { emptyGeoJSON, evidenceGeoJSON, validCoordinate, stationReading, readingColor } from './air-lens-data.js';
import { addBuildings, styleMap } from './air-lens-style.js';
import { mountWind } from './air-lens-wind-layer.js';
import { mountSky } from './air-lens-sky.js';
import { lensFeature } from './air-lens-features.js';

export async function mountAirLens(el, getData, handlers, signal) {
  const [gl, { default: workerUrl }] = await Promise.all([
    import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'), import('maplibre-gl/dist/maplibre-gl.css'),
  ]);
  signal.throwIfAborted();
  gl.setWorkerUrl(workerUrl);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)').matches;
  let ready = false, destroyed = false, orbiting = false, frame = 0, prevTime = 0, timer;
  const markers = new Map();
  let userMarker = null, appliedNight, sky;
  let wind = null; // canvas wind overlay (air-lens-wind-layer.js), mounted once the map is ready
  const map = new gl.Map({
    container: el, style: 'https://tiles.openfreemap.org/styles/positron',
    center: [77.17, 28.64], zoom: mobile ? 9.7 : 10.45, pitch: mobile ? 30 : 48, bearing: -18,
    minZoom: 8, maxZoom: 18, maxPitch: lensFeature('sky') ? 75 : 65, maxBounds: [[76.55, 28.1], [77.8, 29.2]],
    canvasContextAttributes: { antialias: true }, attributionControl: { compact: true },
  });
  map.addControl(new gl.ScaleControl({ maxWidth: 90, unit: 'metric' }), 'bottom-left');
  const observer = new ResizeObserver(() => { if (!destroyed) map.resize(); });
  observer.observe(el);
  const stopOrbit = () => { orbiting = false; cancelAnimationFrame(frame); handlers.onOrbit(false); };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true; clearTimeout(timer); stopOrbit(); observer.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
    reduce.removeEventListener('change', onReduce);
    wind?.destroy();
    markers.forEach((m) => m.marker.remove()); userMarker?.remove(); map.remove();
  };
  const onVisibility = () => { if (document.hidden) { stopOrbit(); map.stop(); } };
  const onReduce = () => { if (reduce.matches) { stopOrbit(); map.stop(); } };
  document.addEventListener('visibilitychange', onVisibility);
  reduce.addEventListener('change', onReduce);
  signal.addEventListener('abort', destroy, { once: true });
  map.on('dragstart', stopOrbit);
  map.on('zoomstart', (event) => { if (event.originalEvent) stopOrbit(); });
  map.on('click', (event) => { if (getData().placing) handlers.onPin([event.lngLat.lng, event.lngLat.lat]); });
  map.on('move', () => { declutter(); handlers.onCamera({ bearing: map.getBearing(), zoom: map.getZoom(), pitch: map.getPitch() }); });
  map.getCanvas().addEventListener('webglcontextlost', () => handlers.onFailure(), { signal });

  try {
    await new Promise((resolve, reject) => {
      const abort = () => reject(new DOMException('Aborted', 'AbortError'));
      signal.addEventListener('abort', abort, { once: true });
      timer = setTimeout(() => reject(new Error('Map load timed out')), 18000);
      map.on('load', () => { signal.removeEventListener('abort', abort); clearTimeout(timer); resolve(); });
      // Individual tile failures should not tear down a usable map.
      map.on('error', () => { if (ready) handlers.onTileError(); });
    });
    signal.throwIfAborted();
    addBuildings(map);
    map.addSource('lens-evidence', { type: 'geojson', data: emptyGeoJSON() });
    map.addLayer({ id: 'lens-evidence-glow', type: 'line', source: 'lens-evidence', paint: { 'line-color': '#9ee4cf', 'line-width': 8, 'line-opacity': 0.09 } });
    map.addLayer({ id: 'lens-evidence-line', type: 'line', source: 'lens-evidence', paint: { 'line-color': '#9ee4cf', 'line-width': 1.5, 'line-opacity': 0.8, 'line-dasharray': [4, 3] } });
    map.addSource('lens-location', { type: 'geojson', data: emptyGeoJSON() });
    map.addLayer({ id: 'lens-location-line', type: 'line', source: 'lens-location', paint: { 'line-color': '#8dbefb', 'line-width': 2, 'line-dasharray': [2, 3] } });
    try { wind = mountWind(map, reduce); } catch { wind = null; } // wind is optional context; never block the map
    sky = lensFeature('sky') ? mountSky(map, reduce) : { apply() {} };
    ready = true;
  } catch (error) { destroy(); throw error; }

  function update() {
    if (destroyed || !ready) return;
    const d = getData();
    const restyled = appliedNight !== d.night;
    if (restyled) { styleMap(map, d.night); appliedNight = d.night; }
    sky.apply(d.look, restyled);
    el.classList.toggle('is-placing', d.placing);
    const ids = new Set(d.stations.map((s) => s.uid));
    for (const [uid, m] of markers) if (!ids.has(uid)) { m.marker.remove(); markers.delete(uid); }
    for (const s of d.stations.filter(validCoordinate)) {
      let m = markers.get(s.uid);
      if (!m) {
        const button = document.createElement('button'); button.type = 'button';
        button.addEventListener('click', (event) => { event.stopPropagation(); handlers.onSelect(s.uid); });
        const marker = new gl.Marker({ element: button, anchor: 'bottom' }).setLngLat([s.lon, s.lat]).addTo(map);
        m = { marker, button }; markers.set(s.uid, m);
      }
      const reading = d.readingFor?.(s) ?? stationReading(s, d.pollutant), selected = s.uid === d.current; // readingFor: 24 h replay
      m.button.classList.add('lens-marker');
      for (const status of ['fresh', 'stale', 'missing']) m.button.classList.toggle(status, reading.status === status);
      m.button.classList.toggle('historical', !!reading.historical);
      m.button.classList.toggle('selected', selected);
      m.button.style.setProperty('--reading', readingColor(reading.value));
      m.button.setAttribute('aria-pressed', String(selected));
      m.button.setAttribute('aria-label', d.markerLabel(s, reading));
      m.button.replaceChildren();
      const name = document.createElement('span'); name.className = 'lens-marker-name'; name.textContent = s.name;
      const badge = document.createElement('span'); badge.className = 'lens-marker-value'; badge.textContent = reading.value ?? '—';
      const stem = document.createElement('span'); stem.className = 'lens-marker-stem';
      m.button.append(name, badge, stem);
    }
    const selected = d.allStations.find((s) => s.uid === d.current);
    map.getSource('lens-evidence').setData(d.evidence ? evidenceGeoJSON(selected, d.card) : emptyGeoJSON());
    const line = emptyGeoJSON();
    if (d.pin) {
      if (!userMarker) {
        const dot = document.createElement('div'); dot.className = 'lens-user-pin';
        userMarker = new gl.Marker({ element: dot }).setLngLat(d.pin).addTo(map);
      }
      userMarker.setLngLat(d.pin);
      if (validCoordinate(selected)) line.features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [d.pin, [selected.lon, selected.lat]] } });
    } else { userMarker?.remove(); userMarker = null; }
    map.getSource('lens-location').setData(line);
    wind?.update(d.windOn, d.windField, d.night);
    declutter();
  }
  function declutter() {
    if (!ready || destroyed) return;
    const d = getData(), occupied = [];
    const inputs = new Set((d.card?.evidence?.neighbours || []).map((n) => n.uid));
    const ranked = [...markers].sort(([a], [b]) => (b === d.current ? 2 : inputs.has(b) ? 1 : 0) - (a === d.current ? 2 : inputs.has(a) ? 1 : 0));
    for (const [, m] of ranked) {
      const p = map.project(m.marker.getLngLat());
      const overlaps = occupied.some((other) => Math.abs(p.x - other.x) < 42 && Math.abs(p.y - other.y) < 36);
      m.button.style.visibility = overlaps ? 'hidden' : '';
      if (!overlaps) occupied.push(p);
    }
  }
  function move(options) { stopOrbit(); map.flyTo({ ...options, duration: reduce.matches ? 0 : 1700, essential: false }); }
  function focus(uid, close = false) {
    const s = getData().allStations.find((s) => s.uid === uid);
    if (validCoordinate(s)) move({ center: [s.lon, s.lat], zoom: close ? 15.8 : 11.7, pitch: close ? 62 : mobile ? 30 : 48, bearing: close ? -28 : map.getBearing() });
  }
  function city() {
    stopOrbit();
    const stations = getData().allStations.filter(validCoordinate);
    if (stations.length > 1) {
      const bounds = new gl.LngLatBounds(); stations.forEach((s) => bounds.extend([s.lon, s.lat]));
      map.fitBounds(bounds, { padding: { top: 125, bottom: 100, left: 65, right: 65 }, maxZoom: 11, pitch: mobile ? 25 : 45, bearing: -18, duration: reduce.matches ? 0 : 1400 });
    } else move({ center: [77.17, 28.64], zoom: 10.5, pitch: 45, bearing: -18 });
  }
  function orbit() {
    if (orbiting || reduce.matches) { stopOrbit(); return; }
    orbiting = true; prevTime = 0; handlers.onOrbit(true);
    const tick = (time) => {
      if (!orbiting || destroyed) return;
      if (prevTime) map.jumpTo({ bearing: map.getBearing() + Math.min(time - prevTime, 64) * 0.0025 });
      prevTime = time; frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
  }
  update();
  return { update, focus, city, orbit, stopOrbit, destroy, resize: () => map.resize(), sky: () => sky.apply(getData().look),
    flat: () => move({ pitch: 0, bearing: 0 }),
    zoom: (delta) => { stopOrbit(); map.zoomTo(map.getZoom() + delta, { duration: reduce.matches ? 0 : 350 }); },
    north: () => move({ bearing: 0 }),
    landmark: (coordinates) => move({ center: coordinates, zoom: 15.8, pitch: 62, bearing: -28 }),
  };
}
