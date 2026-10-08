import "./style.css";

// localhost fallback only in `npm run dev`; a production build without VITE_API_URL must fail loudly,
// otherwise it silently talks to whatever demo server happens to run on the viewer's machine
const API = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8787" : "")).replace(/\/$/, "");
const DEFAULT_UID = Number(import.meta.env.VITE_DEFAULT_UID || 1);

const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

const state = {
  lang: ls.get("lang") || "hi",
  uid: Number(ls.get("uid")) || DEFAULT_UID,
  tab: "card",
  stations: [],
  card: null,
  board: null,
  hold: null,
  error: null,
  busy: false,
  howOpen: false,
};

const T = {
  hi: {
    brand: "ताज़ा हवा", tagline: "हर रीडिंग की एक उम्र होती है",
    card: "आज", board: "स्कोरबोर्ड", locate: "नज़दीकी स्टेशन चुनें",
    fresh: "ताज़ा", stale: "पुरानी", old: "पुरानी रीडिंग", ago: "पहले",
    age: "रीडिंग की उम्र", source: "स्रोत", range: "अनुमानित दायरा", last: "आख़िरी रीडिंग",
    hold: "हमें परखो", holdSub: "स्टेशन की अगली रीडिंग आते ही हम अपना अनुमान खुद जाँचेंगे, और नतीजा यहीं दिखेगा।",
    email: "रसीद ईमेल पर चाहिए? (वैकल्पिक)", sending: "दर्ज कर रहे हैं…",
    s1: "वादा दर्ज", s2: "स्टेशन का इंतज़ार", s3: "परखा गया",
    hit: "सही", missed: "चूक", missedWaiting: "चूक: 72 घंटे में रीडिंग नहीं आई",
    said: "हमने कहा", read: "स्टेशन ने बताया", newHold: "फिर से परखो",
    warm: "कैलिब्रेशन जारी", cal: "80% कैलिब्रेटेड दायरा", from: "आधार",
    ai: "AI बंद", demo: "डेमो डेटा: ये मान कृत्रिम हैं",
    honest: "स्टेशन की हवा, आपकी गली की नहीं। अनुमान है, सच नहीं।",
    how: "यह कैसे काम करता है",
    how1: ["उम्र", "हर नंबर के साथ उसकी उम्र और स्रोत, हमेशा।"],
    how2: ["दायरा", "रीडिंग 3 घंटे से पुरानी हो तो पास के चालू स्टेशनों और CAMS से एक कैलिब्रेटेड दायरा।"],
    how3: ["परख", "स्टेशन की अगली असली रीडिंग हमारे अनुमान को सही या चूक बताती है, सबके सामने।"],
    rule: "फ़ैसले का नियम: संतोषजनक/मध्यम तक → जाओ · खराब → 10 बजे के बाद · बहुत खराब या उससे ऊपर → अंदर रहो। पुरानी रीडिंग पर दायरे की ऊपरी सीमा से फ़ैसला।",
    loading: "हवा देख रहे हैं…", retry: "फिर कोशिश करें", offline: "सर्वर से बात नहीं हो पाई",
    tallyHit: "सही", tallyMiss: "चूक", tallyPend: "जारी", feedAge: "पिछला अपडेट",
    nodata: "सुबह 6:30 बजे हर स्टेशन के लिए अनुमान दर्ज होते हैं; यहाँ उनके नतीजे दिखेंगे।",
    boardIntro: "हर सुबह, हर स्टेशन: हमने क्या कहा और स्टेशन ने क्या बताया।",
    stations: "स्टेशन",
  },
  en: {
    brand: "Taaza Hawa", tagline: "Every reading has an age",
    card: "Today", board: "Scoreboard", locate: "Pick nearest station",
    fresh: "Fresh", stale: "Old", old: "Old reading", ago: "ago",
    age: "Reading age", source: "Source", range: "Estimated range", last: "Last reading",
    hold: "Hold me to it", holdSub: "When the station's next reading lands, we grade our own estimate and show the result here.",
    email: "Want the receipt by email? (optional)", sending: "Recording…",
    s1: "Promise recorded", s2: "Waiting for station", s3: "Graded",
    hit: "Hit", missed: "Missed", missedWaiting: "Missed: no reading in 72 h",
    said: "We said", read: "Station read", newHold: "Hold again",
    warm: "calibration warming up", cal: "calibrated 80% range", from: "from",
    ai: "AI off", demo: "Demo data: values are synthetic",
    honest: "Station air, not your street. An estimate, not the truth.",
    how: "How it works",
    how1: ["Age", "Every number comes with its age and source. Always."],
    how2: ["Range", "If the reading is over 3 h old, a calibrated range from live neighbours and CAMS."],
    how3: ["Grade", "The station's next real reading marks our estimate Hit or Missed, in public."],
    rule: "Decision rule: up to Moderate → Go · Poor → Wait till 10 · Very Poor or worse → Stay in. On an old reading, the top of the range decides.",
    loading: "Checking the air…", retry: "Try again", offline: "Couldn't reach the server",
    tallyHit: "Hit", tallyMiss: "Missed", tallyPend: "Pending", feedAge: "Last update",
    nodata: "Each morning at 06:30 we record an estimate for every station; results appear here.",
    boardIntro: "Every morning, every station: what we said, and what the station read.",
    stations: "Stations",
  },
};
const t = (k) => T[state.lang][k];
const hi = () => state.lang === "hi";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, opts) {
  if (!API) throw new Error("VITE_API_URL was not set when this site was built. Set it in Amplify and redeploy.");
  const r = await fetch(API + path, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

function ageText(min) {
  if (min == null) return "—";
  if (min < 60) return `${min} ${hi() ? "मिनट" : "min"}`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} ${hi() ? "घंटे" : "h"}`;
  return `${Math.floor(h / 24)} ${hi() ? "दिन" : "days"}`;
}

// ---------- the gauge: CPCB bands on a half-dial, interval drawn as an arc ----------
const BANDS = [
  [0, 50, "var(--b0)"], [50, 100, "var(--b1)"], [100, 200, "var(--b2)"],
  [200, 300, "var(--b3)"], [300, 400, "var(--b4)"], [400, 500, "var(--b5)"],
];
const CX = 120, CY = 118, R = 96;
const pt = (v, r = R) => {
  const a = Math.PI * (1 - Math.max(0, Math.min(500, v)) / 500);
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)];
};
const arc = (v1, v2, r = R) => {
  const [x1, y1] = pt(v1, r), [x2, y2] = pt(v2, r);
  return `M${x1.toFixed(2)} ${y1.toFixed(2)} A${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

function gauge(c) {
  const iv = c.interval;
  const gap = 2.2;
  const segs = BANDS.map(([a, b, col]) =>
    `<path d="${arc(a + gap, b - gap)}" stroke="${col}" stroke-width="10" fill="none" stroke-linecap="butt" opacity=".92"/>`).join("");
  let over = "", centre = "", sub = "";
  if (iv) {
    over = `<path d="${arc(iv.lo, Math.max(iv.hi, iv.lo + 2), R + 14)}" class="g-range" fill="none" stroke-linecap="round"/>`;
    const [px, py] = pt(iv.point, R + 14);
    over += `<circle cx="${px}" cy="${py}" r="4.5" class="g-dot"/>`;
    centre = `${iv.lo}<tspan class="g-dash">–</tspan>${iv.hi}`;
    sub = t("range");
  } else if (c.value != null) {
    const [px, py] = pt(c.value, R + 14);
    over = `<circle cx="${px}" cy="${py}" r="7" class="g-dot"/><circle cx="${px}" cy="${py}" r="13" class="g-halo"/>`;
    centre = `${c.value}`;
    sub = c.pollutant_label ? `${c.pollutant_label} ${hi() ? "सब-इंडेक्स" : "sub-index"}` : "";
  }
  return `<svg class="gauge" viewBox="0 0 240 132" role="img" aria-label="${esc(sub)} ${esc(iv ? `${iv.lo}-${iv.hi}` : c.value ?? "")}">
    ${segs}${over}
    <text x="${CX}" y="${CY - 22}" class="g-num" text-anchor="middle">${centre}</text>
    <text x="${CX}" y="${CY - 2}" class="g-sub" text-anchor="middle">${esc(sub)}</text>
    <text x="${CX - R}" y="${CY + 14}" class="g-tick" text-anchor="middle">0</text>
    <text x="${CX + R}" y="${CY + 14}" class="g-tick" text-anchor="middle">500</text>
  </svg>`;
}

// ---------- views ----------
function render() {
  const app = document.getElementById("app");
  const demo = state.card?.demo || state.board?.demo;
  app.innerHTML = `
    <header class="topbar"><div class="wrap topbar-in">
    <div class="brand">
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 13h15a4 4 0 1 0-4-4M5 19h19a4.5 4.5 0 1 1-4.5 4.5M5 25h9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
      <div><b>${t("brand")}</b><small>${t("tagline")}</small></div>
    </div>
    <nav class="seg" role="tablist">
      <button role="tab" data-tab="card" aria-selected="${state.tab === "card"}">${t("card")}</button>
      <button role="tab" data-tab="board" aria-selected="${state.tab === "board"}">${t("board")}</button>
      <span class="seg-ink" style="transform:translateX(${state.tab === "card" ? 0 : 100}%)"></span>
    </nav>
    <div class="picker">
      <label class="sel">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9.5" r="2.4" fill="currentColor"/></svg>
        <select id="station" aria-label="${t("stations")}">${state.stations
          .map((s) => `<option value="${s.uid}" ${s.uid === state.uid ? "selected" : ""}>${esc(s.name)}${s.age_min != null && s.age_min > 180 ? `  · ${t("old")}` : ""}</option>`).join("")}</select>
      </label>
      <button id="locate" class="icon-btn" title="${t("locate")}" aria-label="${t("locate")}">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
    </div>
    <button id="lang" class="lang" aria-label="${hi() ? "Switch to English" : "हिंदी में देखें"}">${hi() ? "English" : "हिंदी"}</button>
    </div></header>
    ${demo ? `<div class="wrap"><div class="demo">◆ ${t("demo")}</div></div>` : ""}
    <main class="wrap">${state.error ? errorView() : state.tab === "card" ? cardView() : boardView()}</main>
    <footer class="wrap foot"><p>${t("honest")}</p><p class="muted">CPCB · WAQI · CAMS (Open-Meteo) · AWS</p></footer>`;
  bind();
}

function errorView() {
  return `<section class="panel err"><p class="err-t">${t("offline")}</p><p class="muted small">${esc(state.error)}</p>
    <button id="retry" class="ghost">${t("retry")}</button></section>`;
}

function skeleton() {
  return `<section class="hero sk"><div class="sk-l w40"></div><div class="sk-l w70 big"></div><div class="sk-g"></div><div class="sk-l w90"></div><div class="sk-l w60"></div>
    <p class="muted small center">${t("loading")}</p></section>`;
}

function cardView() {
  const c = state.card;
  if (!c) return skeleton();
  const answer = hi() ? c.answer_hi : c.answer_en;
  const sentence = hi() ? (c.sentence_hi_ai || c.sentence_hi) : c.sentence_en;
  const band = hi() ? c.band_hi : c.band_en;
  const stale = c.state !== "fresh";
  const iv = c.interval;
  return `<div class="cols"><div class="col-a">
  <section class="hero a-${c.answer}">
    <div class="hero-body">
      <div class="hero-text">
        <div class="hero-top">
          <p class="q">${esc(hi() ? c.question_hi : c.question_en)}</p>
          ${c.age_min != null ? `<span class="pill ${stale ? "pill-stale" : "pill-fresh"}"><i></i>${stale ? t("stale") : t("fresh")} · ${ageText(c.age_min)}</span>` : ""}
        </div>
        <h2 class="ans">${esc(answer)}</h2>
        ${band ? `<p class="band">${esc(band)}${c.pollutant_label ? ` <span>·</span> ${esc(c.pollutant_label)}` : ""}</p>` : ""}
        <p class="sent">${esc(sentence)}${hi() && !c.ai_on ? ` <span class="chip">${t("ai")}</span>` : ""}</p>
      </div>
      ${c.value != null || iv ? `<div class="hero-gauge">${gauge(c)}</div>` : ""}
    </div>
  </section>

  <section class="facts ${iv ? "f4" : "f2"}">
    <div><dt>${t("age")}</dt><dd>${ageText(c.age_min)}</dd></div>
    <div><dt>${t("source")}</dt><dd>${esc(c.source || "—")}</dd></div>
    ${iv ? `<div><dt>${t("last")}</dt><dd>${c.last_value ?? "—"} <small>${ageText(c.age_min)} ${t("ago")}</small></dd></div>
            <div><dt>${iv.calibrated ? t("cal") : t("warm")}</dt><dd class="small-dd">${iv.neighbours?.length ? `${t("from")} ${esc(iv.neighbours.join(", "))}` : "—"}${iv.used_cams ? " + CAMS" : ""}</dd></div>` : ""}
  </section>

  ${stationsView()}
  </div><div class="col-b">

  ${holdView(c)}

  ${c.yesterday ? `<section class="panel yday ${c.yesterday.status === "HIT" ? "ok" : c.yesterday.status === "PENDING" ? "" : "no"}">
      <span class="yd-ic">${c.yesterday.status === "HIT" ? "✓" : c.yesterday.status === "PENDING" ? "…" : "✗"}</span>
      <p>${esc(hi() ? c.yesterday.hi : c.yesterday.en)}</p></section>` : ""}

  ${c.participation ? `<p class="cpcb"><b>CPCB</b> ${esc(c.participation.line)}</p>` : ""}

  ${howView()}
  </div></div>`;
}

// every Delhi station with the age of its latest reading: the freshness audit at a glance
function stationsView() {
  if (!state.stations.length) return "";
  const fresh = state.stations.filter((s) => s.age_min != null && s.age_min <= 180).length;
  return `<section class="panel allst">
    <div class="allst-h"><b>${hi() ? "सभी स्टेशन, अभी" : "All stations, right now"}</b>
      <span class="muted small">${fresh}/${state.stations.length} ${hi() ? "ताज़ा" : "fresh"}</span></div>
    <div class="allst-g">${state.stations.map((s) => {
      const st = s.age_min == null ? "none" : s.age_min > 180 ? "old" : "ok";
      return `<button class="st st-${st} ${s.uid === state.uid ? "cur" : ""}" data-uid="${s.uid}"><i></i><span>${esc(s.name)}</span><small>${ageText(s.age_min)}</small></button>`;
    }).join("")}</div>
  </section>`;
}

function holdView(c) {
  const h = state.hold;
  if (h && h.uid === c.uid) {
    const done = h.status !== "PENDING";
    const ok = h.status === "HIT";
    const verdict = ok ? t("hit") : h.status === "MISSED" ? `${t("missed")} by ${h.miss_by}` : t("missedWaiting");
    return `<section class="panel receipt ${done ? (ok ? "ok" : "no") : "wait"}">
      <ol class="steps">
        <li class="on"><i></i><span>${t("s1")}</span></li>
        <li class="${done ? "on" : "now"}"><i></i><span>${t("s2")}</span></li>
        <li class="${done ? "on" : ""}"><i></i><span>${t("s3")}</span></li>
      </ol>
      ${done ? `<p class="verdict">${verdict}</p>` : ""}
      <p class="rc-line">${t("said")} <b>${Math.round(h.lo)}–${Math.round(h.hi)}</b>${h.actual != null ? ` · ${t("read")} <b>${Math.round(h.actual)}</b>` : ""}</p>
      ${done ? `<button id="newhold" class="ghost">${t("newHold")}</button>` : ""}
    </section>`;
  }
  if (!c.can_hold) return "";
  return `<section class="panel holdbox">
    <button id="holdbtn" class="cta" ${state.busy ? "disabled" : ""}>
      <span>${state.busy ? t("sending") : t("hold")}</span>
      ${state.busy ? "" : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`}
    </button>
    <p class="muted small">${t("holdSub")}</p>
    <input id="email" type="email" inputmode="email" autocomplete="email" placeholder="${t("email")}" value="${esc(ls.get("email") || "")}" />
  </section>`;
}

function howView() {
  return `<details class="panel how" ${state.howOpen ? "open" : ""}>
    <summary>${t("how")}</summary>
    <ol>${["how1", "how2", "how3"].map((k, i) => `<li><span class="n">${i + 1}</span><div><b>${t(k)[0]}</b><p>${t(k)[1]}</p></div></li>`).join("")}</ol>
    <p class="muted small">${t("rule")}</p>
  </details>`;
}

function dot(d) {
  if (!d) return `<span class="d d-none" aria-hidden="true"></span>`;
  const tip = `${d.pollutant} ${d.lo}–${d.hi}${d.actual != null ? ` → ${d.actual}` : ""}`;
  const cls = { HIT: "d-hit", MISSED: "d-miss", MISSED_WAITING: "d-miss", PENDING: "d-pend" }[d.status];
  const label = d.status === "HIT" ? "✓" : d.status === "MISSED" ? d.miss_by : d.status === "MISSED_WAITING" ? "✗" : "";
  return `<span class="d ${cls}" title="${esc(tip)}">${label}</span>`;
}

function boardView() {
  const b = state.board;
  if (!b) return skeleton();
  const k = b.tally;
  const miss = k.MISSED + k.MISSED_WAITING;
  const graded = k.HIT + miss;
  const rate = graded >= 5 ? Math.round((k.HIT / graded) * 100) : null;
  const anyRow = b.rows.some((r) => Object.keys(r.days).length);
  const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString(hi() ? "hi-IN" : "en-IN", { day: "numeric", month: "short" });
  return `
  <section class="hero board-hero">
    <div class="bh-text"><h2 class="bh-title">${t("board")}</h2><p class="q">${t("boardIntro")}</p></div>
    <div class="tally">
      <div class="t-hit"><b>${k.HIT}</b><span>${t("tallyHit")}</span></div>
      <div class="t-miss"><b>${miss}</b><span>${t("tallyMiss")}</span></div>
      <div class="t-pend"><b>${k.PENDING}</b><span>${t("tallyPend")}</span></div>
      ${rate != null ? `<div class="t-rate"><b>${rate}%</b><span>${hi() ? "सही दर" : "hit rate"}</span></div>` : ""}
    </div>
    ${b.poll ? `<p class="muted small bh-poll">${t("feedAge")}: ${ageText(Math.floor((b.now - b.poll.at) / 60))} ${t("ago")}</p>` : ""}
  </section>
  ${b.participation ? `<p class="cpcb"><b>CPCB</b> ${esc(b.participation.line)}</p>` : ""}
  ${anyRow ? `<section class="panel grid">
      <div class="g-head"><span></span>${b.dates.map((d) => `<span>${fmt(d)}</span>`).join("")}</div>
      ${b.rows.map((r) => `<div class="g-row"><span class="g-name">${esc(r.name)}</span>${b.dates.map((d) => dot(r.days[d])).join("")}</div>`).join("")}
      <p class="legend"><span class="d d-hit">✓</span>${t("tallyHit")} <span class="d d-miss">12</span>${hi() ? "चूक (कितने से)" : "Missed by"} <span class="d d-pend"></span>${t("tallyPend")}</p>
    </section>` : `<section class="panel"><p class="muted">${t("nodata")}</p></section>`}`;
}

// ---------- events ----------
function bind() {
  const $ = (id) => document.getElementById(id);
  $("lang")?.addEventListener("click", () => { state.lang = hi() ? "en" : "hi"; ls.set("lang", state.lang); document.documentElement.lang = state.lang; render(); });
  $("station")?.addEventListener("change", (e) => { state.uid = Number(e.target.value); ls.set("uid", state.uid); state.card = null; render(); loadCard(); });
  $("locate")?.addEventListener("click", locate);
  $("retry")?.addEventListener("click", () => init());
  $("holdbtn")?.addEventListener("click", startHold);
  document.querySelectorAll(".allst [data-uid]").forEach((b) => b.addEventListener("click", () => {
    state.uid = Number(b.dataset.uid); ls.set("uid", state.uid); loadCard();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }));
  $("newhold")?.addEventListener("click", () => { state.hold = null; ls.set("hold", ""); render(); });
  document.querySelector("details.how")?.addEventListener("toggle", (e) => { state.howOpen = e.target.open; });
  document.querySelectorAll(".seg [data-tab]").forEach((b) => b.addEventListener("click", () => {
    state.tab = b.dataset.tab; render();
    if (state.tab === "board") loadBoard();
  }));
}

function locate() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((p) => {
    const { latitude: la, longitude: lo } = p.coords;
    const d = (s) => (s.lat - la) ** 2 + ((s.lon - lo) * Math.cos((la * Math.PI) / 180)) ** 2;
    const best = [...state.stations].sort((a, b) => d(a) - d(b))[0];
    if (best) { state.uid = best.uid; ls.set("uid", best.uid); state.card = null; render(); loadCard(); }
  });
}

async function startHold() {
  const email = document.getElementById("email")?.value.trim();
  if (email) ls.set("email", email);
  state.busy = true; render();
  try {
    state.hold = await api("/hold", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ uid: state.uid, email: email || null }) });
    ls.set("hold", state.hold.id);
  } catch (e) { state.error = e.message; }
  state.busy = false; render();
}

async function loadCard() {
  try { state.error = null; state.card = await api(`/card?uid=${state.uid}`); } catch (e) { state.error = e.message; }
  render();
}

async function loadBoard() {
  try { state.board = await api("/scoreboard"); } catch (e) { state.error = e.message; }
  render();
}

async function pollHold() {
  if (!state.hold || state.hold.status !== "PENDING") return;
  try {
    const h = await api(`/hold?id=${encodeURIComponent(state.hold.id)}`);
    if (h.status !== state.hold.status) { state.hold = h; loadCard(); }
  } catch { /* keep waiting */ }
}

async function init() {
  state.error = null; render();
  try {
    state.stations = (await api("/stations")).stations;
    if (!state.stations.some((s) => s.uid === state.uid) && state.stations[0]) state.uid = state.stations[0].uid;
    const hid = ls.get("hold");
    if (hid) { try { state.hold = await api(`/hold?id=${encodeURIComponent(hid)}`); } catch { ls.set("hold", ""); } }
  } catch (e) { state.error = e.message; render(); return; }
  await loadCard();
}

document.documentElement.lang = state.lang;
init();
setInterval(pollHold, 15000);
setInterval(() => { if (state.tab === "card" && !state.busy) loadCard(); }, 5 * 60 * 1000);
if ("serviceWorker" in navigator && import.meta.env.PROD) navigator.serviceWorker.register("/sw.js").catch(() => {});
