# Spec: council round 4 fixes (minus the clock)

Source: [docs/council/round-4-audience/02-verdict.md](../../docs/council/round-4-audience/02-verdict.md). The user's scope, 9 Oct 2026:

- Do the council's fixes, **except the WAQI `time.v` clock change**. The user has ruled it out because the live UI looks right to them.
- Every change is reviewed by a reviewer agent.
- Before anything lands on `main`, subagents verify that it is correct and that nothing else broke.
- Run `git pull` before every push.
- Pushing to `main` deploys, so no manual `sam deploy`.

## Problem

The council settled who Taaza Hawa is for. The primary user is a **healthy adult choosing when to run, walk or cycle**, and family who receive the share are secondary. Three things in the product don't match that, or aren't honest enough for a sceptical judge:

1. **The copy promises things the single rule can't deliver.**
   - "Send the kids to play" appears next to a rule that says Go at AQI 190.
   - "Wait" never says until when.
   - The button name "Check it and tell me" hides the best feature.
   - Nothing says who the advice is calibrated for.
2. **The track record looks too clean.**
   - The record page shows a percentage with no count beside it.
   - The record is 26 of 26 right, all from ranges that are still at the uncalibrated ±45 placeholder.
   - A sceptic reads that as "too wide to ever miss", and nothing on the page explains it.
3. **The numbers are on the wrong scale (open item K3).**
   - WAQI only publishes the US EPA AQI, computed from 1-hour readings. Sources:
     - the aqicn FAQ: "only values converted to the US EPA scale are provided"; "only AQI based on the 1-hour reading (and not the 24-hours average)"
     - aqicn's calculator code, which uses the pre-2024 PM2.5 breakpoints
   - The app applies **CPCB** bands to those numbers. PM10 reads low on the US scale and PM2.5 reads high, so some Go/Wait answers are wrong in both directions.

## Solution, from the user's side

- **Home and check pages** speak to the person deciding for themselves.
  - Nothing invites them to send children out.
  - "Wait" tells them when to look again.
  - The estimate button reads **"Hold me to this"**.
  - Every verdict carries one quiet line: **"Set for healthy adults. Not medical advice."**
  - The spoken answer says the same things.
- **The record page**
  - Never shows a percentage without "of N checked" next to it.
  - Explains in one line when ranges are still warming up, how many checks used warming-up ranges, and how wide those ranges were on average.
- **Every number** is a CPCB-scale sub-index: the US-EPA value converted back to µg/m³, then put through the CPCB breakpoints. It is labelled "Indian AQI scale (CPCB), from the latest hourly reading". The verdict rule doesn't change, but it now gets the scale it was written for.
  - Readings and estimates already in storage are converted the same way when read, so history lines and the record stay consistent.
  - Past right/missed outcomes don't change, because the conversion is monotonic.
  - Calibration restarts on the new scale, and the record line explains this.

## Out of scope

- The WAQI `time.v` clock fix (user decision).
- Removing or reframing the schools feature added on 9 Oct by Cubix33.
- Changing the verdict thresholds.
- New data sources or API keys.

## Seams under test

These were agreed in lieu of a live quiz, since the user asked for no check-in questions.

| Seam | Catches | Misses |
|---|---|---|
| `aqi` conversion functions (US-EPA AQI → µg/m³ → CPCB sub-index) | breakpoint and interpolation errors, against worked examples from the EPA/aqicn and CPCB tables | whether WAQI actually used these tables (covered by the research) |
| `waqi.parse_feed` | that new readings are stored on the CPCB scale and marked as such | — |
| `service` reads (`build_card`, `history`, `scoreboard`, `accuracy`, `recent_holds`) over a store seeded with legacy items | that legacy items come out converted, verdicts follow the converted values, and grading a legacy pending estimate uses converted bounds | DynamoDB-specific behaviour (MemoryStore has the same contract) |
| `speech.spoken_text` | that the spoken answer carries the Wait pointer and the healthy-adults line within the length limit | how Polly pronounces it |
| `accuracy()` | the count of warming-up checks and the mean range width | the UI wording |
| Web: the i18n table | that every changed key exists in both `hi` and `en` | layout (covered by Playwright screenshots) |
