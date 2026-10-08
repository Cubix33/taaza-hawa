# Round 3 council peer reviews and verdict

Date: 2026-10-04. Read [the framed question and all five independent responses](00-framed-question-and-anonymized-responses.md) first.

> **Current decision is in the post-council addendum below.** The original PulseProof verdict is preserved as the council's first decision and was superseded when the entrant specified that only a fan or lights can be switched while the meter is in view, and when the owner's website supplied a stronger measurable problem.

> **Later chair correction:** The [environmental-fit decision review](../../decision-review-2026-10-04.md) challenges the updated 8/10 FrameDebt winning interpretation. The advisor votes below remain verbatim historical advice; the current event choice is provisional.

Anonymized mapping, disclosed after review: **A = Scientific Evidence Analyst; B = Contrarian; C = Product and UX Analyst; D = Feasibility Analyst; E = Winner Analyst.** The council used five independent first-round responses and five independent anonymous peer reviews. The workspace permits three child agents at once alongside the chair, so the five responses and reviews were collected in batches without showing advisors prior responses during the first round.

## Peer review: Feasibility Analyst

1. **Strongest: Response B.** It tests PulseProof against its direct competitor, distinguishes a repeatable meter measurement from appliance attribution, and gives a clear kill test. Its 6/10 rating reflects the evidence better than the higher scores.
2. **Biggest blind spot: Response C.** Its “find the device raising your bill” framing promises more than an aggregate meter can identify. Turning a hair dryer off makes a convincing visual demo, but says little about avoidable everyday waste or lasting environmental impact.
3. **What all five missed:** The demonstration needs a *wasteful use case*, not merely a detectable high-power toggle. A controlled experiment can prove that switching off an appliance lowers demand; judges may find that obvious. The next test should ask whether a solo user can reveal a genuinely overlooked, avoidable load, measure it within the video's time limit, and show an action they would keep. That tension between **interesting waste** and **enough meter pulses for a short demo** may decide whether PulseProof is worth building.

## Peer review: Winner Analyst

1. **Strongest: Response B.** It treats the existing Play Store product as a direct competitor rather than a passing caveat, and makes two falsifiable gates: repeated meter measurements and a feature-by-feature comparison. Its lower score is better calibrated to the novelty risk, while its proposed controlled experiment is still a concrete path forward.
2. **Biggest blind spot: Response C.** Its polished five-screen ON→OFF→ON→OFF journey assumes multiple stable pulse windows, appliance switching, camera alignment, and a legible result all fit within three minutes. Without actual pulse frequency and meter/appliance layout, that flow may be impossible to film alone. Its UI specificity risks committing to an untested choreography.
3. **What all five missed:** The solo-shot logistics are a product constraint, not merely a video detail. The phone must stay fixed on the meter for trustworthy intervals, yet the entrant must physically toggle an appliance, perhaps far from the meter. Test the exact meter/appliance distance and transition timing in one continuous recording. If the operator exits frame, the receipt should timestamp the user-declared switch point and label it as declared, while showing the independently observed pulse-rate change. This is also where the evidence claim must avoid implying visual proof of the specific appliance switch.

## Peer review: Contrarian

1. **Strongest: Response A.** It is the most disciplined about what the meter proves: a whole-home power-rate change at one moment. It names the raw evidence the receipt needs (pulse count, printed meter constant, windows, uncertainty), separates measured values from annualized cost/carbon scenarios, and defines a fast kill test. Response C has the clearest screens, but it adds a complex ON→OFF→ON→OFF sequence before proving that one transition is detectable.
2. **Biggest blind spot: Response D.** Its suggested manual pulse-marking fallback may save a demo but can undermine the claimed automatic camera measurement and make AWS evidence capture feel ornamental. It also assumes a shareable receipt itself differentiates the product from the existing app without specifying a demonstrably better decision or outcome.
3. **What all five missed:** Solo filming logistics. The phone must stay fixed on the meter while the entrant switches an appliance that may be rooms away. A continuous proof video could show only flashes and a spoken claim about the switch. Before committing, stage the exact shot using the allowed laptop webcam or a visible switch in the meter's vicinity; do not buy another device. If the action and meter change cannot be honestly captured in one coherent sequence, the core judge-facing advantage shrinks. They should also inspect the competitor's *actual UX*, not just its listing, before asserting the receipt is unique.

## Peer review: Scientific Evidence Analyst

1. **Strongest: Response B.** It tests the idea against the existing app rather than treating a replayable receipt as automatically novel. Its two-part kill test—repeatable meter signal *and* feature-by-feature competitor comparison—is the right threshold before spending four days building. Its lower score is credible given the originality risk.
2. **Biggest blind spot: Response A.** Its measurement discipline is excellent, but it leaves the event's AWS criterion and the exact user-visible difference from Energy Meter Reader unresolved. An “auditable experiment” is still a claim until the competitor's workflow and receipt are inspected directly.
3. **What all five missed:** The solo filming choreography is a feasibility dependency. The phone must remain aimed steadily at the meter while one person toggles an appliance, reads instructions, and captures an intelligible three-minute demo. If the switch is distant, or the phone must be touched mid-trial, timing and visual continuity weaken. Rehearse the physical path and camera arrangement before specifying screens. Also verify the exact meter's `imp/kWh` label, pulse rate, and access conditions; generic meter papers cannot establish those facts.

## Peer review: Product and UX Analyst

1. **Strongest: Response B.** It treats originality as a kill criterion, not a footnote. The existing app already counts pulses and compares on/off states, so B's demand for a feature-by-feature comparison alongside repeated meter trials is the clearest test of whether PulseProof deserves a weekend build. Its lower score is better calibrated than a high score based on demo appeal alone.
2. **Biggest blind spot: Response D.** Manual pulse marking might rescue a measurement but removes the automatic sensing that makes the product distinctive and the live demo convincing; a receipt based on manual taps would need a visibly different evidence label. D also does not specify the repeated trial that separates appliance effects from coincident load changes.
3. **Shared omission:** All five assume the solo filming choreography works. One phone must keep its rear camera fixed on the meter while the entrant toggles an appliance, views instructions, and records proof, possibly with the laptop as the only second screen. Test that exact physical setup and browser permission/recording path before naming the idea. Also clarify whether the competition values an observable household watt reduction enough despite existing pulse reader apps.

## Council verdict

### Where the council agrees

- **PulseProof is the strongest of the four current candidates**, because the entrant can cause and measure a physical change alone. Five of five first-round advisors selected it.
- The existing pulse-reader app makes raw flash counting and a simple on/off comparison insufficient. Differentiation must be a controlled, repeated, interpretable household experiment and a useful decision after the result.
- The meter measures **whole-home power change during the trial**. It does not identify an appliance without an intervention or establish long-term electricity or carbon savings. A “no detectable change / inconclusive” result is part of the product.
- The actual meter, chosen appliance, camera path, pulse frequency, and solo shot must be tested before committing. A 10/10 score or win guarantee would be invented.

### Where the council clashes

- **Current winning-potential score:** advisors gave PulseProof 6, 6.5, 7, 7.5, and 7.5/10. The chair assigns **7/10 conditional concept potential**, with a route to about 8/10 if a wasteful load, repeatable measurement, and distinctive evidence flow are shown. These are judgments, not win probabilities.
- **Manual pulse fallback:** it could keep the product usable, but it cannot be presented as automated meter verification. If added, label manual trials separately and keep automatic reading as the judged core.
- **Cloud Leak as backup:** scientifically cleaner AWS state transitions, but weaker environmental proof and strong overlap with Beacon. Use only if the meter kill test fails.

### Blind spots caught in peer review

- A high-watt kettle or hair dryer makes an easy meter demo but is not evidence of *wasted* energy. The central story must be an avoidable routine (for example, a desktop left running unused), with a projection explicitly conditional on future behavior.
- One person must keep the camera aligned while reaching a switch and recording the demo. The app should support a timed, hands-free sequence; the demo must show or honestly label the user-declared switch point.
- The existing competitor's listed features are verified; its full in-app trial and receipt UX have **not** been inspected. Do not claim unique features until that comparison is done.

### Recommendation

**Provisionally choose PulseProof as “Meter Trial”: test the claim that a household action reduces whole-home draw, with repeated ON/OFF readings and a receipt that can also say “inconclusive.”** Keep one responsive mobile website, one real meter, one solo actor, and a short AWS-backed evidence trail. If a real avoidable load cannot be measured clearly or the competitor already supplies an equivalent guided evidence flow, return to idea search before the event. This historical recommendation is superseded by the addendum below.

### The one thing to do first

Record a **raw, unedited meter-and-switch trial** with an appliance that is sometimes left running unnecessarily. Note the printed `imp/kWh`, count pulses in two ON and two OFF windows, and see whether the change remains clear within three minutes. This is research and practice; do not start project implementation before the event clock.

---

## Post-council addendum: new constraints and owned-site evidence

The first-round council was answering a different fact pattern. The entrant then said the only appliance they could toggle with the meter in view was a **fan or lights**. All five advisors separately downgraded PulseProof: such a relatively small signal can require long LED-pulse windows, is hard to repeat inside a three-minute solo film, and pulse-counting/on-off comparison is already available in an existing app. Generic image compression (PayloadProof) was the best interim fallback at roughly 5.5–6.5/10, but looked like an ordinary tool plus an unverifiable green claim.

The entrant then supplied their own [portfolio](https://harshdipsaha.tech/). One no-scroll first-load browser inspection showed **160 `/brain/1080/*.webp` MRI frames** transferring **2,553,866 of 3,461,954 bytes** across Resource Timing entries. This is **73.8%** of observed resource-entry transfer before the viewer is used; the navigation document was excluded from that denominator. It is one exploratory run, not a controlled benchmark or an after result. The revised proposal, [FrameDebt](../../PROBLEM_STATEMENT.md), detects assets delivered before their interaction, proposes bounded prefetch for this owned sequence, and uses matched AWS browser runs to test initial transfer and full-viewer quality. The following are the five advisors' final responses, included verbatim.

### Feasibility Analyst

> **Feasibility verdict: 8/10 concept potential, conditional on a measured fix.** The owner controls the affected site, and one first-load ResourceTiming run found 160 MRI frames accounting for 2,553,866 of 3,461,954 transferred bytes before any scroll. That gives a solo builder a real defect and a clear three-minute demonstration: observe premature loading, change when frames load, then repeat the same browser journey. Four days is plausible if the product stays focused on this one sequence and produces a reproducible before-and-after receipt. The main risks are scroll jank, blank frames, cache-biased comparisons, and an AWS integration that feels incidental. No after measurement exists yet, so no savings claim is established. **Kill test:** demand-load the first needed frame, prefetch a bounded number, then compare cold entry and full-scroll traces under identical conditions.

### Winner Analyst

> **Winner analyst assessment — 8/10, conditional.** One cold-load ResourceTiming run on the owner’s site showed 160 MRI frames transferring 2,553,866 of 3,461,954 bytes before any scroll. That gives FrameDebt a stronger contest story than generic image compression: a real waste event, a visible repair, and a browser measurement the solo entrant can reproduce. It could beat dashboard entries if the video shows a clear waterfall change while the MRI viewer still works. The risk is originality: lazy loading is standard, and fixing one site is a performance patch rather than a reusable product. FrameDebt needs general detection and regression-checked remediation. No after measurement exists yet. **Video gate:** repeat the baseline, deploy the fix, show materially fewer cold-load bytes, then fully scroll the MRI viewer without blank frames.

### Contrarian

> **Contrarian assessment — 7.5/10 potential, unvalidated.** FrameDebt has unusually strong demo material: one ResourceTiming run on the owner’s site recorded 160 MRI frames and 2,553,866 of 3,461,954 transferred bytes before any scroll. But this is one baseline observation, not a measured improvement, and neither bytes nor deferred requests establish carbon savings. The strongest objection is novelty: lazy loading and performance audits already exist. A hardcoded fix to one animation would be a credible case study, not a winning product. The tool must discover this class of interaction-gated waste, guide a bounded prefetch fix, and verify both entry and full-scroll journeys. Kill it if repeated cold-load comparisons do not cut first-load transfer substantially, if the MRI develops blank or visibly delayed frames, or if AWS serves only as receipt storage.

### Scientific Evidence Analyst

> FrameDebt is an **8/10 concept**, conditional on a controlled repeat. The observed trace on the entrant’s real site shows 2,553,866 bytes from 160 animation frames among 3,461,954 first-load transfer bytes—about 74%—before the visitor scrolls. That establishes a concrete loading problem, not energy or carbon savings. A bounded-prefetch fix may defer those bytes; visitors who complete the animation may still download every frame. The environmental benefit therefore depends on real journey patterns and device/network energy, neither measured here. The test gate is repeated cold no-scroll and full-scroll captures under matched conditions, with independent network-byte counts, no blank frames, and no meaningful smoothness regression. Report first-load bytes avoided only after that test; describe emissions, if included, as a separately qualified scenario.

### Product and UX Analyst

> **Product/UX assessment — 8/10, conditional.** FrameDebt has a compelling first user: the owner of a media-heavy site who sees a slow first load but cannot tell which requests are premature. The website loop is: enter an owned URL → see the 160 early frame requests and their 2.55 MB cost → review one bounded-prefetch change → approve it → compare matched cold-load and full-scroll runs → receive a pass/fail receipt with bytes, trace, and visual evidence. In the three-minute solo demo, the entrant must show a real before scan, apply a real change, reload cold, complete the scroll without blank frames, and open the receipt. The biggest UX risk is presenting a technical waterfall as the product. Lead with one clear sentence: “Your animation downloaded before anyone used it,” and keep network details behind an evidence link. No 10/10 claim until that loop works on the live site.

### Updated chair synthesis

**Choose FrameDebt for the Waste & Energy track, at 8/10 conditional concept potential.** Four advisors scored it 8/10 and the contrarian 7.5/10. That is an expert-style judgment about a proposed entry, not a calibrated chance of winning. The council's original PulseProof recommendation is withdrawn; the fan/light constraint undermines the short meter demo. The new owned-site observation solves the previous authenticity problem: the entrant is both user and actor, and the network event is observable. The risk is equally clear: without a real repeatable before/after intervention and a full-scroll guardrail, FrameDebt is merely a lazy-loading case study. No advisor claims measured energy/carbon savings or a guaranteed 10/10.

**Next gate:** During the event, run multiple matched cold-entry and full-scroll canary trials on the unchanged site and the changed preview. Require a large entrance-transfer reduction and no material playback regression. If either fails, display fail/inconclusive and reconsider the entry. The [research audit](../../research/05-solo-software-search-and-framedebt.md) lists the web and arXiv sources and precise measurement limits.
