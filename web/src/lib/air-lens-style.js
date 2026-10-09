// Independently styled OpenFreeMap cartography. Buildings use the provider's
// render heights, never station values or fabricated pollution geometry.
export function styleMap(map, night) {
  const c = night
    ? { ground: '#15292c', land: '#1c3335', park: '#203e3d', water: '#346466', road: '#496061', major: '#71827c', label: '#a8bdb4', halo: '#162b2e', building: '#466365', edge: '#6c9391' }
    : { ground: '#e8e4d8', land: '#edeade', park: '#d3ddc8', water: '#91bdbe', road: '#ffffff', major: '#d4bd98', label: '#526866', halo: '#eeeade', building: '#b5c6be', edge: '#799c99' };
  for (const layer of map.getStyle().layers) {
    if (layer.id.startsWith('lens-')) continue;
    const id = layer.id.toLowerCase(), source = layer['source-layer'] || '';
    if (layer.type === 'background') map.setPaintProperty(layer.id, 'background-color', c.ground);
    if (layer.type === 'fill') {
      const color = source === 'water' ? c.water : /park|landcover/.test(source + id) ? c.park : /building/.test(source) ? c.building : c.land;
      map.setPaintProperty(layer.id, 'fill-color', color);
      if (source === 'building') map.setPaintProperty(layer.id, 'fill-opacity', 0.5);
    }
    if (layer.type === 'line') {
      const color = /water/.test(source) ? c.water : /motorway|trunk|primary/.test(id) ? c.major : c.road;
      map.setPaintProperty(layer.id, 'line-color', color);
      if (/boundary/.test(source)) map.setPaintProperty(layer.id, 'line-opacity', 0.25);
    }
    if (layer.type === 'symbol' && layer.layout?.['text-field']) {
      map.setPaintProperty(layer.id, 'text-color', c.label);
      map.setPaintProperty(layer.id, 'text-halo-color', c.halo);
      map.setPaintProperty(layer.id, 'text-halo-width', 1.5);
      if (/poi|housenumber|airport/.test(source + id)) map.setLayoutProperty(layer.id, 'visibility', 'none');
    }
  }
  if (map.getLayer('lens-buildings')) map.setPaintProperty('lens-buildings', 'fill-extrusion-color', c.building);
  map.setLight({ anchor: 'viewport', color: night ? '#bce5de' : '#fff7de', intensity: night ? 0.5 : 0.35, position: [1.5, 200, 35] });
}

export function addBuildings(map) {
  const source = Object.entries(map.getStyle().sources).find(([, s]) => s.type === 'vector')?.[0];
  if (!source) return;
  const before = map.getStyle().layers.find((l) => l.type === 'symbol')?.id;
  map.addLayer({ id: 'lens-buildings', type: 'fill-extrusion', source, 'source-layer': 'building', minzoom: 14,
    filter: ['!=', ['get', 'hide_3d'], true],
    paint: {
      'fill-extrusion-color': '#466365',
      'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 14, 0, 15.5, ['coalesce', ['get', 'render_height'], 0]],
      'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
      'fill-extrusion-opacity': 0.9,
    },
  }, before);
}
