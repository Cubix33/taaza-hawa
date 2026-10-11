# Taaza Hawa Benchmark Suite

This directory contains empirical backtesting results, methodology, and raw metrics comparing Taaza Hawa's split-conformal estimation against naive persistence baselines on Delhi air quality monitoring stations.

## Files
- **`coverage_by_horizon.csv`**: Tabular empirical coverage %, median range width, and MAE across 1h to 6h outage horizons.
- **`results.json`**: Machine-readable JSON output of all 9,300+ station-hour evaluation runs.
- **`benchmark_report.md`**: Comprehensive statistical evaluation and methodology writeup.

## Summary Results at a Glance

- **Tested Outages:** 1 to 6 hours masked station silences
- **Target Coverage:** 80.0% split-conformal
- **Achieved Empirical Coverage:** **80.3%**
- **Median Range Width:** 42.3 AQI points
- **MAE vs Naive Persistence:** **12.8** vs **25.8** (50.4% error reduction)
