# Solo software idea search: FrameDebt

Date: 2026-10-04. This is pre-event research and product scoping, not an implemented hackathon project. The user's constraints are **software only**, **one person can build and film it**, and **no teacher, sweeper, principal, or other professional has to appear or cooperate**. Read this alongside [the playbook](../WINNER_PLAYBOOK.md) and [the complete council record](../council/round-3-solo/00-framed-question-and-anonymized-responses.md).

## Decision

**FrameDebt is the provisional engineering fallback**, a developer tool that detects media downloaded before the visitor reaches the interaction that needs it, offers a site-specific bounded-prefetch change, and independently replays both the arrival and complete interaction. The first integration is the entrant's own [portfolio](https://harshdipsaha.tech/). The council rated its demo potential **8/10 conditional**, but the later [environmental-fit review](../decision-review-2026-10-04.md) finds that too generous as a winning estimate for this event. The full viewer must remain usable after the change.

## New evidence from an owned site

A first-load browser inspection of the portfolio, with no user scroll, recorded Resource Timing entries for **204 resources** and **3,461,954 transferred bytes across those resource entries**. This excludes the navigation document, whose observed transfer was a further 14,630 bytes. The `/brain/1080/*.webp` MRI sequence accounted for **160 requests and 2,553,866 transferred bytes (73.8% of the resource-entry total)**. Two gallery images accounted for 417,566 bytes and 16 JavaScript resources for 222,059 bytes. The MRI section is farther down the page and asks the visitor to scroll through the slices. Thus this one run shows a clear mismatch between *delivery time* and *use time*.

This is a **single observed browser run**, not a cold-cache benchmark. Browser Resource Timing can be affected by cache state, viewport, resource timing availability, and compression/accounting conventions. Before claiming a reduction, repeat with a fixed viewport, cache policy, network profile, and scripted scroll; corroborate transfer with browser network/HAR records. No after-change measurement exists yet. The case supports a specific hypothesis, not a general claim about the site's usual traffic or power use.

## Search directions and why they lost

| Candidate | Live trigger and solo action | Why it loses to FrameDebt now |
|---|---|---|
| Smoke/PE intensity planner | AQI band yields a PE plan | The core decision is a lookup; no school user is available for a true action/confirmation, and environmental benefit is modeled. [Prior spec](../PROBLEM_STATEMENT_right-hour-pe-archived.md). |
| Saaf Twin | Solar hardware responds to conditions | Strong visual event, but it violates the user's software-only constraint. [Archived spec](../PROBLEM_STATEMENT_saaf-twin-hardware.md). |
| PulseProof household meter | Film the existing meter and switch a device | The user can toggle only a fan or lights while the meter stays in view. For a small load the pulse-interval change is slow/weak for a short, repeatable demo; [Energy Meter Reader](https://play.google.com/store/apps/details?id=reader.meter.energy.gmail.com.energymeterreader) already counts LED pulses and compares on/off. The initial 7/10 council vote was superseded by this new fact. |
| Tap Witness | Microphone identifies a dripping tap | Sound classification cannot reliably establish flow or saved litres without another truth source; the action can become a generic reminder. |
| Green Timeout | Stop an idle EC2 instance and confirm state | [AWS Cost Optimization Hub](https://docs.aws.amazon.com/cost-management/latest/userguide/cost-optimization-hub.html) and [Compute Optimizer idle recommendations](https://docs.aws.amazon.com/compute-optimizer/latest/ug/view-idle-recommendations.html) already cover much of the decision. Carbon impact remains indirect and the idea resembles generic cloud cost optimization. |
| Generic PayloadProof | Compress an image on an owned site, deploy, refetch | Existing image tools and [AWS Dynamic Image Transformation](https://docs.aws.amazon.com/solutions/latest/dynamic-image-transformation-for-amazon-cloudfront/lambda-architecture.html) make the action ordinary. It does not establish when bytes were needed or whether interaction quality survived. |
| **FrameDebt** | The portfolio loads 160 MRI frames before scroll; owner changes the loader; canary checks entrance and full viewer | Own site gives a measurable before state, real intervention, and independent after check with one actor. Novelty still depends on the end-to-end, interaction-aware verification. |

The meter [specification example](https://www.tpcentralodisha.com/pdf/customerzone/meter_tech_spec/SMART_METER_ENG.pdf) explains pulse constants; it cannot rescue a weak observed signal from the user's fan/light setup. The earlier council's complete candidate discussions remain preserved in [round 3](../council/round-3-solo/00-framed-question-and-anonymized-responses.md) and [peer review](../council/round-3-solo/01-peer-reviews-and-verdict.md).

## New web findings and competitive boundary

- The [2025 HTTP Archive Web Almanac page-weight chapter](https://almanac.httparchive.org/en/2025/page-weight) documents image weight at web scale. It supports the relevance of heavy media, but says nothing about this site's actual visitor behavior.
- [Chrome's offscreen-image guidance](https://developer.chrome.com/docs/lighthouse/performance/offscreen-images) shows that deferred loading is established practice. A simple “add lazy loading” suggestion is **not** a novel product. The former audit was removed in Lighthouse 13; do not present FrameDebt as discovering the first lazy-loading tool.
- [Amazon CloudWatch Synthetics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries.html) can run scripted browser journeys. Its [Puppeteer runtime](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Synthetics_Canaries_WritingCanary_Nodejs_Pup.html) can record network/HAR artifacts and screenshots. Use this for an independently executed, repeatable before/after trial, with artifacts in S3. The local preview is an exploratory finding; the AWS canary is the proof run.
- [IEA's analysis of streaming-video footprint claims](https://www.iea.org/commentaries/the-carbon-footprint-of-streaming-video-fact-checking-the-headlines) warns against treating transferred data as a fixed amount of energy or CO2. Report bytes and user-experience results directly. If a carbon scenario is ever shown, label every assumption and keep it outside the main receipt.

FrameDebt's plausible distinction is **detect premature delivery → propose a safe sequence-specific change → test no-scroll and full-scroll journeys → fail if frames are late/blank → publish raw evidence**. It is not a universal code-rewriting agent in four days. It is an owned-site integration and a reusable testing method.

## Four newly searched arXiv papers

These papers were searched for this direction rather than copied from the older air/solar material. Each is context, **not** proof that FrameDebt reduces electricity or emissions.

| Paper | Relevant finding | Limit for this idea |
|---|---|---|
| [Liu et al., *Mitigating Redundant Data Transfers for Mobile Web Applications via App-Specific Cache Space* (2016), arXiv:1605.06678](https://arxiv.org/abs/1605.06678) | Redundant web resource transfers can affect traffic, loading time, and energy; the authors test a cache packaging method. | It studies repeated transfers/cache, while FrameDebt studies resources fetched before a specific interaction. Its reported savings cannot be transplanted to this site. |
| [Rani et al., *Energy Patterns for Web: An Exploratory Study* (2024), arXiv:2401.06482](https://arxiv.org/abs/2401.06482) | Web energy practices require empirical checks; one studied pattern had evidence of benefit and another did not. | It does not measure this MRI loader or validate a byte-to-energy conversion. |
| [Horn et al., *Native vs Web Apps: Comparing the Energy Consumption and Performance of Android Apps and their Web Counterparts* (2023), arXiv:2308.16734](https://arxiv.org/abs/2308.16734) | Measures energy, traffic, CPU, memory and frame time separately for app journeys. | Different app comparison; supports keeping byte, performance and energy claims separate, not a predicted saving here. |
| [Gonçalves et al., *Energy Efficiency of Web Browsers in the Android Ecosystem* (2022), arXiv:2205.11399](https://arxiv.org/abs/2205.11399) | Browser energy outcomes differ by action and browser under replicated scenarios. | No universal browser energy multiplier follows from early-byte reduction. |

Additional context: [Dornauer and Felderer (2023), arXiv:2310.00788](https://arxiv.org/abs/2310.00788) compares image formats and performance across browsers; FrameDebt's primary change is *delivery timing*, so compression comparisons are only a baseline competitor. [Pachilakis et al. (2023), arXiv:2304.00927](https://arxiv.org/abs/2304.00927) models emissions of third-party tracking and likewise does not measure this site's energy.

## Exact pre-event kill test

Research-only rehearsal before Oct 8: confirm ownership and access to the loader source/deployment path; record two untouched baseline journeys with fixed settings: **arrive and do not scroll** and **scroll through all MRI slices**. Identify when each MRI request starts and whether all 160 really finish before interaction. Examine whether caching or preload rules explain the observation. Do not implement the project before the event clock.

During the event: implement bounded prefetch on an isolated deployment, then rerun the same journeys multiple times via the same browser runner. Require a large drop in entrance transfer and premature requests; no missing/blank frames, no material late-frame or scroll-smoothness regression, and no material increase in full-journey transfer. If this fails, publish “inconclusive/regressed” rather than a green receipt. If the baseline disappears under repeatable conditions, abandon this specific intervention.

## Winner-playbook readout

| Test | FrameDebt result |
|---|---|
| One person, moment, place | Portfolio owner publishes an image-rich interaction; a visitor opens the landing page before reaching it. |
| Camera event | Pre-scroll network waterfall bursts with 160 frames; after deployment it does not; the full viewer still advances. |
| Closed loop | Detect → owner approves a specific loader change → deploy → independent canary validates both journeys → pass/fail receipt. |
| Deterministic truth | Network requests/bytes, screenshots, frame availability, run settings; no LLM decides pass/fail. |
| AWS for a reason | CloudWatch Synthetics runs the impartial browser check; S3 holds HAR/screenshots; a small app/API renders and compares receipts. |
| Solo four-day feasibility | Feasible only as one real site's integration and one interaction pattern. Universal optimizer or auto-fix is out of scope. |

The [current hackathon page](https://www.wemakedevs.org/aws/env) lists the Waste & Energy track and emphasizes real impact, AWS use, execution, design and video.
