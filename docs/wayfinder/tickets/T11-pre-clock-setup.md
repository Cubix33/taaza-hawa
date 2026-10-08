# T11 · Pre-Oct-8 setup checklist (task, HITL) — DRAFT, blocked by T10

Label: `wayfinder:task` · Open · Allowed before the clock: accounts, keys, model access, learning, data caches. **Not allowed: project code.**

## Checklist (from R5 and R2)

- [ ] AWS account: create (or reuse), choose the **Paid plan** only if AgentCore is wanted (it is not in the spec; Free plan is fine). Card check ₹2 + OTP. Earn the second $100 via the five console activities.
- [ ] Bedrock: submit the Anthropic use-case form; smoke-invoke `in.anthropic.claude-haiku-4-5-20251001-v1:0` in ap-south-1 and one Nova profile in us-east-1. Record the exact IDs that worked.
- [ ] SES: verify sender and recipient addresses; **request production access** (answered within 24 h).
- [ ] CDK: bootstrap ap-south-1 and us-east-1; deploy an empty Amplify static app to surface any new-account verification hold.
- [ ] Quotas: Lambda concurrency, Step Functions, Scheduler defaults; nothing to raise, just confirm.
- [ ] WAQI token (aqicn.org/data-platform/token); OpenAQ API key; FIRMS MAP_KEY (not needed for v1, cheap to have).
- [ ] Cache OpenAQ history for the Delhi stations (Sept–Oct 2025, Sept 20–Oct 7 2026) into a local folder for the conformal calibration. This is data, not project code.
- [ ] Download the last 14 CPCB bulletin PDFs; confirm pdfplumber reads the Delhi line and the participation count.
- [ ] Student verification on AWS Builder Center; "Check in" on the event page to receive the closing hour.
- [ ] Kiro: SheerID student credits (optional).
- [ ] Phone: install the PWA shell test (any site) to rehearse add-to-homescreen and notification prompts; plan the two daily shoots (06:30, 17:30).

## Resolution

_Draft; confirm after T10._
