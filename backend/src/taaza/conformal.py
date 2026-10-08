"""Split-conformal prediction intervals on signed residuals (actual - predicted).

Residuals come from the same estimator run with the station's own reading masked,
so the interval describes exactly the thing we show on a stale day.
"""
from __future__ import annotations

import math
from typing import Sequence

MIN_CALIBRATION = 20
TARGET_COVERAGE = 0.80


def conformal_offsets(residuals: Sequence[float], coverage: float = TARGET_COVERAGE,
                      min_n: int = MIN_CALIBRATION) -> tuple[float, float, bool]:
    """Return (lo_offset, hi_offset, calibrated). Offsets are added to the point estimate."""
    n = len(residuals)
    if n < min_n:
        return (-45.0, 45.0, False)  # placeholder band, flagged uncalibrated in the UI
    alpha = 1.0 - coverage
    s = sorted(residuals)
    k_hi = min(n, math.ceil((n + 1) * (1 - alpha / 2)))
    k_lo = max(1, math.floor((n + 1) * alpha / 2))
    return (s[k_lo - 1], s[k_hi - 1], True)


def widen_for_age(lo: float, hi: float, age_hours: float, calibrated: bool) -> tuple[float, float]:
    """Uncalibrated intervals widen with age; calibrated ones are left exactly as measured."""
    if calibrated:
        return lo, hi
    extra = 5.0 * math.sqrt(max(age_hours, 0.0))
    return lo - extra, hi + extra


def coverage(preds: Sequence[float], actuals: Sequence[float], lo: float, hi: float) -> float:
    """Empirical coverage of [pred+lo, pred+hi]; used by the K2 backtest."""
    if not preds:
        return 0.0
    hits = sum(1 for p, a in zip(preds, actuals) if p + lo <= a <= p + hi)
    return hits / len(preds)
