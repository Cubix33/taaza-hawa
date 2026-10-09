# What a winning hackathon blog looks like

Distilled from the five winning posts at WeMakeDevs × AWS First Commit (Sep 2026)
and confirmed against the Environmental Hacks brief. No names, no quotes — just the
repeatable patterns.

---

## 1. Publish on the last day

Every winner published on the final day of the hackathon. A post written before
anything has gone wrong has nothing worth writing about. Ship the product first,
then write up what hurt.

---

## 2. Cold open: one concrete moment or one sharp thesis

The first 50 words commit to a single anchor — a screenshot, a number, a failure
message, or a one-sentence thesis. Judges scan; the cold open decides whether they
read the rest. Options that work:

- A real number that shouldn't be possible ("22 of 24 stations reported 0 minutes ago")
- A product moment the reader has felt ("the class you skipped is still on the timetable")
- The shape of the whole arc stated as a puzzle ("we set out to do X; real data had other ideas")

What doesn't work: a paragraph about the problem space before the project appears.

---

## 3. State the whole arc in one sentence up front

After the cold open, one sentence (or a short blockquote) says where this is going:
what was built, what went wrong, what changed. This is not a spoiler — it's a
contract with the reader that lets them trust the structure.

---

## 4. "What fought back": three or more specific technical failures

This is the spine of every winning post. Each failure follows the same four beats:

1. **Cause** — what assumption was wrong, or what the code actually did
2. **Evidence** — the log line, the API response, the number that was impossible
3. **Fix** — two to six lines of real code, or a one-sentence architectural change
4. **Lesson** — what you'd do differently, in one transferable sentence

**Silent failures score highest.** A silent failure is one where tests were green,
CI passed, or the metric looked fine — but production was wrong. Judges read a
hundred posts where things visibly broke. A failure that hid itself is a story.

---

## 5. Real numbers, before and after

Winners use 13–69 concrete numbers in the body. Not "it was slow" — "it added 8.5
hours of lag to every reading". Use a before/after table for any fix that changed
a measurable outcome. One table is worth three paragraphs of explanation.

---

## 6. The core artifact shown as code (≤ 15 lines)

One code block that a builder would want to copy: the state machine definition,
the invariant, the calibration function, the policy document. Not a snippet to prove
you wrote code — a snippet that shows the idea. Cap it at 15 lines. If it needs
more, the idea isn't isolated yet.

---

## 7. AWS as jobs, not logos

Don't list services. List jobs. One row per service, one column for its one job.
"DynamoDB — one pay-per-request table: readings, tokens, cached audio" beats
"We used DynamoDB for storage." Add cost (even "$0.00 this month") — it shows
the project is real and running.

---

## 8. Claim boundaries

State what the product doesn't do, can't know, or isn't trying to prove. Winners
do this directly ("the rule is set for healthy adults, not for anyone with lung
disease") and it reads as honesty, not weakness. Hedging everywhere is different
from one clear boundary section.

---

## 9. Scannable structure

Winning posts have 7–14 H2 headings, average paragraphs of 11–29 words, and 3–12
images including at minimum a cover and an architecture diagram. The reader should
be able to skim the headings and reconstruct the arc without reading a word of body
text.

---

## 10. Transferable lessons + a way to try it

End with 2–4 lessons a builder working on something different could apply tomorrow.
Then one line with a working link to the live product and the deploy command.
Don't summarise what you just wrote — the lessons should be the new information.

---

## 11. Never mention the judging

No rubric. No prize. No "we hope the judges". Write for another builder who found
your post by accident. Judges can tell when they are being addressed.

---

## 12. Length

980–2,200 words. Under 1,500 is possible if the failures are tight. Over 2,200
and judges scan instead of read; cut the "ideas that didn't make it" section first.

---

## Anti-patterns (confirmed failures)

- Publishing early, before anything broke, before there was anything to report
- Quoting the judging rubric
- No code blocks in a technical post
- No images (even a CLI screenshot counts)
- 80-word paragraphs
- Burying the product under a problem-space introduction
- "We used Service X for Y" (list of logos, not list of jobs)
- A track record that is suspiciously perfect with no explanation
