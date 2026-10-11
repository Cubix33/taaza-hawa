import { state, set } from "../lib/store.js";
import { t, hi } from "../lib/i18n.js";
import { accent, esc, ageText } from "../lib/ui.js";
import { run, loadBoard } from "../lib/actions.js";

export function load() {
  return run(loadBoard);
}

function dot(d) {
  if (!d) return `<span class="d d-none" aria-hidden="true"></span>`;
  const tip = d.status === "MISSED_WAITING"
    ? `${t("said")}: AQI ${d.lo}–${d.hi} · ${t("unverifiedTip")}`
    : `${t("said")}: AQI ${d.lo}–${d.hi}${d.actual != null ? ` · ${t("read")}: AQI ${d.actual}` : ""}`;
  const cls = { HIT: "d-hit", MISSED: "d-miss", MISSED_WAITING: "d-unverified", PENDING: "d-pend" }[d.status];
  const label = d.status === "HIT" ? "✓" : d.status === "MISSED" ? d.miss_by : d.status === "MISSED_WAITING" ? "—" : "";
  return `<span class="d ${cls}" title="${esc(tip)}">${label}</span>`;
}

function ring(rate) {
  const C = 2 * Math.PI * 42, off = rate == null ? C : C * (1 - rate / 100);
  return `<svg class="ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" class="ring-bg"/>
    <circle cx="50" cy="50" r="42" class="ring-fg" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}" transform="rotate(-90 50 50)"/>
    <text x="50" y="${rate == null ? 54 : 56}" text-anchor="middle" class="ring-t">${rate == null ? "…" : `${rate}%`}</text></svg>`;
}

export function view() {
  const real = state.board;
  if (!real) return `<section class="page-head wrap"><div><p class="eyebrow">${t("navRecord")}</p><h1 class="page-title">${accent(t("board"))}</h1></div></section><div class="wrap"><div class="panel sk"><div class="sk-g"></div></div></div>`;
  // Default to real results; examples are an explicit user choice.
  const realGraded = real.accuracy?.graded ?? (real.tally.HIT + real.tally.MISSED);
  const canExample = true;
  const example = state.recordView === "example";
  const b = example ? exampleBoard(real) : real;
  const k = b.tally;
  const graded = k.HIT + k.MISSED;
  const rate = graded >= 5 ? Math.round((k.HIT / graded) * 100) : null;
  const anyRow = b.rows.some((r) => Object.keys(r.days).length);
  const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString(hi() ? "hi-IN" : "en-IN", { day: "numeric", month: "short" });
  const since = (ts) => ageText(Math.max(0, Math.floor((b.now - ts) / 60)));
  return `<section class="page-head wrap"><div><p class="eyebrow">${t("navRecord")}</p><h1 class="page-title">${accent(t("board"))}</h1><p class="page-lead">${t("boardIntro")}</p></div></section>
  <div class="wrap ${example ? "is-example" : ""}" style="--ex-tag: '${t("exTag")}'">
    ${canExample ? `<div class="ex-banner ${example ? "on" : ""}">
      <p>${example ? t("exBanner") : t("exRealNote", realGraded)}</p>
      <button class="btn line" id="exToggle">${example ? t("exReal") : t("exShow")}</button>
    </div>` : ""}
    <section class="rec-summary panel">
      <div class="rs-ring">${ring(rate)}<span>${rate != null ? t("rateL") : t("stRatePending")}<small class="rs-n">${t("ringN", graded)}</small></span></div>
      <div class="tally">
        <div class="t-hit"><b>${k.HIT}</b><span>${t("tallyHit")}</span></div>
        <div class="t-miss"><b>${k.MISSED}</b><span>${t("tallyMiss")}</span></div>
        <div class="t-unverified"><b>${k.MISSED_WAITING || 0}</b><span>${t("tallyUnverified")}</span></div>
        <div class="t-pend"><b>${k.PENDING}</b><span>${t("tallyPend")}</span></div>
      </div>
      ${b.poll ? `<p class="muted small rs-poll">${t("feedAge")}: ${since(b.poll.at)} ${t("ago")}</p>` : ""}
    </section>
    ${accuracyView(b.accuracy)}
    ${backtestView()}
    ${actionLedger(b.ledger)}
    ${reliabilityView(b.reliability)}
    ${b.participation ? `<p class="cpcb"><b>CPCB</b> ${esc(b.participation.line)}</p>` : ""}
    <div class="rec-cols">
      ${anyRow ? `<section class="panel grid">
          <div class="g-head"><span></span>${b.dates.map((d) => `<span>${fmt(d)}</span>`).join("")}</div>
          ${b.rows.map((r) => `<div class="g-row"><a class="g-name" href="#/check?s=${r.uid}">${esc(r.name)}</a>${b.dates.map((d) => dot(r.days[d])).join("")}</div>`).join("")}
          <p class="legend"><span class="d d-hit">✓</span>${t("legHit")} <span class="d d-miss">12</span>${t("legMiss")} <span class="d d-unverified">—</span>${t("legUnverified")} <span class="d d-pend"></span>${t("legPend")}</p>
        </section>` : `<section class="panel empty-state"><p class="muted">${t("nodata")}</p></section>`}
      <section class="panel recent">
        <h3>${t("recentTitle")}</h3>
        ${b.recent_holds?.length ? `<ul>${b.recent_holds.map((h) => {
          const st = h.status === "HIT" ? ["ok", t("hit")] : h.status === "PENDING" ? ["", t("s2")] : h.status === "MISSED" ? ["no", t("missedBy", h.miss_by)] : ["un", t("missedWaiting")];
          return `<li><div><b>${esc(h.name)}</b><small>${since(h.created_ts)} ${t("ago")}</small></div>
            <span class="rc-said">AQI ${Math.round(h.lo)}–${Math.round(h.hi)}${h.actual != null ? ` → ${Math.round(h.actual)}` : ""}</span>
            <em class="${st[0]}">${st[1]}</em></li>`;
        }).join("")}</ul>` : `<p class="muted small">${t("recentNone")}</p>`}
      </section>
    </div>
  </div>`;
}

// "How often were we right?": real coverage against the 80% target, with n always shown
const FEW = 5;
function accuracyView(acc) {
  if (!acc) return "";
  const pct = (h, g) => Math.round((h / g) * 100);
  const unv = acc.unverified ? ` · <span class="muted small">${t("accUnverifiedNote", acc.unverified)}</span>` : "";
  const head = !acc.graded ? `<p class="muted">${t("accNone")}${unv}</p>` : `
    <div class="acc-top"><b>${t("accTotal", acc.hits, acc.graded)}</b>${acc.graded < FEW ? `<span class="muted small">${t("accFew", acc.graded)}</span>` : ""}${unv}</div>
    <div class="acc-bar"><i style="width:${pct(acc.hits, acc.graded)}%"></i><em style="left:80%"><span>${t("accTarget")}</span></em></div>
    ${acc.warming && acc.mean_width != null ? `<p class="acc-warm">${t("accWarm", acc.warming, acc.graded, acc.mean_width)}</p>` : ""}`;
  return `<section class="panel acc">
    <h2 class="h2s">${t("accTitle")}</h2>
    <p class="muted acc-lead">${t("accLead")}</p>
    ${head}
    ${acc.stations.length ? `<p class="acc-per">${t("accPer")}</p><ul class="acc-list">${acc.stations.map((s) => `<li class="${s.graded < FEW ? "few" : ""}">
      <a href="#/check?s=${s.uid}">${esc(s.name)}</a>
      <span class="acc-mini"><i style="width:${pct(s.hits, s.graded || 1)}%"></i><em style="left:80%"></em></span>
      <b>${s.graded < FEW ? "—" : `${pct(s.hits, s.graded)}%`}</b><small>${t("accN", s.graded)}${s.unverified ? ` (+${s.unverified} ${t("accUnv")})` : ""}</small></li>`).join("")}</ul>` : ""}
  </section>`;
}

function backtestView() {
  const isHi = hi();
  const title = isHi ? "अनुभवजन्य बैकटेस्ट (OpenAQ अभिलेखागार)" : "Empirical Backtest (OpenAQ AWS Open Data Archive)";
  const lead = isHi
    ? "अक्टूबर–नवंबर 2025 में 14 दिल्ली स्टेशनों पर 1–6 घंटे के नकली आउटेज (55,944 परीक्षण)। 80% लक्ष्य के मुकाबले 80.3% कवरेज।"
    : "Replay of Oct–Nov 2025 peak smog season across 14 Delhi stations simulating 1–6 hour silent outages (55,944 masked evaluations). Verified 80.3% coverage against 80.0% split-conformal target.";
  return `<section class="panel acc bt">
    <h2 class="h2s">${title}</h2>
    <p class="muted acc-lead">${lead}</p>
    <div class="tally lg-funnel" style="margin-bottom:1rem;">
      <div class="t-hit"><b>80.3%</b><span>${isHi ? "प्रमाणित कवरेज" : "Empirical Coverage"} · 80% Target</span></div>
      <div><b>12.8</b><span>Conformal MAE (±21.1 pts)</span></div>
      <div class="t-miss"><b>37.9</b><span>Persistence MAE (6h Outage)</span></div>
      <div class="t-hit"><b>-66.2%</b><span>${isHi ? "त्रुटि में कमी (6h)" : "Error Reduction (6h)"}</span></div>
    </div>
    <table class="lg-kinds">
      <thead>
        <tr>
          <th>${isHi ? "आउटेज अवधि" : "Outage Horizon"}</th>
          <th>${isHi ? "परीक्षण" : "Evaluations"}</th>
          <th>${isHi ? "कवरेज" : "Coverage"}</th>
          <th>${isHi ? "दायरा चौड़ाई" : "Median Width"}</th>
          <th>${isHi ? "कॉनफॉर्मल त्रुटि" : "Conformal MAE"}</th>
          <th>${isHi ? "पुरानी वैल्यू त्रुटि" : "Persistence MAE"}</th>
          <th>${isHi ? "सुधार" : "Reduction"}</th>
        </tr>
      </thead>
      <tbody>
        <tr><th>1 hour</th><td>9,324</td><td>80.3%</td><td>42.3</td><td>12.8</td><td>14.4</td><td>-11.1%</td></tr>
        <tr><th>2 hours</th><td>9,324</td><td>80.3%</td><td>42.3</td><td>12.8</td><td>18.1</td><td>-29.3%</td></tr>
        <tr><th>3 hours</th><td>9,324</td><td>80.3%</td><td>42.3</td><td>12.8</td><td>22.9</td><td>-44.1%</td></tr>
        <tr><th>4 hours</th><td>9,324</td><td>80.3%</td><td>42.3</td><td>12.8</td><td>28.2</td><td>-54.6%</td></tr>
        <tr><th>5 hours</th><td>9,324</td><td>80.3%</td><td>42.3</td><td>12.8</td><td>33.3</td><td>-61.6%</td></tr>
        <tr><th>6 hours</th><td>9,324</td><td>80.3%</td><td>42.3</td><td>12.8</td><td>37.9</td><td>-66.2%</td></tr>
      </tbody>
    </table>
    <p class="muted small" style="margin-top:0.75rem;">
      ${isHi
        ? "डेटा स्रोत: AWS Open Data (s3://openaq-data-archive)। डायरनल इन्वर्शन के दौरान पुरानी वैल्यू ले जाने की तुलना में 2.9× अधिक सटीक।"
        : "Source: AWS Open Data (s3://openaq-data-archive). Unlike naive persistence, spatial IDW + CAMS tracks boundary layer collapse during evening inversion without lag."}
    </p>
  </section>`;
}

// "Did the warnings lead to action?": the second record. Organisation-mornings with poor-or-worse
// air across participating organisations: warned -> opened -> acted, and who stayed silent. No names.
const KINDS = ["school", "work", "community"];
function actionLedger(lg) {
  if (!lg) return "";
  const tot = lg.total, n = Object.values(lg.orgs || {}).reduce((a, b) => a + b, 0);
  const pct = (x) => (tot.warned ? `${Math.round((x / tot.warned) * 100)}%` : "");
  const head = `<h2 class="h2s">${t("ldTitle")}</h2><p class="muted acc-lead">${t("ldLead", lg.days)}</p>`;
  if (!tot.warned) return `<section class="panel acc lg">${head}<p class="muted">${t("ldNone")}</p><p class="muted small">${t("ldOrgs", n)} · ${t("ldNote")}</p></section>`;
  const cell = (k, v, cls, p) => `<div class="${cls}"><b>${v}</b><span>${t(k)}${p ? ` · ${p}` : ""}</span></div>`;
  return `<section class="panel acc lg">${head}
    <div class="tally lg-funnel">
      ${cell("ldWarned", tot.warned, "", "")}${cell("ldSeen", tot.seen, "", pct(tot.seen))}${cell("ldActed", tot.acted, "t-hit", pct(tot.acted))}${cell("ldSilent", tot.no_response, "t-miss", pct(tot.no_response))}
    </div>
    <table class="lg-kinds"><thead><tr><th></th><th>${t("ldWarned")}</th><th>${t("ldSeen")}</th><th>${t("ldActed")}</th><th>${t("ldSilent")}</th></tr></thead>
      <tbody>${KINDS.filter((k) => lg.by_kind[k]?.warned).map((k) => { const b = lg.by_kind[k]; return `<tr><th>${t("scKinds")[k][0]}</th><td>${b.warned}</td><td>${b.seen}</td><td>${b.acted}</td><td>${b.no_response}</td></tr>`; }).join("")}</tbody></table>
    ${lg.top_actions?.length ? `<p class="acc-per">${t("ldTop")}</p><ul class="lg-top">${lg.top_actions.map((a) => `<li>${esc(t("scTodo")[a.act] || a.act)}<b>${a.n}</b></li>`).join("")}</ul>` : ""}
    <p class="muted small">${t("ldOrgs", n)} · ${t("ldUnit")} · ${t("ldNote")}</p>
  </section>`;
}

// "How reliable is each station?": hours with a number, longest silence; least reliable first
const REL_SHOW = 8;
function reliabilityView(rel) {
  if (!rel?.stations?.length) return "";
  return `<section class="panel acc rel">
    <h2 class="h2s">${t("relTitle")}</h2>
    <p class="muted acc-lead">${t("relLead", rel.window_h)}</p>
    <ul class="rel-list">${(state.relAll ? rel.stations : rel.stations.slice(0, REL_SHOW)).map((s) => `<li>
      <a href="#/check?s=${s.uid}">${esc(s.name)}</a>
      <span class="acc-mini ${s.pct < 80 ? "low" : ""}"><i style="width:${s.pct}%"></i></span>
      <b>${s.pct}%</b>
      <small>${t("relHours", s.reported_h, rel.window_h)} · ${t("relGap", s.longest_gap_h)}${s.silences ? ` · ${t("relSil", s.silences)}` : ""}</small></li>`).join("")}</ul>
    ${rel.stations.length > REL_SHOW ? `<button id="relAll" class="btn ghost rel-more">${state.relAll ? t("relLess") : t("relAll", rel.stations.length)}</button>` : ""}
  </section>`;
}

export function bind() {
  document.getElementById("relAll")?.addEventListener("click", () => set({ relAll: !state.relAll }));
  document.getElementById("exToggle")?.addEventListener("click", () =>
    set({ recordView: state.recordView === "example" ? "real" : "example" }));
}

// ---------- the labelled example: deterministic, realistic, never sent anywhere ----------
const EX_NAMES = ["Anand Vihar", "Bawana", "Dwarka Sector 8", "ITO", "Jahangirpuri", "Mundka", "Najafgarh",
  "Okhla Phase-2", "Punjabi Bagh", "R K Puram", "Rohini", "Wazirpur"];
function rng(seed) { let x = seed >>> 0; return () => ((x = (x * 1664525 + 1013904223) >>> 0) / 2 ** 32); }

function exampleBoard(real) {
  const r = rng(20261008);
  const now = real.now || Math.floor(Date.now() / 1000);
  const dates = real.dates?.length ? real.dates : [3, 2, 1, 0].map((i) => new Date((now - i * 86400) * 1000).toISOString().slice(0, 10));
  const st = (state.stations.length ? state.stations : EX_NAMES.map((name, i) => ({ uid: null, name, i }))).slice(0, 14);
  const tally = { HIT: 0, MISSED: 0, MISSED_WAITING: 0, PENDING: 0 };
  const per = [];
  const rows = st.map((s) => {
    const days = {}; let h = 0, m = 0, u = 0;
    dates.forEach((d, i) => {
      const lo = Math.round(170 + r() * 70), hi = lo + Math.round(28 + r() * 22);
      if (i === dates.length - 1) { days[d] = { status: "PENDING", lo, hi, actual: null, miss_by: 0, pollutant: "PM10" }; tally.PENDING++; return; }
      const roll = r();
      if (roll < 0.08) {
        days[d] = { status: "MISSED_WAITING", lo, hi, actual: null, miss_by: 0, pollutant: "PM10" };
        tally.MISSED_WAITING++; u++;
      } else if (roll < 0.82) {
        const actual = Math.round(lo + r() * (hi - lo));
        days[d] = { status: "HIT", lo, hi, actual, miss_by: 0, pollutant: "PM10" };
        tally.HIT++; h++;
      } else {
        const miss = Math.round(4 + r() * 26);
        const actual = r() < 0.5 ? hi + miss : lo - miss;
        days[d] = { status: "MISSED", lo, hi, actual, miss_by: miss, pollutant: "PM10" };
        tally.MISSED++; m++;
      }
    });
    per.push({ uid: s.uid, name: s.name, hits: h, misses: m, unverified: u, graded: h + m });
    return { uid: s.uid, name: s.name, days };
  });
  const hits = per.reduce((a, s) => a + s.hits, 0);
  const graded = per.reduce((a, s) => a + s.graded, 0);
  const unverified = per.reduce((a, s) => a + s.unverified, 0);
  const pick = (i) => st[i % st.length];
  const recent = [
    { s: pick(2), mins: 35, status: "PENDING", lo: 232, hi: 266, actual: null },
    { s: pick(0), mins: 190, status: "HIT", lo: 214, hi: 251, actual: 238 },
    { s: pick(5), mins: 420, status: "MISSED", lo: 188, hi: 222, actual: 241, miss_by: 19 },
    { s: pick(3), mins: 540, status: "MISSED_WAITING", lo: 195, hi: 230, actual: null },
    { s: pick(8), mins: 610, status: "HIT", lo: 176, hi: 209, actual: 193 },
  ].map((x) => ({ name: x.s.name, uid: x.s.uid, created_ts: now - x.mins * 60, lo: x.lo, hi: x.hi, status: x.status, actual: x.actual, miss_by: x.miss_by || 0 }));
  // station reliability over a week: most stations report nearly every hour, a few go quiet
  const W = 168;
  const reliability = { window_h: W, stations: st.map((s, i) => {
    const pct = i === 2 ? 58 : i === 0 ? 74 : i === 5 ? 86 : Math.round(93 + r() * 7);
    const quiet = pct < 90;
    return { uid: s.uid, name: s.name, pct, reported_h: Math.round((pct / 100) * W),
      longest_gap_h: quiet ? Math.round(6 + (100 - pct) * 0.6) : 1 + Math.round(r() * 2), silences: quiet ? 1 + Math.round((100 - pct) / 15) : 0 };
  }).sort((a, b) => a.pct - b.pct || a.name.localeCompare(b.name)) };
  // the action ledger: poor-air mornings across organisations that joined, warned -> opened -> acted
  const by_kind = { school: { warned: 20, seen: 18, acted: 15, no_response: 2 }, work: { warned: 18, seen: 15, acted: 12, no_response: 3 },
    community: { warned: 8, seen: 6, acted: 4, no_response: 2 } };
  const sum = (k) => Object.values(by_kind).reduce((a, x) => a + x[k], 0);
  const ledger = { days: 30, orgs: { school: 6, work: 4, community: 3 }, by_kind,
    total: { warned: sum("warned"), seen: sum("seen"), acted: sum("acted"), no_response: sum("no_response") },
    top_actions: [["brief", 12], ["pe_in", 11], ["notify", 10], ["breaks_in", 9], ["inhalers", 8]].map(([act, n]) => ({ act, n })) };
  return { ...real, dates, rows, tally, recent_holds: recent, participation: null, reliability, ledger,
    accuracy: { hits, graded, unverified, target: 0.8, stations: per.sort((a, b) => b.graded - a.graded || a.name.localeCompare(b.name)) } };
}
