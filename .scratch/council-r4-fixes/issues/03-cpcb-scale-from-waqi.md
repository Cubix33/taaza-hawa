# 03: Numbers are on the CPCB scale the verdict rule was written for

**What to build:**

- Every station number the app shows or judges is a CPCB-scale sub-index. It is made by converting WAQI's US-EPA 1-hour AQI back to a concentration (aqicn's own tables, pre-2024 PM2.5) and then applying the CPCB breakpoints.
- The fixed Go/Wait/Stay rule is unchanged, but it now gets the scale it was written for.
- Readings and estimates stored before the change are converted the same way whenever they are read, so these all stay on one scale:
  - the 24-hour line
  - neighbours used in an estimate
  - the record
  - school plans
- Calibration restarts on the new scale, and is honestly labelled as warming up.
- The UI labels the number "Indian AQI scale (CPCB), from the latest hourly reading". It does not claim to be CPCB's official 24-hour AQI.

**Blocked by:** None (can start immediately). Ships after 01 and 02 so the copy changes aren't held up by it.

**Status:** ready-for-agent

**Research (K3, resolved 9 Oct 2026):**

- The aqicn FAQ ("A comparison of worldwide Air Quality Scales") says: "At the World Air Quality Index project, only values converted to the US EPA scale are provided." It also says: "only AQI based on the 1-hour reading (and not the 24-hours average) are provided."
- The aqicn calculator (`air-cache/calculator/dist/calculator.js`, build 20241230) maps AQI points `[0,50,100,150,200,300,400,500]` to:
  - PM2.5 scale `[0,12,35.5,55.5,150.5,250.5,350.5,500.5]`, the pre-2024 EPA table
  - PM10 scale `[0,55,155,255,355,425,505,605]`
  - It interpolates linearly between these points.

Acceptance criteria:

- [ ] Converting a US-EPA AQI value to a CPCB sub-index matches hand-worked examples from both tables, and saturates at 500
- [ ] New readings are stored on the CPCB scale and marked with the scale
- [ ] Legacy readings, and legacy pending, graded or hold estimates, come out of every service read on the CPCB scale
- [ ] A legacy pending estimate graded by a new reading is judged on converted bounds. Past right/missed outcomes are unchanged
- [ ] Station calibration that was built on the old scale is reset once, and marked
- [ ] The CAMS input is unchanged (it is already CPCB-scale)
- [ ] The card and Air Lens label the scale honestly (CPCB scale, hourly, via WAQI)
- [ ] All existing tests pass, and new tests cover the conversion and the legacy reads
