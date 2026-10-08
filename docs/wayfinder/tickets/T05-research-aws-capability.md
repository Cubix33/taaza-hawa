# T05 · AWS capability check (research, AFK) — CLOSED

Label: `wayfinder:research` · Closed 2026-10-04 · Report: [`../research/R5-aws-capability-check.md`](../research/R5-aws-capability-check.md)

## Question

On a new Free Tier account in Oct 2026, what works for: Bedrock in ap-south-1/us-east-1, Hindi voice, human-in-loop, notifications to Indian phones, IoT simulation, Amplify, Strands/AgentCore, Location, free-tier credit mechanics?

## Resolution (gist)

- **Bedrock:** model access auto-enabled, but the Anthropic use-case form is still required and a Sept 2026 report shows "Operation not allowed" hitting Nova too until it was submitted. Nova 2 Lite from Mumbai is global-profile only (`global.amazon.nova-2-lite-v1:0`); Claude Haiku 4.5 has an India geo profile (`in.anthropic.claude-haiku-4-5-20251001-v1:0`). Bedrock Data Automation is GA in Mumbai. **Submit the form and smoke-test four profile IDs before Oct 8.**
- **Hindi voice:** Nova 2 Sonic supports Hindi and Indian English but only in us-east-1, us-west-2, eu-north-1, ap-northeast-1 (8-minute connection cap). Polly Kajal (hi-IN neural) and Transcribe hi-IN streaming both work in Mumbai.
- **Human-in-loop:** Step Functions Standard waits up to a year, 4,000 free transitions/month; EventBridge Scheduler 14M free invocations; SES sandbox 200/day to verified recipients, production access answered within 24 h. **Request SES production before Oct 8.**
- **Reaching Indian phones:** SNS SMS needs DLT (skip), Connect outbound to India is partner-only beta with no Indian numbers (skip), WhatsApp needs ~2-week Meta verification (skip), Pinpoint ends Oct 30 2026 (do not use). **Web push via own VAPID sender in Lambda + Amplify PWA is the channel.**
- **IoT:** the IoT Device Simulator solution was deprecated Jan 2025; simulate with a Lambda/EventBridge MQTT publisher. IoT Core free tier is ample.
- **Hosting:** Amplify free for 12 months; App Runner has no free tier (~$25/month idle); Lambda function URLs free. Bootstrap CDK in both regions on Oct 7; CloudFront verification holds happen on new accounts.
- **Agents:** Strands Agents Python 1.57.2 (Oct 1 2026) with `handoff_to_user` HITL tool; AgentCore GA in Mumbai but **Paid-plan exclusive** on the Free Tier; Verified Permissions has no free tier.
- **Location** 3-month trial (500k tiles, 10k routes, 200k geofence evals); Synthetics 100 canary runs/month free.
- **Free Tier:** $100 at signup + up to $100 for five console activities; Free plan "limited to select services", closes at 6 months or $0; card check ₹2 + OTP. Choose Paid plan if AgentCore is in scope.
- Report includes a 10-step pre-Oct-8 checklist (feeds [T11](T11-pre-clock-setup.md)).
