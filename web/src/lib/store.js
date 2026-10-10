// One shared state object; pages read it, actions patch it and re-render.
export const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

// optional chaining: node --test imports this module, where import.meta.env doesn't exist
export const DEFAULT_UID = Number(import.meta.env?.VITE_DEFAULT_UID || 1);

export const state = {
  lang: ls.get("lang") || "hi",
  route: "home",
  params: {},
  uid: Number(ls.get("uid")) || DEFAULT_UID,
  stations: [],
  card: null,
  board: null,
  hold: null,
  error: null,
  busy: false,
  pickerOpen: false,
  q: "",
  filter: "all",
  sort: "name",
  activity: ls.get("activity") || "",
  history: null,
  voice: "",
  voiceErr: false,
  explanation: null,
  explainBusy: false,
  explainError: null,
};

let _render = () => {};
export const onRender = (fn) => { _render = fn; };
export const render = () => _render();
export const set = (patch) => { Object.assign(state, patch); _render(); };
