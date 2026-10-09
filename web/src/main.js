import "./style.css";
import { state, set, onRender, ls } from "./lib/store.js";
import { t, hi } from "./lib/i18n.js";
import { esc, icon } from "./lib/ui.js";
import { pollHold, run, loadCard, stopSpeak } from "./lib/actions.js";
import * as home from "./pages/home.js";
import * as check from "./pages/check.js";
import * as stations from "./pages/stations.js";
import * as record from "./pages/record.js";
import * as school from "./pages/school.js";
import * as about from "./pages/about.js";

// hash routes work on any static host (Amplify) without rewrite rules
const PAGES = { home, check, school, stations, record, about };
const NAV = [
  ["home", "navHome", icon.home],
  ["check", "navCheck", icon.gauge],
  ["school", "navSchool", icon.school],
  ["stations", "navStations", icon.map],
  ["record", "navRecord", icon.record],
  ["about", "navAbout", icon.book],
];
// the phone tab bar keeps five; "How it works" stays in the top bar, the footer and on Check my air
const TABS = NAV.filter(([r]) => r !== "about");

function parseHash() {
  const [path, qs] = location.hash.replace(/^#\/?/, "").split("?");
  const route = PAGES[path] ? path : "home";
  return { route, params: Object.fromEntries(new URLSearchParams(qs || "")) };
}

function layout() {
  const page = PAGES[state.route];
  const demo = state.demo || state.card?.demo || state.board?.demo;
  return `
  <header class="topbar"><div class="wrap topbar-in">
    <a class="brand" href="#/">${icon.logo}<div><b>${t("brand")}</b><small>${t("tagline")}</small></div></a>
    <nav class="mainnav" aria-label="main">${NAV.map(([r, k]) => `<a href="#/${r === "home" ? "" : r}" class="nav-${r} ${state.route === r ? "on" : ""}" ${state.route === r ? 'aria-current="page"' : ""}>${t(k)}</a>`).join("")}</nav>
    <button id="lang" class="lang" aria-label="${hi() ? "Switch to English" : "हिंदी में देखें"}">${hi() ? "English" : "हिंदी"}</button>
  </div></header>
  ${demo ? `<div class="demo-bar">◆ ${t("demo")}</div>` : ""}
  <main id="main" class="route-${state.route}">${state.error && state.route !== "about" ? errorView() : page.view()}</main>
  <footer class="site-foot"><div class="wrap foot-in">
    <div class="foot-brand"><a class="brand" href="#/">${icon.logo}<div><b>${t("brand")}</b></div></a><p>${t("footLine")}</p></div>
    <nav class="foot-nav" aria-label="footer">${NAV.map(([r, k]) => `<a href="#/${r === "home" ? "" : r}">${t(k)}</a>`).join("")}</nav>
    <div class="foot-meta"><p>${t("footData")}</p><a href="https://github.com/Cubix33/taaza-hawa" target="_blank" rel="noopener">GitHub ↗</a></div>
  </div></footer>
  <nav class="tabbar" aria-label="main">${TABS.map(([r, k, ic], i) => `<a href="#/${r === "home" ? "" : r}" class="${state.route === r ? "on" : ""}" aria-label="${t(k)}">${ic}<span>${t("tabs")[i]}</span></a>`).join("")}</nav>`;
}

function errorView() {
  return `<div class="wrap"><section class="panel err"><p class="err-t">${t("offline")}</p><p class="muted small">${esc(state.error)}</p>
    <button id="retry" class="btn ghost">${t("retry")}</button></section></div>`;
}

function render() {
  const restore = PAGES[state.route]?.beforeRender?.();
  document.getElementById("app").innerHTML = layout();
  document.getElementById("lang")?.addEventListener("click", () => {
    stopSpeak(); state.lang = hi() ? "en" : "hi"; ls.set("lang", state.lang); document.documentElement.lang = state.lang; render();
  });
  document.getElementById("retry")?.addEventListener("click", () => { state.error = null; PAGES[state.route].load(); });
  PAGES[state.route].bind?.();
  restore?.();
}
onRender(render);

function navigate() {
  stopSpeak();
  const { route, params } = parseHash();
  const changed = route !== state.route;
  if (changed) PAGES[state.route]?.unmount?.();
  Object.assign(state, { route, params, error: null, pickerOpen: false });
  render();
  if (changed) window.scrollTo(0, 0);
  PAGES[route].load();
}

// close the station picker on an outside click or Escape (registered once, survives re-renders)
document.addEventListener("click", (e) => {
  if (state.pickerOpen && !e.target.closest(".combo")) set({ pickerOpen: false, q: "" });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && state.pickerOpen) { set({ pickerOpen: false, q: "" }); document.getElementById("pick")?.focus(); }
});

document.documentElement.lang = state.lang;
addEventListener("hashchange", navigate);
state.route = null;
navigate();
setInterval(pollHold, 15000);
setInterval(() => { if (state.route === "check" && !state.busy && !state.pickerOpen) run(loadCard); }, 5 * 60 * 1000);
if ("serviceWorker" in navigator && import.meta.env.PROD) navigator.serviceWorker.register("/sw.js").catch(() => {});
