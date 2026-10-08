// Hero background: drifting haze whose density and colour come from Delhi's current AQI.
// Clean air -> sparse, cool mint motes; smog -> dense, warm amber haze. Not decoration: it is the data.
let raf = 0, stop = () => {};

const lerp = (a, b, k) => a + (b - a) * k;
const mix = (c1, c2, k) => c1.map((v, i) => Math.round(lerp(v, c2[i], k)));
const CLEAN = [120, 230, 200], SMOG = [232, 150, 70];

export function startSky(canvas, aqi) {
  stop();
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const k = Math.max(0, Math.min(1, ((aqi ?? 150) - 50) / 300)); // 0 at AQI 50, 1 at AQI 350
  const tint = mix(CLEAN, SMOG, k);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, dpr = 1, parts = [];

  function size() {
    dpr = Math.min(2, devicePixelRatio || 1);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const blobs = Math.round(lerp(6, 22, k)), motes = Math.round(lerp(50, 220, k) * (W / 1200 + 0.4));
    parts = [];
    for (let i = 0; i < blobs; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, r: lerp(120, 320, Math.random()), a: lerp(0.05, 0.13, k) * (0.6 + Math.random() * 0.6), vx: (Math.random() - 0.3) * 0.12, vy: (Math.random() - 0.5) * 0.04, blob: true });
    for (let i = 0; i < motes; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, r: 0.6 + Math.random() * 1.6, a: 0.25 + Math.random() * 0.5, vx: 0.05 + Math.random() * 0.25, vy: (Math.random() - 0.5) * 0.08, ph: Math.random() * 6.28 });
  }

  function frame(time) {
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      if (!reduce) {
        p.x += p.vx; p.y += p.vy;
        if (p.x - p.r > W) p.x = -p.r; if (p.x + p.r < 0) p.x = W + p.r;
        if (p.y - p.r > H) p.y = -p.r; if (p.y + p.r < 0) p.y = H + p.r;
      }
      if (p.blob) {
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `rgba(${tint},${p.a})`); g.addColorStop(1, `rgba(${tint},0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      } else {
        const tw = reduce ? 1 : 0.6 + 0.4 * Math.sin(time / 900 + p.ph);
        ctx.fillStyle = `rgba(${tint},${p.a * tw})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
      }
    }
    if (!reduce && !document.hidden) raf = requestAnimationFrame(frame);
  }

  const onResize = () => { size(); if (reduce) frame(0); };
  const onVis = () => { if (!document.hidden && !reduce) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); } };
  size();
  raf = requestAnimationFrame(frame);
  addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVis);
  stop = () => { cancelAnimationFrame(raf); removeEventListener("resize", onResize); document.removeEventListener("visibilitychange", onVis); };
}

export const stopSky = () => stop();
