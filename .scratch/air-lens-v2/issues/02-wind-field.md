# 02: Wind field and a plain wind readout

**What to build:** A toggleable layer of animated wind over Delhi, from Open-Meteo's free, keyless forecast API (current 10 m wind on a small grid, fetched in one request). The selected station's panel shows a readout such as "Wind from the NW, 8 km/h (Open-Meteo model)". The wording never says the wind carries the station's pollution. If the fetch fails, the layer is hidden quietly. The animation pauses when the tab is hidden and when reduced motion is set.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Grid fetch is a single request, cached about 30 minutes, and parsed by a pure, tested function
- [ ] Converting direction to a compass label and to a vector is unit-tested
- [ ] Layer toggle, readout and model label are in hi and en
- [ ] No console errors; build and tests pass; screenshots: desktop and mobile
