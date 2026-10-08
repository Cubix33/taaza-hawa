import { state } from "../lib/store.js";
import { t, hi } from "../lib/i18n.js";
import { esc, ageText, isOld, icon, median, bandName, bandColor, stationMap } from "../lib/ui.js";
import { run, loadCard, loadBoard } from "../lib/actions.js";
import { startSky } from "../lib/sky.js";

export function load() {
  return run(loadCard, loadBoard);
}

function stats() {
  const st = state.stations;
  const fresh = st.filter((s) => !isOld(s));
  const oldest = [...st].filter((s) => s.age_min != null).sort((a, b) => b.age_min - a.age_min)[0];
  const city = median(fresh.map((s) => s.aqi).filter((v) => v != null));
  const k = state.board?.tally;
  const graded = k ? k.HIT + k.MISSED + k.MISSED_WAITING : 0;
  return { fresh: fresh.length, total: st.length, oldest, city, rate: graded >= 5 ? Math.round((k.HIT / graded) * 100) : null, pending: k?.PENDING ?? 0 };
}

function preview() {
  const c = state.card;
  if (!c) return `<div class="pv glass sk"><div class="sk-l w40"></div><div class="sk-l w70 big"></div><div class="sk-l w90"></div></div>`;
  const stale = c.state !== "fresh";
  const v = c.interval ? `${c.interval.lo}–${c.interval.hi}` : c.value;
  const col = bandColor(c.interval ? c.interval.hi : c.value);
  return `<a class="pv glass a-${c.answer}" href="#/check?s=${c.uid}">
    <div class="pv-top"><span class="pv-st">${icon.pin}${esc(c.name)}</span>
      <span class="pill ${stale ? "pill-stale" : "pill-fresh"}"><i></i>${stale ? t("stale") : t("fresh")} · ${ageText(c.age_min)}</span></div>
    <p class="pv-q">${esc(hi() ? c.question_hi : c.question_en)}</p>
    <p class="pv-ans">${esc(hi() ? c.answer_hi : c.answer_en)}</p>
    ${v != null ? `<div class="pv-aqi"><i style="background:${col}"></i><b>AQI ${v}</b><span>${c.interval ? t("aqiGuess") : esc(bandName(c.value))}</span></div>` : ""}
    <span class="pv-go">${t("previewSee")} ${icon.arrow}</span>
  </a>`;
}

const STEP_ART = [
  `<svg viewBox="0 0 120 90" aria-hidden="true"><rect x="14" y="18" width="92" height="56" rx="12" class="a-card"/><text x="30" y="52" class="a-big">218</text><rect x="70" y="30" width="28" height="14" rx="7" class="a-pill"/><circle cx="77" cy="37" r="2.4" class="a-dot"/><text x="82" y="40.5" class="a-pt">31h</text></svg>`,
  `<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M22 72a38 38 0 0 1 76 0" class="a-track"/><path d="M47 38.5a38 38 0 0 1 30 -1" class="a-range"/><text x="60" y="70" text-anchor="middle" class="a-big s">232–266</text></svg>`,
  `<svg viewBox="0 0 120 90" aria-hidden="true"><circle cx="60" cy="45" r="27" class="a-stamp"/><path d="M47 45.5l9 9 18-18" class="a-tick"/></svg>`,
];

export function view() {
  const s = stats();
  const k = state.board?.tally;
  const recent = state.board?.recent_holds?.[0];
  return `
  <section class="home-hero">
    <canvas id="sky" aria-hidden="true"></canvas>
    <div class="hh-glow" aria-hidden="true"></div>
    <div class="wrap hh-in">
      <div class="hh-text">
        <p class="eyebrow on-dark"><span class="live"></span>${t("eyebrow")}</p>
        <h1 class="hh-title">${t("heroTitle")}</h1>
        <p class="hh-lead">${t("heroLead")}</p>
        <div class="hh-cta">
          <a class="btn cta" href="#/check">${t("ctaCheck")} ${icon.arrow}</a>
          <a class="btn ghost on-dark" href="#/about">${t("ctaHow")}</a>
        </div>
        <p class="hh-note">${t("skyNote", s.city)}</p>
      </div>
      <div class="hh-side">${preview()}</div>
    </div>
  </section>

  <section class="wrap stat-strip">
    <div class="stat"><span class="stat-ic ok">${icon.check}</span><b>${s.total ? `${s.fresh}<small>/${s.total}</small>` : "—"}</b><span>${t("stFresh")}</span></div>
    <div class="stat"><span class="stat-ic old">${icon.clock}</span><b>${s.oldest ? ageText(s.oldest.age_min) : "—"}</b><span>${t("stOldest")}${s.oldest ? ` · ${esc(s.oldest.name)}` : ""}</span></div>
    <div class="stat"><span class="stat-ic" style="color:${bandColor(s.city)}">${icon.gauge}</span><b>${s.city ?? "—"}</b><span>${t("stCity")} · ${t("stCitySub")}</span></div>
    <div class="stat"><span class="stat-ic brand">${icon.record}</span><b>${s.rate != null ? `${s.rate}%` : "—"}</b><span>${t("stRate")}${s.rate == null ? ` · ${t("stPendingN", s.pending)}` : ""}</span></div>
  </section>

  <section class="wrap band-sec split">
    <div>
      <p class="eyebrow">${t("probEyebrow")}</p>
      <h2 class="sec-title">${t("probTitle")}</h2>
      <p class="sec-lead">${t("probText")}</p>
      <p class="muted small">${t("probSrc")}</p>
    </div>
    <div class="prob-list">
      ${["prob1", "prob2", "prob3"].map((key, i) => `<div class="prob" style="--d:${i * 80}ms"><b>${t(key)[0]}</b><span>${t(key)[1]}</span></div>`).join("")}
    </div>
  </section>

  <section class="how-sec"><div class="wrap">
    <p class="eyebrow center">${t("howEyebrow")}</p>
    <h2 class="sec-title center">${t("howTitle")}</h2>
    <ol class="how-grid">${["how1", "how2", "how3"].map((key, i) => `<li class="how-card">
      <div class="how-art">${STEP_ART[i]}</div><span class="how-n">${i + 1}</span>
      <h3>${t(key)[0]}</h3><p>${t(key)[1]}</p></li>`).join("")}</ol>
  </div></section>

  <section class="wrap band-sec split rev">
    <div class="map-card">${stationMap(state.stations, { current: state.uid, compact: true })}</div>
    <div>
      <p class="eyebrow">${t("mapEyebrow")}</p>
      <h2 class="sec-title">${t("mapTitle")}</h2>
      <p class="sec-lead">${t("mapText")}</p>
      <div class="map-legend"><span><i class="lg-dot" style="background:var(--b2)"></i>${t("fresh")}</span><span><i class="lg-ring"></i>${t("stale")}</span></div>
      <a class="btn primary" href="#/stations">${t("mapCta")} ${icon.arrow}</a>
    </div>
  </section>

  <section class="rec-sec"><div class="wrap split">
    <div>
      <p class="eyebrow on-dark">${t("recEyebrow")}</p>
      <h2 class="sec-title on-dark">${t("recTitle")}</h2>
      <p class="sec-lead on-dark">${t("recText")}</p>
      <a class="btn cta" href="#/record">${t("recCta")} ${icon.arrow}</a>
    </div>
    <div class="rec-art">
      <div class="rc-big"><b class="ok">${k?.HIT ?? 0}</b><span>${t("tallyHit")}</span></div>
      <div class="rc-big"><b class="no">${k ? k.MISSED + k.MISSED_WAITING : 0}</b><span>${t("tallyMiss")}</span></div>
      <div class="rc-big"><b>${k?.PENDING ?? 0}</b><span>${t("tallyPend")}</span></div>
      ${recent ? `<div class="rc-ticket"><span>${esc(recent.name)}</span><b>AQI ${Math.round(recent.lo)}–${Math.round(recent.hi)}</b>
        <em class="${recent.status === "HIT" ? "ok" : recent.status === "PENDING" ? "" : "no"}">${recent.status === "HIT" ? t("hit") : recent.status === "PENDING" ? t("s2") : recent.status === "MISSED" ? t("missedBy", recent.miss_by) : t("missedWaiting")}</em></div>` : ""}
    </div>
  </div></section>

  <section class="wrap faq-sec">
    <h2 class="sec-title center">${t("faqTitle")}</h2>
    <div class="faq">${t("faq").map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
  </section>

  <section class="wrap final-cta">
    <h2>${t("finalTitle")}</h2>
    <a class="btn cta" href="#/check">${t("ctaCheck")} ${icon.arrow}</a>
  </section>`;
}

export function bind() {
  startSky(document.getElementById("sky"), stats().city);
}
