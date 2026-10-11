import { state } from './store.js';
import { esc, ageText, icon } from './ui.js';
import { distanceKm } from './air-lens-data.js';
import { windLine } from './air-lens-wind-ui.js';
import { lensFeature } from './air-lens-features.js';

export const words = (en, hi) => state.lang === 'hi' ? hi : en;
export const pollutantName = (p) => p === 'pm25' ? 'PM₂.₅' : p === 'pm10' ? 'PM₁₀' : p || '—';
export const statusName = (s) => s === 'fresh' ? words('Fresh reading', 'ताज़ा रीडिंग') : s === 'stale' ? words('Old reading', 'पुरानी रीडिंग') : words('No reading', 'रीडिंग नहीं');

export function detailPanel(s, lens) {
  if (!s) return `<div class="lens-panel-empty"><span class="lens-overline">${words('AIR LENS', 'एयर लेंस')}</span><h2>${words('Finding Delhi’s stations…', 'दिल्ली के स्टेशन खोज रहे हैं…')}</h2></div>`;
  const c = lens.card, iv = c?.interval, loading = lens.loading;
  const neighbours = c?.evidence?.neighbours || [];
  const observed = c?.state === 'fresh';
  const title = observed ? words('Observed at this station', 'इस स्टेशन की रीडिंग') : iv ? words('Estimated at this station', 'इस स्टेशन का अंदाज़ा') : words('No current estimate', 'अभी अंदाज़ा उपलब्ध नहीं');
  const value = observed ? c.value : iv ? `${iv.lo}<span>–</span>${iv.hi}` : '—';
  const answer = c ? words(c.answer_en, c.answer_hi) : '';
  const distance = lens.pin ? distanceKm(lens.pin, [s.lon, s.lat]).toFixed(1) : null;
  return `<div class="lens-panel-top"><span class="lens-overline">${words('STATION IN FOCUS', 'चुना गया स्टेशन')}</span><span class="lens-panel-number">${String(state.stations.findIndex((x) => x.uid === s.uid) + 1).padStart(2, '0')}</span></div>
    <h2 class="lens-station-title">${esc(s.name)}</h2>
    <p class="lens-coordinates">${s.lat.toFixed(4)}° N &nbsp; ${s.lon.toFixed(4)}° E</p>
    ${distance ? `<p class="lens-distance">${icon.pin}<span>${distance} ${words('km from your pin · station air', 'किमी आपके पिन से · स्टेशन की हवा')}</span></p>` : ''}
    <div class="lens-reading ${loading ? 'is-loading' : ''}" aria-live="polite" aria-busy="${loading}">
      <div class="lens-reading-label"><i class="${observed ? 'fresh' : 'stale'}"></i>${loading ? words('Checking the evidence…', 'रीडिंग देख रहे हैं…') : title}</div>
      <div class="lens-reading-value">${loading ? '…' : value}</div>
      <div class="lens-reading-unit">${c ? `${pollutantName(c.pollutant)} ${words('sub-index · governing pollutant', 'उप-सूचकांक · प्रमुख प्रदूषक')}` : words('Station evidence', 'स्टेशन की जानकारी')}</div>
      ${iv ? `<div class="lens-range" aria-label="${esc(words(`Estimated range ${iv.lo} to ${iv.hi} on a 0 to 500 scale`, `अंदाज़ा ${iv.lo} से ${iv.hi}, पैमाना 0 से 500`))}"><div class="lens-range-track"><i style="left:${Math.max(0, iv.lo / 5)}%;width:${Math.max(0, (iv.hi - iv.lo) / 5)}%"></i><b style="left:${Math.min(100, Math.max(0, iv.point / 5))}%"></b></div><div class="lens-range-ticks"><span>0</span><span>${words('estimated range', 'अंदाज़े की सीमा')}</span><span>500</span></div></div>` : ''}
      ${lens.error ? `<p class="lens-error">${words('Couldn’t load this station’s evidence.', 'इस स्टेशन की जानकारी नहीं मिली।')} <button data-lens="retry-card">${words('Retry', 'फिर कोशिश करें')}</button></p>` : ''}
    </div>
    ${c ? `<div class="lens-answer"><span>${words('YOUR OUTDOOR CHECK', 'बाहर जाने से पहले')}</span><p>${esc(answer)}</p></div>
      <div class="lens-age-line">${icon.clock}<span>${c.age_min == null ? words('No station reading yet', 'स्टेशन की रीडिंग अभी नहीं मिली') : `${words('Last reading', 'आख़िरी रीडिंग')} <b>${ageText(c.age_min)} ${words('ago', 'पहले')}</b>`}${c.last_value != null ? ` · ${c.last_value}` : ''}</span></div>` : ''}
    ${lensFeature('wind') ? windLine(s, lens.windField) : ''}
    ${iv ? `<section class="lens-evidence"><div class="lens-evidence-heading"><h3>${words('Behind the estimate', 'अंदाज़ा कैसे बना')}</h3><span>${String(neighbours.length).padStart(2, '0')}</span></div>
      ${neighbours.length ? `<p>${words('These readings inform the range.', 'इन रीडिंग से यह सीमा बनी है।')}</p><ul>${neighbours.map((n) => `<li><button data-evidence-station="${n.uid}"><i></i><span><b>${esc(n.name)}</b><small>${ageText(n.age_min)} · ${Number(n.distance_km).toFixed(1)} km</small></span><strong>${Math.round(n.value)}</strong></button></li>`).join('')}</ul>` : `<p>${iv.degraded ? words('Only the old reading is available. This is a degraded estimate.', 'सिर्फ़ पुरानी रीडिंग उपलब्ध है। यह सीमित अंदाज़ा है।') : words('Input locations were not included by this server.', 'सर्वर ने इस्तेमाल हुए स्टेशनों के स्थान नहीं भेजे।')}</p>`}
      ${iv.used_cams ? `<p class="lens-model">+ CAMS · ${words('regional model input', 'क्षेत्रीय मॉडल')}</p>` : ''}
      ${!iv.calibrated ? `<p class="lens-warming">${words('Calibration warming up · range is not a coverage guarantee.', 'कैलिब्रेशन जारी है · सीमा कोई गारंटी नहीं।')}</p>` : ''}
    </section>` : observed ? `<p class="lens-direct-note">${words('A fresh station reading. No neighbour estimate is needed.', 'ताज़ा स्टेशन रीडिंग। पड़ोसी स्टेशनों से अंदाज़े की ज़रूरत नहीं।')}</p>` : ''}
    <a class="lens-check-link" href="#/check?s=${s.uid}">${words(iv ? 'Check this estimate' : 'Open my air check', iv ? 'इस अंदाज़े को परखें' : 'अपनी हवा देखें')}${icon.arrow}</a>
    <p class="lens-source">${esc(c?.source || s.source || 'WAQI')}<br>${words('Station air, not a street-level measurement.', 'स्टेशन की हवा, आपकी गली का माप नहीं।')}</p>`;
}
