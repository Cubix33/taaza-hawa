<!--
  AWS Builder Center draft. Publish on 11 Oct, after the two blockers in PUBLISHING.md are cleared.
  Every {{PLACEHOLDER}} must be replaced or deleted before publishing; the list is in PUBLISHING.md.
  Builder Center fields:
    Title:       The Number Has an Age
    Description: (the italic paragraph under the title below)
    Cover image: images/cover.png
    Tags:        aws-step-functions, amazon-dynamodb, aws-lambda, amazon-eventbridge, amazon-polly
-->

# The Number Has an Age

*We built a Delhi air-quality app whose one job is to tell you how old the number is. For two days it got the age wrong by five and a half hours, and all 36 tests passed. This post covers how a promise became an AWS Step Functions execution, why a perfect score was a bug report, and what real data did to the rest of the plan.*

![Taaza Hawa: the number has an age](images/cover.png)

At 13:13 IST on 9 October, our live API said 22 of Delhi's 24 stations had reported **0 minutes ago**.

That should have been impossible. WAQI, the free mirror we read, updates about once an hour. Twenty-two stations reporting in the same minute isn't fresh data. It's a clock reading the wrong time zone.

The app is called **Taaza Hawa** (ताज़ा हवा, "fresh air"). Its whole pitch is that every air-quality number has an age, and you deserve to see it. For the first two days of the hackathon it showed the wrong age on nearly every card. Every test was green.

> **In short:** we set out to show the age of Delhi's AQI and grade our own estimates in public. Real data broke three of our assumptions, in this order: the clock, our idea of what a good track record looks like, and the scale. Fixing each one made the product more honest than the plan.

Live: **[main.d2r1frd99buxhf.amplifyapp.com](https://main.d2r1frd99buxhf.amplifyapp.com/)** · Code: **[github.com/Cubix33/taaza-hawa](https://github.com/Cubix33/taaza-hawa)** · Demo: **{{YOUTUBE_URL}}**

## The problem is not the AQI, it's the age

Every October morning, someone in Delhi checks one number before a run, a walk or a cycle. That number has no age, no source and no error bar.

It is often old. On 4 October, the mirror most apps read showed Anand Vihar **31 hours** stale and NSIT Dwarka **56 hours** stale. On the same day, CPCB's own bulletin said 43 of 46 Delhi stations had reported.

Last season's loudest complaint on r/delhi wasn't "what is the AQI?". It was "can I trust it?":

> "too much smog outside… but the aqi is still showing 280?" (a Reddit user, r/delhi, Oct 2025)

**In simple words:** imagine a weather app that shows yesterday's temperature as if it were today's, without telling you. Taaza Hawa tells you when the reading was taken. If it's old, it gives an honest range instead of a single number. Later, it checks itself in public against what the station actually reported.

## What we built

| | |
|---|---|
| **One plain answer** | हाँ, जाइए (*Yes, go*) · अभी नहीं (*Not yet, wait*) · नहीं, आज अंदर रहिए (*No, stay in today*). The answer comes from a fixed, published rule on the CPCB AQI bands, plus a short "Why?" |
| **The age, always** | Every card says how many hours ago the station measured, and which source it came from. |
| **A range when it's old** | If a reading is more than 3 hours old, the card shows "AQI probably 232–264". That range comes from the three nearest live stations plus bias-corrected CAMS. The advice uses the top of the range. |
| **Check it and tell me** | One tap, no account. A Step Functions execution waits until that station reports again, then grades our range. |
| **A public track record** | Every station, every morning: right, or missed by N. |
| **Listen and share** | Amazon Polly reads the answer aloud in Hindi or English, and there's a one-tap WhatsApp share to family. |

![The Check my air page: the answer, why, how old the number is, and the range on a CPCB-coloured dial](../docs/screenshots/check.jpg)
*Figure 1. The answer, the reason, the age and the range on one card. {{RECAPTURE_WITH_LIVE_DATA}}*

## A promise is a waiting execution

The feature we're proudest of is the smallest piece of code. When you tap **Check it and tell me**, the check runs no loop and no timer of its own. A Step Functions Standard execution starts and parks itself on `waitForTaskToken`:

```json
"ParkUntilStationSpeaks": {
  "Type": "Task",
  "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
  "Parameters": { "FunctionName": "${RegisterFnArn}",
                  "Payload": { "holdId.$": "$.holdId", "token.$": "$$.Task.Token" } },
  "TimeoutSeconds": 259500,
  "Catch": [{ "ErrorEquals": ["States.Timeout"], "Next": "ExpireHold" }],
  "Next": "Notify"
}
```

The register Lambda saves the task token in DynamoDB next to the promise. The poller already runs every 15 minutes to read the stations. When it sees a newer reading for that station, it sends the real value back:

```python
token = hold.get("task_token")
if not token:
    return
try:
    sfn().send_task_success(taskToken=token, output=json.dumps(out))
except Exception as e:  # token already used / execution gone: grading is already stored
    print("send_task_success skipped:", repr(e))
```

The execution flips from **Running** to **Succeeded**, and the notify Lambda records the result for the page and sends an optional SES email. A promise *is* a waiting execution. It can wait 72 hours at no compute cost, and you can watch it in the console. (259,500 seconds is 72 hours plus a 5-minute buffer.)

![A promise is a waiting execution](images/loop.png)
*Figure 2. The station's own next reading is the judge. Values are illustrative.*

Two rules keep the judge honest:

- **Only a reading measured *after* the promise counts.** A backfilled old hour can't grade it:
  ```python
  def is_judge_reading(created_ts: int, reading_ts: int) -> bool:
      return reading_ts > created_ts
  ```
- **No evidence is not a miss.** We first counted a 72-hour timeout as "missed". It isn't: we just couldn't check. Timeouts now show as *couldn't verify* and stay out of the hit rate.

## A range calibrated on live data

The plan was to backtest our ranges on last season's OpenAQ history. On 4 October that feed was about 46 hours stale, so the backtest never ran.

Instead, the range calibrates itself on every poll. For each station that has just reported, the poller hides that station's own reading, re-estimates it from the neighbours and CAMS, and records the error. That is leave-one-out on live data. The estimator never uses a station's own value as an input, which is why hiding it works.

The range is split-conformal over those errors, targeting 80% coverage:

```python
def conformal_offsets(residuals, coverage=0.80, min_n=20):
    n = len(residuals)
    if n < min_n:
        return (-45.0, 45.0, False)  # placeholder band, flagged uncalibrated in the UI
    alpha = 1.0 - coverage
    s = sorted(residuals)
    k_hi = min(n, math.ceil((n + 1) * (1 - alpha / 2)))
    k_lo = max(1, math.floor((n + 1) * alpha / 2))
    return (s[k_lo - 1], s[k_hi - 1], True)
```

Until a station has 20 recorded errors, the card says *calibration warming up*. Keep that `±45` in mind; it comes back later.

## Thirty-six green tests and a wrong clock

WAQI's feed reports time like this:

```json
"time": { "s": "2026-10-09 06:00:00", "tz": "+05:30",
          "v": 1791525600, "iso": "2026-10-09T06:00:00+05:30" }
```

We read `v` as a UTC epoch. It isn't. It's the station's **local clock time** written as if it were UTC. You can check it on WAQI's public demo feed, where `v` decodes to 14:00 UTC but `iso` says 14:00+08:00, which is 06:00 UTC.

In Delhi, that made every reading look **5 hours 30 minutes younger** than it was. At 13:32 IST on 9 October, our API had Alipur's 13:00 reading stored as **18:30**, five hours in the future. The card said ताज़ा · 0 मिनट (*fresh · 0 minutes*). One line of defensive code had quietly hidden the impossible:

```python
def age_minutes(now_ts, reading_ts):
    return max(0, (now_ts - reading_ts) // 60)   # "from the future" became "0 minutes old"
```

![WAQI's time.v is not UTC](images/clock-bug.png)
*Figure 3. A 3½-hour-old reading looked like it came from two hours in the future, so it showed as "0 min old".*

The knock-on effects reached every feature:

| | Before the fix | After the fix |
|---|---|---|
| Stations shown as "0 min old" (9 Oct, 13:13 IST) | 22 of 24 | {{ZERO_MIN_AFTER}} |
| A reading turned "stale" (so the range appeared) after | really ~8 h 30 min | 3 h |
| Neighbours accepted as "live" inputs | up to ~8 h 30 min old | up to 3 h old |
| A reading allowed to grade a promise | from up to 5 h 30 min *before* it | only after it |

**Why every test passed:** all 33 backend tests built readings with timestamps we made up, such as `NOW = 1_790_000_000`. None of them parsed a real WAQI payload. The fix was two lines in the parser (read `time.iso`) and a regression test built from WAQI's own payload. {{FIX_COMMIT}}

The lesson for an app whose product is the age of a number: **a clamp that turns "impossible" into "zero" is where your worst bug will hide.**

## 27 out of 27 is a bug report

By lunchtime on 9 October, the public track record read **27 checks, 27 right**. It looked great, and it shouldn't have.

![27 out of 27 is a bug report](images/perfect-score.png)
*Figure 4. Every graded morning range on 9 Oct (live /scoreboard), with the station's real reading as a dot.*

A range that targets 80% coverage should miss about one time in five. Perfect means the range is too wide to miss. This chart shows why:

- **Every morning range was exactly 90 points wide.** That's the `±45` warm-up placeholder from earlier: no station had 20 live errors yet.
- **18 of the 23 ranges crossed a band edge** (100 or 200), so a single range covered two different answers.
- **Every real reading landed 37–87% of the way up its range.** None came near an edge.
- Some of those "hits" were graded by readings the clock bug had let in from *before* the promise.

So we voided every grade made before the timestamp fix ({{VOIDED_COUNT}} checks) and labelled them "before timestamp fix". The record shows the count next to every percentage. Since the fix: **{{HITS}} of {{GRADED}}**. {{UPDATE_ON_PUBLISH_DAY}}

## The number had a scale, too

<!-- K3: keep ONE of the two paragraphs below and delete the other. See PUBLISHING.md, blocker 2. -->

**[If converted]** While fixing the clock, we checked the scale. WAQI publishes Indian stations on the **US EPA** index, but our Go/Wait/Stay rule uses CPCB bands.

At the edge we cared about, the two disagree badly. A WAQI PM2.5 value of 176 is about 104 µg/m³, which CPCB calls **Poor**, while the raw number reads as Moderate. At 13:13 IST on 9 October, **5 of our 24 "Go" answers should have been "Wait"**.

We now convert WAQI's value back to a concentration using WAQI's own table, then compute CPCB's sub-index from that. Nothing in the UI changed except the answers that were wrong.

**[If only labelled]** Every number is now labelled "AQI as reported by WAQI (US EPA scale)". Until the conversion ships, we make no CPCB-band claims in the video.

## Smaller things that fought back

- **The deployed site quietly read a server on the viewer's own laptop.** A production build without `VITE_API_URL` fell back to `localhost:8787`. It now fails loudly instead.
- **Chrome auto-translate rewrote our Hindi toggle "हिं" to "Yes"** and undid every language switch. The fix: `translate="no"` on the page, and full-word labels on the toggle.
- **The 3D map sometimes drew itself in a 400×300 box** after a re-render during MapLibre's load. A ResizeObserver fixed it.
- **You could ask us to check a range you had never seen.** Fresh cards show no range, but the button still worked. The API now refuses with a `409`.
- **Polly can't be used to read arbitrary text.** The server builds the sentence itself, caps it at 700 characters and caches audio by its text. A test sends `"ignored attacker text"` to prove it.

## Seven ideas died before the clock started

Before 8 October we killed seven ideas on evidence. One, a "right hour for school PE" planner, died to its own data. The CAMS model put 13:00 ozone at DTU at **191 µg/m³**, while the measured value was **37**. That's why CAMS only enters a Taaza Hawa estimate after five measured ratios have bias-corrected it.

## The AWS side: one job per service

![Five Lambdas, one table, and a promise that waits](images/architecture.png)
*Figure 5. Region ap-south-1 (Mumbai), deployed with AWS SAM.*

| Service | Its one job |
|---|---|
| **EventBridge Scheduler** | Poll every 15 minutes, plus the 06:30 and 17:30 IST jobs, with no server |
| **Lambda** (×5) | Poller, API, and the three steps of a check: register, expire, notify |
| **DynamoDB** | One pay-per-request table: readings, calibration errors, promises, task tokens, cached audio |
| **Step Functions Standard** | A check *is* a waiting execution, for up to 72 hours |
| **Lambda Function URL** | A public API without API Gateway |
| **Polly (Kajal)** | Reads the answer aloud. The text is built on the server and cached |
| **SES** | Optional result email |
| **Amplify Hosting** | The Vite web app, rebuilt on every push |
| **CloudWatch** | An alarm when the poller keeps failing |
| **Bedrock** (optional) | Rephrases one Hindi sentence. Every number in the template must survive, or the sentence is discarded |

Cost so far: **{{COST_FROM_BILLING_CONSOLE}}**. Nothing runs between polls. The only per-call costs are Polly, where each wording is synthesised once, and Bedrock if it is switched on.

## What it does not claim

- **Station air, not your street.** It's an estimate, not the truth.
- **The rule is set for healthy adults** deciding about a run, a walk or a ride. It isn't for children, or for anyone with heart or lung disease. It is not medical advice.
- **It grades against the same CPCB station people distrust.** It can't settle "my purifier says 500". What it can tell you is how old the number is and how sure we are.

## Three rules we're keeping

1. **Test against the real payload, not the one you remember.** One recorded WAQI response in a fixture would have caught the clock on day one.
2. **A perfect score is a bug report.** If an 80% range never misses, check its width before you celebrate.
3. **Every sentence on screen is a claim.** Our first copy promised to tell parents when to "send the kids to play", while one fixed rule said *Go* at AQI 190. We cut the line rather than ship a promise the rule couldn't keep.

---

**Try it:** open the [live site](https://main.d2r1frd99buxhf.amplifyapp.com/), pick a station, and if its reading is more than 3 hours old, tap **Check it and tell me**. The [repo](https://github.com/Cubix33/taaza-hawa) deploys with AWS SAM (`sam build -t infra/template.yaml && sam deploy --guided`), and the backend tests run with no AWS account.

**Credits:** {{BYLINE_AND_TEAM}}. Built during WeMakeDevs × AWS Environmental Hacks, 8–11 October 2026, Track: Air.
**AI tools:** Claude Code (Claude Opus 5.5) helped write code, review it and draft this post. The structured review pass that caught the clock bug was run with it too. We checked every number in this post against the live API or the repo. {{EDIT_IF_NEEDED}}
**Data:** WAQI (aqicn.org), Open-Meteo CAMS, the CPCB daily bulletin, and map tiles by OpenFreeMap (© OpenStreetMap contributors).

*If you've built against a feed whose clock you don't own: how do you test for the time zone you didn't know was there?*
