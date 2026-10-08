// Hero illustration: a Delhi skyline under a sky drawn from the city's current AQI.
// Clean air -> clear blue sky, bright sun, crisp skyline. Smog -> brown-grey sky, dim orange sun,
// skyline fading into haze. It is the data, not decoration.
const lerp = (a, b, k) => a + (b - a) * k;
const mix = (c1, c2, k) => `rgb(${c1.map((v, i) => Math.round(lerp(v, c2[i], k))).join(",")})`;

export function skyK(aqi) {
  return Math.max(0, Math.min(1, ((aqi ?? 150) - 50) / 300)); // 0 at AQI 50, 1 at AQI 350
}

export function sky(aqi) {
  const k = skyK(aqi);
  const top = mix([150, 196, 230], [190, 178, 158], k);
  const mid = mix([196, 222, 242], [216, 198, 168], k);
  const hor = mix([238, 245, 250], [238, 220, 188], k);
  const sun = mix([255, 228, 140], [236, 142, 84], k);
  const haze = mix([240, 246, 250], [226, 202, 162], k);
  const vis = lerp(0.92, 0.28, k);     // how much of the skyline you can still see
  const far = lerp(0.38, 0.1, k);
  return `<svg class="sky" viewBox="0 0 1440 560" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
  <defs>
    <linearGradient id="skyg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${top}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${hor}"/>
    </linearGradient>
    <radialGradient id="sung"><stop offset="0" stop-color="${sun}" stop-opacity="${lerp(0.75, 0.45, k)}"/><stop offset="1" stop-color="${sun}" stop-opacity="0"/></radialGradient>
    <linearGradient id="hazeg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${haze}" stop-opacity="0"/><stop offset="1" stop-color="${haze}" stop-opacity="${lerp(0.15, 0.85, k)}"/></linearGradient>
    <filter id="soft"><feGaussianBlur stdDeviation="18"/></filter>
  </defs>
  <rect width="1440" height="560" fill="url(#skyg)"/>
  <g class="sun"><circle cx="1190" cy="180" r="${lerp(170, 120, k)}" fill="url(#sung)"/>
  <circle cx="1190" cy="180" r="${lerp(44, 38, k)}" fill="${sun}" opacity="${lerp(1, 0.75, k)}"/></g>
  <g class="drift" filter="url(#soft)" opacity="${lerp(0.25, 0.75, k)}" fill="${haze}">
    <ellipse cx="300" cy="300" rx="380" ry="38"/><ellipse cx="1000" cy="320" rx="460" ry="44"/><ellipse cx="700" cy="230" rx="300" ry="26"/>
  </g>
  <g fill="var(--sky-ink)" opacity="${far}">
    <rect x="20" y="470" width="60" height="40"/><rect x="150" y="462" width="44" height="48"/><rect x="330" y="468" width="70" height="42"/><rect x="560" y="455" width="56" height="55"/>
    <rect x="700" y="430" width="70" height="80"/><rect x="800" y="410" width="50" height="100"/><rect x="1080" y="420" width="40" height="90"/>
    <rect x="1262" y="400" width="34" height="110"/><rect x="1400" y="415" width="60" height="95"/>
  </g>
  <g fill="var(--sky-ink)" opacity="${vis}">
    <path d="M882 510 L892 240 L898 240 L896 226 L906 226 L904 240 L910 240 L922 510 Z"/>
    <rect x="886" y="300" width="32" height="5"/><rect x="884" y="360" width="36" height="5"/><rect x="883" y="420" width="38" height="5"/>
    <path d="M960 510 V448 H972 V430 H1068 V448 H1080 V510 Z"/><path d="M978 430 A42 42 0 0 1 1062 430 Z"/><rect x="1018" y="372" width="4" height="18"/>
    <path d="M1120 510 V352 H1140 V340 H1240 V352 H1260 V510 H1215 V430 A25 25 0 0 0 1165 430 V510 Z"/><rect x="1174" y="326" width="32" height="14"/><path d="M1180 326 A10 8 0 0 1 1200 326 Z"/>
    <path d="M1286 510 Q1306 440 1338 452 Q1354 396 1370 452 Q1402 440 1422 510 Z"/>
    <path d="M1322 510 Q1336 470 1354 474 Q1372 470 1386 510 Z" opacity=".55"/>
    <path d="M40 510 V478 H90 V466 L112 452 L134 466 V478 H160 V510 Z"/><path d="M420 510 V474 H470 V462 H520 V510 Z"/>
    <rect x="0" y="505" width="1440" height="55"/>
    <g><circle cx="200" cy="492" r="18"/><circle cx="224" cy="486" r="22"/><circle cx="250" cy="495" r="15"/><circle cx="330" cy="494" r="16"/>
       <circle cx="600" cy="490" r="20"/><circle cx="625" cy="482" r="24"/><circle cx="652" cy="493" r="17"/><circle cx="780" cy="494" r="16"/>
       <circle cx="940" cy="494" r="14"/><circle cx="1100" cy="492" r="15"/></g>
  </g>
  <rect width="1440" height="560" fill="url(#hazeg)"/>
</svg>`;
}
