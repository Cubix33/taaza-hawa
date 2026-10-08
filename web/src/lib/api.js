// localhost fallback only in `npm run dev`; a production build without VITE_API_URL must fail loudly,
// otherwise it silently talks to whatever demo server happens to run on the viewer's machine
const API = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "http://localhost:8787" : "")).replace(/\/$/, "");

export async function api(path, opts) {
  if (!API) throw new Error("VITE_API_URL was not set when this site was built. Set it in Amplify and redeploy.");
  const r = await fetch(API + path, opts);
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

export const post = (path, body) =>
  api(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
