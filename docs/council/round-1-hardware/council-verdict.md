# Council Verdict: Which problem statement wins? (Oct 4, 2026)

**Format:** LLM Council (Karpathy-style). 6 independent advisors (Contrarian, First Principles, Expansionist, Outsider, Executor, plus **Podium Winner**, an advisor that thinks like the First Commit top-3 teams), 6 anonymized peer reviews with distinct lenses (skeptical judge, AWS SA, PV/electronics engineer, environmental-impact researcher, product designer, past winner), then a Chairman synthesis.
**Inputs:** `../WINNER_PLAYBOOK.md`, `../research/01-idea-research-dossier.md`. **Rounds:** `round1-anonymized.md`, `round2-deanonymized-and-reviews.md`.

**Vote:** C2 (rooftop solar dust-vs-smog) ×4: Contrarian, First Principles, Expansionist, Podium Winner. C1 (classroom air) ×2: Outsider, Executor.
**Peer review "strongest":** First Principles (E) ×5, Contrarian (B) ×1.

---

## Where the Council Agrees
- **C3, C5, C6 dead.** No safe stageable event, and C5 makes AI the judge. C4 is compliance theatre.
- **AI never decides.** Every advisor put a deterministic source in charge. Bedrock explains and drafts only.
- **Showing beats thinking.** The winner is whichever idea has a 10-second physical event that repeats on demand and changes system state on camera.
- **E's "Saaf Twin" shape is strongest** (all 6 reviews): two roles, one action each, the sensor closes the job, and the satellite model is demoted to a scaling slide.
- **The C1 attack holds.** "Ventilate" during GRAP raises indoor PM2.5, so the loop disproves itself on camera, and no government rule arbitrates CO₂ vs PM.

## Where the Council Clashes
- **C1 vs C2 (A, D vs B, C, E, F).** D is right that a classroom lands in 15 s and solar needs setup. But crowding is assumed, not proven, by both camps. C2 wins on defensibility, not crowd-avoidance: its physics can't contradict itself on camera, and C1's can.
- **Role of satellite.** C uses expected yield as a verification gate. B and E make it a sanity check. CAMS/Open-Meteo ±10–15% error swamps 0.3–0.6%/day soiling, so B and E win.
- **Screenshots/OCR.** C and F want Textract or Bedrock reading inverter screenshots. A screenshot has no reference cell, so it can't separate dust from smog. Cut.
- **Photo vs sensor closure.** C wants an after-photo gate, E wants the panel alone. The panel wins.

## Blind Spots the Council Caught
1. An INA219 across a load reads an operating point, not Isc. IEC 61724-1 §9.4 compares **short-circuit currents**.
2. Talc on a series string is partial shading: non-linear, so ₹ extrapolation is invalid.
3. Smog also soils the glass (black carbon). "Haze in the air" and "grime on the glass" are different branches.
4. ₹42/day was wrong. The honest figure is about ₹20/day.
5. Who cleans was wrong: under PM Surya Ghar the **empanelled vendor must clean and maintain free for 5 years**. The house help is the wrong actor.
6. Smog Hold (water not wasted) is the most defensible environmental claim.
7. Onboarding (who mounts, pairs, re-zeroes) is part of the design score.

## The Recommendation
**Build C2 as "Saaf Twin: Dhool ya Dhuaan?" in the Waste & Energy track.** The Chairman diverges from the majority on three points: the cleaner is the vendor technician, the fault branch is cut, and Smog Hold is redefined as haze-vs-grime.

- **Persona/moment:** Sharma ji, Dwarka, 8 am, late October. The inverter app shows 14 units vs 25 in March. He's about to pay ₹1,000 and use 40 L of water to wash the roof, but his vendor owes him that cleaning free.
- **Deterministic judge:**
  - Two matched mini panels (same batch) side by side at roof tilt.
  - **The reference stays clean via a servo shutter**: it is covered and opens 60 s every 15 min, 10:00–14:00 (~95% less exposure), and is re-zeroed at every verified clean (the technician wipes both).
  - **Measure Isc properly:** each panel goes into an INA219 with a 0.1 Ω shunt as a near-short (a few mV burden vs ~6 V Voc).
  - SR = (Isc_test / Isc_ref) ÷ k, where k is the ratio at the last clean. Use the median of the shutter-open windows over one noon block (60 s in the demo).
  - SR ≥ 0.97 clean · 0.90–0.97 watch · <0.90 sustained = **Dhool** (raise job).
  - **Smog Hold** = SR ≥ 0.97 AND Isc_ref < 80% of a deterministic clear-sky model from solar geometry: both panels are dimmed by the air → "Dhuaan hai, saaf mat karo, ~40 L bachaaye". CAMS AOD is shown as evidence, never as the gate.
  - On camera use a uniform diffuser (sieved even dust or a matte film over the whole test panel), not a talc smear. A frosted sheet over both stages Smog Hold. Film outdoors in real haze if possible, halogen otherwise.
- **Closed loop:**
  1. Dhool → owner gets one Hindi sentence and one button, "Vendor ko bulao".
  2. A vendor ticket cites the free 5-yr O&M clause, and Step Functions waits on `waitForTaskToken` (timeout + heartbeat).
  3. The technician's one-screen PWA has a "Saaf kar diya" button.
  4. **Proof of Wipe**: the job closes only if SR ≥ 0.97 holds for 10 min (60 s in the demo). If they ack and SR doesn't recover, the ticket reopens and says so.
  5. The owner gets a receipt.
  6. No response within the helpline window (48 h, compressed for the demo) → EventBridge Scheduler escalation with a pre-filled complaint to the registering authority.
- **Fault branch: cut** (needs inverter data, not filmable). One line in the closing.
- **Bedrock:** writes the Hindi/English explanation and the vendor/escalation text only. It never classifies, reads screenshots, or closes jobs. A visible "AI बंद" badge and labelled templates cover outages.
- **AWS:** IoT Core + Rule (per-device-cert MQTT → Lambda, no server) · Lambda (deterministic SR classifier) · DynamoDB (readings TTL, persisted baselines k, tickets, audit) · Step Functions (free human wait via task token) · EventBridge Scheduler (one-off escalation timer per ticket) · Bedrock (language only) · SES sandbox with verified recipients (vendor ticket; SMS blocked by DLT) · CDK + Amplify (one-command deploy) · CloudWatch (`/health/deep`, alarms).
- **Cut:** satellite yield as gate, screenshot OCR, Smog Tax build (one pitch sentence max), fault branch, house-help persona, photo gates, policy dashboards, ₹42.
- **Honest impact:**
  - 3 kW Delhi roof ≈ 12 kWh/day ≈ ₹78/day.
  - 25% soiling ≈ ₹20/day (~₹600/month) and ~2.2 kg CO₂/day (3 kWh × 0.727 t/MWh).
  - Cleaning is already paid for, so recovery is pure upside.
  - Each Smog Hold saves 20–60 L of water per avoided wash.
  - 50 lakh households is a closing line, not a measured claim.
- **Named concepts:** Saaf Twin, Smog Hold, Proof of Wipe.
- **Riskiest assumptions + kill-tests before Oct 8 (hardware/field only, no project code):**
  1. Cheap-twin Isc ratio is stable. Multimeter (10 A range) on both panels at 10:00/12:00/14:00. Kill if the normalized ratio drifts >2%, or an even dust layer gives <8% drop.
  2. Smog Hold is real in Delhi air. On a hazy noon, compare reference Isc to clear-sky. Kill if there's no ≥10% deficit while the ratio stays ≥0.97. Then film Smog Hold with a frosted sheet and say so on screen.
  3. Owners don't get the free cleaning they're owed. Phone 3 Delhi PM Surya Ghar owners and 1 empanelled vendor helpline. If vendors already clean monthly reliably, reframe as Proof of Wipe (verifying vendor visits actually happened).

## The One Thing to Do First
Today, buy two identical 6 V mini panels (same batch), two INA219s, an ESP32, an SG90 servo, and a multimeter. On Oct 5 at noon, run kill-test 1 outdoors.
