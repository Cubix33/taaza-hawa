# T00 · Why the four earlier ideas were parked (closed)

Label: `wayfinder:research` · Closed 2026-10-04 · Resolution written from the repo's own records, no new research.

## Question

What exactly killed each earlier idea, so the next idea does not repeat the failure, and which patterns from them are worth keeping?

## Resolution

| Idea | Track | What killed it | Was the kill about the idea or about constraints? |
|---|---|---|---|
| **Saaf Twin** (rooftop solar: dust vs smog, clip-on twin cell) · [spec](../../PROBLEM_STATEMENT_saaf-twin-hardware.md) | Waste & Energy | User set a **software-only** rule. | Constraint. The council liked the shape (two roles, physics judge, Proof of Wipe). The user now says a *simulation* is acceptable where hardware is essential. |
| **Right Hour PE** (move school PE to the cleanest hour) · [archive](../../PROBLEM_STATEMENT_right-hour-pe-archived.md) · [K1](../../research/03-k1-measured-backtest.md) | Air | Measured CPCB data: the best hour barely moves (swap fires on 4–6% of days); the "two smogs" came from a CAMS model that overstated ozone ~5×. Also needed a real principal/teacher. | Idea (evidence) **and** constraint. The timing claim is dead. |
| **PE intensity variant** · [research 04](../../research/04-smoke-forecast-test-and-next-idea.md) | Air | Decision is an AQI-band lookup; benefit is modelled; compliance self-reported; needs a school actor. | Mostly idea. Mechanism (×2.5 → ×8.5 inhalation) is real and reusable. |
| **PulseProof** (meter LED pulse camera) · [round 3](../../council/round-3-solo/01-peer-reviews-and-verdict.md) | Waste & Energy | Only a fan/lights could be toggled in view of the meter → weak signal; an existing Play Store app already counts pulses. | Idea (novelty + physics of the available load). |
| **FrameDebt** (premature media bytes on the owner's site) · [spec](../../PROBLEM_STATEMENT.md) · [review](../../decision-review-2026-10-04.md) | Waste & Energy | Weak environmental fit; reads as web-performance; bytes → CO₂ unmeasurable. | Idea (fit to the event's "Idea & Impact"). Kept as engineering fallback only. |
| Tap Witness, Cloud Leak, PayloadProof, Smoke Day Forecast | various | No truth source / derivative of Beacon / ordinary tool / "tomorrow ≈ today" (R²=0.69 from persistence alone). | Idea. |

### Patterns to carry forward

1. **A deterministic judge** (a standard, a formula, a measured feed). The LLM only explains or extracts.
2. **A "do not act" concept** with a name: Smog Hold, Hawa Hold. Telling someone *not* to waste effort is memorable and honest.
3. **An independent after-measurement** that can say *Missed*: Proof of Wipe, Proof of Breath. The receipt is the product.
4. **An actor who is already obliged** (vendor's 5-year clause; CAQM directions). Compliance, not advice.
5. **Honest numbers**, with the exact unit of comparison stated ("station air, not lungs").

### Lessons that bound the next idea

- Delhi's winter air is **persistently bad and predictable from today**; forecasting *when* or *which hour* adds little within a school day. Value sits in **action, accountability, intensity, and in the few things that genuinely change day to day: orders, local spikes, fires, monitor outages**.
- A product whose core is a lookup is a poster. Apply the **Poster Test**: would a laminated sheet do the same job?
- Any live-data idea must survive a **46-hour stale feed** (observed Oct 4 on OpenAQ). Data age goes on screen; a fallback poller is required.
