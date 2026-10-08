# Council verdict, round 4 (Oct 4 2026)

5–0 for the A-family (A alone, F-cut, A-gutted, A-reframed, D-on-A); peer reviews named B strongest twice and D the blind spot four times. Mapping: **A = Executor, B = First Principles, C = Contrarian, D = Expansionist, E = Outsider.**

## Where the Council Agrees

- B, C, E and G are dead: B role-plays a coach's judgement and K1 showed timing barely matters; C's verifier is MCD; E is grapstatus.com; G has no applicant and no feed.
- The person is Harshdip himself, a Dwarka resident deciding whether to go out. One device, no second actor.
- The authority loop is theatre. DPCC will not reply in four days; "SES sent to DPCC" is a fake ack and must go.
- The feed is the acknowledger: a receipt opens when the user acts on a stale number and closes deterministically when real data returns, reporting Hit or Missed.
- Bedrock may phrase Hindi; it never decides.
- Stack: EventBridge Scheduler, Lambda, DynamoDB, Step Functions `waitForTaskToken`, SES, Amplify static PWA, all free-tier (R5). No App Runner, SMS or Textract.
- The counterfactual "would-have-been city AQI" is a model acting as judge. Cut it (only D kept it).

## Where the Council Clashes

- **Home screen.** A, C and D lead with the station ledger; E insists on one question ("Can I go outside right now?"), three answers, one sentence of why. Reviews 4 and 5 side with E.
- **The judge.** A: the returning station. C: absence from the 17:00 bulletin. D/E: the bulletin's number. B: the returning station against a calibrated interval. Reviews 1, 3 and 5 caught that the bulletin is a 4pm-to-4pm mean while the Hold is hourly; grading one against the other is ill-posed.
- **Confidence about CPCB.** C alone said staleness was observed only on mirrors and that accusing the regulator on that is "a libel-shaped demo". D assumed the opposite.
- **Score.** 7, 7, 5, 7, 6. Only C priced the unverified premise.

## Blind Spots the Council Caught

From the reviews: closure is circular unless the judge is the station's own next hourly reading; "pinned at 500" is index saturation by design; CAMS is one 45 km cell with a large October bias; Dwarka and Anand Vihar are hotspots, so neighbour imputation runs low there; October is PM10-dominated, so compute per-pollutant sub-indices; nobody persisted the task token; nobody designed the 95 % state; Hindi was an afterthought.

**What R8 did to each position.** Inconclusive is worse for the watchdog than a refutation: it removes the premise without supplying a replacement.

- **Executor (A):** the guaranteed receipt ("subscribe to NSIT Dwarka Thursday") is gone: that page no longer resolves, DTU's freeze matches a WAQI-wide cutoff, and A's kill test now measures mirror lag. Stack and day plan survive.
- **First Principles (B):** "Harshdip sits beside the dark station" is unproven, but B's formulation never depended on CPCB being at fault: a calibrated interval, judged by the station's return, labelled REPLAY if nothing goes dark. B's second kill test (under 5 % unavailable = no event) is now the live question: CPCB's own bulletin shows 2–3 of 46 stations not participating on Oct 3 and 4, right at that line.
- **Contrarian (C):** vindicated on the premise, killed on the fix. The bulletin names no stations, so "dark = absent from the bulletin" has no judge. Its kill test hit a captcha.
- **Expansionist (D):** fatal. D's own kill test read "if the Bulletin does not list dropped stations by name, the closing receipt has no judge, and A dies." It does not. The would-have-been AQI and the GRAP-threshold claim rested on dark stations that are not established.
- **Outsider (E):** strengthened. "Can I go outside right now?" needs no dark station; the 95 % state becomes the main state and the stale case is one branch of the same card.

## The Recommendation

The unanimous watchdog framing does not survive R8. Build the honest reduced form: **Taaza Hawa** (drop "Sach"; "truth" is a claim the product cannot make), the F-cut as E shaped it and B specified it.

**Person and moment.** Harshdip, Dwarka, 06:30, about to run. One card: Go / Wait until ~10 / Stay in. Under it, one sentence: "Nearest reading (Dwarka Sector 8): PM10 sub-index 168, 40 minutes old." When the nearest reading is over 3 hours old: "Nearest reading is 31 hours old. Act as if 210–260 (3 live neighbours, bias-corrected CAMS, last value). We will grade this when a fresh reading lands." The interval is conformally calibrated per station on OpenAQ history. Staleness is stated as age at the named source, never attributed.

**Deterministic judge.** The same station's own next hourly value from WAQI, same pollutant, same units. Inside the interval: Hit. Outside: Missed by N. No fresh value in 72 h: Missed, still waiting. Daily, one line quoted from CPCB's own PDF via pdfplumber: "CPCB bulletin: 43 of 46 Delhi stations participated today." CPCB's number, not ours.

**The loop on camera.** Tap "Hold me to it" (Hindi first). A Step Functions execution parks on `waitForTaskToken`; the token is stored in DynamoDB keyed by station. The 15-minute poller sees a newer `time.v`, reads the token, calls `SendTaskSuccess`; the console flips Running to Succeeded and the phone shows "How we did: said 210–260, station came back at 238, Hit." The hero shot is the 4-day scoreboard: every Delhi station, every morning, Hit / Missed / Pending. That, not one receipt, stops it being filed as another AQI dashboard.

**What AI may do.** Claude Haiku 4.5 on the `in.` Mumbai profile turns a fixed template of numbers into one plain Hindi sentence. It never picks the verdict, interval or grade. If the use-case form is not cleared by Oct 7, drop it.

**Honesty line.** May say: reading age and named source; interval and its inputs; Hit / Missed by N; CPCB's participation count, quoted. Must never say: dark, offline, tampered, sprinkler, "true AQI", "CPCB switched it off", "complaint received", any GRAP claim from an estimate, or who is at fault for the staleness.

**AWS, one reason each.** EventBridge Scheduler: 15-min cadence, free. Lambda: pollers, sub-index rules, grader, push sender. DynamoDB: ledger, subscriptions, task tokens. Step Functions Standard: the receipt is a waiting execution judges watch close. SES: the receipt email (request production before Oct 8). Amplify Hosting, static Vite PWA: live URL without the new-account CloudFront hold. Bedrock Haiku 4.5 `in.`: the Hindi sentence only.

**First scope cut.** Web push (own VAPID, four permission taps on cheap Android); fall back to in-app card plus SES. Second cut: the Bedrock sentence.

**Labelled fallback.** If no Delhi station goes 3 h stale during Oct 8–11, the film replays Oct 20–21 2025 from OpenAQ history under a burned-in "REPLAY: Diwali 2025 data" caption, while the live scoreboard shows real Hits on fresh stations, proving the grader runs.

**Winning potential: 6/10.** Live every day, natural user, deterministic grade, a conformal story that is Harshdip's real skill and a credible blog. Against it: the stale-station event is no longer guaranteed on camera; a PM10-dominated, hotspot-biased city may force intervals wider than one band; a cold judge may still read it as an AQI app unless the scoreboard leads.

## The One Thing to Do First

On Oct 5, 6 and 7 at ~09:00, solve the CPCB captcha by hand at `https://airquality.cpcb.gov.in/ccr/#/caaqm-dashboard-all`, filter Delhi, and screenshot the Live / Delay / Inactive counts and each station's last-updated time beside the same stations' WAQI `time.v` (token requested the same morning). Three mornings decide the main state: if CPCB and WAQI disagree, mirror lag is the user's real problem and the sentence is "your app's number is N h old"; if they agree and 2–3 stations are stale daily, the stale branch is live on camera; if everything is fresh, REPLAY is the film and the scoreboard is the hero.
