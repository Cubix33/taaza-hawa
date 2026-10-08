import { api, post } from "./api.js";
import { state, set, ls } from "./store.js";

export async function loadStations() {
  const st = await api("/stations");
  state.stations = st.stations;
  state.demo = !!st.demo;
  if (!state.stations.some((s) => s.uid === state.uid) && state.stations[0]) state.uid = state.stations[0].uid;
}

export async function loadCard() {
  const [card] = await Promise.all([api(`/card?uid=${state.uid}`), loadStations()]);
  state.card = card;
}

export async function loadBoard() {
  state.board = await api("/scoreboard");
  state.demo = state.demo || !!state.board.demo;
}

export async function restoreHold() {
  const hid = ls.get("hold");
  if (!hid || state.hold) return;
  try { state.hold = await api(`/hold?id=${encodeURIComponent(hid)}`); } catch { ls.set("hold", ""); }
}

// run a loader, keep the page rendered, surface errors in place
export async function run(...loaders) {
  try { await Promise.all(loaders.map((f) => f())); set({ error: null }); } catch (e) { set({ error: e.message }); }
}

export function goStation(uid) {
  state.uid = uid; ls.set("uid", uid);
  state.card = null; state.pickerOpen = false; state.q = "";
  if (location.hash.startsWith("#/check")) { history.replaceState(null, "", `#/check?s=${uid}`); set({}); run(loadCard); }
  else location.hash = `#/check?s=${uid}`;
}

function emailInput() {
  const v = document.getElementById("email")?.value.trim();
  if (v) ls.set("email", v);
  return v || null;
}

export async function startHold() {
  const email = emailInput();
  set({ busy: true });
  try {
    state.hold = await post("/hold", { uid: state.uid, email });
    ls.set("hold", state.hold.id);
  } catch (e) { state.error = e.message; }
  set({ busy: false });
}

export async function addEmail() {
  const email = emailInput();
  if (!email || !state.hold) return;
  try { state.hold = await post("/hold/email", { id: state.hold.id, email }); } catch (e) { state.error = e.message; }
  set({});
}

export async function pollHold() {
  if (!state.hold || state.hold.status !== "PENDING") return;
  try {
    const h = await api(`/hold?id=${encodeURIComponent(state.hold.id)}`);
    if (h.status !== state.hold.status) { state.hold = h; if (state.route === "check") await loadCard(); set({}); }
  } catch { /* keep waiting */ }
}
