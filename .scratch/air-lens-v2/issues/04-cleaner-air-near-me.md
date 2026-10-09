# 04: Cleaner air near me, plus polish

**What to build:** Once a pin or location is set, a "Cleaner air near you" list ranks fresh stations within a sensible radius by reading, with distance. It includes a one-line comparison, for example "Pusa reads 40 lower than your nearest station, 3.1 km away". The wording is honest: station air, not street air. Selecting a row focuses that station. Also fix any mobile layout, keyboard, contrast or empty-state issues found while auditing Air Lens.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Ranking is a pure, tested function (fresh only, radius, ties broken by distance)
- [ ] Works without a pin, with a prompt to set one
- [ ] hi and en; no console errors; build and tests pass; screenshots: desktop and mobile
