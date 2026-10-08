# Decision review: environmental fit versus solo proof

Date: 2026-10-04. Trigger: an external critique correctly noted that the [official event](https://www.wemakedevs.org/aws/env) asks whether a project fixes a real environmental problem and what changes for the people living with it; the Air track explicitly mentions school safety. This review revises the chair's earlier interpretation of the council's 8/10 FrameDebt score. The five advisor responses are preserved in the [council transcript](council/round-3-solo/01-peer-reviews-and-verdict.md); this is a subsequent chair correction, not a new council vote.

## What the critique gets right

- A PE decision directly concerns children's pollution exposure, while FrameDebt directly measures network transfer and can only infer any energy/emissions benefit. For this environmental event, that difference matters.
- The official [Idea and Impact criterion](https://www.wemakedevs.org/aws/env) should have been given more weight in the FrameDebt recommendation.
- A polished byte-reduction demo could be judged as ordinary web performance optimization. [Chrome already documents offscreen-image deferral](https://developer.chrome.com/docs/lighthouse/performance/offscreen-images).

## What its proposed Right Hour PE film cannot honestly show

The suggested 8:20 → 10:40 scene assumes that a useful day-ahead hour swap is common. In the local [measured CPCB/OpenAQ backtest](research/03-k1-measured-backtest.md), the best fixed slot was 13:00 and the proposed swap rule fired on only **4–6% of days**. The earlier “two smogs” argument came from a CAMS model that overstated measured midday ozone at DTU about fivefold. The [smoke-forecast test](research/04-smoke-forecast-test-and-next-idea.md) also found little day-ahead skill beyond copying today's PM2.5. An archived day can be replayed, but must be labelled as replay, not a live prediction.

A principal tapping **हाँ** in the entrant's solo film would be the entrant role-playing a principal. The user has explicitly ruled out relying on another professional. Without a real school decision and activity, a later **BEAT** can grade a station-level concentration comparison but cannot verify that children changed PE, experienced a lower personal dose, or benefited. Measured *ambient air at two times* is not measured *outcome for a participating child*. The feed was also about 46 hours stale during the prior check, so the measured receipt could arrive late or fail.

The later **PE intensity** variant avoids the failed hour-forecast claim and has a plausible exposure mechanism, but its AQI-band decision is mostly a lookup. Its modeled 71% reduction during a 40-minute period assumes a real high-to-light switch; no school user or observation is available to confirm that switch. This is a promising public-health intervention for a school pilot, but not yet a verified solo hackathon demo.

## Revised comparison

| Criterion | Right Hour PE timing | PE intensity variant | FrameDebt |
|---|---|---|---|
| Fit to event's environmental theme | Strong | Strong | Weak to moderate; energy connection unmeasured |
| Evidence for core proposed action | Weak: only 4–6% swap days under own rule | Mechanism plausible, but no school implementation | Strong single observed defect; after-fix measurement pending |
| Real solo action and verification | Role-play only | Role-play/self-report only | Owner can actually deploy and independently measure their site |
| Novelty risk | Late PE/air advice can be a fixed poster | AQI band → activity can be a lookup | Lazy loading/performance audits exist |
| Event decision today | **Do not revive as pitched** | Keep as future pilot or fallback if a real school actor becomes available | **Provisional engineering fallback**, not a validated winning pick |

These are qualitative findings, not fabricated probabilities or official scores. The council's **8/10** described FrameDebt's *concept/demo potential* under the solo constraint. It was too generous as a **winning estimate for this environmental event**. No option here honestly deserves a 10/10 claim today.

## What to do next

1. **Do not script the principal-tap PE story as a real intervention.** If showing a simulated school workflow, label it simulated and do not call station data a child outcome.
2. **Keep FrameDebt as the buildable fallback**, but test the environmental claim: repeat the baseline, record actual no-scroll and full-scroll journeys, and inspect whether a bounded loader change avoids transfer for visits that never reach the MRI. Do not convert bytes to CO2 without independent energy evidence.
3. **Search for a third solo-software idea with a directly observable environmental action**, owned by the entrant and possible to complete within three minutes. Reject it unless the entrant can film a real before/action/after sequence, the measured metric is genuinely environmental, and AWS has a consequential role. An actual household electricity or water change would be stronger than a modeled child exposure claim, but no such third idea has passed a physical feasibility and novelty test yet.
4. Make the final build choice by the event start, Oct 8. If no third idea passes, use FrameDebt with a modest, honest claim or deliberately accept PE as a simulated workflow rather than claiming a real school outcome.

The [current FrameDebt problem statement](PROBLEM_STATEMENT.md) remains useful as a detailed fallback build spec. The [Right Hour PE archive](PROBLEM_STATEMENT_right-hour-pe-archived.md) remains archived because K1 failed. The [PE intensity research](research/04-smoke-forecast-test-and-next-idea.md) remains a possible future pilot, with its measurement limitations explicit.
