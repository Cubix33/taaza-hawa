"""The Taaza badge: age of a reading at its named source."""
from __future__ import annotations

STALE_AFTER_MIN = 180  # >3 h is the stale branch
GIVE_UP_AFTER_S = 72 * 3600  # grade as "Missed, still waiting"


def age_minutes(now_ts: int, reading_ts: int) -> int:
    return max(0, (now_ts - reading_ts) // 60)


def is_stale(age_min: int) -> bool:
    return age_min > STALE_AFTER_MIN


def human_age_en(age_min: int) -> str:
    if age_min < 60:
        return f"{age_min} minute{'s' if age_min != 1 else ''}"
    h = age_min // 60
    if h < 48:
        return f"{h} hour{'s' if h != 1 else ''}"
    return f"{h // 24} days"


def human_age_hi(age_min: int) -> str:
    if age_min < 60:
        return f"{age_min} मिनट"
    h = age_min // 60
    if h < 48:
        return f"{h} घंटे"
    return f"{h // 24} दिन"
