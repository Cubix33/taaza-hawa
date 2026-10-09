# 01: Living sky: the atmosphere follows the real sun and the live AQI

**What to build:** Air Lens's 3D scene uses Delhi's real sun position for the current time: day, dusk or night lighting and the sun's direction. Its haze or fog density and colour follow the city's live median reading, so clear air looks clear and smoggy air looks smoggy. A one-line caption says that it is illustrative and not a camera. The existing Dusk/Day buttons become "Live / Dusk / Day", with Live as the default. Reduced-motion users get a static version.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Sun position is computed locally (no API) and tested against a known reference time
- [ ] Haze maps from reading to visual through a pure, tested function
- [ ] Toggle and caption are in hi and en; no console errors; build and tests pass
- [ ] Before/after screenshots: desktop and mobile, at a clean-air value and a smoggy value
