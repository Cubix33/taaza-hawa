# R5 - AWS capability check for Oct 8-11 2026 build (new Free Tier account, Delhi, Hindi users)

Checked 2026-10-04. **VERIFIED** = read on an official AWS doc/pricing/what's-new page today. **REPORTED** = secondary source; confirm in-console. Last time's three failures (Bedrock "Operation not allowed", DLT-blocked SMS, no Connect outbound to India) are all still real; the plan routes around them.

## Summary table

| Capability | Status Oct 2026 | Gotcha | Verdict |
|---|---|---|---|
| Bedrock model access | Auto-enabled for all serverless models; Anthropic still needs one-time use-case form (VERIFIED) | "ValidationException: Operation not allowed" = account-level block; a Sept-26-2026 report shows it hit **Nova too** until the use-case form was submitted (REPORTED) | Submit `PutUseCaseForModelAccess` + test-invoke Nova and Claude **before Oct 8** |
| Nova 2 Lite from ap-south-1 | Only via `global.amazon.nova-2-lite-v1:0`; no in-region, no apac geo (VERIFIED) | Prompts may be processed in any commercial region | Use global ID, or run Bedrock calls from us-east-1 |
| Nova Lite/Pro/Micro (gen-1) from ap-south-1 | Geo cross-region only; `apac.amazon.nova-pro-v1:0` confirmed (VERIFIED); apac Lite/Micro IDs REPORTED | Gen-1 "EOL no sooner than Dec 2025", still Active | Fine as fallback; list profiles with CLI first |
| Claude in ap-south-1 | Haiku 4.5 has India geo `in.anthropic.claude-haiku-4-5-20251001-v1:0` (Mumbai+Hyderabad) and global; Sonnet 4.5 global only (VERIFIED) | Bare model ID not allowed on bedrock-runtime; structured outputs off on `in.` profile | Use `in.` Haiku 4.5 for data residency, `global.` for everything else |
| Bedrock Data Automation | GA in ap-south-1 since Jul 2025 (VERIFIED what's-new) | APAC cross-region profile required | OK for PDF extraction |
| Nova 2 Sonic | Hindi + Indian English supported (VERIFIED); regions us-east-1, us-west-2, eu-north-1, ap-northeast-1 only (VERIFIED); 20 concurrent sessions, 8-min connection cap | Not in Mumbai; ~250 ms extra RTT from Delhi to Tokyo/N. Virginia | Use from us-east-1 or ap-northeast-1; design for 8-min renewal |
| Polly hi-IN | Kajal (neural, bilingual hi-IN/en-IN), Aditi (standard); **no generative Hindi** (VERIFIED); neural available in ap-south-1 (VERIFIED) | Generative engine not in Mumbai | Kajal neural in ap-south-1 |
| Transcribe hi-IN | Streaming + batch supported; ap-south-1 has streaming (VERIFIED) | Custom language models batch-only for Hindi | OK |
| Step Functions waitForTaskToken | Standard: 1-year max execution/idle; 256 KiB payload (VERIFIED); 4,000 free transitions/mo, never expires (VERIFIED) | New accounts have reduced transition quotas | Ideal HITL primitive |
| EventBridge Scheduler one-off | `at()` schedules; 14M invocations/mo free, then $1/M (VERIFIED) | None | Use freely |
| SES | Sandbox: verified recipients only, 200/day, 1/s; production request answered within 24 h (VERIFIED) | Review can take longer if info requested | Request production access **before Oct 8**; keep verified-recipient fallback |
| SNS/End User Messaging SMS to India | SMS sandbox (10 verified numbers), $1/month spend cap (VERIFIED); India local route needs DLT entity+template+sender ID, only from ap-south-1/ap-south-2 (VERIFIED) | DLT registration is a multi-day telco process | **Do not build on SMS**; demo-only to your own verified number at most |
| Amazon Connect outbound to +91 | India row: outbound via partner, status **BETA**, no Indian DIDs (VERIFIED, coverage PDF 31 Aug 2026); default-deny allowlist (VERIFIED) | Needs support ticket; "production traffic not recommended" | **Skip** |
| WhatsApp (End User Messaging Social) | Self-serve WABA onboarding; Meta business verification up to ~2 weeks (REPORTED) | Unverified WABA has tight sending limits | Only if WABA exists already; otherwise skip |
| Amazon Pinpoint | **End of support Oct 30 2026** (VERIFIED), no new customers since May 2025 | Console/APIs vanish 19 days after the hack | Do not touch |
| Web push for PWA | End User Messaging Push = APNs/FCM/ADM/Baidu only (VERIFIED); no AWS-native VAPID web push | Need FCM web or your own VAPID sender in Lambda | Use `web-push` lib in Lambda + DynamoDB subscriptions |
| IoT Device Simulator solution | Deprecated 2025-01-29, repo archived (VERIFIED) | Dead | Lambda/EventBridge publisher to IoT Core instead |
| IoT Core | 12-month free tier: 2.25M connection-min, 500k msgs, 250k rules (VERIFIED pricing page) | Free-tier period framing changed for post-Jul-2025 accounts | Cheap either way (~$1/M msgs) |
| Amplify Hosting | 1,000 build-min, 5 GB storage, 15 GB egress, 500k SSR req/mo free for 12 months (VERIFIED) | Next.js SSR builds slow (~10 min) | Prefer static Vite PWA export |
| App Runner | No free tier; ~$25/mo for 1 vCPU/2 GB always-provisioned (VERIFIED) | Burns credits | Avoid; use Lambda URLs |
| Lambda function URLs | No extra charge; Lambda 1M req + 400k GB-s always free (REPORTED) | New-account concurrency may be below the 1,000 default (REPORTED) | Use |
| CDK bootstrap | Per-region CDKToolkit stack (S3+ECR+5 roles) (REPORTED) | New accounts may see "account must be verified" on CloudFront; permission errors on CreateChangeSet | Bootstrap both regions on Oct 7 |
| Strands Agents SDK | Python 1.57.2 (1 Oct 2026): bidi streaming GA, `handoff_to_user` HITL tool, `mcp_router`, Graph/Swarm snapshots; TS 1.19.0 (VERIFIED changelog / REPORTED PyPI) | Fast-moving; pin version | Use; `handoff_to_user` matches HITL story |
| Bedrock AgentCore | GA Oct 2025; Runtime v2 GA 18 Sep 2026 (us-east-1/2, us-west-2, eu-west-1, ap-northeast-1); Mumbai has Runtime/Gateway/Memory/Identity/Policy (VERIFIED regions table) | **"Paid plan exclusive"** on the Free Tier page (VERIFIED) | Only if you upgrade to Paid plan |
| Verified Permissions (Cedar) | $5 per 1M single authz requests; no free tier (VERIFIED) | None at hack scale | Effectively free |
| Amazon Location | 3-month trial: 500k tiles, 10k routes, 200k geofence evals, 20k geocodes (VERIFIED) | Trial starts at first use | Use |
| CloudWatch Synthetics | 100 canary runs/mo free (VERIFIED); ~$0.0012/run after (REPORTED) | 5-min canary = 8.6k runs/mo = ~$10 | One canary, 30-min cadence |
| Free Tier credits | $100 at signup + up to $100 for console activities; Free plan dies at 6 months or $0 (VERIFIED) | Free plan "limited to select services"; AgentCore named as Paid-only | Decide plan on Oct 6 (see checklist) |

## Per-item notes

### 1. Bedrock
- Model access page: "enabled by default ... in all commercial AWS Regions"; Anthropic needs the First Time Use form once per account, "granted immediately"; students may give a GitHub/project URL as the website. Needs `aws-marketplace:Subscribe/ViewSubscriptions` and a valid payment method. https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html (VERIFIED)
- "Operation not allowed": re:Post threads attribute it to account eligibility ("no established billing and usage history"); a GitHub issue dated 2026-09-26 shows `Error 002: Access to Bedrock models is not allowed for this account` for both Nova and Claude, CLI saying "You have not filled out the request form", cleared by submitting the form. https://github.com/CesarRivasP/Interstice/issues/1 (REPORTED).
- Nova 2 Lite card (ap-south-1 Global only; `us.`/`eu.`/`jp.`/`global.` IDs; 1M context; ~$0.02/$0.10 per 1M in/out REPORTED). https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-amazon-nova-2-lite.html . Nova 2 Pro/Omni still preview (REPORTED).
- Claude Haiku 4.5 card (with `in.` India profile): https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-haiku-4-5.html ; Sonnet 4.5: .../model-card-anthropic-claude-sonnet-4-5.html ; full catalog incl. Sonnet 4.6, Opus 4.x, Claude 5.x: .../model-cards.html
- BDA regions: https://aws.amazon.com/about-aws/whats-new/2025/07/amazon-bedrock-data-automation-additional-aws-regions

### 2. Speech
- Nova 2 Sonic languages/regions: https://docs.aws.amazon.com/nova/latest/nova2-userguide/using-conversational-speech.html and model card .../model-card-amazon-nova-2-sonic.html . Pricing REPORTED (third-party): speech $3/M in, $12/M out; text $0.33/$2.75 - confirm on https://aws.amazon.com/bedrock/pricing/ .
- Polly voices: https://docs.aws.amazon.com/polly/latest/dg/available-voices.html ; neural regions include ap-south-1: .../neural-voices.html ; generative regions exclude Mumbai: .../generative-voices.html
- Transcribe: https://docs.aws.amazon.com/transcribe/latest/dg/supported-languages.html ; regions .../what-is.html

### 3. HITL primitives
- Step Functions quotas: https://docs.aws.amazon.com/step-functions/latest/dg/service-quotas.html ; pricing https://aws.amazon.com/step-functions/pricing/
- Scheduler: https://aws.amazon.com/eventbridge/pricing/
- SES: https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html

### 4. Notifications to Indian phones
- SNS sandbox https://docs.aws.amazon.com/sns/latest/dg/sns-sms-sandbox.html ; $1 spend cap https://docs.aws.amazon.com/sns/latest/dg/channels-sms-awssupport-spend-threshold.html ; India DLT https://docs.aws.amazon.com/sms-voice/latest/userguide/registrations-sms-senderid-india.html
- Connect allowlist https://docs.aws.amazon.com/connect/latest/adminguide/country-code-allow-list.html ; coverage PDF https://d1v2gagwb6hfe1.cloudfront.net/Amazon_Connect_Telecoms_Coverage.pdf
- Pinpoint EoS https://docs.aws.amazon.com/pinpoint/latest/userguide/migrate.html ; Push channels https://docs.aws.amazon.com/push-notifications/latest/userguide/what-is-service.html
- WhatsApp: https://docs.aws.amazon.com/social-messaging/latest/userguide/getting-started-whatsapp.html
- Channel ranking for the demo: PWA web push (own VAPID) > SES email to verified addresses > WhatsApp (only if pre-verified) > SMS/voice (skip).

### 5. IoT
- Simulator README deprecation notice: https://github.com/aws-solutions/iot-device-simulator . IoT Core pricing/free tier: https://aws.amazon.com/iot-core/pricing/ . Lambda-on-schedule publishing MQTT via `iot-data` is a 30-line replacement.

### 6. Hosting / deploy
- Amplify pricing https://aws.amazon.com/amplify/pricing/ ; App Runner https://aws.amazon.com/apprunner/pricing/ ; Lambda concurrency https://docs.aws.amazon.com/lambda/latest/dg/lambda-concurrency.html (default 1,000; run `aws lambda get-account-settings` on the new account to see the actual value).
- CDK: bootstrap `us-east-1` and `ap-south-1` separately; a CloudFront distribution in a brand-new account can fail with an "account must be verified" error (REPORTED) - prefer Amplify Hosting or an S3 website URL over hand-built CloudFront.

### 7. Agents / authz
- Strands changelog https://strandsagents.com/changelog/ ; PyPI https://pypi.org/project/strands-agents/
- AgentCore regions https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agentcore-regions.html ; pricing https://aws.amazon.com/bedrock/agentcore/pricing/ (Runtime $0.1276/vCPU-h, $0.0169/GB-h; Gateway $0.005/1k; Memory STM $1/GB from 6 Oct 2026); Runtime v2 https://aws.amazon.com/about-aws/whats-new/2026/09/new-agentcore-runtime-generally-available/ ; managed harness + CLI (22 Apr 2026) https://aws.amazon.com/about-aws/whats-new/2026/04/agentcore-new-features-to-build-agents-faster/
- AVP pricing https://aws.amazon.com/verified-permissions/pricing/

### 8. Location / observability / always-free
- Location https://aws.amazon.com/location/pricing/ ; CloudWatch https://aws.amazon.com/cloudwatch/pricing/ ; DynamoDB 25 GB + 25 WCU/RCU, Lambda 1M req, SNS 1M publishes, SQS 1M, API Gateway REST 1M always free (REPORTED, multiple sources). S3 5 GB is **not** always-free for post-Jul-2025 accounts - it draws on credits (REPORTED).

### 9. Free Tier mechanics
- https://aws.amazon.com/free/ and https://aws.amazon.com/free/free-tier-faqs/ : $100 immediately; +$100 via "Explore AWS" activities (REPORTED list: launch EC2, create RDS, deploy Lambda, run a Bedrock prompt, create a Budget); Free-plan credits expire 6 months after creation, activity credits and Paid-plan credits 12 months; Free plan "limited to select services" and closes automatically with no bill; Paid plan = all services, pay-as-you-go after credits. AgentCore is marked Paid-plan exclusive. India (AISPL) signup: INR 2 card authorization, Visa/MasterCard/Amex, OTP phone verification (https://aws.amazon.com/free/registration-faqs/). Allow 24 h for full activation (REPORTED).

### 10. 2026 launches worth using (legitimately on-theme)
1. **Nova 2 Sonic Hindi** (Dec 2025) - first AWS speech-to-speech with Hindi; a Hindi voice advisor is now a one-model build.
2. **Strands 1.57 `handoff_to_user` + harness merge** (22 Sep 2026) - native human-in-the-loop tool for an agent that must ask a parent/teacher before acting.
3. **AgentCore Runtime v2 + managed harness/CLI** (Apr-Sep 2026) - deploy a Strands agent with IaC in minutes (Paid plan only).
4. **Amazon Location LLM context as Kiro Power / Claude Code plugin** (Feb 2026) - faster, correct geofence/route code for school-zone exposure maps.
5. **Bedrock Guardrails organizational safeguards GA + AgentCore Policy (Cedar) GA** (2026) - auditable guardrails for advice given to minors; Cedar story stays coherent with HaqCheck.
Also: Kiro GA (May 2026) with 1,000 credits/mo for verified students (SheerID, university email; Sept 8 2026 post).

## Pre-Oct-8 account checklist (setup only, no project code)

1. **Oct 5-6: create the account** as AISPL (India), Visa/MasterCard debit with international enablement; expect INR 2 hold and OTP. Choose **Paid plan** if AgentCore is in the architecture; otherwise Free plan is fine but confirms nothing is Paid-only in your stack. Enable MFA on root, create an IAM Identity Center/admin user, set a $20 and $100 Budget alert (also earns credit).
2. **Earn the second $100**: Explore AWS widget - EC2 launch+terminate, RDS create+delete, Lambda hello, Bedrock playground prompt, Budget. Do this in us-east-1.
3. **Bedrock, both regions (us-east-1 and ap-south-1)**: open Model catalog, pick an Anthropic model, submit the use-case form (GitHub profile as URL). Test-invoke: `global.amazon.nova-2-lite-v1:0`, `apac.amazon.nova-pro-v1:0` (ap-south-1), `in.anthropic.claude-haiku-4-5-20251001-v1:0` (ap-south-1), `amazon.nova-2-sonic-v1:0` bidirectional smoke test (us-east-1). If "Operation not allowed" persists 30 min after the form, open a support case immediately (Basic support still accepts account/billing cases). Run `aws bedrock list-inference-profiles --region ap-south-1` and save the output.
4. **SES**: verify your sending domain or address in ap-south-1 and us-east-1; request production access (transactional, project URL) - 24 h SLA. Also verify 2-3 judge/teammate addresses as sandbox fallback.
5. **SNS**: verify your own +91 number in the SMS sandbox (optional, demo-only). Do **not** start DLT.
6. **Quotas**: `aws lambda get-account-settings` in both regions; request 1,000 concurrency if lower. Check Step Functions and Bedrock TPM quotas in Service Quotas console.
7. **CDK**: install CDK v2, `cdk bootstrap aws://ACCOUNT/us-east-1` and `.../ap-south-1`. Confirm CDKToolkit stacks exist. Create an empty Amplify Hosting app connected to the GitHub repo (no code yet) to surface any account-verification holds.
8. **Location + IoT**: create one Map/Route/Geofence resource (API key) and an IoT thing + policy in ap-south-1 so trial clocks and policies are ready.
9. **Kiro**: sign up with university email, complete SheerID for 1,000 credits/mo.
10. **Record in the repo** (setup, not project code): account ID, regions, inference-profile IDs that returned 200, SES status, quota values.
