// Interactive 3D map of Delhi's air stations: one extruded column per station.
// Height = how bad the air is (AQI) or how old the number is; colour = AQI band; old numbers
// are see-through with a dashed ochre ring on the ground. Loaded only on the stations page.
const BAND_HEX = ["#3fae6a", "#9cc64b", "#e2bb3f", "#eb8f3c", "#d4503c", "#8e2340"];
const STOPS = [50, 100, 200, 300, 400, 500];
const OCHRE = "#b8641b";
const STYLE = "https://tiles.openfreemap.org/styles/positron"; // free vector tiles, no API key

const bandHex = (v) => {
  if (v == null) return "#9a968c";
  const i = STOPS.findIndex((u) => v <= u);
  return BAND_HEX[i < 0 ? 5 : i];
};

function circle(lon, lat, r = 650, n = 40) {
  const dx = r / (111320 * Math.cos((lat * Math.PI) / 180)), dy = r / 110540;
  const ring = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * 2 * Math.PI; ring.push([lon + dx * Math.cos(a), lat + dy * Math.sin(a)]); }
  return ring;
}

function height(s, mode) {
  if (mode === "age") return s.age_min == null ? 300 : Math.max(300, (Math.log1p(s.age_min) - 1.5) * 1500);
  return s.aqi == null ? 300 : Math.max(300, s.aqi * 25);
}

function toGeo(stations, mode, current) {
  return {
    type: "FeatureCollection",
    features: stations.filter((s) => s.lat && s.lon).map((s) => ({
      type: "Feature",
      properties: { uid: s.uid, name: s.name, aqi: s.aqi ?? -1, age: s.age_min ?? -1, old: s.old ? 1 : 0,
        cur: s.uid === current ? 1 : 0, color: bandHex(s.aqi), h: height(s, mode) },
      geometry: { type: "Polygon", coordinates: [circle(s.lon, s.lat)] },
    })),
  };
}

export async function mount3d(el, getData, { popupHtml, onOpen }) {
  const [{ default: maplibregl }] = await Promise.all([import("maplibre-gl"), import("maplibre-gl/dist/maplibre-gl.css")]);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const map = new maplibregl.Map({
    container: el, style: STYLE, center: [77.14, 28.63], zoom: 10.1, pitch: 58, bearing: -20,
    maxPitch: 75, antialias: true, attributionControl: { compact: true }, cooperativeGestures: false,
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
  await new Promise((res, rej) => { map.once("load", res); map.once("error", (e) => rej(e.error || e)); });

  const d = getData();
  map.addSource("st", { type: "geojson", data: toGeo(d.stations, d.mode, d.current) });
  map.addLayer({ id: "ring-old", type: "line", source: "st", filter: ["==", ["get", "old"], 1],
    paint: { "line-color": OCHRE, "line-width": 2, "line-dasharray": [2, 1.5] } });
  map.addLayer({ id: "cols-fresh", type: "fill-extrusion", source: "st", filter: ["==", ["get", "old"], 0],
    paint: { "fill-extrusion-color": ["get", "color"], "fill-extrusion-height": ["get", "h"], "fill-extrusion-opacity": 0.9 } });
  map.addLayer({ id: "cols-old", type: "fill-extrusion", source: "st", filter: ["==", ["get", "old"], 1],
    paint: { "fill-extrusion-color": ["get", "color"], "fill-extrusion-height": ["get", "h"], "fill-extrusion-opacity": 0.4 } });
  map.addLayer({ id: "cur", type: "line", source: "st", filter: ["==", ["get", "cur"], 1],
    paint: { "line-color": "#1d1c19", "line-width": 3 } });

  const hover = new maplibregl.Popup({ closeButton: false, closeOnClick: false, offset: 12, className: "m3pop" });
  const pinned = new maplibregl.Popup({ closeButton: true, offset: 12, className: "m3pop" });
  const props = (e) => e.features?.[0]?.properties;
  for (const id of ["cols-fresh", "cols-old"]) {
    map.on("mousemove", id, (e) => {
      map.getCanvas().style.cursor = "pointer";
      const p = props(e); if (p) hover.setLngLat(e.lngLat).setHTML(popupHtml(p, false)).addTo(map);
    });
    map.on("mouseleave", id, () => { map.getCanvas().style.cursor = ""; hover.remove(); });
    map.on("click", id, (e) => {
      const p = props(e); if (!p) return;
      hover.remove();
      pinned.setLngLat(e.lngLat).setHTML(popupHtml(p, true)).addTo(map);
      pinned.getElement()?.querySelector("[data-open]")?.addEventListener("click", () => onOpen(p.uid));
    });
  }

  // a slow intro orbit, so it is obvious the map is 3D and alive
  if (!reduce) map.easeTo({ bearing: 12, pitch: 60, duration: 2600 });

  return {
    update() {
      const x = getData();
      map.getSource("st")?.setData(toGeo(x.stations, x.mode, x.current));
    },
    resize: () => map.resize(),
  };
}
