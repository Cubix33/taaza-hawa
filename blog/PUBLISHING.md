# Publishing the Taaza Hawa post

The post is [taaza-hawa-builder-center.md](taaza-hawa-builder-center.md). **Publish on Sunday 11 Oct, after the film is recorded and before you submit.** Submissions open at 08:00 IST.

Every First Commit winner published on the last day. HaqCheck went out on day 2 with nothing yet to report, and didn't place (see [analysis/02-haqcheck-postmortem.md](analysis/02-haqcheck-postmortem.md)).

---

## 1. Blockers: the post isn't true until these are done

### Blocker 1: the WAQI clock (`time.v` is local time, not UTC)

**Evidence:**
- [backend/src/taaza/sources/waqi.py:41](../backend/src/taaza/sources/waqi.py#L41) still reads `ts = int(d["time"]["v"])`.
- WAQI's own demo feed, checked on 9 Oct, returns `{"s":"2026-10-09 14:00:00","tz":"+08:00","v":1791554400,"iso":"2026-10-09T14:00:00+08:00"}`. `v` decodes to 14:00 UTC, but `iso` is 06:00 UTC.
- On the live API at 13:13 IST on 9 Oct, `/stations` reported **22 of 24 stations as `age_min: 0`**. The `max(0, …)` clamp in [freshness.py:9](../backend/src/taaza/freshness.py#L9) is what produces that number.

**Suggested fix.** This is not applied; it's here to save you time.

```python
# backend/src/taaza/sources/waqi.py
from datetime import datetime

def _epoch(t: dict) -> int:
    """WAQI's time.v is local wall-clock time written as if UTC; time.iso carries the real offset."""
    if t.get("iso"):
        return int(datetime.fromisoformat(t["iso"]).timestamp())
    sign = -1 if t.get("tz", "+00:00").startswith("-") else 1
    hh, mm = t.get("tz", "+00:00")[1:].split(":")
    return int(t["v"]) - sign * (int(hh) * 3600 + int(mm) * 60)

# in parse_feed:  ts = _epoch(d["time"])
```

**Regression test, built from WAQI's real payload** (the values the council recommended):

```python
# backend/tests/test_core.py
from taaza.sources.waqi import parse_feed

def test_parse_feed_reads_real_utc_not_local_clock():
    j = {"status": "ok", "data": {"idx": 1, "city": {"name": "X", "geo": [28.6, 77.2]},
         "iaqi": {"pm25": {"v": 150}},
         "time": {"s": "2026-10-09 14:00:00", "tz": "+08:00", "v": 1791554400,
                  "iso": "2026-10-09T14:00:00+08:00"}}}
    assert parse_feed(j).ts == 1791525600
```

**Then:**
1. Run `sam build -t infra/template.yaml && sam deploy`.
2. Reload the Dwarka card and confirm `reading_ts` is no longer ahead of `now`.
3. Mark every grade created before the deploy as "before timestamp fix" and leave it out of `accuracy()`. The post says this was done.

### Blocker 2: K3, the scale of WAQI's numbers

**Evidence:**
- <https://aqicn.org/scale/> says its index is "as defined by the US-EPA 2016 standard".
- Its conversion table (60 µg/m³ → 152, 100 → 173, 140 → 194, 160 → 210) matches the US EPA 2012 PM2.5 breakpoints.
- [aqi.py](../backend/src/taaza/aqi.py) applies **CPCB** bands to those values directly, on the assumption in [waqi.py:3-5](../backend/src/taaza/sources/waqi.py#L3-L5).

**Impact on today's live data (9 Oct, 13:13 IST):**
- 5 of 24 stations answer **Go** where CPCB would say **Wait**. These are the WAQI values 170, 171, 175, 176 and 178.
- For example, 176 is about 104 µg/m³, which is a CPCB sub-index of about 246, in the Poor band.

**Confirm in about 10 minutes:** compare one WAQI station-hour against CPCB's dashboard (solve the captcha by hand) or against that station in CPCB's daily bulletin.

**Suggested conversion** (not applied). Run it in `parse_feed`, the only place the assumption lives:

```python
# US EPA (2012) breakpoints, which WAQI's own scale page uses: (conc_lo, conc_hi, idx_lo, idx_hi)
US_EPA = {
    "pm25": [(0.0, 12.0, 0, 50), (12.1, 35.4, 51, 100), (35.5, 55.4, 101, 150), (55.5, 150.4, 151, 200),
             (150.5, 250.4, 201, 300), (250.5, 350.4, 301, 400), (350.5, 500.4, 401, 500)],
    "pm10": [(0, 54, 0, 50), (55, 154, 51, 100), (155, 254, 101, 150), (255, 354, 151, 200),
             (355, 424, 201, 300), (425, 504, 301, 400), (505, 604, 401, 500)],
}

def us_aqi_to_conc(pollutant: str, idx: float) -> float:
    for c_lo, c_hi, i_lo, i_hi in US_EPA[pollutant]:
        if idx <= i_hi:
            return c_lo + (c_hi - c_lo) * (idx - i_lo) / (i_hi - i_lo)
    return US_EPA[pollutant][-1][1]

# values[p] = aqi.sub_index(p, us_aqi_to_conc(p, float(d["iaqi"][k]["v"])))
```

**Then:** keep the **[If converted]** paragraph in the post's "The number had a scale, too" section, and delete **[If only labelled]**. If you can't ship the conversion, keep **[If only labelled]** instead, and remove every CPCB-band claim from the video.

### Blocker 3: the byline and the team page

- `git log` shows 26 of 31 commits by `Cubix33 <anshikaa5667@gmail.com>`, plus 1 by "Anshika Singh". There are 4 by you.
- [thishack.md](../thishack.md) shows the team as "1 of 4 seats filled".
- **If Anshika is a teammate,** add them on the team page **before you submit**. The site says "You cannot change your team after you submit your project." Then put both names in `{{BYLINE_AND_TEAM}}`.
- **If Cubix33 is your own second account,** write "Built by Harshdip Saha". The post already says "we" throughout, so it reads correctly either way.

### Blocker 4: claims the post makes that the app doesn't back yet

| The post says | Today | Do this |
|---|---|---|
| "We cut the line" about "send the kids to play" | Still in `heroWhat`, Hindi and English, at [web/src/lib/i18n.js:16](../web/src/lib/i18n.js#L16) and [:179](../web/src/lib/i18n.js#L179) | Apply the council's rewrite ([02-verdict.md](../docs/council/round-4-audience/02-verdict.md), item 4), or delete lesson 3 |
| "The rule is set for healthy adults… not medical advice" | Not shown on screen | Add the council's line under the verdict |
| "Timeouts now show as *couldn't verify*" | True in the UI (`f13e3a5`), but the SES email still says "Missed, still waiting" ([hold_tasks.py:40](../backend/src/handlers/hold_tasks.py#L40)) | Fix the email text, or say "on the page" |
| "The fix was two lines in the parser" | Not merged | Blocker 1 |
| "{{VOIDED_COUNT}} checks voided" | Not done | Blocker 1, step 3 |

---

## 2. Placeholders

| Placeholder | How to fill it |
|---|---|
| `{{YOUTUBE_URL}}` | Your demo video, public or unlisted. Open it in a signed-out browser first |
| `{{ZERO_MIN_AFTER}}` | After the fix: `curl -s $API/stations`, then count stations with `"age_min": 0` |
| `{{FIX_COMMIT}}` | e.g. "([commit `abc1234`](https://github.com/Cubix33/taaza-hawa/commit/abc1234))" |
| `{{VOIDED_COUNT}}` | The number of grades marked "before timestamp fix" |
| `{{HITS}}` / `{{GRADED}}` | `curl -s $API/scoreboard`, then `accuracy.hits` / `accuracy.graded` after voiding. **If it's still 100%, rewrite that paragraph honestly** ("still too early: N checks"). Don't stretch it |
| `{{UPDATE_ON_PUBLISH_DAY}}` | Delete it once the numbers are filled in |
| `{{COST_FROM_BILLING_CONSOLE}}` | Billing → Bills, month to date, e.g. "$0.03 for the hack, mostly Polly" |
| `{{RECAPTURE_WITH_LIVE_DATA}}` | Run `py blog/images/capture_live.py` after the fix, then swap in `images/live-check.png` (see §3) |
| `{{BYLINE_AND_TEAM}}` | Blocker 3 |
| `{{EDIT_IF_NEEDED}}` | Adjust the AI-tools line to what you actually used, then delete the marker |

`$API` is `https://ktmdmcvoyilf7pfl5npdigkyaq0uucbi.lambda-url.ap-south-1.on.aws`, read from the live site's network calls.

---

## 3. Images, in upload order

All PNGs are 1760 px wide. Re-render with `py blog/images/render.py` after any edit to `images/src/*.html`.

| # | File | Where in the post | Notes |
|---|---|---|---|
| cover | `images/cover.png` | Builder Center cover field, and under the title | |
| 1 | `docs/screenshots/check.jpg`, or `images/live-check.png` | "What we built" | The current screenshot uses **labelled demo data**. Replace it with a live capture after the fix |
| 2 | `images/loop.png` | "A promise is a waiting execution" | Illustrative values, and the caption says so |
| 3 | `images/clock-bug.png` | "Thirty-six green tests and a wrong clock" | |
| 4 | `images/perfect-score.png` | "27 out of 27…" | **Real data**: live `/scoreboard`, 9 Oct, 13:13 IST |
| 5 | `images/architecture.png` | "The AWS side" | |
| optional | `images/before-fix-check.png` | Next to Figure 3, as "before" | **Real capture**, 9 Oct 13:32 IST: Alipur shown as "ताज़ा · 0 मिनट / यह नंबर ताज़ा है, भरोसा कर सकते हैं" while the API had the 13:00 reading stored as 18:30. Pair it with `live-check.png` after the fix for a before/after |
| optional | `docs/screenshots/air-lens.png`, `record.jpg`, `mobile-check.jpg` | After Figure 1, or at the end | Clusterbreak won with 12 images; four to six is plenty |

**Better still:** add one image of the **Step Functions console** showing an execution going from Running to Succeeded, captured during filming. No winner showed the console, and it's the strongest proof that this runs on AWS.

---

## 4. Builder Center steps

1. **Title:** `The Number Has an Age`
2. **Description:** paste the italic paragraph from the top of the post.
3. **Cover:** `images/cover.png`
4. **Body:** paste from "At 13:13 IST on 9 October…" to the end.
   - Delete the top HTML comment and the K3 paragraph you aren't using.
   - Re-insert each image where its `![...]` line was, with its caption in italics underneath.
   - Set code-block languages: `json`, `python`.
   - Check that both tables survived the paste.
5. **Tags** (searchable services first): `aws-step-functions`, `amazon-dynamodb`, `aws-lambda`, `amazon-eventbridge`, `amazon-polly`. Swap one for `amazon-bedrock` only if Bedrock is on in production; `BedrockModelId` defaults to empty.
6. **Preview on a phone.** Check that every table scrolls and no paragraph runs longer than a screen.
7. **Publish,** then put the link in the README and in the submission form. Keep the post in this folder as the source of truth.

---

## 5. Last read-through before publishing

- [ ] No `{{` is left anywhere (search for it).
- [ ] Every number matches the live API on publish day, or is dated ("on 9 Oct at 13:13").
- [ ] The judges, the rubric and the prizes are never mentioned (HaqCheck's mistake 6).
- [ ] Every AWS service in the table appears in the video.
- [ ] Reddit quotes are credited as "a Reddit user", with no usernames.
- [ ] The post doesn't use "dark", "tampered" or "true AQI", and makes no health-outcome claims (the honesty line in the README).
