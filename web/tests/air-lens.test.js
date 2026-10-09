import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stationReading, evidenceGeoJSON, nearestStation, validCoordinate } from '../src/lib/air-lens-data.js';

test('map values never substitute the governing AQI for a missing pollutant', () => {
  assert.equal(stationReading({ aqi: 250, values: { pm10: 250 }, age_min: 5 }, 'pm25').status, 'missing');
  assert.deepEqual(stationReading({ values: { pm25: 0 }, age_min: 0 }, 'pm25'), { value: 0, status: 'fresh' });
  assert.equal(stationReading({ values: { pm25: 90 }, age_min: 181 }, 'pm25').status, 'stale');
  assert.equal(stationReading({ values: { pm25: 90 }, age_min: null }, 'pm25').status, 'missing');
});

test('evidence lines use only returned coordinates and never infer links from names', () => {
  const station = { uid: 1, lat: 28.6, lon: 77.2 };
  assert.equal(evidenceGeoJSON(station, { interval: { neighbours: ['Pusa'] } }).features.length, 0);
  const geo = evidenceGeoJSON(station, { evidence: { neighbours: [{ uid: 2, lat: 28.7, lon: 77.3 }, { uid: 3, lat: null, lon: 77 }] } });
  assert.equal(geo.features.length, 1);
  assert.deepEqual(geo.features[0].geometry.coordinates, [[77.2, 28.6], [77.3, 28.7]]);
});

test('nearest station ignores invalid coordinates and reports geographic distance', () => {
  assert.equal(validCoordinate({ lat: null, lon: 77 }), false);
  assert.equal(validCoordinate({ lat: 91, lon: 77 }), false);
  const nearest = nearestStation([77.2, 28.6], [{ uid: 0, lat: null, lon: 77.2 }, { uid: 1, lat: 28.61, lon: 77.2 }, { uid: 2, lat: 28.7, lon: 77.2 }]);
  assert.equal(nearest.station.uid, 1);
  assert.ok(nearest.distance > 1 && nearest.distance < 1.2);
  assert.equal(nearestStation([77, 28], []), null);
});
