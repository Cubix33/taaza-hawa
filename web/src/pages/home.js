import { state } from "../lib/store.js";
import { t, hi } from "../lib/i18n.js";
import { esc, ageText, isOld, icon, median, bandName, stationMap, ageChart } from "../lib/ui.js";
import { run, loadCard, loadBoard } from "../lib/actions.js";
import { sky } from "../lib/sky.js";
import { planRows } from "./plan.js";

export function load() {
  return run(loadCard, loadBoard);
}

const cityAqi = () => median(state.stations.filter((s) => !isOld(s)).map((s) => s.aqi).filter((v) => v != null));

// the answer, right on the landing page: no click needed to get value
function answer() {
  const c = state.card;
  if (!c) return `<div class="sheet sk"><div class="sk-l w40"></div><div class="sk-l big w90"></div><div class="sk-l w70"></div></div>`;
  const stale = c.state !== "fresh";
  const iv = c.interval;
  const whys = [];
  if (iv) whys.push(t("whyAirRange", bandName(iv.hi), iv.lo, iv.hi));
  else if (c.value != null) whys.push(t("whyAir", bandName(c.value), c.value));
  if (c.age_min != null) whys.push(stale ? t("whyStale", ageText(c.age_min)) : t("whyFresh", ageText(c.age_min)));
  return `<div class="sheet a-${c.answer}">
    <p class="ask">${t("heroAsk")}</p>
    <h1 class="say">${t("say")[c.answer]}</h1>
    <p class="where">${icon.pin}<b>${esc(c.name)}</b><span class="stamp ${stale ? "old" : "ok"}">${ageText(c.age_min)} ${hi() ? "पुरानी" : "old"}</span></p>
    <ul class="why">${whys.map((w) => `<li>${w}</li>`).join("")}</ul>
    <div class="actions">
      <a class="btn ink" href="#/check?s=${c.uid}">${t("details")} ${icon.arrow}</a>
      <a class="btn line" href="#/check?s=${c.uid}&pick=1">${t("change")}</a>
    </div>
    <p class="what">${t("heroWhat")}</p>
  </div>`;
}

export function view() {
  const k = state.board?.tally;
  const st = state.stations;
  const recent = state.board?.recent_holds?.[0];
  const city = cityAqi();
  return `
  <section class="home-hero">
    <div class="hero-sky">${sky(city)}</div>
    <div class="wrap hero-in">${answer()}</div>
    <p class="wrap sky-cap">${icon.clock}<span>${t("skyCap", city)}</span></p>
  </section>

  <section class="wrap sec split sc-teaser">
    <div>
      <p class="eyebrow">${t("homeSchool")[0]}</p>
      <h2 class="sec-title">${t("homeSchool")[1]}</h2>
      <p class="lead">${t("homeSchool")[2]}</p>
      <a class="btn ink" href="#/plan">${t("homeSchoolCta")} ${icon.arrow}</a>
    </div>
    <div class="hero-card sc-today sc-ex lv-2" aria-label="${esc(t("scExample"))}">
      <p class="q">${t("scExample")}</p>
      <h3 class="ans">${t("scHead")[2]}</h3>
      ${planRows({ assembly: "in", pe: "in", recess: "limit", sensitive: "in" })}
    </div>
  </section>

  <section class="wrap sec use-sec">
    <div>
      <h2 class="sec-title">${t("useTitle")}</h2>
      <ol class="use-list">${t("use").map(([h, p], i) => `<li><span class="num">${i + 1}</span><div><h3>${h}</h3><p>${p}</p></div></li>`).join("")}</ol>
    </div>
    <aside class="aqi-box">
      <h3>${t("aqiWhat")[0]}</h3>
      <p>${t("aqiWhat")[1]}</p>
      <ol class="aqi-bands">${t("aqiBands").map(([r, n], i) => `<li><i style="background:${["var(--b1)", "var(--b2)", "var(--b3)", "var(--b4)"][i]}"></i><b>${r}</b><span>${n}</span></li>`).join("")}</ol>
    </aside>
  </section>

  <section class="band"><div class="wrap sec diff">
    <h2 class="sec-title">${t("diffTitle")}</h2>
    <ol class="steps3">${["how1", "how2", "how3"].map((key, i) => `<li><span class="num">0${i + 1}</span><h3>${t(key)[0]}</h3><p>${t(key)[1]}</p></li>`).join("")}</ol>
  </div></section>

  <section><div class="wrap sec problem">
    <div class="problem-h"><h2 class="sec-title">${t("probTitle")}</h2><p class="lead">${t("probText")}</p></div>
    <div class="figures">${["prob1", "prob2", "prob3"].map((key) => `<div class="figure"><b>${t(key)[0]}</b><span>${t(key)[1]}</span></div>`).join("")}</div>
    <p class="src">${t("probSrc")}</p>
  </div></section>

  ${st.length ? `<section class="wrap sec">
    <div class="sec-head"><h2 class="sec-title">${t("ageTitle")}</h2><p class="lead">${t("ageText")}</p></div>
    <div class="chart-card">${ageChart(st)}</div>
  </section>` : ""}

  <section class="wrap sec split">
    <div class="map-card">${stationMap(st, { current: state.uid, compact: true })}</div>
    <div>
      <h2 class="sec-title">${t("mapTitle")}</h2>
      <p class="lead">${t("mapText")}</p>
      <div class="map-legend"><span><i class="lg-dot"></i>${t("fresh")}</span><span><i class="lg-ring"></i>${t("stale")}</span></div>
      <a class="btn ink" href="#/stations">${t("mapCta")} ${icon.arrow}</a>
    </div>
  </section>

  <section class="band"><div class="wrap sec split record-teaser">
    <div>
      <h2 class="sec-title">${t("recTitle")}</h2>
      <p class="lead">${t("recText")}</p>
      <a class="btn ink" href="#/record">${t("recCta")} ${icon.arrow}</a>
    </div>
    <div>
      <div class="ledger">
        <div><b class="ok">${k?.HIT ?? 0}</b><span>${t("tallyHit")}</span></div>
        <div><b class="no">${k?.MISSED ?? 0}</b><span>${t("tallyMiss")}</span></div>
        <div><b class="un">${k?.MISSED_WAITING ?? 0}</b><span>${t("tallyUnverified")}</span></div>
        <div><b>${k?.PENDING ?? 0}</b><span>${t("tallyPend")}</span></div>
      </div>
      ${recent ? `<div class="ticket"><span>${esc(recent.name)}</span><b>AQI ${Math.round(recent.lo)}–${Math.round(recent.hi)}</b>
        <em class="${recent.status === "HIT" ? "ok" : recent.status === "PENDING" ? "" : recent.status === "MISSED" ? "no" : "un"}">${recent.status === "HIT" ? t("hit") : recent.status === "PENDING" ? t("s2") : recent.status === "MISSED" ? t("missedBy", recent.miss_by) : t("missedWaiting")}</em></div>` : ""}
    </div>
  </div></section>

  <section class="wrap sec faq-wrap">
    <h2 class="sec-title">${t("faqTitle")}</h2>
    <div class="faq">${t("faq").map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
  </section>

  <section class="wrap closing">
    <p>${t("finalTitle")}</p>
    <a class="btn ink" href="#/check">${t("ctaCheck")} ${icon.arrow}</a>
  </section>`;
}
