# Wayfinder map: Environmental Hacks idea (solo, software-only)

Label: `wayfinder:map` · Tracker: local markdown (no issue tracker configured; tickets live in `tickets/`) · Charted 2026-10-04 · Driver: Harshdip

## Destination

One chosen idea for WeMakeDevs × AWS Environmental Hacks (Oct 8–11 2026), written up as a problem statement with a 3-minute solo film plan, an AWS architecture where every service has a reason, a 4-day build boundary and explicit kill tests. It must pass the [winner filter](../WINNER_PLAYBOOK.md) and the three standing constraints below, so that on Oct 8 the only remaining work is to build it.

## Notes

- **Standing constraints (from the user, Oct 4):** solo build and solo film; no custom hardware (if a sensor is essential, simulate it and label it); no second person needed on camera (no teacher, principal, sweeper, technician); the problem must be genuinely environmental, not a web-performance or cloud-cost story in disguise; AWS must be consequential.
- **Working assumption on staging (ticket [Solo staging rule](tickets/T08-solo-staging-rule.md)):** staging scenarios solo (e.g. playing two roles on two devices, with real data and a real system response) is legitimate as long as the video labels what is staged. The entrant role-playing a professional whose *judgement* is the product (a principal deciding, a doctor diagnosing) is weaker than the entrant being a natural user.
- **Skills to consult:** the [engineering playbook](../WINNER_PLAYBOOK.md) filter (P1–P10), the [council format](../council/round-3-solo/01-peer-reviews-and-verdict.md) for the decision step, `superpowers` for the build plan once the destination is reached.
- **Evidence discipline:** every claim in a spec cites a source; measured numbers beat modelled ones; a receipt that can say "Missed" is required; no 10/10 claims.
- **Timeliness:** Delhi enters stubble/GRAP season during hack week. Live data may move on camera. Early-October air is usually "moderate to poor", not "severe" (K1 backtest), so a demo that needs a severe day must use a labelled replay.

## Decisions so far

<!-- one line per closed ticket; detail lives in the ticket -->

- [Why the four earlier ideas were parked](tickets/T00-prior-ideas-postmortem.md): Saaf Twin needs hardware; Right Hour PE failed the measured K1 backtest and needed a teacher; PulseProof had too weak a meter signal and an existing competitor; FrameDebt is weak on environmental fit. Keep: deterministic judge, a "do not act" concept, an independent after-measurement, an obliged actor.
- [Delhi ground truth, Oct 2026](tickets/T01-research-delhi-ground-truth.md): air already "poor" at 13 stations on Oct 4; GRAP Stage I likely during Oct 5–11; monitoring-data integrity is the 2026 story; school games compressed into October; water/waste/energy have no live October episode.
- [Data feed audit](tickets/T02-research-data-feeds.md): mirrors lag CPCB by hours to ~1.5 days; CPCB bulletin PDF is the reliable daily anchor; CAMS, Open-Meteo and FIRMS are always fresh; water and waste feeds are RED.
- [Competitor and novelty scan](tickets/T03-research-competitor-novelty.md): DPCC's AI command centre (Oct 2 2026) covers construction hotspots; no live station-freshness or self-grading tool exists anywhere; no Indian school bad-air tool exists.
- [Event signals](tickets/T04-research-event-signals.md): five criteria, no published weights; deploy on AWS satisfies the gate but AWS must be shown in the video; repo history inside Oct 8–11; Strands workshop at DTU Oct 10; closing hour not yet published.
- [AWS capability](tickets/T05-research-aws-capability.md): Bedrock needs the Anthropic use-case form; Haiku 4.5 has an India profile; Nova 2 Sonic speaks Hindi but not in Mumbai; SMS/Connect/WhatsApp are out; web push via own VAPID; IoT Device Simulator deprecated.
- [Science evidence](tickets/T06-research-science-evidence.md): sprinkling has never shown a PM2.5 drop at a Delhi monitor; hack week is PM10-dominated with ~0–2 % stubble; moderate→sedentary cuts inhaled dose ~5×; the AQI index saturates at 500 by design.
- [Citizen friction](tickets/T07-research-citizen-friction.md): last season's loudest complaint was "can I trust the number"; nine moments are stageable alone; worker and gig-rider moments are not.
- [Shortlist and council](tickets/T09-shortlist-and-council.md): 5–0 for the trust-layer family, then the source check found the "dark station" premise unproven; chairman recommends the honest reduced form **Taaza Hawa** at 6/10, spec in [IDEA-taaza-hawa.md](IDEA-taaza-hawa.md), school-meet Hawa Hold kept warm as the labelled pivot.

## Open tickets (frontier and blocked)

| Ticket | Type | Status | Blocked by |
|---|---|---|---|
| [Track and idea lock](tickets/T10-track-and-idea-lock.md) | grilling (HITL) | **open, frontier: the user's decision** | — (answer T08 in the same sitting) |
| [Solo staging rule](tickets/T08-solo-staging-rule.md) | grilling (HITL) | open, frontier | — |
| [Pre-Oct-8 setup checklist](tickets/T11-pre-clock-setup.md) | task (HITL) | drafted | T10 |
| [Kill tests before the clock](tickets/T13-kill-tests.md) | task (AFK/HITL) | drafted; K1 needs the user's hands (captcha) | T10 |
| [Three-minute film storyboard](tickets/T12-film-storyboard.md) | prototype (HITL) | open; a first cut sits in IDEA §6 | T10 |

## Not yet specified

- The detailed build plan (a first day-by-day boundary and cut order sit in IDEA §7; the `superpowers` plan graduates once T10 locks).
- Persona-native UI spec beyond the one card (Hindi copy for every state, first-run permission choreography on cheap Android, the Scoreboard layout).
- The conformal calibration method (split vs. adaptive; per-station vs. pooled hotspot residuals). Depends on K2.
- The AWS Builder Center blog outline (separate AirPods prize). Depends on "what fought back", which is unknowable before building.
- Whether to attend the DTU build day on Oct 10 and what to get from the Amazon team there. Depends on the idea's open risks.
- How a labelled replay of a severe day is presented if hack-week air stays moderate.

## Out of scope

- Hardware builds of any kind (Saaf Twin as a device). Ruled out by the user; see [prior ideas](tickets/T00-prior-ideas-postmortem.md).
- Ideas that need a real professional to appear or decide on camera (Right Hour PE with a real principal, S5 farmer in a field). Ruled out by the user.
- Accusing the regulator: "dark", "tampered", "would-have-been AQI", "GRAP threshold crossed under our estimate". Ruled out by the council after the source check (R8); the product quotes CPCB's own participation count and nothing more.
- Hotspot dispatcher, complaint router, GRAP-for-me, net-meter clock, breath ledger as standalone products. Ruled out by the council; see [T09](tickets/T09-shortlist-and-council.md).
- Web-performance or cloud-cost products framed as environmental (FrameDebt, Cloud Leak). Ruled out as weak environmental fit, not as bad engineering.
- Writing project code before Oct 8 08:00. Event rule.
