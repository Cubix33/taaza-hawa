# Blog: winning "Top 5 Blogs" at Environmental Hacks

This folder holds the research and the draft for the Taaza Hawa post on AWS Builder Center.
The prize is AirPods for 5 people, and the brief is the same as First Commit's, word for word:

> *Write up what you built: the problem, the stack, what fought back. Publish it on AWS Builder Center and link it in your submission.*

| File | What it is |
|---|---|
| [taaza-hawa-builder-center.md](taaza-hawa-builder-center.md) | **The post.** Ready to paste into Builder Center once the blockers are cleared |
| [PUBLISHING.md](PUBLISHING.md) | **Read this first.** Four blockers, the placeholders, image upload order, Builder Center steps and the final checks |
| [analysis/01-winners-teardown.md](analysis/01-winners-teardown.md) | The five First Commit blog winners, section by section, plus their projects |
| [analysis/02-haqcheck-postmortem.md](analysis/02-haqcheck-postmortem.md) | Why "Cedar Decides. The LLM Just Talks." didn't place |
| [images/](images/) | Cover and 4 figures (PNG, 1760 px), their HTML sources, `render.py`, `capture_live.py`, and one real pre-fix capture |

**Method.** On 9 Oct 2026, Playwright (Python, headless Chromium) scraped <https://www.wemakedevs.org/aws/first-commit/projects/blogs>. For each of the 5 blogs it rendered the Builder Center page, scrolled it, saved the text and image list, and measured it.
It also fetched each winner's GitHub README, the First Commit and Environmental Hacks rules and prize pages, the published HaqCheck article, WAQI's docs and demo feed, and the live Taaza Hawa API.
The raw scrapes stay out of this repo because the articles are other people's work. This folder keeps links, measurements and short quotes only.

---

## The short answer

1. **The blog prize is judged separately from the project.** None of the five blog winners placed in the project prizes, so a strong post can win on its own.
2. **Every winner published on the last day (20 Sep).** HaqCheck published on day 2, before anything had gone wrong that was worth writing about.
3. **"What fought back" is the spine of every winning post.** Each has 3–6 specific technical failures, told as cause → evidence → fix → lesson. The best ones are **silent** failures: tests green, production wrong.
4. **Real numbers, real code, real images.** Winners use 13–69 numbers, 0–9 code blocks and 3–12 images, with paragraphs of 11–29 words. HaqCheck had 0 code blocks, 0 body images and 80-word paragraphs.
5. **They're written for builders, not judges.** No winner mentions the rubric. HaqCheck quoted it.
6. **We have better material than HaqCheck had.** The live site shows a real, ironic, silent bug: the app whose product is *the age of the number* had the age wrong on 22 of 24 stations, with every test green. It also has a real "too perfect" track record (27/27). The draft is built around both.

---

## Blog against blog

✓ = clearly does it · ~ = partly · ✗ = doesn't. Evidence is in the two analysis files.

| Trait winners share | Slate | KavachPay | Career Agent | VaporTrace | Clusterbreak | **HaqCheck** (ours, Sep) | **Taaza Hawa** (draft) |
|---|---|---|---|---|---|---|---|
| Published after the build, on the last day | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ day 2 | ✓ planned 11 Oct |
| Cold open on one concrete moment or one sharp thesis | ✓ classmate's message | ✓ "authority" | ✓ "Education 5" | ✓ five log groups | ✓ "will it run?" | ✓ rider | ✓ 22 of 24 at "0 min" |
| The whole arc stated up front | ✓ | ✓ | ✓ one question | ~ | ✓ | ~ title only | ✓ "In short" |
| What fought back: 3+ specific technical failures | ✓ 3 pivots + bug | ~ designed-for race | ✓ 6+ | ✓ 3 | ✓ 6 | ✗ sourcing, CSS | ✓ 3 big + 5 small |
| A silent failure (green tests, wrong result) | ✓ | — | ✓ | ✓ no-op | ✓ died at 88 s | ✗ | ✓ clock clamp, 27/27 |
| Measured numbers, before/after | ✓ table | ~ worked example | ✓ 10 → 5 | ~ | ✓ | ✗ | ✓ table + live API |
| The core artifact shown as code (≤15 lines) | ✓ Cedar, TS | ✓ invariant | ✓ Cedar | ✗ | ✓ STS, cfn-lint | ✗ no Cedar shown | ✓ ASL, SendTaskSuccess, conformal |
| AWS as jobs or boundaries, plus cost | ✓ $0.00 | ✓ boundaries | ✓ table | ~ list | ~ list | ~ | ✓ table + cost |
| Claim boundaries | ✓ | ✓ ₹0 real funds | ✓ "evidence supports" | ~ | ✓ "~" provenance | ~ conceded the premise | ✓ "station air, not your street" |
| Scannable: ≥7 H2, short paragraphs, ≥3 images incl. architecture | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ 3 H2, 0 images | ✓ 12 H2, 6 images |
| Transferable lessons + a way to try it | ✓ | ✓ | ✓ + question | ✓ npm | ✓ | ✗ | ✓ + question |
| Never mentions the judging | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |

**Measurements.**
- Words: winners 980–2,190; HaqCheck 1,312; draft about 2,340 with the **[If converted]** K3 paragraph, or about 2,230 with **[If only labelled]**. That's long; see the risks below.
- Average paragraph: winners 11–29 words; HaqCheck 80; draft 29.
- Section headings (H2): winners 7–14; HaqCheck 3; draft 12.

---

## Project against project

| | Problem (one line) | AWS core | Real data | Live | IaC | Tests in the post |
|---|---|---|---|---|---|---|
| **Slate** | Your real timetable, including the class just cancelled | Cognito, AppSync, DynamoDB TTL, 4 Lambdas, S3, Cedar, Amplify | IIIT Allahabad: 1,801 students | ✓ + demo logins | — | — |
| **KavachPay** | Spending authority for AI agents | Cognito, API Gateway, Lambda, DynamoDB transactions, KMS, Secrets Manager, CDK | sandbox, ₹0 | ✓ | CDK | Attack Labs (8 scenarios) |
| **Career Agent** | Job-application agent with receipts | Strands + Bedrock GLM-5, DynamoDB Streams + outbox, SQS, Scheduler, Cedar, Playwright on Lambda, Polly, Transcribe, SES | live employer forms | ✓ | SAM | CI run linked |
| **VaporTrace** | One live view of an AWS event pipeline | S3, EventBridge archive/replay, Lambda + X-Ray, IoT Core | your own account | npm | CDK | — |
| **Clusterbreak** | Break your AI rig before you buy it | CloudFormation (g5.xlarge), STS ExternalId, Lambda, API Gateway, DynamoDB, cfn-lint | HF API, 15-device fit | ✓ | generated CFN | 37 + 9 + graders |
| **HaqCheck** | Which gig-worker welfare law covers you | Verified Permissions (Cedar), Lambda, API Gateway, DynamoDB, Bedrock Nova Lite, Amplify | legal text from secondary sources | ✓ | SAM | 25 + 15 live |
| **Taaza Hawa** | How old is Delhi's AQI, how sure are we, and were we right? | EventBridge Scheduler, 5 Lambdas, DynamoDB, **Step Functions `waitForTaskToken`**, Function URL, Polly, SES, Amplify, CloudWatch, (Bedrock) | 24 live Delhi stations, CAMS, CPCB bulletin | ✓ | SAM | 33 backend + 3 web |

**Where Taaza Hawa is strongest:**
- **Step Functions as a promise.** No winner used `waitForTaskToken`. Suraksha, the First Commit project winner, did, which is a hint that the organisers rate it.
- **A self-grading public record.** None of the five has an equivalent.
- **A bug that is about the product's own thesis.** The age of the number was wrong. That gives the post a stronger hook than any of the five winners had.

**Where it's weakest:**
- Two facts the post depends on aren't fixed in the code yet: the clock and the scale (see [PUBLISHING.md](PUBLISHING.md)).
- The authorship question: 26 of 31 commits are by Cubix33, while the team page lists one member.

---

## How the draft uses each winner's best move (the pattern, not the wording)

| From | The move | Where it is in our draft |
|---|---|---|
| Slate | Arc in one line; a silent bug that passed tests; before/after table; aphorisms | "In short"; "Thirty-six green tests and a wrong clock"; the fix table; "Three rules we're keeping" |
| KavachPay | One invariant in code; "boundaries, not logos"; claim boundaries | `is_judge_reading`; the one-job-per-service table; "What it does not claim" |
| Career Agent | One organising question; "what the evidence supports"; a closing question | Age, sureness, rightness throughout; "27 out of 27…"; the closing question about clocks you don't own |
| VaporTrace | An "in simple words" paragraph | The weather-app analogy |
| Clusterbreak | A list of gotchas unit tests can't see; provenance; screenshots | "Smaller things that fought back"; data credits; 6 images |

> **Borrow the pattern, never the phrasing.** The same organisers judge every stop on the tour, and they read Slate's post when they gave it the prize. An early version of our draft reused four of Slate's headings almost word for word. All four have been renamed.

---

## Risks to the post, and what to do about each

| Risk | What to do |
|---|---|
| A fact in the post isn't true when it's published (the clock fix, voided grades, the "kids" line, K3) | Clear all four blockers in [PUBLISHING.md](PUBLISHING.md) before publishing. If one can't be done, cut its sentence; don't soften it |
| About 2,340 words is longer than every winner (980–2,190) | If you need to cut, take out "Seven ideas died before the clock started" first (about 55 words), then the map bullet, then the second code block in "A promise is a waiting execution". Keep the clock, the 27/27 and the promise sections otherwise untouched |
| After the fix, the track record is still 100% | Say so plainly: "still too early: N checks since the fix". The paragraph's point is that you noticed |
| Judges also watch the film | Keep the post and the film saying the same thing in the same words: *how old the number is, how sure we are, and whether we were right* |

---

## Product issues found while doing this research

These belong to the app, not the blog, but the post can't be honest until they're addressed.

1. **The clock bug is live.** At 13:13 IST on 9 Oct, `/stations` returned `age_min: 0` for 22 of 24 stations. At 13:32 IST, `/card?uid=11266` held Alipur's 13:00 reading as 18:30. The cause is [waqi.py:41](../backend/src/taaza/sources/waqi.py#L41); WAQI's own demo feed confirms the `time.v` semantics.
2. **K3 (the scale) is probably wrong, and it affects safety.** WAQI's scale page uses the US EPA standard, but the Go/Wait/Stay rule applies CPCB bands. On 9 Oct at 13:13, 5 of 24 "Go" answers would be "Wait" under CPCB.
3. **The track record is too perfect:** 27/27, with every morning range exactly 90 points wide (the `±45` warm-up placeholder) and 18 of 23 crossing a band edge.
4. **The "kids" copy is still live** at [i18n.js:16](../web/src/lib/i18n.js#L16) and [:179](../web/src/lib/i18n.js#L179), and the SES email still calls a timeout "Missed".

Suggested code for 1 and 2, including a regression test, is in [PUBLISHING.md](PUBLISHING.md). It isn't applied: those changes are yours to make, and your other laptop may be pushing to `main`.
