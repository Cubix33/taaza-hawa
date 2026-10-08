# Saaf Twin: *Dhool ya Dhuaan?* (Dust or Smog? Know before you wash.)

> **ARCHIVED (Oct 4, 2026):** the user switched to a **software-only** constraint. This hardware idea is kept as inspiration. Current problem statement: `PROBLEM_STATEMENT.md`.

> **Track:** Waste & Energy (*"power it cleaner"*) · **Event:** WeMakeDevs × AWS Environmental Hacks, Oct 8–11 2026
> **Status:** Problem statement, decided by LLM Council on Oct 4, 2026 (`council/council-verdict.md`). **No project code exists. Build starts when the clock starts.**
> **Implementation plan:** `superpowers/plans/2026-10-04-saaf-twin.md`
> **Inputs:** `WINNER_PLAYBOOK.md` · `research/01-idea-research-dossier.md` · `council/round1-anonymized.md` · `council/round2-deanonymized-and-reviews.md`

---

## 1. The problem statement (one paragraph)

India put rooftop solar on **50 lakh homes** in two years under PM Surya Ghar, and Delhi opened its own subsidy portal on Sept 21, 2026. Every October these Delhi roofs start losing output, and their owners cannot tell why. Sometimes it is **dust and grime on the glass**: soiling in Delhi costs 0.3–0.6% a day and ~25% after three uncleaned weeks, and the installing vendor is *legally obliged to clean it for free for 5 years*. Sometimes it is **smog in the air**: haze cut Delhi's PV insolation by 11.5% (Peters et al., 2018), and washing the panels then wastes 20–60 litres of water and achieves nothing. The industry says **99.99% of owners stop monitoring after installation**, so in practice nobody makes the call: free cleanings go unclaimed, water is wasted on smog days, and vendor visits are taken on trust. **Saaf Twin is a ₹1,500 clip-on twin-cell sensor plus an AWS workflow that makes the call deterministically. It summons the vendor who owes the cleaning, and it closes the job only when the panel itself proves it is clean again.**

### One-sentence pitch (for the first 15 seconds)
*"It's 8 am in Dwarka. Sharma ji's solar made 25 units in March and 14 today. He's about to pay ₹1,000 and pour 40 litres of water on his roof. Saaf Twin tells him whether that water will help, and if it will, who owes him the cleaning."*

---

## 2. Why this is a winner-shaped problem (scored against the playbook filter)

| Playbook test | How Saaf Twin passes |
|---|---|
| **P1: one person, one hour, one place** | Sharma ji (homeowner, 60s, Hindi-first), 8 am, Dwarka rooftop, late October |
| **P2: on-camera event** | Even dust over the test panel → phone buzzes "Dhool hai". A frosted sheet over *both* → "Dhuaan hai, saaf mat karo". The technician wipes → the line climbs back → job auto-closes. Every beat is physical, repeatable, takes seconds |
| **P3: closed loop with human ack** | Owner taps *Vendor ko bulao* → vendor technician taps *Saaf kar diya* → **the panel verifies** → receipt. No response → escalation |
| **P4: deterministic truth, AI not the judge** | IEC 61724-1 §9.4 soiling ratio (short-circuit current of a clean vs a test device). Physics, not a model. Bedrock only writes the Hindi/English text |
| **P5: every AWS service has a reason** | §7, one reason per service |
| **P6: degrade loudly** | "AI बंद" badge + labelled templates. Sensor-offline banner. "Demo light" mode banner when on a lamp |
| **P7: persona-native UI** | Owner screen = one Hindi sentence + one button. Technician screen = one button. Judge/audit screen is separate |
| **P8: built to run** | CDK one-command deploy, tests on the classifier, `/health/deep`, real console shown in the video |
| **P10: coined names** | **Saaf Twin** (the device) · **Smog Hold** (the system tells you *not* to act) · **Proof of Wipe** (a job closes on physics, not on someone's word) |

---

## 2A. Proposed solution at a glance

**Saaf Twin = a ₹1,500 clip-on sensor + an AWS serverless workflow.**
- The sensor decides *dust vs smog* by physics.
- The workflow makes the vendor who owes the cleaning actually do it.
- The job closes only when the panel proves it is clean.

| Step | What happens | Built with |
|---|---|---|
| 1. **Sense** | Two mini panels on the roof rail: one exposed, one under a servo shutter. Both report short-circuit current every 15 min | ESP32 + 2× INA219 → **AWS IoT Core** (MQTT, per-device cert) |
| 2. **Decide** | Soiling ratio + clear-sky check → *Saaf / Smog Hold / Watch / Dhool* (IEC 61724-1, a pure function) | **IoT Rule → Lambda** classifier, results in **DynamoDB** |
| 3. **Tell** | Owner gets ONE Hindi sentence (+ English) and at most ONE button | **Amplify** PWA; text worded by **Bedrock** (template fallback + "AI बंद" badge) |
| 4. **Act** | Owner taps *Vendor ko bulao* → evidence-backed ticket to the vendor citing the free 5-yr O&M clause | **Step Functions** → **SES** email |
| 5. **Wait for a human** | Workflow pauses until the technician taps *Saaf kar diya* | Step Functions **`waitForTaskToken`** (+ task timeout) via **API Gateway** |
| 6. **Verify** | **Proof of Wipe**: closes only if SR ≥ 0.97 holds; otherwise the ticket reopens, loudly | Step Functions verify loop reading DynamoDB |
| 7. **Escalate** | No response in the helpline window (or 2 failed wipes) → Bedrock-drafted complaint, owner approves in one tap | Step Functions **task timeout** → escalation state; **EventBridge Scheduler** runs the daily noon-block summary |
| 8. **Prove & run** | Audit page, `/health/deep`, alarms, one-command deploy | **CloudWatch**, **AWS CDK** |

**Smog Hold** is the other half: when both panels dim equally, the system says *don't wash*, and logs the 20–60 L of water saved.

---

## 2B. How it scores on the hackathon's own judging criteria

| Official criterion (wemakedevs.org/aws/env) | What judges are asked | Our answer |
|---|---|---|
| **1. Idea and Impact** | "Does it fix a real environmental problem? What changes for the people living with it? A small problem solved well beats a big one solved vaguely." | Narrow and real: *dust or smog?* on 50 lakh new rooftops. What changes for Sharma ji: free cleaning claimed (~₹600/month recovered at 25% soiling), no water wasted on smog days (20–60 L per avoided wash), and vendor visits verified. All honest, sourced numbers (§3) |
| **2. Built on AWS** | "Using an AWS open-source project or AWS services is mandatory." Local and deployed scored with the same care | Deployed ("Ship It" style), 11 services each with a one-line reason (§7). AWS does the real work: IoT ingest, human-in-the-loop wait (`waitForTaskToken` + timeout), daily summary (EventBridge Scheduler), language (Bedrock). Plus **AWS CDK** (AWS open source) for the whole stack |
| **3. Design and usability** | "Would someone who isn't on your team know what to do with it? … built for where they are." | Owner screen = one Hindi word + one sentence + ≤1 button. Technician screen = one button. Large type, icons, English toggle, 3-step onboarding (clip → scan QR → enter vendor). Developer evidence lives only on `/audit` |
| **4. Execution** | "Does it work? Not perfect, not polished. Working. One feature that runs beats five that almost do." | One loop, end to end, live: sense → decide → ticket → ack → **panel-verified close / reopen**. Everything else is cut (§8). Kill-tests run *before* the clock (§10) so the core physics is proven |
| **5. Demo video** | "Three minutes … what it does, who it is for, and where AWS fits. There is no live demo." | Storyboard in §12: hook in 18 s, ~65% live product, the real Step Functions execution from the same run, English captions, ≤3:00 |

Hackathon rules also met:
- Repo created after the clock.
- AI tools listed in the README.
- Public repo + writeup + YouTube (public/unlisted, checked signed-out).
- Student verification done.
- AWS Builder Center blog for the AirPods prize (§15).

---

## 2C. What we learned from each First Commit winner, and where it shows up here (pattern, not copy)

| Winner | What made it win | How Saaf Twin uses the *pattern* (different problem, different domain) |
|---|---|---|
| **Suraksha (Rank 1)**: watch drop → phone call → guard presses 1 | A **physical event on camera** that crosses into the cloud and back; **Step Functions `waitForTaskToken`** waits for a real human; warm vernacular UI for one persona (Amma); multiple role surfaces + a "Viewing as" switcher | Dust/frosted-sheet on a real panel is our physical event. The technician's tap resolves a task token. Hindi-first owner UI for Sharma ji. Owner / Technician / Auditor role switcher |
| **Beacon (Rank 2)**: 3 AM alarm → "Approve fix 1" → verify loop → Sleep Contract | **Deterministic sources before the LLM** ("the model never guesses resource IDs"); **verification is a loop, not a boolean** (won't say "recovered" until checks pass); a coined concept (*Sleep Contract*) that also tells you when NOT to wake up; offline/degraded mode; "How to judge this in 90 s" link; one honest lesson at the end | IEC soiling ratio decides, and Bedrock only words it. **Proof of Wipe** refuses to close until SR ≥ 0.97 holds, and reopens if not. **Smog Hold** is our "don't act" concept. "AI बंद" badge + templates. Judge page + "lesson learned" close in the video |
| **CampusEvac (Rank 3)**: two-player evacuee/warden drill | **Two roles that choreograph the demo** (one triggers, one responds); a new AWS primitive used exactly as designed; turning an AWS limitation into a feature (SES sandbox "holding pen"); CDK one-command deploy | Owner triggers, technician responds: a natural two-role split screen. IoT Core + Step Functions + Scheduler each used for their designed purpose. SES sandbox handled with verified recipients, and SMS avoided by design (India DLT). CDK deploy |
| **HaqCheck (ours, 20/30)**, the anti-pattern | 0 s of product in video; loop ended at a verdict; Bedrock failed silently; dev-styled UI; AWS service stretched | Video is mostly live product; the loop ends in a *verified physical outcome*; Bedrock pre-tested and fails loudly; persona UI; every service used for what it's built for |

---

**Why not the classroom-air idea (C1)?** The council's decisive attack: during GRAP, "open the window" raises indoor PM2.5, so the loop disproves itself on camera, and no government rule arbitrates CO₂ vs PM. It is also the most-filmed shot in Indian air hackathons. Full reasoning in `council/council-verdict.md`.

---

## 3. Evidence base (all checked Oct 4, 2026)

| Claim | Number | Source |
|---|---|---|
| Rooftop solar scale | 50.06 lakh households (Jul 2026), ~16k installs/day | Deccan Herald, Swarajya |
| Delhi timing | Delhi PM Surya Ghar portal launched Sept 21 2026; up to ₹1.56 lakh subsidy for 3 kW | Outlook Business, Adda247 |
| Nobody monitors | "Nearly 99.99% of consumers stop monitoring their systems after installation" | ETV Bharat, Jul 2026 |
| **Vendor owes the cleaning** | "The solar vendor who installs the plant will be responsible for **cleaning of solar panels** and all-inclusive O&M for a period of **5 years**" | solar.delhi.gov.in (O&M procedure) |
| Vendor accountability | Free repair/maintenance ≥5 yrs, a helpline with a defined complaint timeline, and authorities may **de-register and penalise** vendors | REC guidelines via Renewable Watch, Nov 2024 |
| Haze loss | Delhi PV insolation −11.5% ± 1.5% (2016–17) from PM2.5; >$20M/yr loss for Delhi | Peters et al., *Energy Environ. Sci.* 2018, arXiv:1804.05249 |
| Soiling loss | 0.3–0.6%/day; ~25% after 3 weeks uncleaned; Dec–Jan has 7–14 days below 2 units/kW from irradiance alone ("not a fault") | Bridgeway Power (1,300 Delhi sites), Renewable Watch |
| Grime ≠ dust | Pollution grime "far more effective at blocking light than dust, and trickier to remove" | Arab News |
| Measurement standard | IEC 61724-1 §9.4: compare **Isc** of identical Clean vs Test devices; Isc ∝ irradiance | Kipp & Zonen, NRG Systems, Wikipedia (Soiling) |
| Water per wash | 7,000–20,000 L per MW per wash → **7–20 L/kW** → 20–60 L for 3 kW | CEEW via Dialogue Earth |
| Grid emissions | 0.727 tCO₂/MWh (FY2023-24 weighted avg) | CEA CO₂ Baseline Database |
| Research basis | Soiling separated from power data (arXiv:2209.09457); low-cost optical soiling sensor <1.4% error (arXiv:2011.06320) | arXiv |

### Honest impact math (use these numbers and no others)
- A 3 kW Delhi roof makes **≈12 kWh/day ≈ ₹78/day** (at ~₹6.5/kWh).
- 25% soiling (3 weeks uncleaned) costs **≈ ₹20/day ≈ ₹600/month** and **≈2.2 kg CO₂/day** of displaced grid power foregone (3 kWh × 0.727).
- The cleaning is **already paid for** (vendor obligation), so the recovery costs the owner nothing.
- Each **Smog Hold** saves **20–60 L of water** per avoided wash. This is our most defensible environmental claim.
- Scale line (closing only, explicitly labelled as a scenario): *"if 10% of PM Surya Ghar homes recovered 10% output…"*. Never present it as measured.

---

## 4. Users and roles

| Role | Who | Their one job | Surface |
|---|---|---|---|
| **Owner** | Sharma ji / Sunita ji, PM Surya Ghar household, Hindi-first, WhatsApp-literate | Read one sentence, tap one button | Mobile PWA, Hindi default, English toggle; also an email copy |
| **Technician** | Empanelled vendor's O&M technician | Tap *Saaf kar diya* after cleaning | One-screen mobile PWA reached from a link in the ticket |
| **Judge / auditor** | Hackathon judge; later the vendor's O&M manager or a DISCOM inspector | See the evidence: SR curve, baseline history, ticket timeline, AWS run | Separate `/audit` + **"How to judge this in 90 seconds"** page |

Explicitly **not** users: house help (wrong actor, since the vendor owes it), policymakers (the Smog Tax ledger is a pitch sentence, not a build).

---

## 5. The system

### 5.1 The deterministic judge: Saaf Twin hardware
```
           ┌── Test panel (exposed 24×7, soils like the roof)  ── INA219 #1 (0x40)
 roof rail ┤                                                                   ├─ ESP32 ── Wi-Fi ── AWS IoT Core
           └── Reference panel under SG90 servo shutter        ── INA219 #2 (0x41)
               (opens 60 s every 15 min, 10:00–14:00)
```
- **Two matched mini panels** (6 V, 1–2 W, same batch), side by side at roof tilt.
- **Measure short-circuit current, not power.** Each panel goes into an INA219 with Vin− returned straight to panel −, so the 0.1 Ω onboard shunt is the only load (a near-short: a few mV burden vs ~6 V Voc). Isc is linear in irradiance, and shorting a PV cell is safe.
- **Reference stays clean via the shutter.** It is exposed ~5% of the day, so it soils ~20× slower. It is **re-zeroed at every verified clean** (the technician wipes both).
- **Soiling ratio:** `SR = (Isc_test / Isc_ref) / k`, where `k` = the raw ratio recorded right after the last verified clean (this cancels panel mismatch, ±10% on cheap panels). Temperature affects both equally and cancels.
- **Sampling:** the shutter opens → 60 s of 1 Hz samples → median → one SR reading. The verdict uses the median of the noon block (10:00–14:00). **Demo mode** uses a 20 s window repeated every 30 s (configurable in firmware) and shows a "Demo light" banner.

### 5.2 The decision table (pure function, unit-tested)
| Condition | Verdict | Message to owner (hi / en) |
|---|---|---|
| SR ≥ 0.97 and Isc_ref ≥ 80% of clear-sky | **Saaf** | "Panel saaf hai. Kuch karne ki zaroorat nahi." / "Panels are clean." |
| SR ≥ 0.97 and Isc_ref < 80% of clear-sky | **Smog Hold** (dhuaan / haze or cloud) | "Dhuaan hai, dhool nahi. Saaf mat karwaiye, ~40 L paani bachega." / "It's the air, not the glass. Don't wash, you'll save ~40 L." |
| 0.90 ≤ SR < 0.97 | **Watch** | "Thodi dhool jam rahi hai. Hum nazar rakh rahe hain." |
| SR < 0.90 sustained (2 consecutive blocks; demo: 2 windows) | **Dhool**, raise job | "Dhool jami hai, roz ~₹X ka nuksaan. Safai aapke vendor ki zimmedari hai, muft." + **[Vendor ko bulao]** |

- **Clear-sky model:** deterministic solar geometry (solar elevation from lat/long/time) × `Isc_ref_clear`, calibrated on one clear noon (or the panel datasheet at 1000 W/m²). Open-Meteo/CAMS **aerosol optical depth and cloud cover are shown as evidence** ("AOD 1.2 today") and pick the *wording* (haze vs cloud). **They never gate the verdict.**
- **₹X/day** = `(1 − SR) × owner's daily kWh (entered once at onboarding) × tariff`. A deterministic formula, shown with its inputs.

### 5.3 The closed loop: *Proof of Wipe*
```
Dhool verdict
  → owner taps [Vendor ko bulao]
  → Step Functions: create ticket (DynamoDB) → email vendor (SES) with evidence + O&M clause
  → WAIT  waitForTaskToken  (task timeout = vendor helpline window, 48 h; demo 120 s)
       ├─ technician taps [Saaf kar diya] → SendTaskSuccess
       │     → VERIFY loop: SR ≥ 0.97 held for 10 min (hardware demo 60 s; judge simulator 0 s)?
       │          ├─ yes → re-zero k, close ticket, owner gets "Proof of Wipe" receipt
       │          └─ no  → ticket REOPENS: "Safai ke baad bhi panel saaf nahi. Vendor ko dobara bheja." (loud, honest); 2nd failure → escalate
       └─ task timeout → escalation state: Bedrock drafts complaint to the
                    registering authority citing the 5-yr O&M clause; owner approves with one tap
```
- The technician's ack is **necessary but not sufficient**. The panel has the final word. This is the Beacon "verification is a loop, not a boolean" principle applied to cleaning.
- **Smog Hold also acts:** if the owner (or vendor) had a wash scheduled, Saaf Twin says *don't*, and logs litres saved.

### 5.4 What Bedrock does / never does
| Does | Never does |
|---|---|
| Turns the verdict + numbers into a warm 1-sentence Hindi/English message | Classify dust/smog/clean |
| Drafts the vendor ticket text and the escalation complaint (owner approves) | Read screenshots or images |
| Writes the receipt summary | Close or reopen a ticket |

Outage → **"AI बंद"** badge + pre-written labelled templates. Never a silent fallback (the HaqCheck lesson). Model + region tested **before Oct 8**.

---

## 6. Screens (design spec)

1. **Owner home (`/`).** Warm daylight palette (rooftop, sun, not dev-dark). Big status word in Hindi (**साफ़ / धुआँ / धूल**) + one sentence + at most one button. A small line: "आज की कमाई ₹62 · पिछले हफ्ते ₹71". English toggle. Large type, icon-first.
2. **Owner ticket view.** Timeline in plain words: "Vendor ko bheja 8:02 → Technician aaye 10:40 → Panel ne pushti ki 10:51 ✓".
3. **Technician (`/t/{ticket}`).** Address, the one-line evidence, and one big button: **Saaf kar diya**. After tapping: "Panel jaanch raha hai…" with a live SR bar.
4. **Onboarding (3 steps).** Clip the twin on the rail → scan the QR to pair → enter the vendor name and daily units. First verified baseline = "Saaf Twin taiyaar".
5. **Judge / audit (`/audit`).** SR + Isc chart, baseline (k) history, verdict log with inputs, ticket state machine, link to the live Step Functions execution, and the **"How to judge this in 90 seconds"** page with a **demo-scenario button**.
6. **Role switcher** "Viewing as: Owner / Technician / Auditor" (Suraksha pattern).
7. **Health strip** on every screen: `Sensor ✓ 12s ago · AI ✓ · Cloud ✓`.

---

## 6A. Website design system (inspired by the top-3 winners' sites; pattern, not copy)

### What the three winning websites had in common (observed from their live/local builds)
| Pattern | Suraksha (R1) | Beacon (R2) | CampusEvac (R3) | HaqCheck (ours, lost) |
|---|---|---|---|---|
| Background | Warm cream "paper" | Warm cream + deep green bands | Warm cream + grid | **Dark, dev-portfolio** |
| Hero headline | Huge, one twist word in red: "care **without watching.**" | Serif, twist in italic: "The 3 AM page, *fixed with your voice.*" | Huge caps, twist in orange/yellow: "TWO VIEWS. ONE **SAFE EXIT.**" | Long sentence |
| Eyebrow tag above hero | "NOT SURVEILLANCE · AN ALLY FOR AGING AT HOME" | "BEACON NIGHT SHIFT" | "CO-OP EVACUATION DRILL · 3D IN THE BROWSER" | — |
| Hero visual | Live product card (companion chat) | Screenshot of the real Night Board + "approve fix one" pill | The live 3D drill | Form |
| Two CTAs | "Talk to Amma" / "Explore the world" | "Open the Night Board" / "Watch the film" | "Start a drill" / "Practice solo" | One "Verify with Cedar" |
| Tech chips / strip | STRANDS · BEDROCK · CEDAR · WEAR OS | "BUILT ON" marquee of AWS services | Ticker of product facts | Cedar jargon in header |
| "How it works" in 3 | T1 Check in · T2 Ask the right person · T3 Only if needed | "Three things, in your own voice" | Roles / Objectives | — |
| Live numbers | — | "Nobody woken the second time. Live numbers from this deployment" | Drill report | — |
| FAQ for doubters | — | "Good questions": Is it safe? What if the fix fails? What did it cost? Run without AWS? | — | — |
| Persona surface | `/parent`: one Hindi greeting + one button; privacy page fully Hindi, friendly empty states, errors shown visibly | Night mode board for a groggy SRE | Evacuee / Warden views | English-only form |
| Judge affordances | "Viewing as: Amma (tablet)" switcher | Top banner "live on AWS us-east-1 · judge passcode in submission", "How to judge this in 90 seconds", version tag, keyboard shortcuts, footer Run it / Trust / Safety | "Join with a code" | Raw Cedar drawer |

### Saaf Twin site map
| Route | Who | Purpose |
|---|---|---|
| `/` | Judge, public | Landing page (story + live proof) |
| `/home` | Owner (Sharma ji) | One status word + one sentence + ≤1 button (Hindi default) |
| `/t/{ticket}` | Technician | One button: *Saaf kar diya* → live verify bar |
| `/setup` | Owner | 3-step onboarding: clip → scan QR → vendor + daily units |
| `/audit` | Judge / O&M manager | SR + Isc chart, baseline `k` history, verdict inputs, ticket timeline, link to the live Step Functions execution |
| `/judge` | Judge | **"How to judge this in 90 seconds"** + **demo-scenario buttons** (*Simulate smog* / *Simulate dust* / *Technician ack without wiping*) |
| `/how` | Anyone | How the soiling ratio works (IEC 61724-1, shutter trick, limitations) |

### Landing page (`/`), section by section
1. **Top banner (Beacon pattern):** `Live on AWS ap-south-1 · device saaf-twin-01 last reading 12s ago · v0.x`.
2. **Hero:**
   - Eyebrow: `NOT ANOTHER SOLAR APP · A ₹1,500 TWIN ON YOUR ROOF`.
   - Headline: **"Dust or smog? *Know before you wash.*"** (the twist phrase in marigold accent).
   - Sub: one sentence about Sharma ji's 25 → 14 units.
   - CTAs: **[See it on a roof →]** (opens `/judge` demo) · **[Watch the film]**.
   - Chips: `IoT Core · Step Functions · Bedrock · CDK · IEC 61724-1`.
   - Hero visual: **a live card from the real deployment** showing the current verdict (साफ़ / धुआँ / धूल), SR value, and a tiny sparkline.
3. **Fact ticker (CampusEvac pattern):** "50 LAKH ROOFTOPS ◆ 99.99% STOP CHECKING ◆ VENDOR OWES 5 YEARS OF FREE CLEANING ◆ SMOG CUT DELHI SOLAR 11.5% ◆ A WASH USES 20–60 L". Each fact is sourced on `/how`.
4. **Three steps (Suraksha T1–T3 pattern):** **Sense** (the twin panels) · **Decide** (dust, smog, or clean, by physics, not AI) · **Prove** (the panel closes the job). Each has one line and one small illustration.
5. **The two moments:** a side-by-side of *Smog Hold* ("don't wash, ~40 L saved") vs *Dhool* ("vendor owes this, free"), with the real phone screens.
6. **Live numbers (Beacon pattern), pulled from DynamoDB, never hard-coded:** *Litres not wasted · Free cleanings claimed · Wipes verified · Tickets reopened (cleaning didn't work)*. Showing the reopen count is deliberate honesty.
7. **FAQ "Good questions" (Beacon pattern):**
   - Is AI deciding? *(No: physics; Bedrock only writes words)*
   - What if the technician taps without cleaning? *(Ticket reopens)*
   - Doesn't smog also dirty the glass? *(Yes, that counts as dust; Smog Hold is only haze in the air)*
   - Why a shutter?
   - What does it cost to run?
   - What can't it do yet? *(Inverter faults: roadmap)*
8. **Footer (Beacon pattern):** columns **Product** (Home, Setup, Audit) · **Run it** (README, CDK deploy, local run) · **Trust** (How SR works, limitations, AI-tools disclosure) · **Project** (GitHub, film, Builder Center blog), plus a big wordmark and the version.
9. **Persistent "Viewing as: Owner / Technician / Auditor" pill**, bottom-right (Suraksha pattern).

### Visual language (our own identity: rooftop, morning sun, dust vs sky)
| Token | Value | Use |
|---|---|---|
| `--paper` | `#FBF6EC` warm cream | Page background (light, like all 3 winners) |
| `--ink` | `#2A2118` deep brown | Text, primary buttons |
| `--sun` | `#E8A317` marigold | Accent / twist word / primary CTA |
| `--dhool` | `#B5651D` ochre | Dust verdict |
| `--dhuaan` | `#6B7A8F` haze slate | Smog Hold verdict |
| `--saaf` | `#2F8F5B` leaf green | Clean / verified |
| `--alarm` | `#C8382E` | Reopened ticket, errors, "AI बंद" |
| Display font | **Bricolage Grotesque** (Latin) + **Tiro Devanagari Hindi** (Hindi headings) | Hero, status words |
| Body font | **Hind** (Latin + Devanagari, same metrics) | Everything else |
| Mono | **JetBrains Mono**, `/audit` only | Never on owner/technician screens |

- **Type scale:** status word 64–96 px on mobile. Body ≥18 px. Buttons ≥56 px tall (thumb + low-literacy).
- **Motion:** one meaningful animation only: the SR bar filling back to green during *Proof of Wipe*. No decorative motion.
- **Iconography:** sun, dust-cloud, smog-cloud, check. Every status pairs an icon with the word (low literacy).
- **Errors are visible, never silent** (Suraksha shows "Unauthorized" in a red card): sensor offline → slate banner "Sensor 14 min se chup hai". Bedrock down → "AI बंद · template text".
- **Empty states speak Hindi warmly** (Suraksha pattern): "Abhi tak koi safai nahi chahiye thi."
- **Mobile-first:** the owner and technician screens are designed at 360 px first. The demo is recorded on a real phone.
- **Accessibility:** WCAG AA contrast on cream, `lang="hi"` on Hindi text, screen-reader labels on icons, no colour-only meaning.

### Anti-patterns banned (from the HaqCheck post-mortem)
- Dark dev aesthetic on user screens.
- Rule IDs, DSL, ARNs or "Cedar/Lambda" words on owner/technician screens.
- English-only labels when Hindi is selected.
- More than 3 inputs on any user screen.
- Hard-coded "live" numbers.
- Any fallback text that could be mistaken for a real result.

---

## 7. AWS architecture (one reason per service)

| Service | Job | Why this, not the alternative |
|---|---|---|
| **AWS IoT Core** + Rule | Device → cloud MQTT; rule routes readings to Lambda | Per-device X.509 certs and a managed broker, no always-on server; the rule is SQL, no polling |
| **AWS Lambda** (Python) | Deterministic SR classifier, API handlers | Pure-function classifier is trivially unit-testable; scales to zero |
| **Amazon DynamoDB** | Readings (TTL 30 d), baselines `k` history, verdicts, tickets, audit | Pay-per-request single table; TTL expires raw readings |
| **AWS Step Functions** (Standard) | Ticket lifecycle with `waitForTaskToken` + verify loop | Waiting hours for a human costs nothing; the visual graph is demo evidence |
| **Amazon EventBridge Scheduler** | Daily 14:05 IST noon-block summary (median SR of 10:00–14:00) per real-mode device | Timezone-aware schedule with no server; escalation timing lives in the Step Functions task timeout, so no extra timers |
| **Amazon Bedrock** (Nova/Claude, region pre-tested) | Language only: messages, ticket, complaint, receipt | Hindi quality; strictly downstream of the verdict |
| **Amazon SES** (sandbox, verified recipients) | Vendor ticket + owner receipt email | SMS to India needs DLT registration, so it's out for a weekend |
| **AWS Amplify Hosting** | PWA frontend (owner / technician / audit) | Git-push deploys, HTTPS URL for judges |
| **Amazon API Gateway** (HTTP) | Frontend API + technician ack → `SendTaskSuccess` | Thin, cheap, JWT-ready |
| **Amazon CloudWatch** | Alarms (device silent, classifier errors), `/health/deep` | P6: degrade loudly |
| **AWS CDK** | Entire stack in code, one command | Reproducible by judges; P8 |
| *(stretch)* **Amazon Cognito** | Owner/technician auth | Only if time allows; the demo uses signed per-ticket links |

**External data:** Open-Meteo Air-Quality (CAMS AOD, PM2.5) and cloud cover, used as evidence only and cached in DynamoDB.
**Estimated cost for the weekend:** within free tier / <$5 (IoT messages, Lambda, a few Step Functions transitions, Bedrock tokens).

```
ESP32 ─MQTT/TLS─▶ IoT Core ─rule─▶ Lambda(classify) ─▶ DynamoDB
                                        │ Dhool
                                        ▼
 Owner PWA ◀─ API GW ◀── Step Functions ── SES → vendor email ── Technician PWA
   (Amplify)         waitForTaskToken ◀───────── SendTaskSuccess ◀──┘
                         │ verify loop reads SR from DynamoDB
                         └─ task timeout / 2nd failed wipe → escalation (Bedrock draft)
 EventBridge Scheduler → daily noon-block summary
 Bedrock: text only · CloudWatch: alarms + /health/deep · CDK: everything
```

---

## 8. Explicit scope

**In (must work on camera):** twin-cell SR measurement → verdict table → owner message → vendor ticket → technician ack → panel-verified close **and** the reopen path → Smog Hold → escalation timer (compressed) → audit page → deployed on AWS.

**Out (said once in the video or the writeup, not built):**
- Inverter-fault branch (needs inverter data; the real-world path is a ₹415 SCT-013 CT clamp on the inverter output, which is roadmap)
- Satellite expected-yield as a gate
- Screenshot OCR
- "Smog Tax" city ledger
- House-help persona
- Photo gates
- SMS
- Policy dashboards
- Multi-home fleet view

---

## 9. Bill of materials (buy before Oct 8; buying is allowed pre-clock)

| Item | Qty | ~Price | Source |
|---|---|---|---|
| Mini solar panel 6 V 1–2 W (**same batch**) | 3 (1 spare) | ₹150–250 each | Robu.in / Lajpat Rai Market |
| INA219 module (set address jumpers 0x40/0x41) | 3 (1 spare) | ₹290 each | Probots / Robu |
| ESP32 DevKit | 2 (1 spare) | ₹400 each | Robu |
| SG90 servo + a small acrylic/card flap | 2 | ₹120 each | Robu |
| Digital multimeter (10 A range) | 1 | ₹500 | local |
| Breadboard, jumpers, USB power bank, small tripod/clamp mount | — | ₹600 | local |
| Halogen work lamp (backup light source; avoid LED) | 1 | ₹400 | local |
| Frosted acrylic/tracing sheet (Smog Hold prop), sieve + fine dust/matte film (Dhool prop) | — | ₹100 | stationery |
| **Total** | | **≈ ₹4,000** | |

---

## 10. Kill-tests before Oct 8 (field/hardware checks, no project code)

| # | Assumption | Test | Kill / pivot rule |
|---|---|---|---|
| K1 | The cheap twin's Isc ratio is stable | Multimeter (10 A) Isc on both panels at 10:00 / 12:00 / 14:00 on Oct 5 | If the normalized ratio drifts >2%, or an even dust layer drops it <8%: buy better-matched panels or switch to the optical-transmittance method (DUSST-style) |
| K2 | Smog Hold shows up in real Delhi air | On a hazy noon, Isc_ref vs the clear-sky estimate | If there's no ≥10% deficit with the ratio ≥0.97: film Smog Hold with the frosted sheet and **say so on screen** |
| K3 | Owners don't get the free cleaning they're owed | Phone 3 Delhi PM Surya Ghar owners + 1 empanelled vendor helpline | If vendors already clean monthly and reliably: reframe the loop as **Proof of Wipe** (verify the visits actually happen and work) |
| K4 | AWS is ready | Bedrock model access + one test call in the chosen region; IoT Core hello-world from a throwaway ESP32 sketch; SES recipients verified; student status verified on Builder Center | Fix before Thursday. This is exactly what sank HaqCheck |

---

## 11. Four-day build plan (repo created after the clock starts; small, frequent commits)

| Day | Goal by end of day |
|---|---|
| **Thu Oct 8** | Repo + CDK skeleton deployed. ESP32 publishing both Isc values to IoT Core → Lambda → DynamoDB. Classifier as a pure function with tests (table in §5.2). Ugly owner page showing the live verdict. **The thin loop runs on AWS.** |
| **Fri Oct 9** | Step Functions ticket flow: owner button → SES vendor email → technician PWA ack → verify loop → close / reopen. Timeout escalation (compressed) + EventBridge Scheduler daily summary. Servo shutter firmware. Bedrock text with the "AI बंद" fallback. `/health/deep` + alarms. **Write the video script tonight.** |
| **Sat Oct 10 (DTU)** | Persona UI polish (Hindi, large type, icons, onboarding, role switcher, audit page, judge path). Feedback from the Amazon team. **Shoot outdoor B-roll** (real rooftop/haze if available) and a full backup take. |
| **Sun Oct 11 AM** | Feature freeze. Final video ≤3:00 with English captions. README (problem, architecture with "why each service", local run, AI-tools disclosure). Writeup. Builder Center blog (AirPods prize). Submit early; check the YouTube link signed-out. |

---

## 12. Demo video storyboard (≤3:00, English captions throughout)

| Time | Beat | On screen |
|---|---|---|
| 0:00–0:18 | **Hook.** "It's 8 am in Dwarka. 25 units in March, 14 today. Sharma ji is about to pour 40 litres on his roof. Will it help?" | Real inverter app, real roof, bucket |
| 0:18–0:35 | **The insight.** Two causes look identical on the meter: dust on the glass, smog in the air. One needs a wash his vendor owes him free; the other needs nothing. Introduce **Saaf Twin** | The clip-on twin on the rail; shutter opens |
| 0:35–1:00 | **Smog Hold.** Frosted sheet over both panels → both dim, ratio stays 1.0 → phone: "धुआँ है, धूल नहीं। धुलाई मत कराइए, ~40 L बचेगा" | Phone + panels in one frame |
| 1:00–1:35 | **Dhool.** Even dust on the test panel only → ratio falls to 0.84 → "धूल जमी है, ~₹12/दिन का नुकसान। सफ़ाई आपके vendor की ज़िम्मेदारी है, मुफ़्त" → **[Vendor ko bulao]** → the vendor's email arrives with the evidence | Continuous shot |
| 1:35–2:05 | **Proof of Wipe.** Technician taps *Saaf kar diya* → "Panel jaanch raha hai…" → wipe → ratio climbs to 0.98 → receipt. Then the honest branch: ack without wiping → **ticket reopens** | Split screen: technician phone / panel / owner phone |
| 2:05–2:40 | **AWS, with reasons.** IoT Core → Lambda classifier → Step Functions waiting on a task token (cut to the **real execution graph** of the run we just did) → timeout escalation → Bedrock writes words only → CDK | Console, ~5 s per service |
| 2:40–3:00 | **Honest close.** "Physics decides, the vendor cleans, the panel confirms." One lesson learned ("a wipe leaves a film, so we close at 0.97, not 1.0"). Scale line, labelled as a scenario. **Saaf Twin: know before you wash.** | Team + device |

---

## 13. Success criteria (definition of done)

- [ ] Both verdict paths (Smog Hold, Dhool) **and** the reopen path run live on the deployed stack, on camera
- [ ] The ticket closes only after the panel-verified SR ≥ 0.97 hold. Proven by a test and on video
- [ ] Classifier unit tests cover every row of §5.2 plus boundary values (0.97, 0.90, 80%)
- [ ] Bedrock outage shows "AI बंद" + templates (tested by revoking the permission)
- [ ] Owner screen: ≤1 button, fully Hindi with an English toggle, readable at arm's length on a ₹8k Android
- [ ] Public Amplify URL + public repo + CDK deploy instructions + AI-tools disclosure
- [ ] Video ≤3:00, ≥60% live product, real AWS console shown, English captions
- [ ] Every number in the video comes from §3's honest impact math

---

## 14. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Cheap panels mismatched or drifting | `k` normalisation at each clean; K1 test; spare panel; option to swap to optical-transmittance sensing |
| Talc/dust gives a non-linear partial-shading drop | Use an even sieved layer or a matte film over the *whole* test panel; never extrapolate ₹ from the demo drop. ₹ comes from the formula and owner inputs |
| No sun / no haze during filming | Halogen backup with a visible "Demo light" banner; frosted sheet for Smog Hold, disclosed |
| ESP32 TLS/IoT certs eat Thursday | Practise a hello-world before Oct 8 (learning); fallback is a laptop serial→MQTT bridge with the same certs |
| Bedrock region/model blocked (the HaqCheck killer) | Pre-tested before the clock; templates + loud badge |
| "Is this a toy?" | Outdoor rooftop footage; IEC 61724-1 citation; the roadmap line on CT-clamp inverter integration; honest numbers |
| Judges don't know "PM Surya Ghar" | Say "government rooftop solar scheme, 50 lakh homes" on screen; captions |
| Track crowding unknown | Not relied upon. The pitch wins on defensibility and the on-camera loop |

---

## 15. Writeup / blog skeleton (AWS Builder Center)
1. The 8 am question (Sharma ji).
2. Why dust and smog look identical on a meter (Peters 2018, soiling data).
3. Saaf Twin: the IEC 61724-1 idea at ₹1,500, plus the shutter trick.
4. Why AI is not the judge here.
5. AWS: task tokens for human waits, and the verify loop.
6. What fought back (panel mismatch, wipe film, lamp heat).
7. Honest numbers.
8. What's next (CT-clamp inverter path, vendor fleet view).
