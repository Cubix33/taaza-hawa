# Council verdict, round 4: who is Taaza Hawa for? (9 Oct 2026)

Inputs: [00-framed-question-and-advisor-responses.md](00-framed-question-and-advisor-responses.md) · [01-peer-reviews-and-fact-check.md](01-peer-reviews-and-fact-check.md)

## Where the Council Agrees

- **The primary user is a healthy adult who can choose *when* to go outside.** That means the morning runner or walker. Four of five advisors chose this, and Harshdip at 06:30 in Dwarka stays the face of the demo.
- **Cut "send the kids to play".** The single fixed rule says Go at AQI 190, while the child chip says a playing child takes in about 5× the dose. A judge will read that as a bug or a safety failure.
- **Office workers, delivery riders and construction workers are not users.** They have no choice to make, and telling people who earn outdoors to "stay in" is tone-deaf.
- **The edge is honesty, not who the user is.** No other app shows how old the number is, gives a range when it is stale, and grades itself in public.
- **"Wait" needs to say until when.** Right now it gives no time.
- **No new features.** Fix the bugs, change the labels, then film.

## Where the Council Clashes

- **Coach or PE teacher as primary (Expansionist) vs everyone else.** All five reviewers rated it the weakest answer:
  - it applies the child-safety contradiction to 40 children at once
  - one person can't film it
  - schools follow GRAP rules and Directorate of Education circulars, not an app
  - a 7 am practice can't wait until noon
  - the "83%" it quotes doesn't exist

  **Rejected.**
- **Who the person is vs the moment.** First Principles says define the user by the moment: an outdoor plan they can skip, at dawn, when they don't trust the number. Executor says pick the user you can film. **Both hold:** Harshdip is the face and trust is the pitch.
- **How far the trust claim goes.** Expansionist says the track record answers "smog outside but AQI shows 280?". Contrarian says it grades against the same station people distrust, so it can't fix distrust of the sensor. **Contrarian wins.** The claim is: *"we tell you how old the number is and how sure we are."*
- **Labels.** Outsider wants "Indian AQI (CPCB)" on every number, but the scale is unverified, so **don't print that yet**.
- **Bringing users back.** Reviewers 3 and 4 want a 06:15 SES email nudge. **"No new features" wins.** If SES already sends graded results, show that email arriving. Don't build a nudge.

## Blind Spots the Council Caught

- **The age stamp is wrong on every card.** This is the most important finding, and no advisor or reviewer caught it.
  - **Cause:** `waqi.py:40` treats WAQI's `time.v`, which is local clock time, as a UTC epoch. Every reading looks 5 h 30 min younger than it is. Readings that appear to be from the future get clamped to "0 minutes old".
  - **Promise broken:** "the age of every number, always" is false.
  - **The range branch rarely fires:** it needs a reading that is really about 8.5 h old.
  - **Stale neighbours count as live:** `estimate.py` accepts neighbours up to about 8.5 h old.
  - **The grading guarantee is broken:** `grader.py` lets a reading taken up to 5.5 h *before* a promise grade it.
  - **Tests miss it** because they use synthetic timestamps. A judge who compares one card with WAQI could find it.
- **The fix helps the demo.** With correct ages, more stations will show as stale, so the range (the main feature) should appear on camera without being staged.
- **The track record looks too clean.** It is 26/26, all from one day, with ranges about 90–115 points wide that often straddle a band edge. A sceptic reads 100% as "too wide to ever miss". Some of those hits may also be backfill grades caused by the timestamp bug.
- **The AQI scale is unverified (open item K3).** The thresholds are CPCB bands, possibly applied to US-EPA-scale numbers. If so, the verdict itself is wrong.
- **The calendar.** All 24 stations read 109–178 today, so tomorrow will likely be Go with no visible smog. Show Wait and Stay from recorded history, and never stage them.
- **Smaller points.**
  - The rule fits healthy adults only. Say so, and add "not medical advice".
  - "The range was right" is not the same as "the verdict was safe".
  - Hindi-first design, voice and share point to the family who receives the message.
  - Don't quote the Noida 837→200 swing; it probably isn't a CPCB AQI reading.

## The Recommendation

**Primary:** morning runners, walkers and recreational cyclists, meaning healthy adults deciding for themselves. Their plan can move, the rule fits them, and you can film it honestly tomorrow.

**Secondary:** family at home who receive the Hindi WhatsApp share or hear the Polly readout. This gives voice and share a real reason to exist. They receive the call; they don't make it.

**Explicitly excluded:**
- **Parents deciding for a child.** Go at 101–200 is the wrong default for children, and fixing it would need new science in two days.
- **Coaches and PE teachers.** The same flaw, times 40, and they are bound by GRAP and Directorate of Education rules.
- **Office workers.** They commute regardless.
- **Delivery riders and construction workers.** They have no choice, and "Stay in" insults them.
- **People with asthma, heart or lung disease.** The rule isn't built for them; say so on screen.

**On the two opinions that started this:**
- **"Office workers won't use it":** correct, and that's fine. Stop writing copy for them.
- **"A child or cyclist will":** cyclists yes. A cyclist makes the same decision as a runner, so name them in the copy, but you don't need to film one. Children no, not as the person deciding. Keep the child chip as information; the parent is who receives the share.

**Changes for the next ~44 hours, in priority order:**

1. **Fix the timestamp.**
   - In `parse_feed` ([backend/src/taaza/sources/waqi.py:40](../../../backend/src/taaza/sources/waqi.py#L40)), subtract the `time.tz` offset or parse `time.iso`.
   - Add a regression test built from WAQI's real payload: `v` 1791554400 with `tz` +08:00 must give 1791525600.
   - Run `sam deploy`, then confirm Dwarka's `reading_ts` is no longer in the future.
2. **Keep the track record honest.**
   - Void the grades made before the fix, or label them "before timestamp fix".
   - Show "N graded" next to the percentage.
   - Add one line: "ranges are wide while calibration warms up".
3. **Settle K3, in at most about an hour.** Compare one WAQI station value with CPCB's value for the same hour.
   - If they match, label the number "Indian AQI (CPCB scale)".
   - If they don't, convert the values, or label them "AQI as reported by WAQI" and make no CPCB-band claims in the video.
4. **Copy in [web/src/lib/i18n.js](../../../web/src/lib/i18n.js), Hindi and English.**
   - **`heroWhat`.** Before: "tells you whether it's OK to go out, run, or send the kids to play right now." After: "Before your morning run or walk: Go, Wait or Stay in, with how old the reading is and how sure we are."
   - **`probText`.** After: "The sky looks worse than the number, and no app tells you how old that number is. We show its age, give a range when it's stale, and grade ourselves in public."
   - **Wait.** Add: "Check again after the next reading. The 24-h line shows the trend."
   - **Button.** Rename "Check it and tell me" to "Hold me to this". Keep "split-conformal" off the home screen.
   - **Under the verdict.** Add: "Set for healthy adults. Not medical advice."
   - **Activity chips.** Have the jog chip selected by default.
5. **Filming.** Write the shot list tonight. Shoot for real on 10 Oct at 06:15. On the morning of 11 Oct, do a second take, edit, record the voiceover and submit.

**Demo story (3:00):**

1. **0:00–0:20.** Show a real r/delhi complaint, then a rival app showing a number with no time on it. Voiceover: "6:30, Dwarka, I want to run. Who do I believe?"
2. **0:20–0:55.** The home screen in Hindi and English: the real verdict, the "Why?", the age stamp, the source and the jog chip. Use the actual number.
3. **0:55–1:30.** A station that really is more than 3 h stale. Show the range from three neighbours plus CAMS, the advice taken from the top of the range, and Wait pointing to the 24-h line.
4. **1:30–2:05.** Tap "Hold me to this". Show the Step Functions execution waiting, then cut to a finished one graded Right or Missed, with its real time on screen.
5. **2:05–2:35.** The track record: N graded, hits and misses against the 80% target. Then 5 seconds of the Polly readout and a WhatsApp share to family.
6. **2:35–3:00.** Where AWS fits: EventBridge 06:30 → Lambda → DynamoDB → Step Functions → Polly and SES → Amplify. Closing line: "It won't tell you the air is clean. It tells you how old the number is, how sure it is, and whether it was right."

## The One Thing to Do First

Fix `parse_feed` in [backend/src/taaza/sources/waqi.py:40](../../../backend/src/taaza/sources/waqi.py#L40) so it subtracts the `time.tz` offset, and add a test built from WAQI's real demo payload. Run `sam deploy`, then reload the Dwarka card and check two things:

- its `reading_ts` is no longer ahead of the server's `now`
- a reading that is hours old no longer shows "0 minutes old"

Until this is fixed, every age stamp, range and grade in the video rests on a wrong clock.
