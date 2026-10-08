import { state } from "../lib/store.js";
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
  const b = state.board;
  if (!b) return `<section class="page-head wrap"><div><p class="eyebrow">${t("navRecord")}</p><h1 class="page-title">${t("board")}</h1></div></section><div class="wrap"><div class="panel sk"><div class="sk-g"></div></div></div>`;
  const k = b.tally;
  const miss = k.MISSED + k.MISSED_WAITING;
  const graded = k.HIT + miss;
  const rate = graded >= 5 ? Math.round((k.HIT / graded) * 100) : null;
  const anyRow = b.rows.some((r) => Object.keys(r.days).length);
  const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString(hi() ? "hi-IN" : "en-IN", { day: "numeric", month: "short" });
  const since = (ts) => ageText(Math.max(0, Math.floor((b.now - ts) / 60)));
  return `<section class="page-head wrap"><div><p class="eyebrow">${t("navRecord")}</p><h1 class="page-title">${t("board")}</h1><p class="page-lead">${t("boardIntro")}</p></div></section>
  <div class="wrap">
    <section class="rec-summary panel">
      <div class="rs-ring">${ring(rate)}<span>${rate != null ? t("rateL") : t("stRatePending")}</span></div>
      <div class="tally">
        <div class="t-hit"><b>${k.HIT}</b><span>${t("tallyHit")}</span></div>
        <div class="t-miss"><b>${miss}</b><span>${t("tallyMiss")}</span></div>
        <div class="t-pend"><b>${k.PENDING}</b><span>${t("tallyPend")}</span></div>
      </div>
      ${b.poll ? `<p class="muted small rs-poll">${t("feedAge")}: ${since(b.poll.at)} ${t("ago")}</p>` : ""}
    </section>
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
