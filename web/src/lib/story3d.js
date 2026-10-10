// "How Taaza Hawa works", told as a 24-second 3D loop on the home page (three.js).
// An illustration with example numbers, captioned step by step:
//   1 stations send numbers  2 one goes quiet  3 we estimate it from its neighbours and a weather model
//   4 a NASA satellite counts fires upwind  5 at 06:30 schools and crews get a plan  6 the station reports
//   again and the estimate is checked in public.
// Plays only while on screen and while the tab is visible; with reduced motion it opens on the last
// step and waits for Play. If WebGL is unavailable the captions still tell the whole story.
import * as THREE from "three";
import { t } from "./i18n.js";

export const LOOP = 24;
export const STEPS = [0, 4, 8, 12, 16, 20]; // start time of each caption, seconds

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const ease = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const span = (tm, a, b) => ease((tm - a) / (b - a));
const css = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;

function glowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const g = c.getContext("2d"), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

// one air-quality station: pole, sensor box, inlet, status light
function mast(scene, x, z, glow, colors) {
  const steel = new THREE.MeshStandardMaterial({ color: colors.steel, roughness: 0.6, metalness: 0.3 });
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 5, 8), steel); pole.position.y = 2.5; g.add(pole);
  const box = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.75, 0.7), steel); box.position.y = 4.9; g.add(box);
  const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.6, 8), steel); inlet.position.set(0.22, 5.55, 0); g.add(inlet);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.18, 0.16, 12), steel); cap.position.set(0.22, 5.9, 0); g.add(cap);
  const ledMat = new THREE.MeshBasicMaterial({ color: colors.go });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), ledMat); led.position.set(-0.28, 5.5, 0); g.add(led);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: colors.go, transparent: true, opacity: 0.6, depthWrite: false }));
  halo.scale.set(1.5, 1.5, 1); halo.position.copy(led.position); g.add(halo);
  scene.add(g);
  return { ledMat, halo, top: new THREE.Vector3(x, 6.6, z), arcEnd: new THREE.Vector3(x + 0.22, 6.0, z) };
}

// a growing arc from a neighbour station to the quiet one
function arc(scene, from, to, color) {
  const mid = from.clone().lerp(to, 0.5); mid.y += 3.2;
  const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
  const geo = new THREE.TubeGeometry(curve, 48, 0.07, 6, false);
  const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
  const mesh = new THREE.Mesh(geo, mat); scene.add(mesh);
  const total = geo.index.count;
  geo.setDrawRange(0, 0);
  return { set(p) { geo.setDrawRange(0, Math.floor(total * clamp(p))); mat.opacity = 0.95; }, fade(o) { mat.opacity = o; } };
}

function satellite(scene, colors) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.6), new THREE.MeshStandardMaterial({ color: colors.steel, metalness: 0.5, roughness: 0.4 }));
  g.add(body);
  const panelMat = new THREE.MeshStandardMaterial({ color: colors.brand, metalness: 0.3, roughness: 0.5, side: THREE.DoubleSide });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.7), panelMat); p.position.x = s * 1.4; p.rotation.x = -Math.PI / 2; g.add(p); }
  // the swath it looks at: a faint cone towards the ground
  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 14, 24, 1, true),
    new THREE.MeshBasicMaterial({ color: colors.brand, transparent: true, opacity: 0.07, side: THREE.DoubleSide, depthWrite: false }));
  cone.position.y = -7; g.add(cone);
  scene.add(g);
  return { g, cone };
}

function school(scene, colors) {
  const g = new THREE.Group(); g.position.set(10, 0, 4);
  const wall = new THREE.MeshStandardMaterial({ color: colors.block, roughness: 0.9 });
  const main = new THREE.Mesh(new THREE.BoxGeometry(5, 2.6, 2.6), wall); main.position.y = 1.3; g.add(main);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.25, 2.9), new THREE.MeshStandardMaterial({ color: colors.steel })); roof.position.y = 2.7; g.add(roof);
  const winMat = new THREE.MeshBasicMaterial({ color: colors.muted });
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.5), winMat); w.position.set(-1.8 + i * 1.2, 0.8 + j * 1.0, 1.31); g.add(w);
  }
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 6), new THREE.MeshStandardMaterial({ color: colors.steel })); pole.position.set(2.2, 3.8, 0); g.add(pole);
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5), new THREE.MeshBasicMaterial({ color: colors.wait, side: THREE.DoubleSide })); flag.position.set(2.62, 4.6, 0); g.add(flag);
  scene.add(g);
  return { winMat, top: new THREE.Vector3(10, 4.2, 4), flag };
}

export function createStory() {
  const root = document.createElement("div");
  root.className = "story3d";
  root.innerHTML = `<div class="st-stage"><canvas aria-hidden="true"></canvas><div class="st-labels" aria-hidden="true"></div>
      <button type="button" class="st-toggle"></button><div class="st-bar"><i></i></div></div>
    <ol class="st-steps"></ol>`;
  const canvas = root.querySelector("canvas"), labels = root.querySelector(".st-labels");
  const toggle = root.querySelector(".st-toggle"), bar = root.querySelector(".st-bar i"), list = root.querySelector(".st-steps");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let playing = !reduced, visible = false, raf = 0, clock = reduced ? LOOP - 1.5 : 0, last = 0, lang = null, step = -1;

  // ---- captions: always present, even without WebGL ----
  function captions() {
    lang = t("brand");
    list.innerHTML = t("st3d").map(([h, p], i) => `<li data-i="${i}"><span class="st-n">${i + 1}</span><div><b>${h}</b><p>${p}</p></div></li>`).join("");
    list.querySelectorAll("li").forEach((li) => li.addEventListener("click", () => { clock = STEPS[Number(li.dataset.i)] + 0.01; if (!playing) frame(0); }));
    toggle.textContent = playing ? t("st3dPause") : t("st3dPlay");
    toggle.setAttribute("aria-pressed", String(!playing));
    step = -1;
  }
  captions();
  toggle.addEventListener("click", () => { playing = !playing; toggle.textContent = playing ? t("st3dPause") : t("st3dPlay"); toggle.setAttribute("aria-pressed", String(!playing)); if (playing) loop(); });

  // ---- the scene ----
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
  catch { root.classList.add("st-nogl"); return { root, refresh: captions, destroy() {} }; }
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  const colors = {
    bg: new THREE.Color(css("--bg", "#fbf8f2")), ink: new THREE.Color(css("--ink", "#1d1c19")), muted: new THREE.Color(css("--muted", "#7b776d")),
    go: new THREE.Color(css("--go", "#2d7d4f")), wait: new THREE.Color(css("--wait", "#a9600f")), stay: new THREE.Color(css("--stay", "#b03a2a")),
    brand: new THREE.Color(css("--brand", "#2f6da8")), steel: new THREE.Color(0x3a3b3f), block: new THREE.Color(css("--bg2", "#f2ede3")),
  };
  const dark = colors.bg.getHSL({}).l < 0.4;
  if (dark) colors.steel = new THREE.Color(0x8a8a8f);
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(colors.bg, 26, 70);
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, dark ? 0x222222 : 0xcfc6b5, dark ? 1.2 : 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, dark ? 1.0 : 1.6); sun.position.set(-12, 22, 10); scene.add(sun);

  // ground and a faint street grid
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshStandardMaterial({ color: colors.bg, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const grid = new THREE.GridHelper(80, 40, colors.muted, colors.muted);
  grid.material.transparent = true; grid.material.opacity = dark ? 0.12 : 0.18; grid.position.y = 0.01; scene.add(grid);

  // city blocks (one instanced mesh), kept clear of the stations and the school
  const keep = [[0, 0], [-7, -3], [6, -4], [2, 8], [-8, 6], [10, 4]];
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  const blocks = [];
  for (let i = 0; i < 260 && blocks.length < 120; i++) {
    const x = (rnd() - 0.5) * 50, z = (rnd() - 0.5) * 40;
    if (keep.some(([a, b]) => Math.hypot(x - a, z - b) < 3.2) || Math.hypot(x, z) > 26) continue;
    blocks.push([x, z, 0.6 + rnd() * rnd() * 3.4, 1 + rnd() * 1.6, 1 + rnd() * 1.6]);
  }
  const blockMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: colors.block, roughness: 0.95 }), blocks.length);
  const m4 = new THREE.Matrix4();
  blocks.forEach(([x, z, h, w, d], i) => { m4.compose(new THREE.Vector3(x, h / 2, z), new THREE.Quaternion(), new THREE.Vector3(w, h, d)); blockMesh.setMatrixAt(i, m4); });
  scene.add(blockMesh);

  const glow = glowTexture();
  const quiet = mast(scene, 0, 0, glow, colors);
  const nbs = [mast(scene, -7, -3, glow, colors), mast(scene, 6, -4, glow, colors), mast(scene, 2, 8, glow, colors)];
  const far = mast(scene, -8, 6, glow, colors);
  const allMasts = [quiet, ...nbs, far];
  const arcs = nbs.map((n) => arc(scene, n.arcEnd, quiet.arcEnd, colors.brand));
  // the weather model's contribution: a soft column of light from above
  const model = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 1.4, 14, 20, 1, true),
    new THREE.MeshBasicMaterial({ color: colors.brand, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
  model.position.set(0.2, 13, 0); scene.add(model);
  const sat = satellite(scene, colors);
  const pulseMat = () => new THREE.SpriteMaterial({ map: glow, color: colors.go, transparent: true, opacity: 0, depthWrite: false, fog: false });
  const sch = school(scene, colors);

  // fires on the north-west horizon, and wind carrying dust towards the city
  const fires = [];
  for (let i = 0; i < 18; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: new THREE.Color(i % 3 ? 0xff5a1f : 0xffb020), transparent: true, opacity: 0, depthWrite: false, fog: false }));
    s.position.set(-24 + rnd() * 11, 0.7, -22 + rnd() * 10); const k = 1.6 + rnd() * 1.6; s.scale.set(k, k, 1); scene.add(s); fires.push(s);
  }
  // where the stations' numbers go: a glowing hub above the city, and one pulse per station
  const hubPos = new THREE.Vector3(0.5, 10, -3);
  const hub = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: colors.brand, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  hub.position.copy(hubPos); hub.scale.set(3.2, 3.2, 1); scene.add(hub);
  const pulses = allMasts.map((m, i) => { const sp = new THREE.Sprite(pulseMat()); sp.scale.set(0.9, 0.9, 1); scene.add(sp); return { sp, from: m.top, off: i * 0.37 }; });
  const N = 420, pos = new Float32Array(N * 3), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) { pos[i * 3] = (rnd() - 0.5) * 60; pos[i * 3 + 1] = 0.5 + rnd() * 7; pos[i * 3 + 2] = (rnd() - 0.5) * 50; seed[i] = rnd(); }
  const dustGeo = new THREE.BufferGeometry(); dustGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const dustMat = new THREE.PointsMaterial({ color: dark ? 0x9b8f7e : 0x8c7d68, size: 0.16, transparent: true, opacity: 0.35, depthWrite: false });
  scene.add(new THREE.Points(dustGeo, dustMat));

  // ---- labels in HTML, placed over the 3D positions each frame ----
  const mk = (cls) => { const d = document.createElement("div"); d.className = `st-lab ${cls}`; labels.appendChild(d); return d; };
  const L = { quiet: mk("main"), nbs: nbs.map(() => mk("")), far: mk(""), sat: mk("sat"), fire: mk("fire"), school: mk("plan"), hub: mk("hub") };
  const NB_V = [238, 251, 229], FAR_V = 244;
  const v3 = new THREE.Vector3();
  function place(el, p, show = true) {
    v3.copy(p).project(camera);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    el.style.transform = `translate(-50%, -100%) translate(${((v3.x + 1) / 2) * w}px, ${((1 - v3.y) / 2) * h}px)`;
    el.style.opacity = show && v3.z < 1 ? "1" : "0";
  }
  const led = (m, c, on = 1) => { m.ledMat.color.copy(c); m.halo.material.color.copy(c); m.halo.material.opacity = 0.6 * on; };

  function frame(dt) {
    if (playing) clock = (clock + dt) % LOOP;
    const tm = clock;
    if (lang !== t("brand")) captions();
    const s = STEPS.reduce((a, b, i) => (tm >= b ? i : a), 0);
    if (s !== step) {
      step = s;
      list.querySelectorAll("li").forEach((li, i) => li.classList.toggle("on", i === s));
    }
    bar.style.width = `${(tm / LOOP) * 100}%`;

    // camera: a slow drift around the city, closer in the middle of the story
    const ang = -0.55 + Math.sin((tm / LOOP) * Math.PI * 2) * 0.18;
    const dist = 30 - 4 * span(tm, 6, 9) + 4 * span(tm, 11, 13) - 3 * span(tm, 16, 17.5) + 3 * span(tm, 22, 23.8);
    const k4 = span(tm, 11.8, 13.2) * (1 - span(tm, 15.8, 17));
    const base = new THREE.Vector3(Math.sin(ang) * dist, 15, Math.cos(ang) * dist);
    camera.position.copy(base.lerp(new THREE.Vector3(13, 10, 23), k4));
    camera.lookAt(new THREE.Vector3(1.5 * span(tm, 16, 17.5), 2.5 + 3 * span(tm, 0.2, 1.2) * (1 - span(tm, 3.6, 4.6)), 0).lerp(new THREE.Vector3(-11, 5, -12), k4));

    // 1 every station reports; 2 the middle one goes quiet; 6 it reports again
    const pulse = 0.75 + 0.25 * Math.sin(tm * 4);
    [...nbs, far].forEach((m) => led(m, colors.go, pulse));
    const quietOn = tm < 4.6 || tm > 20.6;
    led(quiet, quietOn ? colors.go : colors.muted, quietOn ? pulse : 0.15);
    scene.fog.near = 26 - 14 * span(tm, 4, 7) + 14 * span(tm, 20, 23);
    scene.fog.far = 70 - 22 * span(tm, 4, 7) * (1 - span(tm, 11.8, 12.6));

    // numbers flow up to the hub at the start, and again at the end
    const flow = (1 - span(tm, 4, 4.8)) + span(tm, 20.6, 21.4);
    hub.material.opacity = 0.75 * flow;
    pulses.forEach((q, i) => {
      const ph = ((tm * 0.9 + q.off) % 1);
      q.sp.position.copy(q.from).lerp(hubPos, ease(ph));
      const live = i === 0 ? (tm < 4.6 || tm > 20.6) : true;
      q.sp.material.opacity = live ? flow * Math.sin(Math.PI * ph) : 0;
    });

    // 3 the estimate: three arcs grow in, the weather model glows above
    arcs.forEach((a, i) => { a.set(span(tm, 8 + i * 0.4, 9.6 + i * 0.4)); if (tm > 12) a.fade(0.95 * (1 - span(tm, 12, 13))); });
    model.material.opacity = 0.16 * span(tm, 9.5, 10.5) * (1 - span(tm, 12, 13));

    // 4 the satellite passes; fires light up on the horizon; dust drifts in on the wind
    const sp = clamp((tm - 11.5) / 5.5);
    sat.g.position.set(-24 + sp * 26, 11.5, -2 - sp * 16);
    sat.g.visible = tm > 11.5 && tm < 17;
    sat.cone.material.opacity = 0.07 * Math.sin(Math.PI * sp);
    fires.forEach((f, i) => { f.material.opacity = span(tm, 12.4 + i * 0.08, 13.2 + i * 0.08) * (1 - span(tm, 17.5, 18.5)) * (0.7 + 0.3 * Math.sin(tm * 9 + i)); });
    const wind = span(tm, 12.5, 14) * (1 - span(tm, 18, 19));
    const p = dustGeo.attributes.position.array;
    for (let i = 0; i < N; i++) {
      p[i * 3] += dt * (0.4 + 1.8 * wind) * (0.6 + seed[i]);
      p[i * 3 + 2] += dt * (0.2 + 1.2 * wind) * (0.6 + seed[i]);
      if (p[i * 3] > 30) p[i * 3] -= 60;
      if (p[i * 3 + 2] > 25) p[i * 3 + 2] -= 50;
    }
    dustGeo.attributes.position.needsUpdate = true;
    dustMat.opacity = 0.25 + 0.3 * span(tm, 4, 7) * (1 - span(tm, 20, 23)) + 0.25 * wind;
    dustMat.size = 0.16 + 0.1 * wind;

    // 5 at 06:30 the school's windows light up and the plan arrives
    const planOn = span(tm, 16.2, 17);
    sch.winMat.color.copy(colors.muted).lerp(colors.wait, planOn * (1 - span(tm, 20.5, 21.5)));
    sch.flag.rotation.y = Math.sin(tm * 3) * 0.3;

    // labels
    nbs.forEach((m, i) => { L.nbs[i].textContent = `${NB_V[i]}`; place(L.nbs[i], m.top, tm < 13 || tm > 20); });
    L.far.textContent = `${FAR_V}`; place(L.far, far.top, tm < 13 || tm > 20);
    let main, cls = "";
    if (tm < 4.6) main = "AQI 240";
    else if (tm < 8.4) { main = t("st3dOld"); cls = "old"; }
    else if (tm < 20.6) { main = t("st3dRange"); cls = "est"; }
    else { main = t("st3dRight"); cls = "ok"; }
    if (L.quiet.textContent !== main) L.quiet.textContent = main;
    L.quiet.className = `st-lab main ${cls}`;
    place(L.quiet, quiet.top);
    L.sat.textContent = t("st3dSat"); place(L.sat, sat.g.position.clone().add(new THREE.Vector3(0, 1.2, 0)), tm > 12 && tm < 16.5);
    L.fire.textContent = t("st3dFires"); place(L.fire, new THREE.Vector3(-25, 1.6, -21), tm > 13.2 && tm < 17.5);
    L.school.textContent = t("st3dPlan"); place(L.school, sch.top, tm > 16.4 && tm < 20.5);
    L.hub.textContent = t("brand"); place(L.hub, hubPos.clone().add(new THREE.Vector3(0, 1.4, 0)), flow > 0.3);

    renderer.render(scene, camera);
  }

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 52 : 38; // a phone held upright needs a wider lens
    camera.updateProjectionMatrix();
    if (!playing) frame(0);
  }
  function loop(now) {
    cancelAnimationFrame(raf);
    if (!visible || document.hidden) return;
    raf = requestAnimationFrame((ts) => {
      const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0;
      last = ts;
      frame(playing ? dt : 0);
      if (playing) loop(); else last = 0;
    });
    return now;
  }
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; last = 0; if (visible) loop(); else cancelAnimationFrame(raf); }, { threshold: 0.15 });
  io.observe(root);
  const ro = new ResizeObserver(resize); ro.observe(canvas);
  const onVis = () => { last = 0; if (!document.hidden) loop(); };
  document.addEventListener("visibilitychange", onVis);

  return {
    root,
    refresh() { if (lang !== t("brand")) captions(); if (!playing) frame(0); },
    destroy() {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); document.removeEventListener("visibilitychange", onVis);
      scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; (Array.isArray(m) ? m : m ? [m] : []).forEach((x) => { x.map?.dispose?.(); x.dispose?.(); }); });
      renderer.dispose();
    },
  };
}
