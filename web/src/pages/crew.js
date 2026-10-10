// "Air at work today" (#/crew; #/zone still opens it): the read-only page a supervisor forwards to the
// workers. It speaks to the workers themselves: how the air is where they work, and how to look after
// themselves. No checklist (that is the supervisor's), no login, no contact details, Hindi first,
// and a Listen button for anyone who doesn't read easily. Station air, never anyone's own breathing.
import "../plan.css";
import { state } from "../lib/store.js";
import { t } from "../lib/i18n.js";
import { esc, icon, accent } from "../lib/ui.js";
import { zoneRows } from "./plan.js";
import { api } from "../lib/api.js";
import { run } from "../lib/actions.js";

let page = null, gone = false;

export function load() {
  const tok = state.params.t || "";
  return run(async () => {
    try {
      page = await api(`/zone?t=${encodeURIComponent(tok)}`);
      gone = false;
      state.demo = state.demo || !!page.demo;
    } catch (e) {
      if (!/unknown link/.test(e.message)) throw e;
      page = null;
      gone = true;
    }
  });
}

export function unmount() { try { speechSynthesis.cancel(); } catch { /* not supported */ } }

const fmtDate = (d) => new Date(`${d}T12:00:00+05:30`).toLocaleDateString(state.lang === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Kolkata" });
const lvKey = (d) => d.level ?? "none";

function tips(level) {
  return t("znTips")[level == null ? 0 : level] || [];
}

export function view() {
  if (gone) return `<section class="page-head wrap"><div><h1 class="page-title">${accent(t("znTitle"))}</h1></div></section>
    <div class="wrap"><section class="panel"><p>${t("znGone")}</p></section></div>`;
  if (!page) return `<div class="wrap"><div class="panel sk"><div class="sk-l w40"></div><div class="sk-l big w90"></div></div></div>`;
  const d = page.today;
  const headTop = `<section class="page-head wrap"><div><p class="eyebrow">${esc(page.name)}</p><h1 class="page-title">${accent(t("znTitle"))}</h1>${d ? `<p class="page-lead">${fmtDate(d.date)}</p>` : ""}</div></section>`;
  if (!d) return `${headTop}<div class="wrap zn"><section class="hero-card sc-today lv-none"><h2 class="ans">${t("znPending")}</h2></section></div>`;
  return `${headTop}
  <div class="wrap zn">
    <section class="hero-card sc-today lv-${lvKey(d)}">
      <h2 class="ans">${t("znHead")[lvKey(d)]}</h2>
      ${page.shift_h ? `<p class="advice">${t("znHours", page.shift_h)}</p>` : ""}
      <p class="zn-air">${t("znAir")}</p>
      ${zoneRows(d.zones || [])}
      <button id="znlisten" type="button" class="btn speak">${icon.speaker}<span>${t("listen")}</span></button>
    </section>
    <section class="panel zn-do">
      <h2 class="h2s">${t("znDo")}</h2>
      <ul>${tips(d.level).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      <p class="muted small">${t("znNote")}</p>
    </section>
  </div>`;
}

// read the page aloud with the phone's own voice (the station-answer voice on the API speaks a card, not this)
function spoken() {
  const d = page.today;
  return [t("znHead")[lvKey(d)], page.shift_h ? t("znHours", page.shift_h) : "",
    ...(d.zones || []).map((z) => z.name), t("znDo"), ...tips(d.level)].filter(Boolean).join(". ");
}

export function bind() {
  document.getElementById("znlisten")?.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(spoken());
    u.lang = state.lang === "hi" ? "hi-IN" : "en-IN";
    speechSynthesis.speak(u);
  });
}
