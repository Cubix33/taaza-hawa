# Council round 5: what would make Taaza Hawa something people really use? (9 Oct 2026)

Run with the five-advisor LLM Council method: independent advisors, then anonymized peer review, then a chairman verdict. The verdict is in [02-verdict.md](02-verdict.md). Peer reviews and the chair's fact-check are in [01-peer-reviews-and-fact-check.md](01-peer-reviews-and-fact-check.md).

## What prompted it

After [round 4](../round-4-audience/02-verdict.md) settled the audience, the builder raised four objections about real use:

1. People have jobs. They go out anyway and can't choose whether or when.
2. Schools won't reschedule assembly or PE every day. They follow GRAP and Directorate of Education orders, not apps.
3. Sensors are bad, and people distrust the official number.
4. Nobody changes their routine according to the AQI.

The builder thinks the core idea is "too easy": another AQI app with Go/Wait/Stay. The ask: **make it a 9+/10 product that an ordinary Indian would really use. Quality over quantity: 2–3 changes only.**

## The question as given to every advisor

**Decision.** Which 2–3 changes or additions would turn Taaza Hawa into something an ordinary person in Delhi would really use, ideally again and again, and push it toward a 9+/10 product? Which candidate ideas should be kept, which dropped, is there something better, and what should be removed?

**Product today.**
- A Go/Wait/Stay verdict from fixed CPCB bands (≤200 Go, 201–300 Wait, >300 Stay).
- The age and source station of every reading.
- A split-conformal range when a reading is over 3 h old.
- "Check it and tell me": a Step Functions execution waits for the station's next reading and grades the range, which feeds a public track record with an 80% target.
- Also built: Polly Hindi voice, WhatsApp share, a 24-hour line, the Air Lens 3D map, the NASA FIRMS fire count, station reliability and school mode.
- Honesty rules: never "tampered", no blame, no "true AQI", no health-outcome claims.

**Building blocks.** On every poll, each fresh station is re-estimated from its neighbours with its own reading hidden (leave-one-out, [backend/src/taaza/service.py](../../../backend/src/taaza/service.py)), and the error is stored. The project also has per-station conformal ranges, 06:30 and 17:30 IST jobs, SES email to confirmed addresses, Polly caching and place search. WAQI covers about 24 Delhi stations.

**Evidence given.**
- [R7](../../wayfinder/research/R7-citizen-friction-mining.md): the main theme on r/delhi is distrust. Examples: "smog but AQI 280?"; the sprinkler spraying the Anand Vihar monitor (7.4k upvotes); "official 150s, my purifier 500+". People also ask about windows/AC and masks.
- [K1 backtest](../../research/03-k1-measured-backtest.md): PM2.5 falls through the morning, and the hour-swap rule fired on only 4–6% of days. In Nov–Dec, every hour from 08:00 to 13:00 was above 200 on about 88% of days.
- Only 2–3 of 46 stations are stale on an ordinary day.
- A 9 Oct check suggests WAQI numbers are on the US EPA scale, but the app applies CPCB bands.
- No competitor shows age, a calibrated range and public grading together.

**Prior decision.** Round 4 chose healthy adult runners and said "no new features". The builder reopened this to aim for real-world use.

**Candidates raised before the council:**
1. A "reading low vs its neighbours" flag, from leave-one-out.
2. A "why does my purifier / IQAir say 400?" scale translator.
3. A "going out anyway" card: mask, window timing, purifier, exercise.
4. Exception-only alerts.
5. A healthy/sensitive toggle that quotes CPCB health statements.

**Constraints.** Submissions open 11 Oct 2026, 08:00 IST (about 1.5 days away). Judges see a 3-minute video.

## Advisor responses

### The Contrarian

The biggest flaw isn't on your candidate list. It's the 9 Oct finding: WAQI reports on the US-EPA scale, and you grade those numbers against CPCB bands. At Delhi pollution levels the US number comes out much lower than the CPCB one. PM2.5 of about 125 µg/m³ is roughly 200 on the US scale but about 300 on CPCB's. So the app says "Go" when the government's own scale says Wait or Stay. Everything built on top inherits the error: the ranges, the track record and the neighbour flag. One judge who opens Sameer while watching your video sinks your Execution score. Change #1 has to be the fix: compute CPCB AQI from the pollutant concentrations and show which scale you're using on screen.

Second flaw: in Nov–Dec your verdict says "Stay in" on about 88% of days. People stop looking at a light that's always red within two weeks. And your headline feature (stale range plus grading) only fires for 2–3 of 46 stations, so on the usual path you really are just another AQI app.

- **#2, the purifier translator: KEEP.** It answers the main complaint head-on and needs no new data. But you can't credibly explain other apps' scales until your own is fixed.
- **#1, the neighbour flag: KEEP, but only if each station is judged against its own leave-one-out error history** ("lower than its usual gap to neighbours"). A raw gap will fire every day on stations that always read a bit cleaner. Every screenshot will then read as "app proves CPCB rigging", which breaks your no-blame rule by implication.
- **#3: DROP.** Mask, purifier and exercise advice is health guidance your own rules forbid, and your backtest already shows that timing barely helps.
- **#4: DROP.** You have no push channel, only SES email from a PWA. And "worse than usual" stops meaning anything when every winter day is bad.
- **#5: DROP for now.** It reopens the scope the council closed only hours ago.

**Remove:** the FIRMS fire count (a tally of fires within 500 km quietly blames stubble burning), school mode (your own objection #2 already kills it), and Air Lens.

### The First Principles Thinker

You're asking which features make people use an AQI app. That's the wrong question. Delhi doesn't lack AQI numbers. It has too many and believes none of them. Every complaint in your research is about trust: "smog outside but 280?", the sprinkler on the Anand Vihar monitor, "my purifier says 500". Nobody is asking "can I go out?" Your objections 1 and 4, plus the 88% backtest, show people can't choose anyway. Go/Wait/Stay answers a question Delhi isn't asking.

Now look at what you've already built: reading age, leave-one-out errors, calibrated ranges and a public scorecard. That is machinery for trust. But you've pointed it at the stale branch, which fires on only 2–3 of 46 stations. Your best asset is aimed at the exception.

So the product is: "Is this number right, and what does it mean next to the other numbers I see?"

1. **Fix the scale bug first.** Putting WAQI's US-EPA numbers into CPCB bands would sink an app built on honesty. This isn't a feature. Nothing else counts until it's fixed.
2. **Keep #1, and show it all the time.** Every station, fresh or stale, gets "neighbours suggest 240–290", using the leave-one-out errors you already store. The public track record is what earns you the right to say it.
3. **Keep #2: "Type the number you're seeing."** It explains the scale, PM2.5-only readings and indoor sources. This is what brings people back: every moment of doubt becomes a visit, and the answer is exactly what people forward on WhatsApp.

Drop #3: it's generic advice, and your backtest shows timing barely helps. Drop #4: in November every day is "worse than usual". Drop #5: it reopens health claims and widens the scope. Remove school mode, which serves a user you excluded and runs into your own objection 2. Remove the FIRMS fire count, which reads as blame. Remove Air Lens, which is eye candy for the demo. Shrink Go/Wait/Stay to a footnote.

Pitch: "Delhi doesn't lack an AQI. It lacks one it can check."

### The Expansionist

You're underrating your best asset. Go/Wait/Stay is the commodity part. The valuable part is the leave-one-out error you already store on every poll, plus the public scorecard. The research says Delhi's problem isn't "should I go out". It's "is this number lying to me?" So make Taaza Hawa the second opinion on Delhi's air: the app you open every time a number looks wrong.

**Keep, merged into one "Number Check" screen:**
- **#1, the neighbour-gap flag.** "Anand Vihar reads 150; its 3 nearest stations suggest 240–290." This is the share card. The sprinkler post got 7.4k upvotes, and this card answers that post with data and without blaming anyone. Every WhatsApp forward of it brings in new users.
- **#2, "my purifier says 400".** Your US-vs-CPCB scale bug is actually the hero feature. Half the distrust comes from people comparing numbers on different scales. Turn the bug into the explanation: "Your 400 on the US scale is about X on India's scale. Here's why they differ." People come back to this whenever their purifier goes red, and that's a repeat trigger no AQI app owns.

**Keep #3, trimmed:** a "going out anyway" card with just mask (fitted N95) and window/AC timing. That answers the questions people actually post on Reddit and handles objections 1 and 4.

**Drop:** #4 for now. #5 is fine later but it isn't where the upside is.

**Demote off the main screen:** Go/Wait/Stay, the 3D Air Lens, school mode and the FIRMS count.

**What everyone's missing:** over months, the gap data becomes a public record of which stations keep reading below their neighbours. Journalists, RTI filers and researchers would use that, and it stays honest because it states facts and never names a cause. The method isn't tied to Delhi either. It works on any CPCB city with neighbouring stations, which is 500+ stations nationally.

**Demo:** open on the sprinkler post, cut to the gap card, then the purifier translator, then the scorecard. Pitch: "Delhi doesn't lack AQI apps. It lacks a number it can trust."

### The Outsider

I'm reading this with no background, and here is what jumps out.

**Your app may have the same bug people complain about.** If WAQI sends US-scale numbers and you apply Indian CPCB bands to them, your verdict is wrong. That is the exact purifier-versus-official confusion from r/delhi. Fix this before anything else. Until it's fixed, no new feature can be trusted.

**Go/Wait/Stay answers a question nobody asks.** People go out anyway. Your own data says Nov–Dec is above 200 on about 88% of mornings. So for two months the app would say "Stay in" nearly every day, and people would learn to ignore it within a week. Keep the verdict as a small badge. The main screen should answer the question people actually have: "I'm going out, so what do I do?" That means a mask yes or no, when to open the windows, whether the purifier should be on, and whether to run easy. This is idea #3, and it should become the headline.

**One button: "Why doesn't this match what I see?"** Merge #1 and #2. This is the complaint people upvote 7,400 times. Let the user type in their purifier's number, and the app explains the gap: "Your device uses the US scale or PM2.5 only. Same air, different ruler. Also, this station reads lower than its three neighbours suggest (240–290)." It turns distrust into understanding, and nobody else does it.

**Cut or hide the jargon.** Phrases like "split-conformal", "leave-one-out", "80% target" and "Check it and tell me" mean nothing to me. Stale readings are rare, so the range branch almost never shows up. Shrink the track record to one line: "We guessed right 8 times in 10." Drop the 3D map, the 500 km fire count (what would I do with it?), station reliability and school mode.

**Drop #4 and #5 for now.** Alerts by email are not how Delhi works, and the toggle reopens the scope you already settled. For the video, the story is: "Your purifier says 500 and the government says 150. Here's why, and here's what to do anyway."

### The Executor

**Step zero is a bug fix, not a feature.** If WAQI returns US EPA AQI and the app applies CPCB bands, every Go/Wait/Stay verdict could be wrong. Fix this first: turn the US AQI back into a PM2.5 concentration, then compute the CPCB sub-index. Add one unit test against a known reading. Budget: 2–3 hours. Nothing else ships until this passes.

**Keep #1, the "reads low vs neighbours" flag.** It's the cheapest build with the biggest effect. The leave-one-out estimate and per-station ranges are already stored on every poll. Fire the flag when the live reading is below the bottom of the neighbour range. When it fires, the verdict uses the top of the range. That's the same code path as the stale branch, so there's no new logic to trust. Building it means one threshold, one card and one Hindi string. Half a day. It answers the main r/delhi complaint, and the Anand Vihar sprinkler story is your video's cold open.

**Keep #2, the purifier/IQAir translator.** It's pure frontend and reuses the conversion maths from step zero. The user enters 400 and picks "purifier", "IQAir" or "US app". The app shows "That's US scale or PM2.5-only; on India's scale this is about X, here's why." About 3 hours. It's a second strong demo moment and costs no backend work.

**Drop #3.** It's four features in a trench coat. Window timing needs hourly per-station aggregates. Mask and purifier advice drifts into health claims. Your own backtest says timing rarely helps. It won't be solid by Sunday.

**Drop #4 for now.** You can't demo "worse than usual" in a 3-minute video without waiting for a bad day. Build it after the hackathon.

**Drop #5.** It reopens excluded groups and health wording, and you have no time to review either.

**Cut from the video:** Air Lens, the FIRMS fire count and school mode. Keep the code, but leave them out of the 3 minutes.

**Schedule:** Today, step zero, then #1. Tonight, #2. Tomorrow morning, record, then freeze the code. No new branches after lunch.
