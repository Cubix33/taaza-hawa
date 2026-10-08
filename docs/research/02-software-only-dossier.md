# Software-Only Idea Dossier (Oct 4, 2026). Round 2

**New hard constraint (from the user):** software only. No custom hardware, no sensors to buy or wire. Phones, laptops, public data, AWS and email are fine.
**Kept as inspiration:** Saaf Twin (`../PROBLEM_STATEMENT_saaf-twin-hardware.md`). Its strongest *patterns*:
1. A deterministic judge (physics/standards), never the AI.
2. **Smog Hold**: a coined concept that tells people *not* to act, or to act *differently*.
3. **Proof of Wipe**: the outcome is verified by an independent measurement *after* the human acts, and the ticket reopens if it didn't work.
4. An actor who is *already obliged* to act (the vendor's 5-yr clause).
5. Honest, sourced numbers.

## The target problem in software-only form
A high-scoring system must have an **on-camera event where the real world changes**. With no hardware, the event must come from:
- **The real world's own data, live during the hack week.** Delhi enters stubble/GRAP season Oct 8–11. Air stations, satellites and CAQM orders change daily.
- **Real phones and inboxes.** A notification at 6:30 am on a real phone, a real email, a real tap.
- **Verification against measured data afterwards** (the software analogue of the panel confirming the wipe).

Filter (same as before): **P** person+hour+place · **E** on-camera event · **L** closed loop + human ack · **D** deterministic truth, AI not the judge · **A** each AWS service has a reason · **X** demo-able in 4 days.

---

## S1. Saaf Hawa Hour: move school outdoor time to the cleanest hour (Air)
**Moment:** a Delhi school principal at 6:45 am in late October. Assembly is at 9:00 and Class 7's PE is period 1. Is that the worst hour of the day to make children breathe hard outside?

**Evidence**
- **Delhi PM2.5 has a strong daily cycle**: maximum around midnight, **a local maximum 08:00–10:00 LT**, and **minimum 15:00–17:00 LT**. In November the average gap between stations is 400 µg/m³ at 6 am vs 45 µg/m³ at 6 pm. The cause is the shallow night boundary layer (<200 m) and calm winds (<1 m/s) in the early morning (Sci. Reports 2020, doi:10.1038/s41598-020-70179-8; EGU abstracts; Mongabay 2026).
- **Winter school timings:** no school starts before 9 am. General shift is 9–1, morning 9–12:30, evening 1–5 (Business Standard / Careers360). So assembly and period-1 PE fall inside the **08–10 local peak**, while evening-shift schools have access to the **15–17 minimum**.
- **Exercise multiplies inhaled dose:** children's inhalation is **×2.5 light, ×4.5 moderate, ×8.5 high-intensity** vs sedentary (US EPA Exposure Factors Handbook, via WA DOH 2023).
- **The current system is all-or-nothing:**
  - GRAP III/IV closes or hybridises classes, sometimes for 15 days (CEEW).
  - The SC said outdoor sports in Nov–Dec are "putting students in a gas chamber", and CAQM found schools *continuing* outdoor sports despite instructions (Tribune).
  - On GRAP I/II days nothing tells a school *when* in the day to go outside.
- **Existing tools are city-level:** SAFAR gives 1–3 day forecasts + generic advisories; SAMEER gives hourly AQI per city. Neither gives a per-school timetable action, a loop, or a verified outcome.

**Data (all free, software only):**
- CPCB stations via OpenAQ v3 (free key, hourly) or aqicn.
- CAMS hourly PM2.5 forecast via Open-Meteo Air Quality (free, no key).
- GRAP stage from CAQM orders (manual config or parsed PDF).

**Loop:**
1. Each evening, a forecast of hourly PM2.5 at the school's nearest station plus the GRAP rulebook (III/IV = no outdoor) produces tomorrow's "clean slots".
2. At 6:30 am the principal gets ONE suggestion: "Move PE (7B) from 9:00 to 12:20, about 38% less PM2.5 forecast", and accepts or rejects with one tap.
3. The PE teacher and class monitors are notified, and parents get an optional note.
4. **Proof of Breath** that evening: the *measured* station data for the old slot vs the new slot gives "7B breathed ~X% less PM2.5 today (measured, not forecast)". If the forecast was wrong, it says so honestly ("today the shift did not help").
5. **Smog Hold analogue, "Hawa Hold":** no clean slot → "keep PE indoors today", with the reason.

**On-camera:** a real phone at 6:30 am with **live Delhi data from the hack week**, the principal's tap, the teacher's phone, then the evening Proof-of-Breath receipt from real CPCB numbers. A split screen shows principal + teacher (two roles).

**Risks:**
- Forecast error at school scale (CAMS is 45 km global for India). Mitigation: use station-measured diurnal profiles from the last 7 days plus the CAMS shape; verification is always on *measured* data.
- Timetable swaps aren't free (periods are fixed). Mitigation: swap within the same day only.
- It's still the Air track (crowded). Differentiation: nobody else does *when*, plus measured proof.

## S2. Virtual Saaf Twin: software-only rooftop-solar soiling via neighbour comparison (Waste & Energy; Saaf Twin inspired)
**Idea:** replace the physical reference panel with a **neighbouring rooftop that was just cleaned**. Same air, same sun → smog cancels in the ratio, dust doesn't. A vendor's O&M fleet in one locality is the data source (inverter cloud exports / CSV upload).

**Evidence:** everything in the Saaf Twin dossier (50 lakh homes, vendor owes 5-yr free cleaning, 99.99% stop monitoring, soiling from power data arXiv:2209.09457). Peer comparison is a known fleet-monitoring technique.

**Loop:**
1. A vendor uploads fleet daily kWh plus cleaning dates, or connects an inverter cloud.
2. Each site's ratio vs a recently-cleaned neighbour gives Dust / Smog Hold / fault.
3. A cleaning job goes out, and the ratio recovery verifies it (Proof of Wipe).

**Risks:**
- **No real Delhi fleet data available to us in 4 days.** A synthetic fleet = "toy".
- Daily kWh noise.
- Persona = vendor ops manager, not a household.
- On-camera = a CSV upload (weak).

## S3. GRAP Order Runner for small polluters (Air)
**Idea:** when CAQM moves GRAP stages, specific small actors get *their* obligations:
- Stage II bans coal/firewood in tandoors at hotels/eateries and restricts DG sets.
- Stage III/IV hit construction.

Parse the order, then each registered actor gets one instruction and acks. Citizens can verify with a photo.

**Risks:** Pure-rules trap (a rules engine telling people rules with no action); verification depends on photos (AI-as-judge) or on nothing; enforcement-flavoured persona.

## S4. Evening Fire Watch: the satellite blind spot (Air)
**Evidence:** in 2025 farmers shifted burning to after 3 pm, after the MODIS/VIIRS overpasses (10:30–13:30). ">90% of large farm fires in Punjab now occur after 3 pm, vs 3% in 2021" (NASA via IANS/Morung Express, Dec 2025). PRSC → SMS to officers relies on those overpasses.
**Idea:** use geostationary fire products (ISRO MOSDAC INSAT-3DR, or Meteosat IODC) to catch evening fires → officer dispatch → next-pass verification.
**Risks:** data access (MOSDAC registration and latency), science-heavy, a Punjab persona we can't film, enforcement against farmers, can't stage a fire.

## S5. Solar-Hour Society Pump Scheduler (Heat & Water / Energy)
**Idea:** RWAs pump water to overhead tanks (a big load). Under the Time-of-Day tariff (solar hours 10–20% cheaper, peak 10–20% dearer; residential from Apr 2025, with smart meters), schedule pumping in solar hours and track the overflow waste.
**Risks:** verification needs meter/pump data (hardware or a utility API); weak on-camera; persona = RWA secretary.

---

## Quick filter scores (convener's read; the council decides)
| | P | E (software) | L | D | A | X | Notes |
|---|---|---|---|---|---|---|---|
| S1 Saaf Hawa Hour | ✓ principal 6:45 am | ✓ live hack-week data + real phones + measured receipt | ✓ accept → teacher → measured proof | ✓ station data + GRAP rules + dose formula | ✓ | ✓ | Air track crowded; forecast error |
| S2 Virtual Saaf Twin | ~ vendor ops | ✗ CSV | ✓ | ✓ | ✓ | ✗ no real data | Keeps the twin idea but becomes a toy without fleet data |
| S3 GRAP Runner | ~ | ~ | ~ | ✓ rules | ✓ | ✓ | Rules-only trap (no closed loop) |
| S4 Evening Fire Watch | ✗ | ~ | ~ | ✓ satellite | ✓ | ✗ data access | Great insight, risky build |
| S5 Pump Scheduler | ~ | ✗ | ~ | ✓ tariff | ✓ | ~ | Weak verification |

## Sources
- Sci. Reports 2020 (doi:10.1038/s41598-020-70179-8)
- EGU2019-2090, EGU22-9142
- Mongabay India (Mar 2026)
- Business Standard / Careers360 (Delhi winter school timings)
- CEEW (school disruption)
- Tribune (SC/CAQM outdoor sports)
- WA DOH 2023, citing the US EPA Exposure Factors Handbook (inhalation multipliers)
- drishtiias / App Store (SAFAR, SAMEER)
- docs.openaq.org (OpenAQ v3 free key)
- open-meteo.com (Air Quality API)
- IANS / Morung Express (Dec 2025, evening fires)
- Business Standard (PRSC SMS alerts)
- DTNext / Swarajya (ToD tariff)
- Saaf Twin dossier sources (`01-idea-research-dossier.md`)
