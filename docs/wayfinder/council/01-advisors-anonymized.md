# Round 4 council: five independent advisor responses (anonymised)

Letters were assigned at random. The mapping is disclosed in `03-verdict.md` after peer review. Each advisor read `00-framed-question.md` and the R1–R7 research reports independently; none saw another's response.

---

## Response A

### 1. Pick: A, Sach Hawa, cut to one loop
Build A alone, not F. It is the only idea whose first step exists at 08:05 Thursday: a Lambda that polls WAQI for the Delhi bounding box, writes each station's value plus `time.v` age into DynamoDB. R2 verified the raw material today: Anand Vihar 31 h stale, NSIT Dwarka 56 h, DTU dead since June. The feeds it needs are GREEN or AMBER-as-feature (WAQI timestamps, CPCB bulletin PDF, Open-Meteo CAMS, R2 summary table). B needs a coach, C needs an authority to act, D needs motion classification plus A's engine, G has no feed. A ships with Lambda + EventBridge Scheduler + DynamoDB + Step Functions + SES + Amplify, all free-tier (R5).

### 2. Fatal flaw and fix
"File and wait" never closes on camera; DPCC will not reply in four days. Fix: the receipt closes on the feed, not the authority. Step Functions loops Wait(30 min) -> Lambda check until the dark station reports again, then writes "dark 41 h; neighbours averaged 290 while official showed 150" or, at 72 h, "Missed: still dark, receipt escalated". Both endings are honest and filmable. Subscribe to NSIT Dwarka Thursday 09:00 so one receipt is guaranteed to resolve by Sunday.

### 3. Film and build boundary
Film: Device 1 (phone, labelled "Resident, Dwarka"): push notification "Your station dark 60 h. Official 150, trusted estimate 290, Trust Hold." Tap "File receipt". Device 2 (laptop, "Public ledger"): receipt opens; cut to Step Functions execution graph, DynamoDB items, SES email in inbox, Amplify URL. Sunday: receipt closed with measured gap. No staging beyond labels; the real feed supplies the event.

- Thu: WAQI poller every 15 min, CAMS poller, bulletin PDF fetch 17:30 IST, staleness/pinning rules, Lambda URL API, README with architecture diagram, first commit by 10:00.
- Fri: Vite PWA on Amplify (station list with age badges, "your number" with provenance, Trust Hold), VAPID web push, receipt state machine, SES to verified address.
- Sat: ledger page, missing-station count per bulletin, Haiku 4.5 `in.` profile for a Hindi one-liner (number untouched). Feature freeze 18:00; record b-roll.
- Sun: film, edit, blog, submit.

First scope cut: the counterfactual city AQI. If IDW from live neighbours looks shaky Saturday noon, demote to "7 of 40 stations missing from today's bulletin" (a count, not a number).

### 4. Claim line
May say: "Station X last reported at T (N h ago). Nearest live stations: Y. CAMS model: Z. Estimate W, labelled estimate." Must never say: "CPCB is faking", "sprinkler detected", "the real AQI is W". Say "Missed" when the returned station contradicts the estimate by more than one AQI band.

### 5. Score 7/10; kill test
Oct 5-6: get a WAQI token, pull all Delhi stations, confirm 35+ with per-station timestamps and at least one over 24 h stale; parse one bulletin PDF with pdfplumber for the station count. Same day: submit the Bedrock use-case form and SES production request (R5 checklist items 3-4). If WAQI returns fewer than 25 Delhi stations, the watchdog has no teeth and you switch to D.

---

## Response B

### 1. Which idea
Strip the shortlist to what is actually being solved: a Delhi resident must make one decision today (go out, train, open windows, send the kid) using a number they do not believe. R7 says the dominant theme is data trust, not AQI ignorance. R2 shows the truth is deterministic and already measured: NSIT Dwarka 56 h stale, DTU dead since June, Anand Vihar 31 h. So the product is not a dashboard and not a grievance tool. It is **F, cut to the bone**: A's engine answering one question, "what number do I act on right now, and how sure is it", with D's decision but none of D's phone-motion/dose-budget machinery. B, C, E all require role-playing someone else's judgement; G has no feed. Harshdip sits beside the dark NSIT station: he is the natural user, on camera, with no second person. That beats every other row on "who is it for".

### 2. Fatal flaw and fix
The flaw: the Trust Hold is imputation, i.e. a model becomes the judge, violating the standing rule. Fix: make the Hold a **calibrated interval, not a point**, built from neighbour stations + CAMS + last value, conformally calibrated on each station's own OpenAQ history (R2 backfill). The judge is the station itself when it returns, or the 17:00 bulletin. Drop "file with DPCC" entirely; R3 is explicit nobody answers in 4 days and a fake loop is worse than none. Closure = feed return + Hit/Missed.

### 3. The film
Phone 1 (user): WAQI/CPCB page shows NSIT Dwarka "150, updated 56 h ago". Phone 2 (app, labelled "Sach Hawa"): "Station silent 56 h. Act as if 210–260 (Dwarka Sec 8, R K Puram, CAMS). Hold expires when station reports." One tap: "Hold me to it." Cut to AWS console: EventBridge Scheduler → Lambda poller → DynamoDB ledger; Step Functions `waitForTaskToken` sleeping until the station returns; SES receipt arriving; Amplify PWA push. Architecture diagram on screen 10 s. If no station is dark during Oct 8–11, replay Diwali 2025 (30/39 offline, R3) with a burned-in "REPLAY" label. Bedrock Haiku only phrases Hindi text; never decides.

### 4. Claim line
May say: "Official 150 at 10:30 Oct 2, age 56 h. Hold 210–260 from 3 neighbours + CAMS. Station returned 14:00 Oct 9 at 238: Hit." Or "Missed by 40". Also "7 of 37 stations unavailable in today's bulletin." Must never say tampered, manipulated, sprinkler, or "true AQI is". Unavailable, not sabotaged.

### 5. Score and kill test
**7/10.** Novelty 4/5 (R3), live event guaranteed, deterministic closure, judges remember "the app that told me the number was stale and then proved it". Kill test before Oct 8 (no project code): pull Sept–Oct 2025 OpenAQ/WAQI history for Dwarka-cluster stations, mask real dropouts, measure whether the neighbour+CAMS interval covers the returning value at 80 %+ with width under one CPCB band. If coverage needs intervals like 150–450, the Hold is noise; fall back to C. Also count station-hours unavailable per day across all 40 this week: under 5 % and there is no on-camera event.

---

## Response C

### 1. Which idea
A, but gutted. Everything else is dead on arrival: B needs the entrant to role-play a coach whose judgement is the product (the chair's own "weakest" category) and K1 already showed timing barely matters; C's verification belongs to MCD, not us; D is TracMyAir with a Delhi skin (R3 novelty 2.5); E is grapstatus.com; G has no applicant and no feed (R2: discom data RED). A is the only one whose user is real today (NSIT Dwarka 56 h stale, R2) and whose judge can be a deterministic official document.

But not the A in the table. Drop the counterfactual city AQI ("would-have-been 231"): that is a model deciding, dressed as a number, and it hands CPCB the rebuttal "your imputation is wrong". Drop the SES grievance to DPCC: nobody replies in four days, so every receipt reads "pending", which is worse than "Missed". Keep one thing: Trust Hold with a 17:00 close.

### 2. Fatal flaw and the fix
The flaw nobody is saying: **you have not verified that CPCB is dark.** R2 verified staleness on WAQI and OpenAQ, both *mirrors*; CPCB's own CCR endpoints returned 404 and were never read. "Confirms the staleness is upstream at CPCB" is an inference from two mirrors agreeing. If CPCB's SAMEER dashboard shows NSIT Dwarka live at 10:00, Sach Hawa is publicly accusing the regulator of an outage that is actually aqicn's. In the current political climate (R1, Hawa Ka Hisab) that is not a bug, it is a libel-shaped demo.

Fix: a station is "dark" only when WAQI, OpenAQ and data.gov.in all lack it **and** the 17:00 CPCB Bulletin PDF omits it from that day's station list (R2: bulletin GREEN, lists station count). Anything less is labelled "unreachable via public mirrors", never "offline". The bulletin is the judge; the receipt closes at 17:00 every day, deterministically.

### 3. The film
Second contrarian fact: R1 forecasts AQI 207/215 for Oct 5–6, so GRAP-I most likely drops *before* the clock starts Oct 8. Do not script the film around it. Script around the daily rhythm instead: 09:00, phone, "your nearest station last reported 31 h ago; neighbours + CAMS say act as if 280; Trust Hold ON"; entrant taps Hold (natural user, one device, no staging). 17:00, Lambda pulls the Bulletin PDF, Step Functions `waitForTaskToken` closes the receipt: "Bulletin listed 39 stations; yours absent; nearest listed station 262: Hold justified." Show Step Functions console, Textract on the PDF, Amplify URL. One labelled staged element only if the real station recovers mid-week.

### 4. Claim line
May say: "Station X absent from today's CPCB bulletin; last mirror reading N h old; you acted on neighbour value Y." Must never say: "CPCB switched it off", "the sprinkler did it", "true AQI was 231", or "the authority received your complaint".

### 5. Score and kill test
**5/10.** Memorable, real user, deterministic close; but it still looks like a dashboard, the human ack is thin, and the gap it exposes may be the mirrors' fault. Kill test before Oct 8: Playwright-render airquality.cpcb.gov.in daily Oct 5–7 and compare NSIT Dwarka / Anand Vihar timestamps against WAQI. If CPCB's own page is live while mirrors lag, the "dark station" premise is dead and A collapses to "aqicn is slow".

---

## Response D

### 1. Pick: A, reframed as "the Second Opinion" (Sach Hawa), with D's one decision as its only consumer surface
Everyone is pricing A as "a dashboard that is rude to CPCB." The upside being missed: A is the only idea on the table that is *already newsworthy before a line of code exists*. 796 station-hours pinned at 500, 9/37 stations alive on Diwali, a sprinkler aimed at the Anand Vihar monitor with 7.4k Reddit upvotes (R1, R3). R3's "genuinely open" verdict is explicit: no live tool logs availability or publishes "official vs would-have-been." Diwali falls Nov 8, four weeks after judging: the judges will *watch the thing you built become the story*. No other shortlist idea has a guaranteed second act. B is a lookup wearing a whistle; C competes with Green Delhi; G has no applicant. A is the one where the research is already the demo (R2 measured 56 h stale on NSIT Dwarka today; DTU dead 103 days).

Coin the vocabulary and judges will repeat it: **Dark Station**, **Trust Hold**, **the Would-Have-Been AQI**. Scaling slide: every CAAQMS in India (46 new stations promised, R1), every Indian city with a GRAP-like trigger, then any country whose stage-triggers run on a single official number.

### 2. Fatal flaw and fix
Flaw: "where is the human loop?" DPCC will not reply in four days. Fix: stop asking for the authority's ack and make the **feed itself the acknowledger**. The receipt is opened when the station goes dark and closed, deterministically, by Step Functions `waitForTaskToken` the moment the daily Bulletin PDF (17:00 IST, GREEN in R2) lists that station again, reporting the measured gap: "Dark 61 h; official 198, would-have-been 231; GRAP-I threshold crossed under both." The person whose day changes is the subscriber who got the Trust Hold and stayed in. That is a loop that closes on camera within hack week.

### 3. The film
0:00 phone, labelled "Harshdip, Dwarka resident": nearest station shows "last reading 56 h ago." 0:30 Trust Hold card: "Don't act on 150; act as if 230 (CAMS model + 3 neighbours)." Tap "Open receipt." 1:00 laptop: Step Functions console waiting on the token, EventBridge Scheduler pulling the 17:00 Bulletin, Lambda recomputing the Would-Have-Been AQI, DynamoDB ledger. 1:45 Bulletin arrives (real); receipt closes with the measured gap; SES email to DPCC grievance shown as sent. 2:15 public ledger page: all 40 stations, hours dark this week, "9/37 on Diwali 2025" as the historical anchor. 2:40 architecture diagram, cost line, "what fought back." No staging; the only label is on the model-imputed number.

### 4. Claim line
May say: "Station dark for N hours (measured). Official city AQI X. Would-have-been Y under stated imputation (model). Trust Hold issued at HH:MM. Missed: no fresh reading arrived." Never: "CPCB falsified," "the sprinkler caused this," or any AQI figure without its age and source.

### 5. Score and kill test
**7/10.** Novelty 4/5 (R3), three GREEN live feeds (R2), a built-in blog ("I audited Delhi's monitors for 4 days"), and a Diwali second act. Kill test before Oct 8: download 14 consecutive Bulletin PDFs and confirm the per-station table parses deterministically *and* that at least one station's dark window during Oct 1–7 is recoverable from WAQI timestamps. If the Bulletin does not list dropped stations by name, the closing receipt has no judge, and A dies.

---

## Response E

### 1. Which idea
**F, but built as D with A underneath, not A with D bolted on.** The pitch is one question a stranger grasps in five seconds: "Can I go outside right now?" Idea A alone is a dashboard about sensors; a judge seeing it cold thinks "a monitoring page for monitoring pages." Idea D alone is a fitness app. Together, the trust engine is *the reason the answer differs from the official number*, which is the only part a Delhi resident cares about: "my app says don't, the government number says fine, why?" That "why" is the whole story (R3: nobody public does it), but it belongs behind a tap, not on the home screen. B, C, E, G all require me to already know who a coach, an MCD zone, GRAP, or a discom is. I don't.

### 2. Fatal flaw and fix
Two products in one, with insider words everywhere: "counterfactual city AQI," "Trust Hold," "receipt," "ledger," "GRAP-I." Fifteen seconds in, I'd be lost. Fix: the home screen is one question, three answers (Go / Wait until ~10am / Stay in), one plain sentence underneath ("Your nearest official sensor has been silent for 56 hours; the three nearest working ones plus a satellite model say about 230, which means avoid exercise outdoors"). Drop the city-wide counterfactual from the product entirely; keep it as one line on an audit page. Rename every internal term to what it does: "receipt" becomes "how we did yesterday."

### 3. The film
Phone, 6 am, Dwarka, labelled "Harshdip, resident." Official app shows a stale timestamp. Tap "Can I run?" → "Not now. Your sensor is dark. Estimate 230. Try after 10 am." Cut to laptop, labelled "the back end": AWS console with a Step Functions execution sitting in wait, Lambda fetching CPCB, CAMS, FIRMS. Cut to 17:05: the daily bulletin PDF lands, the execution closes, phone shows "We said 230. The official bulletin for your area said 219. We were 11 off." Only staging: a time-lapse caption, nothing simulated. AWS on screen: Amplify PWA, Lambda, Step Functions, EventBridge, SES. Bedrock only to phrase the Hindi sentence, never to decide.

### 4. The claim line
May say: "Your sensor was silent. Our estimate was X from these sources. The evening official number was Y. We were off by Z / we missed." Must never say: "the real AQI is," "CPCB is hiding," "the sprinkler faked it," or anything about intent. Estimate, not truth. Gap, not accusation.

### 5. Score and kill test
**6/10.** Clear story, live during hack week, honest audit, but a hard rule: if a judge can't say the pitch back in one sentence, it loses to something simpler. Kill test before Oct 8 (no code): for Oct 5–7, hand-compute the neighbour-plus-CAMS estimate for NSIT Dwarka each morning and compare to that evening's bulletin. If it's off by more than ~50 AQI points on two of three days, "the number you can act on" is a number you can't act on, and the whole thing collapses. Second, cheaper: read the one-sentence pitch to someone outside Delhi and have them tell you what the app does.
