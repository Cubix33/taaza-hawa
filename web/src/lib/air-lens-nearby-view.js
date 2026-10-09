// "Cleaner air near you" section for Air Lens. Ranking lives in air-lens-nearby.js (pure, tested).
import { esc, ageText } from './ui.js';
import { readingColor } from './air-lens-data.js';
import { words as w, pollutantName } from './air-lens-panel.js';
import { rankNearby, shortName, otherPollutant, NEARBY } from './air-lens-nearby.js';

const km = (d) => (d < 0.1 ? '<0.1' : d.toFixed(1));
const name = (row) => esc(shortName(row.station.name));
const kmWord = () => w('km', 'किमी');
const kmHtml = (d) => `${esc(km(d))}&nbsp;${kmWord()}`; // keep "2.0 km" on one line

function heading() {
  return `<div class="lens-nearby-title"><span class="lens-overline">${w('NEAR YOUR PIN', 'आपके पिन के पास')}</span><h2 id="lens-nearby-title">${w('Cleaner air near you.', 'आस-पास कम प्रदूषण वाले स्टेशन।')}</h2></div>`;
}

function summary(r, p) {
  const P = pollutantName(p), O = pollutantName(otherPollutant(p)), radius = r.radiusKm;
  const n = r.nearest, b = r.best, c = r.comparison;
  if (c.kind === 'none' || c.kind === 'invalid' || !n) return w(`No fresh ${P} readings within ${radius} km of your pin. Try ${O}, or choose a station below.`, `आपके पिन के ${radius} किमी में कोई ताज़ा ${P} रीडिंग नहीं। ${O} देखें या नीचे स्टेशन चुनें।`);
  const base = r.nearestIsClosest ? w('your nearest station', 'आपके सबसे पास के स्टेशन') : w('the nearest fresh station', 'सबसे पास के ताज़ा स्टेशन');
  const nearHtml = `<b>${name(n)}</b> (${kmHtml(n.distance)})`;
  if (c.kind === 'only') return w(`Only one fresh ${P} reading within ${radius} km: ${nearHtml}.`, `${radius} किमी में केवल एक ताज़ा ${P} रीडिंग है: ${nearHtml}।`);
  if (c.kind === 'nearest-lowest') return w(`${base[0].toUpperCase() + base.slice(1)}, ${nearHtml}, has the lowest fresh ${P} reading within ${radius} km.`, `${base} ${nearHtml} पर ही ${radius} किमी में सबसे कम ताज़ा ${P} रीडिंग है।`);
  if (c.kind === 'similar') return w(`Fresh ${P} readings within ${radius} km are close to ${base}, ${nearHtml}. No station nearby reads clearly lower.`, `${radius} किमी में ताज़ा ${P} रीडिंग ${base} ${nearHtml} जैसी ही हैं। कोई स्टेशन साफ़ तौर पर कम नहीं।`);
  const caveat = c.otherHigher ? w(` Its ${O} reads higher, though, and the overall AQI follows the worse of the two.`, ` पर वहाँ ${O} ज़्यादा है, और कुल AQI दोनों में से ज़्यादा वाले से तय होता है।`) : '';
  return w(`<b>${name(b)}</b>, ${kmHtml(b.distance)} from your pin, reads <b>${c.difference} lower</b> on ${P} than ${base}, ${nearHtml}.`, `<b>${name(b)}</b> (आपके पिन से ${kmHtml(b.distance)}) पर ${P} ${base} ${nearHtml} से <b>${c.difference} कम</b> है।`) + caveat;
}

function rowHtml(row, p, current, nearestIsClosest) {
  const P = pollutantName(p), O = pollutantName(otherPollutant(p));
  const tag = row.isNearest ? (nearestIsClosest ? w('Nearest', 'सबसे पास') : w('Nearest fresh', 'सबसे पास ताज़ा'))
    : row.delta < 0 ? w(`${-row.delta} lower than nearest`, `सबसे पास वाले से ${-row.delta} कम`)
      : row.delta > 0 ? w(`${row.delta} higher than nearest`, `सबसे पास वाले से ${row.delta} ज़्यादा`) : w('Same as nearest', 'सबसे पास वाले जितना');
  const other = row.other == null ? '' : ` · ${O} ${row.other}`;
  const label = `${shortName(row.station.name)}, ${P} ${row.value}, ${tag}, ${km(row.distance)} ${kmWord()} ${w('from your pin', 'आपके पिन से')}${row.other == null ? '' : `, ${O} ${row.other}`}. ${w('Show on map', 'नक्शे पर दिखाएँ')}`;
  const selected = row.uid === current;
  return `<li><button type="button" class="lens-nearby-row ${selected ? 'selected' : ''} ${row.isNearest ? 'is-nearest' : ''}" data-nearby-station="${esc(row.uid)}" ${selected ? 'aria-current="true"' : ''} aria-label="${esc(label)}">
    <span class="lens-nearby-rank" aria-hidden="true">${String(row.rank).padStart(2, '0')}</span>
    <span class="lens-list-value fresh" style="--reading:${readingColor(row.value)}">${row.value}</span>
    <span class="lens-nearby-name"><b>${name(row)}</b><small>${kmHtml(row.distance)}${other} ·${ageText(row.station.age_min)}</small></span>
    <span class="lens-nearby-tag ${row.isNearest ? 'nearest' : row.delta < 0 ? 'lower' : ''}">${tag}</span>
  </button></li>`;
}

export function nearbySection(pin, stations, pollutant, current) {
  const note = `<p class="lens-nearby-note">${w('Station readings, not the air on your street, and not a route suggestion.', 'ये स्टेशन की रीडिंग हैं, आपकी गली की हवा नहीं, और न ही रास्ते की सलाह।')}</p>`;
  if (!pin) {
    return `<section class="lens-nearby is-empty" aria-labelledby="lens-nearby-title">${heading()}<p class="lens-nearby-prompt">${w('Use your location or drop a pin above to compare fresh station readings around you.', 'ऊपर ‘मेरा स्थान’ या ‘पिन रखें’ चुनें, फिर आस-पास के ताज़ा स्टेशनों की तुलना देखें।')}</p></section>`;
  }
  const r = rankNearby(pin, stations, pollutant);
  const P = pollutantName(pollutant), O = pollutantName(otherPollutant(pollutant));
  const scope = r.widened
    ? w(`Fewer than ${NEARBY.minStations} fresh stations within ${NEARBY.radiusKm} km, so this looks out to ${r.radiusKm} km.`, `${NEARBY.radiusKm} किमी में ${NEARBY.minStations} से कम ताज़ा स्टेशन थे, इसलिए ${r.radiusKm} किमी तक देखा।`)
    : w(`Fresh readings within ${r.radiusKm} km.`, `${r.radiusKm} किमी के भीतर ताज़ा रीडिंग।`);
  const foot = `${w(`Ranked by ${P} sub-index, lowest first. ${scope} The overall AQI follows the worst sub-index, so ${O} is shown too.`, `${P} उप-सूचकांक के क्रम में, सबसे कम पहले। ${scope} कुल AQI सबसे ज़्यादा उप-सूचकांक से तय होता है, इसलिए ${O} भी दिखाया है।`)}`;
  return `<section class="lens-nearby" aria-labelledby="lens-nearby-title">
    <div class="lens-nearby-copy">${heading()}<p class="lens-nearby-summary">${summary(r, pollutant)}</p>${note}</div>
    <div class="lens-nearby-results">${r.rows.length ? `<ol class="lens-nearby-list" id="lens-nearby-list">${r.rows.map((row) => rowHtml(row, pollutant, current, r.nearestIsClosest)).join('')}</ol>` : ''}<p class="lens-nearby-foot">${foot}</p></div></section>`;
}

// The list sits below the map; after a pointer/touch selection, bring the map back so the fly-to
// is visible. Keyboard activation (event.detail === 0) keeps the focused row on screen instead.
export function revealStage() {
  const stage = document.querySelector('.lens-stage'); if (!stage) return;
  const r = stage.getBoundingClientRect();
  const shown = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
  if (shown < 0.35 * Math.min(r.height, innerHeight)) stage.scrollIntoView({ block: 'start' });
}
