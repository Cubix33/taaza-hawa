# R2 - Data feeds feasibility audit (Delhi, software-only, 4-day build)

Audited 2026-10-04 ~18:30 IST. **VERIFIED** = fetched live from this machine today. **REPORTED** = from docs/news/search, not exercised. Build window: Oct 8-11.

## Summary table

| Feed | Auth | Cadence | Observed latency (today) | Verdict |
|---|---|---|---|---|
| Open-Meteo Air Quality (CAMS global) | none | 12 h model refresh, hourly values | **VERIFIED** returns hours through 2026-10-04 23:00 IST + 5-day forecast | **GREEN** |
| Open-Meteo Forecast/Archive (wind, BLH) | none | hourly, 10k/day | **VERIFIED** `boundary_layer_height` live + ERA5 archive | **GREEN** |
| NASA FIRMS keyless 24 h CSV (VIIRS) | none | per overpass (~2/day) | **VERIFIED** newest Punjab detection 2026-10-04 07:58 UTC, pulled 12:55 UTC (~5 h) | **GREEN** |
| NASA FIRMS Area API | MAP_KEY (emailed, minutes) | same | REPORTED <60 min after overpass; 5000 tx/10 min | **GREEN** |
| meritindia.in Delhi demand (POST JSON) | none | ~minutes | **VERIFIED** `{"Demand":"5,227","ISGS":"1,030","ImportData":"4,197"}` MW | **GREEN** (scrape, undocumented) |
| aqicn.org / WAQI API | free token (instant email) | hourly | **VERIFIED** Anand Vihar last 2026-10-03 11:00 IST (**~31 h stale**); NSIT Dwarka 2026-10-02 10:30 IST (**~56 h**); DTU **2026-06-23** (dead ~3.5 months) | **AMBER** (CPCB upstream stale) |
| OpenAQ v3 (CPCB/DPCC) | free key (signup) | hourly in theory | 401 without key (VERIFIED); third-party README: "about 1.5 days behind real time"; user saw ~46 h this week | **AMBER** |
| CPCB daily AQI Bulletin PDF | none | daily ~17:00 IST | **VERIFIED** `AQI_Bulletin_20261004.pdf` exists (290 KB); footer "last updated 2026-10-03 17:24" | **GREEN** (daily only) |
| CPCB CCR / SAMEER real-time | none, undocumented | hourly | **VERIFIED** 3 known POST endpoints now 404 | **RED** |
| data.gov.in real-time AQI | free key (instant email) | hourly-ish | **VERIFIED** `api.data.gov.in` unreachable from here (TCP refused / timeout, 3 tries); portal page 200 | **AMBER** (host flaky) |
| IQAir AirVisual | free key | hourly | REPORTED free tier = city-level only, 500/day; station data paid | **RED** for stations |
| CAQM orders (caqm.nic.in) | none | ad hoc, evenings | **VERIFIED** site rebuilt as Angular SPA; old `/WriteReadData/LINKS/*.pdf` URLs now return HTML; no RSS/JSON | **AMBER/RED** |
| Delhi DoE public circulars | none | ad hoc | **VERIFIED** `edudel.nic.in/mis/misadmin/frmCircular.aspx` scrapable, newest 10-09-2026 | **AMBER** |
| ISRO MOSDAC INSAT-3D fire | account + manual approval, SFTP | 30 min | REPORTED; registration days | **RED** for 4 days |
| PRSC/PPCB Punjab fire ATR | none | daily PDF (season) | REPORTED 2024 PDFs on ppcb.punjab.gov.in; 2026 URL untested | **AMBER** |
| IMD api.imd.gov.in / city.imd.gov.in | JWT + **IP whitelisting** | hourly | **VERIFIED** 401 "IP ... needs to be whitelisted" | **RED** |
| vidyutpravah.in | none | 5 min | **VERIFIED** HTTP 500 today | **RED** |
| Grid-India / NLDC reports | none | daily PDF | **VERIFIED** `report.grid-india.in` unreachable; homepage is JS shell | **AMBER** |
| Electricity Maps IN-NO | API key; free tier personal, zone-limited | hourly | **VERIFIED** 401 without key; signup behind Cloudflare | **AMBER** |
| BSES/TPDDL smart-meter consumer data | consumer login only | 30 min-4 h in app | REPORTED no export API | **RED** |
| PVOutput.org | key + own system; ladder/map need login | 5 min | **VERIFIED** map 404, ladder login-walled; Delhi count unknown | **RED** |
| Open Transit Data Delhi GTFS-RT | private key via form, manual ("we will contact you") | ~10 s | **VERIFIED** endpoint `/api/realtime/VehiclePositions.pb?key=` documented; key timing unknown | **AMBER** |
| DMRC (via OTD static) | same portal | static | **VERIFIED** "DMRC Static Data" section exists | **AMBER** |
| CWC flood forecast (Yamuna) | none | hourly | **VERIFIED** `ffs.india-water.gov.in` 200 but JS/FusionCharts shell, no documented API | **AMBER/RED** |
| CPCB river water quality | none | monthly PDFs | **VERIFIED** `rtwqms.cpcb.gov.in` unreachable | **RED** |
| Delhi Jal Board | consumer portal only | - | **VERIFIED** `djb.gov.in/DJBRMSPortal` has "Apply for DJB Tanker"; no open data/tracking API found | **RED** |
| MCD waste / Green Delhi | none | quarterly PDFs | REPORTED only DPCC/NGT PDF reports | **RED** |

## A. Air quality

**OpenAQ v3** - `https://api.openaq.org/v3/locations?coordinates=28.61,77.21&radius=25000`. Key: `explore.openaq.org/register` (REPORTED instant). Limits 60/min, 2000/h (VERIFIED docs). CPCB provider on OpenAQ restarted Feb 2025; a 2026 project README states CPCB data reaches OpenAQ "about 1.5 days" late with frequent nationwide gaps. Format JSON. Fallback: WAQI, then CAMS. **AMBER** - usable only for history/backfill, never for "now".

**aqicn.org / WAQI** - `https://api.waqi.info/feed/@{idx}/?token=` (demo token only serves Shanghai - VERIFIED). Token: aqicn.org/data-platform/token, REPORTED emailed within minutes, 1000 req/s soft limit. Station freshness VERIFIED today via page JSON `time.v`: Anand Vihar 1791005400 = Sat Oct 3 11:00 IST (31 h), NSIT Dwarka 1790917200 = Fri Oct 2 10:30 IST (56 h), DTU 1782189000 = Jun 23 (dead). This confirms the staleness is **upstream at CPCB**, not OpenAQ. **AMBER** - good station catalogue + includes forecast; treat timestamps as data.

**data.gov.in** - resource `3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69` ("Real time Air Quality Index from various locations"), fields station/pollutant_id/avg_value/last_update. Key: free signup, emailed (REPORTED minutes). From this network `api.data.gov.in` refused/timed out on 3 attempts (VERIFIED) while `www.data.gov.in` served 200 - flaky host. Same CPCB upstream. **AMBER**.

**CPCB SAMEER/CCR** - `airquality.cpcb.gov.in/AQI_India/` and `app.cpcbccr.com/ccr`. The base64 POST endpoints used by community scrapers (`aqi_dashboard/aqi_all_parameters`, `caaqms/caaqms_landing_map_all`) return 404 today (VERIFIED). Daily **AQI Bulletin PDF** is reliable: `https://cpcb.gov.in/upload/Downloads/AQI_Bulletin_YYYYMMDD.pdf`, published ~17:00 IST (VERIFIED today's exists). **RED** real-time / **GREEN** daily.

**Open-Meteo Air Quality** - `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=28.61&longitude=77.21&hourly=pm2_5,pm10,ozone&past_days=1`. No key. CAMS global 0.4 deg (~45 km, so one cell covers Delhi - no intra-city gradient), refreshed every 12 h, 5-7 day forecast, `past_days` up to 92 (VERIFIED docs). Terms: <10k/day, 5k/h, 600/min, non-commercial (VERIFIED). Today returned PM2.5 107-125 ug/m3 overnight, PM10 ~400. **GREEN** - the only always-fresh air signal; it is a model, label it so.

**IQAir** - free "Community" key: 5/min, 500/day, city-level only; station level is paid (REPORTED). **RED**.

**DPCC hotspot dashboard** - none public. DPCC "Pollution War Room" gets daily engineer reports; nothing machine-readable (REPORTED).

**Delhi's 13 designated hotspots** (VERIFIED from DPCC `hotspot.pdf`): Narela, Bawana, Mundka, Wazirpur, Rohini, R.K. Puram, Okhla, Jahangirpuri, Anand Vihar, Vivek Vihar, Punjabi Bagh, Mayapuri, Dwarka. Criterion: annual PM10 >300 and PM2.5 >100 ug/m3 at a DPCC CAAQMS within 2 km. Station mapping (REPORTED, standard DPCC names on CPCB/WAQI): Narela->Narela (DPCC); Bawana->Bawana (DPCC); Mundka->Mundka (DPCC); Wazirpur->Wazirpur (DPCC); Rohini->Rohini (DPCC); R.K. Puram->R K Puram (DPCC); Okhla->Okhla Phase-2 (DPCC); Jahangirpuri->Jahangirpuri (DPCC); Anand Vihar->Anand Vihar (DPCC); Vivek Vihar->Vivek Vihar (DPCC); Punjabi Bagh->Punjabi Bagh (DPCC); Mayapuri->no co-located CAAQMS, nearest Punjabi Bagh/Pusa (IMD); Dwarka->Dwarka Sector 8 (DPCC) with NSIT Dwarka (CPCB) as second. Oct 2024 news lists the same 13 (VERIFIED).

## B. Government orders

**CAQM** - `caqm.nic.in` was relaunched (~Sep 29 2026, per Last-Modified) as an Angular SPA at `/landingpage/pages/home`; content is JS-rendered, no RSS/JSON; previously indexed PDFs under `/WriteReadData/LINKS/GRAP Order dt DDMMYYYY<guid>.pdf` now return HTML (VERIFIED). Orders are scanned PDFs; GRAP decisions follow Sub-Committee meetings and hit news in the evening (e.g. AIR item 21:33 IST on 19 May 2026 - VERIFIED). Approach: Playwright-render the SPA, diff PDF list; fallback = news RSS/press. **AMBER/RED**.

**Delhi DoE** - public circulars list `https://www.edudel.nic.in/mis/misadmin/frmCircular.aspx` (ASP.NET table, PDF links, newest 10-09-2026 - VERIFIED). Pollution closures are numbered `DE.23(28)/Sch.Br./YYYY/NNN`. Simple scrape. **AMBER** (ad hoc).

## C. Fires

**NASA FIRMS** - keyless CSVs: `https://firms.modaps.eosdis.nasa.gov/data/active_fire/noaa-20-viirs-c2/csv/J1_VIIRS_C2_South_Asia_24h.csv` (and `suomi-npp-viirs-c2/.../SUOMI_VIIRS_C2_South_Asia_24h.csv`). VERIFIED today: 106 detections in a Punjab box, newest acq 2026-10-04 07:58 UTC, ~5 h before pull. Area API `/api/area/csv/{MAP_KEY}/VIIRS_NOAA20_NRT/74,29.5,77,32.5/1` (CSV, 1-5 day range, 5000 tx/10 min, key emailed on signup - VERIFIED docs). **GREEN**. Fallback: FIRMS WMS.

**MOSDAC INSAT-3D/3DR fire** - account, manual approval, UOPS order + SFTP (REPORTED). **RED** for this window.

**PRSC/PPCB** - PRSC CRBIMS sends daily Excel to PPCB; PPCB posts `ATR DD.MM.YYYY.pdf` during season (2024 URLs found; 2026 pattern unverified). **AMBER**; FIRMS is the substitute.

## D. Weather

**Open-Meteo** forecast `api.open-meteo.com/v1/forecast?...hourly=wind_speed_10m,wind_direction_10m,boundary_layer_height` and archive `archive-api.open-meteo.com/v1/archive` (ERA5, BLH included) - both VERIFIED today (BLH 10-1620 m diurnal cycle). **GREEN**.

**IMD** - `api.imd.gov.in` (28 endpoints incl. AWS/ARG, nowcast) needs account + whitelisting; `city.imd.gov.in/api/cityweather.php?id=42182` returned 401 "IP needs to be whitelisted" (VERIFIED). **RED**.

## E. Energy

**vidyutpravah.in** HTTP 500 (VERIFIED). **meritindia.in**: `POST https://meritindia.in/StateWiseDetails/BindCurrentStateStatus` body `{"StateCode":"DL"}` -> JSON demand/ISGS/import for Delhi; `POST /Dashboard/BindAllIndiaMap` -> HTML with all-India generation mix (VERIFIED). Undocumented but live. **GREEN-scrape**. Grid-India daily PSP PDFs: host unreachable today. **Electricity Maps** IN-NO: key required; pricing page shows paid tiers + 14-day trial; a personal free tier exists but is zone-limited (REPORTED). **CEA**: monthly PDFs only. **DISCOM smart meters**: TPDDL Connect / BSES apps show consumption at 30 min-4 h granularity to the logged-in consumer; no export/API (REPORTED). **RED** for a product.

## F. Solar

**PVOutput** - API needs key + registered system; reading others' systems needs Donation mode; 60 req/h (VERIFIED docs). Map/ladder are login-walled (VERIFIED), so Delhi-NCR live-system count could not be established - assume very few. **RED** as a data source. **RdTools** (NREL) is open-source Python with a soiling module (`rdtools.soiling`) - GREEN as library. Indian open PV data: IEEE DataPort 72 kWp Karnataka hourly 2021-24 and a 2-plant 15-min set (REPORTED) - not Delhi, not live.

## G. Transport

**OTD Delhi** - static GTFS open; realtime `https://otd.delhi.gov.in/api/realtime/VehiclePositions.pb?key=PRIVATE_KEY` (protobuf GTFS-RT, ~10 s refresh REPORTED). Key via web form, manual follow-up (VERIFIED form). Apply on day 0; **AMBER**. DMRC: static only via OTD; no realtime API.

## H. Water

CWC `ffs.india-water.gov.in` is a JS shell; hourly levels for Delhi Rly Bridge exist in the UI but any JSON must be reverse-engineered (**AMBER/RED**). CPCB NWMP/RTWQMS unreachable; monthly PDFs only (**RED**). DJB: no open data; tanker tracking only inside consumer portal/app (**RED**).

## I. Waste

No MCD open dataset; landfill and segregation figures live in DPCC/NGT quarterly PDF reports; Green Delhi app stats appear only in press (27k complaints/yr). **RED** for real-time.

## Recommended feed stack - Air idea

1. **Open-Meteo CAMS** (PM2.5/PM10/O3 hourly, forecast) - primary "now" signal, GREEN.
2. **Open-Meteo wind + BLH** (forecast + ERA5) - ventilation index, GREEN.
3. **FIRMS keyless NOAA-20/SNPP 24 h CSV** (+ Area API with key) - Punjab/Haryana fire counts, GREEN.
4. **WAQI token** for station catalogue + latest CPCB values, **displayed with age**; OpenAQ v3 for history/backfill. AMBER - design must survive 30-60 h staleness (we measured 31 h / 56 h / 103 days today).
5. **CPCB AQI Bulletin PDF** daily at ~17:00 IST as the official anchor, GREEN.
6. CAQM/DoE: Playwright scrape + news RSS; present as "last known order", AMBER.

## Recommended feed stack - Waste & Energy idea

1. **meritindia.in POST JSON** for Delhi demand and all-India mix (GREEN-scrape; keep 15-min cache, expect breakage).
2. **Electricity Maps IN-NO** if a free personal key arrives on day 0 (AMBER); else derive carbon intensity from meritindia mix.
3. **Open-Meteo** solar radiation + temperature for PV/cooling-load proxies (GREEN).
4. Waste: no live feed - build on static DPCC/NGT PDFs + user-entered data; **do not promise real-time waste** (RED).
5. DISCOM consumer data: manual CSV paste by the user, not an integration (RED).

Bottom line: an **Air** product has three GREEN live feeds and a clear story about CPCB staleness; a **Waste & Energy** product has one undocumented scrape and no waste feed.
