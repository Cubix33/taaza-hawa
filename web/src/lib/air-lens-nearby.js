// "Cleaner air near me": pure ranking of fresh station readings around a pin.
// Station air only. Values are sub-indices whose scale may change server-side
// (WAQI US-EPA today, CPCB soon), so comparisons are relative and scale-free.
import { stationReading, distanceKm, validCoordinate, nearestStation } from './air-lens-data.js';

export const NEARBY = Object.freeze({ radiusKm: 8, widerKm: 15, minStations: 3, limit: 5, similarShare: 0.1 });

export const validPoint = (p) => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[0]) <= 180 && Math.abs(p[1]) <= 90;
export const otherPollutant = (p) => (p === 'pm10' ? 'pm25' : 'pm10');
// "Pusa, Delhi, Delhi, India" -> "Pusa"; keeps locality parts such as "Sector 8, Dwarka".
export const shortName = (name) => String(name ?? '').replace(/(,\s*(New\s+)?Delhi)*,\s*India\s*$/i, '').trim() || String(name ?? '');

/**
 * Rank fresh stations around `point` ([lon, lat]) by the chosen pollutant, lowest first.
 * Radius: `radiusKm`, widened to `widerKm` when fewer than `minStations` qualify.
 * Ties on value are broken by distance (then name, then uid, for a stable order).
 * `nearest` is the closest fresh station: the honest baseline for "lower than".
 */
export function rankNearby(point, stations, pollutant, options = {}) {
  const o = { ...NEARBY, ...options };
  const result = { radiusKm: o.radiusKm, widened: false, total: 0, rows: [], nearest: null, best: null, comparison: { kind: 'none' } };
  if (!validPoint(point) || !Array.isArray(stations)) return { ...result, comparison: { kind: 'invalid' } };
  const other = otherPollutant(pollutant);
  const fresh = [];
  for (const station of stations) {
    if (!validCoordinate(station)) continue;
    const reading = stationReading(station, pollutant);
    if (reading.status !== 'fresh') continue;
    const distance = distanceKm(point, [station.lon, station.lat]);
    if (!Number.isFinite(distance)) continue;
    const second = stationReading(station, other);
    fresh.push({ station, uid: station.uid, value: reading.value, distance, other: second.status === 'missing' ? null : second.value });
  }
  let pool = fresh.filter((c) => c.distance <= o.radiusKm);
  if (pool.length < o.minStations && o.widerKm > o.radiusKm) {
    result.widened = true; result.radiusKm = o.widerKm;
    pool = fresh.filter((c) => c.distance <= o.widerKm);
  }
  pool.sort((a, b) => a.value - b.value || a.distance - b.distance || String(a.station.name).localeCompare(String(b.station.name)) || String(a.uid).localeCompare(String(b.uid)));
  result.total = pool.length;
  if (!pool.length) return result;

  // First minimum in sorted order, so a different `best` always reads strictly lower.
  const nearest = pool.reduce((best, c) => (c.distance < best.distance ? c : best), pool[0]);
  const closest = nearestStation(point, stations);
  const rank = (c) => pool.indexOf(c) + 1;
  const decorate = (c) => ({ ...c, rank: rank(c), delta: c.value - nearest.value, isNearest: c === nearest });
  const top = pool.slice(0, Math.max(1, o.limit));
  // Always show the baseline the sentence refers to, even if it ranks lower.
  if (!top.includes(nearest)) { if (top.length > 1) top.pop(); top.push(nearest); }
  result.rows = top.map(decorate);
  result.nearest = decorate(nearest);
  result.best = decorate(pool[0]);
  result.nearestIsClosest = closest?.station?.uid === nearest.uid;

  const best = pool[0], difference = nearest.value - best.value;
  if (pool.length === 1) result.comparison = { kind: 'only' };
  else if (best === nearest) result.comparison = { kind: 'nearest-lowest' };
  else if (difference < o.similarShare * nearest.value) result.comparison = { kind: 'similar', difference };
  else result.comparison = { kind: 'lower', difference, otherHigher: best.other != null && nearest.other != null && best.other > nearest.other };
  return result;
}
