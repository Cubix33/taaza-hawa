import "./style.css";

// localhost fallback only in `npm run dev`; a production build without VITE_API_URL must fail loudly,
// otherwise it silently talks to whatever demo server happens to run on the viewer's machine
const API = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8787" : "")).replace(/\/$/, "");
const DEFAULT_UID = Number(import.meta.env.VITE_DEFAULT_UID || 1);
const STALE_MIN = 180;

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
  pickerOpen: false,
  q: "",
};

// ---------- copy: plain words first, technical detail only where someone looks for it ----------
const T = {
  hi: {
    brand: "ताज़ा हवा", tagline: "हर रीडिंग की एक उम्र होती है",
    card: "आज", board: "हमारा रिकॉर्ड", locate: "मेरे पास का स्टेशन",
    search: "स्टेशन खोजें…", noMatch: "कोई स्टेशन नहीं मिला", legendFresh: "ताज़ा (3 घंटे से कम)", legendOld: "पुरानी रीडिंग",
    fresh: "ताज़ा", stale: "पुरानी", ago: "पहले",
    aqi: "AQI", aqiGuess: "AQI का अंदाज़ा",
    scaleTitle: "AQI पैमाना: जितना ज़्यादा नंबर, उतनी खराब हवा",
    age: "रीडिंग कितनी पुरानी", source: "डेटा कहाँ से", sourceVal: "सरकारी CPCB स्टेशन",
    last: "आख़िरी असली रीडिंग", basis: "अंदाज़ा किससे बना", trust: "अंदाज़े पर भरोसा",
    trustCal: "पिछले नतीजों से जाँचा गया", trustWarm: "अभी सीख रहा है, इसलिए दायरा चौड़ा रखा है",
    model: "मौसम मॉडल (CAMS)", onlyOld: "सिर्फ़ पुरानी रीडिंग",
    holdQ: "क्या हमारा अंदाज़ा सही निकलेगा?",
    holdText: (n, lo, hiv) => `हमारा अंदाज़ा है: AQI <b>${lo}–${hiv}</b>। जैसे ही ${n} की नई असली रीडिंग आएगी, हम जाँचेंगे और यहीं बताएँगे कि अंदाज़ा सही था या नहीं।`,
    hold: "हमें परखो", sending: "दर्ज कर रहे हैं…",
    emailLabel: "नतीजा ईमेल पर भी चाहिए? (वैकल्पिक)", emailPh: "आपका ईमेल", emailAdd: "ईमेल पर भेजें",
    emailWill: (h) => `नतीजा ${h} पर भी भेजा जाएगा`,
    freshTitle: "यह रीडिंग ताज़ा है",
    freshText: "यहाँ अंदाज़ा लगाने की ज़रूरत नहीं। जब किसी स्टेशन की रीडिंग 3 घंटे से पुरानी हो जाती है, तब हम अंदाज़ा लगाते हैं, और आप हमें परख सकते हैं।",
    oldNow: "इन स्टेशनों की रीडिंग अभी पुरानी है:",
    s1: "अंदाज़ा दर्ज", s2: "नई रीडिंग का इंतज़ार", s3: "नतीजा",
    hit: "सही निकला", missed: "चूक गए", missedBy: (n) => `${n} से चूके`, missedWaiting: "72 घंटे में नई रीडिंग नहीं आई",
    said: "हमारा अंदाज़ा", read: "असली रीडिंग", newHold: "ठीक है",
    otherHold: (n) => `${n} के लिए आपका अंदाज़ा जाँच में है`, see: "देखें",
    demo: "डेमो डेटा: ये मान असली नहीं हैं",
    honest: "यह स्टेशन की हवा है, आपकी गली की नहीं। पुरानी रीडिंग पर दिखाया दायरा अंदाज़ा है, पक्की बात नहीं।",
    how: "यह कैसे काम करता है",
    how1: ["उम्र देखें", "हर नंबर के साथ लिखा है कि वह कितनी पुरानी है और कहाँ से आई।"],
    how2: ["पुरानी हो तो अंदाज़ा", "अगर रीडिंग 3 घंटे से पुरानी है, तो हम आस-पास के ताज़ा स्टेशनों से AQI का अंदाज़ा लगाते हैं, एक दायरे के रूप में।"],
    how3: ["फिर जाँच", "स्टेशन की अगली असली रीडिंग आते ही हम सबके सामने बताते हैं कि अंदाज़ा सही था या नहीं।"],
    rule: "सलाह का नियम: AQI 200 तक → जाओ · 201 से 300 → 10 बजे के बाद · 300 से ऊपर → अंदर रहो। अंदाज़े में सावधानी के लिए दायरे की ऊपरी सीमा देखी जाती है।",
    loading: "हवा देख रहे हैं…", retry: "फिर कोशिश करें", offline: "सर्वर से बात नहीं हो पाई",
    tallyHit: "सही", tallyMiss: "चूके", tallyPend: "जाँच बाकी", rateL: "सही दर", feedAge: "डेटा पिछली बार",
    nodata: "हर सुबह 6:30 बजे हम हर स्टेशन के लिए अंदाज़ा दर्ज करते हैं। उनके नतीजे यहाँ दिखेंगे।",
    boardIntro: "हर सुबह 6:30 बजे हम हर स्टेशन के लिए AQI का अंदाज़ा लगाते हैं, फिर स्टेशन की अगली असली रीडिंग से उसे जाँचते हैं। चूक भी उतनी ही साफ़ दिखाते हैं जितना सही।",
    legHit: "अंदाज़ा सही", legMiss: "इतने AQI से चूके", legPend: "जाँच बाकी",
  },
  en: {
    brand: "Taaza Hawa", tagline: "Every reading has an age",
    card: "Today", board: "Our track record", locate: "Nearest station",
    search: "Search stations…", noMatch: "No station found", legendFresh: "Fresh (under 3 h)", legendOld: "Old reading",
    fresh: "Fresh", stale: "Old", ago: "ago",
    aqi: "AQI", aqiGuess: "Estimated AQI",
    scaleTitle: "AQI scale: the higher the number, the worse the air",
    age: "How old is the reading", source: "Where the data comes from", sourceVal: "Government CPCB station",
    last: "Last real reading", basis: "Estimate based on", trust: "How sure are we",
    trustCal: "Checked against our past results", trustWarm: "Still learning, so the range is kept wide",
    model: "weather model (CAMS)", onlyOld: "the old reading only",
    holdQ: "Will our estimate be right?",
    holdText: (n, lo, hiv) => `Our estimate is AQI <b>${lo}–${hiv}</b>. As soon as ${n} reports a new real reading, we'll check it and show you here whether we were right.`,
    hold: "Hold me to it", sending: "Recording…",
    emailLabel: "Want the result by email too? (optional)", emailPh: "Your email", emailAdd: "Email me the result",
    emailWill: (h) => `We'll also email the result to ${h}`,
    freshTitle: "This reading is fresh",
    freshText: "No estimate needed here. When a station's reading gets older than 3 hours, we estimate the air, and you can hold us to it.",
    oldNow: "These stations have old readings right now:",
    s1: "Estimate recorded", s2: "Waiting for new reading", s3: "Result",
    hit: "We were right", missed: "We missed", missedBy: (n) => `Missed by ${n}`, missedWaiting: "No new reading in 72 hours",
    said: "Our estimate", read: "Real reading", newHold: "OK",
    otherHold: (n) => `Your estimate for ${n} is being checked`, see: "View",
    demo: "Demo data: these values are not real",
    honest: "This is station air, not your street. The range shown for old readings is an estimate, not a certainty.",
    how: "How it works",
    how1: ["Check the age", "Every number says how old it is and where it came from."],
    how2: ["Old? We estimate", "If the reading is over 3 hours old, we estimate the AQI from nearby fresh stations, as a range."],
    how3: ["Then we check", "When the station's next real reading arrives, we show publicly whether our estimate was right."],
    rule: "Advice rule: AQI up to 200 → Go · 201 to 300 → Wait till 10 · above 300 → Stay inside. For estimates we use the top of the range, to be careful.",
    loading: "Checking the air…", retry: "Try again", offline: "Couldn't reach the server",
    tallyHit: "Right", tallyMiss: "Missed", tallyPend: "Pending", rateL: "hit rate", feedAge: "Data last updated",
    nodata: "Every morning at 06:30 we record an estimate for every station. Results will appear here.",
    boardIntro: "Every morning at 06:30 we estimate the AQI for every station, then check it against that station's next real reading. Misses are shown as clearly as hits.",
    legHit: "Estimate was right", legMiss: "Missed by this much AQI", legPend: "Not checked yet",
  },
};
const t = (k, ...a) => { const v = T[state.lang][k]; return typeof v === "function" ? v(...a) : v; };
const hi = () => state.lang === "hi";

const BAND_STOPS = [50, 100, 200, 300, 400, 500];
const BAND_NAMES = {
  hi: ["अच्छी", "संतोषजनक", "मध्यम", "खराब", "बहुत खराब", "गंभीर"],
  en: ["Good", "Satisfactory", "Moderate", "Poor", "Very poor", "Severe"],
};
const bandIdx = (v) => { const i = BAND_STOPS.findIndex((u) => v <= u); return i < 0 ? 5 : i; };
const bandName = (v) => BAND_NAMES[state.lang][bandIdx(v)];

const ADVICE = {
  hi: {
    GO: "बाहर जाना ठीक है।",
    WAIT: "अभी हवा खराब है। आमतौर पर सुबह के बाद हवा थोड़ी साफ़ होती है, इसलिए दौड़ या सैर 10 बजे के बाद करें।",
    STAY: "हवा बहुत खराब है। आज बाहर कसरत न करें।",
    UNKNOWN: "इस स्टेशन के लिए अभी भरोसेमंद जानकारी नहीं है। कोई और नज़दीकी स्टेशन चुनें।",
  },
  en: {
    GO: "It's fine to go out.",
    WAIT: "The air is poor right now. It usually clears a little later in the morning, so run or walk after 10 AM.",
    STAY: "The air is very poor. Skip outdoor exercise today.",
    UNKNOWN: "We don't have reliable data for this station right now. Try another nearby station.",
  },
};

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

async function api(path, opts) {
  if (!API) throw new Error("VITE_API_URL was not set when this site was built. Set it in Amplify and redeploy.");
  const r = await fetch(API + path, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}
const post = (path, body) => api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

function ageText(min) {
  if (min == null) return "—";
  if (min < 60) return `${min} ${hi() ? "मिनट" : "min"}`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h} ${hi() ? "घंटे" : "h"}`;
  return `${Math.floor(h / 24)} ${hi() ? "दिन" : "days"}`;
}
const isOld = (s) => s.age_min == null || s.age_min > STALE_MIN;
const icon = {
  pin: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="9.5" r="2.4" fill="currentColor"/></svg>`,
  chev: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  search: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M16 16l4 4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  target: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};

// ---------- the gauge: CPCB bands on a half-dial, estimate drawn as an arc ----------
const BAND_COLORS = ["var(--b0)", "var(--b1)", "var(--b2)", "var(--b3)", "var(--b4)", "var(--b5)"];
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
  let prev = 0;
  const segs = BAND_STOPS.map((u, i) => {
    const p = `<path d="${arc(prev + 2.2, u - 2.2)}" stroke="${BAND_COLORS[i]}" stroke-width="10" fill="none" opacity=".92"/>`;
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
    sub = t("aqi");
  }
  return `<svg class="gauge" viewBox="0 0 240 132" role="img" aria-label="${esc(sub)} ${esc(iv ? `${iv.lo}-${iv.hi}` : c.value ?? "")}">
    ${segs}${over}
    <text x="${CX}" y="${CY - 22}" class="g-num" text-anchor="middle">${centre}</text>
    <text x="${CX}" y="${CY - 2}" class="g-sub" text-anchor="middle">${esc(sub)}</text>
    <text x="${CX - R}" y="${CY + 14}" class="g-tick" text-anchor="middle">0</text>
    <text x="${CX + R}" y="${CY + 14}" class="g-tick" text-anchor="middle">500</text>
  </svg>`;
}

function scale(v) {
  const cur = v == null ? -1 : bandIdx(v);
  let lo = 0;
  return `<div class="scale" aria-label="${esc(t("scaleTitle"))}">
    <p class="scale-t">${t("scaleTitle")}</p>
    <ol>${BAND_STOPS.map((u, i) => {
      const li = `<li class="${i === cur ? "cur" : ""}"><i style="background:${BAND_COLORS[i]}"></i><b>${BAND_NAMES[state.lang][i]}</b><small>${lo === 0 ? 0 : lo + 1}–${u}${u === 500 ? "+" : ""}</small></li>`;
      lo = u;
      return li;
    }).join("")}</ol></div>`;
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
    ${pickerView()}
    <button id="lang" class="lang" aria-label="${hi() ? "Switch to English" : "हिंदी में देखें"}">${hi() ? "English" : "हिंदी"}</button>
    </div></header>
    ${demo ? `<div class="wrap"><div class="demo">◆ ${t("demo")}</div></div>` : ""}
    <main class="wrap">${state.error ? errorView() : state.tab === "card" ? cardView() : boardView()}</main>
    <footer class="wrap foot"><p>${t("honest")}</p><p class="muted">CPCB · WAQI · CAMS (Open-Meteo) · AWS</p></footer>`;
  bind();
  if (state.pickerOpen) { renderPickerList(); document.getElementById("pickq")?.focus(); }
}

// custom station picker: the native <select> list rendered white-on-white in dark mode
function pickerView() {
  const cur = state.stations.find((s) => s.uid === state.uid);
  return `<div class="picker">
    <div class="combo ${state.pickerOpen ? "open" : ""}">
      <button id="pick" class="sel" aria-haspopup="listbox" aria-expanded="${state.pickerOpen}">
        ${icon.pin}<span class="sel-name">${esc(cur?.name || t("loading"))}</span>
        ${cur ? `<span class="sel-age ${isOld(cur) ? "old" : "ok"}">${ageText(cur.age_min)}</span>` : ""}
        <span class="chev">${icon.chev}</span>
      </button>
      ${state.pickerOpen ? `<div class="pop" role="dialog" aria-label="${esc(t("search"))}">
        <label class="pop-search">${icon.search}<input id="pickq" type="search" placeholder="${t("search")}" value="${esc(state.q)}" autocomplete="off" /></label>
        <ul id="picklist" role="listbox"></ul>
        <p class="pop-foot"><span><i class="dot ok"></i>${t("legendFresh")}</span><span><i class="dot old"></i>${t("legendOld")}</span></p>
      </div>` : ""}
    </div>
    <button id="locate" class="icon-btn" title="${t("locate")}" aria-label="${t("locate")}">${icon.target}</button>
  </div>`;
}

function renderPickerList() {
  const ul = document.getElementById("picklist");
  if (!ul) return;
  // keep spaces when matching ("r k" must not hit dwa-rk-a); names starting with the query rank first
  const norm = (x) => x.toLowerCase().replace(/\s+/g, " ").trim();
  const q = norm(state.q), q0 = q.replace(/ /g, "");
  const starts = (s) => norm(s.name).startsWith(q) || norm(s.name).replace(/ /g, "").startsWith(q0);
  const list = !q ? state.stations : state.stations
    .filter((s) => norm(s.name).includes(q) || starts(s))
    .sort((a, b) => starts(b) - starts(a));
  ul.innerHTML = list.length ? list.map((s) => `<li><button class="opt ${s.uid === state.uid ? "cur" : ""}" role="option" aria-selected="${s.uid === state.uid}" data-pick="${s.uid}">
      <i class="dot ${isOld(s) ? "old" : "ok"}"></i><span>${esc(s.name)}</span><small class="${isOld(s) ? "old" : ""}">${ageText(s.age_min)}</small>
      ${s.uid === state.uid ? `<span class="tick">${icon.check}</span>` : ""}</button></li>`).join("")
    : `<li class="empty">${t("noMatch")}</li>`;
  ul.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => pick(Number(b.dataset.pick))));
}

function errorView() {
  return `<section class="panel err"><p class="err-t">${t("offline")}</p><p class="muted small">${esc(state.error)}</p>
    <button id="retry" class="ghost">${t("retry")}</button></section>`;
}

function skeleton() {
  return `<section class="hero sk"><div class="sk-l w40"></div><div class="sk-l w70 big"></div><div class="sk-g"></div><div class="sk-l w90"></div><div class="sk-l w60"></div>
    <p class="muted small center">${t("loading")}</p></section>`;
}

function reason(c) {
  const iv = c.interval, n = esc(c.name), age = ageText(c.age_min);
  if (c.state === "fresh") {
    return hi() ? `${n} पर अभी AQI <b>${c.value}</b> है (${bandName(c.value)})। यह रीडिंग ${age} पुरानी है।`
                : `The AQI at ${n} is <b>${c.value}</b> (${bandName(c.value)}). This reading is ${age} old.`;
  }
  if (!iv) return esc(hi() ? c.sentence_hi : c.sentence_en);
  if (hi() && c.sentence_hi_ai) return esc(c.sentence_hi_ai);
  const nb = iv.n_neighbours;
  const basisHi = nb ? `आस-पास के ${nb} ताज़ा स्टेशनों${iv.used_cams ? " और मौसम मॉडल" : ""}` : "पुरानी रीडिंग";
  const basisEn = nb ? `${nb} nearby fresh stations${iv.used_cams ? " and a weather model" : ""}` : "the old reading";
  return hi() ? `${n} की आख़िरी रीडिंग <b>${age} पुरानी</b> है, इसलिए हमने ${basisHi} से अंदाज़ा लगाया: AQI शायद <b>${iv.lo} से ${iv.hi}</b> के बीच है।`
              : `${n}'s latest reading is <b>${age} old</b>, so we estimated from ${basisEn}: the AQI is probably between <b>${iv.lo} and ${iv.hi}</b>.`;
}

function cardView() {
  const c = state.card;
  if (!c) return skeleton();
  const answer = hi() ? c.answer_hi : c.answer_en;
  const stale = c.state !== "fresh";
  const iv = c.interval;
  const v = iv ? iv.hi : c.value;
  return `<div class="cols"><div class="col-a">
  ${otherHoldView(c)}
  <section class="hero a-${c.answer}">
    <div class="hero-body">
      <div class="hero-text">
        <div class="hero-top">
          <p class="q">${esc(hi() ? c.question_hi : c.question_en)}</p>
          ${c.age_min != null ? `<span class="pill ${stale ? "pill-stale" : "pill-fresh"}"><i></i>${stale ? t("stale") : t("fresh")} · ${ageText(c.age_min)}</span>` : ""}
        </div>
        <h2 class="ans">${esc(answer)}</h2>
        <p class="advice">${ADVICE[state.lang][c.answer] || ""}</p>
        <p class="sent">${reason(c)}</p>
      </div>
      ${v != null ? `<div class="hero-gauge">${gauge(c)}</div>` : ""}
    </div>
    ${v != null ? scale(v) : ""}
  </section>

  <section class="facts ${iv ? "f4" : "f2"}">
    <div><dt>${t("age")}</dt><dd>${ageText(c.age_min)}</dd></div>
    <div><dt>${t("source")}</dt><dd>${t("sourceVal")} <small>(WAQI)</small></dd></div>
    ${iv ? `<div><dt>${t("last")}</dt><dd>AQI ${c.last_value ?? "—"} <small>· ${ageText(c.age_min)} ${t("ago")}</small></dd></div>
            <div><dt>${t("basis")}</dt><dd class="small-dd">${iv.neighbours?.length ? esc(iv.neighbours.join(", ")) : t("onlyOld")}${iv.used_cams ? ` + ${t("model")}` : ""}
              <span class="trust ${iv.calibrated ? "ok" : ""}">${iv.calibrated ? t("trustCal") : t("trustWarm")}</span></dd></div>` : ""}
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

function otherHoldView(c) {
  const h = state.hold;
  if (!h || h.uid === c.uid || h.status !== "PENDING") return "";
  return `<div class="other-hold"><span class="spin"></span><span>${esc(t("otherHold", h.name))}</span>
    <button class="linkish" data-goto="${h.uid}">${t("see")} →</button></div>`;
}

// every Delhi station with the age of its latest reading: the freshness audit at a glance
function stationsView() {
  if (!state.stations.length) return "";
  const fresh = state.stations.filter((s) => !isOld(s)).length;
  return `<section class="panel allst">
    <div class="allst-h"><b>${hi() ? "सभी स्टेशन, अभी" : "All stations, right now"}</b>
      <span class="muted small">${fresh}/${state.stations.length} ${hi() ? "ताज़ा" : "fresh"}</span></div>
    <div class="allst-g">${state.stations.map((s) => {
      const st = s.age_min == null ? "none" : isOld(s) ? "old" : "ok";
      return `<button class="st st-${st} ${s.uid === state.uid ? "cur" : ""}" data-uid="${s.uid}"><i></i><span>${esc(s.name)}</span><small>${ageText(s.age_min)}</small></button>`;
    }).join("")}</div>
  </section>`;
}

function emailView(c, h) {
  if (!c.email_enabled) return "";
  if (h?.email_hint) return `<p class="email-ok">✉ ${esc(t("emailWill", h.email_hint))}</p>`;
  if (h && h.status !== "PENDING") return "";
  return `<label class="email-l" for="email">${t("emailLabel")}</label>
    <div class="email-row"><input id="email" type="email" inputmode="email" autocomplete="email" placeholder="${t("emailPh")}" value="${esc(ls.get("email") || "")}" />
    ${h ? `<button id="addemail" class="ghost">${t("emailAdd")}</button>` : ""}</div>`;
}

function holdView(c) {
  const h = state.hold;
  if (h && h.uid === c.uid) {
    const done = h.status !== "PENDING";
    const ok = h.status === "HIT";
    const verdict = ok ? t("hit") : h.status === "MISSED" ? t("missedBy", h.miss_by) : t("missedWaiting");
    return `<section class="panel receipt ${done ? (ok ? "ok" : "no") : "wait"}">
      <ol class="steps">
        <li class="on"><i></i><span>${t("s1")}</span></li>
        <li class="${done ? "on" : "now"}"><i></i><span>${t("s2")}</span></li>
        <li class="${done ? "on" : ""}"><i></i><span>${t("s3")}</span></li>
      </ol>
      ${done ? `<p class="verdict">${verdict}</p>` : ""}
      <div class="rc-grid">
        <div><dt>${t("said")}</dt><dd>AQI ${Math.round(h.lo)}–${Math.round(h.hi)}</dd></div>
        <div><dt>${t("read")}</dt><dd>${h.actual != null ? `AQI ${Math.round(h.actual)}` : "…"}</dd></div>
      </div>
      ${emailView(c, h)}
      ${done ? `<button id="newhold" class="ghost">${t("newHold")}</button>` : ""}
    </section>`;
  }
  if (c.state === "fresh") {
    const old = state.stations.filter(isOld).slice(0, 4);
    return `<section class="panel fresh-note">
      <p class="fn-t"><span class="fn-ic">${icon.check}</span>${t("freshTitle")}</p>
      <p class="muted">${t("freshText")}</p>
      ${old.length ? `<p class="small fn-l">${t("oldNow")}</p><div class="fn-list">${old.map((s) =>
        `<button class="st st-old" data-uid="${s.uid}"><i></i><span>${esc(s.name)}</span><small>${ageText(s.age_min)}</small></button>`).join("")}</div>` : ""}
    </section>`;
  }
  if (!c.can_hold || !c.interval) return "";
  return `<section class="panel holdbox">
    <h3>${t("holdQ")}</h3>
    <p class="hold-text">${t("holdText", esc(c.name), c.interval.lo, c.interval.hi)}</p>
    <button id="holdbtn" class="cta" ${state.busy ? "disabled" : ""}><span>${state.busy ? t("sending") : t("hold")}</span>${state.busy ? "" : icon.arrow}</button>
    ${emailView(c, null)}
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
  const tip = `${t("said")}: AQI ${d.lo}–${d.hi}${d.actual != null ? ` · ${t("read")}: AQI ${d.actual}` : ""}`;
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
      ${rate != null ? `<div class="t-rate"><b>${rate}%</b><span>${t("rateL")}</span></div>` : ""}
    </div>
    ${b.poll ? `<p class="muted small bh-poll">${t("feedAge")}: ${ageText(Math.floor((b.now - b.poll.at) / 60))} ${t("ago")}</p>` : ""}
  </section>
  ${b.participation ? `<p class="cpcb"><b>CPCB</b> ${esc(b.participation.line)}</p>` : ""}
  ${anyRow ? `<section class="panel grid">
      <div class="g-head"><span></span>${b.dates.map((d) => `<span>${fmt(d)}</span>`).join("")}</div>
      ${b.rows.map((r) => `<div class="g-row"><span class="g-name">${esc(r.name)}</span>${b.dates.map((d) => dot(r.days[d])).join("")}</div>`).join("")}
      <p class="legend"><span class="d d-hit">✓</span>${t("legHit")} <span class="d d-miss">12</span>${t("legMiss")} <span class="d d-pend"></span>${t("legPend")}</p>
    </section>` : `<section class="panel"><p class="muted">${t("nodata")}</p></section>`}`;
}

// ---------- events ----------
function pick(uid) {
  state.pickerOpen = false; state.q = "";
  state.uid = uid; ls.set("uid", uid); state.card = null; render(); loadCard();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function bind() {
  const $ = (id) => document.getElementById(id);
  $("lang")?.addEventListener("click", () => { state.lang = hi() ? "en" : "hi"; ls.set("lang", state.lang); document.documentElement.lang = state.lang; render(); });
  $("pick")?.addEventListener("click", (e) => { e.stopPropagation(); state.pickerOpen = !state.pickerOpen; render(); });
  $("pickq")?.addEventListener("input", (e) => { state.q = e.target.value; renderPickerList(); });
  $("pickq")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.querySelector("#picklist [data-pick]")?.click();
    if (e.key === "ArrowDown") { e.preventDefault(); document.querySelector("#picklist [data-pick]")?.focus(); }
  });
  $("locate")?.addEventListener("click", locate);
  $("retry")?.addEventListener("click", () => init());
  $("holdbtn")?.addEventListener("click", startHold);
  $("addemail")?.addEventListener("click", addEmail);
  document.querySelectorAll("main [data-uid]").forEach((b) => b.addEventListener("click", () => pick(Number(b.dataset.uid))));
  document.querySelectorAll("[data-goto]").forEach((b) => b.addEventListener("click", () => pick(Number(b.dataset.goto))));
  $("newhold")?.addEventListener("click", () => { state.hold = null; ls.set("hold", ""); render(); });
  document.querySelector("details.how")?.addEventListener("toggle", (e) => { state.howOpen = e.target.open; });
  document.querySelectorAll(".seg [data-tab]").forEach((b) => b.addEventListener("click", () => {
    state.tab = b.dataset.tab; render();
    if (state.tab === "board") loadBoard();
  }));
}

// close the picker on an outside click or Escape (registered once, survives re-renders)
document.addEventListener("click", (e) => {
  if (state.pickerOpen && !e.target.closest(".combo")) { state.pickerOpen = false; state.q = ""; render(); }
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.pickerOpen) { state.pickerOpen = false; state.q = ""; render(); document.getElementById("pick")?.focus(); }
});

function locate() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((p) => {
    const { latitude: la, longitude: lo } = p.coords;
    const d = (s) => (s.lat - la) ** 2 + ((s.lon - lo) * Math.cos((la * Math.PI) / 180)) ** 2;
    const best = [...state.stations].sort((a, b) => d(a) - d(b))[0];
    if (best) pick(best.uid);
  });
}

function emailInput() {
  const v = document.getElementById("email")?.value.trim();
  if (v) ls.set("email", v);
  return v || null;
}

async function startHold() {
  const email = emailInput();
  state.busy = true; render();
  try {
    state.hold = await post("/hold", { uid: state.uid, email });
    ls.set("hold", state.hold.id);
  } catch (e) { state.error = e.message; }
  state.busy = false; render();
}

async function addEmail() {
  const email = emailInput();
  if (!email || !state.hold) return;
  try { state.hold = await post("/hold/email", { id: state.hold.id, email }); } catch (e) { state.error = e.message; }
  render();
}

async function loadCard() {
  try {
    state.error = null;
    const [card, st] = await Promise.all([api(`/card?uid=${state.uid}`), api("/stations")]);
    state.card = card; state.stations = st.stations;
  } catch (e) { state.error = e.message; }
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
setInterval(() => { if (state.tab === "card" && !state.busy && !state.pickerOpen) loadCard(); }, 5 * 60 * 1000);
if ("serviceWorker" in navigator && import.meta.env.PROD) navigator.serviceWorker.register("/sw.js").catch(() => {});
