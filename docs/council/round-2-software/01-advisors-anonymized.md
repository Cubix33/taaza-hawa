# Round 2: Six advisor responses (anonymized A–F) + convener's verified data

Question: `00-framed-question.md` (software only; pick + shape the winning idea).

## Response A
**Pick S1, cut scope hard. S2 has no data, S4 has no access, S3 is the HaqCheck trap.**

**Minimum loop:** one school (near DTU's CPCB station, so it can be filmed on Oct 10), one class, one PE slot.
1. EventBridge Scheduler runs at 20:00 and 06:30.
2. A Lambda slot picker (pure, unit-tested) uses CAMS hourly data plus the 7-day station diurnal profile.
3. Step Functions sends the principal an SES email with Accept/Reject links and waits with `waitForTaskToken`.
4. Accept notifies the teacher.
5. At 18:00 a Lambda writes the **Proof of Breath** receipt from measured station data.
6. Hawa Hold covers GRAP III/IV or no clean slot. Bedrock only does wording, with an "AI बंद" fallback.

**Data, checked live today:**
- **Open-Meteo CAMS:** no key, hourly, 5-day forecast + `past_days`, IST, works for Delhi (~0.1° snap). Today: ~75–78 µg/m³ at 08:00 vs ~47–50 at 14:00.
- **OpenAQ v3:** 401 without a key. The key is free, ~87 Delhi locations, lag unverified.
- **Fallback:** data.gov.in CPCB real-time API (free key, latest snapshot only). Needs an hourly poller into DynamoDB, **started Thursday morning** or there's no measured history for the receipt.
- **GRAP stage:** manual, in SSM Parameter Store.
- **SES:** sandbox with verified inboxes. No SMS (DLT).

**AWS:** CDK; Scheduler, Lambda, Step Functions, DynamoDB, API Gateway, SES, Bedrock; Amplify PWA with a principal/teacher switcher.

**Before Oct 8:** keys, verify that the DTU/Mundka stations return PM2.5, Bedrock test, 4 SES inboxes, CDK bootstrap, recruit a teacher to film, storyboard.

**Risks:**
1. A wrong slot on camera. The receipt reports honestly; the 7-day measured profile is primary and CAMS is the tiebreak.
2. Station gaps or abnormal values. Take the median of the 3 nearest stations, flag "data missing" visibly, never interpolate silently.

## Response B
**Pick S1, narrowed to one class, one period, one day.** Take from S3: GRAP stage is a hard rule (III/IV forces Hawa Hold), and the PE teacher is the person who owes the action. Drop the parent note.

**Opening:** "It is 6:40 in the morning in Delhi. Assembly is at nine, PE is period one, and nine o'clock is the dirtiest air these children will breathe all day."

**On camera:**
- A real phone rings at 6:30. Amazon Connect speaks Hindi: "Class 7B PE: move from 9:00 to 12:20, about 38% less PM2.5 forecast. Press 1 to move." The principal presses 1.
- The teacher's phone: "Press 1 when the class is outside."
- The real-world change: a whistle at 12:20 on a real ground. Recruit one real school or coaching ground.
- Cut to the live CPCB curve with the 9 am peak happening while 7B stays indoors.

**Concepts:** Proof of Breath, Hawa Hold, Saaf Ghanta (the clean hour).

**Loop:**
- Step Functions `waitForTaskToken` for the principal, then the teacher. No answer by 8:15 → safe default Hawa Hold.
- At 18:00, Scheduler pulls measured data for the old vs new slot → "7B's dose ≈41% lower (measured, ×4.5 exercise multiplier)".
- A wrong forecast says so ("today the shift did not help"): the Beacon-style lesson.

**AWS:**
- Scheduler runs the evening plan, the 6:30 push and the 18:00 verify.
- The Lambda planner is deterministic, with GRAP as a hard override.
- Step Functions runs the human loop.
- Connect + Polly for the Hindi call, SNS as fallback.
- DynamoDB, an Amplify page (one Hindi sentence, one button), and Bedrock for Hindi wording only with an "AI बंद" badge.
- CDK, plus a replay mode playing a real Delhi day from last November against Moto. "Judge in 90 seconds".

**Worry:** Oct 8–11 may be "moderate" with a weak cycle, so live Proof of Breath shows 6%, not 40%. Replay covers the numbers but not the emotion. The bigger fear is a rival who films a real person whose day changes. Without a real teacher's whistle at 12:20, the "real-world change" is just a phone screen, and we become one more AQI dashboard.

## Response C
**S2, S3, S4 and S5 are all dead.**
- S2: synthetic data, the moment is a CSV upload.
- S3: HaqCheck again, verification by photo makes the AI the judge.
- S4: can't film a fire, MOSDAC access uncertain, Punjab persona, enforcement against farmers.
- S5: the loop never closes without meter data.

**S1 survives, with a flaw nobody has named.**
1. **If the daily cycle is as reliable as the dossier says, the answer is the same every day ("do PE after 11").** A laminated poster does that for free, and a judge will say so. If it isn't reliable, a 45 km CAMS forecast won't catch the difference. Either way the AWS loop adds nothing.
2. **The live data may be clean.** GRAP Stage I usually starts mid-to-late October, so Oct 8–11 may be "moderate". Schools are probably still on summer timings in October, so "9:00 assembly" may be wrong.
3. **No obliged actor.** A principal can ignore a suggestion.

**Reshape:**
1. **Sell the days that differ, not the cycle.** Stubble plume, GRAP stage change, anomalous clean or dirty mornings. Compute from 2024–25 station data how often "after 11" is the wrong call, and lead with that number. **If it is under ~15% of days, kill it.**
2. **Tie it to an obligation.** Encode the existing DoE/CAQM outdoor-activity advisories (which AQI band means no outdoor sport) as the rulebook, so the principal is complying with a rule, not taking advice.
3. **Make replay a feature.** A labelled "Replay: Nov 3 2025" next to live mode. Don't bet on the hack week turning bad.
4. **Proof of Breath must say what it measured.** "Station air, not lungs." A miss is reported as loudly as a win.

The real-world change is still only a tap on a phone. Only point 1 gives the tap enough weight.

## Response D
**Pick S1, aimed bigger: clean air as a resource you can schedule.** PE is the first booking. Assembly, bus routes, construction heavy-labour shifts and rider breaks come later. Build PE only. Vision line: "we gave Delhi's air a timetable."

**Saaf Twin patterns carried over:**
- **Deterministic judge:** CPCB measured readings + GRAP table + EPA exercise multipliers (×2.5 / ×4.5 / ×8.5). Bedrock writes only the Hindi line. If forecast and GRAP rule disagree, the rule wins.
- **Smog Hold → Hawa Hold.** Second coined name: the **Morning Myth**. Parents think early air is fresh, but the PM2.5 peak is 08–10 and the minimum 15–17.
- **Proof of Wipe → Proof of Breath:** an evening measured dose receipt. A wrong forecast says "today the shift did not help" and lowers that station's confidence score (verify-and-reopen).
- **Obliged actor:** the principal. The SC "gas chamber" remark and CAQM already tell schools to cut outdoor sports. The app is a compliant one-tap way to keep sports going.

**Hidden asset: a citywide Breath Ledger from hack-week data.**
- Geocode Delhi schools from OpenStreetMap (amenity=school); a data.gov.in Delhi school-location dataset couldn't be confirmed.
- Snap each school to its nearest CPCB station and replay the real measured readings from Oct 8–11.
- Closing shot: "This week, across N Delhi schools, a 9 am PE period cost children X% more PM2.5 than the cleanest slot in the same day." A labelled replay of measured data, and policy-sized evidence a DoE circular could act on.

## Response E
**Gets it in 15 seconds: S1, and only S1.** "Kids run outside at 9 am, which is the dirtiest hour. Move PE to noon." Understandable with the sound off.

**Confusing:**
- S2: "Saaf Twin" is a sequel I never saw, "soiling" sounds like a diaper, and the demo is a CSV upload.
- S3: three words I can't read.
- S4: the best fact in the file ("farmers now burn after the satellite passes"), but it's a slide deck.
- S5: acronym soup.

**Means nothing to me:** GRAP, CAQM, ToD, soiling, RWA, O&M, CPCB, CAMS, SAFAR, SAMEER, "boundary layer", µg/m³ with no comparison. Even "Saaf Hawa" until it's translated. "Proof of Breath" and "Hawa Hold" are jargon until shown.

**Remembered at 6 pm:**
- "Kids breathe 8× more air while sprinting, and you schedule it at the worst hour."
- The evening receipt: "7B breathed 38% less smog today, measured, not predicted." This one checks itself, and says so when it fails.

**Name and open:**
- A plain-English name first ("Clean Air PE", "Breathe Later", "Recess Shift"), with Saaf Hawa Hour as the subtitle.
- 0–5 s: a kid sprinting in smog, "9:00 am PE = Delhi's dirtiest hour".
- 5–15 s: the 6:30 phone, "Move 7B PE to 12:20, 38% cleaner air", Accept.
- 15–25 s: the teacher's phone. Then the evening receipt.
- Explain GRAP once as "Delhi's official smog-emergency levels"; never say "CAQM" on camera. Show the "keep PE indoors today" answer.

**Risk:** if the first frame is a map or chart, it gets filed with the AQI dashboards. Lead with the kid and the clock.

## Response F
**The watch drop was never about hardware.** It proved three things a judge can't otherwise check:
1. The trigger came from outside the team's control.
2. The system answered it unscripted.
3. The result was checkable against something independent.

**The software equivalent is a prediction that reality grades on camera.**
- The system commits to a timestamped claim at 6:30 ("PE at 12:20 ≈ 38% less PM2.5 than 9:00").
- Measured CPCB data, which the team doesn't control, then confirms or refutes it. Proof of Wipe stretched over hours.
- The air doesn't have to change dramatically; reality only has to give the grade. A visible miss ("today the shift did not help") increases credibility.

**Only S1 has all three:** an outside input, a human action, an independent measurement.

**Shape:**
1. **The receipts are the hero.** By video time there are 3 real days of forecast-vs-measured receipts. The film is a time-lapse: the 6:30 phone, then the 5 pm receipt linking to public CPCB/OpenAQ readings that judges can check.
2. **Pre-empt "just always move PE to the afternoon."** Some days have no clean slot (Hawa Hold) and some forecasts miss. Only a daily measured ledger tells a principal which kind of day it is. **The ledger is the product; the forecast is the input.**
3. **A live GRAP override is a bonus, not the plan.**
4. **Coin Proof of Breath.** AI writes the Hindi wording only, and the numbers never come from the LLM.

---

## Convener's verified data (added after the advisors answered; reviewers should use it)
**1. Poster kill-test (Response C's test), run on Oct–Dec 2025 hourly PM2.5 for DTU's grid cell.** Open-Meteo CAMS archive, **model data, not station measurements**; school window 08:00–13:59 IST, 92 days:

| Metric | Value |
|---|---|
| The cleanest school-hour slot falls at/after 11:00 | **95% of days** (so a fixed "after 11" poster is usually right about the *direction*) |
| A fixed 12:00 slot is >10% worse than that day's best school-hour slot | **37% of days** (the *which hour* choice matters) |
| Median reduction, best slot vs 9:00 | **41%** (IQR 32–51%) |
| Days with no school-hour slot below 90 µg/m³ (Hawa Hold candidates) | **12%** |
| Mean diurnal (µg/m³) | 0h 120 · 4h 110 · 8h 118 · 10h 91 · 12h 66 · 14h 58 · 16h 61 · 18h 99 · 22h 124 |

**2. School timings:** Delhi's *normal* (summer) opening is **7:30–8:00 AM** (Careers360). Winter timing (≥9 AM) applies in cold spells/winter; the exact switch date is unconfirmed. So in October, assembly/PE is likely **7:30–9:00**, even closer to the morning peak. Timetables must be entered per school, not assumed.

**3. Data access:** Open-Meteo CAMS is free with no key (A curled it). OpenAQ v3 needs a free key. data.gov.in CPCB is snapshot-only (needs an hourly poller).
