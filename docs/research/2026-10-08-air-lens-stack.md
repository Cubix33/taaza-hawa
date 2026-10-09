# Air Lens map stack evidence — 2026-10-08

Research notes, not an implementation or tested performance claim. Sources below are primary official documentation checked on this date.

## Recommendation

Use `maplibre-gl` with OpenFreeMap vector tiles for a Delhi-centred map. Begin with the Positron style (`https://tiles.openfreemap.org/styles/positron`) or Liberty, then choose after visual inspection of Delhi. Lazy-load the map, retain station cards outside its canvas, and support flat view. Tilt approximately 35–45 degrees on desktop with modest bearing; use flat/low-pitch on mobile until measured on actual devices. Building extrusions are optional local-zoom polish, not the core feature. No globe, Cesium dependency, Google photorealistic tiles, deck.gl, Three.js, or LLM is needed for this scope.

This decision is about appropriate scope and data precision. It is not a finding that Cesium is inherently unusable or that MapLibre is guaranteed to be fast on every phone. Test tile startup, camera interaction, reduced motion, WebGL failure, and ordinary midrange phones before making performance claims.

## Map provider and integration

- [OpenFreeMap home](https://openfreemap.org/) states its public instance is free, with no registration/API key and no view/request limits. It also explicitly offers no SLA. Keep a usable station list/card when tiles cannot load. Do not turn those statements into a service guarantee.
- [OpenFreeMap quick start](https://openfreemap.org/quick_start/) documents `maplibre-gl`, its CSS import, Vite worker configuration, style URLs, and customization with Maputnik. Copy the integration pattern appropriate to the pinned package version rather than mixing CDN snippets from different MapLibre releases.
- The same provider requires OpenMapTiles/OpenStreetMap attribution, including in printed media and video. Keep the MapLibre attribution control and include attribution in demo capture. Its licensing section distinguishes project code from map data and included projects.
- [MapLibre examples](https://maplibre.org/maplibre-gl-js/docs/examples/) provide pitch/bearing, geolocation, restricted bounds, cooperative gestures, WebGL support checking, and animations. Use built-in tools first.

## Building extrusions: supported, but approximate

[MapLibre's official 3D buildings example](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/) directly uses OpenFreeMap: source `https://tiles.openfreemap.org/planet`, source layer `building`, `fill-extrusion`, fields `render_height` and `render_min_height`, and excludes `hide_3d`. It displays extrusions at local zoom levels.

[OpenMapTiles schema](https://openmaptiles.org/docs/schema/) and [building schema source](https://github.com/openmaptiles/openmaptiles/blob/master/layers/building/building.yaml) describe render heights as approximations based on building height/levels. This is not photorealistic building geometry or proof of measured height. Delhi footprint/height completeness has not been assessed here. Validate Connaught Place, a dense residential locality, and the river surroundings in a running map before deciding whether extrusions improve the presentation. Do not invent a precise default height and describe it as measured. Label the optional geometry as illustrative map context, and never use it to infer vertical pollutant concentration or exposure.

The other AI's “ten lines” description omits loading, source compatibility, insertion below labels, lifecycle, style changes, error handling, and accessibility. A small extrusion layer is feasible, but that count is not a project estimate.

## Estimate connections and animation

[Turf greatCircle](https://turfjs.org/docs/api/greatCircle) computes spherical routes and returns a LineString or MultiLineString. It does not compute an elevated 3D arch. At Delhi station distances a great-circle line will usually look nearly straight; this visual judgement is an inference from city scale, not an official performance claim.

For MVP, use straight GeoJSON connections from the selected station to the actual estimator inputs, and a one-shot reveal animation. MapLibre's [animate-a-line example](https://maplibre.org/maplibre-gl-js/docs/examples/animate-a-line/) documents updating a GeoJSON source with `requestAnimationFrame`. If a more visible curve is desired, sample a modest quadratic Bézier in local projected coordinates, labelled as an evidence link, and preserve endpoint locations. It represents estimator dependency, not airflow or pollutant transport. A screen-space curve needs regeneration after map/camera changes; a map-coordinate line avoids this additional complexity.

No full `@turf/turf` dependency is required just for arcs. If actual geodesic routes become necessary, import `@turf/great-circle` alone. Do not assume dash-array animation automatically supplies a stable lifecycle. Cancel frames on selection/unmount, stop under reduced-motion or hidden-tab conditions, and leave a static final state. Three links should mean three actual eligible inputs, not a fixed decorative count.

## God's Eye View: correct the comparison

[The current official God's Eye View README](https://github.com/bilawalsidhu/gods-eye-view/blob/main/README.md) explicitly supports starting without accounts or API keys, using Esri satellite imagery/keyless terrain and OSM fallback. Photorealistic 3D is an optional upgrade through Cesium ion or a Google Maps key, subject to provider eligibility, terms and quotas. Its recorded startup benchmark is explicitly not a guarantee.

Therefore “Cesium requires heavy API tokens and crashes judges' phones” is not established by the repository. The sound reason to avoid importing that application is that its global spatial-intelligence scope, models and interaction system are unnecessary for explaining a Delhi station estimate. No reuse of its code, HUD, branding, data bundles, or media is proposed.

## Groq: optional prose only

Maps, tile rendering, connections, breathing comparisons and receipt verification are deterministic tasks and require no Groq calls. Make the complete MVP function with zero LLM keys. If a later optional explainer is added, provide structured verified facts to it, cache output, use server-side credentials, short bounded requests, and a deterministic Hindi/English template fallback. An LLM must not select station inputs, generate readings, calculate exposure, announce GRAP status, or determine a Hit/Miss.

[Groq rate-limit documentation](https://console.groq.com/docs/rate-limits) states limits apply at the organization level and exact account limits are available in its console. Multiple keys in one organization do not multiply that organization's quota. Do not design a nine-key round-robin quota workaround. Use one appropriate server-side key and respect provider limits; key rotation for compromised credentials is a separate security practice.

[Groq security documentation](https://console.groq.com/docs/production-readiness/security-onboarding) explicitly directs applications to protect secrets through environment variables/secret management and a trusted backend proxy. Never put a Groq key into a `VITE_*` variable or browser bundle. No model, cost, quota, or availability guarantee is needed for this map plan.
