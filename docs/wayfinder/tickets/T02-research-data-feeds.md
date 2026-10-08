# T02 · Data feed audit (research, AFK) — CLOSED

Label: `wayfinder:research` · Closed 2026-10-04 · Report: [`../research/R2-data-feeds-audit.md`](../research/R2-data-feeds-audit.md)

## Question

For every candidate public feed: auth, cadence, observed latency today, format, fallback, and a GREEN/AMBER/RED verdict for a 4-day build.

## Resolution (gist)

| Feed | Verdict | Observed today (Oct 4) |
|---|---|---|
| CPCB station hourly (via aqicn/WAQI, OpenAQ, data.gov.in) | **AMBER/RED** | Staleness is **upstream at CPCB**: Anand Vihar last 2026-10-03 11:00 (~31 h), NSIT Dwarka 2026-10-02 10:30 (~56 h), **DTU dead since 2026-06-23**. OpenAQ needs a key, ~1.5 days late. CPCB CCR endpoints 404. data.gov.in host flaky. |
| CPCB daily AQI Bulletin PDF (`AQI_Bulletin_YYYYMMDD.pdf`, ~17:00 IST) | **GREEN** | Reliable daily anchor; today's exists. Lists per-station AQI and the station count. |
| Open-Meteo Air Quality (CAMS global, 0.4°, 12 h refresh, 5–7 day forecast, 92 days history) | **GREEN** | Always fresh; keyless; label as model. |
| Open-Meteo weather + ERA5 (wind, boundary-layer height) | **GREEN** | Live. IMD APIs need IP whitelisting → RED. |
| NASA FIRMS | **GREEN** | Keyless 24 h CSV verified (106 Punjab detections, ~5 h latency); area API via emailed MAP_KEY. MOSDAC INSAT-3D → RED (manual account + SFTP). PRSC counts only in PPCB PDFs → AMBER. |
| Delhi's 13 hotspots | **VERIFIED** | Narela, Bawana, Mundka, Wazirpur, Rohini, R.K. Puram, Okhla, Jahangirpuri, Anand Vihar, Vivek Vihar, Punjabi Bagh, Mayapuri, Dwarka (DPCC PDF; Mayapuri has no co-located station). |
| CAQM orders | **AMBER/RED** | Site relaunched ~Sep 29 as an Angular SPA; old PDF URLs return HTML; no RSS/JSON; orders surface in news ~21:30 IST. Needs Playwright + news fallback. |
| Delhi DoE circulars page | **AMBER** | Plain scrapable table; newest 10-09-2026. |
| Grid: meritindia.in state status POST (`StateCode: DL`) | **GREEN-scrape** | Live JSON (Delhi demand 5,227 MW). vidyutpravah.in HTTP 500. Electricity Maps → AMBER. DISCOM smart-meter export → RED. |
| Solar: PVOutput | **RED** | Map 404, ladder login-walled, API needs own system. RdTools open source (GREEN as library). No Indian live PV dataset. |
| Transport: OTD Delhi GTFS-RT | **AMBER** | Key via web form with manual follow-up; apply day 0. |
| Water (CWC, CPCB RTWQMS, DJB) | **RED** | No usable API. |
| Waste (MCD, Green Delhi) | **RED** | No real-time data; quarterly PDFs only. |

**Consequence:** an Air idea has three GREEN live feeds (CAMS, met, FIRMS) plus a defensible "CPCB is stale" story; a Waste & Energy idea rests on one undocumented scrape and has no waste feed. Any idea that needs fresh hourly station data at a specific site must show data age on screen and expect gaps; the staleness itself is a live, filmable event.
