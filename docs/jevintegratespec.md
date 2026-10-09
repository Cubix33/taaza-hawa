# Spec: "Doesn't match what you see?", with TypeSafe Jev reading the user's words

Status: ready for an agent. Date: 9 Oct 2026.

Sources:
- The round-5 council verdict, change 2b (number translator), in `docs/council/round-5-real-use/`
- The Jev research note, `docs/research/2026-10-09-typesafe-jev-integration.md`

Prerequisite done: the CPCB scale and real-UTC fix (#03) is merged, so the card already shows India-scale values.

**Layout update (9 Oct 2026):** [mismatchpanelspec.md](mismatchpanelspec.md) supersedes this spec's panel layout. The panel is now opened step by step: one text box first, and button groups only for `needs_confirm`. That spec also adds the neighbour check to the same button. Everything else here (the `/explain` contract, Jev rules, privacy, the evaluation set) still applies.

## Problem Statement

A Delhi resident opens Taaza Hawa and sees one number. Their purifier, IQAir, the phone's weather widget, or simply the sky outside says something else. Typical cases:

- "My purifier shows 487 and the app says 270."
- "IQAir says 300."
- "It's so smoggy, but the app says 150."

The person doesn't know why the numbers differ. Usually they can't even tell whether their device shows an AQI or a raw PM2.5 concentration in µg/m³. Some reasons for the gap they'd never guess:

- the official AQI is a 24-hour average, while devices show this moment
- the US and Indian scales differ, and which one is higher depends on the pollution level
- incense, cooking or humidity push indoor sensor readings up
- the station measures station air, not their street

Without an explanation, the person concludes the official number (and Taaza Hawa with it) can't be trusted. This is the main complaint on r/delhi.

Finding the right explanation today would mean answering technical questions ("is your number AQI or µg/m³? US or Indian scale?") that most people can't answer.

## Solution

On the Check page there is a link, **"मेल नहीं खा रहा? / Doesn't match what you see?"**. It opens a small panel. The person either:

- types what they see, in their own words, in Hindi, Hinglish or English, for example "Mi purifier bedroom mein 487 dikha raha hai, agarbatti jal rahi hai", or
- taps three short button groups: where the number came from, what kind of number it is, and indoors or outdoors.

The app replies with a short, plain explanation:

- what their number probably is
- what it would be on India's scale
- the most likely reasons it differs from the station
- the station's current India-scale number, with its age

If the app isn't sure what they meant, it asks with one-tap buttons rather than guessing.

Behind the scenes, **TypeSafe Jev** (a fast "decision model" that returns typed choices, never text) sorts the person's words into fixed categories. The app's own code pulls out the number, does all the AQI maths and picks the explanation from fixed templates.

Jev never sees or decides an AQI, a verdict or a grade. If Jev is unavailable, unsure or not configured, the panel works with buttons only.

## User Stories

1. As a Delhi resident whose purifier shows a much higher number than the app, I want to type what my purifier says in my own words, so that I don't have to know technical terms to get an answer.
2. As a Hindi speaker, I want to type in Hindi (Devanagari), so that I can ask the way I normally write.
3. As a Hinglish speaker, I want to type in Roman-script Hindi mixed with English, so that I can type the way I text.
4. As an English speaker, I want to type in English, so that the panel works for me too.
5. As a resident, I want to write the number in Devanagari digits (४८७) or Western digits (487), so that either way works.
6. As a resident, I want the app to tell me whether my device probably shows µg/m³ or an AQI, so that I understand why the numbers can't be compared directly.
7. As a resident, I want to see what my number would be on India's scale, so that I can compare like with like.
8. As a resident, I want to be told that the official AQI is a 24-hour average while my device shows this moment, so that I understand why a smoggy morning can show a lower official number.
9. As a resident who reads the app indoors, I want to be told when incense, cooking, smoking, a mosquito coil, a diya or a heater can raise indoor readings, so that I don't mistake my room's air for the city's.
10. As a resident on a foggy or humid morning, I want to be told that cheap sensors can read high in humid air and that fog makes the sky look worse, so that I can tell what I see from what is measured.
11. As a resident who says the sky looks worse than the number, I want an explanation of averaging lag and visibility, without the app claiming the station is wrong, so that I get an honest answer.
12. As a resident comparing with IQAir or Google, I want to be told that those apps use the US scale, and that at Delhi winter levels the Indian number is usually higher, not lower, so that I'm not misled by the scale story.
13. As a resident, I want to see the nearest station's current India-scale number and how old it is next to the explanation, so that I know exactly what I'm comparing against.
14. As a resident, I want to be reminded that the station measures station air, not my street, so that I understand distance can matter.
15. As a resident, when the app isn't sure what I meant, I want one-tap buttons to confirm (for example "Was it AQI, not µg/m³?"), so that I get the right explanation without retyping.
16. As a resident, I want my button choices to override what the app guessed from my words, so that I stay in control.
17. As a resident who doesn't want to type, I want to answer three button groups instead, so that I can get the same explanation without text.
18. As a resident, I want the explanation in the page's language (Hindi or English), so that it matches the rest of the app.
19. As a resident, I want the panel's answer to never change the Go/Wait/Stay verdict on the card, so that the verdict always comes from the published rule.
20. As a resident, I want the app never to tell me my device is "wrong", so that I'm not talked down to.
21. As a resident, I want the app never to say a station is "tampered" or blame anyone, so that the explanation stays factual.
22. As a privacy-conscious resident, I want to be told my words are sent to a third party (TypeSafe) to understand them and are not stored by Taaza Hawa, so that I can decide whether to type or use the buttons.
23. As a resident on a slow mobile connection, I want an answer within about two seconds or a quick fall-back to buttons, so that the panel never hangs.
24. As a resident using the local demo, I want demo answers clearly labelled as demo, so that I never mistake them for live data.
25. As a resident who types something unrelated to air, I want the app to say it didn't understand and show the buttons, so that I'm not given a made-up explanation.
26. As a resident who types no number at all ("itna smog hai par app kam bol raha hai"), I want an explanation that doesn't need a number, so that the "sky looks worse" case still gets an answer.
27. As a resident who types a number with no unit or source, I want the app to ask what kind of number it is before converting, so that it never converts on a guess.
28. As a resident, I want to share the explanation on WhatsApp in the page's language, so that family who ask the same question get the same answer.
29. As a screen-reader user, I want the panel, buttons and explanation to be properly labelled and keyboard reachable, so that I can use it without a mouse.
30. As the builder, I want the Jev key kept only on the server, so that it can't be scraped from the website bundle.
31. As the builder, I want the whole feature to keep working with no Jev key configured, so that deployment never depends on a third party.
32. As the builder, I want the Jev model version pinned, so that a silent model update can't change answers after I've tuned thresholds.
33. As the builder, I want Jev answers below a confidence threshold treated as "unknown", so that a low-confidence guess never picks an explanation.
34. As the builder, I want repeated identical inputs served from a cache, so that common phrases don't cost repeated calls.
35. As the builder, I want only the labels and confidences logged, never the user's text, so that no personal text ends up in logs or the database.
36. As the builder, I want a 30-case labelled evaluation set (10 Hindi, 10 Hinglish, 10 English) and a manual script that reports Jev accuracy per language, so that I can check whether Hindi is good enough before relying on it.
37. As the builder, I want a per-language switch that sends a language straight to the buttons, so that I can turn Jev off for Hindi if the evaluation is weak.
38. As a judge watching the demo video, I want to see someone type a real Hinglish sentence and get a clear, honest explanation in under a second, so that the trust pitch is shown, not told.

## Implementation Decisions

**Seam.** Everything is tested through the existing API router function, the same seam used by the current route tests. The Jev client is passed into the router as an optional callable, the same way `start_execution` is passed today. Tests pass a fake, and production passes the real client. No other new seams.

**New route: `POST /explain`**, on the existing API Lambda (Function URL).

Request fields:
- `uid` (station)
- `lang` (`hi` | `en`)
- `text` (optional, at most 280 characters)
- optional explicit fields that override Jev: `source`, `unit`, `indoors`

Response fields:
- `demo` flag
- `understood`: `kind`, `source`, `unit`, `indoors`, `indoor_smoke`, `fog_or_humid`, `number`, each with its confidence
- `needs_confirm`: the fields the UI must ask about with buttons
- `converted`: the India-scale estimate and band, when a number and unit are known
- `station`: name, India-scale value, reading age, distance note
- `lines`: an ordered list of explanation sentences in `lang`
- `jev`: `used` | `off` | `low_confidence` | `error` | `skipped_lang`

The route is read-only. It never writes to the card, verdicts, holds or grades.

**New optional module: the Jev client.**
- It mirrors the existing optional Bedrock phrasing module: enabled only when `TYPESAFE_API_KEY` is set.
- The model id comes from `TYPESAFE_MODEL`, defaulting to the pinned `jev-1.13.0`.
- It calls `POST https://api.typesafe.ai/v1/systemone` with a short timeout (about 1.5 s).
- It returns `None` on any error, timeout, 401, 422, 429 or 529. There are no retries in the request path.
- It sends one call with all questions together (TypeSafe's "fan-out" pattern).

**Questions sent to Jev.** These are fixed in code; the user's text is the only part of the request the user controls.

| Question | Type | Options / meaning |
|---|---|---|
| `mismatch_kind` | choice | `device_reading`, `other_app`, `sky_looks_worse`, `station_distrust`, `other` |
| `source` | choice | `home_purifier`, `personal_monitor`, `iqair_app`, `phone_weather`, `govt_app`, `news`, `unknown` |
| `says_ugm3` | noul | the text says the number is a concentration (µg/m³), not an AQI |
| `indoors` | noul | the reading was taken inside a home, office or car |
| `indoor_smoke` | noul | the text mentions incense, cooking, smoking, a mosquito coil, a diya or a heater |
| `fog_or_humid` | noul | the text mentions fog, mist, humidity or rain |

**Confidence rules.**
- A choice is accepted only when its confidence is ≥ 0.7; otherwise it becomes `unknown` and goes into `needs_confirm`.
- A noul counts as true at p ≥ 0.7 and false at p ≤ 0.3. Anything in between is unknown.
- Thresholds live in one place and are tuned against the evaluation set.

**New pure module: explain.** It holds all logic that turns understood fields into an answer:
- **Number extraction** is a regular expression in code, never Jev. It accepts Western and Devanagari digits and takes the first number between 0 and 2000. No number means no conversion.
- **Unit resolution:**
  - explicit field
  - else `says_ugm3`
  - else a fixed source-to-likely-unit table (for example `iqair_app` and `phone_weather` → US AQI, `govt_app` → India AQI)
  - `home_purifier` and `personal_monitor` stay ambiguous and always go into `needs_confirm` unless the user or `says_ugm3` settles it.
- **Conversion** reuses the existing AQI module: US AQI → India scale through the existing US-to-CPCB conversion for PM2.5; µg/m³ → India sub-index through the existing sub-index function; India AQI is used as-is. The band name comes from the existing band helpers.
- **Explanation lines** come from a fixed, ordered catalogue chosen by rules:
  - unit line (µg/m³ vs AQI)
  - scale line (the direction depends on the level: about 81 µg/m³ is where the scales cross, and above it the Indian number is higher)
  - averaging line (24-hour vs this moment)
  - indoor-sources line
  - humidity/fog line
  - "station air, not your street" line
  - for `sky_looks_worse`: the averaging and visibility lines
  - for `station_distrust`: a factual line pointing to the station's reading age and reliability, never implying fault

  Every line has a Hindi and an English template in the existing copy module.

**Honesty rules enforced in code.**
- No line may contain the banned words already used by the phrasing guard.
- The card's verdict is never recomputed or changed.
- No line says a device is wrong.
- The converted number is always labelled "estimate"; the official AQI is a 24-hour average.

**Explicit fields always win.** When the UI resends with button answers, those override Jev for that field, and Jev isn't called again unless the text changed.

**Cache.** Jev answers (labels and confidences only) are cached in the existing single DynamoDB table under a key prefix plus a hash of the lowercased, trimmed text. The text itself is never stored.

**Privacy.**
- The text is sent to TypeSafe only when a key is configured and the language isn't switched off.
- The panel shows a one-line notice before sending.
- Logs record `jev` status, labels and confidences, never the text.

**Per-language switch.** `JEV_LANGS` (default `en,hinglish`; Hindi is added only after it passes the evaluation set). The script is detected in code: any Devanagari means `hi`, otherwise Latin script is treated as `en`/`hinglish`. A language that isn't enabled skips Jev and returns `jev: skipped_lang` with buttons.

**Infrastructure.**
- New NoEcho SAM parameter `TypeSafeApiKey`, passed only to the API function. Empty disables Jev.
- New parameter `TypeSafeModel`, default `jev-1.13.0`.
- No key ever appears in `web/` or in `VITE_*` variables.

**Local demo server.** It exposes the same route. With no key, it serves the buttons path and marks responses `demo: true`. With `TYPESAFE_API_KEY` set, it calls Jev for real.

**Frontend.**
- A link under the card on the Check page opens the panel: a text box (280-character limit, shown counter), the privacy line, and three button groups (source, unit, indoors/outdoors).
- When a response arrives, the buttons are pre-filled from `understood`, and fields in `needs_confirm` are highlighted.
- Below them: the explanation lines, the station comparison and a WhatsApp share of the lines.
- User text is rendered as text, never as HTML.
- All strings go through the existing i18n module.

## Testing Decisions

**What a good test looks like.** Call the router with a request and check the response a user would see: `lines`, `converted`, `needs_confirm`, the `jev` status. Don't assert on internal helpers or on the exact Jev request body. The fake Jev returns canned typed answers with chosen confidences.

**Router-level tests** (using the existing in-memory store and seed data, like the current API route tests):
- No key → `jev: off`, all three fields in `needs_confirm`, no conversion until the buttons are answered.
- High-confidence purifier, µg/m³ and incense → the µg/m³ line, the indoor-sources line and the station comparison; 487 µg/m³ PM2.5 gives the Severe band.
- "IQAir says 300" → US AQI resolved from the source table; the India estimate is about 381.
- Low-confidence `source` → `unknown`, listed in `needs_confirm`, and no source-specific line.
- Explicit `unit` overrides Jev's `says_ugm3`.
- Devanagari digits ("४८७") are extracted as 487.
- No number and `sky_looks_worse` → the averaging and visibility lines, no `converted`.
- The fake Jev returns `None` (error/timeout) → `jev: error` and the buttons path; the route still returns 200.
- A language not in `JEV_LANGS` → Jev is never called and the response says `skipped_lang`.
- Unrelated text (`mismatch_kind` = `other`) → a "didn't understand" line plus buttons.
- After any `/explain` call, `GET /card` returns the same verdict and number as before.
- No line in any test contains a banned word or the phrase "wrong".
- The user's text does not appear anywhere in the store after the call.
- The second identical request is served from the cache: the fake Jev is called once.

**Pure tests** for number extraction and unit resolution sit beside the existing scale-and-clock tests, which are the prior art for conversion values: US 190 → about 269 and US 300 → about 381 on PM2.5.

**Frontend:** if the panel adds a pure helper for pre-filling buttons from `understood`, test it in the existing frontend data-adapter test setup.

**Evaluation set** (manual, not CI): 30 labelled inputs (10 Hindi, 10 Hinglish, 10 English) with expected labels, plus a script that calls real Jev with the builder's key. The script reports per-language accuracy at the confidence threshold and the share of inputs sent to buttons. Hindi is enabled in `JEV_LANGS` only if accepted answers are at least 80% correct.

## Out of Scope

- The round-5 neighbour check (change 2a) and the morning parchi (change 3). Those are separate specs.
- Letting Jev decide Go/Wait/Stay, the neighbour flag, ranges or grades. Jev is documented as unreliable at number comparison, and this would break "AI may phrase, never decide".
- Using Jev to write or translate text. It can't generate text, so the Polly and Bedrock paths are unchanged.
- Voice input (for example Amazon Transcribe).
- Using Jev as an honesty gate on Bedrock output.
- Offline labelling of r/delhi posts.
- Storing user text, user accounts and analytics of what people type.
- Calling Jev from the browser.

## Further Notes

- **About Jev.** Jev is TypeSafe AI's decision model, in early access since 15 Sept 2026. It costs $0.042 per million input tokens with free output, so about 200 tokens per call is negligible. Calls take about 100 ms (70–500 ms measured from the US West Coast, plus the round trip from Mumbai). Early-access limits are 80 requests/s. New signups are paused, and existing keys work.
- **Hindi is unproven.** Jev's primary language is English, and nobody has published Hindi results. That is why `JEV_LANGS` and the evaluation set exist.
- **Adversarial text.** Users can type text designed to steer Jev. That is acceptable here, because Jev's output only selects among fixed templates and can't change any number or verdict.
- **Build order against the deadline** (submissions open 11 Oct 2026, 08:00 IST):
  1. The buttons-only panel and the explain module (works with no key).
  2. The Jev client and the evaluation run.
  3. Free-text pre-fill.

  If time runs out, ship step 1 and show Jev as "next" in the video.
- **No AWS credit.** Jev isn't an AWS service. It adds nothing to "Built on AWS" and costs nothing there either: the event allows other tools as long as AWS is used.
