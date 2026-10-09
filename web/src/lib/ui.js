// Shared formatting, AQI bands, icons and the gauge.
import { state } from "./store.js";
import { t, hi, T } from "./i18n.js";

export const STALE_MIN = 180;
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function ageText(min, lang = state.lang) {
  const h_ = lang === "hi";
  if (min == null) return "—";
  if (min < 60) return `${min} ${h_ ? "मिनट" : "min"}`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} ${h_ ? "घंटे" : "h"}`;
  return `${Math.floor(h / 24)} ${h_ ? "दिन" : "days"}`;
}
export const isOld = (s) => s.age_min == null || s.age_min > STALE_MIN;

// CPCB AQI bands: colour is data, never decoration
export const BAND_STOPS = [50, 100, 200, 300, 400, 500];
export const BAND_COLORS = ["var(--b0)", "var(--b1)", "var(--b2)", "var(--b3)", "var(--b4)", "var(--b5)"];
const BAND_NAMES = {
  hi: ["अच्छी", "संतोषजनक", "मध्यम", "खराब", "बहुत खराब", "गंभीर"],
  en: ["Good", "Satisfactory", "Moderate", "Poor", "Very poor", "Severe"],
};
export const bandIdx = (v) => { const i = BAND_STOPS.findIndex((u) => v <= u); return i < 0 ? 5 : i; };
export const bandName = (v) => BAND_NAMES[state.lang][bandIdx(v)];
export const bandNames = () => BAND_NAMES[state.lang];
export const bandColor = (v) => (v == null ? "var(--muted)" : BAND_COLORS[bandIdx(v)]);

export const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b), m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};

export const icon = {
  pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9.5" r="2.4" fill="currentColor"/></svg>`,
  chev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  target: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-6.5 8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  gauge: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17a8 8 0 1 1 16 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M12 17l4-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="17" r="1.6" fill="currentColor"/></svg>`,
  map: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="7" r="2" fill="currentColor"/><circle cx="17" cy="6" r="2" fill="currentColor"/><circle cx="12" cy="13" r="2" fill="currentColor"/><circle cx="7" cy="18" r="2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="17" r="2" fill="currentColor"/></svg>`,
  record: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M8 12l2.5 2.5L16 9" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  school: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18M5 20v-8.5L12 7l7 4.5V20M12 7V3.5h4.5v2.2H12M10 20v-4.5h4V20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`,
  print: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V4h10v5M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v6H7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  wa: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 19.5l1.2-3.6A8 8 0 1 1 9 19z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9 9.2c.2 2.4 2.4 4.6 4.8 4.8l1-1.3-1.8-.9-.7.7c-.8-.4-1.4-1-1.8-1.8l.7-.7-.9-1.8z" fill="currentColor"/></svg>`,
  speaker: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5z" fill="currentColor"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  stop: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/></svg>`,
  logo: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 13h15a4 4 0 1 0-4-4M5 19h19a4.5 4.5 0 1 1-4.5 4.5M5 25h9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>`,
};

// ---------- fires around Delhi (NASA FIRMS): a count with its wind, never a cause ----------
export const compassName = (deg, lang = state.lang) => T[lang].compass[Math.round(deg / 45) % 8];

export function fireText(f, lang = state.lang) {
  const L = T[lang];
  let s = L.fireCount(f.total, f.radius_km || 500, f.window_h || 48);
  if (f.total) s += " " + (f.upwind == null ? L.fireCalm : L.fireUp(f.upwind, compassName(f.wind_from, lang)));
  return s;
}

export function fireView(f) {
  if (!f) return "";
  return `<section class="panel fires"><p class="fires-t"><b>${t("fireTitle")}</b></p>
    <p>${fireText(f)}</p><p class="muted small">${t("fireNote")}</p>
    ${f.source ? `<p class="fires-src">${esc(f.source)}</p>` : ""}</section>`;
}

// ---------- the gauge: CPCB bands on a half-dial, an estimate drawn as an arc ----------
const CX = 120, CY = 118, R = 96;
const pt = (v, r = R) => {
  const a = Math.PI * (1 - Math.max(0, Math.min(500, v)) / 500);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};
const arc = (v1, v2, r = R) => {
  const [x1, y1] = pt(v1, r), [x2, y2] = pt(v2, r);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

export function gauge(c) {
  const iv = c.interval;
  let prev = 0;
  const segs = BAND_STOPS.map((u, i) => {
    const p = `<path d="${arc(prev + 2.2, u - 2.2)}" stroke="${BAND_COLORS[i]}" stroke-width="10" fill="none"/>`;
    prev = u;
    return p;
  }).join("");
  let over = "", centre = "", sub = "";
  if (iv) {
    over = `<path d="${arc(iv.lo, Math.max(iv.hi, iv.lo + 2), R + 14)}" class="g-range" fill="none" stroke-linecap="round"/>`;
    centre = `${iv.lo}<tspan class="g-dash">–</tspan>${iv.hi}`;
    sub = t("aqiGuess");
  } else if (c.value != null) {
    const [px, py] = pt(c.value, R + 14);
    over = `<circle cx="${px}" cy="${py}" r="7" class="g-dot"/><circle cx="${px}" cy="${py}" r="13" class="g-halo"/>`;
    centre = `${c.value}`;
    sub = "AQI";
  }
  return `<svg class="gauge" viewBox="0 0 240 132" role="img" aria-label="${esc(sub)} ${esc(iv ? `${iv.lo}-${iv.hi}` : c.value ?? "")}">
    ${segs}${over}
    <text x="${CX}" y="${CY - 22}" class="g-num" text-anchor="middle">${centre}</text>
    <text x="${CX}" y="${CY - 2}" class="g-sub" text-anchor="middle">${esc(sub)}</text>
    <text x="${CX - R}" y="${CY + 14}" class="g-tick" text-anchor="middle">0</text>
    <text x="${CX + R}" y="${CY + 14}" class="g-tick" text-anchor="middle">500</text>
  </svg>`;
}

export function scale(v) {
  const cur = v == null ? -1 : bandIdx(v);
  let lo = 0;
  return `<div class="scale">
    <p class="scale-t">${t("scaleTitle")}</p>
    <ol>${BAND_STOPS.map((u, i) => {
      const li = `<li class="${i === cur ? "cur" : ""}"><i style="background:${BAND_COLORS[i]}"></i><b>${bandNames()[i]}</b><small>${lo === 0 ? 0 : lo + 1}–${u}${u === 500 ? "+" : ""}</small></li>`;
      lo = u;
      return li;
    }).join("")}</ol></div>`;
}

// Delhi station map: equirectangular projection of real coordinates, no tiles needed
export function stationMap(stations, { current, compact = false } = {}) {
  const pts = stations.filter((s) => s.lat && s.lon);
  if (!pts.length) return "";
  const W = 640, H = compact ? 420 : 560, pad = 40;
  const lat0 = (Math.min(...pts.map((s) => s.lat)) + Math.max(...pts.map((s) => s.lat))) / 2;
  const kx = Math.cos((lat0 * Math.PI) / 180);
  const xs = pts.map((s) => s.lon * kx), ys = pts.map((s) => s.lat);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const sc = Math.min((W - 2 * pad) / (x1 - x0 || 1), (H - 2 * pad) / (y1 - y0 || 1));
  const ox = (W - (x1 - x0) * sc) / 2, oy = (H - (y1 - y0) * sc) / 2;
  const P = (s) => [ox + (s.lon * kx - x0) * sc, H - (oy + (s.lat - y0) * sc)];
  const km5 = (5 / 111) * sc; // 5 km in px (1 degree ~ 111 km after the cos correction)
  const grid = [];
  for (let i = 1; i < 6; i++) grid.push(`<line x1="${(W / 6) * i}" y1="0" x2="${(W / 6) * i}" y2="${H}"/><line x1="0" y1="${(H / 5) * i}" x2="${W}" y2="${(H / 5) * i}"/>`);
  const dots = pts.map((s) => {
    const [x, y] = P(s), old = isOld(s), col = bandColor(s.aqi), cur = s.uid === current;
    const tip = `${s.name} · ${s.aqi != null ? `AQI ${s.aqi}` : "—"} · ${ageText(s.age_min)}`;
    return `<a href="#/check?s=${s.uid}" class="m-pt ${old ? "old" : ""} ${cur ? "cur" : ""}" aria-label="${esc(tip)}">
      <title>${esc(tip)}</title>
      ${old ? `<circle cx="${x}" cy="${y}" r="13" class="m-ring"/>` : `<circle cx="${x}" cy="${y}" r="16" fill="${col}" opacity=".16"/>`}
      <circle cx="${x}" cy="${y}" r="${cur ? 9 : 7}" fill="${old ? "var(--surface)" : col}" stroke="${old ? col : "var(--surface)"}" stroke-width="${old ? 3 : 2}"/>
      ${cur || (!compact && old) ? `<text x="${x > W * 0.62 ? x - 14 : x + 14}" y="${y + 4}" text-anchor="${x > W * 0.62 ? "end" : "start"}" class="m-lbl">${esc(s.name)}${old ? ` · ${ageText(s.age_min)}` : ""}</text>` : ""}
    </a>`;
  }).join("");
  return `<svg class="smap" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("mapAria"))}">
    <g class="m-grid">${grid.join("")}</g>
    <g class="m-compass" transform="translate(${W - 34},34)"><circle r="16"/><path d="M0 -10 L5 4 L0 1 L-5 4Z"/><text y="-20" text-anchor="middle">N</text></g>
    <g class="m-scale" transform="translate(24,${H - 22})"><line x1="0" y1="0" x2="${km5}" y2="0"/><line x1="0" y1="-4" x2="0" y2="4"/><line x1="${km5}" y1="-4" x2="${km5}" y2="4"/><text x="${km5 / 2}" y="-8" text-anchor="middle">5 km</text></g>
    ${dots}
  </svg>`;
}

// "How old is every reading": one bar per station, height on a log scale of age, a 3-hour line.
// The product's whole idea in one picture.
export function ageChart(stations) {
  const pts = stations.filter((s) => s.age_min != null).sort((a, b) => b.age_min - a.age_min);
  if (!pts.length) return "";
  const n = pts.length, bw = Math.max(18, Math.min(44, 980 / n)), gap = Math.round(bw * 0.28);
  const W = n * (bw + gap) + 70, H = 260, base = 214, top = 26;
  const maxMin = Math.max(72 * 60, pts[0].age_min);
  const y = (m) => base - (base - top) * (Math.log1p(m) / Math.log1p(maxMin));
  const ticks = [[10, "10m"], [60, "1h"], [180, t("threeH")], [24 * 60, "24h"], [72 * 60, "72h"]];
  const bars = pts.map((s, i) => {
    const x = 56 + i * (bw + gap), yy = y(s.age_min), old = isOld(s);
    const tip = `${s.name} · ${ageText(s.age_min)}${s.aqi != null ? ` · AQI ${s.aqi}` : ""}`;
    return `<a href="#/check?s=${s.uid}" class="ab ${old ? "old" : ""}" aria-label="${esc(tip)}"><title>${esc(tip)}</title>
      <rect x="${x}" y="${yy}" width="${bw}" height="${base - yy}" rx="${Math.min(6, bw / 3)}"/>
      ${old && i < 3 ? `<text x="${x + bw / 2}" y="${yy - 8}" text-anchor="middle" class="ab-l">${esc(ageText(s.age_min))}</text>` : ""}
    </a>`;
  }).join("");
  const oldest = pts.filter(isOld).slice(0, 3).map((s) => `<a href="#/check?s=${s.uid}"><b>${esc(s.name)}</b> ${ageText(s.age_min)}</a>`).join("");
  return `<div class="ac-scroll"><svg class="agechart" viewBox="0 0 ${W} ${H}" style="min-width:${Math.min(W, 640)}px" role="img" aria-label="${esc(t("ageTitle"))}">
    ${ticks.map(([m, l]) => `<g class="ac-tick ${m === 180 ? "line3" : ""}"><line x1="48" x2="${W}" y1="${y(m)}" y2="${y(m)}"/><text x="42" y="${y(m) + 4}" text-anchor="end">${l}</text></g>`).join("")}
    ${bars}
    <line x1="48" x2="${W}" y1="${base}" y2="${base}" class="ac-base"/>
  </svg></div>
  ${oldest ? `<p class="ac-oldest"><span>${hi() ? "सबसे पुरानी:" : "Oldest:"}</span>${oldest}</p>` : ""}`;
}
