import { state, set } from "../lib/store.js";
import { t } from "../lib/i18n.js";
import { esc, ageText, isOld, bandColor, bandName, stationMap, icon } from "../lib/ui.js";
import { run, loadStations, goStation } from "../lib/actions.js";
import { mount3d } from "../lib/map3d.js";

export function load() {
  return run(loadStations);
}

const visible = () => state.stations.filter((s) => state.filter === "all" || (state.filter === "old") === isOld(s));

function rows() {
  const by = {
    name: (a, b) => a.name.localeCompare(b.name),
    age: (a, b) => (b.age_min ?? 1e9) - (a.age_min ?? 1e9),
    aqi: (a, b) => (b.aqi ?? -1) - (a.aqi ?? -1),
  }[state.sort];
  return [...visible()].sort(by);
}

export function view() {
  const st = state.stations;
  const nOld = st.filter(isOld).length;
  const mode = state.m3mode || "aqi";
  const seg = (key, val, label) => `<button class="chip-btn ${(state[key] || (key === "m3mode" ? "aqi" : "")) === val ? "on" : ""}" data-k="${key}" data-v="${val}">${label}</button>`;
  return `<section class="page-head wrap">
      <div><h1 class="page-title">${t("stTitle")}</h1><p class="page-lead">${t("stLead")}</p></div>
    </section>
    <div class="wrap">
      <div class="m3-tools">
        <div class="chips"><span class="muted small">${t("m3Height")}</span>${seg("m3mode", "aqi", t("m3Aqi"))}${seg("m3mode", "age", t("m3Age"))}</div>
        <div class="chips">${seg("filter", "all", `${t("fAll")} (${st.length})`)}${seg("filter", "fresh", `${t("fFresh")} (${st.length - nOld})`)}${seg("filter", "old", `${t("fOld")} (${nOld})`)}</div>
      </div>
      <div class="m3-frame">
        <div id="map3d-slot" class="map3d"></div>
        <div class="m3-legend">
          <span>${t("m3Colour")}</span><i style="background:var(--b0)"></i><i style="background:var(--b2)"></i><i style="background:var(--b3)"></i><i style="background:var(--b4)"></i><i style="background:var(--b5)"></i>
          <span class="m3-sep">${t("m3Height")} ${mode === "aqi" ? t("m3Aqi") : t("m3Age")}</span>
          <span class="m3-old"><i></i>${t("m3Old")}</span>
        </div>
      </div>
      <p class="m3-hint">${t("m3Hint")}</p>
      <section class="panel st-list">
        <div class="st-tools">
          <div class="chips"><span class="muted small">${t("sortBy")}</span>${seg("sort", "name", t("sName"))}${seg("sort", "age", t("sAge"))}${seg("sort", "aqi", t("sAqi"))}</div>
        </div>
        <ul class="st-rows">${rows().map((s) => `<li><a href="#/check?s=${s.uid}" class="st-row ${isOld(s) ? "old" : ""}">
          <span class="aqi-chip" style="--c:${bandColor(s.aqi)}">${s.aqi ?? "—"}</span>
          <span class="st-nm"><b>${esc(s.name)}</b><small>${s.aqi != null ? esc(bandName(s.aqi)) : ""}</small></span>
          <span class="st-age ${isOld(s) ? "old" : "ok"}">${icon.clock}${ageText(s.age_min)} ${t("ago")}</span>
          <span class="chev-r">${icon.arrow}</span></a></li>`).join("")}</ul>
      </section>
    </div>`;
}

// The map instance outlives re-renders: its container node is moved into each new slot,
// so filters, language and data refreshes keep the camera where the user left it.
let m3 = null;

function mapData() {
  return {
    stations: visible().map((s) => ({ ...s, old: isOld(s) })),
    mode: state.m3mode || "aqi",
    current: state.uid,
  };
}

function popupHtml(p, pinned) {
  const aqi = p.aqi >= 0 ? p.aqi : null, age = p.age >= 0 ? p.age : null;
  return `<b>${esc(p.name)}</b>
    <span>AQI ${aqi ?? "—"}${aqi != null ? ` · ${esc(bandName(aqi))}` : ""}</span>
    <span class="${p.old ? "old" : "ok"}">${ageText(age)} ${t("ago")}</span>
    ${pinned ? `<button data-open>${t("m3Open")} →</button>` : ""}`;
}

export function bind() {
  document.querySelectorAll("[data-k]").forEach((b) => b.addEventListener("click", () => set({ [b.dataset.k]: b.dataset.v })));
  const slot = document.getElementById("map3d-slot");
  if (!slot || !state.stations.length) return;
  if (m3) {
    slot.replaceWith(m3.el);
    m3.api?.update(); m3.api?.resize();
    return;
  }
  const el = slot;
  m3 = { el, api: null };
  mount3d(el, mapData, { popupHtml, onOpen: goStation })
    .then((api) => { m3.api = api; api.update(); })
    .catch(() => {
      // no WebGL or tiles unreachable: fall back to the flat SVG map, and say so
      el.classList.add("flat");
      el.innerHTML = `${stationMap(state.stations, { current: state.uid })}<p class="m3-fail">${t("m3Fail")}</p>`;
    });
}
