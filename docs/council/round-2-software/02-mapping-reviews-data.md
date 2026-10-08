# Round 2: Mapping, peer reviews, and convener's additional data

## Mapping
- A = Executor → S1, scoped; email + PWA; station poller
- B = Podium Winner → S1; Connect Hindi call + press 1; real whistle
- C = Contrarian → S1 survives with the poster kill-test, an obligation tie-in, replay, honest labels
- D = Expansionist → S1 + "air has a timetable"; Morning Myth; citywide Breath Ledger
- E = Outsider → S1; plain-English name; kid + clock first
- F = First Principles → S1 as "a prediction reality grades on camera"; the ledger is the product

**Vote: S1 ×6.** S2–S5 rejected by everyone.

## Peer reviews
| Lens | Strongest | Blind spot | What all missed |
|---|---|---|---|
| Skeptical judge | **F** (C runner-up) | **B**: "nine o'clock" is factually wrong for October (7:30–8:00); Connect in India. D: a citywide map = scope creep / looks like dashboards | **Wrong baseline.** Compare to a free "after 11" poster, not to 9:00. 41% is CAMS vs CAMS, not measured. Moving PE is a timetable *swap*. Noon heat |
| AWS SA | **A** (every service load-bearing, poller decision) | **B**: **Amazon Connect does not support outbound calling / custom caller ID for India; Indian numbers need docs + 2–6 weeks (up to 60 days)** (AWS re:Post). The SNS fallback hits DLT | **Email link scanners (Safe Links) auto-click GET links** → use a confirm page + POST. Standard (not Express) workflow for task tokens; store a short id, not the raw token, in URLs. **The receipt must read measured station data, never CAMS.** Scheduler timezone Asia/Kolkata; Bedrock availability in ap-south-1 |
| Air scientist | **C** | B/E: **"dirtiest hour all day" is false** (22:00/00:00 are higher; true only within school hours). An identical-activity ×4.5 multiplier cancels. **The kill-test is circular** (CAMS vs CAMS). CAMS global ≈0.4°, underestimates post-monsoon IGP PM2.5 and blurs timing. A 10% difference is below CAMS error and BAM noise (±10–15 µg/m³) | **Ozone and heat peak at midday** (October O₃ exceedances; ~33–35 °C). **Indoor I/O ratio 0.7–1.0, so "indoors" ≠ clean.** Report the net counterfactual (the moved sedentary time goes into the 9:00 air). Roadside schoolyards spike above station readings |
| Impact researcher | **C** (F second) | **B/E/D dose claims**: station ≠ inhaled. **Over a full day a 41% cut in one 40-min PE period ≈ 4–5% of daily inhaled dose.** Say it | **Adoption:** DoE double shifts, fixed teacher allocation, DoE acts via blanket circulars → government schools via DoE evidence, private schools opt in. **D's ledger is the adoption asset.** Noon heat |
| Product designer | **B** (6:30 call, press 1, one Hindi sentence, Hawa Hold default) | **A**: principals don't read SES at 6:30; the switcher is a dev view. D serves policy, not an actor | **WhatsApp** is where principals and staff live (templates need Meta approval, so apply early); the call is a fallback. **Swap within the class's same-day timetable**, mind ground capacity. 5-minute setup (PE periods per class) or a timetable photo. **Decide the night before (20:00), confirm at 6:30.** Per-school language toggle. Teacher needs class/period/indoor plan. A parent line to forward to class groups |
| Past winner | **F** (C second) | **B**: the 9:00 line is wrong; recruiting a school is a last-day dependency | **Receipts mostly prove the diurnal curve.** Score every receipt *against the poster baseline*. ~8 AWS services vs 12/17. **The memorable moment = 6:30 action + the 5 pm receipt that links to public data and beats or admits missing the poster. "Podium yes, first not sure. Press-1 is Suraksha's second beat."** |

## Convener's additional data (CAMS model + ERA5-based archive via Open-Meteo, DTU grid cell, Oct–Dec 2025, school window 08:00–13:59 IST, 92 days)
**A. PM2.5-only: a fixed poster is almost as good as daily choice**
| Fixed poster | Mean extra PM2.5 cut from daily choice | Days daily choice >10% better |
|---|---|---|
| PE @ 11:00 | 18.8% | 73% |
| PE @ 12:00 | 8.0% | 37% |
| **PE @ 13:00** | **1.2%** | **3%** |

→ **For PM2.5 alone, "always PE in the last period" ≈ optimal.** The Contrarian's poster objection is essentially *confirmed* for PM2.5-only.

**B. Ozone and heat at midday (CAMS O₃; CAMS is known to overestimate surface O₃ over South Asia, so it must be checked against CPCB station O₃):**
| Month | O₃ @08 mean | O₃ @13 mean (max) | Days O₃@13 > 100 µg/m³ | Feels-like @13 mean (days >35 °C) |
|---|---|---|---|---|
| Oct 2025 | 62 | 188 (229) | 31/31 | 32.2 °C (5) |
| Nov 2025 | 44 | 189 (282) | 30/30 | 24.9 °C (0) |
| Dec 2025 | 46 | 196 (288) | 31/31 | 20.7 °C (0) |

**C. Combined Indian AQI (max of PM2.5 and O₃ sub-indices, hourly proxy): the best hour MOVES**
- Best school hour across 92 days: 08:00 ×11 · 09:00 ×15 · **10:00 ×27** · 11:00 ×21 · 12:00 ×7 · 13:00 ×11.
- Best fixed poster (10:00) still has a regret >25 AQI points on **45/92 days (49%)**. 13:00 is the worst fixed slot (69/92 days).

→ **If CAMS ozone is roughly right, the daily decision is genuinely non-trivial ("the two-peak problem": PM2.5 peaks in the morning, O₃ at midday), and a poster cannot solve it.** If CAMS ozone is strongly biased high, the case collapses back toward the poster. **This is the #1 kill-test: re-run A–C on measured CPCB station PM2.5 + O₃ (OpenAQ v3, free key) for 2024 and 2025 before Oct 8.**

**D. School timings:** summer (normal) opening is 7:30–8:00 AM; winter ≥9 AM in cold spells (switch date unconfirmed). Enter the timetable per school.
