# Council Round 1: Anonymized Advisor Responses

**Question:** Which ONE idea (C1–C6, a merge, or something new) should become the detailed problem statement for WeMakeDevs × AWS Environmental Hacks (Oct 8–11 2026, Delhi; tracks Air / Heat & Water / Waste & Energy judged separately; 5,006 registered; ≤3-min video is all judges see), and how should it be shaped to win its track? Context: the student's previous entry (HaqCheck) lost on showing: 0 s of product in the video, no closed loop, Bedrock silently failed, UI built for devs. Candidates: C1 Classroom Air Captain (classroom PM/CO₂ sensor → one instruction to teacher → ack → verify), C2 "Dhool ya Dhuaan?" (rooftop solar drop: dust vs smog vs fault → cleaner job / vendor escalation → verified recovery), C3 Night Fire Watch, C4 Site Dust Co-pilot, C5 Ganda Paani (water contamination clusters), C6 Segregation proof. Evidence dossier: docs/research/01-idea-research-dossier.md.

---

## Response A
Pick: C1 Classroom Air Captain (Air), scoped to a teacher-only loop. Every component can be bought off the shelf, the on-camera event takes seconds and can be repeated for each take, and Delhi may be at GRAP levels during the hack week itself. C2 is good, but a mini panel under a lamp isn't a rooftop. The satellite expected-yield model also can't be validated on the demo device, so judges will see the gap. C4 needs a contractor persona and an anti-smog gun nobody can film. C3, C5 and C6 fail the on-camera test.

Minimum shippable loop (working by Sat night, recorded Sun 8am):
1. ESP32 sends PM2.5, CO₂ and RH to IoT Core every 10 s. An IoT Rule routes to Lambda, which writes to DynamoDB.
2. A deterministic rule table takes indoor PM/CO₂, outdoor AQI (OpenAQ, cached in S3) and the GRAP stage (set as config) and returns ONE Hindi instruction.
3. Step Functions sends it to the teacher's PWA and pauses with `waitForTaskToken`.
4. The teacher taps "हो गया".
5. The workflow waits 3 min, then checks for a ≥X% drop and marks the room VERIFIED. Otherwise EventBridge Scheduler escalates to the principal's single list view.
6. Bedrock only rewords the instruction. Hindi templates are the fallback, with a visible "AI बंद" badge.

Cut the parent view. CDK + Amplify.

BOM (order today; Robu.in takes 2–4 days, Lajpat Rai Market is the backup): ESP32 ×2 (~₹400 each), PMS5003 ×2 (~₹2,000 each), SCD40 (~₹3,000) or MH-Z19B (~₹1,800), BME280 (~₹300), 20 L clear box + 12V fan + HEPA cut-out + agarbatti (~₹800). Total ~₹9–10k.

Risk 1: ESP32 TLS/IoT Core certificates eat Thursday. Practise a throwaway hello-world before Oct 8 (that's learning). Fallback is a laptop serial bridge publishing over MQTT with the same certs.
Risk 2: readings don't drop fast enough on camera, so "verified" never fires. A real room takes 20+ min to clear agarbatti smoke. Shoot inside the box, where the fan clears it in ~90 s. Tune thresholds on Thursday and let the SCD40 warm up. Build the "not improved → escalate" branch first, because it's also good footage.

## Response B
C1 is the most attractive option and the most likely to lose. Three problems:
(a) The verification loop has nothing objective to check against. No government rule says how to trade CO₂ against PM2.5, so the "one instruction" comes from a threshold you invent. Your heuristic becomes the AI-as-authority. Worse, "ventilate 5 min" during GRAP raises PM: the teacher acks and the curve goes up, so the closed loop disproves itself on camera.
(b) Agarbatti next to a PMS sensor is the most-filmed shot in Indian air hackathons. With 5,006 entrants in GRAP season, expect a dozen in Air.
(c) A solo builder with no hardware track record has to flash firmware, set up IoT certs and do RH correction on day 1. That's the "Bedrock silently failed" risk again, in hardware.

C2 as written has a product/demo mismatch. The product compares satellite expected yield against inverter readings. Open-Meteo/CAMS daily error is about ±10–15% while soiling is 0.3–0.6%/day, so dust can't be separated from smog without weeks of data. There's no inverter API, so screenshot OCR becomes the AI judge. The demo is a tabletop panel under a lamp, where satellite data plays no part. Judges will notice.

The fix: make the clean reference cell the product and use satellite only as a sanity check. Use the IEC 61724-1 soiling ratio (soiled ÷ clean, against the post-clean baseline). Smog dims both equally, so the ratio stays ~1: "Dhuaan, don't clean." Dust drops only the panel: cleaner job → after-photo → ratio recovers, which is the verified closed loop. Inverter output far below the reference cell's prediction means a fault: a vendor complaint citing the 5-year clause, with EventBridge escalation. That gives two staged events on camera: a frosted sheet over both (no alarm), then talc on one (alarm). It's deterministic physics, and the AI writes only the Hindi message. Energy is probably the least crowded track, and the Delhi portal is two weeks old. Concede the weak spot up front: the reference cell itself gets dirty, so re-zero the baseline at every verified clean.

C3 can't be staged without lighting a fire. C4 is compliance theatre. C5 makes the AI the judge, and clustering needs a crowd. C6 is a cliché with no loop. Verdict: C2, reshaped around the reference cell. If the hardware ratio doesn't work by Friday there's no fallback idea worth switching to, so commit to parts now.

## Response C
Pick: C2 "Dhool ya Dhuaan?" in Waste & Energy. Tracks are judged separately. Air will have hundreds of AQI boards and classroom sensors, and C1 would be fighting fifty others for the same 20 seconds of judge attention. C2 passes every part of the winner filter in the least crowded track.

Opening line: "It is 8 in the morning in Dwarka. The solar app says 14 units, down from 25 in March. Sharma ji is about to send someone up to the roof with two buckets of water, for a problem water cannot fix."

On-camera moment: two mini panels under one lamp, each on an INA219 into an ESP32. One is the clean reference. Talc on the other → Hindi verdict "Dhool hai, dhuaan nahi. Abhi saaf karein: +₹42/din" → house help's phone buzzes, she taps "Shuru" → one wipe → the line climbs back.

Coined concepts: "Smog Hold" (the system tells you NOT to act: "don't clean, you'd waste 40 litres and ₹1,000", with satellite aerosol as evidence) and "Proof of Wipe" (a job is never closed on someone's word). Judges will repeat both. Saving money by doing nothing is the Sleep Contract inverted.

Verification loop:
1. Expected yield from Open-Meteo/CAMS irradiance + aerosol.
2. Actual output in via IoT Core.
3. The IEC 61724-1 soiling ratio deterministically classifies dust, smog or fault.
4. Step Functions `waitForTaskToken` sends the cleaner a job.
5. The verify loop refuses "recovered" until three checks pass: ratio ≥0.97 held for 10 min, actual/expected back at baseline, and an after-photo timestamped after the ack.
6. On a fault, Bedrock drafts a Hindi complaint citing the 5-year free-maintenance clause, and EventBridge Scheduler escalates after 48 h. Bedrock explains and drafts. It never classifies.

What would worry me as a past winner: a judge asking "is this a toy?" A lamp and coupons can look like a science fair. Close that in the first minute with one real Delhi rooftop: a real inverter screenshot from a neighbour's PM Surya Ghar system, read by Textract and run through the same classifier. A wrong call on real data costs the team. If the dust/smog split on that real screenshot holds up, I lose to this team.

## Response D
Pick C1, reshaped so the opening shot is a kid coughing, not a dashboard.

In 15 seconds, C1 lands right away. Kids in a smoky classroom, agarbatti near a box, a number jumps, the teacher's phone buzzes, she opens a window, the number drops. No context needed. Everyone has sat in a classroom, and "children breathing bad air" carries weight without explanation. I'd remember it at 6pm as "the agarbatti classroom one."

C2 needs 45 seconds of setup before I care: output dropped, three possible causes, satellite irradiance, aerosol, vendor maintenance contracts. "Dhool ya Dhuaan?" sounds nice but means nothing to non-Hindi speakers. "PM Surya Ghar" means nothing, and "PM" reads as PM2.5, which confuses things on an environment track. Dusting and cleaning a mini panel is a good physical demo, but "an engineer's diagnostic tool for solar owners" is a narrow persona, and a "deterministic classifier" sounds like a slide, not a story. Strong idea, weaker video.

C5 is clear (dirty water, neighbours report, it gets fixed), but there's no safe on-camera event, and the loop is closed by a utility you can't film. C3, C4 and C6 are forgettable: "site dust co-pilot" is B2B compliance, and segregation proof is too abstract to picture.

Jargon that means nothing to an outsider: GRAP, CAQM, DPCC, AQI stage. Cut them from the first 60 seconds and say "Delhi's emergency pollution level" on screen. "Compliance" and "principal view" are where the loop starts to sprawl: keep it to one teacher, one period, one ack.

Shape C1 to win:
1. Name it for the moment: "Open the Window, Ma'am" beats "Classroom Air Captain".
2. First 10 s: classroom, agarbatti, the spike, one plain-language instruction.
3. Middle: "Done" → the system re-reads → "Improved 40% in 6 minutes". That's the closed loop on camera.
4. Failure shot: the sensor goes offline and the UI says so loudly.
5. AWS: architecture for ≤10 s, with a four-word reason per arrow.

If the video can't show a real teacher-shaped person pressing the ack, C1 loses its edge. Cast someone.

## Response E
You're asking which problem matters most. What you actually have to solve is narrower: which 10-second physical event can you reproduce on demand, with one deterministic answer, in a track that won't have 400 lookalikes? HaqCheck didn't lose on the idea. It lost on showing. Pick the idea whose demo can't fail.

Judged that way, C1 is weaker than it looks. Agarbatti near a PM sensor gives noisy, humidity-skewed readings. "Verified improvement" means waiting minutes for room air to clear, and nobody can tell on camera whether the teacher's action or plain diffusion did it. Air will be packed with AQI sensors and GRAP dashboards, so you'd compete on polish in the crowd's favourite topic.

Pick C2, rebuilt around one physical fact: two identical cells, one kept clean and one exposed. Call it "Saaf Twin". That pair is the deterministic judge, and it's the IEC 61724-1 soiling ratio, not a model. Both drop together → smog ("don't clean, you'd waste X litres"). Only the exposed one drops → dust ("clean now, +₹42/day"). Both fine but inverter low → fault (pre-filled complaint citing the 5-year clause). The event is instant and repeatable: ESP32 + 2× INA219 + two mini panels under sun or a halogen lamp. Talc on one → owner's phone "Dhool hai" → cleaner's phone gets the job → wipe → ratio snaps to 1.0 and the job auto-closes. Recovery is verified by the panel, not a photo, so the AI is never the authority. Bedrock writes only the Hindi explanation and complaint text, both with a loud "unavailable" state.

Cuts: the satellite expected-yield model is the "how this scales to 50 lakh homes" slide, not the core, so build it only after the loop works. Vendor escalation is one pre-filled complaint plus one EventBridge timer. Two roles only: owner (one Hindi sentence, one button) and cleaner ("Saaf kar diya"). Step Functions `waitForTaskToken` waits on the cleaner, IoT Core takes the readings, DynamoDB is the log, and each service has a reason.

Why it wins: Waste & Energy is probably the least crowded track. The timing is real: smog season is when owners see output fall, and Delhi's rooftop-solar portal is two weeks old. The money is a concrete rupee figure, and kWh lost converts directly to coal burned. Buy panels, INA219s and an ESP32 before Oct 8. Get a rupee-recovery reading on camera on day 1.

## Response F
Pick C2 "Dhool ya Dhuaan?" in Waste & Energy. It's the most undervalued idea on the table.

Everyone sees C1 as the safe choice, and so will a few hundred Air-track entrants, which is the reason not to take it. Air will be full of AQI sensors and school dashboards, and Waste & Energy full of trash classifiers. A solar diagnosis idea built on a deterministic standard stands out alone. It also has a money moment judges feel: "+₹42/day: clean now", "don't clean, you'd waste 20 litres", "vendor owes you a free repair".

The upside nobody's pricing in: C2 is secretly an Air idea too. Every rooftop panel measures haze. The smog branch of the classifier separates irradiance lost to atmospheric haze from soiling losses. PM Surya Ghar has 50 lakh installs adding ~16k a day, so the same pipeline rolls up into a "Smog Tax" ledger: kWh and rupees Delhi rooftops lost to pollution this week, by neighbourhood. That turns the product into evidence for clean-air policy, with the Peters 2018 11.5% haze loss backed by live data. One sentence at the end of the video. Do not build it.

Second hidden asset: the vendor loop. The 5-year free-maintenance clause is an accountability gap nobody enforces, and 99.99% of owners stop monitoring. The fault branch files a complaint citing the clause, Step Functions `waitForTaskToken` waits for the vendor, and EventBridge Scheduler escalates if nobody responds. That's a real closed loop, the reason-per-service AWS design that scores.

Shape it:
- Persona: an aunty in Rohini, 9 am, looking at the inverter app (25 units in March, 14 now).
- Named concept: "Soiling Receipt", the IEC 61724-1 soiled-vs-clean reference ratio, so the AI never makes the call.
- On-camera: two mini panels. Talc on one → phone buzzes in Hindi → the house help's phone gets the job → wipe → ratio back to 1.0 → "verified" stamp in the real AWS console.
- AI's role: Bedrock reads inverter-app screenshots and explains in Hindi. It never classifies.
- Hardware: ESP32 + 2× INA219, ~₹1,500, bought before Oct 8.

The demo shows one feature. The pitch is a rooftop sensor network Delhi has already paid for and isn't using.
