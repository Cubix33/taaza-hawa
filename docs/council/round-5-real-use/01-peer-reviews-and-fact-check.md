# Council round 5: peer reviews and fact-check (9 Oct 2026)

Inputs: [00-framed-question-and-advisor-responses.md](00-framed-question-and-advisor-responses.md). Verdict: [02-verdict.md](02-verdict.md).

## Anonymization

Reviewers saw the five responses as A–E. The mapping was:

| Letter | Advisor |
|---|---|
| A | Outsider |
| B | Contrarian |
| C | Executor |
| D | Expansionist |
| E | First Principles |

## Tally

| | Votes |
|---|---|
| **Strongest** | C (Executor) ×3 · B (Contrarian) ×2 |
| **Biggest blind spot** | D (Expansionist) ×5 |

All five reviewers said C should adopt B's refinement: judge each station against **its own usual leave-one-out gap**, not a raw gap. Two reviewers also rejected C's idea of swapping in the top of the neighbour range as the verdict, because it quietly overrides the official reading.

## Reviews

### Review 1

**Strongest: B.** It is the only response that quantifies the scale bug, and the only one that gives the safe design for #1: judge each station against its own leave-one-out error history. Take C's schedule and unit test, but leave out C's "use the top of the range when flagged".

**Biggest blind spot: D.** It keeps N95 advice, which is a health claim. It calls the bug the "hero feature" but never says to fix it first. Its public list of "stations that keep reading low" is blame by implication. Covering 500+ stations is scope creep.

**What all five missed:**
- **Converted numbers won't match official ones.** CPCB AQI is the highest sub-index across pollutants, using 24-hour PM averages, so converting back still won't give the official figure. Pull CPCB data directly from data.gov.in instead, which covers all 46 stations against WAQI's ~24.
- **The fix invalidates the backtests.** Rerun the 88% and 4–6% figures before quoting them.
- **Nothing brings people back.** There is no login and no push.

### Review 2

**Strongest: C.** It is the only plan that can be built in 1.5 days, with hour budgets, a unit test and the rule "cut from the video, keep the code". It should adopt B's usual-gap refinement.

**Biggest blind spot: D.** It keeps health guidance and frames the product as "is this number lying?", with a low-reader list for journalists and RTI filers. A makes the same mistake by putting #3 at the top.

**What all five missed:** the translator's premise is partly backwards. At Delhi levels, the US scale gives a *lower* number than CPCB for the same PM2.5, so "different ruler" cannot explain "purifier 500, official 150". The likely causes:
- the official PM AQI is a 24-hour average, while devices show instant readings, which also explains the "smog but 280" mornings;
- some devices show raw µg/m³, not an AQI;
- cheap sensors read high in humid air;
- indoor sources raise indoor readings.

Fixing the scale also invalidates graded ranges, so recompute the track record.

### Review 3

**Strongest: C**, with B's caveat added.

**Biggest blind spot: D**, for the hero framing without a fix, the mask advice, the blame-adjacent record and the national scope. A shares the health-claim problem.

**What all five missed:**
- **The evidence itself is on the suspect scale.** The 88% figure, the hour-swap backtest, the conformal calibration and the track record must all be rerun.
- **The translator must explain the averaging window**, not only the scale.
- **Nobody suggested user testing.** Show the build to five Delhi residents before recording.

### Review 4

**Strongest: B.** C fires on a raw range breach and then swaps the verdict. Use B's judgement with C's schedule and test.

**Biggest blind spot: D.**

**What all five missed:**
- **The scale points the wrong way.** A scale difference can't explain purifier-vs-official gaps. More likely causes are raw µg/m³ mistaken for AQI, indoor sources and humidity bias. As planned, #2 explains the wrong thing.
- **The fix has side effects.** It pushes more days into Wait/Stay and invalidates the stored residuals, the calibration and the track record.
- **There is no habit trigger.** Checking out of doubt happens occasionally, not daily.

### Review 5

**Strongest: C**, with B's refinement.

**Biggest blind spot: D.**

**What all five missed:**
- **A converted number is an approximation of CPCB AQI.** Label it that way.
- **Past results must be recomputed or reset.**
- **There's no daily reason to return**, such as a PWA install or a morning WhatsApp message. The "doubt moments" that D and E rely on are a guess, not evidence.

## Chair's fact-check

These were checked against the published breakpoint tables before the chairman synthesis.

**PM2.5 breakpoints:**

| US EPA (2024) | | CPCB (24-hour) | |
|---|---|---|---|
| **µg/m³** | **AQI** | **µg/m³** | **AQI** |
| 9.1–35.4 | 51–100 | 31–60 | 51–100 |
| 35.5–55.4 | 101–150 | 61–90 | 101–200 |
| 55.5–125.4 | 151–200 | 91–120 | 201–300 |
| 125.5–225.4 | 201–300 | 121–250 | 301–400 |
| | | 250+ | 401–500 |

**Where the two scales cross:** at about **81 µg/m³**, both scales give about 169.

| PM2.5 (µg/m³) | US AQI | CPCB AQI | Higher |
|---|---|---|---|
| 40 | ≈112 | ≈66 | US |
| 81 | ≈169 | ≈169 | equal |
| 111 | ≈190 | ≈269 | CPCB |
| 125 | ≈200 | ≈303 | CPCB |
| 225 | ≈300 | ≈381 | CPCB |
| 250 | ≈350 | ≈400 | CPCB |

PM10 behaves similarly: 250 µg/m³ is ≈148 on the US scale and ≈200 on CPCB's.

**What follows:**
- **The app says "Go" too often in season.** In Delhi's Oct–Dec season, PM2.5 is usually 100–300 µg/m³. In that range CPCB gives the higher number, so applying CPCB bands to US-scale values understates the risk. This matches the 9 Oct check, which found 5 of 24 "Go" answers should have been "Wait".
- **The reviewers are right about the translator.** A scale difference cannot explain "purifier 500 vs official 150". A US AQI of 500 corresponds to a CPCB value of about 450 or more.
- **A converted number is an estimate, not the official figure.** The official CPCB AQI uses 24-hour averages for PM (8-hour for O₃ and CO), so it lags a sudden smoggy morning. Converting hourly WAQI values to the CPCB scale gives an hourly estimate.
- **The chairman's worked examples check out.** US AQI 190 gives an India AQI of about 269, and US AQI 300 gives about 381.
