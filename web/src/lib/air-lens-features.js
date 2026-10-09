// Which Air Lens v2 features this build shows: 'sky', 'wind', 'replay', 'nearby'.
// Each airlens/NN-* comparison branch sets its own list here; VITE_LENS_FEATURES (comma list) overrides it.
const FEATURES = ['replay'];
const env = import.meta.env?.VITE_LENS_FEATURES;
const on = new Set(env != null ? env.split(',').map((s) => s.trim()).filter(Boolean) : FEATURES);
export const lensFeature = (name) => on.has(name);
