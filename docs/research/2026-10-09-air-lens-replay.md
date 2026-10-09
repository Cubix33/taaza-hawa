# Air Lens 24-hour replay: research notes and a clock finding

Ticket 03, 9 October 2026. Code: `web/src/lib/air-lens-replay.js` (pure, tested) and `web/src/lib/air-lens-replay-ui.js` (timeline).

## Clock finding (measured on the live API, 9 Oct 2026 ~19:15 IST)

`GET /history?uid=2553&hours=24` returned `now = 1791553391` and the newest point `ts = 1791568800`. The newest reading is 4.3 h *after* `now`. WAQI's `time.v` appears to be IST wall-clock time stored as if it were UTC, which puts the epoch 5.5 h ahead. `freshness.age_minutes` clamps the result with `max(0, …)`.

Consequences:
- "N h ago" computed as `now - ts` would give negative ages for the newest ~5 hours, so it can't be used as a timeline label.
- Gaps *between* readings are exact, because all readings share the same offset. The replay therefore anchors on the newest hour that at least two stations reported. It labels each frame "N h before the latest reading". It uses no wall-clock times and never computes `now - ts`.
- The same clamp affects the live product. A reading up to about 5.5 h old shows `age_min = 0` ("fresh"), and the 3-hour stale line falls at about 8.5 h of real age. Backend is unchanged by this ticket; this note flags it for the team.

## UX patterns used, with sources

- A native `<input type="range">` with `aria-valuetext` for a readable value ("12 h before the latest reading · Anand Vihar: AQI 152"). Arrow keys, Home/End and PageUp/PageDown come free. [WAI-ARIA APG slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/), [MDN aria-valuetext](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-valuetext)
- Play/pause changes its accessible name. It doesn't use `aria-pressed`, because using both is confusing. [MDN aria-pressed](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-pressed)
- Playback starts only when the user presses Play, and it can be paused. Timers stop when the tab is hidden. [WCAG 2.2.2 Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html)
- Under reduced motion, playback steps hour by hour: no playhead glide, and each hour is held longer. Colour changes are not "motion" under SC 2.3.3. The map camera never moves during replay. [WCAG 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html), [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- Sliders are imprecise, especially on touch. The design snaps to whole hours, keeps the value readout above the thumb (not under the finger), and adds one-hour step buttons. [NN/g slider guidelines](https://www.nngroup.com/articles/gui-slider-controls/), [USWDS range slider](https://designsystem.digital.gov/components/range-slider/)
- Time-slider pattern on maps: a range input drives which values the map shows; play/step/loop controls follow ArcGIS's TimeSlider. [MapLibre "Create a time slider"](https://maplibre.org/maplibre-gl-js/docs/examples/create-a-time-slider/), [ArcGIS TimeSlider](https://developers.arcgis.com/javascript/latest/api-reference/esri-widgets-TimeSlider.html)
- Missing hours stay visible as gaps. Nothing is connected or interpolated across them. [Datawrapper: patchy data](https://www.datawrapper.de/academy/patchy-data)
- MapLibre 6.13.0: the replay adds no new API calls. It reuses the existing DOM `Marker` set (`setLngLat`, `addTo`, `getElement` are present in `maplibre-gl.d.ts`).
