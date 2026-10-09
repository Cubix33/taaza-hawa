"""CPCB National AQI sub-index maths and the fixed band -> answer mapping.

Decision rule (printed on the audit page, never model-chosen):
  Good/Satisfactory/Moderate -> GO, Poor -> WAIT (wait for air to improve), Very Poor/Severe -> STAY.
"""
from __future__ import annotations

# (conc_lo, conc_hi, idx_lo, idx_hi), CPCB NAQI breakpoints, ug/m3 (24 h basis)
BREAKPOINTS: dict[str, list[tuple[float, float, float, float]]] = {
    "pm10": [(0, 50, 0, 50), (50, 100, 50, 100), (100, 250, 100, 200),
             (250, 350, 200, 300), (350, 430, 300, 400), (430, 600, 400, 500)],
    "pm25": [(0, 30, 0, 50), (30, 60, 50, 100), (60, 90, 100, 200),
             (90, 120, 200, 300), (120, 250, 300, 400), (250, 380, 400, 500)],
}
POLLUTANTS = ("pm10", "pm25")
LABEL = {"pm10": "PM10", "pm25": "PM2.5"}

# (upper bound of band, english, hindi)
BANDS = [
    (50, "Good", "अच्छा"),
    (100, "Satisfactory", "संतोषजनक"),
    (200, "Moderate", "मध्यम"),
    (300, "Poor", "खराब"),
    (400, "Very Poor", "बहुत खराब"),
    (500, "Severe", "गंभीर"),
]


def sub_index(pollutant: str, conc: float) -> float:
    """Linear-interpolated CPCB sub-index; saturates at 500 by design."""
    if conc <= 0:
        return 0.0
    for c_lo, c_hi, i_lo, i_hi in BREAKPOINTS[pollutant]:
        if conc <= c_hi:
            return i_lo + (i_hi - i_lo) * (conc - c_lo) / (c_hi - c_lo)
    return 500.0


def band_index(si: float) -> int:
    for i, (upper, _, _) in enumerate(BANDS):
        if si <= upper:
            return i
    return len(BANDS) - 1


def band_names(si: float) -> tuple[str, str]:
    _, en, hi = BANDS[band_index(si)]
    return en, hi


def answer_for(si: float) -> str:
    b = band_index(si)
    if b <= 2:
        return "GO"
    if b == 3:
        return "WAIT"
    return "STAY"
