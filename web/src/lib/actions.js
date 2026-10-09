import { api, post } from "./api.js";
import { state, set, ls } from "./store.js";

let stationsPromise = null;

export async function loadStations(force = false) {
  if (!force && state.stations?.length) {
    if (!state.stations.some((s) => s.uid === state.uid) && state.stations[0]) {
      state.uid = state.stations[0].uid;
      ls.set("uid", state.uid);
    }
    return state.stations;
  }
  if (!stationsPromise) {
    stationsPromise = (async () => {
      try {
        const st = await api("/stations");
        state.stations = st.stations || [];
        state.demo = !!st.demo;
        state.emailEnabled = !!st.email_enabled;
        if (!state.stations.some((s) => s.uid === state.uid) && state.stations[0]) {
          state.uid = state.stations[0].uid;
          ls.set("uid", state.uid);
        }
        return state.stations;
      } finally {
        stationsPromise = null;
      }
    })();
  }
  return stationsPromise;
}

export async function loadCard() {
  await loadStations();
  if (!state.stations.some((s) => s.uid === state.uid) && state.stations[0]) {
    state.uid = state.stations[0].uid;
    ls.set("uid", state.uid);
  }
  if (!state.uid) return;
  try {
    const [card, hist] = await Promise.all([
      api(`/card?uid=${state.uid}`),
      api(`/history?uid=${state.uid}&hours=24`).catch(() => null),
    ]);
    state.card = card;
    state.history = hist;
  } catch (err) {
    if (state.stations[0] && state.uid !== state.stations[0].uid) {
      state.uid = state.stations[0].uid;
      ls.set("uid", state.uid);
      const [card, hist] = await Promise.all([
        api(`/card?uid=${state.uid}`),
        api(`/history?uid=${state.uid}&hours=24`).catch(() => null),
      ]);
      state.card = card;
      state.history = hist;
    } else {
      throw err;
    }
  }
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
  stopSpeak();
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

// ---------- spoken answer: Amazon Polly (Kajal) via the API, browser voice as a fallback ----------
let player = null;

export function stopSpeak() {
  try { player?.pause(); } catch { /* already stopped */ }
  player = null;
  try { speechSynthesis.cancel(); } catch { /* not supported */ }
  if (state.voice || state.voiceErr) set({ voice: "", voiceErr: false });
}

export async function toggleSpeak(fallbackText) {
  if (state.voice) { stopSpeak(); return; }
  // WebKit only allows play() that starts from a tap: touch the element now, give it audio after the fetch
  const a = new Audio();
  a.play().catch(() => {});
  player = a;
  set({ voice: "loading", voiceErr: false });
  try {
    const r = await api(`/speak?uid=${state.uid}&lang=${state.lang}`);
    if (player !== a) return; // stopped while loading
    a.src = `data:${r.mime};base64,${r.audio}`;
    a.onended = () => { if (player === a) { player = null; set({ voice: "" }); } };
    await a.play();
    set({ voice: "playing" });
  } catch {
    if (player !== a) return;
    player = null;
    if (!("speechSynthesis" in window) || !fallbackText) { set({ voice: "", voiceErr: true }); return; }
    const u = new SpeechSynthesisUtterance(fallbackText);
    u.lang = state.lang === "hi" ? "hi-IN" : "en-IN";
    u.onend = u.onerror = () => set({ voice: "" });
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
    set({ voice: "playing" });
  }
}

