// Pure data adapters. A basemap is context; only API evidence may create an input link.
export const emptyGeoJSON = () => ({ type: 'FeatureCollection', features: [] });
export const validCoordinate = (s) => Number.isFinite(s?.lat) && Number.isFinite(s?.lon) && Math.abs(s.lat) <= 90 && Math.abs(s.lon) <= 180;
export function stationReading(station, pollutant) {
  const value = station.values?.[pollutant];
  if (!Number.isFinite(value) || value < 0 || !Number.isFinite(station.age_min)) return { value: null, status: 'missing' };
  return { value: Math.round(value), status: station.age_min > 180 ? 'stale' : 'fresh' };
}
export function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const v = Math.sin((b[1] - a[1]) * rad / 2) ** 2 + Math.cos(a[1] * rad) * Math.cos(b[1] * rad) * Math.sin((b[0] - a[0]) * rad / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(Math.min(1, v)));
}
export function nearestStation(point, stations) {
  return stations.filter(validCoordinate).reduce((best, station) => {
    const distance = distanceKm(point, [station.lon, station.lat]);
    return !best || distance < best.distance ? { station, distance } : best;
  }, null);
}
export function evidenceGeoJSON(station, card) {
  if (!validCoordinate(station)) return emptyGeoJSON();
  return { type: 'FeatureCollection', features: (card?.evidence?.neighbours || []).filter(validCoordinate).map((n) => ({
    type: 'Feature', properties: { uid: n.uid },
    geometry: { type: 'LineString', coordinates: [[station.lon, station.lat], [n.lon, n.lat]] },
  })) };
}
export const readingColor = (value) => value == null ? '#939c9b' : ['#76bd94', '#b4cf7a', '#eacb79', '#f0a278', '#ee7e78', '#ce86ab'][[50, 100, 200, 300, 400, Infinity].findIndex((n) => value <= n)];
