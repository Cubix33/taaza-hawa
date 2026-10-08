# Council Verdict, Round 2 (software only): Oct 4, 2026

**Vote:** S1 ×6 (all advisors). Peer-review "strongest": F (First Principles) ×2, C (Contrarian) ×2, A (Executor) ×1, B (Podium Winner) ×1.
**Decision:** **Right Hour PE (साफ़ हवा घंटा)**, Air track. Full spec in `../../PROBLEM_STATEMENT.md`.
**Chairman's honesty line:** *podium entry as it stands; a winner only if (a) measured ozone confirms the Two-Peak Problem, (b) a real teacher/principal taps on film, (c) receipts honestly include a miss.*

## Where the Council Agrees
- S1 for everyone. S2–S5 dead: synthetic data / HaqCheck trap / no access or filming / no loop closure.
- Saaf Twin skeleton reused:
  - a deterministic rule, no LLM judge;
  - Hawa Hold;
  - an evening Proof of Breath from measured data, with misses as loud as wins;
  - Bedrock as copy-editor with an "AI बंद" fallback;
  - `waitForTaskToken` for the human tap;
  - a labelled replay because hack week may be clean.
- F's frame wins: **a timestamped prediction that reality grades on camera** is the software watch drop.

## Where the Council Clashes
- **Channel.** Connect call (B) vs email + PWA (A) vs WhatsApp (designer). Connect has no outbound to India for a new account, SMS needs DLT, and WhatsApp templates need Meta approval. → PWA web push primary, SES email backup, WhatsApp stretch.
- **Scope.** D's citywide ledger is either the adoption asset or a dashboard trap. → one backtested number in the closing line, no map.
- **Does it beat a poster?** For PM2.5 alone, C is right: a fixed 13:00 is within 1.2% of the daily optimum. Only the combined PM2.5 + O₃ (+ heat) metric makes the best hour move.

## Blind Spots the Council Caught
- October opening is 7:30–8:00, so decide the night before.
- "Dirtiest hour of the day" is false; it holds only within school hours.
- 41% was CAMS-vs-CAMS. A PE-period cut ≈ 4–5% of daily dose.
- Midday ozone and heat.
- Email scanners auto-click GET links, so use a POST confirm page.
- Indoor PM2.5 is 0.7–1.0× outdoor (not clean), but indoors is protective for O₃.

## The Recommendation
- **Name:** Right Hour PE · *साफ़ हवा घंटा*.
- **Tagline:** "Morning smoke or midday ozone. We pick the hour, and by evening the air grades us."
- **Moment:** the principal at 20:00 the night before; a 06:15 re-check that buzzes only if the plan changed; the teacher gets class, period and an indoor plan.
- **Breath Score:**
  - Hourly max of the CPCB AQI sub-indices for PM2.5 and O₃ (labelled as a proxy), with a feels-like ≥35 °C cap.
  - Swap only if the best slot beats **both** the current slot and the **Poster baseline** by ≥25 points.
  - **Hawa Hold** if every slot >200 or GRAP III/IV (SSM). Default at 06:45: Hold if it fired, else keep the timetable.
- **Channels:** Amplify PWA + web push (VAPID) primary; SES + POST confirm page backup (short id, never the raw token); WhatsApp stretch only if approved by Oct 9. No Connect, no SMS.
- **Proof of Breath:**
  - 17:00, measured CPCB PM2.5 + O₃ (OpenAQ v3, median of 3 nearest, gaps flagged).
  - Scores the chosen vs original vs Poster slot → **Beat / Tied / Missed**. A miss lowers station confidence.
  - Wording: "station air, not lungs; ~X% lower during PE, ~Y% of today's total". Links to the public readings.
- **AWS:** Scheduler (Asia/Kolkata), Lambda, Step Functions Standard, API Gateway, DynamoDB, SSM, SES, Amplify, Bedrock (words only), CloudWatch, CDK.
- **Cut:** Connect, SMS, dose multipliers (they cancel), the city map, multiple schools, OCR, a parent app, roadside modelling.
- **On camera:**
  1. Hazy 8:20 sprint.
  2. 20:00 buzz → हाँ → teacher buzz.
  3. 17:00 receipt over the measured curve, three live days including a Tied/Missed.
  4. Labelled Nov-2025 replay with Hawa Hold.
  5. Backtest closing line.
- **Concepts:** Two-Peak Problem, Poster Test, Hawa Hold, Proof of Breath.
- **Kill-tests before Oct 8:**
  1. Measured CPCB PM2.5 + O₃ re-run (if poster regret >25 pts on <~20% of days, pivot to "Poster + exceptions", podium at best).
  2. OpenAQ lag <6 h, else a data.gov.in poller first.
  3. Archived CAMS forecast vs measured: does the forecast beat the poster? Else the 7-day measured profile leads.
  4. Recruit a real teacher/principal, else a visibly labelled role-play.

## The One Thing to Do First
Get a free OpenAQ key today and re-run the poster-vs-daily-choice analysis on **measured** CPCB PM2.5 + O₃ (DTU/Mundka/Narela, 2024–25) with the combined Breath Score.
