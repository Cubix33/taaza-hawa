// Home: the answer first, then how it works (a 24-second 3D story), what's inside (each feature with a
// live number), why it matters (how old each station's number is right now), questions, and one last nudge.
import { state } from "../lib/store.js";
import { t, hi } from "../lib/i18n.js";
import { esc, ageText, isOld, icon, median, bandName, ageChart, accent } from "../lib/ui.js";
import { run, loadCard, loadBoard } from "../lib/actions.js";
import { sky } from "../lib/sky.js";

export function load() {
  return run(loadCard, loadBoard);
}

const cityAqi = () => median(state.stations.filter((s) => !isOld(s)).map((s) => s.aqi).filter((v) => v != null));
const shortName = (n) => String(n || "").replace(/(, Delhi)+, India$/, "");

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
    <p class="where">${icon.pin}<b>${esc(shortName(c.name))}</b><span class="stamp ${stale ? "old" : "ok"}">${ageText(c.age_min)} ${hi() ? "पुरानी" : "old"}</span></p>
    <ul class="why">${whys.map((w) => `<li>${w}</li>`).join("")}</ul>
    ${c.answer === "WAIT" ? `<p class="wait-next">${t("waitNext", stale)}</p>` : ""}
    <div class="actions">
      <a class="btn ink" href="#/check?s=${c.uid}">${t("details")} ${icon.arrow}</a>
      <a class="btn line" href="#/check?s=${c.uid}&pick=1">${t("change")}</a>
    </div>
    <p class="what">${t("heroWhat")}${c.answer !== "UNKNOWN" ? ` <span class="healthy">${t("healthyNote")}</span>` : ""}</p>
  </div>`;
}

// each feature, one line, with a live number where there is one
function features() {
  const st = state.stations, b = state.board, f = state.card?.fires;
  const fresh = st.filter((s) => !isOld(s)).length;
  const acc = b?.accuracy, rel = b?.reliability?.stations?.[0];
  const orgs = Object.values(b?.ledger?.orgs || {}).reduce((a, n) => a + n, 0);
  const tiles = [
    ["check", icon.gauge, "#/check", st.length ? t("ftFresh", fresh, st.length) : ""],
    ["lens", icon.map, "#/stations", st.length ? t("ftOnMap", st.length) : ""],
    ["fires", icon.satellite, "#/check", f ? t("ftFires", f.total) : t("ftFiresNone")],
    ["plan", icon.school, "#/plan", b?.ledger ? t("ftOrgs", orgs) : ""],
    ["record", icon.record, "#/record", acc?.graded ? t("ftRight", acc.hits, acc.graded) : t("ftRightNone")],
    ["reliable", icon.clock, "#/record", rel ? t("ftQuiet", esc(shortName(rel.name)), rel.pct) : ""],
  ];
  return `<ul class="ft-grid">${tiles.map(([k, ic, href, live]) => `<li><a class="ft" href="${href}">
    <span class="ft-ic">${ic}</span><b>${t("ft")[k][0]}</b><span class="ft-l">${t("ft")[k][1]}</span>
    ${live ? `<span class="ft-live">${live}</span>` : ""}<span class="ft-go">${icon.arrow}</span></a></li>`).join("")}</ul>`;
}

export function view() {
  const st = state.stations;
  const city = cityAqi();
  return `
  <section class="home-hero">
    <div class="hero-sky">${sky(city)}</div>
    <div class="wrap hero-in">${answer()}</div>
    <p class="wrap sky-cap">${icon.clock}<span>${t("skyCap", city)}</span></p>
  </section>

  <section class="wrap sec st-sec">
    <div class="sec-head"><h2 class="sec-title">${accent(t("stTitle"))}</h2><p class="muted small">${t("stNote")}</p></div>
    <div id="story-slot" class="st-slot"></div>
  </section>

  <section class="band"><div class="wrap sec">
    <h2 class="sec-title">${accent(t("ftTitle"))}</h2>
    ${features()}
  </div></section>

  <section class="wrap sec problem">
    <div class="problem-h"><h2 class="sec-title">${accent(t("probTitle"))}</h2><p class="lead">${t("probText")}</p></div>
    <div class="figures">${["prob1", "prob2", "prob3"].map((key) => `<div class="figure"><b>${t(key)[0]}</b><span>${t(key)[1]}</span></div>`).join("")}</div>
    ${st.length ? `<div class="chart-card age-card"><p class="age-h"><b>${t("ageTitle")}</b><span class="muted small">${t("ageText")}</span></p>${ageChart(st)}</div>` : ""}
    <p class="src">${t("probSrc")}</p>
  </section>

  <section class="wrap sec faq-wrap">
    <h2 class="sec-title">${accent(t("faqTitle"))}</h2>
    <div class="faq">${t("faq").map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
  </section>

  <section class="wrap closing">
    <p>${t("finalTitle")}</p>
    <a class="btn ink" href="#/check">${t("ctaCheck")} ${icon.arrow}</a>
  </section>`;
}

// the 3D story survives re-renders: the page HTML is rebuilt whenever data arrives, so the live
// element is moved into the new slot instead of building the scene again
let story = null, loading = false;
export function bind() {
  const slot = document.getElementById("story-slot");
  if (!slot) return;
  if (story) { slot.appendChild(story.root); story.refresh(); return; }
  if (loading) return;
  loading = true;
  import("../lib/story3d.js").then((m) => {
    loading = false;
    if (state.route !== "home") return;
    story = m.createStory();
    document.getElementById("story-slot")?.appendChild(story.root);
  }).catch(() => { loading = false; });
}

export function unmount() {
  story?.destroy();
  story = null;
}
