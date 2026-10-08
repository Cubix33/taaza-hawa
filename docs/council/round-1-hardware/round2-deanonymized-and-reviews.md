# Council Round 2: De-anonymized Mapping, Peer Reviews, Verified Facts

## Mapping (anonymized letter → advisor → pick)
- A = The Executor → C1 (teacher-only loop)
- B = The Contrarian → C2 reshaped around the clean reference cell
- C = The Podium Winner (thinks like the First Commit top-3) → C2 ("Smog Hold", "Proof of Wipe")
- D = The Outsider → C1 ("Open the Window, Ma'am")
- E = The First Principles Thinker → C2 rebuilt as "Saaf Twin"
- F = The Expansionist → C2 + "Smog Tax" ledger pitch + vendor loop

Vote: C2 ×4 (B, C, E, F), C1 ×2 (A, D). Full responses: round1-anonymized.md.

## Peer reviews (6 reviewers, different lenses)
| Reviewer lens | Strongest | Biggest blind spot | What everyone missed |
|---|---|---|---|
| Skeptical judge | **E** (reframes to "the 10-s event you can reproduce"; B has the best C1 attack) | **C**: still uses the satellite model as step 1 and a verification gate; Textract on screenshots = OCR as judge. F has the same OCR flaw plus a dev-facing "verified stamp in the AWS console" | **Shoot outdoors in real Delhi smog** so Smog Hold is real, not a lamp. **"+₹42/day" math fails**: a 3 kW system makes ~₹100/day, which would imply ~40% loss. Crowding is assumed without evidence |
| AWS Solutions Architect | **E** (clear service-per-job) | **D**: no AWS at all, and ignores that ventilating during GRAP raises PM | Bedrock model enabled + Hindi + quotas on day 1; show the *deployed* stack (Step Functions graph, CloudWatch, X-Ray); least-privilege IAM, per-device certs, Cognito; task-token timeout/heartbeat; persist the re-zeroed baseline; public CDK, cost guardrail |
| PV / electronics engineer | **B** (physics + honest re-zero), E close | **C**: a screenshot has no reference cell, so it can't separate dust from smog. F's "every rooftop measures haze" has the same flaw (installed systems have no reference) | **INA219 across a fixed resistor reads an operating point, not Isc.** Use a near-short shunt so current ∝ irradiance, match loads, normalise the two cheap panels at a clean baseline. **Talc ≠ uniform soiling**: series cells without bypass diodes make it act like partial shading, so the drop is non-linear and ₹ extrapolation from it is invalid. A wipe leaves film, so use a ≥0.97 threshold, not "snaps to 1.0". Halogen is hot/uneven, so clamp the mounts. LED flicker and spectrum are bad for silicon, so use halogen or sun. **Smog also soils** (black carbon on glass), so separate "haze in the air" from "grime on the glass". The fault branch can't be filmed (no inverter) |
| Environmental-impact researcher | **E** (honest evidence chain) | **D**: never asks if the action helps; "open window, number drops" fails in Delhi in October | **No net impact number.** 3 kW ≈ 12 kWh/day; 5% recovery ≈ 0.6 kWh/day ≈ 0.4 kg CO₂/day, small. Wet cleaning uses water. Need a net metric, a counterfactual cleaning schedule, and one real-field check. **Smog Hold (water not wasted) may be the most defensible environmental claim** |
| Product designer | **E** (two roles, one action each; panel closes the job, no photo) | **F**: persona is the aunty but it builds for policymakers; repeats the HaqCheck dev-UI mistake | Does the house help have a smartphone? WhatsApp/IVR beats a PWA. Teacher can't tap mid-lecture. **Onboarding** (who mounts the cell, pairs the ESP32, re-zeroes) is part of the design score. Test with one real Delhi household before Oct 8. Icon-first, large type, low literacy |
| Past winner (demo risk) | **E** (designed around reproducible proof, makes the right cuts) | **F**: assets can't be filmed (a vendor loop takes days; Smog Tax is pitch-only; OCR brings back AI-as-judge; console stamp = dev UI). C is milder: Textract + 3-check + satellite = more Saturday-night failure points | **Video storyboard + time budget + backup take**; English captions; **bench-test that the talc delta beats noise BEFORE committing**; hardware logistics; deploy URL; upload buffer; crowding unproven |

## Verified facts gathered during review (by the convener, web-sourced Oct 4)
1. **Under PM Surya Ghar, the installing vendor is responsible for *cleaning the panels* and all-inclusive O&M for 5 years at no cost to the consumer** (solar.delhi.gov.in O&M procedure page). REC guidelines: vendors must "provide free repair and maintenance for at least five years", run a helpline with a defined complaint timeline, and monitor system performance. Registering authorities can **de-register and penalise** vendors (Renewable Watch, Nov 2024). → The cleaning job has a contractually obliged actor: the vendor's technician.
2. **IEC 61724-1 §9.4** soiling ratio: compare the **short-circuit current** of a "Clean" and a "Test" device side by side. Isc is directly proportional to irradiance. An optical-transmittance alternative also exists (Kipp & Zonen, NRG, Campbell DustVue).
3. Water for cleaning: **7,000–20,000 L per MW per wash** (CEEW) ≈ **7–20 L per kW per wash**, so a 3 kW roof uses ~20–60 L per wash. 94% of India's solar capacity faces medium–high water risk.
4. Grid emission factor (CEA, FY2023-24): **0.727 tCO₂/MWh** weighted average.
5. Data feeds: Open-Meteo satellite radiation (Himawari-9, 10-min, ~30-min delay, free, covers Delhi); Open-Meteo air-quality (CAMS global: pm2_5, aerosol_optical_depth, 3-hourly, free).
6. PM Surya Ghar: 50.06 lakh households (Jul 2026). Delhi portal launched Sept 21, 2026. Industry: "99.99% of consumers stop monitoring after installation."
7. Honest money math: Delhi 3 kW ≈ 12 kWh/day; at ~₹6.5/kWh ≈ ₹78/day. A 25% soiling loss (3 weeks uncleaned) ≈ ₹19–20/day ≈ ₹600/month, plus ~2.2 kg CO₂/day of displaced grid power foregone.
