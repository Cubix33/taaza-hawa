# 03: 24-hour replay across all stations

**What to build:** A timeline under the map that scrubs or plays the last 24 hours. Station markers show each station's reading at the chosen hour, using the existing `/history` endpoint, fetched lazily and cached. A station with no reading in an hour shows as missing, never interpolated. The selected station's "best hour so far today" is called out so a person can see when the air was better. "Now" returns to live.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Bucketing history into hourly frames is a pure, tested function: gaps stay gaps
- [ ] Playback respects reduced motion (step, don't animate) and is keyboard-operable (slider plus play/pause)
- [ ] hi and en; no console errors; build and tests pass; screenshots: desktop and mobile
