# Council verdict, round 5: what would make Taaza Hawa something people really use? (9 Oct 2026)

Inputs: [00-framed-question-and-advisor-responses.md](00-framed-question-and-advisor-responses.md) · [01-peer-reviews-and-fact-check.md](01-peer-reviews-and-fact-check.md)

This round **revises** two calls from [round 4](../round-4-audience/02-verdict.md):

- **"No new features":** relaxed for the two changes below.
- **The headline:** Go/Wait/Stay becomes a small badge. "Can I trust this number?" becomes the pitch.

The primary user is still the healthy adult runner or walker.

## Where the Council Agrees

- **Fix the scale bug before anything else.** WAQI sends US EPA-scale numbers, but the app grades them with CPCB (India) bands. At Delhi winter levels the US number comes out lower, so the app says "Go" too often. The 9 Oct check found that 5 of 24 "Go" answers should have been "Wait".
- **Delhi's problem is trust, not missing data.** On r/delhi, people ask "is this number right?" far more often than "can I go out?"
- **Keep #1 (neighbour gap) and #2 (translator).**
- **Drop #4 (exception-only alerts).** There is no push channel, and in winter every day is "worse than usual".
- **Drop #5 (healthy/sensitive toggle).** It reopens the scope and the health wording.
- **Hide** Air Lens, the FIRMS fire count and school mode.

## Where the Council Clashes

| Question | Split | Chair's call |
|---|---|---|
| **#3, the "going out anyway" card** | Outsider and Expansionist keep it; the other three drop it | **Drop.** Mask and purifier tips are health advice, which the honesty rules forbid. The backtest shows timing rarely helps. |
| **Go/Wait/Stay** | First Principles wants a footnote; Outsider wants a small badge | **Small badge.** Runners, the round-4 user, still need it. |
| **When the neighbour flag fires** | Executor uses the top of the neighbour range as the verdict | **No.** Show both numbers. Never replace the station's own reading. |
| **A public list of "stations that read low"** | Expansionist only | **No.** It blames stations without saying so. |

## Blind Spots the Council Caught

1. **The translator's premise is backwards.** Above about 81 µg/m³, the India number is *higher* than the US number (see the [fact-check](01-peer-reviews-and-fact-check.md#chairs-fact-check)). So "different scale" cannot explain "purifier 500, official 150". The likely reasons are:
   - the official AQI is a 24-hour average, while a device shows the current moment;
   - some devices show raw µg/m³, not an AQI;
   - cheap sensors read high in humid air;
   - indoor smoke raises indoor readings.
2. **The fix breaks your old numbers.** The 88% figure, the 4–6% backtest, the calibrated ranges and the track record were probably all computed on the wrong scale. Rerun them before quoting any of them.
3. **A converted number is not the official one.** CPCB AQI averages several pollutants over 24 hours. A converted hourly number is an estimate, so label it that way.
4. **Nothing brings people back.** There is no login and no push. Moments of doubt come only now and then, and nobody has shown they bring people back.
5. **No real user has tried it.** Show it to five Delhi residents before recording the video.

## The Recommendation

### 1. Fix the scale

**What.** Convert each pollutant's US value back to µg/m³. Compute its CPCB sub-index, then take the highest. Add one unit test. The parser is in [backend/src/taaza/sources/waqi.py](../../../backend/src/taaza/sources/waqi.py), and the bands are in [backend/src/taaza/aqi.py](../../../backend/src/taaza/aqi.py).

| Before | After |
|---|---|
| "AQI 190 · Go" | "AQI ~270 (India scale, hourly estimate) · Wait" |

**Why.** A user who compares the app with Sameer sees the gap and stops trusting it. Trust is the whole pitch.

**Honesty.** Label the number "estimate; the official AQI uses a 24-hour average". Recompute the track record from the stored raw values. If that isn't possible, reset it and show the restart date.

**Deadline.** Fits: about 3 hours, plus 2 hours to recompute.

### 2. One button: "Doesn't match what you see?" (#1 and #2 merged)

One screen with two parts.

**a. Neighbour check, on every station, fresh or stale.** Leave-one-out means estimating a station from its neighbours alone. Compare today's gap with that station's *own usual* gap, and flag it only when today falls outside its normal band.

| Before | After |
|---|---|
| "Anand Vihar 150 · Go · 20 min old" | The same, plus: "Nearby stations suggest 240–290 (Wait). This station usually reads close to its neighbours. Today it reads lower. We don't know why." |

**b. Number translator.** The user types the number they see and picks their device.

> "IQAir says 300" → "That's the US scale. On India's scale it's about 380, right now. The official app averages 24 hours, so it lags on a smoggy morning. Purifier? It may show µg/m³, read high in humid air, or pick up indoor smoke."

**Why.** It answers r/delhi's biggest complaints head-on: "smog but AQI 280?", the sprinkler post (7.4k upvotes) and "official 150s, my purifier 500+". It meets objection 3 (sensors are distrusted) with data instead of argument.

**Honesty.**
- It states facts and names no cause. It never says "tampered".
- The station's verdict stays unchanged.
- It never calls a device "wrong".
- The public track record backs up the range.

**Deadline.** Fits. About half a day for the neighbour check, which reuses the stale-branch code. About 3 hours for the translator, which is frontend only.

### 3. The morning parchi (the reason to come back)

**What.** The user saves "my station" on the phone, with no login. The existing 06:30 job prepares a short Hindi message with the verdict, the reading's age, the neighbour check and a link. One tap forwards it on WhatsApp.

| Before | After |
|---|---|
| The user has to remember to open the app. | A running-group or RWA admin forwards this every day (in Hindi): "This morning: ~270, Wait. Reading 25 min old. Neighbours agree." |

**Why.** Objection 4 is right: nobody opens an AQI app every day. But Delhi groups already forward AQI screenshots in winter. Be the screenshot they forward. Every forward reaches new readers.

**Honesty.** The same facts as the app, with no health claims.

**Deadline.** Build it only if changes 1 and 2 are done by tonight. Otherwise, show it as "next" in the video.

### Remove or hide

- **Remove the FIRMS fire count.** It reads as blaming stubble burning.
- **Remove school mode.** Objection 2 rules it out.
- **Hide Air Lens** from the main screen and the video.
- **Fold station reliability** into the neighbour check.
- **Cut the jargon.** Drop terms like "split-conformal" and "Check it and tell me". Replace them with one line, for example "We guessed right 8 times in 10", but only if the recomputed numbers support it.

### Honest score

| State | Real-use score |
|---|---|
| Today, after the fix | about 6/10 |
| With all three changes | about 7.5/10 |

It will not reach 9 by Sunday. A 9 needs evidence, not more features:

- At least 30% of people who install it still open it every week, over 4 weeks in November.
- At least 1 visit in 5 comes from a forwarded message.
- The recomputed track record stays at 75–85% for a month.
- The neighbour flag fires on under 5% of station-days, and never on the same station every day.
- Five Delhi residents can explain the screen without help.

Is the idea "too easy"? No. Honest, calibrated and checkable numbers are the hard part.

## The One Thing to Do First

Write the unit test: a US AQI of 190 (PM2.5) must give an India AQI of about 270. Make it pass. Then rerun the 9 Oct check and the backtests. Touch nothing else until those numbers are right.
