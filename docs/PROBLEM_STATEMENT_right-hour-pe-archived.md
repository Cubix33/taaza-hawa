# Right Hour PE: *साफ़ हवा घंटा*
> **ARCHIVED (2026-10-04):** Measured-data backtesting and the solo demo constraint weakened this proposal. The current selected concept is [FrameDebt](PROBLEM_STATEMENT.md). The analysis below is preserved as historical research, including claims later rejected by the backtest.
### "Morning smoke or midday ozone. We pick the hour, and by evening the air grades us."

> **Track:** Air · **Event:** WeMakeDevs × AWS Environmental Hacks, Oct 8–11 2026 · **Constraint:** software only (no hardware)
> **Status:** decided by LLM Council round 2 on Oct 4, 2026 (`council/round-2-software/03-council-verdict.md`). **No project code exists. Build starts when the clock starts.**
> **Inspiration kept:** the hardware idea Saaf Twin (`PROBLEM_STATEMENT_saaf-twin-hardware.md`). Its patterns are reused here (§2C).
> **⚠️ K1 RESULT (Oct 4, measured CPCB data, 81 days): the daily-swap idea did NOT validate.** The best fixed poster (PE in the last slot, 13:00) was wrong by >25 AQI points on only **19% of days**, and the swap rule would fire on **~4–6% of days**. The earlier "Two-Peak Problem" / 49% figures came from a **model (CAMS) that overstated midday ozone ~5×** (DTU measured mean 37 vs model 191 µg/m³). This document is **on hold pending a decision**. Details: `research/03-k1-measured-backtest.md`.
>
> **Honesty line (from the Chairman):** this is a **podium entry as it stands**. It becomes a **winner** only if (a) **measured** station data confirms the Two-Peak Problem (kill-test K1, §10), (b) a **real teacher or principal** taps on film, and (c) the receipts **honestly include a miss**.

---

## 1. The problem statement

Delhi schools run PE, assembly and sports outside every morning. In October they open at **7:30–8:00 AM**, inside Delhi's **morning PM2.5 peak (local maximum 08:00–10:00)**, when the night's shallow boundary layer still traps smoke. The obvious fix is "do PE later". But later in the day the city's **second smog rises: ground-level ozone, which peaks at midday**, and early-October noons are hot.

So there is no single safe hour. **The best hour moves from day to day**, depending on whether that day's danger is smoke, ozone, or both. Today a principal has three options:
- a **city-level AQI number** (SAFAR, SAMEER), which says how bad the day is, not *when*;
- an **all-or-nothing order** (GRAP III/IV closes or hybridises classes, sometimes for 15 days);
- the Supreme Court's warning that outdoor sport in bad months is "putting students in a gas chamber".

Even so, CAQM found schools still holding outdoor sports. Children breathe **4.5–8.5× more air** during moderate-to-hard exercise, and nobody tells the school which hour of *tomorrow* is the right one.

**Right Hour PE** tells the principal the night before which period is the cleanest one for PE, using a deterministic score of measured and forecast air. It can also say "keep PE indoors tomorrow" (**Hawa Hold**). **Every evening the real station data grades the decision in public: Beat, Tied, or Missed.**

### The 15-second pitch
*"Delhi has two smogs: smoke in the morning, ozone at midday. Your child's PE period sits in one of them. Right Hour PE picks the cleaner hour the night before, and at 5 pm the city's own air monitors grade us. Even when we're wrong."*

---

## 2. Why this is winner-shaped

### 2A. The software-only version of the winners' on-camera moment
Suraksha's watch drop worked because (1) the trigger came from outside the team's control, (2) the system answered unscripted, and (3) an independent measurement checked the result. Right Hour PE does the same in software:
1. **A timestamped prediction** at 20:00: "PE at 10:40 beats 8:20 and beats the poster".
2. **A human acts** on a real phone (the principal taps हाँ, the teacher's phone buzzes).
3. **Reality grades it:** at 17:00, **measured CPCB station data the team does not control** produces a Beat / Tied / Missed receipt that links to the public readings.

The air does not need to be dramatic during hack week. It only needs to give the grade.

### 2B. Scored against the playbook filter
| Test | Right Hour PE |
|---|---|
| P1: person, hour, place | A Delhi school principal, 20:00 the night before, school near the DTU/Mundka stations |
| P2: on-camera event | Real phone buzz → tap → teacher's phone → 17:00 receipt over the *measured* curve, from real hack-week days |
| P3: closed loop with human ack | Principal approves (Step Functions task token) → teacher notified → measured grading → station confidence updated |
| P4: deterministic truth | Breath Score from CPCB AQI sub-index formulas + measured data + GRAP rules. Bedrock writes words only |
| P5: each AWS service has a reason | §7 |
| P6: degrade loudly | "AI बंद" badge, "station data stale" banner, gaps flagged and never interpolated, misses in red |
| P7: persona-native UI | Principal: one Hindi sentence + one button. Teacher: class, period, indoor plan. Judge view separate |
| P8: built to run | CDK, unit-tested pure functions, replay mode, health endpoint |
| P10: coined names | **Two-Peak Problem** · **Poster Test** · **Hawa Hold** · **Proof of Breath** |

### 2C. What we reuse from Saaf Twin (pattern, not copy)
| Saaf Twin (hardware) | Right Hour PE (software) |
|---|---|
| IEC 61724-1 soiling ratio is the judge | **Breath Score** (CPCB AQI sub-index formulas) is the judge |
| **Smog Hold**: "don't wash, it's the air" | **Hawa Hold**: "keep PE indoors tomorrow", with the reason |
| **Proof of Wipe**: the panel verifies the cleaning; the ticket reopens if not | **Proof of Breath**: measured station air grades the decision; **Missed** is shown in red and lowers confidence |
| Vendor obliged by the 5-yr clause | Principal acting under existing DoE/CAQM outdoor-activity advisories (compliance, not advice) |
| Honest ₹ numbers | Honest exposure numbers ("station air, not lungs"; share of daily dose) |

### 2D. What we learned from each First Commit winner
| Winner | Pattern | Where it shows up |
|---|---|---|
| **Suraksha (R1)** | Outside trigger, real phone, human ack via `waitForTaskToken`, warm vernacular UI for one persona, role switcher | Real hack-week air; principal's tap resolves a task token; Hindi-first principal screen; Principal / Teacher / Judge switcher |
| **Beacon (R2)** | Deterministic sources before the LLM; verification is a loop; a "don't act" concept; honest lesson; "judge in 90 s" | Breath Score before Bedrock; Proof of Breath grades every decision; Hawa Hold; misses shown; `/judge` page |
| **CampusEvac (R3)** | Two roles choreograph the demo; AWS limits turned into features; CDK | Principal decides → teacher acts; India SMS/Connect limits → web push + POST-confirm email by design; CDK |
| **HaqCheck (ours, 20/30)** | Lost on showing | Video is product + receipts; loop ends in *measured* grading; Bedrock pre-tested and fails loudly; persona UI |

---

## 3. Evidence base (checked Oct 4, 2026)
| Claim | Evidence | Source |
|---|---|---|
| Delhi PM2.5 daily cycle | Max ~midnight, **local max 08:00–10:00**, **min 15:00–17:00**. Nov 6 am vs 6 pm station gap ≈ 400 vs 45 µg/m³. Driven by a night boundary layer <200 m and wind <1 m/s | Sci. Reports 2020 (doi:10.1038/s41598-020-70179-8); EGU2019-2090; Mongabay India 2026 |
| School timing | Normal (summer) opening **7:30–8:00**; winter/cold-spell timings ≥9:00 (switch date varies) | Careers360; Business Standard |
| Exercise multiplies intake | Inhalation **×2.5 light, ×4.5 moderate, ×8.5 high** vs sedentary (children) | US EPA Exposure Factors Handbook via WA DOH 2023 |
| All-or-nothing policy | GRAP III/IV: Classes ≤V online, VI–XI hybrid, closures up to 15 days | CEEW; NewsOnAir |
| Schools ignore orders | SC: outdoor sports in Nov–Dec = "gas chamber"; CAQM found schools continuing outdoor sports | Tribune; Gulf News |
| Existing tools are city-level | SAFAR: 1–3 day forecast + advisory; SAMEER: hourly AQI per city + complaints | drishtiias; App Store |
| Ozone standard | 8-h **100 µg/m³**, 1-h **180 µg/m³** (NAAQS). CSE: summer exceedances widespread; CPCB portal caps O₃ display at 200 | CSE ozone analyses |
| Model caveat | Models (incl. CAMS-class) **overestimate Indian surface O₃ by ~1–30 ppbv** | ACP 2019 vol. 19 p. 6437; Sci. Reports 2023 |
| Data access | Open-Meteo Air Quality (CAMS) free, no key, hourly, Delhi works (curled live). OpenAQ v3 free key, ~87 Delhi locations. data.gov.in CPCB = latest snapshot (needs a poller) | open-meteo.com; docs.openaq.org; data.gov.in |

### ⚠️ SUPERSEDED by K1 (see `research/03-k1-measured-backtest.md`): the table below is from the CAMS **model** and overstated midday ozone ~5×. Measured data shows the poster is wrong on only ~19% of days.
### Earlier backtest (CAMS **model** data, DTU grid cell, Oct–Dec 2025, school window 08:00–13:59, 92 days)
| Finding | Number |
|---|---|
| PM2.5 alone: best school hour at/after 11:00 | 95% of days |
| PM2.5 alone: fixed "PE at 13:00" vs daily optimum | only **1.2%** worse, so **for PM2.5 alone a poster is enough** |
| Midday ozone (model) | O₃ at 13:00 > 100 µg/m³ on ~every day Oct–Dec (model; likely biased high) |
| **Combined PM2.5 + O₃ (max sub-index)**: best hour across days | 08:00 ×11 · 09:00 ×15 · **10:00 ×27** · 11:00 ×21 · 12:00 ×7 · 13:00 ×11, so **it moves** |
| Best fixed poster on the combined metric (10:00) | still >25 AQI points worse than the day's best on **49% of days** |
| Heat | Early-Oct feels-like at 13:00 averages ~32 °C; 5 days >35 °C in Oct 2025 |

**What this means:** the product only beats a poster because of the **Two-Peak Problem** (PM2.5 + O₃ + heat). If measured O₃ is much lower than the model, the honest pitch shrinks to "poster + exceptions" (§10 K1).

### Honest impact wording (use these and nothing stronger)
- "Station air, not lungs." All numbers are ambient air at the nearest CPCB stations (median of 3).
- Per decision: "about **X%** lower exposure during the PE period, about **Y%** of the child's whole-day intake". A 40-min PE period at ×4.5 breathing is ~3 of ~26 resting-hour-equivalents, so a 40% PE-period cut ≈ **4–5% of daily dose**.
- Hawa Hold: "indoors is ~0.7–1.0× outdoor for PM2.5 (not clean), but much lower for ozone". Never call indoors "safe".
- No health-outcome claims.

---

## 4. Users and roles
| Role | Who | Their one job | Surface |
|---|---|---|---|
| **Principal** (decider) | Head of a Delhi school (govt or private), Hindi or English | At 20:00, tap **हाँ / नहीं** on one suggestion | PWA with web push (Android Chrome); backup SES email → confirm page |
| **PE teacher** (actor) | Runs the class | See *which class, which period, indoor plan if Hold*; tap "done" after PE (optional) | PWA push + one screen |
| **Parents** (informed) | Class WhatsApp group | Read one forwarded line | Copy-to-WhatsApp button (no API) |
| **Judge / DoE reviewer** | Hackathon judge; later a DoE district officer | See the evidence: decisions, receipts, misses, backtest | `/audit`, `/judge` |

Adoption path (honest): **government schools** move through DoE circulars, so the ledger of receipts is the evidence a circular needs. **Private schools** opt in directly.

---

## 5. The solution

### 5.1 Inputs (all software, all free)
| Input | Source | Use |
|---|---|---|
| Hourly **forecast** PM2.5, O₃ (tomorrow) | Open-Meteo Air Quality (CAMS), no key | Tomorrow's slot scores |
| Hourly **measured** PM2.5, O₃ (last 7 days + today) | OpenAQ v3 (free key) for the **3 nearest CPCB stations**; fallback: data.gov.in hourly poller into DynamoDB | 7-day measured profile (primary planning input) + **Proof of Breath** grading |
| Hourly feels-like temperature (tomorrow) | Open-Meteo forecast API, no key | Heat cap |
| GRAP stage | Operator sets it in SSM Parameter Store from the CAQM order | Hard rule |
| Timetable | Principal enters PE periods per class + ground capacity at setup (5 minutes) | Candidate slots |

### 5.2 The Breath Score (deterministic, unit-tested, labelled "hourly proxy, not official AQI")
For each hour *h*:
`BS(h) = max( SubIndex_PM2.5(C_PM(h)), SubIndex_O3(C_O3(h)) )`
using CPCB AQI breakpoints:
- PM2.5: 0–30→0–50 · 31–60→51–100 · 61–90→101–200 · 91–120→201–300 · 121–250→301–400 · >250→401–500
- O₃ (8-h scale applied hourly as a proxy): 0–50→0–50 · 51–100→51–100 · 101–168→101–200 · 169–208→201–300 · 209–748→301–400

Planning value per slot = a blend: **measured 7-day median profile for that hour (primary)**, adjusted by tomorrow's **CAMS forecast shape (tiebreak)**. The exact blend is fixed after K3 (§10).

### 5.3 The decision rule (evaluated at 20:00 for tomorrow, re-checked at 06:15)
For each class with PE tomorrow, the candidate slots are **that class's same-day periods** (a swap within the class, so ground capacity is unchanged):
1. **Hawa Hold** if GRAP stage is III or IV, **or** every candidate slot has BS > 200. Message: "keep PE indoors tomorrow", with the reason and an indoor activity plan, citing the DoE/CAQM outdoor-activity advisories.
2. Drop any slot with feels-like ≥ 35 °C (heat cap).
3. Let *best* = the remaining slot with the lowest BS. **Recommend the swap only if** `BS(current) − BS(best) ≥ 25` **and** `BS(poster) − BS(best) ≥ 25`, where *poster* = the best *fixed* slot from the measured backtest (currently 10:00 on model data, finalised after K1).
4. Otherwise, **"keep your timetable"**, which is also a valid, shown answer.
5. **No answer by 06:45:** Hawa Hold stands if rule 1 fired; otherwise the timetable stays. Nothing is silently changed.
6. **06:15 re-check:** recompute with the latest data. Push again **only if the decision changed**.

Every number shown comes from this code. Bedrock never computes, ranks or decides.

### 5.4 Closed loop (Step Functions Standard)
```
20:00 Scheduler → Planner Lambda → decision stored (DynamoDB)
   ├─ "keep timetable" → info push, END
   └─ swap or Hawa Hold → Step Functions:
        SendSuggestion (web push + SES backup; link = short id → confirm page → POST)
        WAIT waitForTaskToken (timeout 06:45)
           ├─ हाँ  → NotifyTeacher (push: class, period, indoor plan if Hold) → copy-line for parents
           ├─ नहीं → record "declined" (still graded at 17:00 against the original slot)
           └─ timeout → default rule (5.3 step 5), recorded
06:15 Scheduler → Re-check Lambda → push only if changed
17:00 Scheduler → Proof-of-Breath Lambda → receipt → push + ledger
```

### 5.5 Proof of Breath (the hero)
At 17:00, using **measured** CPCB PM2.5 + O₃ only (median of the 3 nearest stations; any missing hour is flagged and never interpolated):
- Score three slots: **chosen**, **original**, **poster**.
- Verdict:
  - **Beat the poster** (chosen ≥ 25 better than poster and original)
  - **Tied the poster** (|diff| < 25: "the poster would have done")
  - **Missed** (chosen worse than original or poster: "today the swap didn't help"), **shown in red**. Each Missed lowers that station's **confidence score**, which raises the recommendation threshold.
- Wording: "Station air, not lungs. During PE: ~X% lower exposure than the original slot (~Y% of today's total intake)."
- Links to the public readings (OpenAQ location pages).
- The ledger keeps every receipt. The headline counts are Beats, Ties and Misses, plus Hawa Hold days.

### 5.6 What Bedrock does / never does
| Does | Never |
|---|---|
| Writes the principal's one sentence (Hindi/English), the teacher's line, the parent copy-line, the receipt sentence | Computes scores, picks slots, grades receipts, changes numbers |

Number guard: every digit in the template must appear in the rewrite, otherwise the template is used. Outage → **"AI बंद"** badge + template. Model availability in ap-south-1 is tested before Oct 8 (cross-region profile if needed).

### 5.7 Replay mode (honest)
A clearly labelled **"Replay: [date], 2025"** mode re-runs a real past day (e.g. a severe November 2025 morning) through the same code with that day's archived data. It is used to show Hawa Hold and big swings if hack week is mild. It is always labelled on screen and in the video.

---

## 6. Website and UI (inspired by the top-3 winners' sites; pattern, not copy)

### 6.1 What the winners' sites shared (observed) → what we do
| Winner pattern | Right Hour PE |
|---|---|
| Warm light background (all 3; HaqCheck was dark) | Warm "school notebook" cream with faint ruled lines |
| Huge headline with one twist phrase in accent | **"Delhi has two smogs. *We pick the hour between them.*"** |
| Eyebrow tag | `NOT ANOTHER AQI APP · A TIMETABLE THE AIR GRADES` |
| Live product card in the hero | A **live receipt card**: yesterday's Beat/Tied/Missed with mini curve, from real data |
| Two CTAs | **[See tomorrow's plan →]** (demo school) · **[Watch the film]** |
| Tech chips / "Built on" strip | `EventBridge Scheduler · Step Functions · Bedrock · CDK · CPCB data` |
| "How it works" in 3 | **Plan** (20:00) · **Act** (one tap) · **Grade** (17:00, measured) |
| Live numbers from the deployment (Beacon) | **Beats · Ties · Misses · Hawa Hold days**. Misses shown proudly |
| FAQ for doubters (Beacon) | "Why not just a poster?" (the Poster Test) · "Isn't indoors safe?" · "Is the AI deciding?" · "What if data is missing?" · "Station air vs my school's air?" |
| Persona surfaces + "Viewing as" (Suraksha) | Principal / Teacher / Judge switcher |
| "How to judge this in 90 seconds" (Beacon) | `/judge`: replay buttons + live school + backtest |
| Footer Run it / Trust (Beacon) | Product · Run it (README, CDK) · Trust (method, data sources, limits, AI disclosure) · Project |

### 6.2 Site map
| Route | Who | Purpose |
|---|---|---|
| `/` | Judge, public | Landing (story + live receipt + Poster Test) |
| `/p` | Principal | Tomorrow's decision: one sentence + **हाँ / नहीं** (or "keep timetable" info) |
| `/t` | PE teacher | Today: class, period, Hawa Hold indoor plan; "done" button |
| `/r/:date` | Anyone | One receipt: three slots on the **measured** curve, verdict, public-data links |
| `/ledger` | Principal / judge | All receipts: Beats / Ties / Misses, station confidence |
| `/setup` | Principal | 5-minute setup: school → nearest stations auto-picked → PE periods per class → language |
| `/judge` | Judge | 90-second path: live school, labelled replays, backtest numbers |
| `/how` | Anyone | Method: Two-Peak Problem, Breath Score formula, Poster Test, limits, sources |

### 6.3 Screens (the essentials)
- **Principal `/p` (20:00):**
  - Big Hindi line: "कल 7B का PE **10:40** पर रखें: सुबह धुआँ ज़्यादा है।" (English toggle)
  - Two big buttons, **हाँ** / **नहीं**.
  - A small "why" row: two tiny bars (8:20 vs 10:40) and the poster mark.
  - A health strip: `डेटा ✓ 22 मिनट पहले · AI ✓`.
- **Hawa Hold variant:** slate-red banner "कल PE अंदर" + reason ("GRAP-III" or "हर घंटा 200 से ऊपर") + indoor plan link.
- **Teacher `/t`:** card "**7B · Period 3 (10:40)** · मैदान" or "**Hawa Hold** · अंदर: योग / स्ट्रेचिंग प्लान", plus a "done" button.
- **Receipt `/r/:date`:**
  - The measured curve for the day.
  - Three markers: original (grey), poster (dashed), chosen (ink).
  - A big verdict stamp: **Beat** (green) / **Tied** (sky) / **Missed** (red).
  - Wording "station air, not lungs".
  - Links to OpenAQ pages.

### 6.4 Visual language (our own identity: school notebook, morning smoke vs midday ozone)
| Token | Value | Use |
|---|---|---|
| `--paper` | `#FBF7EE` notebook cream (+ faint 28px ruled lines) | Background |
| `--ink` | `#1F2A44` school-ink navy | Text, primary buttons |
| `--chalk` | `#2E7D5B` blackboard green | **Beat**, "clean slot" |
| `--smoke` | `#8A6E4B` morning-smoke brown | PM2.5 peak shading |
| `--ozone` | `#6C5BA8` midday-ozone violet | O₃ peak shading |
| `--sky` | `#4A90C2` | **Tied** |
| `--alarm` | `#C8382E` | **Missed**, Hawa Hold, "AI बंद", stale-data banner |
| Display font | **Fraunces** (Latin) + **Tiro Devanagari Hindi** | Headlines, verdict stamps |
| Body font | **Hind** (Latin + Devanagari) | Everything else |
| Mono | **JetBrains Mono**, `/how` formulas + `/judge` only | Never on principal/teacher screens |

- **Signature visual:** the **two-hump day**: a smoke-brown hump in the morning and an ozone-violet hump at midday, with the chosen slot as an ink mark in the valley. It appears on the landing page, the receipts and the video.
- **Type scale:** principal sentence ≥28 px on mobile; buttons ≥56 px tall; body ≥18 px.
- **Motion:** one meaningful animation, the verdict stamp landing on the receipt.
- **Errors visible:** stale station data → red banner "स्टेशन डेटा 3 घंटे पुराना". Missing hours drawn as gaps.
- **Accessibility:** WCAG AA on cream, `lang="hi"`, never colour-only meaning (stamp text + icon), large tap targets.

### 6.5 Banned (HaqCheck lessons)
- Dark dev aesthetic on user screens.
- Jargon on principal/teacher screens (no "CAMS", "sub-index", "token", "Lambda").
- English-only when Hindi is selected.
- A map or a big AQI dial as the first frame (that files us with the dashboards).
- Hard-coded "live" numbers.
- Any fallback that looks like a real result.

---

## 7. AWS architecture (one reason per service)
| Service | Job | Why this, not the alternative |
|---|---|---|
| **Amazon EventBridge Scheduler** (tz `Asia/Kolkata`) | 20:00 plan, 06:15 re-check, 17:00 grading, hourly station poll | Timezone-aware schedules with no cron server |
| **AWS Lambda** (Python) | Planner, re-check, receipt maker, poller, API handlers | Pure, unit-testable functions; scale to zero |
| **AWS Step Functions (Standard)** | Suggestion → `waitForTaskToken` until 06:45 → teacher notify / default | Waits hours for a human at no compute cost; the execution graph is demo evidence. Express can't hold task tokens that long |
| **Amazon API Gateway (HTTP)** | Confirm-page **POST** (`SendTaskSuccess`), PWA API, push subscription | POST-only confirm defeats email link-scanner auto-clicks |
| **Amazon DynamoDB** | Schools, timetables, decisions, receipts, station cache, push subscriptions, short-id → task-token map | Pay-per-request single table; tokens never appear in URLs |
| **AWS Systems Manager Parameter Store** | GRAP stage (set from the CAQM order), thresholds | A one-line operator update without a redeploy |
| **Amazon SES** (sandbox, verified recipients) | Backup channel (suggestion email → confirm page) + receipt email | No India SMS (DLT) and no Connect outbound for a new account |
| **AWS Amplify Hosting** | PWA (principal / teacher / receipts / judge) with web push (VAPID) | Git-push deploys, HTTPS needed for push + service worker |
| **Amazon Bedrock** | Hindi/English wording only (number-guarded) | Language quality, strictly after the decision |
| **Amazon CloudWatch** | Alarms: station data stale, planner errors; `/health/deep` | Degrade loudly |
| **AWS Secrets Manager** | OpenAQ key, VAPID private key | No secrets in code or env files |
| **AWS CDK** | Whole stack in one command | Reproducible for judges |

```
EventBridge Scheduler ──▶ Poller λ (hourly) ──▶ DynamoDB (measured cache) ◀── OpenAQ / data.gov.in
        │                                              ▲
        ├─20:00─▶ Planner λ ── Breath Score ── SSM (GRAP) ── Open-Meteo (CAMS, temp)
        │            └─ swap/Hold ─▶ Step Functions ─▶ web push + SES ─▶ Principal PWA (Amplify)
        │                              ▲ waitForTaskToken          │ POST /confirm (API GW)
        │                              └───────── SendTaskSuccess ◀┘ → Teacher push
        ├─06:15─▶ Re-check λ (push only if changed)
        └─17:00─▶ Proof-of-Breath λ ─▶ receipt (DynamoDB) ─▶ push + /r/:date
Bedrock: words only · CloudWatch: alarms + /health/deep · Secrets Manager · CDK: everything
```
**Estimated weekend cost:** free tier / a few dollars (Lambda, Step Functions transitions, Bedrock tokens, SES).

---

## 8. Scope
**In (must work on camera):**
- One real school near the DTU/Mundka stations, 2–3 classes, PE slots.
- 20:00 decision → push → principal tap → teacher push.
- 06:15 re-check.
- 17:00 measured Proof of Breath (Beat/Tied/Missed).
- Hawa Hold.
- Ledger; labelled replay.
- `/judge`; deployed on AWS.

**Out (one line in the video at most):**
- Amazon Connect calls (India outbound impossible), SMS (DLT).
- WhatsApp API (stretch only, if Meta approves by Oct 9).
- Citywide map/ledger (one backtest sentence only).
- Multiple schools, timetable OCR, parent app.
- Roadside micro-modelling, dose multipliers (they cancel for the same activity), health-outcome claims.

---

## 9. Before the clock (allowed: accounts, keys, research/analysis, recruiting; no project code)
- [ ] Free **OpenAQ** key. Confirm the 3 stations nearest the chosen school return hourly PM2.5 **and** O₃ with <6 h lag.
- [ ] **data.gov.in** API key (fallback poller).
- [ ] **Bedrock**: enable model access (ap-south-1 or cross-region profile); make one test call in Hindi.
- [ ] **SES**: verify every demo inbox.
- [ ] CDK bootstrap in ap-south-1; Node 20+, Python 3.12.
- [ ] **Recruit one real principal or PE teacher** (and a ground) willing to tap on film, e.g. a school near DTU for the Oct 10 build day.
- [ ] Optional: apply for **Meta WhatsApp Business** + one utility template (stretch only).
- [ ] Storyboard the video (§12).

## 10. Kill-tests (before Oct 8; analysis only)
| # | Assumption | Test | If it fails |
|---|---|---|---|
| **K1** | **The Two-Peak Problem is real in *measured* data** | Re-run the backtest (§3) on **measured CPCB PM2.5 + O₃** (OpenAQ) for DTU/Mundka/Narela, Oct–Dec 2024 and 2025, with the Breath Score. Measure: on what % of days does the best *fixed* slot lose by ≥25 points? | If **<~20% of days**, pivot the pitch to **"Poster + exceptions"**: the app is silent on normal days and fires only on Hawa Hold / anomaly days, and Proof of Breath becomes the ledger. Expect podium, not win |
| K2 | Measured data arrives fast enough | OpenAQ hourly lag for the 3 stations <6 h | Build the data.gov.in hourly poller as the **first** task on Oct 8. Receipts before the poller started are marked "no data" |
| K3 | The forecast beats the poster | Score archived CAMS day-ahead picks against measured best slots | If not better, the **7-day measured profile leads** and CAMS only breaks ties |
| K4 | A real human taps on film | Recruit now | Use a teammate, **visibly labelled "role-played"** |

## 11. Four-day build plan (repo created after the clock; small frequent commits)
| Day | Goal |
|---|---|
| **Thu Oct 8** | Repo + CDK skeleton deployed. **Station poller running from the first hour** (it builds the measured history). Breath Score + decision rule as pure functions with tests. Ugly `/p` showing tomorrow's decision |
| **Fri Oct 9** | Step Functions loop: push + SES confirm page (POST) → task token → teacher push → default at timeout. 06:15 re-check. 17:00 Proof of Breath + `/r/:date`. Bedrock wording + "AI बंद". First real receipt for Oct 8–9 |
| **Sat Oct 10 (DTU)** | Persona UI polish (Hindi, notebook theme, two-hump visual), ledger, `/judge`, replay. **Film the real tap** (20:00 Fri / 06:15 Sat) and the 17:00 receipt |
| **Sun Oct 11 AM** | Freeze. Video ≤3:00 with English captions. README (method, why each service, limits, AI-tools disclosure). Builder Center blog. Submit early; check the YouTube link signed-out |

## 12. Demo video storyboard (≤3:00, English captions)
| Time | Beat | On screen |
|---|---|---|
| 0:00–0:12 | **Hook:** "Delhi has two smogs. Smoke in the morning, ozone at midday. Your child's PE is in one of them." | Kids at 8:20 under hazy sky → the two-hump curve draws in |
| 0:12–0:30 | **The Poster Test:** "Why not just move PE later? Because the best hour moves. On our backtest a fixed hour was wrong by 25+ points on N% of days." (number from K1) | Poster crossed out; the hump shifting across days |
| 0:30–1:05 | **Plan → Act:** 20:00 real phone buzz → principal reads one Hindi line → taps **हाँ** → teacher's phone buzzes "7B · Period 3 · मैदान" | Real phones, real person (K4) |
| 1:05–1:40 | **Grade:** 17:00 receipt over the *measured* curve → **Beat** stamp; then the next day: **Missed** in red, "today the swap didn't help", confidence drops | Live hack-week receipts + OpenAQ link |
| 1:40–2:05 | **Hawa Hold:** labelled replay of a severe Nov 2025 day → "कल PE अंदर" + indoor plan, "indoors isn't clean air, but ozone is lower" | Replay label visible |
| 2:05–2:40 | **AWS with reasons:** Scheduler → Planner Lambda → Step Functions waiting on the principal's tap (real execution graph) → POST confirm → Proof-of-Breath Lambda → Bedrock writes words only → CDK | Console, ~5 s each |
| 2:40–3:00 | **Honest close:** "Station air, not lungs. About 4–5% of a child's daily intake, every school day, graded in public." Lesson learned. **Right Hour PE.** | Ledger counts (Beats/Ties/Misses) |

## 13. Success criteria (definition of done)
- [ ] At least **2 real hack-week days** with a decision at 20:00, a human tap and a **measured** 17:00 receipt
- [ ] The ledger shows **at least one Tied or Missed**, displayed honestly
- [ ] Breath Score + decision rule unit-tested (Hawa Hold, heat cap, ≥25-point rule, poster rule, default at timeout)
- [ ] Confirm links are POST via a page; no raw task tokens in URLs
- [ ] Missing station hours appear as gaps + a banner; nothing interpolated silently
- [ ] Bedrock outage → "AI बंद" + templates (tested by revoking the permission)
- [ ] Principal screen: one sentence + ≤2 buttons, full Hindi with English toggle
- [ ] Replay mode always labelled
- [ ] Public Amplify URL, public repo, CDK deploy, AI-tools disclosure; video ≤3:00

## 14. Risks
| Risk | Mitigation |
|---|---|
| Measured O₃ much lower than the model, so the Two-Peak case weakens | K1 before the clock; "Poster + exceptions" pivot ready |
| Hack week is mild (small differences) | Ties are honest results; labelled replay for big days |
| Station gaps / abnormal values | Median of 3 stations, gaps flagged, CloudWatch stale alarm |
| No real principal or teacher on film | Recruit now; labelled role-play fallback |
| Web push quirks (iOS needs home-screen install) | Demo on Android Chrome; SES backup channel |
| Judges think "AQI app" | Never open with a map or dial; open with kids + the two-hump curve + the Poster Test |
| Station air ≠ schoolyard air | Say "station air, not lungs" everywhere; roadside schools flagged as a limit |

## 15. Writeup / blog skeleton (AWS Builder Center)
1. Delhi's two smogs.
2. Why a poster isn't enough (the Poster Test + backtest).
3. The Breath Score (and why AI isn't the judge).
4. A prediction graded by reality: Proof of Breath.
5. AWS: Scheduler + task tokens for human waits; why no SMS or calls in India.
6. Our misses.
7. Honest numbers.
8. What's next (more schools, DoE evidence, WhatsApp).

---

### Sources
- Sci. Reports 2020 doi:10.1038/s41598-020-70179-8
- EGU2019-2090 · EGU22-9142
- Mongabay India (Mar 2026)
- Careers360 / Business Standard (Delhi school timings)
- WA DOH 2023, citing the US EPA Exposure Factors Handbook
- CEEW (school disruption) · NewsOnAir (hybrid classes)
- Tribune / Gulf News (SC & CAQM on outdoor sports)
- drishtiias / App Store (SAFAR, SAMEER)
- cseindia.org (ozone analyses)
- ACP 19, 6437 (2019) · Sci. Reports 2023 s41598-023-34330-5 (model O₃ bias)
- open-meteo.com (Air Quality + Archive APIs)
- docs.openaq.org (v3 key)
- data.gov.in (CPCB real-time AQI)
- AWS re:Post (Amazon Connect India outbound limits)
- Our backtest: Open-Meteo CAMS archive, DTU grid cell, Oct–Dec 2025 (model data; to be redone on measured data)
