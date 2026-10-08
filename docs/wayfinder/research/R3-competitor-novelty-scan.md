# R3 — Competitor / Novelty Scan for 8 Candidate Directions

Date: 2026-10-04. Target: WeMakeDevs x AWS Environmental Hacks (Oct 8-11 2026, Delhi).
Judging (VERIFIED, wemakedevs.org/aws/env): Idea & Impact ("what changes for the people living with it"), Built on AWS, Design & usability ("would someone not on your team know what to do with it"), Execution ("one working feature beats five incomplete"), 3-min demo. Air track brief lists "pollution, exposure, AQI, stubble burning, indoor air, school safety".

Legend: **VERIFIED** = page fetched and read. **REPORTED** = from search snippets / secondary coverage.

---

## 1. Hotspot Local Excess dispatcher

| Name | Who | What it does | URL | How close |
|---|---|---|---|---|
| DPCC Integrated Command & Control Centre, Shastri Park — VERIFIED (Tribune, 2 Oct 2026) | Delhi Govt / DPCC | 24x7 AI+CCTV on 700+ construction sites, GPS on sweepers/field vehicles, inspector body-cams, live AQI stations. "Detect, analyse, act, verify": PM10 rise at a site alerts department + site owner. 78 sub-division winter teams. | tribuneindia.com/.../ai-enabled-command-centre-to-monitor-pollution-sources-247-in-delhi | CLOSE in shape; camera/site-centric, not station-vs-city-median; no Hindi voice, no closure grading described. |
| Green War Room + Green Delhi app — REPORTED | Delhi Govt | Citizen complaints routed to 33 departments; per-hotspot plans for 13 hotspots. | tribuneindia.com (green war room) | Complaint-driven, not anomaly-driven. |
| 13-hotspot asset redeployment: 376 anti-smog guns, 266 sprinklers, GPS-tagged; DPCC portal 2.0 auto-challans — REPORTED | Delhi Govt 2025-26 | "Dynamically redeploying assets based on pollution and congestion patterns." | tribuneindia.com (govt announces measures) | Intent exists; no automated station-triggered dispatch with crew ack in public. |
| CAQM Flying Squads — REPORTED | CAQM | 245 inspections May 2026 (C&D, industry, DG sets, MSW burning). No dedicated app found. | caqm.nic.in; constructionworld.in | Manual, scheduled. |
| IITM DSS (2021-); IIT-Kanpur AI DSS proposal (Dec 2025) — REPORTED | IITM / Delhi Govt | City-scale source apportionment. | gmd.copernicus.org | Different granularity. |
| AirWatch AI — VERIFIED (GitHub, 0 stars) | Student prototype | DBSCAN hotspot clustering + Bayesian attribution on SYNTHETIC 8-station data; 7-stage incident tracker; dossiers "prepared" but never submitted. | github.com/bhoomichoudhary0707-collab/Airwatch-ai-delhi-ncr-pollution-hotspot-detection | Shows judges have seen hotspot dashboards; shows the gap (no real data, no real loop). |
| Sameer app — REPORTED | CPCB | Hourly AQI + complaint filing. | play.google.com (com.cpcb) | Intake only. |

**Genuinely open:** nobody public uses *station-minus-city-median residual* as the trigger, and nobody lets the *same station grade the intervention* 1-2 h later. The new ICCC proves the government wants this shape (real buyer) but invites "why not ICCC?" — answer: ICCC is camera/site-centric and closed; ours is station-residual, open-data, Hindi-voice. Risk: you cannot dispatch a real MCD crew; the ack must be role-played.
**Novelty 4/5** — detection framing and station-graded closure are unoccupied; generic hotspot dashboards are crowded.

## 2. Breath Ledger (personal inhaled dose)

| Name | Who | What it does | URL | How close |
|---|---|---|---|---|
| TracMyAir — REPORTED (PMC 2025; medRxiv Feb 2026) | US EPA researchers | Geolocation + microenvironment + infiltration + step-count/HR ventilation -> hourly inhaled PM2.5/O3 dose. | pmc.ncbi.nlm.nih.gov/articles/PMC12070289 | VERY CLOSE scientifically; research app, not India. |
| AirTrack — VERIFIED | Air Aware Labs (UK) | Time-weighted exposure from Google AQ API x activity level x travel mode; Strava/Apple/Health Connect sync; GBP 6.99/mo. India NOT listed. No daily budget, no "slow down" prompts. | airawarelabs.com/airtrack | CLOSE; missing budget/prompt loop and India. |
| Tenzing Clean Air Tracker (KCL) — REPORTED | Tenzing | Air Quality Score per Strava activity. | fittechglobal.com | Post-hoc score. |
| Shit I Smoke — REPORTED | Coelho & Martiny | City PM2.5 -> cigarettes/day (22 ug/m3 = 1). | openaq.org/use-cases/shootismoke | Dose framing every judge knows. |
| Apple Health, Google Fit, Strava native — REPORTED | — | No native inhaled-dose feature found; AQ only via third parties. | — | Gap confirmed. |

**Genuinely open:** an India-available, real-time dose budget with in-activity "slow down / go in" prompts. But the method is published (TracMyAir), the framing is worn, and the loop ("I stopped running") is unverifiable.
**Novelty 2.5/5** — will read as "AQI app with a pedometer".

## 3. School bad-air protocol tools

| Name | Who | What it does | URL | How close |
|---|---|---|---|---|
| EPA AirNow Flag Program + "Outdoor Activity Guidance for Schools" (also CDC, SCAQMD, BAAQMD, WA DOH variants) — REPORTED | US EPA / air districts | Daily colour flag; PE/recess/athletics modification table by AQI band. | airnow.gov/air-quality-flag-program | Canonical PE table; PDF, US AQI scale, no app. |
| American Embassy School Delhi AQI policy — VERIFIED | AES New Delhi | ~100 campus monitors; outdoor play to AQI 200 (elementary) / 300 (MS-HS); parent opt-out; public indoor-AQI page. | aes.ac.in/.../aqi | A Delhi school runs a protocol — bespoke, elite-only. |
| Delhi DoE hybrid-mode orders under GRAP III/IV (Nov 2025, 2026) — REPORTED | Delhi Govt | Classes to 5, later 9 and 11 hybrid; parents choose physical vs online. | careers360; tribuneindia | Creates the organiser pain; no tool exists. |
| IQAir Clean Air Schools — REPORTED | IQAir | Indoor filtration + monitoring + verification service. | iqair.com/commercial-applications/clean-air-school | Commercial hardware. |
| UK: Clean Air Day, AirText SMS, Wandsworth Clean Air School accreditation, TfL STARS — REPORTED | GAP / councils | Awareness, travel campaigns, daily low/med/high texts. | richmond.gov.uk; wandsworth.gov.uk | No PE-intensity or hybrid-day tooling. |
| Warrior Moms — REPORTED | Parent movement, 13 states | School demos with monitors; advocacy. | warriormomsindia.org | Partner/user, not a tool. |

**Genuinely open:** no CPCB-band version of the EPA PE table as a tool; no hybrid-day organiser for the DoE order; no parent-facing "what did my school do today" ledger. Teacher/coach ack ("PE moved indoors 10:40") is an honest closed loop; data deterministic (nearest CPCB station + timetable). Explicitly in the track brief.
**Novelty 3.5/5** — pieces exist abroad as PDFs; the Indian operational, acknowledged version does not.

## 4. Saaf Twin on real data (PV soiling vs haze)

| Name | Who | What it does | URL | How close |
|---|---|---|---|---|
| NREL RdTools SRRAnalysis / pv_soiling — REPORTED (docs) | NREL | Stochastic Rate & Recovery on daily performance index + POA insolation; sawtooth soiling + cleaning-event detection. | rdtools.readthedocs.io | Open method; needs irradiance rooftop owners lack. |
| Solcast soiling loss (via Ampere); SEVEN soiling-sensor alarms — REPORTED | Solcast / SEVEN | Digital-twin soiling estimates; hardware sensor email alerts. | knowledge.ampere.cloud; sevensensor.com | C&I, needs sensor or paid irradiance. |
| SolarEdge / Enphase / Growatt monitoring — REPORTED | Vendors | Module-level underperformance; no "soiling vs haze" classifier found. | solartechonline.com | Gap confirmed; hardware-locked. |
| SunDown (arXiv 2005.12181); data-driven soiling detection (arXiv 2301.12939) — REPORTED | Academia | Per-panel anomaly / soiling from production data. | arxiv.org | Methods exist. |
| Delhi soiling studies: Sadhana 2024 300-day trial (7.6%/mo winter), Renewable Watch 2018 (0.3-0.6%/day) — REPORTED | IIT Delhi etc. | Quantify Delhi soiling; haze and dust compound. | ias.ac.in/article/fulltext/sadh/051/0032 | Confound real, under-tooled. |

**Genuinely open:** dust-on-panel vs haze-in-air for a residential roof without an irradiance sensor is offered by nobody. But it is hard (clear-sky model + PM proxy + neighbour comparison), you have no real Delhi rooftop data, and the loop (owner washes, output recovers) takes days.
**Novelty 3.5/5, realism 1.5/5** — keep archived.

## 5. Dark Monitor (station outage watchdog)

| Name | Who | What it does | URL | How close |
|---|---|---|---|---|
| EnviroCatalysts / Sunil Dahiya Diwali 2025 analysis — VERIFIED | Think tank (via HT) | 30 of 39 monitors offline in the 36 h window; 9 continuous; blackouts 1-9 h; readings stop near 1000 ug/m3 ("appears a threshold is set"). No live tracker. | envirocatalysts.com/media-articles/diwali-pollution-data-gap... | Exactly the finding; one-off, post-hoc. |
| Business Standard, 27 Oct 2025 — REPORTED (fetch 403) | BS data team | 173 station-hours missing across 31 stations, 163 at peak; 19 stations at 1 am, 12 at 3 am; day-after AQI "likely severe". CPCB denied tampering. | business-standard.com (delhi-peak-pollution-data-missing...) | Same conclusion; no tool. |
| CAG report + Newslaundry "Aaj Ka AQI" (Apr 2025) — VERIFIED | CAG / Newslaundry | Many of 38 stations violate siting norms. Editorial series. | newslaundry.com/2025/04/03/... | Siting, not uptime. |
| aqicn.org per-station "no data" snapshots — REPORTED | WAQI | Shows gaps, no uptime ledger or counterfactual AQI. | aqicn.org/snapshot/delhi/aya-nagar/20251026-17 | Raw material only. |

**Genuinely open:** no live public tool that logs hourly station availability, recomputes a counterfactual city AQI (neighbour/last-value imputation) and publishes "official vs would-have-been". Fully deterministic. Weak on human ack (DPCC/CPCB will not respond in 4 days). Strong on memorability — Diwali 2025 is a known story.
**Novelty 4/5** — analysis proven newsworthy, tool absent; loop is the weakness.

## 6. GRAP per-role briefing

| Name | Who | What it does | URL | How close |
|---|---|---|---|---|
| grapstatus.com "GRAP Order Monitor" — VERIFIED | Anonymous | Current stage, AQI breakdown, vehicle-restriction guide, air-purifier affiliate finder, blog; Telegram channel @grapstatus (broadcast). No per-role guidance, no Hindi, no reminders, no bot. | grapstatus.com | CLOSEST; stage tracker + affiliate site. |
| CAQM PIB orders; SEO explainers (pbpartners, fatehlegacy "GRAP for vehicle owners 2025", helloboon, careerindia "for parents") — REPORTED | Govt / blogs | Static what's-banned lists; car owner and parent roles covered as articles. | pib.gov.in; fatehlegacy.in | Static. |
| M3M fined Rs 50 lakh for GRAP-IV construction after resident complaint — REPORTED | MCM | Builders do not receive/obey stage briefings. | tribuneindia.com | Pain evidence. |

**Genuinely open:** per-role (RWA, school, construction site, car owner, DG-set owner), Hindi, pushed-on-stage-change briefings with an "I complied" ack. Deterministic input (CAQM order text). Weakness: stage changes are rare (demo on a historical order); ack is self-reported; reads as "chatbot over a PDF".
**Novelty 3/5** — shallow version occupied; role x Hindi x reminder x ack is open but low-drama.

## 7. Farmer CHC voice booking agent

| Name | Who | What it does | URL | How close |
|---|---|---|---|---|
| Unnat Kisan app (Sept 2024) — REPORTED | Punjab Agri Dept | Books CRM machines from nearby CHCs; 85k -> 1.3 lakh machines geo-tagged; 5,000 village facilitators. | babushahi.com; brightpunjabexpress.com | THE official booking rail; app-only. |
| i-Khet Machine 5.0 — REPORTED | PRSC | Find nearby machine owners; ~1% uptake (Aadhaar/land-data friction, CEEW). | apkpure (prsc.farmerhelp) | App form factor fails — argument FOR voice. |
| A2P Energy Punjabi chatbot (8 Oct 2025) — VERIFIED (Tribune) | A2P Energy, Chandigarh | Conversational Punjabi help to book CRM machinery, soil health, diversification; channel unspecified; voice not mentioned; guides rather than transacts. | tribuneindia.com/news/amritsar/chatbot-in-punjabi-launched... | CLOSE; text, one year old, scale unclear. |
| Haryana agriharyanacrm.com — REPORTED | Haryana Agri | CRM subsidy registration; 6,775 CHCs, 89,770 machines. Not booking. | agriharyanacrm.com | Subsidy rail. |
| Sarvam Agri & Rural Voice Agents; KisanMitra, kisan-saathi, kisanseva (GitHub) — VERIFIED (Sarvam docs) | Sarvam / indie devs | Templates: crop advisory, mandi, weather, schemes. No CHC booking flow anywhere. | docs.sarvam.ai/.../agri-rural | Tooling exists, use-case absent. |

**Genuinely open:** a *voice* (Punjabi/Hindi IVR or WhatsApp voice) agent that books a CHC slot and captures the CHC operator's ack. Realism: no Unnat Kisan API; CHC roster must be mocked; farmers are far from Delhi; October is peak season so it is topical.
**Novelty 3.5/5** — "voice agent for farmers" is a crowded template; "CHC slot + operator ack" is the open slice.

## 8. What Indian judges have already rewarded (2023-2026)

- SIH 2024/2025 winners surfaced: phishing detection (SIH25159), radar vision, J&K analytics; SIH 2025 environmental PS = waste-segregation monitoring, gamified eco-education — REPORTED.
- Hack to the Rescue Air Quality Hackathon (2023, with AWS) — VERIFIED: Plucka (lung-damage visual + game), AirVocacy (1,800-station chatbot + meme generator), Bedrock sensor-data code-gen. Judges praised "simple to use for local actors, broadly accessible".
- Mercato 2025 winner "Oceansee"; Hack for Green Bharat 2026 — REPORTED, thin. AirWatch AI — VERIFIED typical prototype shape.
- Pattern: rewarded = dashboards, chatbots, gamification, data tooling. None closed a loop with a field actor's acknowledgement or recomputed official numbers. That is the open lane.

---

## Ranked by novelty x realism (4-day build, deterministic data, visible loop)

| Rank | Candidate | Novelty | Realism | Note |
|---|---|---|---|---|
| 1 | 3. School bad-air protocol | 3.5 | 4.5 | Clean teacher ack; in track brief; no Indian tool; AES proves demand. |
| 2 | 1. Hotspot Local Excess dispatcher | 4 | 3 | Highest novelty; ICCC validates; crew role-played; station re-grade is a strong demo beat. |
| 3 | 5. Dark Monitor | 4 | 3.5 | Deterministic, newsworthy; weakest ack; works as a module inside 1. |
| 4 | 7. Farmer CHC voice booking | 3.5 | 2.5 | Topical; A2P text bot exists; no booking API; far from Delhi. |
| 5 | 6. GRAP per-role briefing | 3 | 4 | Easy; grapstatus.com + blogs make it look derivative; rare triggers. |
| 6 | 2. Breath Ledger | 2.5 | 4 | Science published (TracMyAir); reads as another AQI app. |
| 7 | 4. Saaf Twin on real data | 3.5 | 1.5 | Open but no data, slow loop; keep archived. |

Recommendation: build 3, or 1 with 5 as its data-integrity layer. Fold 2 and 6 into 3 only as "PE advisory" and "school GRAP duties" sub-features.
