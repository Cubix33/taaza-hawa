// Bad-air plan (#/plan; #/school still opens it). A school, an outdoor work team or a community sets
// up once, then every morning gets one plan (made on the server from a fixed table on the CPCB bands).
//
// One column, read top to bottom:
//   header           name, what kind, where; Edit; the plans kept on this phone; New plan
//   Today's air      the headline, what it means for each activity or work place, where it comes from
//   Things to do     the person in charge ticks each suggested action; the time is saved
//   Tell people      email draft, WhatsApp, print; a work team's page for its workers; optional email
//   Last 30 days     one line per morning
//   More             how the plan is decided, open on another phone, remove
import "../plan.css";
import { state, set, ls } from "../lib/store.js";
import { t, T } from "../lib/i18n.js";
import { esc, ageText, icon, fireText, bandName, accent } from "../lib/ui.js";
import { api, post } from "../lib/api.js";
import { run, loadStations } from "../lib/actions.js";
import { pickerView, bindPicker } from "../lib/picker.js";

const KINDS = ["school", "work", "community"];
const ROWS = { school: ["assembly", "pe", "recess", "sensitive"], community: ["events", "walks", "sensitive"] };
const NEAR_KM = 8; // beyond this, say the station's air may differ from the place's
const MAX_ZONES = 3;

// ---------- the plans kept on this phone (id + key each; no account) ----------
function plans() {
  let list = [];
  try { list = JSON.parse(ls.get("plans") || "[]"); } catch { list = []; }
  try { // one-time move from the single-plan key the first version used
    const old = JSON.parse(ls.get("school") || "null");
    if (old?.id && !list.some((p) => p.id === old.id)) { list.push({ id: old.id, k: old.k, name: "", kind: "" }); ls.set("plans", JSON.stringify(list)); }
    if (old) ls.set("school", "");
  } catch { /* nothing to move */ }
  return list;
}
const savePlans = (list) => ls.set("plans", JSON.stringify(list));
function current() {
  const list = plans(), id = ls.get("plan");
  return list.find((p) => p.id === id) || list[0] || null;
}
function remember(v, key) {
  const s = v.school, list = plans();
  const i = list.findIndex((p) => p.id === s.id);
  const entry = { id: s.id, k: key ?? list[i]?.k, name: s.name, kind: s.kind || "school" };
  if (i >= 0) list[i] = entry; else list.push(entry);
  savePlans(list);
  ls.set("plan", s.id);
}
function forget(id) {
  savePlans(plans().filter((p) => p.id !== id));
  if (ls.get("plan") === id) ls.set("plan", "");
}
const ident = () => { const c = current(); return { id: c?.id, k: c?.k }; };

// what is being set up (`form`) or edited (`chg`)
const blank = () => ({ kind: "school", name: "", uid: null, place: null, auto: false, zones: [], shift: [8, 18] });
const form = blank();
const chg = { ...blank(), open: false };
let creating = false; // "New plan" while another plan is open
let mineOpen = false; // the "My plans" list is showing
let note = null;      // { text, ok } one line under the header
let mailEdit = false; // the automatic-email box is showing its address field
let copied = "";      // which copy button just copied

export function load() {
  const p = state.params;
  // links from emails carry the key: keep it on this phone, then take it out of the address bar
  if (p.id && p.k) {
    const list = plans();
    if (!list.some((x) => x.id === p.id)) { list.push({ id: p.id, k: p.k, name: "", kind: "" }); savePlans(list); }
    ls.set("plan", p.id);
    history.replaceState(null, "", "#/plan");
  }
  const token = p.confirm;
  state.params = {};
  if (!creating) state.school = null; // never show one plan's page while another loads
  return run(loadStations, () => loadPlan(token));
}

async function loadPlan(token) {
  const c = current();
  if (!c || creating) { state.school = null; return; }
  try {
    if (token) {
      try {
        state.school = await post("/school/confirm", { id: c.id, k: c.k, token });
        note = { text: t("scConfirmed"), ok: true };
        remember(state.school);
        return;
      } catch { note = { text: t("scConfirmBad"), ok: false }; }
    }
    state.school = await api(`/school?id=${encodeURIComponent(c.id)}&k=${encodeURIComponent(c.k)}`);
    remember(state.school);
  } catch (e) {
    if (!/unknown school/.test(e.message)) throw e;
    forget(c.id);
    state.school = null;
    note = { text: t("scGone"), ok: false };
    if (current()) return loadPlan();
  }
}

export function unmount() { note = null; chg.open = false; mailEdit = false; creating = false; }

// ---------- formatting ----------
const fmtDate = (d, lang = state.lang) => new Date(`${d}T12:00:00+05:30`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-IN", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const fmtTime = (ts) => new Date(ts * 1000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
const hh = (h) => `${String(h).padStart(2, "0")}:00`;
const lv = (d) => d.level ?? "none";
const plain = (s) => s.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
const kindOf = (v) => v.school.kind || "school";
const stationName = (n) => String(n || "").replace(/(, Delhi)+, India$/, ""); // "Alipur, Delhi, Delhi, India" -> "Alipur"

export function headFor(kind, level) {
  if (kind === "work") return t("scHeadWork")[level];
  if (kind === "community") return t("scHeadCommunity")[level];
  return t("scHead")[level];
}
const rowName = (kind, a) => (kind === "community" ? t("scRowsCommunity")[a] : t("scRows")[a]);
const honest = (kind) => (kind === "school" ? t("scHonest") : t("scHonestPlace"));

function basis(d, lang = state.lang) {
  const L = T[lang], b = d.basis, st = esc(stationName(d.station)), age = ageText(b.age_min, lang);
  if (b.state === "fresh") return L.scBasisFresh(st, b.value, age);
  if (b.hi == null) return L.scBasisNone(st, age);
  return b.n_neighbours ? L.scBasisStale(st, b.lo, b.hi, age, b.n_neighbours) : L.scBasisOld(st, b.lo, b.hi, age);
}

const STATUS_IC = { out: icon.check, limit: icon.clock, in: icon.home };
export function planRows(plan, kind = "school") {
  return `<ul class="sc-plan">${ROWS[kind].map((a) => `<li><span>${rowName(kind, a)}</span>
    <b class="st-${plan[a]}">${STATUS_IC[plan[a]]}${t("scStatus")[plan[a]]}</b></li>`).join("")}</ul>`;
}

// a work team's places: each with its station, how bad the air is there, and how old the number is
export function zoneRows(zones) {
  return `<ul class="sc-plan sc-zones">${zones.map((z) => {
    const v = z.basis.hi ?? z.basis.value;
    return `<li><span><b class="sc-zname">${esc(z.name)}</b><small>${esc(stationName(z.station))} · ${ageText(z.basis.age_min)} ${t("ago")}</small></span>
      <b class="lvchip lv-${z.level ?? "none"}"><i></i>${v != null ? `${bandName(v)} · AQI ${z.basis.hi != null ? `${z.basis.lo}–${z.basis.hi}` : v}` : "—"}</b></li>`;
  }).join("")}</ul>`;
}

// ---------- views ----------
export function view() {
  if (state.school && !creating) return dashboard(state.school);
  if (current() && !creating) return `<section class="page-head wrap pl-head"><div><p class="eyebrow">${t("navSchool")}</p></div></section>
    <div class="wrap pl"><div class="panel sk"><div class="sk-l w40"></div><div class="sk-l big w90"></div><div class="sk-g"></div></div></div>`;
  return signup();
}

const KIND_IC = { school: icon.school, work: icon.helmet, community: icon.people };

function noteLine() {
  return note ? `<p class="sc-note ${note.ok ? "ok" : ""}">${esc(note.text)}</p>` : "";
}

function kindPicker(m) {
  return `<fieldset class="sc-kinds"><legend>${t("scKindQ")}</legend>
    ${KINDS.map((k) => `<label class="sc-kind ${m.kind === k ? "on" : ""}"><input type="radio" name="sckind" value="${k}" ${m.kind === k ? "checked" : ""}/>
      <span class="sc-kind-ic">${KIND_IC[k]}</span><span><b>${t("scKinds")[k][0]}</b><small>${t("scKinds")[k][1]}</small></span></label>`).join("")}
  </fieldset>`;
}

// a school or community: search by name, then the nearest station is chosen
function placeFields(m) {
  const com = m.kind === "community";
  return `<div class="fld sc-find"><label for="scname">${com ? t("scFindCommunity") : t("scFind")}</label>
      <input id="scname" name="name" required minlength="2" maxlength="80" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="scsugg" aria-expanded="false" placeholder="${esc(com ? t("scFindPhCommunity") : t("scFindPh"))}" value="${esc(m.name)}" />
      <div id="scsugg" class="sc-sugg" hidden></div>
      <small id="scaddr">${m.place?.address ? `<span class="sc-addr">${icon.pin}${esc(m.place.address)}</span>` : t("scFindHint")}</small></div>
    <div class="fld"><span>${t("scStation")}</span>${pickerView(m.uid)}<small>${stationHint(m)}</small></div>`;
}

// a work team: its name, up to three work places (each found on the map, each with its nearest station), shift hours
function workFields(m) {
  const hours = Array.from({ length: 25 }, (_, h) => h);
  return `<label class="fld"><span>${t("scTeamName")}</span>
      <input id="scteam" required minlength="2" maxlength="80" placeholder="${esc(t("scTeamPh"))}" value="${esc(m.name)}" /></label>
    <div class="fld sc-find"><label for="zonefind">${t("scZones")}</label>
      ${m.zones.length ? `<ul class="sc-zlist">${m.zones.map((z, i) => {
        const st = state.stations.find((s) => s.uid === z.uid);
        const d = z.place && st ? round1(km(z.place, st)) : null;
        return `<li><span class="sc-opt-ic">${icon.pin}</span><span><b>${esc(z.name)}</b><small>${esc(stationName(st?.name))}${d != null ? ` · ${t("scNearManual", d)}` : ""}${d > NEAR_KM ? ` <b class="sc-far">${t("scFar")}</b>` : ""}</small></span>
          <button type="button" class="sc-zdel" data-zdel="${i}" aria-label="${t("scZoneRemove")}">×</button></li>`;
      }).join("")}</ul>` : ""}
      ${m.zones.length < MAX_ZONES ? `<input id="zonefind" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="zonesugg" aria-expanded="false" placeholder="${esc(t("scZoneFind"))}" />
        <div id="zonesugg" class="sc-sugg" hidden></div>` : ""}
      <small>${m.zones.length >= MAX_ZONES ? t("scZoneMax") : t("scZoneHint")}</small></div>
    <div class="fld"><span>${t("scShift")}</span><div class="sc-shift">
      <select id="shiftA" aria-label="${t("scShift")}">${hours.slice(0, 24).map((h) => `<option value="${h}" ${m.shift[0] === h ? "selected" : ""}>${hh(h)}</option>`).join("")}</select>
      <span>${t("scShiftTo")}</span>
      <select id="shiftB" aria-label="${t("scShift")}">${hours.slice(1).map((h) => `<option value="${h}" ${m.shift[1] === h ? "selected" : ""}>${hh(h)}</option>`).join("")}</select>
    </div></div>`;
}

const kindFields = (m) => (m.kind === "work" ? workFields(m) : placeFields(m));

function signup() {
  if (form.uid == null) form.uid = state.uid;
  const n = plans().length;
  const back = n ? `<div class="pl-signup-mine">${creating && current() ? `<button id="plback" type="button" class="pl-link">← ${t("plBack")}</button>` : ""}
    <button id="plmine" type="button" class="btn ghost" aria-expanded="${mineOpen}">${t("plMy", n)}</button></div>${myPlans(null)}` : "";
  return `<section class="page-head wrap pl-head"><div><p class="eyebrow">${t("navSchool")}</p><h1 class="page-title">${accent(t("scTitle"))}</h1><p class="page-lead">${t("scLead")}</p></div></section>
  <div class="wrap pl">
    ${noteLine()}
    ${back}
    <form id="scform" class="panel sc-form" novalidate>
      ${kindPicker(form)}
      ${kindFields(form)}
      <button class="btn cta" type="submit" ${state.busy ? "disabled" : ""}><span>${state.busy ? t("scCreating") : t("scCreate")}</span>${state.busy ? "" : icon.arrow}</button>
      <p class="muted small">${t("scNoLogin")}</p>
    </form>
  </div>`;
}

// ---------- place search (Amazon Location Service on AWS) -> nearest station ----------
const toRad = (d) => (d * Math.PI) / 180;
function km(a, b) {
  const h = Math.sin(toRad(b.lat - a.lat) / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(toRad(b.lon - a.lon) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
const round1 = (x) => Math.round(x * 10) / 10;
// nearest station that has sent at least one number; an old number is fine, it gets an estimate
const nearest = (p) => state.stations.filter((s) => s.age_min != null && s.lat).sort((a, b) => km(p, a) - km(p, b))[0];

function stationHint(m) {
  const st = state.stations.find((s) => s.uid === m.uid);
  if (!m.place || !st) return t("scStationHint");
  const d = round1(km(m.place, st));
  return `${m.auto ? t("scNearAuto", d) : t("scNearManual", d)}${d > NEAR_KM ? ` <b class="sc-far">${t("scFar")}</b>` : ""}`;
}

let findTimer = null, findSeq = 0;
function find(q, inputId, boxId, onPick) {
  clearTimeout(findTimer);
  const box = document.getElementById(boxId);
  if (q.trim().length < 3) { showSugg(box, inputId, null); return; }
  findTimer = setTimeout(async () => {
    const seq = ++findSeq;
    showSugg(box, inputId, `<p class="sc-sugg-msg">${t("scSearching")}</p>`);
    let r;
    try { r = await api(`/places?q=${encodeURIComponent(q.trim())}`); } catch { r = { results: [] }; }
    if (seq !== findSeq) return; // a newer search is on its way
    const list = r.results || [];
    showSugg(box, inputId, list.length
      ? `<ul role="listbox">${list.map((p, i) => `<li><button type="button" class="sc-opt" role="option" data-i="${i}">
          <span class="sc-opt-ic">${p.school ? icon.school : icon.pin}</span><span><b>${esc(p.name)}</b><small>${esc(p.address)}</small></span></button></li>`).join("")}</ul>
         <p class="sc-sugg-src">${t("scSrc", esc(r.source))}</p>`
      : `<p class="sc-sugg-msg">${t("scNoPlace")}</p>`);
    box.querySelectorAll(".sc-opt").forEach((b) => {
      b.addEventListener("pointerdown", (e) => e.preventDefault()); // keep focus in the box, so a tap isn't lost to blur
      b.addEventListener("click", () => onPick(list[Number(b.dataset.i)]));
    });
  }, 350);
}

function showSugg(box, inputId, html) {
  if (!box) return;
  box.hidden = !html;
  box.innerHTML = html || "";
  document.getElementById(inputId)?.setAttribute("aria-expanded", String(!!html));
}

function bindSearch(inputId, boxId, onType, onPick) {
  const $ = (id) => document.getElementById(id);
  const input = $(inputId);
  if (!input) return;
  input.addEventListener("input", (e) => { onType?.(e.target.value); find(e.target.value, inputId, boxId, onPick); });
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); $(boxId)?.querySelector(".sc-opt")?.focus(); }
    if (e.key === "Escape") showSugg($(boxId), inputId, null);
    if (e.key === "Enter") e.preventDefault(); // Enter picks from the list, it doesn't submit half a form
  });
  // close the suggestions when focus leaves the search box and its list
  input.parentElement.addEventListener("focusout", (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setTimeout(() => showSugg($(boxId), inputId, null), 120);
  });
}

function bindFields(m) {
  const $ = (id) => document.getElementById(id);
  document.querySelectorAll('input[name="sckind"]').forEach((r) => r.addEventListener("change", () => {
    Object.assign(m, { kind: r.value, name: "", place: null, auto: false, zones: [] });
    set({ pickerOpen: false, q: "" });
  }));
  if (m.kind === "work") {
    $("scteam")?.addEventListener("input", (e) => { m.name = e.target.value; });
    bindSearch("zonefind", "zonesugg", null, (p) => {
      const st = nearest(p);
      if (!st || m.zones.length >= MAX_ZONES) return;
      m.zones.push({ name: p.name, uid: st.uid, place: { lat: p.lat, lon: p.lon, address: p.address } });
      set({});
      $("zonefind")?.focus();
    });
    document.querySelectorAll("[data-zdel]").forEach((b) => b.addEventListener("click", () => { m.zones.splice(Number(b.dataset.zdel), 1); set({}); }));
    $("shiftA")?.addEventListener("change", (e) => { m.shift[0] = Number(e.target.value); if (m.shift[1] <= m.shift[0]) m.shift[1] = m.shift[0] + 1; set({}); });
    $("shiftB")?.addEventListener("change", (e) => { m.shift[1] = Number(e.target.value); if (m.shift[0] >= m.shift[1]) m.shift[0] = m.shift[1] - 1; set({}); });
    return;
  }
  bindSearch("scname", "scsugg", (v) => {
    if (m.place) { m.place = null; m.auto = false; $("scaddr").textContent = t("scFindHint"); }
    m.name = v;
  }, (p) => {
    const st = nearest(p);
    Object.assign(m, { name: p.name, place: { lat: p.lat, lon: p.lon, address: p.address } });
    if (st) Object.assign(m, { uid: st.uid, auto: true });
    set({ pickerOpen: false, q: "" });
  });
  bindPicker(m.uid, (uid) => { m.uid = uid; m.auto = false; set({ pickerOpen: false, q: "" }); });
}

// ---------- the plan page ----------
const crewLink = (s) => `${location.origin}${location.pathname}#/crew?t=${encodeURIComponent(s.pub || "")}`;

function header(v) {
  const s = v.school, kind = kindOf(v), list = plans();
  const where = kind === "work"
    ? t("scZonesLine", s.zones?.length || 0, hh(s.shift?.[0] ?? 8), hh(s.shift?.[1] ?? 18))
    : `${esc(stationName(s.station))}${s.station_km != null ? ` · ${t("scKmFrom", s.station_km)}` : ""}`;
  return `<section class="page-head wrap pl-head"><div>
      <p class="eyebrow">${t("navSchool")}</p>
      <h1 class="page-title">${esc(s.name)}</h1>
      <p class="pl-meta"><span class="pl-kind">${KIND_IC[kind]}${t("scKinds")[kind][0]}</span><span>${kind === "work" ? icon.clock : icon.pin}${where}</span></p>
    </div>
    <div class="pl-head-act">
      ${chg.open ? "" : `<button id="scchange" type="button" class="btn ghost">${t("plEdit")}</button>`}
      <button id="plmine" type="button" class="btn ghost" aria-expanded="${mineOpen}">${t("plMy", list.length)}</button>
      <button id="plnew" type="button" class="btn ghost">+ ${t("plNew")}</button>
    </div>
  </section>`;
}

// "My plans": every plan kept on this phone, grouped by kind, each with Open and Delete
function myPlans(currentId) {
  if (!mineOpen) return "";
  const list = plans();
  if (!list.length) return `<div class="panel pl-mylist"><p class="muted">${t("plNone")}</p></div>`;
  const groups = KINDS.map((k) => [k, list.filter((p) => (p.kind || "school") === k)]).filter(([, ps]) => ps.length);
  return `<div class="panel pl-mylist">
    ${groups.map(([k, ps]) => `<div class="pl-group"><p class="pl-group-h">${KIND_IC[k]}${t("scKinds")[k][0]}</p>
      <ul>${ps.map((p) => `<li class="${p.id === currentId ? "on" : ""}"><b>${esc(p.name || t("plUnnamed"))}</b>
        ${p.id === currentId ? `<span class="pl-now">${t("plOpenNow")}</span>` : `<button type="button" class="btn ghost" data-open="${esc(p.id)}">${t("plOpen")}</button>`}
        <button type="button" class="pl-del" data-del="${esc(p.id)}" aria-label="${esc(t("plDelete"))}: ${esc(p.name || "")}">${t("plDelete")}</button></li>`).join("")}</ul></div>`).join("")}
    <p class="muted small">${t("plTidy")}</p>
  </div>`;
}

function dashboard(v) {
  return `${header(v)}
  <div class="wrap pl">
    ${myPlans(v.school.id)}
    ${noteLine()}
    ${chg.open ? editPanel() : ""}
    ${today(v)}
    ${todoPanel(v)}
    ${tellPanel(v)}
    ${record(v)}
    ${more(v)}
  </div>
  ${printCard(v)}`;
}

function editPanel() {
  return `<form id="scchangeform" class="panel sc-form sc-changebox" novalidate>
    <h2 class="h2s">${t("plEdit")}</h2>
    ${kindFields(chg)}
    <div class="sc-row">
      <button class="btn cta" type="submit" ${state.busy ? "disabled" : ""}>${t("plSave")}</button>
      <button id="scchangecancel" class="btn ghost" type="button">${t("scCancel")}</button>
    </div>
  </form>`;
}

function section(title, sub, body, cls = "") {
  return `<section class="pl-sec ${cls}"><div class="pl-sec-h"><h2>${title}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${body}</section>`;
}

// 1. Today's air
function today(v) {
  const d = v.today, kind = kindOf(v);
  if (!d) {
    const last = v.days[0];
    return section(t("plAirTitle"), "", `<div class="hero-card sc-today lv-none">
      <h3 class="ans">${t("scPending")}</h3>
      <p class="advice">${t("scPendingSub")}</p>
      ${last ? `<p class="sc-basis">${t("scLast", fmtDate(last.date))} ${headFor(kind, lv(last))}</p>` : ""}
    </div>`);
  }
  const detail = kind === "work"
    ? `${d.zones ? zoneRows(d.zones) : ""}<p class="sc-basis">${t("plOutside", v.school.shift_h ?? 10)} ${t("plSource")}</p>`
    : `${d.plan ? planRows(d.plan, kind) : `<p class="advice">${t("scNoneSub")}</p>`}<p class="sc-basis"><b>${t("plWhy")}</b> ${basis(d)}</p>`;
  const fires = d.fires ? `<p class="sc-basis pl-fires">${fireText(d.fires)} ${t("plFireNote")}</p>` : "";
  return section(`${t("plAirTitle")} · ${fmtDate(d.date)}`, t("plMadeAt", fmtTime(d.decided_ts)), `<div class="hero-card sc-today lv-${lv(d)}">
    <h3 class="ans">${headFor(kind, lv(d))}</h3>
    ${d.early ? `<p class="pl-early">${icon.clock}<span>${t("plEarly")}</span></p>` : ""}
    ${detail}
    ${fires}
  </div>`);
}

// 2. Things to do today: for the person in charge, ticked one by one; the day can be marked "no school / no work"
function todoPanel(v) {
  const d = v.today, kind = kindOf(v);
  if (!d) return "";
  const closed = d.action === "closed";
  const n = Object.keys(d.acts || {}).length;
  const items = closed ? "" : d.todo?.length
    ? `<ul class="sc-check">${d.todo.map((a) => {
        const at = d.acts?.[a];
        return `<li><button type="button" class="sc-ck ${at ? "on" : ""}" data-ck="${a}" aria-pressed="${!!at}" ${state.busy ? "disabled" : ""}>
          <span class="sc-box">${at ? icon.check : ""}</span><span>${t("scTodo")[a]}</span>${at ? `<small>${t("scDoneAt", fmtTime(at))}</small>` : ""}</button></li>`;
      }).join("")}</ul>`
    : `<p class="pl-nothing">${icon.check}${t("scNothing")}</p>`;
  const count = d.todo?.length && !closed ? ` · ${t("scDoneN", n, d.todo.length)}` : "";
  return section(t("plTodoTitle"), `${t("plTodoSub")[kind]}${count}`, `<div class="panel sc-log">
    ${items}
    <button type="button" id="scclosed" class="sc-closed ${closed ? "on" : ""}" aria-pressed="${closed}">${closed ? icon.check : ""}${t("scClosed")[kind]}</button>
  </div>`);
}

// 3. Tell people: drafts in the user's own apps, the workers' page, the optional morning email
function tellPanel(v) {
  const d = v.today, kind = kindOf(v), s = v.school;
  if (!d) return "";
  const m = message(v, d);
  const crew = kind === "work" && s.pub ? `<div class="pl-crew">
      <p class="pl-crew-t">${icon.helmet}<b>${t("plCrewTitle")}</b></p>
      <p class="muted small">${t("plCrewSub")}</p>
      <div class="email-row"><input id="crewlink" readonly value="${esc(crewLink(s))}" /><button id="copycrew" class="btn ghost" type="button">${copied === "crew" ? t("scCopied") : t("scCopy")}</button></div>
      <a class="pl-link" href="#/crew?t=${encodeURIComponent(s.pub)}">${t("plCrewSee")} ${icon.arrow}</a>
    </div>` : "";
  return section(t("plTellTitle"), t("plTellSub"), `<div class="panel pl-tell">
    <div class="sc-share">
      <a class="btn wa" href="${mailto(m)}">${icon.mail}<span>${t("scMailBtn")}</span></a>
      <a class="btn wa" href="https://wa.me/?text=${encodeURIComponent(m.whatsapp)}" target="_blank" rel="noopener">${icon.wa}<span>${t("scShare")}</span></a>
      <button id="scprint" type="button" class="btn wa">${icon.print}<span>${t("scPrint")}</span></button>
    </div>
    ${crew}
    ${autoMail(v)}
  </div>`);
}

// One written message, in the page's language, used for the email draft and for WhatsApp.
// It never carries the plan's own link (that holds the key); a work team's message carries the workers' page.
function message(v, d) {
  const kind = kindOf(v);
  const rows = kind === "work"
    ? (d.zones || []).map((z) => { const val = z.basis.hi ?? z.basis.value; return `${z.name}: ${val != null ? bandName(val) : "—"} (${stationName(z.station)}, ${ageText(z.basis.age_min)} ${t("ago")})`; }).join("\n") + `\n${t("plOutside", v.school.shift_h ?? 10)}`
    : d.plan ? ROWS[kind].map((a) => `${rowName(kind, a)}: ${t("scStatus")[d.plan[a]]}`).join("\n") : t("scNoneSub");
  const todo = d.todo?.length ? `${t("plTodoTitle")}:\n${d.todo.map((a) => `- ${t("scTodo")[a]}`).join("\n")}` : "";
  const parts = [headFor(kind, lv(d)), "", rows, "", todo, "", kind === "work" ? t("plSource") : basis(d), d.fires ? fireText(d.fires) : "", "", honest(kind)];
  const body = plain(parts.join("\n").replace(/\n{3,}/g, "\n\n").trim());
  const crew = kind === "work" && v.school.pub ? `\n\n${t("scCrewMsg", crewLink(v.school))}` : "";
  return { subject: `${v.school.name}: ${plain(headFor(kind, lv(d)))}`, body: `${body}\n\n— ${t("brand")}`,
    whatsapp: `${t("brand")} · ${v.school.name} · ${fmtDate(d.date)}\n${body}${crew}` };
}
const mailto = (m) => `mailto:?subject=${encodeURIComponent(m.subject)}&body=${encodeURIComponent(m.body.replace(/\n/g, "\r\n"))}`;

// the optional automatic 06:30 email; only shown when the server can send email at all
function autoMail(v) {
  if (!v.email_enabled) return "";
  const s = v.school, on = s.email_hint && s.email_confirmed;
  const askForm = `<form id="automail" class="sc-auto-form" novalidate>
      <input id="automailin" type="email" inputmode="email" autocomplete="email" placeholder="${esc(t("scAutoPh"))}" required />
      <button class="btn ink" type="submit" ${state.busy ? "disabled" : ""}>${t("scAutoOn")}</button>
    </form><p class="muted small">${t("scAutoHint")}</p>`;
  const manageRow = `<div class="sc-row"><button id="mailchange" type="button" class="btn ghost">${t("scAutoChange")}</button>
      <button id="mailoff" type="button" class="btn ghost">${t("scAutoOff")}</button></div>`;
  const body = mailEdit || !s.email_hint ? askForm
    : on ? `<p>${t("scEmailOn", esc(s.email_hint))}</p>${manageRow}`
    : `<p>${t("scEmailWait", esc(s.email_hint))}</p>${manageRow}`;
  return `<div class="pl-auto ${on && !mailEdit ? "on" : ""}"><p class="pl-crew-t">${on && !mailEdit ? icon.check : icon.mail}<b>${t("plAutoTitle")}</b></p>${body}</div>`;
}

function gradeCell(d) {
  if (d.basis.state === "fresh" || !d.grade) return `<span class="sc-gr"></span>`;
  const g = d.grade;
  const txt = g.status === "MISSED" ? t("scGrade").MISSED(g.miss_by) : t("scGrade")[g.status];
  const cls = { HIT: "ok", MISSED: "no" }[g.status] || "";
  return `<span class="sc-gr ${cls}" title="AQI ${d.basis.lo}–${d.basis.hi}${g.actual != null ? ` → ${g.actual}` : ""}">${txt}</span>`;
}

function didCell(d, kind) {
  if (d.action === "closed") return `<span class="sc-did none">${t("scClosed")[kind]}</span>`;
  const n = Object.keys(d.acts || {}).length;
  if (n) return `<span class="sc-did followed">${t("scDoneN", n, d.todo?.length || n)}</span>`;
  if (d.action) return `<span class="sc-did ${d.action}">${t("scActs")[d.action]}</span>`; // older one-tap answers
  if (!d.todo?.length) return `<span class="sc-did none">—</span>`;
  return `<span class="sc-did none">${t("scNoAction")}</span>`;
}

// 4. Last 30 days
function record(v) {
  const m = v.summary, kind = kindOf(v);
  return section(t("scRecTitle"), t("plRecLead"), `<div class="panel">
    <div class="ledger sc-ledger">
      <div><b>${m.bad_days}</b><span>${t("scSumBad")}</span></div>
      <div><b>${m.bad_days ? `${m.acted ?? m.followed}/${m.bad_days}` : "—"}</b><span>${t("scSumFollowed")}</span></div>
      <div><b>${m.est_graded ? `${m.est_hits}/${m.est_graded}` : "—"}</b><span>${t("scSumEst")}</span></div>
    </div>
    <ol class="sc-days">${v.days.map((d) => `<li>
      <time>${fmtDate(d.date)}</time>
      <span class="sc-chip lv-${lv(d)}"><i></i>${kind === "school" ? t("scLevel")[lv(d)] : t("scLevelPlain")[lv(d)]}</span>
      ${didCell(d, kind)}
      ${gradeCell(d)}
    </li>`).join("")}</ol>
    ${v.days.length <= 1 ? `<p class="muted small sc-empty">${t("scEmpty")}</p>` : ""}
  </div>`);
}

// More: how the plan is decided, open on another phone, start another plan, remove
function more(v) {
  const kind = kindOf(v);
  const link = `${location.origin}${location.pathname}#/plan?id=${encodeURIComponent(v.school.id)}&k=${encodeURIComponent(current()?.k || "")}`;
  const ranges = ["0–100", "101–200", "201–300", "301+"];
  return `<details class="panel pl-more">
    <summary><b>${t("plMore")}</b><span class="muted small">${t("plHowTitle")} · ${t("plPhone")} · ${t("scRemove")}</span><span class="chev">${icon.chev}</span></summary>
    <div class="pl-more-in">
      <h3>${t("plHowTitle")}</h3>
      <p class="muted small">${t("plHowLead")}</p>
      <ul class="sc-rules-l">${[0, 1, 2, 3].map((l) => `<li class="lv-${l}"><i></i><b>AQI ${ranges[l]}</b><span>${headFor(kind, l)}</span></li>`).join("")}</ul>
      <p class="muted small">${honest(kind)}</p>
    </div>
    <div class="pl-more-in">
      <h3>${t("plPhone")}</h3>
      <p class="muted small">${t("scLinkText")}</p>
      <div class="email-row"><input id="sclink" readonly value="${esc(link)}" /><button id="copylink" class="btn ghost" type="button">${copied === "link" ? t("scCopied") : t("scCopy")}</button></div>
    </div>
    <div class="pl-more-in pl-more-row">
      <button id="plnew2" type="button" class="btn ghost">+ ${t("plStartNew")}</button>
      <button id="scremove" class="sc-remove" type="button">${t("scRemove")}</button>
    </div>
  </details>`;
}

// ---------- the notice-board card: one A4 page in the language the page is in ----------
// Rendered with the page but shown only when printing (see plan.css @media print).
function printCard(v) {
  const d = v.today, kind = kindOf(v);
  if (!d) return "";
  const l = lv(d);
  const rows = kind === "work"
    ? (d.zones || []).map((z) => { const val = z.basis.hi ?? z.basis.value; return `<tr><th>${esc(z.name)}<small>${esc(stationName(z.station))}</small></th><td><span class="lvchip lv-${z.level ?? "none"}">${val != null ? bandName(val) : "—"}</span></td></tr>`; }).join("")
    : d.plan ? ROWS[kind].map((a) => `<tr><th>${rowName(kind, a)}</th><td><span class="st-${d.plan[a]}">${t("scStatus")[d.plan[a]]}</span></td></tr>`).join("") : "";
  return `<article class="sc-print lv-${l}" aria-hidden="true">
    <header><b>${esc(v.school.name)}</b><span>${fmtDate(d.date)}</span></header>
    ${state.demo ? `<p class="pr-demo">${t("demo")}</p>` : ""}
    <h1>${headFor(kind, l)}</h1>
    ${rows ? `<table>${rows}</table>` : `<p>${t("scNoneSub")}</p>`}
    ${d.todo?.length ? `<p class="pr-todo-t">${t("plTodoTitle")}</p><ul class="pr-todo">${d.todo.map((a) => `<li>☐ ${t("scTodo")[a]}</li>`).join("")}</ul>` : ""}
    <div class="pr-basis"><p>${kind === "work" ? `${t("plOutside", v.school.shift_h ?? 10)} ${t("plSource")}` : basis(d)}</p>${d.fires ? `<p>${fireText(d.fires)}</p>` : ""}</div>
    <footer><span>${t("brand")} · ${t("plMadeAt", fmtTime(d.decided_ts))}</span><span>${honest(kind)}</span></footer>
  </article>`;
}

// ---------- actions ----------
async function call(path, body, then) {
  note = null;
  set({ busy: true });
  try { state.school = await post(path, { ...ident(), ...body }); remember(state.school); then?.(); } catch (e) { note = { text: e.message, ok: false }; }
  set({ busy: false });
}

// what to send for the set-up or edit form; null (with the missing field focused) if something is missing
function formBody(m) {
  const name = m.name.trim();
  if (name.length < 2) { document.getElementById(m.kind === "work" ? "scteam" : "scname")?.focus(); return null; }
  if (m.kind === "work") {
    if (!m.zones.length) { note = { text: t("scZoneNeed"), ok: false }; set({}); document.getElementById("zonefind")?.focus(); return null; }
    return { name, kind: "work", zones: m.zones, shift: m.shift };
  }
  return { name, kind: m.kind, uid: m.uid, place: m.place };
}

async function signupSubmit(e) {
  e.preventDefault();
  const body = formBody(form);
  if (!body) return;
  note = null;
  set({ busy: true });
  try {
    const r = await post("/school", { ...body, lang: state.lang });
    state.school = r;
    remember(r, r.key);
    creating = false;
    Object.assign(form, blank());
    window.scrollTo(0, 0);
  } catch (err) { note = { text: err.message, ok: false }; }
  set({ busy: false });
}

function editSubmit(e) {
  e.preventDefault();
  const body = formBody(chg);
  if (!body) return;
  delete body.kind; // the kind of plan doesn't change after set-up
  const s = state.school.school;
  const replan = body.zones ? body.zones.map((z) => z.uid).join() !== (s.zones || []).map((z) => z.uid).join() : body.uid !== s.uid;
  call("/school/edit", body, () => { chg.open = false; note = { text: replan ? t("scChanged") : t("scDone"), ok: true }; });
}

async function copy(inputId, which) {
  const inp = document.getElementById(inputId);
  try { await navigator.clipboard.writeText(inp.value); } catch { inp.select(); document.execCommand?.("copy"); }
  copied = which; set({});
  setTimeout(() => { copied = ""; if (state.route === "plan") set({}); }, 2000);
}

function startNew() {
  creating = true;
  chg.open = false;
  note = null;
  Object.assign(form, blank());
  set({ pickerOpen: false, q: "" });
  window.scrollTo(0, 0);
}

function openPlan(id) {
  ls.set("plan", id);
  creating = false;
  chg.open = false;
  note = null;
  state.school = null;
  set({});
  run(() => loadPlan());
}

// delete a plan for everyone (it needs that plan's key, kept on this phone), then forget it here
async function deletePlan(id) {
  const p = plans().find((x) => x.id === id);
  if (!p || !confirm(t("plDeleteQ", p.name || t("plUnnamed")))) return;
  set({ busy: true });
  try {
    await post("/school/delete", { id: p.id, k: p.k });
  } catch (e) {
    if (!/unknown school/.test(e.message)) { note = { text: e.message, ok: false }; set({ busy: false }); return; }
  }
  forget(id);
  note = null;
  if (state.school?.school.id === id) { state.school = null; chg.open = false; if (current() && !creating) await loadPlan(); }
  set({ busy: false });
}

function bindMine() {
  document.getElementById("plmine")?.addEventListener("click", () => { mineOpen = !mineOpen; set({}); });
  document.querySelectorAll("[data-open]").forEach((b) => b.addEventListener("click", () => { mineOpen = false; openPlan(b.dataset.open); }));
  document.querySelectorAll("[data-del]").forEach((b) => b.addEventListener("click", () => deletePlan(b.dataset.del)));
}

export function bind() {
  const $ = (id) => document.getElementById(id);
  if (!state.school || creating) {
    $("scform")?.addEventListener("submit", signupSubmit);
    $("plback")?.addEventListener("click", () => openPlan(current().id));
    bindMine();
    bindFields(form);
    return;
  }
  const s = state.school.school;
  $("plnew")?.addEventListener("click", startNew);
  $("plnew2")?.addEventListener("click", startNew);
  bindMine();
  $("scchange")?.addEventListener("click", () => {
    Object.assign(chg, { open: true, kind: s.kind || "school", name: s.name, uid: s.uid, place: s.place || null, auto: false,
      zones: (s.zones || []).map((z) => ({ name: z.name, uid: z.uid, place: z.place || null })), shift: [...(s.shift || [8, 18])] });
    note = null;
    set({ pickerOpen: false, q: "" });
  });
  if (chg.open) {
    $("scchangeform")?.addEventListener("submit", editSubmit);
    $("scchangecancel")?.addEventListener("click", () => { chg.open = false; set({ pickerOpen: false, q: "" }); });
    bindFields(chg);
  }
  document.querySelectorAll("[data-ck]").forEach((b) => b.addEventListener("click", () => {
    const d = state.school.today;
    call("/school/act", { date: d.date, act: b.dataset.ck, done: !d.acts?.[b.dataset.ck] });
  }));
  $("scclosed")?.addEventListener("click", () => {
    const d = state.school.today;
    call("/school/log", { date: d.date, action: d.action === "closed" ? null : "closed" });
  });
  $("scprint")?.addEventListener("click", () => window.print());
  $("automail")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("automailin").value.trim();
    if (email) call("/school/edit", { email, lang: state.lang }, () => { mailEdit = false; });
  });
  $("mailchange")?.addEventListener("click", () => { mailEdit = true; set({}); $("automailin")?.focus(); });
  $("mailoff")?.addEventListener("click", () => call("/school/edit", { email: "" }, () => { mailEdit = false; }));
  $("copylink")?.addEventListener("click", () => copy("sclink", "link"));
  $("copycrew")?.addEventListener("click", () => copy("crewlink", "crew"));
  $("scremove")?.addEventListener("click", () => deletePlan(s.id));
}
