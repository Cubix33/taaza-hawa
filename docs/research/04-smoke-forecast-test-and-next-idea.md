# Smoke Day Forecast test + what to build instead (Oct 4, 2026)

## 1. Test: can next-day Delhi smoke be predicted usefully (so a "Smoke Day Forecast" product has value)?
**Data:** measured daily-mean PM2.5 (median of DTU, Mundka, Narela, Rohini; OpenAQ/CPCB), Oct 1–Dec 31 2025, 89 days / 85 consecutive pairs. Wind speed/direction and boundary-layer height from ERA5 (Open-Meteo). **Fire counts NOT tested:** the FIRMS archive needs a free MAP_KEY. Only the live 7-day file is open. Wind used is *actual* next-day wind, an upper bound on any forecast.

| Metric | Result |
|---|---|
| Daily PM2.5 over the season | mean **209**, median 216, range 21–480 µg/m³ |
| Share of days with daily mean ≥200 | **55%** |
| Correlation, today vs tomorrow | **0.83** |
| R² predicting tomorrow, persistence only | **0.69** |
| + wind speed + boundary-layer height | 0.72 (+0.03) |
| + NW-wind share | 0.72 (+0.00) |
| "Bad day ≥200" call by simply copying today | **82% correct** |
| Overnight flips of bad/not-bad | **18%** of days (15/85) |
| Spike days (+60 µg/m³ vs yesterday) | **11 of 85 (13%)** |
| NW-wind share of hours | Oct 57% · Nov 75% · Dec 68% |

**Read:** next-day smoke is mostly "tomorrow looks like today." Even perfect wind adds ~3 points of R². Fire counts could still help on the ~13% spike days (transport lag), but the headroom is small, and Delhi already has official forecasts (IITM decision-support system, SAFAR, CAQM). **A "Smoke Day Forecast" does not look winner-grade.** (I earlier suggested it "can't collapse into a poster"; the data says it can collapse into "tomorrow ≈ today".)

## 2. Live-data risk (affects every real-time idea)
OpenAQ's CPCB feed was **~46 h stale** on Oct 4 (12:37 IST): the latest reading for DTU, Mundka and Rohini was Oct 2 14:00 IST. Unknown whether that is a temporary stall or normal lag. Before building on it:
- **Watch it daily until Oct 7.**
- Prepare the fallbacks: data.gov.in CPCB snapshot poller (free key) and the CAMS model (always fresh, but biased).
- Show data age on screen. Any "measured receipt" must say "awaiting CPCB data" when stale.

## 3. Pattern across both kill-tests
In Delhi's Oct–Dec season the air is **persistently bad and mostly predictable from today**:
- **K1:** the best hour barely moves; the last slot wins on most days.
- **Smoke test:** tomorrow ≈ today.
- 55% of days average ≥200 µg/m³; **88% of Nov–Dec school days have no school-hour slot under AQI 200.**

So prediction (which hour, which day) adds little. **The value is in action, accountability and intensity**, not forecasting.

## 4. What the data does support: intensity, not timing or location
EPA exposure factors for children: inhalation is ×2.5 light, ×4.5 moderate, ×8.5 high-intensity vs sedentary.
- Same 40-minute PE, same air: switching **high → light** intensity cuts the PE-period inhaled air by **71%**.
- Over a whole day (baseline 24 resting-hour-equivalents): high-intensity PE ≈ 29.0 units; light ≈ 25.0. That is **≈14% less of a child's daily inhaled air**, from one period.
- Moving PE indoors alone helps far less for PM2.5, because indoor/outdoor ratios are ~0.7–1.0 in naturally ventilated classrooms.
- The earlier objection "the multiplier cancels" applies to swapping the hour at the *same* intensity. It does **not** apply when intensity changes.
- Assumes the same ambient concentration across the day; "station air, not lungs".

## 5. My recommendation (see chat for reasoning)
**Reframe the school idea from *when* to *how hard*:** a daily intensity verdict for PE from measured air and CPCB's own AQI health advice, a ready light-activity plan for the teacher, a one-tap principal confirmation (optionally by Hindi voice), a parent line, and an honest daily receipt of inhaled-air saved. It works on every day, including Hawa Hold days (the 2/3 majority in Nov–Dec), needs no forecast skill, and is tied to existing obligations (SC/CAQM direction, CPCB advisories).

Open risks:
- Live data freshness (§2).
- Moderate novelty ("AQI band → activity" is a lookup; the product is delivery + plan + accountability).
- Compliance verification stays self-reported.
- No guarantee of a win; execution and the video decide.
