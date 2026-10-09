# Round 4: peer reviews and fact-check

Each reviewer saw the five answers with the advisors' names hidden. Letters: A = Executor, B = Contrarian, C = Outsider, D = Expansionist, E = First Principles. Each reviewer took a different angle (shown in brackets).

## Peer reviews

| # | Reviewer angle | Strongest | Biggest blind spot | What every advisor missed |
|---|---|---|---|---|
| 1 | General | **B**: the only one that tests how each part could fail on camera | **D** | Will the track record have enough data by 11 Oct? Show the number of graded checks next to the percentage. The Hindi-first design, voice and WhatsApp share suit a different user than an English-speaking runner. |
| 2 | Sceptical judge | **B**, with C a close second | **D**: makes the child-safety flaw worse, may contradict court orders on school sports, and quotes an "83%" that doesn't exist | The main feature may never appear on screen. The range only shows when a station is >3 h stale, and nobody asked how often that happens. A hit rate built on 6 samples is noise. |
| 3 | Delhi resident | **B**, with C second | **D**: can't be filmed alone, schools follow GRAP and DoE circulars rather than an app, and a 7 am practice can't wait until noon | **Timing.** 10 Oct is before stubble burning and Diwali, so the likely result is a plain "Go" with no visible smog. **Behaviour.** People look out of the window and read WhatsApp forwards; they don't open an app at dawn. |
| 4 | Product designer | **C**: judges the app as a first-time user would, and every fix is a copy change | **D** | Nothing brings the user back: no saved station, no reminder. A 06:15 SES email plus a "Your check: Right" email would show both the return loop and where AWS fits. |
| 5 | Public health and ethics | **B**: works through the health logic and names the sensitive groups to exclude | **D**: "83%" measures whether the range was right, not whether the verdict was safe, so it misleads more each time it's forwarded | CPCB's PM AQI is a 24-hour average, so "right now" is answered with a lagging number. The 837→200 swing probably isn't a CPCB reading. Suggests a "24-h average" label, the GRAP stage, "not medical advice", and asks whether ≤200 should mean Go for running. |

**Tally.** Four reviewers picked B (Contrarian) as strongest and one picked C (Outsider). All five named D (Expansionist, the coach/PE-teacher idea) as the biggest blind spot.

## Fact-check (orchestrator, ~12:30 IST, 9 Oct 2026)

Checked against the code and the live API (`/health`, `/stations`, `/card?uid=10119`, `/scoreboard`) and WAQI's public demo feed.

### 1. Every reading's age is 5 h 30 min too young (critical)

- [backend/src/taaza/sources/waqi.py:40](../../../backend/src/taaza/sources/waqi.py#L40) reads `ts = int(d["time"]["v"])` and treats it as a UTC epoch.
- WAQI's `time.v` is actually local wall-clock time written as if it were UTC. The WAQI demo feed shows this:

  ```json
  "time":{"s":"2026-10-09 14:00:00","tz":"+08:00","v":1791554400,"iso":"2026-10-09T14:00:00+08:00"}
  ```

  1791554400 is 14:00 UTC, but the real moment is 06:00 UTC (1791525600).
- Live symptom: the Dwarka card returned `reading_ts` 1791547200 (12:00 UTC) while the server's `now` was 1791529351 (07:02 UTC). The reading appears to come from the future. `freshness.age_minutes` clamps it with `max(0, …)`, so the card says "0 minutes old".
- Effects:
  - Every card shows the wrong age.
  - A station is only marked stale once it is really more than 8.5 h old. Alipur shows "4 h" but is about 9.5 h old.
  - [estimate.py:55](../../../backend/src/taaza/estimate.py#L55) treats neighbours up to about 8.5 h old as live.
  - [grader.py:25-27](../../../backend/src/taaza/grader.py#L25-L27) checks `reading_ts > created_ts`. Here `created_ts` is real time and `reading_ts` is shifted 5.5 h ahead, so a reading taken up to 5.5 h *before* a promise can grade it. That breaks the README's "no backfill grading" guarantee.
- The tests pass because they use synthetic timestamps.

### 2. The track record looks too clean

- 26 checks graded, 26 hits, 0 misses (100% against an 80% target), plus 2 pending.
- Only 9 Oct has data so far.
- Ranges are about 90–115 points wide (for example 114–204, 83–196, 125–215).
- Advice is taken from the top of the range. So 114–204 gives "Wait" even when the real value lands around 150, which would be "Go".

### 3. The AQI scale is unverified

The docstring in `waqi.py` and the README's open item "K3" both say it is still unconfirmed whether WAQI's `iaqi.pm10/pm25` values are on the CPCB scale or the US-EPA scale. Until that is checked, a label like "Indian AQI (CPCB)" could be false.

### 4. Today's readings

24 live stations read between 109 and 178, so almost every card says Go.
