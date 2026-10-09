// Station picker shared by "Check my air" and the school form.
// Custom list, not a native <select>: the native list rendered white-on-white in dark mode.
import { state, set } from "./store.js";
import { t } from "./i18n.js";
import { esc, ageText, isOld, icon } from "./ui.js";

export function pickerView(uid) {
  const cur = state.stations.find((s) => s.uid === uid);
  return `<div class="picker">
    <div class="combo ${state.pickerOpen ? "open" : ""}">
      <button id="pick" type="button" class="sel" aria-haspopup="listbox" aria-expanded="${state.pickerOpen}">
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
    <button id="locate" type="button" class="icon-btn" title="${t("locate")}" aria-label="${t("locate")}">${icon.target}</button>
  </div>`;
}

function renderList(uid, onPick) {
  const ul = document.getElementById("picklist");
  if (!ul) return;
  // keep spaces when matching ("r k" must not hit dwa-rk-a); names starting with the query rank first
  const norm = (x) => x.toLowerCase().replace(/\s+/g, " ").trim();
  const q = norm(state.q), q0 = q.replace(/ /g, "");
  const starts = (s) => norm(s.name).startsWith(q) || norm(s.name).replace(/ /g, "").startsWith(q0);
  const list = !q ? state.stations : state.stations.filter((s) => norm(s.name).includes(q) || starts(s)).sort((a, b) => starts(b) - starts(a));
  ul.innerHTML = list.length ? list.map((s) => `<li><button type="button" class="opt ${s.uid === uid ? "cur" : ""}" role="option" aria-selected="${s.uid === uid}" data-pick="${s.uid}">
      <i class="dot ${isOld(s) ? "old" : "ok"}"></i><span>${esc(s.name)}</span><small class="${isOld(s) ? "old" : ""}">${ageText(s.age_min)}</small>
      ${s.uid === uid ? `<span class="tick">${icon.check}</span>` : ""}</button></li>`).join("")
    : `<li class="empty">${t("noMatch")}</li>`;
  ul.querySelectorAll("[data-pick]").forEach((b) => b.addEventListener("click", () => onPick(Number(b.dataset.pick))));
}

export function bindPicker(uid, onPick) {
  const $ = (id) => document.getElementById(id);
  $("pick")?.addEventListener("click", (e) => { e.stopPropagation(); set({ pickerOpen: !state.pickerOpen }); });
  $("pickq")?.addEventListener("input", (e) => { state.q = e.target.value; renderList(uid, onPick); });
  $("pickq")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); document.querySelector("#picklist [data-pick]")?.click(); }
    if (e.key === "ArrowDown") { e.preventDefault(); document.querySelector("#picklist [data-pick]")?.focus(); }
  });
  $("locate")?.addEventListener("click", () => locate(onPick));
  if (state.pickerOpen) { renderList(uid, onPick); $("pickq")?.focus(); }
}

function locate(onPick) {
  if (!navigator.geolocation) return;
  navigator.geolocation.getCurrentPosition((p) => {
    const { latitude: la, longitude: lo } = p.coords;
    const d = (s) => (s.lat - la) ** 2 + ((s.lon - lo) * Math.cos((la * Math.PI) / 180)) ** 2;
    const best = [...state.stations].sort((a, b) => d(a) - d(b))[0];
    if (best) onPick(best.uid);
  });
}
