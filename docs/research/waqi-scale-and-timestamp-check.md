# WAQI scale and timestamp check

Checked 2026-10-09 against primary WAQI sources and its public demo feed. No application implementation was changed.

## AQI scale

The [WAQI API overview](https://aqicn.org/api/) describes pollutant fields as individual AQI values. Its [scale reference](https://aqicn.org/scale/) uses the US EPA 2016 categories: 0–50 Good, 51–100 Moderate, 101–150 Unhealthy for Sensitive Groups, 151–200 Unhealthy, 201–300 Very Unhealthy, and above 300 Hazardous.

Therefore applying Indian CPCB category boundaries to the same US AQI number mislabels it. Pollutant `iaqi` values are pollutant index values, not raw concentrations; the weather fields within `iaqi` have their own physical units. The [WAQI data platform](https://aqicn.org/data-platform/register/) additionally explains that its pollutant data are converted to individual US EPA AQI and that composite AQI is the maximum pollutant index. This data-platform explanation is supporting context, rather than a separate API schema guarantee.

## Timestamp evidence

The [public Shanghai demo feed](https://api.waqi.info/feed/shanghai/?token=demo) returned:

```json
{"s":"2026-10-09 21:00:00","tz":"+08:00","v":1791579600,"iso":"2026-10-09T21:00:00+08:00"}
```

Interpreting `v` directly as Unix seconds produces `2026-10-09T21:00:00Z`. Parsing `iso` produces `2026-10-09T13:00:00Z` (Unix seconds 1791550800). The difference is 28800 seconds, exactly the +08:00 offset.

For this observed feed, `v` encodes the local clock as if it were UTC. Thus `v - signedTimezoneOffsetSeconds` gives the actual UTC instant. This is an empirical observation, not a documented universal API guarantee. Prefer parsing `time.iso`, which already includes the offset. Do not subtract the offset again after parsing ISO. If ISO is unavailable, parsing `time.s` together with `time.tz` also expresses the intended instant.
