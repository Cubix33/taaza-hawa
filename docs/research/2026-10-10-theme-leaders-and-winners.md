# Theme leaders and winners: what the most-used and prize-winning air projects do, and what Taaza Hawa should learn (10 Oct 2026)

The Air track brief: *"Help people breathe easier. **Track** what's in the air, **warn** the people most exposed to it, and **change** what happens on the bad days."*

**Question.** Which air projects are the most used, and which ones won (prizes, awards, hackathons), on exactly this theme? What do they do that Taaza Hawa doesn't? What should Taaza Hawa keep, change, and avoid copying before submission on 11 Oct?

**Method.** Four parallel web-research passes on 9–10 Oct 2026:
1. most-used consumer products;
2. prize and award winners;
3. hackathon winners from 2022 to 2026;
4. evidence on what changes behaviour on bad days.

Earlier scans are not repeated here: [R3](../wayfinder/research/R3-competitor-novelty-scan.md) covers competitors used for choosing the idea, and [R4](../wayfinder/research/R4-event-signals-and-precedents.md) covers First Commit winners and the rules.

**Labels.**
- **[V]** means the page was fetched and read.
- **[R]** means the claim comes from a search snippet or secondary coverage.
- Install and MAU figures from AppGoblin and Semrush are third-party estimates.
- earthshotprize.org, Google Play and some news sites blocked fetching, so those facts come from partner or press pages.

---

## Summary: eight lessons

1. **Taaza Hawa's honesty features are a verified gap.** None of the leaders do any of these:
   - treat a reading's *age* as part of the advice;
   - show an uncertainty range;
   - publish how accurate they were.

   Keep all three. They don't need building, only pitching.
2. **Honesty alone did not win.** "One honest number, a forecast that shows its own accuracy, and when to step outside" was a real entry at the Lahore Smart City Hackathon (Aug–Sep 2026), and it lost. The winners tied data to **one exposed group's decision and showed what happened afterwards**.
3. **The theme's middle verb is "warn the people most exposed."** Taaza Hawa's user, the healthy runner, isn't on any official sensitive-group list. But the runner *is* among the most exposed **by dose**: running means breathing many times more air than sitting. Say that, and say it exactly.
4. **Taaza Hawa barely touches "change what happens on bad days."** Every prize winner quotes a *measured before/after* (−24%, −23%, −16%). Taaza Hawa quotes none.
5. **The 06:30 run falls in Delhi's dirtiest hours.** An independent study confirms the K1 numbers: winter particles peak around 07:00–08:00 and are lowest around 15:00–16:00. Moving the run later, or running easier, is a bad-day change you can measure. The [bad-days ideation note](2026-10-10-bad-days-ideation.md) turns this into the "Badlo" swap and receipt, and this research supports it.
6. **Alerts and push notifications change little.**
   - People follow advice to reduce or reschedule outdoor activity about 31% of the time (median across 21 studies).
   - The response is mostly gone by the second alert day in a row.
   - Leaders keep users with push alerts, widgets and forecasts, but in Delhi most of the season is bad days back to back, which is exactly where alerts fade.
   - The forwarded WhatsApp message (round 5's morning parchi) fits Delhi better than push.
7. **Forecasts are expected, not rewarded.**
   - Every leader ships one.
   - NASA's 2025 TEMPO air-quality challenge drew 400+ submissions and had no global winner.
   - Forecasting only won in datathon formats.

   A forecast can answer "Wait, until when?", but it can't be the headline.
8. **Never make a health-outcome claim.** The best alert evaluation (Toronto) found no effect on mortality or heart disease, and a randomised trial changed behaviour without changing symptoms. Grade advice and exposure, never health.

---

## 1. Scorecard: the theme's three verbs vs Taaza Hawa today

| Verb | What the most-used products do | What winners do | Taaza Hawa today | Gap |
|---|---|---|---|---|
| **Track** | Dense maps, hourly data, 4–7-day forecasts, sensors you can buy | Fill a data gap with open sensors (AirQo, Breathe London, MoveGreen) | Official station data with its age, an honest range when stale, a public grade | **Strong.** Taaza Hawa is the only one that grades itself. It has no own sensors, which is fine for a video-judged software entry |
| **Warn the most exposed** | Alerts when a threshold you choose is crossed; band-based health advice | Name one exposed group: children with asthma, slum mothers, school-bus kids, moto-taxi riders | Go/Wait/Stay for healthy adults, Hindi voice, WhatsApp share | **Medium.** The "most exposed" reason isn't stated: runners breathe more air than anyone resting |
| **Change bad days** | Little; mostly "reduce outdoor activity" text | A measured before/after: PM2.5 −24% (Bogotá), NO2 −23% at school gates, hospital PM −16% | A "Wait" or "Stay" label, plus the bad-air plans tab (a lookup table) | **Weak.** Nothing changes and nothing is measured |

---

## 2. The most-used products

| Product | Scale (estimate) | How it keeps users | Shows reading age? | Shows uncertainty or accuracy? | Top complaint |
|---|---|---|---|---|---|
| **IQAir AirVisual** | 9.4M Android installs, 4.79★ from 342K ratings, ~179K MAU [V]; "15M+ users" (2020) [V]; iqair.com 14.1M visits in Jul 2026 [V] | Widget, smart alerts, Apple Watch, purifier control (hardware) | Clock time only ("22:56, Oct 09") [V] | **No.** It disclaims forecast accuracy [R] | "Forecast, even a few hours ahead, completely wrong"; "HUGE gaps" [V] |
| **Google (BreezoMeter, $225M, 2022)** | Built into Maps, Search, Pixel and Apple Weather; ~400M end users before the deal [R]; Air View+ in Maps for 150+ Indian cities on India's index (NAQI), Nov 2024 [V] | Nothing to install: it's on the lock screen and in Maps. The Pixel alert appears only at "orange" or worse [V] | The API timestamp is "rounded down" to the hour [V] | **No** confidence field in the API [V] | Apple Weather showed AQI 197–240 in New York when the real value was 51 (Jan 2025) [V] |
| **EPA AirNow** | Record 12.4M page views a day in June 2023 smoke, +16,000% [R]; app 534K installs but ~10K MAU [V] | Push notification for the next day's forecast at a threshold you pick (since Dec 2024) [V] | Hourly | Forecast verification is internal only; no public scorecard [R] | Hourly only; crashed in the 2018 Camp Fire [V] |
| **PurpleAir** | ~600K map visitors on 9 Sep 2020 [R]; 30K+ sensor hosts [R] | People own the hardware | Real time | A sensor "confidence" value when its two channels disagree; the sensor is drawn faded [R] | Over-reads smoke by ~40% without the EPA correction [R] |
| **Plume Labs Air Report** | 557K installs, ~4.3K MAU, last updated Oct 2023, "declining" [V] | Was a wearable (Flow); sales stopped spring 2023 [V] | n/a | No | Abandoned after AccuWeather bought it |
| **WAQI / aqicn.org** (*Taaza Hawa's own feed*) | "Several million API requests a day", about €1K a month, ad-funded [V] | Free embeddable widgets | **A date only.** On 9 Oct, Delhi ITO still showed "Updated on Tuesday, Jun 23rd 2026", about 3.5 months old, with no warning [V] | Calls its data "un-validated" [V] | Stale stations look the same as fresh ones |
| **SAMEER (CPCB)** | 259K installs, 3.8★, ~21K MAU [V]; iOS 2.4★ [V] | Sameer 2.0 alerts (Sep 2025) [R] | — | No | Crashes; 163 hours of data missing over Diwali 2025, and users deleted it [V] |
| **AQI.in (Purelogic / Prana Air)** | 665K installs, ~32K MAU [V]; 2.25M web visits in Aug 2026 [V] | Monitor hardware [R] | — | No | US-scale vs India-scale confusion; the UP government warned the public about "misleading" US-norm apps (Dec 2025) [R] |

### Patterns

- **Usage spikes with events, then collapses.** Installs far exceed active users: AirNow 534K vs ~10K MAU, Sameer 259K vs ~21K, Plume 557K vs ~4K. Keeping users is the hard problem.
- **The biggest reach is through screens people already have.** Apple Weather, Google Maps and the Pixel lock screen reach far more people than any air app. In India, the equivalent is a **WhatsApp forward**.
- **Every leader except Sameer and WAQI ships a forecast.** IQAir, PurpleAir and AQI.in also sell hardware.
- **Alerts fire on thresholds, not routines.** Pixel shows AQI only at orange or worse. AirNow pushes only when your chosen threshold is crossed.
- **In India, trust is the battleground.** The 87% figure comes from 14,978 Delhi respondents: 62% no trust and 25% low trust in government AQI data [V; the publisher is attributed to LocalCircles [R]]. The apps disagree because of:
  - the scale (US vs India);
  - the 500 cap;
  - the averaging window (24 h vs now);
  - sensor type.
- **Aggregators pass upstream faults straight to users.** Apple Weather in New York and aqicn's ITO page both showed bad or months-old data without flagging it.

### What this means for Taaza Hawa

- **The reading-age and range features answer a verified, current failure.** That failure is on Taaza Hawa's own upstream (aqicn ITO). Use it in the video only if a re-check on the filming day still shows it.
- **No India survey measures daily AQI checking.**
  - In Delhi-NCR (2019 data), over 80% didn't know the AQI and **3.6%** checked it daily [V].
  - In the US (2025), 13% check daily and 27% check only when alerted [V].

  An app people must *remember to open* is fighting those numbers. The morning parchi, forwarded by a group admin, goes around that.

---

## 3. Prize and award winners

| Winner | Prize, year | Verb | What it does | Measured result | Why it won |
|---|---|---|---|---|---|
| **Takachar** (India) | Earthshot "Clean Our Air", 2021 [V] | Change | A machine that mounts on a tractor and turns crop residue into fuel and fertiliser instead of burning it | "Up to 98%" less smoke [R] | Stops stubble smoke at the source |
| **Mukuru Clean Stoves** (Kenya) | Earthshot, 2022 [V] | Warn / protect the most exposed | Cleaner stoves for mothers in Nairobi slums | 90% less pollution than an open fire; 200K+ households and 2,000 schools [V] | A named exposed group and a measured cut |
| **GAYO** (Ghana) | Earthshot, 2024 [R] | Change | Stops open waste burning | 170 t diverted in 2023 [R] | Youth-led and local |
| **City of Bogotá** | Earthshot, 2025 [V] | Change | 1,486 e-buses and clean-air zones | PM2.5 −24% since 2018, for 8M people [V] | A government; the measured delta |
| **AirQo** (Uganda) | Google.org AI Impact Challenge, 2019 ($1.3M; one of 20 from 2,602 applicants) [V]; Earthshot 2026 finalist (winners 17 Nov, Mumbai) [V] | Track → warn | Low-cost sensors (some on moto-taxis), AI gap-filling, forecasts, an app with health alerts, an open API | 500+ monitors, 16+ cities, 30M+ people [V] | Filled a data gap cheaply, with open data and local skills |
| **Polish Smog Alert** | Earthshot finalist, 2023 (the first advocacy group named) [V] | Change | Campaigned for Kraków's coal and wood ban | 20+ towns followed; anti-smog rules cover over half of Poland [V] | Data turned into enforceable rules |
| **Breathe London** | Triple win at the 2025 environmental monitoring awards [V] | Track → change | 330+ hyperlocal sensors; School Streets | NO2 down up to 23% at school drop-off; 81% of parents in support [R] | "Makes the invisible not only visible but actionable" [V] |
| **Maria Kolesnikova (MoveGreen)** | UNEP Champion of the Earth, 2021 [V] | Track → warn | 100+ sensors in Bishkek; the AQ.kg app updates every 20 min; "School Breathes Easily" | Kyrgyzstan's first PM2.5 record [V] | Framed as the right to breathe clean air. **The closest match to Taaza Hawa among top-tier prizes**, but it won with a sensor network |
| **Toxic Toby** (BreezoMeter / McCann) | Two D&AD Wood Pencils, 2019 [V] | Warn + change | A teddy bear on Brixton Road that coughed harder as pollution rose; each cough tweeted the local MP | — | Turned an invisible number into an event and a named action |
| **PRAISE-HK** (HKUST) | Asia Smart App Gold, 2023 [V] | Warn | Personal exposure and health-risk app | — | A small regional award; the only pure app found winning |

### What winners share

- **Something physical changes.** A source is removed (stoves, burning, buses, coal) or sensors go up. **No pure software consumer app has won a top-tier clean-air prize.** Apps won only small regional awards (PRAISE-HK, South Coast AQMD's EPA award).
- **A measured before/after,** quoted as a percentage.
- **A named exposed group:** children, mothers, patients, riders, farmers. **None of the winners target healthy adults or exercisers.**
- **Someone acts on the data:** a city, a school, a hospital or a lawmaker.
- **Third-party proof of accuracy** (for example, Respirer's sensors validated in AIRLAB's 2023 challenge [V]).

### What's rare among winners, and is Taaza Hawa's opening

- **Grading your own predictions in public.** No winner offers stated uncertainty, a public track record, or grading against the next real reading. The 2026 Swachh Vayu Survekshan shows the opposite failure. Lucknow (PM10 135) beat Indore (PM10 76) because the score rewards **actions over measured air** [V]. Taaza Hawa grades its advice against measured air.
- **Hindi, voice and WhatsApp delivery** were not found among winners.

---

## 4. Hackathon winners, 2022–2026

| Event | Placement | Project | What it does | Verb |
|---|---|---|---|---|
| "A Breath of Fresh Air" AI Hackathon, Univ. of Utah, Jun 2025. **AWS was the flagship sponsor** (SageMaker, Bedrock) [V] | 1st | BreatheSafe | Personal alerts from EPA data, the weather forecast and "user traits" | Warn |
| | 2nd | LumaVita | Air-quality guidance for families of children with asthma | Warn the most exposed |
| | 3rd | Fresh Route | Cleaner walking paths from forecast and distance | Change |
| Tech To The Rescue × AWS Air Quality Hackathon, Dec 2023, ~170 teams [V] | 1st | Płucka, for Polish Smog Alert | Lungs whose damage matches live AQI, plus a game | Track (emotional) |
| | 2nd | AirVocacy | An LLM chatbot over clean-air law, and a meme generator | Warn |
| | 3rd | Afri-SET team | Bedrock writes a parser for each sensor format; "months to days" | Track |
| NYC Climate Hackathon, Sep 2025 [V winner ribbon] | Winner + 2 prizes | Breathe Bronx | School-bus sensors trigger "turn on the HEPA filter / move PE indoors" for high-asthma schools | All three |
| Smart City Hackathon Lahore, Aug–Sep 2026; 65 entries, ~15 on air, 7 winners [V] | Winners | Air Health Correlate; SaansCare | Health advisories and hospital-surge warnings; a government and resident dashboard | Warn |
| | **Lost** | **City Intelligence** | **"Lahore's air, one honest number… a forecast that shows its own accuracy, and guidance on when to step outside"** | Track |
| | Lost | Breathe Lahore, Air Guard, CityPulse, Lahore Pulse AI, Fix Lahore and others | Bilingual forecasts, clean routes, one-hour forecasts, "accountable" forecasting, SMS | — |
| Devpost (event unknown) [V winner flag, R details] | Winner | Ridgeline | Wildfire detection "that earns its alarms"; says "caught 4 of 5" in its tagline | Track (honest) |
| NASA Space Apps, 2022–2025 [V] | — | **No air-quality project among Global Winners in any year**, despite 400+ TEMPO submissions in 2025 | | |

### Patterns among winners

- **One named group in one named place.** "Citizens" in general rarely win.
- **The data becomes an action** (HEPA on, PE indoors, reroute), not just a number.
- **Someone acts on the alert:** a school, a nonprofit or a government desk.
- **LLMs get one narrow job.** No "ask our AI anything".
- **Honest self-evaluation helps when it's specific.** Ridgeline's "4 of 5" is the template.

### Clichés: common among entries, rare among winners

- A city AQI dashboard with a map, an ML forecast and a chatbot. In Lahore, about 13 of 15 air entries lost.
- Forecasts from 1 to 72 hours ahead feeding generic risk alerts.
- Clean-route recommenders with no specific person behind them.
- Bilingual forecasts plus SMS: needed, but not enough to win.

**The warning for Taaza Hawa.** City Intelligence lost with the same pitch. The difference has to be:
- one person's decision (the 06:30 run);
- a visible loop ("Hold me to this", Step Functions, the grade arrives);
- something that changed and was measured.

---

## 5. What actually changes a bad day: the evidence

### 5.1 Programs

| Program | Result | Label |
|---|---|---|
| Spare the Air alerts (Bay Area) | Traffic −2.5–3.5%; transit < +1%; no significant effect on ozone. Fewer than 4% said they cut a trip | [V] |
| Spare the Air free-transit days | Ridership +15%, but ~$2M a day; ended 2008–09 | [V] |
| San Joaquin mandatory wood-burning ban | Winter PM2.5 −12%; heart-disease admissions among people 65+ −7% | [V] |
| Delhi odd-even, Jan 2016 | PM2.5 −14–16% during the scheme's hours; no effect at night or in April | [V] |
| Delhi GRAP | Modelled −2 to −42 µg/m³ depending on stage; 177–297 deaths averted | [V, secondary write-up] |
| China's real-time air-data disclosure (Barwick et al., AER 2024) | More avoidance behaviour; lower mortality impact; benefits about 10× costs | [V] |
| London airTEXT | 68% of users with a medical condition changed behaviour; 15% cut strenuous exercise | [V] |

**Read.** Measured health gains come from **mandatory, collective** measures. Voluntary advice moves people by single-digit percentages. Disclosure, which is what Taaza Hawa does, *does* pay off at population scale (China).

### 5.2 Alerts

- **They work, modestly.**
  - LA smog alerts: zoo attendance −13% [V].
  - Sydney: cycling −14–35% on alert days [V].
  - Toronto (2.6M people): asthma emergency visits −25% [V].
- **They don't change the big outcomes.** Toronto found no effect on mortality or heart-disease admissions. The authors say alerts "without enforceable actions may be inadequate" [V].
- **Adherence is low.** Across 21 studies, adherence to "reduce or reschedule" ranged from 9.7% to 57%, **median 31%** [V].
  - What helped: knowing where to check and **understanding the index**.
  - What hurt: indices that are hard to understand, and **trusting what you see and smell over the number**.
- **They fatigue fast.** The response "has largely disappeared by the second day" of consecutive alerts [R].
- **Behaviour can change while health doesn't.** In a Canadian RCT, people were 2.03× more likely to stay indoors, but symptoms were unchanged [V].

### 5.3 Who is "most exposed", and whether runners count

- **The official lists don't name healthy runners.** The lists:
  - US EPA (particles): heart or lung disease, older adults, children and teens, pregnant people, outdoor workers [V].
  - WHO: similar [V].
  - India's health ministry (Nov 2025) adds traffic police, construction workers, sweepers, drivers and vendors [V].
  - **Only EPA's ozone guide adds "people who are active outdoors"** [R].
- **Runners are high-dose, not high-sensitivity.** Breathing rates (Tainio et al. 2016) [V]:

| Activity | Air breathed (m³/h) | Multiple of resting |
|---|---|---|
| Rest | 0.61 | 1× |
| Walking | 1.37 | ~2.2× |
| Cycling | 2.55 | ~4.2× |
| Running | higher still: 40–60 L/min at moderate effort vs ~6 L/min at rest [R] | ~7–10× |

- **For Delhi's annual average (153 µg/m³), Tainio's break-even:**
  - 30 minutes of cycling a day breaks even at 160 µg/m³;
  - 30 minutes of walking a day stays net-beneficial above 200 µg/m³ [V].

  These are long-term averages, not single-day thresholds.
- **Busy roads cancel the benefit.** In older adults, walking on Oxford Street removed the arterial benefit seen after walking in Hyde Park [R].

### 5.4 Delhi's winter morning is among the dirtiest windows of the day

- Delhi Aerosol Supersite, winter hourly PM1 (Gani 2019): **peak 07:00–08:00** and 21:00–22:00, **lowest 15:00–16:00**. Winter mixing is 4–6× weaker than in summer [V].
- The repo's own measured data agrees: 08:00 averaged 229 → 14:00 averaged 129 µg/m³ across 4 stations, Oct–Dec 2025 ([K1](03-k1-measured-backtest.md), via the [bad-days note](2026-10-10-bad-days-ideation.md)).
- **Don't borrow US advice.** EPA's ozone guide says "exercise in the morning". That is backwards for Delhi's winter particle pollution.

### 5.5 Advice for healthy adults that the evidence supports

- **Reduce intensity and duration first.** EPA's advice for healthy adults by US-AQI band [V]:
  - Unhealthy: reduce long or intense activity and take more breaks.
  - Very unhealthy: avoid long or intense activity; consider rescheduling or moving indoors.
  - Hazardous: avoid all outdoor exertion.
  - Also: exercise away from busy roads.

  *The structure carries over; the US thresholds don't map one-to-one onto CPCB bands.*
- **Delhi's health department advisory (11 Nov 2023):** "Avoid outdoor morning and late evening walks, jog, run… specifically during days with severe AQI" [V].
- **WHO:** "Regular physical activity should be promoted even if the local air quality is not optimal" [V].
- **Masks:** WHO says real-world use shows "little if any health improvements" [V]. Purifiers are "premature" to recommend as a public-health measure [V].
- **Indoors is not automatically clean.** EPIC found Delhi indoor PM2.5 about 20× the WHO guideline across all income groups [V].

---

## 6. What Taaza Hawa should learn

### 6.1 Keep: things none of the leaders or winners do (verified gaps)

| Feature | Evidence that it's a gap |
|---|---|
| **The age of every reading, as part of the advice** | IQAir shows a clock time, aqicn a date (even 3.5 months old), Google rounds down to the hour. None changes its advice because a reading is old |
| **A range when the reading is stale** | No consumer product shows an interval. Google's API has no confidence field |
| **A public, graded track record** | IQAir disclaims accuracy; AirNow's verification is internal; no prize winner self-grades |
| **Hindi, Polly voice, WhatsApp share** | Not seen among leaders or winners. The evidence says *understanding the index* predicts whether people follow advice, and 80%+ of Delhi-NCR didn't know the AQI |

### 6.2 Change

**C1. Say why the runner is among the "most exposed": by dose, not sensitivity.** This is copy only. It is the same user as round 4; it adds the theme's justification and makes no health claim.

| Before | After |
|---|---|
| "Before your walk, run or ride: Taaza Hawa reads the government air station near you and says go, wait or stay in…" | Keep, and add one line: "A run breathes in several times more air than sitting, so the number matters most to you. And Delhi's winter mornings are usually the dirtiest hours of the day." |

The video line: *"The people the brief calls most exposed include anyone breathing hard outdoors at dawn. That's me, at 06:30, in Delhi's dirtiest hour."*

**C2. Make a bad day change something you can measure (Shift and Shrink).** Every prize winner quotes a before/after, and every hackathon winner turns data into an action.
- **Shift:** move the run to the cleaner afternoon.
- **Shrink:** run → brisk walk halves the air breathed in.

The [bad-days ideation note](2026-10-10-bad-days-ideation.md) designs this as **Badlo**: a swap plus a receipt graded by the station's measured readings at both hours, reusing `waitForTaskToken`. This research supports it on three counts:
1. the morning peak is independently confirmed (Gani 2019);
2. "reduce intensity, reschedule" is exactly the evidence-backed advice for healthy adults (EPA, Delhi DHS 2023);
3. a graded swap is the measured before/after that winners always show and City Intelligence lacked.

Run the note's kill test first. Build it only if it *replaces* other work.

**C3. Make "Wait" and "Stay" offer specific options, the way EPA and Delhi DHS do.** This is copy only, even without Badlo. The verdict itself doesn't change.

| Verdict | Before (`say` / `advice` in `i18n.js`) | After |
|---|---|---|
| Wait | "Not yet. Wait for air to improve." · "The air is poor right now. Wait for conditions to improve or exercise caution before strenuous outdoor activity." | "Not yet. If you go, go shorter or easier, away from main roads. Winter afternoons are usually cleaner than mornings." |
| Stay | "No. Stay in today." · "The air is very poor. Skip outdoor exercise and games today." | "Stay in, or move today's session indoors. Indoors isn't automatically clean in Delhi, so keep it light. Regular exercise still matters (WHO)." |

**C4. Put one real, measured before/after in the video, even with no new code.** `GET /history` already returns today's station readings. Film the Dwarka 24-hour line with its **measured 06:30 value next to its measured 15:30 value**, both real, and say the % difference. That gives winners' "measured delta" shape for one station on one day, labelled as such. With Badlo built, it becomes a graded receipt.

**C5. Pitch the miss, Ridgeline-style, but tie it to the decision.** "Right N of M, missed K, shown in public" is credible only next to the 06:30 decision it protects. Honesty is the *how*. The run is the *what*.

**C6. Reach people through WhatsApp forwards, not push.** The leaders lean on push and widgets, but alerts fade by the second day and Delhi's season is back-to-back bad days. Round 5's morning parchi, forwarded by a running-club or RWA admin, is the Indian version of "being on the lock screen".
- If time allows, add the ideation note's **if-then plan** ("On Wait mornings I will: walk at 15:30 · walk now · skip"). Implementation intentions roughly double follow-through.
- Don't build push before submission.

**C7. Name who acts on the data.** Winners have an actor: a school, a hospital, a city. Taaza Hawa's honest equivalent is the **running group or RWA admin who forwards the parchi**. Name them in the video's "who else" beat. Don't revive schools: round 4 excluded them, and they follow GRAP and Directorate of Education orders, not an app.

**C8. Name the AWS services precisely on screen.** The AWS-sponsored winners named their services outright (Bedrock, Glue, Athena, S3; SageMaker). Taaza Hawa's loop is EventBridge → Lambda → DynamoDB → Step Functions `waitForTaskToken` → Polly and SES → Amplify. Show the execution flip from Running to Succeeded.

### 6.3 Don't copy

| Tempting | Why not |
|---|---|
| **A forecast as the headline** | Expected, not rewarded (400+ TEMPO entries and no global winner; Lahore's forecast entries lost). Next-day Delhi is mostly "tomorrow ≈ today" ([research 04](04-smoke-forecast-test-and-next-idea.md)). Use a forecast only to answer "until when?", behind the [Chronos spec](../chronosforecastspec.md)'s backtest gate |
| **Clean-air routes** | Station resolution can't separate a park from a road honestly. Routing entries lost in Lahore |
| **A chatbot or "ask our AI"** | A cliché. LLMs win only with one narrow job, and Taaza Hawa's Bedrock already has one (Hindi phrasing, guarded) |
| **Lung-damage visuals or health-risk scores** | They won Płucka and Lahore prizes, but they are health claims, which Taaza Hawa's honesty rules forbid. Breathing-rate multiples are physics; lung damage is not |
| **Mask and purifier advice** | WHO rates the evidence weak. Round 5 dropped it. The crew page from `d8e45c1` still contains mask advice, so remove it or hide that page |
| **Push-alert storms** | Fatigue by day 2. AirNow's push app has ~10K MAU from 534K installs |
| **"Exercise in the morning"** | That is US ozone advice, and backwards for Delhi's winter particle pollution |
| **"The first app ever to…"** | Say "we found none that…", with this document as the source |

---

## 7. Priority for the hours left before submission (11 Oct)

| # | Change | Effort | Code? | Fits council decisions? |
|---|---|---|---|---|
| 1 | **C4: a measured 06:30 vs 15:30 shot** from the existing 24-hour line, plus C1's "most exposed by dose" and "dirtiest hour" lines in the voiceover | ~1 h | No | Yes. Same user, same app |
| 2 | **C1 + C3 copy** in `web/src/lib/i18n.js` (Hindi and English), plus the WHO "keep exercising" line and "indoors isn't automatically clean" | 1–2 h | Copy only | Yes. Round 4 asked "Wait, until when?" and this answers "Wait, and do what?" |
| 3 | **Hide the bad-air plans and crew pages** from the nav and the video; remove the mask tip | ~30 min | Small | Yes. Round 5 said to remove school mode; the ideation note agrees |
| 4 | **C2 Badlo** swap and receipt, only after its kill test passes and only if it replaces other work | ~1 day | Yes | **Needs your call.** Round 5 relaxed "no new features" for two changes only; Badlo would be a third |
| — | Don't build: push alerts, a forecast headline, routes, a chatbot | — | — | — |

---

## 8. Pitch lines the research supports

- "Most apps forecast the air. We grade our advice." (from the ideation note)
- "The leaders show a timestamp. We tell you what that age means for your run."
- "A run breathes in several times more air than sitting. In Delhi's winter, 06:30 is near the dirtiest hour of the day."
- "Right N of M, missed K. Every miss is on the record page."

---

## Sources

**Most-used products**
- IQAir: [AppGoblin](https://appgoblin.info/apps/com.airvisual) [V] · [App Store](https://apps.apple.com/us/app/iqair-airvisual-air-quality/id1048912974) [V] · [UNEP launch, 2020](https://www.unep.org/news-and-stories/press-release/worlds-largest-platform-air-quality-data-launched-tenth-world-urban) [V] · [Semrush](https://www.semrush.com/website/iqair.com/overview/) [V] · [Delhi page](https://www.iqair.com/india/delhi) [V] · [reviews](https://justuseapp.com/en/app/1048912974/iqair-airvisual-air-quality/reviews) [V]
- Google: [Globes, BreezoMeter deal](https://en.globes.co.il/en/article-google-launches-applications-based-on-breezometer-acquisition-1001456420) [V] · [Air Quality API](https://developers.google.com/maps/documentation/air-quality/overview) [V] · [currentConditions reference](https://developers.google.com/maps/documentation/air-quality/reference/rest/v1/currentConditions/lookup) [V] · [Air View+ India](https://blog.google/intl/en-in/company-news/using-googles-ai-and-local-ecosystem-to-generate-actionable-air-quality-insights-in-india-with-air-view/) [V] · [Pixel At a Glance](https://9to5google.com/2022/07/25/pixel-at-a-glance-air-quality/) [V]
- Apple: [Weather data sources](https://support.apple.com/HT211777) [V] · [New York misreading, Jan 2025](https://www.wbng.com/2025/01/13/iphone-weather-app-reports-inaccurate-air-quality-indexes) [V]
- Plume Labs: [AccuWeather acquisition](https://techcrunch.com/2022/01/24/accuweather-acquires-air-pollution-startup-plume-labs) [V] · [Flow discontinued](https://plumelabs.com/en/flow/) [V] · [AppGoblin](https://appgoblin.info/apps/com.plumelabs.air) [V]
- AirNow: [Fire and Smoke Map traffic](https://www.epa.gov/research-states/epa-research-partner-support-story-airnow-fire-and-smoke-map) [V] · [AppGoblin](https://appgoblin.info/apps/com.saic.airnow) [V] · [push forecasts, Dec 2024](https://www.epa.gov/newsreleases/updated-epas-airnow-mobile-device-app-allows-public-receive-air-quality-forecasts-push) [V] · [KQED, PurpleAir vs AirNow](https://www.kqed.org/science/1969271/making-sense-of-purple-air-vs-airnow-and-a-new-map-to-rule-them-all) [V]
- PurpleAir: [Business Wire, 2021](https://www.businesswire.com/news/home/20210921005311/en/) [R]
- WAQI: [contact and scale](https://aqicn.org/contact) [V] · [Delhi ITO page, checked 9 Oct 2026](https://aqicn.org/city/delhi/ito/) [V]
- India: [Sameer, AppGoblin](https://appgoblin.info/apps/com.cpcb) [V] · [Sameer, App Store](https://apps.apple.com/in/app/sameer-indias-aqi/id1186664744) [V] · [Newslaundry, Diwali 2025 gaps](https://www.newslaundry.com/2025/11/05/delhis-double-whammy-air-getting-toxic-aqi-data-under-cloud) [V] · [Health Policy Watch](https://healthpolicy-watch.news/delhis-air-pollution-rises-but-trust-in-official-data-falls/) [V] · [AQI.in, AppGoblin](https://appgoblin.info/apps/com.aqi.data) [V] · [Scroll, why Delhi numbers differ](https://scroll.in/article/1088591/why-air-quality-numbers-in-delhi-vary-widely) [V] · [The Week, stations vs required](https://www.theweek.in/magazine/theweek/current/2026/01/03/delhis-aqi-crisis-are-we-trusting-wrong-numbers-flawed-solutions.amp.html) [V] · [Tribune, 87% low or no trust](https://www.tribuneindia.com/news/explainers/concerns-raised-over-micro-management-of-air-quality-data/amp) [V] · [SSRS 2025, US checking habits](https://ssrs.com/insights/perceptions-of-air-quality-in-america/) [V] · [uncertainty-aware maps change decisions, arXiv 2012.11109](https://arxiv.org/abs/2012.11109) [V]

**Prize winners**
- Earthshot: [Takachar (MIT J-WAFS)](https://jwafs.mit.edu/news/2021/takachar-co-led-j-wafs-solutions-and-india-grant-recipient-kevin-kung-won-earthshot-prize) [V] · [2021 finalists (CIWEM)](https://www.ciwem.org/news/earthshot-prize-finalists) [V] · [Mukuru (Nation)](https://nation.africa/kenya/news/mukuru-jiko-initiative-goes-global-wins-earthshot-prize-4042476) [V] · [GRST (HKSTP)](https://www.hkstp.org/news-room/hkstp-park-company-grst-wins-prince-william-s-earthshot-prize/) [R] · [Polish Smog Alert (Clean Air Fund)](https://www.cleanairfund.org/news-item/polish-smog-alert-earthshot-prize/) [V] · [GAYO (Clean Air Fund)](https://www.cleanairfund.org/news-item/gayo-earthshot-prize/) [R] · [Bogotá (Cities Today)](https://cities-today.com/?p=72798) [V] · [2026 finalists](https://investor.wedbush.com/wedbush/article/bizwire-2026-9-18-the-earthshot-prize-announces-2026-finalists) [V]
- AirQo: [Makerere, Google.org grant](https://news.mak.ac.ug/2019/05/maks-airqo-project-is-a-us1-3m-google-ai-impact-grantee) [V] · [airqo.net](https://airqo.net/) [V] · [Monitor, Earthshot finalist](https://www.monitor.co.ug/uganda/news/national/ugandan-founded-airqo-named-among-15-earthshot-prize-finalists-5600810) [V]
- Breathe London: [triple award win](https://www.breathelondon.org/news/triple-win-for-breathe-london-at-environmental-monitoring-awards) [V] · [School Streets study](https://www.london.gov.uk/press-releases/mayoral/school-streets-improve-air-quality) [R] · [Breathe London Awards, 2026](https://airqualitynews.com/headlines/knitted-data-and-cleaner-school-runs-celebrating-londons-air-quality-pioneers/) [V]
- UNEP: [Kolesnikova, MoveGreen](https://www.unep.org/news-and-stories/story/kyrgyz-republic-young-activist-uses-data-take-air-pollution) [V] · [Chakr Innovation](https://www.unep.org/news-and-stories/story/young-champion-earth-winner-asia-pacific) [V]
- India: [Blue Sky Analytics, Copernicus Masters](https://www.gktoday.in/gurgaon-based-blue-sky-analytics-won-the-copernicus-masters-award) [V] · [MIT Solve, 2019](https://solve.mit.edu/articles/meet-the-solver-teams-introducing-our-8-healthy-cities-innovators) [V] · [Respirer, AIRLAB](https://respirer.substack.com/p/respirers-made-in-india-tech-recognised) [V] · [Swachh Vayu Survekshan 2026](https://www.businesstoday.in/india/story/swachh-vayu-sarvekshan-2026-lucknow-beats-indore-by-a-single-point-to-top-indias-2026-clean-air-survey-554298-2026-09-09) [V]
- Other: [OpenAQ, AWS grant](https://eos.org/agu-news/closing-the-air-quality-data-gap-in-the-developing-world) [V] · [Toxic Toby, D&AD](https://www.dandad.org/work/d-ad-awards-archive/toxic-toby) [V] · [South Coast AQMD app, EPA award](https://www.aqmd.gov/docs/default-source/news-archive/2021/app-wins-epa-award-jan13-2021.pdf) [V] · [PRAISE-HK](https://ais.hkust.edu.hk/whats-happening/news/praise-hk-won-asia-smart-app-award-public-sector-and-social-innovation-gold) [V]

**Hackathon winners**
- NASA Space Apps Global Winners: [2022](https://www.earthdata.nasa.gov/news/2022-space-apps-challenge-winners) · [2023](https://science.nasa.gov/directorates/smd/2023-nasa-international-space-apps-challenge-announces-10-global-winners) · [2024](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-international-space-apps-challenge-announces-2024-global-winners/) · [2025](https://www.spaceappschallenge.org/2025/meet-the-2025-global-winners/) [V] · [TEMPO submission count (OPeNDAP)](https://www.opendap.org/nasas-international-space-apps-challenge-2025/) [R]
- [Univ. of Utah, "A Breath of Fresh Air"](https://rai.utah.edu/?p=4716) [V] · [Tech To The Rescue winners](https://www.techtotherescue.org/news/meet-the-winners-of-the-air-quality-hackathon) [V] · [AWS blog, Afri-SET](https://aws.amazon.com/blogs/machine-learning/improving-air-quality-with-generative-ai) [V]
- [NYC Climate Hackathon gallery](https://nycclimatehack-sep2025.devpost.com/project-gallery) [V] · [Breathe Bronx](https://devpost.com/software/breathe-bronx) [R] · [Smart City Hackathon Lahore gallery](https://smart-city-hackathon-lahore.devpost.com/project-gallery) [V] · [SmogNet Datathon gallery](https://smognet-datathon.devpost.com/project-gallery) [V] · [Health in Climate gallery](https://health-in-climate-ai-hackathon.devpost.com/project-gallery) [V] · [Ridgeline](https://devpost.com/software/ridgeline-wildfire-smoke-detection-that-earns-its-alarms) [R] · [Smart Dublin data hack](https://www.tcd.ie/engineering/news/2023/team-phoenix-soars-as-trinity-researchers-win-air-quality-data-hack-2023-event) [V] · [H2O.ai India hackathon](https://h2o.ai/blog/2023/h2o-olympics-hackathon-winners-announcement/) [V]

**Bad-day evidence**
- Programs: [Neidell, Spare the Air RD study](https://archive.epa.gov/ncer/events/calendar/archive/web/pdf/neidell_paper.pdf) [V] · [KQED, do people drive less?](https://www.kqed.org/science/711545/do-people-drive-less-on-spare-the-air-days) [V] · [Spare the Air overview](https://en.wikipedia.org/wiki/Spare_the_Air_program) [V] · [CARB, burn-ban admissions](https://ww2.arb.ca.gov/news/hospital-admissions-drop-and-air-quality-improves-fireplace-wood-burning-restrictions) [V] · [EPIC, odd-even](https://epic.uchicago.in/did-odd-even-clean-delhis-air-analysis-evaluates/) [V] · [GRAP study write-up](https://www.iamrenew.com/environment/grap-has-key-role-in-controlling-delhi-air-pollution-says-iitm-and-caqm-study/amp) [V] · [Barwick et al., AER 2024](https://ideas.repec.org/a/aea/aecrev/v114y2024i5p1338-81.html) [V] · [airTEXT (Eurisy)](https://www.eurisy.eu/stories/london-airtext-a-public-health-advice-programme_72/) [V]
- Alerts: [Neidell, NBER w14209](https://www.nber.org/papers/w14209) [V] · [Sydney cycling](https://ideas.repec.org/p/ott/wpaper/e1502e.html) [V] · [Toronto AQHI (Public Health Ontario)](https://www.publichealthontario.ca/en/about/news/2018/air-pollution-alerts) [V] · [D'Antoni 2017 systematic review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5610416/) [V] · [Graff Zivin & Neidell 2009, fatigue](https://ideas.repec.org/a/eee/jeeman/v58y2009i2p119-128.html) [R] · [Longueuil RCT](https://pmc.ncbi.nlm.nih.gov/articles/PMC6571566/) [V] · [Delhi-NCR AQI awareness (Quint)](https://www.thequint.com/amp/story/fit/survey-finds-over-80-percent-of-delhi-ncr-people-do-not-know-about-air-quality-index) [V] · [LocalCircles Oct 2025 (ETV Bharat)](https://www.etvbharat.com/en/state/three-in-four-delhi-ncr-households-feeling-impact-of-toxic-air-finds-survey-enn25102602303) [V] · [EPIC indoor information study](https://epic.uchicago.in/project/indoor-air-quality-information-and-socio-economic-status-evidence-from-delhi/) [V]
- Exposure: [EPA particle pollution guide](https://www.airnow.gov/sites/default/files/2023-03/air-quality-guide-for-particle-pollution_0.pdf) [V] · [EPA ozone guide](https://document.airnow.gov/air-quality-guide-for-ozone.pdf) [R] · [WHO personal interventions Q&A](https://www.who.int/news-room/questions-and-answers/item/air-pollution-personal-interventions-and-risk-communication) [V] · [MoHFW advisory, Nov 2025](https://www.etvbharat.com/en/bharat/health-ministry-issues-advisory-to-states-and-uts-on-air-pollution-enn25111204695) [V] · Tainio et al. 2016, PMC4893018 [V] · [Sinharay 2018](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5803182) [R]
- Delhi diurnal: [Gani et al. 2019, ACP](https://acp.copernicus.org/articles/19/6843/2019/) [V]
- Actions: [Delhi DHS advisory, Nov 2023 (Outlook)](https://www.outlookindia.com/national/avoid-outdoor-walks-say-no-to-firecrackers-delhi-health-department-issues-advisory-news-330116) [V] · [Beijing mask study (Edinburgh)](https://www.research.ed.ac.uk/en/publications/beneficial-cardiovascular-effects-of-reducing-exposure-to-particu/) [V] · [CSEP sport and exercise position statement, 2023](https://csep.ca/2023/01/09/personal-strategies-to-mitigate-the-effects-of-air-pollution-exposure-during-sport-and-exercise/) [V]

**Internal:** [R3 competitor scan](../wayfinder/research/R3-competitor-novelty-scan.md) · [R4 event signals](../wayfinder/research/R4-event-signals-and-precedents.md) · [K1 backtest](03-k1-measured-backtest.md) · [research 04](04-smoke-forecast-test-and-next-idea.md) · [bad-days ideation](2026-10-10-bad-days-ideation.md) · [round-4 verdict](../council/round-4-audience/02-verdict.md) · [round-5 verdict](../council/round-5-real-use/02-verdict.md) · [Chronos spec](../chronosforecastspec.md)
