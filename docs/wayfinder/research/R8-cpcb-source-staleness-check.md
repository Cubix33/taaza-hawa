# R8 — Is Delhi station staleness upstream at CPCB? Source-of-truth check

Checked 2026-10-04, ~18:45–19:00 IST. Question: mirrors (aqicn/WAQI) show NSIT Dwarka, Anand Vihar and DTU stale — does CPCB's own site agree?

## Results

| Station | CPCB CCR dashboard last-updated | Bulletin 2026-10-04 listed? / AQI | aqicn "updated" | data.gov.in last_update |
|---|---|---|---|---|
| NSIT Dwarka | **Not obtainable** — captcha gate (see below) | Not named (bulletin is city-level only) | Slug `/city/delhi/nsit-dwarka/` **silently falls back to Mandir Marg** (AQI 115, PM2.5 112, "Updated Sun 18:00"); `/station/india/delhi/nsit-dwarka/` 404. Station page gone. | API unreachable |
| DTU | Not obtainable | Not named | "Updated on Tuesday, Jun 23rd 2026", AQI 167, PM2.5 "Not Available" | API unreachable |
| Anand Vihar | Not obtainable | Not named | "Updated on Saturday 11:00" (Oct 3, 11:00 IST), AQI 149, PM2.5 149 — ~31 h behind Mandir Marg | API unreachable |
| Mundka | Not obtainable | Not named | Not checked | API unreachable |
| **Delhi (city)** | — | **Moderate 187, PM10, "43/46" stations participated** (Oct 3: 171, "44/46") | overview AQI 115, "Updated on Sunday 18:00" | — |

## What each source actually showed

**CPCB CCR dashboard (airquality.cpcb.gov.in/ccr, app v1.0.4).** The URL in the brief, `#/caaqm-dashboard-all/caaqm-landing`, no longer exists: Angular throws `NG04002: 'caaqm-dashboard-all/caaqm-landing'` and bounces to `#/` with an empty router-outlet (3 attempts). The real public route, recovered from the JS bundle, is `#/caaqm-dashboard-all`. It renders a map plus a Legend with CPCB's own station-health taxonomy — **Total / Historic / Live / Delay / Inactive** — but all five counters read **0** and a `#captchaModal` ("Captcha * / Verify") intercepts every click until solved. Data loads only via AES-wrapped POSTs to `insight_proxy_api_v2_0/service.php`. I did not solve the captcha, so no station-level timestamp was read from CPCB. `AQI_India/` and `AQI_India_Iframe/` return 404; the legacy host `app.cpcbccr.com` 308-redirects to an unrelated third-party AQI site (not CPCB). The old `caaqms/caaqms_landing_map_all` API is 404.

**CPCB AQI bulletin (cpcb.gov.in, PDF, 4 PM).** City-level only; stations are never named. Delhi row: **Oct 4 = 43 of 46 stations participated; Oct 3 = 44 of 46.** The "absent due to insufficient data" footer lists 76 cities, none in Delhi-NCR. So CPCB itself records 2–3 Delhi stations not contributing on each of the last two days, but does not say which.

**aqicn.org.** DTU is frozen at 2026-06-23. Anand Vihar is ~31 h behind Mandir Marg. NSIT Dwarka's page no longer resolves. **Caveat:** the WAQI demo-token search returned 11 Bengaluru stations, 8 of which also stop exactly at **2026-06-23 10:00** — the same cutoff as DTU. A June-23 wall shared across unrelated cities points to a WAQI-side CPCB-ingest break, not to DTU going dark upstream.

**data.gov.in.** `api.data.gov.in` refused connections from curl, PowerShell and WebFetch (`ECONNREFUSED 164.100.61.198:443`); the portal page returned 403. Not checkable from this network.

## Verdict: INCONCLUSIVE (station-level), partially supported (aggregate)

The claim "these specific stations are dark upstream at CPCB" is **not verified**: CPCB's dashboard is captcha-gated and the bulletin names no stations. It is also **not refuted** — CPCB's own bulletin shows 2–3 of 46 Delhi stations failing to participate on Oct 3 and Oct 4, and CPCB's dashboard legend has first-class "Delay" and "Inactive" buckets, so upstream station outages are a normal, CPCB-acknowledged state. Two mirror findings should be downgraded: DTU's June-23 freeze coincides with a WAQI-wide June-23 cutoff (mirror artefact likely), and NSIT Dwarka's "last reading" cannot be re-confirmed because aqicn no longer serves that station page. Anand Vihar's 31 h lag on aqicn remains unexplained. **To close this:** a human solves the CPCB captcha once at `https://airquality.cpcb.gov.in/ccr/#/caaqm-dashboard-all`, filters Delhi, and reads the Live/Delay/Inactive counts and per-station times; or obtain a data.gov.in key from a network that can reach `api.data.gov.in`.

## Evidence files (scratchpad)

`C:\Users\HARSHDIP\AppData\Local\Temp\claude\H--augsepthacks-wemakedevs-environmentalll\f5a29641-406d-4eaa-a3ad-3f51ce5679f1\scratchpad\`
- `screens/cpcb-ccr-root.png` — blank app at `#/` after NG04002 route error
- `screens/cpcb-dashboard-all.png` — `#/caaqm-dashboard-all`, legend counters all 0
- `screens/cpcb-dashboard-captcha-gate.png` — captcha modal blocking the dashboard
- `screens/aqicn-nsit-dwarka-url.png` — nsit-dwarka URL rendering Mandir Marg
- `AQI_Bulletin_20261004.pdf`, `AQI_Bulletin_20261003.pdf`, `bulletin_20261004.txt`
- `main.js`, `chunk-*.js` — CPCB bundle used to recover routes/API
