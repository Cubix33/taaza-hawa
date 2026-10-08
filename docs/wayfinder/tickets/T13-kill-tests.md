# T13 · Kill tests before the clock (task) — DRAFT, blocked by T10

Label: `wayfinder:task` · Open · Research only; no project code.

| # | Test (Oct 5–7) | Pass | If it fails |
|---|---|---|---|
| K1 | Solve the CPCB captcha by hand each morning at `https://airquality.cpcb.gov.in/ccr/#/caaqm-dashboard-all`, filter Delhi, screenshot Live / Delay / Inactive counts and per-station last-updated beside the same stations' WAQI timestamps | Either CPCB and WAQI disagree (mirror lag is the user's problem) or 2–3 stations are stale daily (stale branch is live) | Everything fresh everywhere → film uses the labelled Diwali-2025 REPLAY; the Scoreboard leads |
| K2 | OpenAQ Sept–Oct 2025 history for the Dwarka cluster; mask real dropouts; measure conformal coverage and width | ≥ 80 % coverage, width under one CPCB band on most days | Width over two bands → pivot to the labelled school-meet alternative |
| K3 | WAQI token pull of all Delhi stations with timestamps | ≥ 25 stations | Fall back to OpenAQ + CAMS only |
| K4 | Bedrock form cleared, Haiku `in.` smoke call, SES production, CDK bootstrap, empty Amplify deploy | All green by Oct 7 | Drop Bedrock; stay in SES sandbox; document |
| K5 | Read the 15-second pitch to someone outside Delhi | They say back "age" or "grade" | Rewrite card copy |

## Resolution

_Draft; run after T10._
