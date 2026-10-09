# TypeSafe Jev: does it fit Taaza Hawa? (9 Oct 2026)

**Short answer:** yes, in one place. Use Jev to understand what the user types on the round-5 **"Doesn't match what you see?"** screen. The app's own code still does all the AQI maths. Jev must never decide an AQI number, a verdict or a grade.

## What Jev is

- **What it does.** Jev is a "decision model" from TypeSafe AI, in early access since 15 Sept 2026. It never writes text. You send it some data (the *state*) and a set of typed questions. It sends back one answer per question, each with probabilities ([flaviocopes deep dive](https://flaviocopes.com/jev/), [DEV guide](https://dev.to/valyuai/how-to-use-jev-a-practical-guide-to-typesafes-system-one-model-g5e)).
- **The three question types:**
  - `noul`: yes/no, answered as a probability of yes
  - `choice`: one option from a list you define (up to 255 options)
  - `score`: a position on a scale you define (2–10 levels)
- **Endpoint.** `POST https://api.typesafe.ai/v1/systemone`. The key goes in `TYPESAFE_API_KEY`. There are Python (`typesafe_sdk`) and Node (`@typesafe-ai/sdk`) SDKs, plus a [Pydantic AI integration](https://pydantic.dev/docs/ai/models/typesafe/).
- **Speed and cost.** Most calls take about 100 ms (70–500 ms measured from the US West Coast). Input costs $0.042 per million tokens, and output is free. One call for this feature is about 200 tokens, which is a tiny fraction of a cent.
- **Limits.** 80 requests/s and 100k tokens/s during early access. Signups have been paused since 22 Sept, but existing keys still work.
- **Calibration.** TypeSafe trains Jev so that "90%" answers are right about 90% of the time. These are TypeSafe's own numbers and nobody has reproduced them independently. Any single answer can still be wrong.

## What it's bad at (this decides where it can go)

- **Arithmetic, counting, comparing numbers, dates.** These are documented failure modes ([flaviocopes](https://flaviocopes.com/jev/)). So Jev can't judge "is 150 low compared with 240–290". The neighbour check, the scale conversion and the grader must stay in code.
- **Writing.** It can't generate text, so it can't replace the Bedrock Hindi phrasing.
- **Adversarial input.** Text the user controls can be written to push its answers. Treat its output as a hint, never as permission to do something.
- **Hindi is unproven.** English is the primary language. Other languages "vary"; one source mentions CJK, and nobody has published Hindi results ([awesome-typesafe-jev](https://github.com/AbdelStark/awesome-typesafe-jev), [DataCamp](https://www.datacamp.com/blog/top-open-source-jev-alternatives)). Test it on our own labelled cases before relying on it.
- **Model drift.** `jev-latest` changes without notice. Pin `jev-1.13.0` once the confidence thresholds are tuned.

## Recommended integration: read the user's mismatch in their own words

**Where:** on the round-5 [verdict](../council/round-5-real-use/02-verdict.md) screen "Doesn't match what you see?", part 2b (the number translator).

**Why Jev fits here.** People don't know whether their purifier shows AQI or µg/m³, or why the sky looks worse than the number. They can say what they see, in Hinglish:

> "Mi purifier bedroom mein 487 dikha raha hai, agarbatti jal rahi hai"
> "IQAir says 300 in Dwarka"
> "itna smog hai par app 150 bol raha hai"

Turning a short, messy description into a fixed set of categories is exactly what Jev is built for: routing and classification with a confidence score.

**The split. Jev reads the words; code handles the numbers:**

| Step | Who does it |
|---|---|
| Pull the number out of the text (`487`, `300`) | **Code** (regex). Jev is unreliable with numbers. |
| What kind of mismatch, and what source, indoors or out, smoke, fog | **Jev**, all in one call |
| Convert the number to the India scale and pick the explanation lines | **Code** (the same maths as the scale fix) |
| Confidence below 0.7, Jev unavailable, or no key set | **Fallback:** show 3 tap buttons (source, unit, indoors/outdoors) |

**One call, every question asked together** (TypeSafe's "speculative fan-out" pattern):

```json
{
  "model": "jev-1.13.0",
  "state": { "user_text": "Mi purifier bedroom mein 487 dikha raha hai, agarbatti jal rahi hai" },
  "questions": {
    "mismatch_kind": { "type": "choice", "instructions": "What does the person say does not match the app?",
      "criteria": { "device_reading": "A number from their own purifier or monitor",
                    "other_app": "A number from another app or website, such as IQAir, Google or Sameer",
                    "sky_looks_worse": "The air or sky looks or smells worse than the number",
                    "station_distrust": "They doubt the station or sensor itself",
                    "other": null } },
    "source": { "type": "choice", "instructions": "Where did their number come from?",
      "criteria": { "home_purifier": "Air purifier display", "personal_monitor": "Standalone air monitor",
                    "iqair_app": "IQAir / AirVisual", "phone_weather": "Google, phone weather or a widget",
                    "govt_app": "Sameer, SAFAR or CPCB", "news": "TV or a news site", "unknown": null } },
    "says_ugm3": { "type": "noul", "instructions": "Does the text say the number is a PM2.5 or PM10 concentration (µg/m³), not an AQI?" },
    "indoors": { "type": "noul", "instructions": "Was the reading taken inside a home, office or car?" },
    "indoor_smoke": { "type": "noul", "instructions": "Does the text mention incense (agarbatti), cooking, smoking, a mosquito coil, a diya or a heater?" },
    "fog_or_humid": { "type": "noul", "instructions": "Does the text mention fog, mist, humidity or rain?" }
  }
}
```

**What the user sees** (the code builds this from Jev's answers and the regex number):

> **You typed: purifier 487, indoors, incense burning.**
> Most home purifiers show PM2.5 in µg/m³, not AQI. 487 µg/m³ would be Severe on India's scale, but it's **your room**, with incense burning, not the city. The Dwarka station says ~270 right now (India scale, 25 min old).
> *Was it AQI, not µg/m³?* [ Yes ] [ No ]

**Why this keeps the honesty rules.** Jev labels *the user's words*, never *the air*. It never sees or decides an AQI, a verdict or a grade. This is the same rule the project already applies to Bedrock in [backend/src/taaza/phrase.py](../../backend/src/taaza/phrase.py): "words only: the model never sees a decision to make". If Jev is wrong, the user sees the wrong explanation template and the buttons to correct it. The verdict itself can't be wrong because of Jev.

**How to build it (mirror `phrase.py`):**
- Add an optional module `backend/src/taaza/jev.py` and a route `POST /explain` in the API Lambda.
- Store the key as a NoEcho SAM parameter `TypeSafeApiKey`, like `WaqiToken`. **Never put the key in `web/`.** Vite would ship it in the public JS bundle.
- Without a key, the screen is buttons only.

**Before trusting it:** write 30 labelled examples (10 Hindi, 10 Hinglish, 10 English) and check how often Jev gets them right, at what confidence. If Hindi is weak, send Hindi input straight to the buttons and use Jev only for English and Hinglish.

## Second-best uses

1. **Turn "trust is Delhi's main complaint" from anecdotes into a measured number.** Use Jev offline to label every r/delhi air-quality post from Oct 2025 to Jan 2026 by complaint type (trust/mismatch, go-out decision, mask, school, other). Bulk labelling is Jev's best documented use case (for example, 98,000 classifications in 10 minutes). The result would be one honest statistic for the video and blog. The round-5 pitch rests on this claim, and today it is backed only by quotes. Effort: a script, about 2 hours, plus Reddit data access.
2. **An honesty-rule gate for generated text.** Before showing any Bedrock-phrased Hindi sentence, ask Jev a few `noul` questions: does it make a health-outcome claim, blame anyone, say "tampered", or claim a "true AQI"? This is a recommended guardrail pattern; in one independent 111-case action-gate study, Jev matched 100 labels and Claude 102. **Weak here,** because Bedrock is optional, the parchi and copy are fixed templates, and Hindi accuracy is unproven.

## Don't use Jev for

- **Go/Wait/Stay, the neighbour flag, the grade or the range.** These are number comparisons (a documented Jev failure), and handing them to a model would break "AI may phrase, never decide".
- **Writing Hindi text.** Jev can't generate text. Keep Polly and the templates.

## Fit with the deadline

Round 5 put this translator at about 3 h, frontend only. Adding Jev makes it a backend route plus a SAM parameter: about **+2–3 h**, plus about 1 h for the 30-case test.

**Order:**
1. The scale fix (round-5 change 1).
2. The translator with buttons only. It works without Jev.
3. Jev free text on top, pre-filling the buttons.

If time runs out, ship step 2 and show Jev as "next".

Jev isn't an AWS service. It adds no "Built on AWS" points but costs none either: the rules allow "any other tools you like" as long as AWS is used.
