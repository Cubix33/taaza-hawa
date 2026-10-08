# Environmental Hacks — Ideation & Architectural Research
> **Event:** WeMakeDevs × AWS Environmental Hacks (Oct 8–11, 2026)  
> **Tracks:** Air · Heat & Water · Waste & Energy  
> **Current Status:** 🔬 **Ideation & Feasibility Phase** (Pre-Clock Architecture & Research)

---

## 🛠️ Build status (Oct 8)

Code lives in three folders. Core logic is pure Python and unit-tested; AWS is only at the edges.

| Path | What |
|---|---|
| `backend/src/taaza/` | CPCB sub-index + fixed answer rule, staleness, split-conformal intervals, neighbour/CAMS estimator, deterministic grader, storage, Hindi copy |
| `backend/src/handlers/` | Lambda handlers: `poller` (poll / morning / bulletin), `api` (Function URL), `hold_tasks` (Step Functions) |
| `infra/` | SAM `template.yaml` + `hold.asl.json` (the `waitForTaskToken` receipt) |
| `web/` | Vite PWA: one card, Hindi/English, interval bar, "हमें परखो", Scoreboard |

```bash
# backend tests
cd backend && python -m pytest -q
# local demo (SYNTHETIC data, labelled "demo": true) + UI
python backend/local_server.py          # http://localhost:8787
cd web && npm install && npm run dev    # http://localhost:5173
# local with real feeds
WAQI_TOKEN=... python backend/local_server.py --live
# deploy (needs AWS CLI + SAM CLI)
sam build -t infra/template.yaml && sam deploy --guided --region ap-south-1
```

Dev-only: `POST /dev/return?uid=1` makes a stale demo station "come back" so the grading loop can be rehearsed.

---

## 📌 Executive Summary

This repository contains the pre-event architectural research, empirical data audits, and candidate evaluations for the **WeMakeDevs × AWS Environmental Hacks**.

> [!NOTE]
> **Currently in the Ideation Phase**: **Taaza Hawa (*अभी बाहर जाऊँ?*)** is our **recommended lead project** for the Air track based on data feed feasibility, technical rigor, and live applicability in Delhi-NCR. However, multiple alternative candidates across all three tracks have been researched and documented here for evaluation and review.

---

## 🏆 Recommended Lead Idea: Taaza Hawa (*अभी बाहर जाऊँ?*)

- **Track:** Air (Track 01)
- **Persona & Moment:** A Delhi resident (e.g. Dwarka) at 06:30 AM deciding whether to run, cycle, or keep vulnerable family members indoors.
- **Detailed Spec:** [`docs/wayfinder/IDEA-taaza-hawa.md`](docs/wayfinder/IDEA-taaza-hawa.md)

### The Core Problem
During Delhi's critical October–November smog transition, public air monitoring data on popular mirrors frequently lags by hours to days (observed 31h+ stale on Anand Vihar, 56h+ on NSIT Dwarka). Millions of citizens make outdoor health choices based on "ghost numbers" with zero indication of reading freshness.

### The Solution Loop
1. **Freshness Audit ("Taaza Badge"):** Clearly states the exact age and source of the nearest monitoring station reading.
2. **Conformal Uncertainty Range:** If the station reading is stale (>3 hours), derives a calibrated interval based on live neighbouring stations and bias-corrected CAMS atmospheric models.
3. **Action Verdict:** Clear decision in Hindi & English: *जाओ (Go)*, *10 बजे के बाद (Wait till 10 AM)*, or *अंदर रहो (Stay Inside)*.
4. **"हमें परखो" (Hold Me To It):** User taps one button to lock their decision. An AWS Step Functions execution parks on `waitForTaskToken`.
5. **Deterministic Verification:** When the physical station updates upstream, `SendTaskSuccess` closes the loop, verifying whether the actual reading fell within the promised interval (*Hit* or *Missed by N*).
6. **Public Transparency Scoreboard:** A live 4-day ledger evaluating every Delhi station and citing CPCB's daily bulletin.

### AWS Serverless Architecture
- **EventBridge Scheduler:** Periodic scrapers (15-min cadence) and daily bulletin ingest at 17:30 IST.
- **AWS Lambda:** Data ingestion, CPCB sub-index math, and conformal interval computation.
- **Amazon DynamoDB:** Station history ledger, subscriptions, and task token storage.
- **AWS Step Functions (`waitForTaskToken`):** Zero-compute asynchronous wait for station data arrival.
- **Amazon SES:** Immutable email verification receipts.
- **AWS Amplify Hosting:** Fast, mobile-first static PWA.
- **Amazon Bedrock (Claude 3.5 Haiku `in.` profile):** Single-sentence native Hindi phrasing with deterministic template fallbacks.

---

## 🔬 Other Candidate Ideas Explored

While *Taaza Hawa* is the lead recommendation, the repository documents several other evaluated directions:

1. **School Activity & Inhaled-Dose Actuator ("Hawa Hold")** (`docs/research/02-software-only-dossier.md`):
   - Computes EPA inhalation volume multipliers (light vs. high intensity) for morning school athletics.
   - Adjusts PE intensity rather than shifting timetables.
2. **FrameDebt — Premature Media Transfer Canary** (`docs/research/05-solo-software-search-and-framedebt.md`):
   - Developer tooling in Waste & Energy evaluating offscreen data transfers on media-heavy web apps via AWS CloudWatch Synthetics.
3. **Virtual Solar Twin (Rooftop PV Soiling Analysis)** (`docs/research/02-software-only-dossier.md`):
   - Compares neighbouring residential solar outputs to decouple ambient smog from physical dust accumulation.

---

## 📂 Repository Navigation

- **[`docs/WINNER_PLAYBOOK.md`](docs/WINNER_PLAYBOOK.md)** — Architectural & design principles for high-scoring hackathon systems.
- **[`docs/wayfinder/`](docs/wayfinder/)** — Central decision map, ground-truth research, and specifications:
  - [`IDEA-taaza-hawa.md`](docs/wayfinder/IDEA-taaza-hawa.md) — Comprehensive technical spec for Taaza Hawa.
  - [`MAP.md`](docs/wayfinder/MAP.md) — Research status tracker and open tickets.
  - [`research/`](docs/wayfinder/research/) — Research reports on Delhi ground truth, data feeds, and AWS services.
  - [`council/`](docs/wayfinder/council/) — Multi-perspective peer reviews and evaluation verdicts.
  - [`tickets/`](docs/wayfinder/tickets/) — Detailed research tickets and pre-event milestones.
- **[`docs/research/`](docs/research/)** — Backtests (K1 measured backtest, smoke forecast analysis) and early dossiers.

---

## ⏱️ Next Steps (Pre-Clock Milestone)

- [ ] Daily morning CPCB captcha & WAQI timestamp audits (Oct 5–7 @ ~09:00 IST).
- [ ] AWS account verification and Bedrock model access checks.
- [ ] Final idea confirmation prior to Oct 8 08:00 IST kickoff.
