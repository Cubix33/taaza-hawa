# Round 4 council: five anonymous peer reviews

Each reviewer saw `00-framed-question.md` and the five anonymised responses in `01-advisors-anonymized.md`, not the advisor identities. Reviewers were given distinct lenses.

## Review 1: sceptical hackathon judge (has seen 200 videos this year)

**1. Strongest: C.** It is the only response that attacks the premise rather than the packaging. R2 verified staleness on WAQI/OpenAQ mirrors; CPCB's own CCR endpoints returned 404 and were never read. "Upstream at CPCB" is inference. C's fix (dark = absent from the 17:00 bulletin; otherwise "unreachable via public mirrors") gives a deterministic, non-defamatory judge, and its 5/10 is the only honest score. E's "say the pitch back in one sentence" test is the next most useful idea and should be grafted on.

**2. Biggest blind spot: D.** It keeps everything the others cut: the Would-Have-Been AQI (model as judge), "GRAP-I threshold crossed under both" (a policy claim from imputation), and an SES email to DPCC "shown as sent" (the fake loop C and B kill). Its selling point, Diwali Nov 8, is four weeks after scoring; a judge watching cold on Oct 12 never sees the second act. "Newsworthy" reads as "adversarial toward the regulator" from the chair.

**3. All five missed:** the closure logic is circular. The Hold is built from neighbours + CAMS; Hit/Missed is graded against the station returning, or against the same neighbours. If the station stays dark there is no ground truth; if it returns, the bulletin value is a 24-h average, not the 09:00 estimate. Nobody defines what "Missed" is actually measured against. Also: zero pick diversity (all A-variants), and nobody checked whether the bulletin names absent stations (R2 only verified the PDF exists).

## Review 2: AWS solutions architect ("Built on AWS", solo, Free Tier, four days)

**1. Strongest: A.** It is the only response that names a stack where every service has a job and a reason: EventBridge Scheduler (polling cadence), Lambda (WAQI/CAMS/bulletin fetch), DynamoDB (station ledger), Step Functions (receipt lifecycle), SES (receipt), Amplify static PWA (R5: avoid Next SSR, App Runner, CloudFront). All verified free-tier in R5. It alone schedules the pre-Oct-8 gates (Bedrock use-case form, SES production request) and names the first scope cut. Day plan is one-person realistic.

**2. Biggest blind spot: C.** It puts **Textract** on screen for the bulletin PDF, a service R5 never checked and that is unnecessary (pdfplumber in Lambda, as A says); that is a service stretched for optics. Worse, its "dark" test requires WAQI AND OpenAQ AND data.gov.in to all lack the station, but R2 says OpenAQ needs a key and lags ~1.5 days, so no station can be declared dark in real time. Runner-up: D shows "SES email to DPCC sent" while the account may still be in SES sandbox (verified recipients only).

**3. All five missed:** (a) R5's Free plan is "limited to select services"; nobody confirms Step Functions, Amplify Hosting, SES production and Bedrock are inside it, nor schedules the Oct 7 empty-Amplify-app/CDK-bootstrap probe for the new-account verification hold. (b) Bedrock appears only as decorative Hindi phrasing; a judge will read it as bolted on. Either drop it or make it load-bearing deterministically (Bedrock Data Automation extracting the bulletin table, rules deciding). (c) Nobody says where the `waitForTaskToken` token is persisted so the 17:00 Lambda can call SendTaskSuccess.

## Review 3: atmospheric-science / air-quality-data researcher

**1. Strongest: B.** It alone treats the Trust Hold as a statistical object: a calibrated interval, conformally backtested on masked real dropouts, with coverage and width as explicit pass/fail numbers. That is the only formulation a CPCB scientist cannot dismiss as "your imputation is wrong." C's mirror-vs-source point is the second-best contribution (R2 confirms CCR endpoints 404; staleness was never observed at CPCB itself) and should be merged into B.

**2. Biggest blind spot: D.** "Would-have-been 231" and "GRAP-I threshold crossed under both" is a model-derived city AQI driving a regulatory-trigger claim, exactly the imputation-as-judge failure. D also treats "pinned at 500" as evidence of malfunction; the CPCB index saturates at 500 by design (PM2.5 24-h ≥250 µg/m³), so that claim would embarrass the builder instantly.

**3. All five missed:**
- **Averaging mismatch.** The 17:00 bulletin is a 4pm-to-4pm 24-h mean; the stale "150" and the morning Hold are hourly. Grading a morning hourly estimate against a daily mean (E, C, D) is apples-to-oranges; the judge must be the station's own returned hourly values or a 24-h recomputed estimate.
- **Bulletin absence ≠ dark.** CPCB drops stations with <16 h data or <3 pollutants; "absent" conflates outage with insufficiency.
- **CAMS is one ~45 km cell** (R2), today PM10 ~400 vs CPCB AQI ~195: large bias, no intra-city gradient; it needs bias correction before entering any interval.
- **Hotspot bias.** Dwarka/Anand Vihar are designated hotspots; neighbour imputation will be systematically low there.
- **October is PM10-dominated** (R6); the engine must compute per-pollutant sub-indices, not impute "AQI."

## Review 4: product designer for Hindi-first users on cheap Android

**1. Strongest: E.** It is the only response that designs for a stranger. One question ("Can I go outside right now?"), three answers, one plain sentence of "why" underneath, and every insider word renamed to what it does ("receipt" → "how we did yesterday"). Its second kill test (read the pitch to someone outside Delhi) is a real usability test. Its film has one phone, one decision, one time-lapse caption; a solo filmmaker can shoot it.

**2. Biggest blind spot: D.** It optimises for judges' vocabulary, not the user's screen. "Dark Station / Trust Hold / Would-Have-Been AQI" are English coinages a Dwarka resident will never say; the 2:15 ledger of 40 stations and the "9/37 on Diwali 2025" anchor are audit surfaces, not a decision; and "SES email to DPCC shown as sent" reintroduces the fake-authority loop C and B correctly killed. Four screens in 180 seconds, none of them a choice. A shares this problem ("File receipt" means nothing to the persona; a laptop labelled "Public ledger" is the team talking to itself).

**3. All five missed:**
- **Hindi is a Bedrock afterthought everywhere.** Nobody wrote the three buttons or "Hit / Missed" in Hindi, or asked whether "Hold" has a word an aunty taps. Design the screen in Hindi first, then translate to English.
- **The 95 % state.** No one shows what the home screen says when the station is fine. A product that only exists when a sensor dies looks broken on a normal day.
- **First run on cheap Android.** Location permission, station pick, add-to-homescreen, notification permission: four taps before any value. No response choreographs them, yet web push (R5) depends on all four.
- **Filming a phone solo** (screen-record vs over-shoulder, two shoots per day at 06:00 and 17:05) is unplanned.

## Review 5: focused on production-grade systems

**1. Strongest: B.** It alone resolves the standing rule "AI/model is never the judge" instead of waving at it: the Hold becomes a conformally calibrated interval (Harshdip's actual skill, a credible blog), the returning station or bulletin is the judge, Hit/Missed is literal. It kills the DPCC filing outright (A, D keep it as "shown as sent", pure theatre), plans the no-dark-station fallback (labelled Diwali REPLAY), and its kill test measures the one number that decides whether the product exists (coverage at under one band). Borrow D's vocabulary (Dark Station, Trust Hold) and E's one-sentence home screen; that is the judge-repeatable line: "it told me the number was stale, then proved it."

**2. Biggest blind spot: D.** It is the most accusatory build (Would-Have-Been AQI headline, "GRAP-I crossed under both", SES to DPCC) yet never checks C's point: R2 only saw mirrors; CPCB's own CCR endpoints 404'd and were never read. If CPCB is live while aqicn lags, D's film is a libel-shaped demo. Its Diwali "second act" lands four weeks after judging; judges score what they see on Oct 12.

**3. All five missed:** the bulletin value is a 24-h average ending 16:00, while the morning Hold is an hourly estimate. Scoring Hit/Missed across those units is ill-posed; a clean Hit is luck. Judge the Hold against the station's own first returned hourly reading, or hold a 24-h quantity. Also: no one made the 4-day all-station Hit/Missed scoreboard the hero shot; that scoreboard, not one receipt, is what stops it being filed as "another AQI dashboard".

## Tally

| | Strongest | Biggest blind spot |
|---|---|---|
| Response A | 1 (AWS architect) | 0 (shared mention) |
| Response B | 2 (scientist, past-winner) | 0 |
| Response C | 1 (sceptical judge) | 1 (AWS architect) |
| Response D | 0 | 4 |
| Response E | 1 (designer) | 0 |
