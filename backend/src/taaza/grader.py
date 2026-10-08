"""Deterministic judge: the station's own next hourly value, same pollutant, same units."""
from __future__ import annotations

from dataclasses import dataclass

from .freshness import GIVE_UP_AFTER_S

HIT, MISSED, MISSED_WAITING, PENDING = "HIT", "MISSED", "MISSED_WAITING", "PENDING"


@dataclass
class Grade:
    status: str
    actual: float | None
    miss_by: int  # 0 for a hit; otherwise distance outside the interval (sub-index points)


def grade(lo: float, hi: float, actual: float) -> Grade:
    if lo <= actual <= hi:
        return Grade(HIT, actual, 0)
    miss = actual - hi if actual > hi else lo - actual
    return Grade(MISSED, actual, int(round(miss)))


def is_judge_reading(created_ts: int, reading_ts: int) -> bool:
    """Only a value measured strictly after the promise can grade it (no backfill grading)."""
    return reading_ts > created_ts


def expired(created_ts: int, now_ts: int) -> bool:
    return now_ts - created_ts >= GIVE_UP_AFTER_S
