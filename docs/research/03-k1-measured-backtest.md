# K1: measured-data backtest of Right Hour PE (Oct 4, 2026)

**Question:** is the "Two-Peak Problem" real in *measured* CPCB data, so that the best PE hour moves day to day and a fixed-hour poster loses?
**Verdict: no. K1 did not validate the daily-swap product.** Measured data lands in the *downgrade* zone, and the swap rule would fire on only ~4–6% of days.

## Method
- **Data:** OpenAQ v3 hourly PM2.5 and O₃ (CPCB/DPCC stations) for **DTU, Mundka, Narela, Rohini**, Oct 1 – Dec 31 2025 (**81 usable days**). 2024 returned no data for these sensor IDs, so it is one season only.
- **Score:** hourly Breath Score = max(CPCB sub-index PM2.5, sub-index O₃). The O₃ sub-index applies the 8-hour scale to hourly values, as a proxy.
- **Per slot:** median across the 4 stations. Candidate PE slots are 08:00–13:00 hour-starts.
- **Regret** = score of a fixed hour minus that day's best slot. The poster is the best *fixed* hour.
- **Heat cap:** ERA5 feels-like ≥35 °C (via Open-Meteo archive).
- Script: `scratchpad/k1.py` (reproducible; key in the git-ignored `.env`).

## Results
| Metric | Result |
|---|---|
| Best fixed poster | **13:00**, the last school slot |
| Poster wrong by >25 AQI points (combined, 4-station median) | **19% of days** (PM2.5 only 16%; with heat cap 19%) |
| Per station alone | DTU 26% · Mundka 17% · Narela 19% · Rohini 16% |
| Swap rule fires (swap only if best beats current slot AND poster by ≥25) | **6%** of days if PE is at 08:00 · **4%** if at 09:00 |
| By month: poster wrong >25 pts | Oct 18% · Nov **0%** · Dec 37% |
| Early-Oct (Oct 1–15) best hour | spread 8–13:00, mean score 143 at 08:00 vs 88 at 13:00 |
| Hawa Hold days (every slot >200) | Oct 7/28 · **Nov 23/26** · **Dec 25/27** · Oct 1–15: **0/15** |
| Measured mean PM2.5 (4 stations) | 08:00 **229** → 12:00 164 → 14:00 **129** µg/m³ |
| Measured mean O₃ (4 stations) | 08:00 16 → 14:00 **92** µg/m³ |

## The ozone result (why the earlier numbers were wrong)
| DTU, 13:00 | Mean O₃ | Share of days >100 µg/m³ |
|---|---|---|
| **CAMS model** | **191** | 100% |
| **Measured** | **37** | 6% |

Measured midday O₃ at 13:00 by station: DTU 37 · Mundka 84 · Narela 106 · **Rohini 136** (33% of days >168).
The model overstated ozone ~5× at DTU. **The "49% of days" figure and the "Two-Peak Problem" in the earlier model backtest were a model artifact.** Measured PM2.5 dominates the combined score almost everywhere, so ozone only matters at some stations (Rohini).

## Interpretation (honest)
1. **Under our own thresholds** (≥20% pass · 10–20% downgrade · <10% pivot) the result is **downgrade**. Ignoring the single-station DTU result, it sits at the upper edge of the zone.
2. **The headline feature barely fires.** "Move PE to a better hour" would be recommended on roughly 1 day in 20, because PM2.5 usually falls through the morning and the last slot is nearly always best.
3. **Hawa Hold dominates Nov–Dec.** On ~88% of Nov–Dec days every school-hour slot scored above 200. That overlaps the Supreme Court's existing direction to postpone outdoor school sport in Nov–Dec, so the app would add little there, and Hawa Hold on ~2 days in 3 is a policy statement, not a daily decision.
4. **Hack week (early October) looks mild:** no Hawa Hold days in Oct 1–15, and scores of ~140 at 08:00 vs ~90 at 13:00. The live demo would mostly say "keep your timetable" or "late slot".

## Caveats
- One season (81 days); 2024 not retrievable with these sensor IDs.
- Hourly proxy, not an official AQI; O₃ is an 8-hour pollutant.
- The poster hour is chosen in-sample (one parameter, so the bias is small and favours the poster).
- Station air, not schoolyard air.
- **K3 not run:** the day-ahead *forecastability* of the best slot. With a forecast, the swap would fire even less.
- Many schools can't place all PE in the last period; that practical limit isn't modelled.

## Consequences for the plan
- Right Hour PE as a *daily swap* is **not a winner-grade product** on this evidence.
- The fallback in `PROBLEM_STATEMENT.md` §10 ("Poster + exceptions") applies, but exceptions are not rare in Nov–Dec (Hawa Hold ~2/3 of days), and in early October there are almost none. That is a weak live demo.
- Candidate next step: test **"Smoke Day Forecast"** (satellite fire counts in Punjab/Haryana + wind direction → next-day Delhi PM2.5 spike). That question varies daily and cannot be answered by a poster. It needs a free NASA FIRMS MAP_KEY.
