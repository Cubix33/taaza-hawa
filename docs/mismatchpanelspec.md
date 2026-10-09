# Spec: one "Doesn't match what you see?" button: a neighbour check and a number translator

Status: ready for an agent. Date: 9 Oct 2026.

Sources:
- Round-5 council verdict, change 2 ([verdict](council/round-5-real-use/02-verdict.md)).
- The translator half's Jev details are in [jevintegratespec.md](jevintegratespec.md).

**What this spec adds and changes:**
- **Adds** part A, the neighbour check.
- **Supersedes** the panel layout in jevintegratespec.md and in Task 4 of its implementation plan. The panel is now opened step by step instead of showing every control at once.
- **Keeps** the `/explain` contract and Jev rules from jevintegratespec.md, with one addition: a `neighbour` object.

## Problem Statement

Delhi residents often see a number that doesn't match Taaza Hawa:
- their purifier
- IQAir or Google
- the grey sky outside

The loudest complaints on r/delhi are versions of this: "smog outside but the AQI shows 280?", a sprinkler spraying a monitor, "official 150s, my purifier 500+".

Two different doubts sit underneath:
1. **"Is this station reading oddly today?"** They suspect the station itself.
2. **"Why is my number different?"** They are comparing two numbers that aren't measured the same way.

Today the app answers neither. A resident who doubts the number has nowhere to go, so they stop trusting the app.

The app is also already busy. The Check page has the verdict, a gauge, a band scale, activity chips, a 24-hour line, a facts row, an all-stations list, a hold panel, yesterday's grade, a fire count and a CPCB line. Adding two more features as new sections would make it more confusing, not more trusted.

## Solution

**One button, one panel, opened step by step.**

**On the card,** the only additions are:
- a small **"मेल नहीं खा रहा? / Doesn't match?"** button in the existing row with Listen and Share;
- one short line under the verdict, **only on the rare days** when the station reads unusually far from its neighbours ("Reads lower than nearby stations suggest today · Why?").

**Tapping either opens one panel with two parts:**

**A. Neighbour check.** This appears immediately. It is one or two sentences: what nearby stations and the CAMS model suggest for this station right now, and whether today's gap is within this station's *usual* gap. For example:
- "Nearby stations and the CAMS model suggest about 240–290. Najafgarh reads 230, within its usual gap."
- "Anand Vihar reads 150. Nearby stations and the CAMS model suggest about 240–290. Today's gap is bigger than this station's usual gap. We don't know why."

**B. Number translator.** One text box, "Seeing a different number? Type it, e.g. purifier 487", and one button. The answer is a few plain sentences, as in jevintegratespec.md: what the number probably is, what it is on India's scale, and why it differs.

Button groups (source, unit, indoors) appear **only when the app needs to ask**. They are never all shown up front.

**Nothing changes the verdict.** No device is called wrong and no cause is named.

## User Stories

1. As a resident who doubts today's number, I want one obvious place to tap, so that I don't have to hunt through the page.
2. As a resident, I want that button next to Listen and Share, so that it doesn't add a new section to an already full page.
3. As a resident, I want the panel to open with one short answer about the station, so that I get value before I type anything.
4. As a resident, I want to know what nearby stations suggest for my station right now, so that I can see whether my station stands out.
5. As a resident, I want the app to compare today's gap with this station's *usual* gap, so that a station that always reads a bit lower isn't flagged every day.
6. As a resident, I want the app to say plainly when today's gap is bigger than usual, so that my doubt is taken seriously with data.
7. As a resident, I want the app to say "we don't know why" and never suggest tampering or blame, so that the answer stays factual.
8. As a resident, I want the app to say when there isn't enough history yet to know what's usual, so that it doesn't pretend to know.
9. As a resident whose station reading is old, I want the panel to point to the estimate the card already shows, instead of repeating it, so that I'm not shown the same thing twice.
10. As a resident, I want the card's verdict to stay the same whatever the neighbour check says, so that the published rule is the only thing that decides Go/Wait/Stay.
11. As a resident, on the rare day my station reads unusually far from its neighbours, I want one short line on the card with a "Why?" link, so that I notice without the card getting louder every day.
12. As a resident, I want that card line to appear only when it matters (unusual days), so that it keeps meaning something.
13. As a resident with a purifier or IQAir number, I want one text box to type it in my own words, so that I don't need to know technical terms.
14. As a resident, I want to type in Hindi, Hinglish or English and use Devanagari or Western digits, so that it works the way I write.
15. As a resident, I want only the questions the app actually needs asked, as one-tap buttons, so that I'm not faced with a form.
16. As a resident, I want my button answers to override the app's guess, so that I stay in control.
17. As a resident, I want the answer in a few short sentences in the page's language, so that I can read it quickly.
18. As a resident, I want the translator's answer to include the station comparison from part A, so that both doubts are answered together.
19. As a resident, I want to share the panel's answer on WhatsApp, so that family who ask the same question get the same answer.
20. As a resident, I want to close the panel and get back to the plain card, so that the extra detail never stays in my way.
21. As a resident on a small phone, I want the panel to fit without long scrolling before the first answer, so that it feels quick.
22. As a screen-reader or keyboard user, I want the button, panel, text box and choices to be labelled and reachable, so that I can use them without a mouse.
23. As a privacy-conscious resident, I want to be told when my words go to a third party (TypeSafe) and that they aren't stored, so that I can choose to use buttons instead.
24. As the builder, I want the neighbour check computed when readings arrive, not when a user opens the card, so that the page stays fast.
25. As the builder, I want the neighbour check to reuse the leave-one-out errors the app already stores, so that there's no new data source or model.
26. As the builder, I want the "unusual" threshold set so the card line fires on only a few percent of station-days, so that it stays meaningful.
27. As the builder, I want the station reliability text moved out of the facts row and into part A, so that the card gets lighter, not heavier.
28. As the builder, I want the whole panel to work with no Jev key configured, so that the feature never depends on a third party.
29. As the builder, I want one API call to return both parts, so that the panel needs one request.
30. As a judge watching the demo video, I want to see the sprinkler-style doubt answered with data and no accusation, then a purifier number explained, so that the trust pitch is shown in 30 seconds.

## Implementation Decisions

**Screen budget (the anti-clutter rule, binding on every decision below).**

| Where | Adds | Removes |
|---|---|---|
| **Card** | one small button in the existing Listen/Share row; one short line under the verdict, **only when flagged** (rare) | the station reliability text from the facts row (it moves into part A) |
| **Panel, closed** | nothing | |
| **Panel, open, first view** | at most **two sentences** (part A), **one text box**, **one button** | |
| **After the translator answers** | a few sentences, plus button groups **only for fields in `needs_confirm`**, plus one Share button | |

No new page, navigation item, chart or settings toggle. The panel closes back to the plain card.

**Part A: the neighbour check.**
- **Computed during ingest,** inside the existing leave-one-out calibration step, so it costs nothing at request time.
- **For each fresh reading:**
  - compute the leave-one-out estimate for the station's governing pollutant from neighbours and CAMS, exactly as calibration already does;
  - build two ranges from the station's **stored residuals as they were before this reading is added**: an 80% range (the existing target) and a 95% range, using the existing split-conformal function with coverage 0.8 and 0.95.
- **Stored on the station record** as `neighbour_check`:
  - `ts`, `pollutant`, `actual`
  - `lo80`, `hi80`, `lo95`, `hi95`
  - `n_residuals`
  - `state`: `within` | `lower` | `higher` | `warming` | `unavailable`
- **State rules:**
  - `warming`: fewer than 20 stored residuals (the existing minimum).
  - `lower`: actual below `lo95`.
  - `higher`: actual above `hi95`.
  - `within`: otherwise.
  - `unavailable`: no estimate is possible (no neighbours and no CAMS).
- **Range shown to users:** the 80% range, "suggest about lo80–hi80". **The flag fires on the 95% range,** so by construction it fires on about 5% of readings, not 20%.
- **Honest wording.** The estimate blends nearby stations and the CAMS model, so the copy says "nearby stations and the CAMS model". It never says "neighbours prove".
- **Stale stations:** part A shows one line pointing to the estimate the card already shows. It doesn't compute a separate check.
- **Reliability:** part A also shows the station's existing reliability sentence (share of hours reported in the window). That sentence is removed from the facts row.

**Card contract.**
- `GET /card` gains `neighbour_flag`: `"lower"` | `"higher"` | `null`.
- It is non-null only when the stored `neighbour_check` matches the card's latest reading timestamp and its state is `lower` or `higher`.
- The verdict, value, range and every existing field are unchanged.

**`/explain` contract.**
- The `POST /explain` response from jevintegratespec.md gains `neighbour`, which contains:
  - `state`
  - `actual`, `lo80`, `hi80`
  - `age_min`
  - `reliability` (the existing per-station reliability object)
  - `sentence_hi` / `sentence_en`
- A call with only `{uid, lang}` and no text returns `neighbour` straight away. This is what the panel calls when it opens. One request serves both parts.

**Fixed copy** (Hindi and English, in the existing copy module):
- `nb_within`: "Nearby stations and the CAMS model suggest about {lo}–{hi}. {name} reads {actual}, within its usual gap." / "पास के स्टेशन और CAMS मॉडल लगभग {lo}–{hi} बताते हैं। {name} {actual} दिखा रहा है, अपने आम अंतर के अंदर।"
- `nb_unusual` (for both `lower` and `higher`; the numbers show the direction): "{name} reads {actual}. Nearby stations and the CAMS model suggest about {lo}–{hi}. Today's gap is bigger than this station's usual gap. We don't know why." / "{name} {actual} दिखा रहा है। पास के स्टेशन और CAMS मॉडल लगभग {lo}–{hi} बताते हैं। आज का अंतर इस स्टेशन के आम अंतर से बड़ा है। हमें नहीं पता क्यों।"
- `nb_warming`: "Not enough history yet to know this station's usual gap." / "इस स्टेशन का आम अंतर जानने के लिए अभी पर्याप्त इतिहास नहीं है।"
- `nb_stale`: "This station's reading is old, so the card already shows our estimate from nearby stations." / "इस स्टेशन की रीडिंग पुरानी है, इसलिए कार्ड पहले से पास के स्टेशनों से हमारा अनुमान दिखा रहा है।"
- `nb_card_lower` (the one card line): "Reads lower than nearby stations suggest today · Why?" / "आज पास के स्टेशनों के अनुमान से कम दिखा रहा है · क्यों?"
- `nb_card_higher`: "Reads higher than nearby stations suggest today · Why?" / "आज पास के स्टेशनों के अनुमान से ज़्यादा दिखा रहा है · क्यों?"
- **Rules:** no banned word, never "wrong", never a cause.

**Part B: the translator.**
- Behaviour, Jev rules, the regex number reader, conversion, templates, privacy, `JEV_LANGS` and the button fallback are all as in jevintegratespec.md.
- **Only the layout changes.** The first view shows one text box and one Explain button. Button groups render **only for fields listed in `needs_confirm`**, under the answer, with the question in one line each.
- **The Share button** shares part A's sentence plus the translator's lines.

**Panel behaviour.**
- **Opening:** opening the panel (from the card button or the flag's "Why?") sends one `/explain` call with no text and shows part A.
- **Typing:** after typing, Explain sends a second call with the text. The answer replaces the area under the text box.
- **Changing station** clears the panel.
- **Closing** returns to the plain card.
- **Mobile:** the panel must fit part A, the text box and the button on a 360×640 screen without scrolling past the card.

**Removing clutter as part of this work.**
- The station reliability sentence moves from the facts row into part A.
- No other existing section changes here. The wider clean-up from the round-5 verdict (hiding Air Lens, the fire count and school mode from the main view) is a separate task.

## Testing Decisions

**What a good test looks like.** It goes in through the existing seams and checks what a user would see:
- Seed and ingest readings with the existing in-memory store and seed helpers.
- Read `GET /card` and `POST /explain` through the existing API router.

Tests don't inspect the station record's internal layout.

**Seams:** the existing ingest function (computes and stores the check) and the existing API router (card flag, `/explain` neighbour object). No new seams.

**Tests:**
- **Usual gap:** a station with at least 20 residuals and a fresh reading inside its usual gap → `neighbour.state` is `within`, the card has no flag, and the sentence names the 80% range.
- **Lower than usual:** a fresh reading below its 95% range → `lower`, the card has `neighbour_flag: "lower"`, and the verdict and value are unchanged from a card computed without the check.
- **Consistently lower station:** a station whose residuals are consistently about −40 (it always reads lower), with today's gap −45 → `within`, not flagged. This is the "usual gap" rule working.
- **Little history:** fewer than 20 residuals → `warming` and no flag.
- **Stale station:** → `nb_stale` sentence and no flag.
- **No self-comparison:** the current reading's own residual isn't used to judge itself; the check uses residuals from before it.
- **Copy:** every `nb_*` template exists in both languages, contains no banned word, never "wrong", and never a cause word ("tamper", "sprinkler", "fault").
- **Panel opening:** `/explain` with only `{uid, lang}` returns `neighbour` and `jev: "no_text"`.
- **Card layout:** the facts row no longer carries reliability, and part A does. This is a frontend copy/test check where practical.
- **Prior art:**
  - the existing service tests (seed → ingest → card)
  - the existing API route tests
  - the leave-one-out calibration already exercised by the service tests

**Flag rate** (manual, after deploy): after 3 days of live data, count station-days with a `lower`/`higher` flag. It should be under 5%. If it's higher, raise the coverage used for the flag range.

## Out of Scope

- A public list or ranking of "stations that read low" (the round-5 verdict rejected it as blame by implication).
- Explaining *why* a station differs, or any cause.
- Changing the verdict, range or grading from the neighbour check.
- Showing part A permanently on the card.
- New pages, charts, maps or settings.
- The wider round-5 clean-up (Air Lens, the fire count, school mode).
- Anything about Jev beyond jevintegratespec.md.

## Further Notes

- **Order of work:**
  1. Part A first: no third party, and it answers the loudest complaint.
  2. Then part B with buttons only.
  3. Then the Jev free-text pre-fill from jevintegratespec.md.

  If time runs out before the 11 Oct 2026, 08:00 IST submission, ship part A and the card button, and show part B as "next".
- **Why the 95% range for the flag** but the 80% range in the sentence: the sentence tells the user what's typical, using the app's usual 80% language. The flag must be rare to be worth showing at all.
- **Plan follow-up:** Task 4 of the Jev implementation plan should follow this layout (step-by-step panel, groups only for `needs_confirm`, the button in the card-actions row) where it differs.
