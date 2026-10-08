import { state, set, ls } from "../lib/store.js";
import { t, hi } from "../lib/i18n.js";
import { esc, ageText, isOld, icon, gauge, scale, bandName, bandColor } from "../lib/ui.js";
import { run, loadCard, restoreHold, goStation, startHold, addEmail, toggleSpeak } from "../lib/actions.js";

export function load() {
  const s = Number(state.params.s);
  if (s) { state.uid = s; ls.set("uid", s); }
  if (state.params.pick) state.pickerOpen = true;
  return run(loadCard, restoreHold);
}

export function view() {
  const c = state.card;
  return `<section class="page-head wrap">
      <div><p class="eyebrow">${t("navCheck")}</p><h1 class="page-title">${esc(hi() ? "अभी बाहर जाऊँ?" : "Can I go outside right now?")}</h1></div>
      ${picker()}
    </section>
    <div class="wrap">${c ? card(c) : skeleton()}</div>`;
}

// custom station picker: the native <select> list rendered white-on-white in dark mode
function picker() {
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
  const list = !q ? state.stations : state.stations.filter((s) => norm(s.name).includes(q) || starts(s)).sort((a, b) => starts(b) - starts(a));
  ul.innerHTML = list.length ? list.map((s) => `<li><button class="opt ${s.uid === state.uid ? "cur" : ""}" role="option" aria-selected="${s.uid === state.uid}" data-pick="${s.uid}">
      <i class="dot ${isOld(s) ? "old" : "ok"}"></i><span>${esc(s.name)}</span><small class="${isOld(s) ? "old" : ""}">${ageText(s.age_min)}</small>
      ${s.uid === state.uid ? `<span class="tick">${icon.check}</span>` : ""}</button></li>`).join("")
    : `<li class="empty">${t("noMatch")}</li>`;
  ul.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => goStation(Number(b.dataset.pick))));
}

function skeleton() {
  return `<section class="hero-card sk"><div class="sk-l w40"></div><div class="sk-l w70 big"></div><div class="sk-g"></div><div class="sk-l w90"></div><div class="sk-l w60"></div>
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

// the reasons in plain words: how bad the air is, and how old the number behind it is
function whyList(c) {
  const iv = c.interval, items = [];
  if (iv) items.push(t("whyAirRange", bandName(iv.hi), iv.lo, iv.hi));
  else if (c.value != null) items.push(t("whyAir", bandName(c.value), c.value));
  if (c.age_min != null) items.push(c.state === "fresh" ? t("whyFresh", ageText(c.age_min)) : t("whyStale", ageText(c.age_min)));
  if (!items.length) return `<p class="sent">${reason(c)}</p>`;
  return `<div class="why-box"><p class="why-t">${t("why")}</p><ul class="why">${items.map((x) => `<li>${x}</li>`).join("")}</ul></div>`;
}

function card(c) {
  const stale = c.state !== "fresh";
  const iv = c.interval;
  const v = iv ? iv.hi : c.value;
  return `<div class="cols"><div class="col-a">
  <section class="hero-card a-${c.answer}">
    <div class="hero-body">
      <div class="hero-text">
        <div class="hero-top">
          <p class="q">${esc(c.name)}</p>
          ${c.age_min != null ? `<span class="pill ${stale ? "pill-stale" : "pill-fresh"}"><i></i>${stale ? t("stale") : t("fresh")} · ${ageText(c.age_min)}</span>` : ""}
        </div>
        <h2 class="ans">${t("say")[c.answer]}</h2>
        <p class="advice">${t("advice")[c.answer] || ""}</p>
        ${whyList(c)}
        ${c.answer !== "UNKNOWN" ? `<div class="card-actions">
          <button id="speak" class="btn speak ${state.voice ? "on" : ""}" aria-pressed="${!!state.voice}">${state.voice ? icon.stop : icon.speaker}<span>${state.voice === "loading" ? t("listenLoad") : state.voice ? t("listenStop") : t("listen")}</span></button>
          <a class="btn wa" href="${shareLink(c)}" target="_blank" rel="noopener">${icon.wa}<span>${t("share")}</span></a>
        </div>${state.voiceErr ? `<p class="voice-err">${t("listenFail")}</p>` : ""}` : ""}
      </div>
      ${v != null ? `<div class="hero-gauge">${gauge(c)}</div>` : ""}
    </div>
    ${v != null ? scale(v) : ""}
  </section>

  ${activityView()}
  ${trendView(c)}

  <section class="facts ${iv ? "f4" : "f2"}">
    <div><dt>${t("age")}</dt><dd>${ageText(c.age_min)} ${t("ago")}</dd></div>
    <div><dt>${t("source")}</dt><dd>${t("sourceVal")} <small>(WAQI)</small></dd></div>
    ${iv ? `<div><dt>${t("last")}</dt><dd>AQI ${c.last_value ?? "—"} <small>· ${ageText(c.age_min)} ${t("ago")}</small></dd></div>
            <div><dt>${t("basis")}</dt><dd class="small-dd">${iv.neighbours?.length ? esc(iv.neighbours.join(", ")) : t("onlyOld")}${iv.used_cams ? ` + ${t("model")}` : ""}
              <span class="trust ${iv.calibrated ? "ok" : ""}">${iv.calibrated ? t("trustCal") : t("trustWarm")}</span></dd></div>` : ""}
  </section>

  ${allStations()}
  </div><div class="col-b">
  ${holdView(c)}
  ${c.yesterday ? `<section class="panel yday ${c.yesterday.status === "HIT" ? "ok" : c.yesterday.status === "PENDING" ? "" : "no"}">
      <span class="yd-ic">${c.yesterday.status === "HIT" ? "✓" : c.yesterday.status === "PENDING" ? "…" : "✗"}</span>
      <p>${esc(hi() ? c.yesterday.hi : c.yesterday.en)}</p></section>` : ""}
  ${c.participation ? `<p class="cpcb"><b>CPCB</b> ${esc(c.participation.line)}</p>` : ""}
  <a class="panel link-panel" href="#/about"><span>${icon.book}</span><b>${t("navAbout")}</b><span class="chev-r">${icon.arrow}</span></a>
  </div></div>`;
}

// every Delhi station with the age of its latest reading: the freshness audit at a glance
function allStations() {
  if (!state.stations.length) return "";
  const fresh = state.stations.filter((s) => !isOld(s)).length;
  return `<section class="panel allst">
    <div class="allst-h"><b>${t("allNow")}</b><span class="muted small">${fresh}/${state.stations.length} ${t("freshN")}</span></div>
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
    ${h ? `<button id="addemail" class="btn ghost">${t("emailAdd")}</button>` : ""}</div>`;
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
      ${done ? `<button id="newhold" class="btn ghost">${t("newHold")}</button>` : ""}
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
    <button id="holdbtn" class="btn cta" ${state.busy ? "disabled" : ""}><span>${state.busy ? t("sending") : t("hold")}</span>${state.busy ? "" : icon.arrow}</button>
    <p class="hold-sub">${t("holdSub")}</p>
    ${emailView(c, null)}
  </section>`;
}

export function bind() {
  const $ = (id) => document.getElementById(id);
  $("pick")?.addEventListener("click", (e) => { e.stopPropagation(); set({ pickerOpen: !state.pickerOpen }); });
  $("pickq")?.addEventListener("input", (e) => { state.q = e.target.value; renderPickerList(); });
  $("pickq")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.querySelector("#picklist [data-pick]")?.click();
    if (e.key === "ArrowDown") { e.preventDefault(); document.querySelector("#picklist [data-pick]")?.focus(); }
  });
  $("locate")?.addEventListener("click", locate);
  $("speak")?.addEventListener("click", () => toggleSpeak(spokenFallback(state.card)));
  document.querySelectorAll("[data-act]").forEach((b) => b.addEventListener("click", () => {
    const a = state.activity === b.dataset.act ? "" : b.dataset.act;
    ls.set("activity", a); set({ activity: a });
  }));
  $("holdbtn")?.addEventListener("click", startHold);
  $("addemail")?.addEventListener("click", addEmail);
  $("newhold")?.addEventListener("click", () => { ls.set("hold", ""); set({ hold: null }); });
  document.querySelectorAll("main [data-uid]").forEach((b) => b.addEventListener("click", () => goStation(Number(b.dataset.uid))));
  if (state.pickerOpen) { renderPickerList(); $("pickq")?.focus(); }
}

function locate() {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((p) => {
    const { latitude: la, longitude: lo } = p.coords;
    const d = (s) => (s.lat - la) ** 2 + ((s.lon - lo) * Math.cos((la * Math.PI) / 180)) ** 2;
    const best = [...state.stations].sort((a, b) => d(a) - d(b))[0];
    if (best) goStation(best.uid);
  });
}

// ---------- share on WhatsApp: the way Delhi families actually pass this on ----------
export function shareLink(c) {
  const iv = c.interval;
  const air = iv ? t("shareAirRange", bandName(iv.hi), iv.lo, iv.hi) : c.value != null ? t("shareAir", bandName(c.value), c.value) : "";
  const url = `${location.origin}${location.pathname}#/check?s=${c.uid}`;
  const msg = t("shareMsg", t("say")[c.answer], c.name, air, ageText(c.age_min), url).replace(/<[^>]+>/g, "");
  return `https://wa.me/?text=${encodeURIComponent(msg)}`;
}

// ---------- "what will you do outside?": explains, never changes the verdict ----------
export function activityView() {
  const a = state.activity;
  return `<section class="panel act">
    <p class="act-q">${t("actQ")}</p>
    <div class="chips">${t("acts").map(([k, label]) => `<button class="chip-btn ${a === k ? "on" : ""}" data-act="${k}" aria-pressed="${a === k}">${label}</button>`).join("")}</div>
    ${a ? `<p class="act-say">${t("actSay")[a]}</p><p class="act-note">${t("actNote")}</p>` : ""}
  </section>`;
}

// ---------- last 24 hours: the line stops where the station went quiet ----------
export function trendView(c) {
  const h = state.history;
  if (!h) return "";
  const W = 640, H = 150, L = 36, R = 12, T = 12, B = 26;
  const t0 = h.now - h.hours * 3600, x = (ts) => L + ((ts - t0) / (h.hours * 3600)) * (W - L - R);
  const pts = h.points;
  const top = Math.max(300, ...pts.map((p) => p.aqi + 20));
  const y = (v) => T + (1 - v / top) * (H - T - B);
  const bands = [[0, 100, "var(--b1)"], [100, 200, "var(--b2)"], [200, 300, "var(--b3)"], [300, top, "var(--b4)"]]
    .map(([a, b, col]) => `<rect x="${L}" y="${y(b)}" width="${W - L - R}" height="${y(a) - y(b)}" fill="${col}" opacity=".08"/>`).join("");
  const ticks = [100, 200, 300].map((v) => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="tr-grid"/><text x="${L - 6}" y="${y(v) + 4}" text-anchor="end" class="tr-t">${v}</text>`).join("");
  // break the line wherever readings are more than 2 hours apart
  let d = "", prev = null;
  for (const p of pts) { d += `${!prev || p.ts - prev.ts > 2 * 3600 ? "M" : "L"}${x(p.ts).toFixed(1)} ${y(p.aqi).toFixed(1)} `; prev = p; }
  const last = pts[pts.length - 1];
  const gapFrom = last ? last.ts : t0;
  const gapMin = Math.floor((h.now - gapFrom) / 60);
  const gap = gapMin > 180 ? `<rect x="${x(gapFrom)}" y="${T}" width="${W - R - x(gapFrom)}" height="${H - T - B}" class="tr-gap"/>
    <text x="${(x(gapFrom) + W - R) / 2}" y="${(T + H - B) / 2 + 4}" text-anchor="middle" class="tr-gap-t">${esc(last ? t("trendGap", ageText(gapMin)) : t("trendNone"))}</text>` : "";
  const dots = pts.map((p) => `<circle cx="${x(p.ts).toFixed(1)}" cy="${y(p.aqi).toFixed(1)}" r="2.6" fill="${bandColor(p.aqi)}"><title>AQI ${p.aqi}</title></circle>`).join("");
  return `<section class="panel trend">
    <div class="tr-h"><b>${t("trendTitle")}</b><span class="muted small">AQI · ${esc(c.name)}</span></div>
    <svg class="trend-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t("trendTitle"))}">
      ${bands}${ticks}${gap}
      <path d="${d}" class="tr-line"/>${dots}
      <text x="${L}" y="${H - 6}" class="tr-t">${t("trendStart")}</text><text x="${W - R}" y="${H - 6}" text-anchor="end" class="tr-t">${t("trendNow")}</text>
    </svg>
  </section>`;
}

// browser-voice fallback script (used only if the Polly voice cannot be fetched)
function spokenFallback(c) {
  if (!c) return "";
  const iv = c.interval;
  const bits = [c.name, t("say")[c.answer], t("advice")[c.answer]];
  if (iv) bits.push(t("whyAirRange", bandName(iv.hi), iv.lo, iv.hi));
  else if (c.value != null) bits.push(t("whyAir", bandName(c.value), c.value));
  if (c.age_min != null) bits.push(c.state === "fresh" ? t("whyFresh", ageText(c.age_min)) : t("whyStale", ageText(c.age_min)));
  return bits.join(". ").replace(/<[^>]+>/g, "").replace(/\u2013/g, " - ");
}
