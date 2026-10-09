// For schools: set up once, then one plan every school morning, one tap to log what was done,
// and a 30-day record. The plan is decided on the server (fixed table on the CPCB bands).
import "../school.css";
import { state, set, ls } from "../lib/store.js";
import { t, hi, T } from "../lib/i18n.js";
import { esc, ageText, icon, fireView, fireText } from "../lib/ui.js";
import { api, post } from "../lib/api.js";
import { run, loadStations } from "../lib/actions.js";
import { pickerView, bindPicker } from "../lib/picker.js";

const ACTIVITIES = ["assembly", "pe", "recess", "sensitive"];
const ACTIONS = ["followed", "outdoor", "closed"];

// the school's id and key live on this device only; no account
const creds = () => { try { return JSON.parse(ls.get("school") || "null"); } catch { return null; } };
const saveCreds = (c) => ls.set("school", c ? JSON.stringify(c) : "");
const ident = () => { const c = creds(); return { id: c?.id, k: c?.k }; };

const form = { name: "", uid: null, email: "", place: null, auto: false };
const NEAR_KM = 8; // beyond this, say the station's air may differ from the school's
const edit = { open: false, name: "", uid: null, email: "", copied: false };
let note = null; // { text, ok } one line under the header: confirmed, saved, link expired

export function load() {
  const p = state.params;
  // links from emails carry the key: keep it on the device, then take it out of the address bar
  if (p.id && p.k) { saveCreds({ id: p.id, k: p.k }); history.replaceState(null, "", "#/school"); }
  const token = p.confirm;
  state.params = {};
  return run(loadStations, () => loadSchool(token));
}

async function loadSchool(token) {
  const c = creds();
  if (!c) { state.school = null; return; }
  try {
    if (token) {
      try {
        state.school = await post("/school/confirm", { ...ident(), token });
        note = { text: t("scConfirmed"), ok: true };
        return;
      } catch { note = { text: t("scConfirmBad"), ok: false }; }
    }
    state.school = await api(`/school?id=${encodeURIComponent(c.id)}&k=${encodeURIComponent(c.k)}`);
  } catch (e) {
    if (!/unknown school/.test(e.message)) throw e;
    saveCreds(null);
    state.school = null;
    note = { text: t("scGone"), ok: false };
  }
}

export function unmount() { note = null; edit.open = false; }

// ---------- formatting ----------
const fmtDate = (d, lang = state.lang) => new Date(`${d}T12:00:00+05:30`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const fmtTime = (ts) => new Date(ts * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
const lv = (d) => d.level ?? "none";

function basis(d, lang = state.lang) {
  const L = T[lang], b = d.basis, st = esc(d.station), age = ageText(b.age_min, lang);
  if (b.state === "fresh") return L.scBasisFresh(st, b.value, age);
  if (b.hi == null) return L.scBasisNone(st, age);
  return b.n_neighbours ? L.scBasisStale(st, b.lo, b.hi, age, b.n_neighbours) : L.scBasisOld(st, b.lo, b.hi, age);
}

const STATUS_IC = { out: icon.check, limit: icon.clock, in: icon.home };
export function planRows(plan) {
  return `<ul class="sc-plan">${ACTIVITIES.map((a) => `<li><span>${t("scRows")[a]}</span>
    <b class="st-${plan[a]}">${STATUS_IC[plan[a]]}${t("scStatus")[plan[a]]}</b></li>`).join("")}</ul>`;
}

// ---------- views ----------
export function view() {
  if (state.school) return dashboard(state.school);
  if (creds()) return `${head(t("scTitle"))}<div class="wrap"><div class="panel sk"><div class="sk-l w40"></div><div class="sk-l big w90"></div><div class="sk-g"></div></div></div>`;
  return signup();
}

function head(title, sub = "") {
  return `<section class="page-head wrap"><div><p class="eyebrow">${t("navSchool")}</p><h1 class="page-title">${title}</h1>${sub}</div></section>
  ${note ? `<div class="wrap"><p class="sc-note ${note.ok ? "ok" : ""}">${esc(note.text)}</p></div>` : ""}`;
}

function signup() {
  if (form.uid == null) form.uid = state.uid;
  return `${head(t("scTitle"), `<p class="page-lead">${t("scLead")}</p>`)}
  <div class="wrap sc-signup">
    <form id="scform" class="panel sc-form" novalidate>
      <h2 class="h2s">${t("scFormTitle")}</h2>
      <div class="fld sc-find"><label for="scname">${t("scFind")}</label>
        <input id="scname" name="name" required minlength="2" maxlength="80" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="scsugg" aria-expanded="false" placeholder="${esc(t("scFindPh"))}" value="${esc(form.name)}" />
        <div id="scsugg" class="sc-sugg" hidden></div>
        <small id="scaddr">${form.place?.address ? `<span class="sc-addr">${icon.pin}${esc(form.place.address)}</span>` : t("scFindHint")}</small></div>
      <div class="fld"><span>${t("scStation")}</span>${pickerView(form.uid)}<small>${stationHint()}</small></div>
      ${state.emailEnabled ? `<label class="fld"><span>${t("scEmail")}</span>
        <input id="scemail" type="email" inputmode="email" autocomplete="email" placeholder="${t("scEmailPh")}" value="${esc(form.email)}" />
        <small>${t("scEmailHint")}</small></label>` : ""}
      <button class="btn cta" type="submit" ${state.busy ? "disabled" : ""}><span>${state.busy ? t("scCreating") : t("scCreate")}</span>${state.busy ? "" : icon.arrow}</button>
      <p class="muted small">${t("scNoLogin")}</p>
    </form>
    <ol class="sc-get">${t("scGet").map(([h, p], i) => `<li><span class="num">0${i + 1}</span><div><h3>${h}</h3><p>${p}</p></div></li>`).join("")}</ol>
  </div>`;
}

// ---------- school search (Amazon Location Service on AWS) -> nearest station ----------
const toRad = (d) => (d * Math.PI) / 180;
function km(a, b) {
  const h = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
const round1 = (x) => Math.round(x * 10) / 10;
// nearest station that has sent at least one number; an old number is fine, it gets an estimate
const nearest = (p) => state.stations.filter((s) => s.age_min != null && s.lat).sort((a, b) => km(p, a) - km(p, b))[0];

function stationHint() {
  const st = state.stations.find((s) => s.uid === form.uid);
  if (!form.place || !st) return t("scStationHint");
  const d = round1(km(form.place, st));
  return `${form.auto ? t("scNearAuto", d) : t("scNearManual", d)}${d > NEAR_KM ? ` <b class="sc-far">${t("scFar")}</b>` : ""}`;
}

let findTimer = null, findSeq = 0;
function find(q) {
  clearTimeout(findTimer);
  const box = document.getElementById("scsugg");
  if (q.trim().length < 3) { showSugg(box, null); return; }
  findTimer = setTimeout(async () => {
    const seq = ++findSeq;
    showSugg(box, `<p class="sc-sugg-msg">${t("scSearching")}</p>`);
    let r;
    try { r = await api(`/places?q=${encodeURIComponent(q.trim())}`); } catch { r = { results: [] }; }
    if (seq !== findSeq) return; // a newer search is on its way
    const list = r.results || [];
    showSugg(box, list.length
      ? `<ul role="listbox">${list.map((p, i) => `<li><button type="button" class="sc-opt" role="option" data-i="${i}">
          <span class="sc-opt-ic">${p.school ? icon.school : icon.pin}</span><span><b>${esc(p.name)}</b><small>${esc(p.address)}</small></span></button></li>`).join("")}</ul>
         <p class="sc-sugg-src">${t("scSrc", esc(r.source))}</p>`
      : `<p class="sc-sugg-msg">${t("scNoPlace")}</p>`);
    box.querySelectorAll(".sc-opt").forEach((b) => {
      b.addEventListener("pointerdown", (e) => e.preventDefault()); // keep focus in the box, so a tap isn't lost to blur
      b.addEventListener("click", () => choose(list[Number(b.dataset.i)]));
    });
  }, 350);
}

function showSugg(box, html) {
  if (!box) return;
  box.hidden = !html;
  box.innerHTML = html || "";
  document.getElementById("scname")?.setAttribute("aria-expanded", String(!!html));
}

function choose(p) {
  const st = nearest(p);
  Object.assign(form, { name: p.name, place: { lat: p.lat, lon: p.lon, address: p.address } });
  if (st) Object.assign(form, { uid: st.uid, auto: true });
  set({ pickerOpen: false, q: "" });
}

function dashboard(v) {
  const s = v.school;
  const sub = `<p class="page-lead sc-sub">${icon.pin}<span>${esc(s.station || "")}${s.station_km != null ? ` · ${t("scKmFrom", s.station_km)}` : ""}</span><a href="#/check?s=${s.uid}">${t("scLive")} ${icon.arrow}</a></p>`;
  return `${head(esc(s.name), sub)}
  <div class="wrap sc-cols">
    <div class="sc-main">${today(v)}${logPanel(v)}</div>
    <aside class="sc-side">${emailPanel(v)}${fireView(v.today?.fires)}${rulePanel()}</aside>
  </div>
  <section class="wrap sc-rec">${record(v)}</section>
  <section class="wrap sc-set-w">${settings(v)}</section>
  ${printCard(v)}`;
}

function today(v) {
  const d = v.today;
  if (!d) {
    const last = v.days[0];
    return `<section class="hero-card sc-today lv-none">
      <div class="hero-top"><p class="q">${t("scToday")}</p><span class="pill">${icon.clock}${v.decides_at}</span></div>
      <h2 class="ans">${t("scPending")}</h2>
      <p class="advice">${t("scPendingSub")}</p>
      ${last ? `<p class="sc-basis">${t("scLast", fmtDate(last.date))} ${t("scHead")[lv(last)]}</p>` : ""}
    </section>`;
  }
  return `<section class="hero-card sc-today lv-${lv(d)}">
    <div class="hero-top"><p class="q">${t("scToday")} · ${fmtDate(d.date)}</p><span class="pill">${icon.clock}${t("scDecided", fmtTime(d.decided_ts))}</span></div>
    <h2 class="ans">${t("scHead")[lv(d)]}</h2>
    ${d.plan ? planRows(d.plan) : `<p class="advice">${t("scNoneSub")}</p>`}
    <p class="sc-basis">${basis(d)}</p>
    <div class="sc-share">
      <a class="btn wa" href="${share(v, d)}" target="_blank" rel="noopener">${icon.wa}<span>${t("scShare")}</span></a>
      <button id="scprint" type="button" class="btn wa">${icon.print}<span>${t("scPrint")}</span></button>
    </div>
  </section>`;
}

// ---------- the notice-board card: one A4 page in the language the page is in ----------
// Rendered with the page but shown only when printing (see school.css @media print).
function printCard(v) {
  const d = v.today;
  if (!d) return "";
  const l = lv(d);
  const rows = d.plan ? ACTIVITIES.map((a) => `<tr>
      <th>${t("scRows")[a]}</th>
      <td><span class="st-${d.plan[a]}">${t("scStatus")[d.plan[a]]}</span></td></tr>`).join("") : "";
  return `<article class="sc-print lv-${l}" aria-hidden="true">
    <header><b>${esc(v.school.name)}</b><span>${fmtDate(d.date)}</span></header>
    ${state.demo ? `<p class="pr-demo">${t("demo")}</p>` : ""}
    <h1>${t("scHead")[l]}</h1>
    ${rows ? `<table>${rows}</table>` : `<p>${t("scNoneSub")}</p>`}
    <div class="pr-basis"><p>${basis(d)}</p>${d.fires ? `<p>${fireText(d.fires)}</p>` : ""}</div>
    <footer><span>${t("brand")} · ${t("scDecided", fmtTime(d.decided_ts))}</span><span>${t("scHonest")}</span></footer>
  </article>`;
}

// the WhatsApp text carries the plan, never the page link (that link holds the school's key)
function share(v, d) {
  const rows = d.plan ? ACTIVITIES.map((a) => `${t("scRows")[a]}: ${t("scStatus")[d.plan[a]]}`).join("\n") : t("scNoneSub");
  const msg = t("scShareMsg", v.school.name, fmtDate(d.date), t("scHead")[lv(d)], rows, basis(d));
  return `https://wa.me/?text=${encodeURIComponent(msg.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&"))}`;
}

function logPanel(v) {
  const d = v.today;
  if (!d) return "";
  return `<section class="panel sc-log">
    <p class="act-q">${t("scLogQ")}</p>
    <div class="sc-acts">${ACTIONS.map((a) => `<button type="button" class="sc-act ${d.action === a ? "on" : ""}" data-act="${a}" aria-pressed="${d.action === a}" ${state.busy ? "disabled" : ""}>${d.action === a ? icon.check : ""}${t("scActs")[a]}</button>`).join("")}</div>
    ${d.action ? `<p class="muted small">${t("scLogged")}</p>` : ""}
  </section>`;
}

function emailPanel(v) {
  const s = v.school;
  const text = !v.email_enabled ? t("scEmailOff") : !s.email_hint ? t("scEmailNone")
    : s.email_confirmed ? t("scEmailOn", esc(s.email_hint)) : t("scEmailWait", esc(s.email_hint));
  const on = v.email_enabled && s.email_hint && s.email_confirmed;
  return `<section class="panel sc-mail ${on ? "on" : ""}"><p class="sc-mail-t">${on ? icon.check : icon.clock}<b>${t("scEmailTitle")}</b></p><p>${text}</p></section>`;
}

function rulePanel() {
  return `<section class="panel sc-rules">
    <h2 class="h2s">${t("scRuleTitle")}</h2>
    <ul>${t("scRules").map(([r, b, a], i) => `<li class="lv-${i}"><i></i><div><b>AQI ${r}</b><small>${esc(b)}</small><span>${esc(a)}</span></div></li>`).join("")}</ul>
    <p class="muted small">${t("scRuleNote")}</p>
  </section>`;
}

function gradeCell(d) {
  if (d.basis.state === "fresh") return `<span class="sc-gr">${t("scGrade").measured}</span>`;
  const g = d.grade;
  if (!g) return `<span class="sc-gr">—</span>`;
  const txt = g.status === "MISSED" ? t("scGrade").MISSED(g.miss_by) : t("scGrade")[g.status];
  const cls = { HIT: "ok", MISSED: "no" }[g.status] || "";
  return `<span class="sc-gr ${cls}" title="AQI ${d.basis.lo}–${d.basis.hi}${g.actual != null ? ` → ${g.actual}` : ""}">${txt}</span>`;
}

function record(v) {
  const m = v.summary;
  return `<div class="sec-head"><h2 class="h2s">${t("scRecTitle")}</h2><p class="muted sc-rec-lead">${t("scRecLead")}</p></div>
  <div class="panel">
    <div class="ledger sc-ledger">
      <div><b>${m.bad_days}</b><span>${t("scSumBad")}</span></div>
      <div><b>${m.bad_days ? `${m.followed}/${m.bad_days}` : "—"}</b><span>${t("scSumFollowed")}</span></div>
      <div><b>${m.est_graded ? `${m.est_hits}/${m.est_graded}` : "—"}</b><span>${t("scSumEst")}</span></div>
    </div>
    <ol class="sc-days">${v.days.map((d) => `<li>
      <time>${fmtDate(d.date)}</time>
      <span class="sc-chip lv-${lv(d)}"><i></i>${t("scLevel")[lv(d)]}</span>
      <span class="sc-did ${d.action || "none"}">${d.action ? t("scActs")[d.action] : t("scNoAction")}</span>
      ${gradeCell(d)}
    </li>`).join("")}</ol>
    ${v.days.length <= 1 ? `<p class="muted small sc-empty">${t("scEmpty")}</p>` : ""}
    <p class="muted small sc-honest">${t("scHonest")}</p>
  </div>`;
}

function settings(v) {
  const s = v.school;
  if (!edit.open) Object.assign(edit, { name: s.name, uid: s.uid, email: "" });
  const link = `${location.origin}${location.pathname}#/school?id=${encodeURIComponent(s.id)}&k=${encodeURIComponent(creds()?.k || "")}`;
  return `<details id="scset" class="panel sc-set" ${edit.open ? "open" : ""}>
    <summary><b>${t("scSettings")}</b><span class="chev">${icon.chev}</span></summary>
    <form id="scedit" class="sc-form" novalidate>
      <label class="fld"><span>${t("scName")}</span><input id="edname" required minlength="2" maxlength="80" value="${esc(edit.name)}" /></label>
      <div class="fld"><span>${t("scStation")}</span>${pickerView(edit.uid)}</div>
      ${v.email_enabled ? `<label class="fld"><span>${t("scEmail")}</span>
        <input id="edemail" type="email" inputmode="email" autocomplete="email" placeholder="${esc(s.email_hint || t("scEmailPh"))}" value="${esc(edit.email)}" />
        <small>${s.email_hint ? t("scEmailKeep") : t("scEmailHint")}</small></label>` : ""}
      <p class="muted small">${t("scLangNote")}</p>
      <div class="sc-row">
        <button class="btn ink" type="submit" ${state.busy ? "disabled" : ""}>${t("scSave")}</button>
        ${s.email_hint ? `<button id="stopmail" class="btn ghost" type="button">${t("scStopEmail")}</button>` : ""}
      </div>
    </form>
    <div class="sc-link">
      <p><b>${t("scLinkTitle")}</b></p>
      <p class="muted small">${t("scLinkText")}</p>
      <div class="email-row"><input id="sclink" readonly value="${esc(link)}" /><button id="copylink" class="btn ghost" type="button">${edit.copied ? t("scCopied") : t("scCopy")}</button></div>
    </div>
    <button id="scremove" class="sc-remove" type="button">${t("scRemove")}</button>
  </details>`;
}

// ---------- actions ----------
async function call(path, body, then) {
  note = null;
  set({ busy: true });
  try { state.school = await post(path, { ...ident(), ...body }); then?.(); } catch (e) { note = { text: e.message, ok: false }; }
  set({ busy: false });
}

async function signupSubmit(e) {
  e.preventDefault();
  const name = form.name.trim();
  if (name.length < 2) { document.getElementById("scname")?.focus(); return; }
  set({ busy: true });
  try {
    const r = await post("/school", { name, uid: form.uid, email: form.email.trim() || null, lang: state.lang, place: form.place });
    saveCreds({ id: r.school.id, k: r.key });
    state.school = r;
    note = null;
    Object.assign(form, { name: "", email: "", place: null, auto: false });
    window.scrollTo(0, 0);
  } catch (err) { note = { text: err.message, ok: false }; }
  set({ busy: false });
}

function editSubmit(e) {
  e.preventDefault();
  const body = { name: edit.name, uid: edit.uid, lang: state.lang };
  if (edit.email.trim()) body.email = edit.email.trim();
  call("/school/edit", body, () => { note = { text: t("scSaved"), ok: true }; edit.open = false; edit.email = ""; });
}

export function bind() {
  const $ = (id) => document.getElementById(id);
  if (!state.school) {
    $("scname")?.addEventListener("input", (e) => {
      if (form.place) { form.place = null; form.auto = false; $("scaddr").textContent = t("scFindHint"); }
      form.name = e.target.value;
      find(form.name);
    });
    $("scname")?.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); document.querySelector("#scsugg .sc-opt")?.focus(); }
      if (e.key === "Escape") showSugg($("scsugg"), null);
    });
    // close the suggestions when focus leaves the search box and its list
    document.querySelector(".sc-find")?.addEventListener("focusout", (e) => {
      if (!e.currentTarget.contains(e.relatedTarget)) setTimeout(() => showSugg($("scsugg"), null), 120);
    });
    $("scemail")?.addEventListener("input", (e) => { form.email = e.target.value; });
    $("scform")?.addEventListener("submit", signupSubmit);
    bindPicker(form.uid, (uid) => { form.uid = uid; form.auto = false; set({ pickerOpen: false, q: "" }); });
    return;
  }
  document.querySelectorAll(".sc-act").forEach((b) => b.addEventListener("click", () => {
    const d = state.school.today;
    call("/school/log", { date: d.date, action: d.action === b.dataset.act ? null : b.dataset.act });
  }));
  $("scprint")?.addEventListener("click", () => window.print());
  $("scset")?.addEventListener("toggle", (e) => { edit.open = e.target.open; });
  $("edname")?.addEventListener("input", (e) => { edit.name = e.target.value; });
  $("edemail")?.addEventListener("input", (e) => { edit.email = e.target.value; });
  $("scedit")?.addEventListener("submit", editSubmit);
  bindPicker(edit.uid, (uid) => { edit.uid = uid; set({ pickerOpen: false, q: "" }); });
  $("stopmail")?.addEventListener("click", () => call("/school/edit", { email: "" }, () => { note = { text: t("scSaved"), ok: true }; }));
  $("copylink")?.addEventListener("click", async () => {
    const inp = $("sclink");
    try { await navigator.clipboard.writeText(inp.value); } catch { inp.select(); document.execCommand?.("copy"); }
    edit.copied = true; set({});
    setTimeout(() => { edit.copied = false; if (state.route === "school") set({}); }, 2000);
  });
  $("scremove")?.addEventListener("click", async () => {
    if (!confirm(t("scRemoveQ"))) return;
    set({ busy: true });
    try { await post("/school/delete", ident()); saveCreds(null); state.school = null; note = null; edit.open = false; }
    catch (e) { note = { text: e.message, ok: false }; }
    set({ busy: false });
  });
}
