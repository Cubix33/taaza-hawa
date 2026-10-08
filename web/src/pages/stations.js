import { state, set } from "../lib/store.js";
import { t } from "../lib/i18n.js";
import { esc, ageText, isOld, bandColor, bandName, stationMap, icon } from "../lib/ui.js";
import { run, loadStations } from "../lib/actions.js";

export function load() {
  return run(loadStations);
}

function rows() {
  let list = state.stations.filter((s) => state.filter === "all" || (state.filter === "old") === isOld(s));
  const by = {
    name: (a, b) => a.name.localeCompare(b.name),
    age: (a, b) => (b.age_min ?? 1e9) - (a.age_min ?? 1e9),
    aqi: (a, b) => (b.aqi ?? -1) - (a.aqi ?? -1),
  }[state.sort];
  return [...list].sort(by);
}

export function view() {
  const st = state.stations;
  const nOld = st.filter(isOld).length;
  const seg = (key, val, label) => `<button class="chip-btn ${state[key] === val ? "on" : ""}" data-${key}="${val}">${label}</button>`;
  return `<section class="page-head wrap">
      <div><p class="eyebrow">${t("navStations")}</p><h1 class="page-title">${t("stTitle")}</h1><p class="page-lead">${t("stLead")}</p></div>
    </section>
    <div class="wrap st-layout">
      <section class="map-card big">${st.length ? stationMap(st, { current: state.uid }) : `<div class="sk-g"></div>`}
        <div class="map-legend"><span><i class="lg-dot" style="background:var(--b2)"></i>${t("fresh")} (${st.length - nOld})</span><span><i class="lg-ring"></i>${t("stale")} (${nOld})</span></div>
      </section>
      <section class="panel st-list">
        <div class="st-tools">
          <div class="chips">${seg("filter", "all", t("fAll"))}${seg("filter", "fresh", t("fFresh"))}${seg("filter", "old", t("fOld"))}</div>
          <div class="chips"><span class="muted small">${t("sortBy")}</span>${seg("sort", "name", t("sName"))}${seg("sort", "age", t("sAge"))}${seg("sort", "aqi", t("sAqi"))}</div>
        </div>
        <ul class="st-rows">${rows().map((s) => `<li><a href="#/check?s=${s.uid}" class="st-row ${isOld(s) ? "old" : ""}">
          <span class="aqi-chip" style="--c:${bandColor(s.aqi)}">${s.aqi ?? "—"}</span>
          <span class="st-nm"><b>${esc(s.name)}</b><small>${s.aqi != null ? esc(bandName(s.aqi)) : ""}</small></span>
          <span class="st-age ${isOld(s) ? "old" : "ok"}">${icon.clock}${ageText(s.age_min)}</span>
          <span class="chev-r">${icon.arrow}</span></a></li>`).join("")}</ul>
      </section>
    </div>`;
}

export function bind() {
  document.querySelectorAll("[data-filter]").forEach((b) => b.addEventListener("click", () => set({ filter: b.dataset.filter })));
  document.querySelectorAll("[data-sort]").forEach((b) => b.addEventListener("click", () => set({ sort: b.dataset.sort })));
}
