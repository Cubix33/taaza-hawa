"""Hindi-first copy. Deterministic templates; Bedrock may only rephrase these, never decide.

Honesty line: no "dark", "offline", "tampered", "true AQI", fault, or health-outcome claims.
"""
from __future__ import annotations

from .aqi import LABEL
from .freshness import human_age_en, human_age_hi

ANSWER_HI = {"GO": "जाओ", "WAIT": "10 बजे के बाद", "STAY": "अंदर रहो", "UNKNOWN": "पता नहीं"}
ANSWER_EN = {"GO": "Go", "WAIT": "Wait till 10 AM", "STAY": "Stay inside", "UNKNOWN": "Can't tell"}
QUESTION_HI = "अभी बाहर जाऊँ?"
QUESTION_EN = "Can I go outside right now?"


def fresh_sentence(name: str, pollutant: str, value: int, age_min: int) -> tuple[str, str]:
    p = LABEL[pollutant]
    hi = f"{name} स्टेशन: {p} सब-इंडेक्स {value}, {human_age_hi(age_min)} पुराना।"
    en = f"{name} station: {p} sub-index {value}, {human_age_en(age_min)} old."
    return hi, en


def stale_sentence(name: str, age_min: int, lo: int, hi_: int, n_nb: int, used_cams: bool,
                   calibrated: bool) -> tuple[str, str]:
    parts_hi = ([f"{n_nb} चालू पड़ोसी स्टेशन"] if n_nb else []) + (["सुधारा हुआ CAMS"] if used_cams else [])
    parts_en = ([f"{n_nb} live neighbouring stations"] if n_nb else []) + (["bias-corrected CAMS"] if used_cams else [])
    # degraded estimate: no live neighbour and no trusted CAMS, only the old value widened for its age
    inputs_hi = ", ".join(parts_hi) or "सिर्फ़ आख़िरी रीडिंग, उम्र के हिसाब से चौड़ा किया दायरा"
    inputs_en = ", ".join(parts_en) or "only the last reading, widened for its age"
    cal_hi = "" if calibrated else " (अभी कैलिब्रेशन जारी है)"
    cal_en = "" if calibrated else " (calibration still warming up)"
    hi = (f"{name} की नवीनतम रीडिंग {human_age_hi(age_min)} पुरानी है। "
          f"{lo}–{hi_} मानकर चलें ({inputs_hi}){cal_hi}। नई रीडिंग आते ही हम इसे परखेंगे।")
    en = (f"{name}'s latest reading is {human_age_en(age_min)} old. "
          f"Act as if {lo}–{hi_} ({inputs_en}){cal_en}. We will grade this when a fresh reading lands.")
    return hi, en


def no_estimate_sentence(name: str, age_min: int) -> tuple[str, str]:
    return (f"{name} की रीडिंग {human_age_hi(age_min)} पुरानी है और अनुमान के लिए पास का कोई चालू स्टेशन नहीं है।",
            f"{name}'s reading is {human_age_en(age_min)} old and no live neighbour is available for an estimate.")


def yesterday_line(lo: int, hi_: int, status: str, actual: int | None, miss_by: int) -> tuple[str, str]:
    if status == "HIT":
        return (f"कल: कहा {lo}–{hi_}, स्टेशन ने बताया {actual} → सही",
                f"Yesterday: said {lo}–{hi_}, station read {actual} → Hit")
    if status == "MISSED":
        return (f"कल: कहा {lo}–{hi_}, स्टेशन ने बताया {actual} → चूक by {miss_by}",
                f"Yesterday: said {lo}–{hi_}, station read {actual} → Missed by {miss_by}")
    if status == "MISSED_WAITING":
        return (f"कल: कहा {lo}–{hi_} → चूक, रीडिंग नहीं आई",
                f"Yesterday: said {lo}–{hi_} → Missed, no fresh reading arrived")
    return (f"कल: कहा {lo}–{hi_} → परख जारी", f"Yesterday: said {lo}–{hi_} → still pending")
