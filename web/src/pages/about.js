import { t } from "../lib/i18n.js";
import { esc, icon, accent } from "../lib/ui.js";

export const load = () => Promise.resolve();

const ICONS = ["clock", "pin", "gauge", "record", "target", "check"];
const R = 52, C = +(2 * Math.PI * R).toFixed(1);

const SRC_ICONS = ["pin", "satellite", "book"];
const pair = (us, ind, tone) => `<div class="sc-pair"><span class="sc-c sc-us"><small>${esc(t("scaleUs"))}</small><b>${us}</b></span><i class="sc-arrow">${icon.arrow}</i><span class="sc-c sc-in sc-${tone}"><small>${esc(t("scaleIn"))}</small><b>${ind}</b></span></div>`;

const ring = () => `<div class="t-ring" role="img" aria-label="${esc(t("trustRing"))} ${esc(t("trustRingSub"))}">
  <svg viewBox="0 0 120 120" aria-hidden="true"><circle class="t-ring-bg" cx="60" cy="60" r="${R}"/><circle class="t-ring-fg" cx="60" cy="60" r="${R}" style="--c:${C};--o:${+(C * 0.2).toFixed(1)}"/></svg>
  <b>${esc(t("trustRing"))}</b></div>`;

export function view() {
  return `<section class="page-head wrap"><div><p class="eyebrow">${t("navAbout")}</p><h1 class="page-title">${accent(t("abTitle"))}</h1><p class="page-lead">${t("abLead")}</p></div></section>
  <div class="wrap about">
    <section class="t-hero">
      ${ring()}
      <div><p class="t-hero-sub">${esc(t("trustRingSub"))}</p><a class="btn ghost" href="#/record">${esc(t("trustRingCta"))} ${icon.arrow}</a></div>
    </section>

    <ol class="t-grid">${t("trust").map(([h, p], i) => `<li class="t-card"><span class="t-dot t-${i % 3}">${icon[ICONS[i]]}<em>${i + 1}</em></span><h3>${esc(h)}</h3><p>${esc(p)}</p></li>`).join("")}</ol>

    <section class="panel scale-sec">
      <h2 class="h2s">${t("scaleTitle")}</h2>
      <p class="muted">${t("scaleLead")}</p>
      <div class="sc-row">${pair(200, 323, "up")}${pair(150, 92, "down")}</div>
      <p class="sc-cap">${t("scaleAir")}</p>
      <p>${t("scaleNote")}</p>
      <p class="muted small">${t("scaleClock")}</p>
    </section>

    <section class="panel never">
      <h2 class="h2s">${t("neverTitle")}</h2>
      <ul>${t("never").map((x) => `<li><span>✕</span>${esc(x)}</li>`).join("")}</ul>
      <p class="muted small">${t("honest")}</p>
    </section>

    <section class="panel">
      <h2 class="h2s">${t("srcTitle")}</h2>
      <ul class="t-src">${t("srcs").map(([n, d], i) => `<li><span class="t-dot t-${i % 3} sm">${icon[SRC_ICONS[i]]}</span><div><b>${esc(n)}</b><span>${esc(d)}</span></div></li>`).join("")}</ul>
      <a class="btn ghost" href="https://github.com/Cubix33/taaza-hawa" target="_blank" rel="noopener">GitHub ${icon.arrow}</a>
    </section>
  </div>`;
}
