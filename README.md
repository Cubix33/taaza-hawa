<div align="center">

# ताज़ा हवा · Taaza Hawa

### अभी बाहर जाऊँ? &nbsp;·&nbsp; *Can I go outside right now?*

**Delhi's air-quality number, with its age.<br/>An honest range when it's old. A public grade when the truth arrives.**

<br/>

[![Live site](https://img.shields.io/badge/▶_Live_site-open-0d7a65?style=for-the-badge)](https://main.d2r1frd99buxhf.amplifyapp.com/)
&nbsp;
![Track](https://img.shields.io/badge/Track-Air-2f6da8?style=for-the-badge)
&nbsp;
![Serverless on AWS](https://img.shields.io/badge/Serverless-AWS-b8641b?style=for-the-badge)

WeMakeDevs × AWS **Environmental Hacks 2026**

<br/>

<img src="docs/screenshots/home.jpg" alt="Taaza Hawa home page: an illustrative Delhi skyline parameterized by the city's live air quality, with the answer 'Not yet. Wait for air to improve'" width="900"/>

<sub>The sky, the haze and the sun are an illustrative artwork parameterized by Delhi's live AQI: clear air looks clear, smog looks like smog. <i>(Screenshots on this page use clearly labelled demo data.)</i></sub>

</div>

---

## Contents

[The problem](#the-problem) · [What it does](#what-it-does) · [A tour](#a-tour) · [How the loop works](#how-the-loop-works) · [Architecture](#architecture) · [Honest by design](#honest-by-design) · [Run it](#run-it-locally) · [Deploy](#deploy-to-aws) · [API](#api) · [Repo layout](#repository-layout) · [Status](#status) · [Research](#research-behind-it)

---

## The problem

Every October morning a Delhi resident checks one number before a run, a walk, or sending a child to practice. That number has **no age, no source and no error bar**.

It is often old. On 4 Oct 2026 the mirror most people use showed Anand Vihar **31 hours** stale and NSIT Dwarka **56 hours** stale ([R2](docs/wayfinder/research/R2-data-feeds-audit.md)). CPCB's own bulletin shows 2–3 of 46 Delhi stations not reporting on an ordinary day ([R1](docs/wayfinder/research/R1-delhi-ground-truth-oct-2026.md)). Last season's loudest complaint on r/delhi was not *"what is the AQI?"* but *"can I trust it?"* ([R7](docs/wayfinder/research/R7-citizen-friction-mining.md)).

Nobody tells people **how old** the number is, gives them an honest estimate when it is stale, and then **checks that estimate in public**. Taaza Hawa does all three.

## What it does

| | |
|---|---|
| **One plain answer** | **हाँ, जाइए** · **अभी नहीं, हवा सुधरने का इंतज़ार करें** · **नहीं, आज अंदर रहिए**, from a fixed, published rule on the CPCB AQI bands, followed by a short *"क्यों? / Why?"* in everyday words. |
| **The age of every number** | Each answer says how many hours ago the station measured it, and where it came from. Always. |
| **An honest range when it's old** | If a station's number is over 3 h old, the app shows *"AQI probably 232–264"*: a split-conformal interval built from the 3 nearest live stations plus bias-corrected CAMS. Advice uses the top of the range, to be careful. |
| **Check it and tell me** | One tap, no account. An **AWS Step Functions** execution waits (at no compute cost) until that station reports again, then the page shows whether the real number landed inside our range. |
| **A public track record** | Every morning, every station: right or missed by N. Misses are shown as clearly as hits, with the hit rate against an 80 % target and the number of checks always visible. |
| **Listen** | A Hindi/English voice (Amazon Polly, *Kajal*) reads the answer aloud, for people who don't read easily. |
| **Air Lens** | Explore Delhi in a dusk/day 3D map, fly into real building geometry, select floating station readings, and see the actual inputs behind an estimate. Includes location pins, pollutant switching, search, a flat view, and a keyboard-accessible station list. |
| **Share on WhatsApp** | One tap sends the verdict, the station and the age of the number to family. |

Also: *"What will you do outside?"* chips (walk, jog, run, child playing) that explain how much more air you breathe than sitting (US EPA rates; the verdict never changes); a last-24-hours line that shows where a station went quiet; Hindi-first with an English switch; light and dark mode; installable as a phone app; no login.

> **Honesty line.** We say: reading age, the named source, the range and its inputs, right / missed, and CPCB's own participation count, quoted. We never say a station is "dark" or "tampered", never claim a "true AQI", never assign blame, and never make health-outcome claims. *Station air, not your street. An estimate, not the truth.*

## A tour

<table>
<tr>
<td width="62%" valign="top">
<img src="docs/screenshots/check.jpg" alt="The Check my air page"/>
<p align="center"><b>Check my air</b><br/><sub>The answer, why, how old the number is, and the range on a CPCB-coloured dial.</sub></p>
</td>
<td width="38%" valign="top">
<img src="docs/screenshots/mobile.png" alt="Taaza Hawa open on an iPhone: the home page and the Check my air page"/>
<p align="center"><b>On your phone</b><br/><sub>Installable, thumb-friendly, no login.</sub></p>
</td>
</tr>
</table>

<table>
<tr>
<td width="50%" valign="top">
<img src="docs/screenshots/air-lens.png" alt="Air Lens: Delhi geography, station readings and an estimate evidence panel"/>
<p align="center"><b>Air Lens</b><br/><sub>Explore the city, inspect station evidence, and fly into neighbourhood buildings. Demo readings are explicitly labelled.</sub></p>
</td>
<td width="50%" valign="top">
<img src="docs/screenshots/record.jpg" alt="The track record page"/>
<p align="center"><b>Track record</b><br/><sub>Hits and misses per station, against the 80 % target.</sub></p>
</td>
</tr>
</table>

## How the loop works

```
  06:30 IST        ┌────────────────────────────────────────────────────────────┐
  every day  ───▶  │ 1. Estimate  : each station, from its neighbours + CAMS     │
                   │ 2. Wait      : until that station's NEXT real reading        │
  you press        │    (a Step Functions execution parked on waitForTaskToken)   │
  "Check it  ───▶  │ 3. Judge     : inside the range → RIGHT, outside → MISSED   │
   and tell me"    │ 4. Show      : on your screen, in the public record, by email│
                   └────────────────────────────────────────────────────────────┘
```

The judge is **the station's own next hourly value**, never a model grading itself, and only a reading measured *after* the promise counts (a backfilled old hour can't grade it). A promise that hears nothing for 72 h is recorded as *missed, still waiting*.

## Architecture

```mermaid
flowchart LR
  S[EventBridge Scheduler<br/>15 min · 06:30 · 17:30 IST] --> P[Lambda: poller]
  P -->|WAQI stations<br/>Open-Meteo CAMS<br/>CPCB bulletin PDF| P
  P --> D[(DynamoDB<br/>readings · calibration<br/>promises · task tokens)]
  W[Web app<br/>Amplify Hosting] -->|Function URL| A[Lambda: API]
  A --> D
  A -->|check it and tell me| SF[Step Functions<br/>waitForTaskToken]
  SF --> R[Lambda: register token] --> D
  P -->|station reports again<br/>SendTaskSuccess| SF
  SF --> N[Lambda: notify] --> E[SES result email]
  A -->|listen| PL[Amazon Polly · Kajal<br/>spoken answer, cached]
  A -.optional.-> B[Bedrock · Claude Haiku 4.5<br/>Hindi phrasing only]
```

| Service | Why this one |
|---|---|
| **EventBridge Scheduler** | 15-minute polling plus the 06:30 and 17:30 IST jobs, with no server |
| **Lambda** (5 functions) | Poller, API, and the three steps of a check. Pure functions, unit-tested |
| **DynamoDB** | One pay-per-request table: readings, calibration, promises, task tokens, cached audio |
| **Step Functions Standard** | A check *is* a waiting execution. It waits up to 72 h for free, and you can watch it flip from Running to Succeeded |
| **Lambda Function URL** | A public API without API Gateway |
| **Polly** | Reads the answer aloud (neural voice Kajal, available in Mumbai). The server writes the text itself, so the endpoint can't be used to read arbitrary text, and each wording is synthesized once |
| **SES** | Optional result email |
| **Amplify Hosting** | Static Vite build, rebuilt on every push to `main` |
| **CloudWatch** | Alarm when the poller keeps failing |
| **Bedrock** *(optional)* | Rephrases one Hindi sentence. A guard rejects any change to a number; it never decides anything |

## Honest by design

- **Calibrated on live data.** On every poll, each fresh station is *re-estimated with its own reading hidden*, from its neighbours and CAMS, and the error is recorded. Ranges use split-conformal quantiles targeting 80 % coverage.
- **Says when it isn't ready.** Until a station has 20 recorded errors, its range is labelled *calibration warming up* and widens with the number's age.
- **Never fakes a track record.** While fewer than 5 real checks exist, the record page shows an example that is *clearly labelled* (striped banner and an "Example" tag on every section) with a switch to real data; it vanishes automatically once real results arrive.
- **Percentages need evidence.** A hit rate is only shown for 5 or more checks, and the count is always next to it.
- **Demo data is labelled everywhere.** The local demo server marks every response `"demo": true` and the site shows a banner.

## Run it locally

Needs Python 3.12 and Node 20+.

```bash
# backend tests (30)
cd backend && python -m pytest -q

# API with SYNTHETIC demo data (every response says "demo": true; the UI shows a banner)
python backend/local_server.py            # http://localhost:8787

# …or with live feeds (free token: aqicn.org/data-platform/token)
WAQI_TOKEN=... python backend/local_server.py --live

# web app
cd web && npm install && npm run dev      # http://localhost:5173
```

Demo mode only: `POST /dev/return?uid=1` makes a stale station report again, so you can rehearse a "right" result.

Air Lens uses MapLibre GL JS 6.13 with OpenFreeMap tiles; no map API key is needed. The map compares one pollutant sub-index at a time. Its side panel identifies the selected card's governing pollutant. Dashed markers are old readings; unavailable pollutant data stays neutral. Evidence connections use the estimator's returned coordinates, not a client-side reconstruction. Building heights come from OpenMapTiles and are geographic context only.

Run frontend data-adapter tests with `cd web && npm test`. Deploy the updated backend before the frontend: Air Lens needs the additive `values` / `reading_ts` station fields and structured card `evidence`. Older servers remain usable through the station card, but do not supply pollutant markers or evidence connections. Desktop/mobile layout, language and theme changes, rapid selection, location failure, WebGL fallback/retry, and map cleanup were checked locally with labelled demo data.

## Deploy to AWS

```bash
sam build -t infra/template.yaml
sam deploy --guided --region ap-south-1   # asks for WaqiToken (hidden); afterwards just `sam deploy`
```

Then connect this repo in **Amplify Hosting** (it reads `amplify.yml`) and set `VITE_API_URL` to the stack's `ApiUrl` output.

| Parameter | Purpose |
|---|---|
| `WaqiToken` | WAQI API token (NoEcho) |
| `DefaultStationUid` | Station shown to first-time visitors |
| `SesSender` | Verified SES address; empty turns result emails off |
| `BedrockModelId` | e.g. `in.anthropic.claude-haiku-4-5-20251001-v1:0`; empty uses the plain template sentence |

> **Order matters.** The website and the backend deploy separately. Pushing to GitHub rebuilds the **website** (Amplify). Changes under `backend/` or `infra/` only go live when you run `sam build` and `sam deploy`. Deploy the backend first when a change touches both.

Cost at hackathon scale sits inside the AWS Free Tier. Bedrock (if enabled) and Polly are the only per-call costs, and Polly output is cached.

## API

| Route | What it returns |
|---|---|
| `GET /card?uid=` | The answer for one station: verdict, why, age, range, source |
| `GET /stations` | Every station with its latest AQI and how old it is |
| `GET /history?uid=&hours=` | A station's recent readings (for the 24-hour line) |
| `GET /scoreboard` | The record: grid, totals, accuracy against the 80 % target, recent checks |
| `POST /hold` · `GET /hold?id=` · `POST /hold/email` | Start a check, read its status, add a result email |
| `GET /speak?uid=&lang=` | The spoken answer (Polly mp3, base64). The text is built server-side |
| `GET /health` | Last poll time and age |

## Repository layout

```
backend/
  src/taaza/          core logic: AQI maths, freshness, conformal, estimator, grader, speech, store, copy
  src/taaza/sources/  WAQI, Open-Meteo CAMS, CPCB bulletin
  src/handlers/       Lambda entry points: poller, api, hold_tasks
  tests/              30 unit tests, incl. the stale → check → graded loop and the Polly request shape
  local_server.py     the same API locally: demo data, or --live feeds
infra/
  template.yaml       SAM: table, Lambdas, schedules, state machine, Function URL, alarm
  hold.asl.json       the waitForTaskToken state machine
web/                  Vite app: 5 pages, Hindi/English, light/dark, desktop and mobile, 3D map (MapLibre)
amplify.yml           Amplify build for web/
docs/                 research, council verdicts, the full spec, README screenshots
```

## Status

Built during the hack window (8–11 Oct 2026). Open work is tracked as [issues](https://github.com/Cubix33/taaza-hawa/issues).

- [x] Core engine, grader and live calibration, with tests
- [x] Lambda handlers, SAM stack, the waitForTaskToken state machine
- [x] Website: 5 pages, Hindi/English, light/dark, desktop and mobile
- [x] 3D map, spoken answer (Polly), WhatsApp share, 24-hour line, public accuracy view
- [x] Deployed to AWS and hosted on Amplify
- [ ] Live WAQI scale check (K3) and the real Dwarka default station
- [ ] CPCB bulletin parser checked on a real PDF
- [ ] End-to-end "check it and tell me" loop recorded on AWS
- [ ] Demo film and AWS Builder Center blog

## Research behind it

The idea was chosen through written research and a multi-perspective review before the clock started:

[Full spec](docs/wayfinder/IDEA-taaza-hawa.md) · [Council verdict](docs/wayfinder/council/03-verdict.md) · [Research R1–R8](docs/wayfinder/research/) · [Decision map](docs/wayfinder/MAP.md)

**Data:** WAQI (aqicn.org), a mirror of CPCB/DPCC station readings · Open-Meteo CAMS · CPCB daily AQI bulletin · breathing rates from the US EPA Exposure Factors Handbook · map tiles by OpenFreeMap, data © OpenStreetMap contributors. Values are station air, not your street.
