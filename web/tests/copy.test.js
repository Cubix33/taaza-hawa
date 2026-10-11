import { test } from 'node:test';
import assert from 'node:assert/strict';
import { T } from '../src/lib/i18n.js';

const strings = (lang) => Object.entries(T[lang]).flatMap(([k, v]) =>
  typeof v === 'function' ? [[k, String(v(1, 2, 3, 4, 5))]] : [[k, JSON.stringify(v)]]);

test('Hindi and English define the same copy keys', () => {
  assert.deepEqual(Object.keys(T.hi).sort(), Object.keys(T.en).sort());
});

test('the hero and problem copy speak to an adult deciding for themselves, not to sending children out', () => {
  for (const k of ['heroWhat', 'probText']) {
    assert.doesNotMatch(T.en[k], /kid|child/i, `en.${k}`);
    assert.doesNotMatch(T.hi[k], /बच्च/, `hi.${k}`);
  }
});

test('the estimate button is "Hold me to this" everywhere, with no trace of the old name', () => {
  assert.equal(T.en.hold, 'Hold me to this');
  assert.equal(T.hi.hold, 'हमारा अंदाज़ा परखिए');
  for (const [k, v] of strings('en')) assert.doesNotMatch(v, /Check it and tell me/i, `en.${k}`);
  for (const [k, v] of strings('hi')) assert.doesNotMatch(v, /जाँचकर बताओ/, `hi.${k}`);
});

test('a Wait answer says when to look again, for fresh and old numbers alike', () => {
  for (const lang of ['hi', 'en']) {
    const fresh = T[lang].waitNext(false), stale = T[lang].waitNext(true);
    assert.ok(fresh.length > 20 && stale.length > 20 && fresh !== stale, lang);
    assert.ok(T[lang].waitTrend.length > 20 && T[lang].waitHold.includes(T[lang].hold), lang);
  }
  assert.match(T.en.waitNext(false), /check again/i);
  assert.match(T.en.waitNext(true), /check again/i);
});

test('every verdict can carry the healthy-adults, not-medical-advice line', () => {
  assert.equal(T.en.healthyNote, 'Set for healthy adults. Not medical advice.');
  assert.match(T.hi.healthyNote, /स्वस्थ वयस्क/);
  assert.match(T.hi.healthyNote, /डॉक्टरी सलाह नहीं/);
});

test('Air Lens is translated to एयर लेंस in Hindi nav and copy', () => {
  assert.equal(T.hi.navStations, 'एयर लेंस');
  assert.equal(T.en.navStations, 'Air Lens');
  assert.equal(T.hi.mapCta, 'एयर लेंस खोलें');
  assert.equal(T.hi.ft.lens[0], 'एयर लेंस 3D नक्शा');
  for (const [k, v] of strings('hi')) {
    assert.doesNotMatch(v, /Air Lens/, `hi.${k} should not leave "Air Lens" in English`);
  }
});

