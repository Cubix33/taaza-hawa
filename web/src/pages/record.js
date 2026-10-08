import { state, set } from "../lib/store.js";
import { t, hi } from "../lib/i18n.js";
import { esc, ageText } from "../lib/ui.js";
import { run, loadBoard } from "../lib/actions.js";

export function load() {
  return run(loadBoard);
}

function dot(d) {
  if (!d) return `<span class="d d-none" aria-hidden="true"></span>`;
  const tip = `${t("said")}: AQI ${d.lo}–${d.hi}${d.actual != null ? ` · ${t("read")}: AQI ${d.actual}` : ""}`;
  const cls = { HIT: "d-hit", MISSED: "d-miss", MISSED_WAITING: "d-miss", PENDING: "d-pend" }[d.status];
  const label = d.status === "HIT" ? "✓" : d.status === "MISSED" ? d.miss_by : d.status === "MISSED_WAITING" ? "✗" : "";
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
  if (!real) return `<section class="page-head wrap"><div><p class="eyebrow">${t("navRecord")}</p><h1 class="page-title">${t("board")}</h1></div></section><div class="wrap"><div class="panel sk"><div class="sk-g"></div></div></div>`;
  // Until 5 real checks exist, show a clearly labelled example (switchable); never mix it with real data.
  const realGraded = real.accuracy?.graded ?? 0;
  const canExample = realGraded < FEW;
  const example = canExample && state.recordView !== "real";
  const b = example ? exampleBoard(real) : real;
  const k = b.tally;
  const miss = k.MISSED + k.MISSED_WAITING;
  const graded = k.HIT + miss;
  const rate = graded >= 5 ? Math.round((k.HIT / graded) * 100) : null;
  const anyRow = b.rows.some((r) => Object.keys(r.days).length);
  const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString(hi() ? "hi-IN" : "en-IN", { day: "numeric", month: "short" });
  const since = (ts) => ageText(Math.max(0, Math.floor((b.now - ts) / 60)));
  return `<section class="page-head wrap"><div><h1 class="page-title">${t("board")}</h1><p class="page-lead">${t("boardIntro")}</p></div></section>
  <div class="wrap ${example ? "is-example" : ""}" style="--ex-tag: '${t("exTag")}'">
    ${canExample ? `<div class="ex-banner ${example ? "on" : ""}">
      <p>${example ? t("exBanner") : t("exRealNote", realGraded)}</p>
      <button class="btn line" id="exToggle">${example ? t("exReal") : t("exShow")}</button>
    </div>` : ""}
    <section class="rec-summary panel">
      <div class="rs-ring">${ring(rate)}<span>${rate != null ? t("rateL") : t("stRatePending")}</span></div>
      <div class="tally">
        <div class="t-hit"><b>${k.HIT}</b><span>${t("tallyHit")}</span></div>
        <div class="t-miss"><b>${miss}</b><span>${t("tallyMiss")}</span></div>
        <div class="t-pend"><b>${k.PENDING}</b><span>${t("tallyPend")}</span></div>
      </div>
      ${b.poll ? `<p class="muted small rs-poll">${t("feedAge")}: ${since(b.poll.at)} ${t("ago")}</p>` : ""}
    </section>
    ${accuracyView(b.accuracy)}
    ${b.participation ? `<p class="cpcb"><b>CPCB</b> ${esc(b.participation.line)}</p>` : ""}
    <div class="rec-cols">
      ${anyRow ? `<section class="panel grid">
          <div class="g-head"><span></span>${b.dates.map((d) => `<span>${fmt(d)}</span>`).join("")}</div>
          ${b.rows.map((r) => `<div class="g-row"><a class="g-name" href="#/check?s=${r.uid}">${esc(r.name)}</a>${b.dates.map((d) => dot(r.days[d])).join("")}</div>`).join("")}
          <p class="legend"><span class="d d-hit">✓</span>${t("legHit")} <span class="d d-miss">12</span>${t("legMiss")} <span class="d d-pend"></span>${t("legPend")}</p>
        </section>` : `<section class="panel empty-state"><p class="muted">${t("nodata")}</p></section>`}
      <section class="panel recent">
        <h3>${t("recentTitle")}</h3>
        ${b.recent_holds?.length ? `<ul>${b.recent_holds.map((h) => {
          const st = h.status === "HIT" ? ["ok", t("hit")] : h.status === "PENDING" ? ["", t("s2")] : h.status === "MISSED" ? ["no", t("missedBy", h.miss_by)] : ["no", t("missedWaiting")];
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
  const head = !acc.graded ? `<p class="muted">${t("accNone")}</p>` : `
    <div class="acc-top"><b>${t("accTotal", acc.hits, acc.graded)}</b>${acc.graded < FEW ? `<span class="muted small">${t("accFew", acc.graded)}</span>` : ""}</div>
    <div class="acc-bar"><i style="width:${pct(acc.hits, acc.graded)}%"></i><em style="left:80%"><span>${t("accTarget")}</span></em></div>`;
  return `<section class="panel acc">
    <h2 class="h2s">${t("accTitle")}</h2>
    <p class="muted acc-lead">${t("accLead")}</p>
    ${head}
    ${acc.stations.length ? `<p class="acc-per">${t("accPer")}</p><ul class="acc-list">${acc.stations.map((s) => `<li class="${s.graded < FEW ? "few" : ""}">
      <a href="#/check?s=${s.uid}">${esc(s.name)}</a>
      <span class="acc-mini"><i style="width:${pct(s.hits, s.graded)}%"></i><em style="left:80%"></em></span>
      <b>${s.graded < FEW ? "—" : `${pct(s.hits, s.graded)}%`}</b><small>${t("accN", s.graded)}</small></li>`).join("")}</ul>` : ""}
  </section>`;
}

export function bind() {
  document.getElementById("exToggle")?.addEventListener("click", () =>
    set({ recordView: state.recordView === "real" ? "example" : "real" }));
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
    const days = {}; let h = 0, g = 0;
    dates.forEach((d, i) => {
      const lo = Math.round(170 + r() * 70), hi = lo + Math.round(28 + r() * 22);
      if (i === dates.length - 1) { days[d] = { status: "PENDING", lo, hi, actual: null, miss_by: 0, pollutant: "PM10" }; tally.PENDING++; return; }
      const hit = r() < 0.8;
      const miss = Math.round(4 + r() * 26);
      const actual = hit ? Math.round(lo + r() * (hi - lo)) : (r() < 0.5 ? hi + miss : lo - miss);
      days[d] = { status: hit ? "HIT" : "MISSED", lo, hi, actual, miss_by: hit ? 0 : miss, pollutant: "PM10" };
      tally[hit ? "HIT" : "MISSED"]++; g++; h += hit;
    });
    per.push({ uid: s.uid, name: s.name, hits: h, graded: g });
    return { uid: s.uid, name: s.name, days };
  });
  const hits = per.reduce((a, s) => a + s.hits, 0), graded = per.reduce((a, s) => a + s.graded, 0);
  const pick = (i) => st[i % st.length];
  const recent = [
    { s: pick(2), mins: 35, status: "PENDING", lo: 232, hi: 266, actual: null },
    { s: pick(0), mins: 190, status: "HIT", lo: 214, hi: 251, actual: 238 },
    { s: pick(5), mins: 420, status: "MISSED", lo: 188, hi: 222, actual: 241, miss_by: 19 },
    { s: pick(8), mins: 610, status: "HIT", lo: 176, hi: 209, actual: 193 },
  ].map((x) => ({ name: x.s.name, uid: x.s.uid, created_ts: now - x.mins * 60, lo: x.lo, hi: x.hi, status: x.status, actual: x.actual, miss_by: x.miss_by || 0 }));
  return { ...real, dates, rows, tally, recent_holds: recent, participation: null,
    accuracy: { hits, graded, target: 0.8, stations: per.sort((a, b) => b.graded - a.graded || a.name.localeCompare(b.name)) } };
}
