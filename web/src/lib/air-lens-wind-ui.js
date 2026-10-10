// Air Lens wind: the page-facing pieces (loader singleton + small bilingual HTML snippets).
// All wording comes from WIND_WORDS / windHeadline in air-lens-wind.js, where it is tested.
import { state } from './store.js';
import { createWindLoader, sampleWind, windHeadline, windWord, modelTime, towardDegrees, OPEN_METEO_URL } from './air-lens-wind.js';

export const WIND_PREF = 'lensWind';
const session = (() => { try { return window.sessionStorage; } catch { return null; } })();
/** Resolves to the wind field or null (never rejects). ~30 min memory + sessionStorage cache. */
export const loadWind = createWindLoader({ storage: session });

const lang = () => (state.lang === 'hi' ? 'hi' : 'en');
const credit = (l) => `<a href="${OPEN_METEO_URL}" target="_blank" rel="noopener">${windWord('attribution', l)}</a>`;
const arrowSvg = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 14V2.5M3.8 6.7 8 2.5l4.2 4.2"/></svg>';

/** Station panel readout, e.g. "Wind from the north-west · 8 km/h", with the model label and credit. */
export function windLine(station, field) {
  const sample = field && station ? sampleWind(field, station.lon, station.lat) : null;
  if (!sample) return '';
  const l = lang(), time = modelTime(field.time, l);
  const directional = !sample.calm && sample.from != null;
  const arrow = directional
    ? `<i class="lens-wind-arrow" style="--toward:${Math.round(towardDegrees(sample.from))}deg" aria-hidden="true">${arrowSvg}</i>`
    : '<i class="lens-wind-arrow calm" aria-hidden="true"></i>';
  return `<div class="lens-wind-line">${arrow}<p><b>${windHeadline(sample, l)}</b><small>${windWord('model', l)}${time ? ` · ${time}` : ''} · ${windWord('context', l)}<br>${credit(l)}</small></p></div>`;
}

/** The layer toggle (copying the evidence checkbox), plus a key and credit while the layer is on. */
export function windControls(lens) {
  if (!lens.windField || lens.failed) return '';
  const l = lang(), time = modelTime(lens.windField.time, l);
  const key = lens.windOn ? `<span class="lens-wind-key"><i aria-hidden="true"></i>${windWord('key', l)}${time ? ` · ${time}` : ''} · ${credit(l)}</span>` : '';
  return `<div class="lens-wind-row">${key}<label class="lens-evidence-toggle lens-wind-toggle"><input id="lens-wind-toggle" type="checkbox" ${lens.windOn ? 'checked' : ''}>${windWord('toggle', l)}</label></div>`;
}

/** One honest sentence under the map while the layer is visible. */
export function windFootnote(lens) {
  return lens.windOn && lens.windField && !lens.failed ? `<p class="lens-footnote lens-wind-footnote">${windWord('footnote', lang())}</p>` : '';
}
