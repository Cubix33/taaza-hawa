# Spec: Air Lens v2 — more real, more useful (local only until the user has seen it)

## Problem

Air Lens (`#/stations`) is already good: a 3D MapLibre map of Delhi, station markers, an evidence panel and a station directory. But it is still a picture of numbers. It doesn't yet show:
- what the air looks and feels like
- why it is changing
- when it was better
- where cleaner air is right now

For the demo it should look real and help a healthy adult decide when and where to go out.

## Solution (user's view)

Four independent upgrades, each behind its own toggle:

1. **Living sky.** The atmosphere follows Delhi's real sun position and the live AQI: clear air looks clear, smoggy air looks hazy. The UI states that it is illustrative.
2. **Wind.** Animated wind from a free weather model, plus a plain readout ("wind from the north-west, 8 km/h"). The UI states that it is wind, not pollution movement.
3. **24-hour replay.** Scrub or play the last 24 hours across all stations, and see the best hour so far for the selected one.
4. **Cleaner air near me.** From your pin or location, the nearby fresh stations ranked by reading and distance, with a one-line comparison. Plus polish for mobile and accessibility.

## Constraints

- Frontend only. The backend deploys on every push, so nothing in this spec touches it.
- No new API keys or paid services. Use only keyless, free sources: OpenFreeMap, Open-Meteo and OpenStreetMap. No LLM.
- Honesty line: station air, not your street. Model outputs are labelled as models. Never claim where pollution comes from.
- Hindi and English. Respect reduced motion. Must work on mobile. Must work from the keyboard.
- Not pushed or merged to `main` until the user has seen screenshots and approved.

## Tickets

| # | Ticket | Blocked by |
|---|---|---|
| 01 | Living sky (AQI haze + real sun) | None |
| 02 | Wind field + readout | None |
| 03 | 24-hour replay | None |
| 04 | Cleaner air near me + polish | None |

Each ticket is built in its own git worktree by a separate agent, then integrated one at a time on an `air-lens-v2` integration branch.
