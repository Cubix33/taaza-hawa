# Spec: "Wait, until when?": a 3-hour forecast with Amazon Chronos, graded in public

Status: ready for an agent. Date: 9 Oct 2026.

Sources:
- Round 4 found that "Wait" never says *until when* ([council round 4](council/round-4-audience/02-verdict.md)).
- The ML option discussed on 9 Oct 2026.
- The earlier finding that day-ahead smoke forecasts barely beat "same as now" (research 04) is why this spec has a **backtest gate** before anything is shown.

## Problem Statement

A runner in Dwarka opens Taaza Hawa at 06:30 and reads **"Wait for air to improve."** The obvious next question has no answer: *wait until when?* The app suggests checking again after the next reading and points at the 24-hour line. That tells them what already happened, not what is likely next.

So they either give up on the run or guess. Neither is what a careful, honest app should leave them with.

There is also a trust problem with forecasts in general. Weather and AQI apps show confident forecasts and never say how often they were right. People in Delhi already distrust the number they're given. A forecast nobody checks would make that worse.

## Solution

When the answer is **Wait** or **Stay inside**, the card adds **one line**: when the air is likely to get better within the next 3 hours, or that it isn't expected to.

> "Likely below 200 by about 11:00 (forecast made 20 min ago; right about 8 times in 10)."
> "Not expected to get better in the next 3 hours."

Behind it, once an hour, an AWS Lambda runs **Amazon Chronos**, an open-source pretrained forecasting model from Amazon, on each station's recent hourly readings. It produces a range for each of the next 3 hours.

Every forecast is **graded in public**. When the real reading for that hour arrives, the app records whether it landed inside the range, just as it already does for its stale-station estimates. The record page shows one line: how many forecasts were graded and how many landed inside, against the same 80% target.

The forecast never changes the verdict for *now*. It only answers "until when".

The forecast only appears after an offline backtest shows it does better than a simple "same as now" baseline. Until then it runs silently (*shadow mode*) and builds its graded record in private.

## User Stories

1. As a runner who sees "Wait", I want to know when the air is likely to get better, so that I can decide whether to run later this morning or skip it.
2. As a walker who sees "Stay inside", I want to know if things are expected to improve in the next few hours, so that I can plan an evening walk instead.
3. As a user, I want the forecast as one plain sentence with a time, so that I understand it at a glance.
4. As a user, I want the forecast to say "likely" and show how often such forecasts are right, so that I don't mistake it for a promise.
5. As a user, I want to see how old the forecast is, so that I can judge it the same way I judge the age of a reading.
6. As a user, I want the app to say plainly when no improvement is expected in the next 3 hours, so that I don't keep waiting for nothing.
7. As a user, I want the verdict for *right now* to stay based on the current reading only, so that the forecast never changes what the app tells me to do now.
8. As a user whose station reading is old (stale), I want no forecast shown, so that I'm not given a prediction built on stale data.
9. As a user, I want the forecast in Hindi and in English, matching the page language, so that it reads like the rest of the app.
10. As a user who listens with the voice readout, I want the forecast sentence included in what is read aloud when it is shown, so that I hear the full answer.
11. As a user who shares on WhatsApp, I want the share message to include the forecast line when it is shown, so that my family gets "until when" too.
12. As a user, I want the "better" time to be judged on the cautious (top) end of the forecast range, so that the app only says "likely better" when even the high end is better.
13. As a sceptical user, I want every forecast checked against the real reading for that hour, so that I can see whether the forecasts are any good.
14. As a sceptical user, I want the record page to show how many forecasts were graded and how many landed inside the range, so that I can trust or distrust them with evidence.
15. As a sceptical user, I want missed forecasts shown as clearly as hits, so that the record isn't flattering.
16. As a sceptical user, I want forecasts that couldn't be checked (the station went quiet) counted separately as "couldn't verify", so that silence isn't counted as success.
17. As a user, I want the forecast hidden when the latest forecast run is more than 90 minutes old, so that I never see an outdated forecast.
18. As a user, I want the card to look the same as today when the answer is Go, so that the screen doesn't get busier on good days.
19. As a user on a slow phone, I want the forecast to arrive with the card, with no extra request or wait, so that the page stays fast.
20. As the builder, I want the forecast computed on a schedule, never while a user waits, so that model latency and cold starts never reach users.
21. As the builder, I want the model weights packed inside the deployment image, so that the job doesn't depend on downloading from Hugging Face at runtime.
22. As the builder, I want the model name and revision pinned, so that forecasts don't change silently when the model is updated.
23. As the builder, I want a three-way switch (`off`, `shadow`, `on`), so that I can collect a private graded record before showing anything.
24. As the builder, I want an offline backtest comparing Chronos with "same as now" and "usual change by hour of day" baselines, so that I only ship the forecast if it is actually better.
25. As the builder, I want the backtest to report interval coverage and width at 1, 2 and 3 hours ahead, separately for October–December mornings, so that I judge it on the season and hours that matter.
26. As the builder, I want forecast grades kept out of the stale-estimate calibration and accuracy, so that one system's errors never distort the other's.
27. As the builder, I want forecast storage to stay bounded per station, so that grading reads don't slow down as weeks pass.
28. As the builder, I want the job to skip a station with too many missing hours, so that the model isn't fed a broken series.
29. As the builder, I want a failed forecast run to leave the previous run in place and the card unchanged, so that a model error never breaks the site.
30. As the builder, I want a CloudWatch alarm when the forecast job keeps failing, so that I notice before users do.
31. As the builder, I want the forecast job to cost nothing beyond the AWS Free Tier at hackathon scale, so that the project stays free to run.
32. As the builder, I want the local demo server to show a clearly labelled demo forecast, so that I can build and film the UI without the model.
33. As a judge watching the demo video, I want to see a forecast made, the real reading arrive, and the grade recorded, so that the "graded in public" claim is shown, not told.
34. As a judge, I want the forecast to come from an Amazon open-source model running on AWS Lambda, so that the "Built on AWS" story is real.

## Implementation Decisions

**Screen budget (anti-clutter rule).** The feature adds:
- **at most one line to the card**, only when the answer is Wait or Stay, in the spot where the generic "check again after the next reading" pointer sits today (it replaces that pointer when a forecast is shown);
- **one line to the record page**.

No new page, navigation item, chart or settings toggle. On Go days the card is unchanged.

**Model.**
- **Candidates:** Amazon Chronos-2 (about 120M parameters, quantile output, CPU-capable, can use known future inputs) and Chronos-Bolt-small (lighter).
- **The backtest picks one**, its revision is pinned, and the chosen model id and revision are deployment parameters.
- **Quantiles:** 0.1, 0.5 and 0.9 for horizons 1, 2 and 3 hours. The 0.1–0.9 band is the 80% range, matching the app's existing 80% target.
- **Optional input:** the CAMS hourly forecast the poller already fetches (it includes the next 24 hours) may be passed as a known future input to Chronos-2. Use it only if the backtest shows it helps.

**Forecast job.**
- **What runs:** a new Lambda function packaged as a **container image**, triggered by **EventBridge Scheduler** every hour at minute 20 IST, after a poll has landed.
- **Image:** Python 3.12, CPU-only torch, the Chronos package and the model weights baked in at build time.
- **Settings:** x86_64 architecture, so the image builds reliably on the builder's machine. About 3 GB of memory and a timeout of a few minutes.
- **Shared code:** it uses the same shared backend package as the other functions, for store access and series building.

**Series building** (pure, no model imports):
- For each station, take the **governing pollutant's** CPCB-scale values from stored readings over the last 72 hours, one value per clock hour (the latest reading in that hour).
- **Gaps:** missing hours are left as missing if the chosen model accepts missing values. Otherwise forward-fill gaps of up to 2 hours.
- **Skip the station** if:
  - more than 25% of the last 48 hours are missing, or
  - the latest reading is older than 3 hours (stale).

**Model interface.** The job calls the model through one injected function:

`predict(series: list[list[float | None]], horizons: int, quantiles: tuple) -> list[list[tuple[float, float, float]]]`

Production passes the Chronos wrapper and tests pass a fake. The job's single entry point takes the store, the current time and this function.

**Storage.**
- **One item per station per run**, in a new partition per station (`FCST#<uid>`), sorted by the run's hour.
- **Item fields:**
  - creation time
  - pollutant
  - model id and revision
  - for each horizon: target hour, low/mid/high, status, the actual value and the miss distance once graded
- **Reads stay bounded:** grading and display only read the most recent few runs per station, because there is no table TTL today.
- Optionally, set a DynamoDB TTL attribute of 30 days on these items and enable TTL on the table.

**Grading** reuses the existing deterministic judge semantics:
- **The judge** is the first stored reading for that station whose timestamp is **at or after the target hour** and within 90 minutes of it.
- **Result:** inside the range is a hit; outside is a miss by N points (the same grade function as stale estimates).
- **No backfill grading:** a reading measured before the forecast was created can never grade it. This is the existing rule.
- **No judge reading** within 3 hours after the target → "couldn't verify". That reuses the existing "missed, still waiting" status, which accuracy already counts separately.
- **When grading runs:** during ingest, right after new readings are stored, through a forecast resolver called from the existing ingest step.
- **Calibration is untouched:** forecast grades never feed the stale-estimate calibration residuals.
- **Accuracy is separate:** existing accuracy figures exclude forecasts. A separate forecast accuracy summary is added.

**The "better by" rule** (pure, deterministic, written down for the about page):
- The current answer comes from the card's existing rule.
- The target band is one band better: from Stay (above 300) the target is "300 or below"; from Wait (201–300) it is "200 or below".
- **"Likely better"** is reported for the **earliest horizon whose *high* (0.9) value is within the target band**.
- If none of the 3 horizons qualifies: "not expected to get better in the next 3 hours".
- The time shown is the target hour in IST, formatted like the rest of the app.
- **Never shown** when the answer is Go or unknown, or when the station is stale.

**Card contract.**
- `GET /card` gains an optional `forecast` object, present only when all of these hold:
  - the mode is `on`
  - the latest run for this station is at most 90 minutes old
  - the station is fresh
  - the answer is Wait or Stay
- **Fields:**
  - `made_ts` and `age_min`
  - `pollutant`
  - `hours`: a list of `{h, target_ts, lo, mid, hi}`
  - `better`: either `{target_ts, threshold}` or `null`
  - `sentence_hi` / `sentence_en`, built from fixed templates
  - `record`: `{graded, hits}`, for the "right about N in 10" wording; omitted until at least 20 forecasts are graded

**Scoreboard contract.** `GET /scoreboard` gains `forecast_accuracy`: `{graded, hits, misses, unverified, by_horizon: {1: {...}, 2: {...}, 3: {...}}}`. It is present in `shadow` and `on` modes, and the record page shows it only in `on` mode.

**Copy and honesty rules.**
- Always "likely"/"संभावना" and never "will be".
- Always the forecast's age.
- The "right about N in 10" figure appears only once at least 20 forecasts are graded; before that it reads "forecast record warming up".
- No health claims and no causes.
- **Fixed copy:**
  - `forecast_better`: "Likely {threshold} or below by about {time} (forecast made {age} ago)." / "लगभग {time} तक {threshold} या उससे कम होने की संभावना (अनुमान {age} पहले बना)।"
  - `forecast_flat`: "Not expected to get better in the next 3 hours (forecast made {age} ago)." / "अगले 3 घंटे में सुधार की उम्मीद नहीं (अनुमान {age} पहले बना)।"
  - `forecast_record`: "Forecasts like this were right about {n} in 10 times." / "ऐसे अनुमान लगभग 10 में {n} बार सही रहे।"

**Voice and share.** When `forecast` is present, the spoken text and the WhatsApp message include `forecast_better` or `forecast_flat` after the verdict line.

**Mode switch.** A deployment parameter `ForecastMode`: `off`, `shadow` or `on`, with default `shadow`.
- `off`: no job runs.
- `shadow`: the job runs and forecasts are graded, but the card and record page show nothing.
- `on`: everything is shown.

Switch to `on` only after the backtest gate passes.

**Backtest gate.** This is an offline script outside the deployed package.
- **Data:** Delhi hourly station data, October to December, for example a 2020–2025 Delhi multi-station hourly dataset, plus the app's own stored readings once there are a few days of them.
- **Methods compared:**
  - (a) Chronos (each candidate)
  - (b) **persistence**: the last value ± empirical quantiles of the 1/2/3-hour change
  - (c) **hour-of-day climatology** of change
- **Reported for each horizon and method:** 80%-range coverage, mean range width, and point error (median absolute error of the mid value against the real reading), split by station and for the 05:00–11:00 hours.
- **Pass if, at the 3-hour horizon on morning hours, both hold:**
  - coverage is between 75% and 85%, **and**
  - mean range width is at least 15% narrower than persistence at similar coverage, **or** point error is at least 10% lower.
- **If it fails,** the mode stays `shadow`. The record of that decision goes in the research docs.

**Local demo.** The demo server attaches a fixed, clearly labelled forecast to Wait/Stay cards (`demo: true`) so the UI can be built and filmed without the model.

**Failure handling.**
- If the model fails or a station is skipped, no item is written for that run and the card falls back to the previous run (if at most 90 minutes old) or shows no forecast line.
- A CloudWatch alarm fires on repeated job errors, matching the existing poller alarm.

**Cost.** 24 runs a day of about 20–30 s at about 3 GB is roughly 2,000 GB-seconds a day, well inside the Lambda free tier. Storage is about 24 small items per station per day.

## Testing Decisions

**What a good test looks like.** It drives the system the way production does and checks what a user or the record page would see:
- Run the job entry point with a fake `predict`.
- Ingest later readings through the existing ingest function.
- Read `GET /card` and `GET /scoreboard` through the existing API router.

Tests don't assert on DynamoDB key layouts or internal helpers.

**Seams:**
1. The forecast job's single entry point (store, time, injected `predict`). This is the one new seam.
2. The existing ingest function, for grading.
3. The existing API router, for the card and scoreboard.

All tests use the existing in-memory store and seed helpers, like the current end-to-end service and API tests.

**Tests:**
- **Wait card:** a fresh Wait station with a fake forecast whose 2-hour high is 190 → the card shows "likely 200 or below by about <target hour>", and the verdict is still Wait.
- **Stay card:** a Stay station whose forecasts all stay above 300 → "not expected to get better".
- **Go card:** a Go station → no `forecast` on the card. A stale station → no `forecast`, and the job wrote no item for it.
- **Mode `shadow`:** the job writes and grades, but neither the card nor the scoreboard shows anything. Mode `off`: the job writes nothing.
- **A run older than 90 minutes** → no forecast on the card.
- **Grading a hit:** a later reading at the target hour inside the range is graded a hit. One outside is a miss by the right distance.
- **No backfill grading:** a backfilled reading from before the forecast's creation does not grade it.
- **No reading** within 3 hours of the target → "couldn't verify".
- **Calibration and accuracy unaffected:** after grading, the station's stale-estimate calibration residuals and the existing accuracy figures are unchanged.
- **Gaps:** more than 25% missing hours → the station is skipped. Two-hour gaps are forward-filled only if the model needs it, as configured.
- **Record wording:** "right about N in 10" appears only after 20 graded forecasts.
- **Model failure:** a fake `predict` that raises → the job reports the failure, writes nothing, and the card keeps the previous fresh run.
- **Copy:** Hindi and English forecast templates exist for every key, contain no banned word, say "likely"/"संभावना", and never "will".
- **Frontend:** the copy test already checks that Hindi and English keys match; it covers the new strings.
- **Prior art:**
  - the existing scale-and-clock tests (judge-reading rules)
  - the existing service tests (stale → hold → graded loop)
  - the existing API route tests (card contract)

**The backtest script** has a small unit test for its metric functions (coverage and width on a hand-made series). The script itself is run manually.

## Out of Scope

- Forecasts beyond 3 hours, or a day-ahead forecast. Earlier research found little skill there.
- Charts, a forecast page, or showing the forecast on Go days.
- Changing the current verdict from a forecast.
- Forecasts for stale stations, or estimating a station from neighbours with the model.
- Fine-tuning or training a model. Chronos is used zero-shot.
- Hosting on SageMaker endpoints.
- Push notifications or alerts based on the forecast.
- Wind, fire or other covariates beyond the optional CAMS future input.

## Further Notes

- **Why Chronos.**
  - It is Amazon's own open-source (Apache-2.0) pretrained forecasting family, so it fits an AWS event and counts as an AWS open-source tool.
  - It needs no training data from this project.
  - It outputs quantile ranges, which plug straight into the app's existing "range, then grade it in public" design.
- **Honest risk.** Delhi PM can change quickly with fog and inversions, and earlier work found weak day-ahead skill. The backtest gate and `shadow` mode exist so the app never shows a forecast it can't defend. A public record full of misses would hurt the trust pitch more than having no forecast.
- **Deadline.** Submissions open 11 Oct 2026, 08:00 IST. Building the image, the job, grading and UI is about a day of work. If time runs short:
  1. ship the backtest and `shadow` mode,
  2. show the graded shadow record in the video as "next",
  3. keep the card unchanged.
- **Building the image needs Docker** on the builder's machine (for `sam build` with an image function). The deploy order stays backend first, then the website.
