"""Deterministic mismatch explanations; provider output only selects fixed categories."""
from __future__ import annotations

import re
from . import aqi, service

CHOICE_THRESHOLD = .7
TRUE_THRESHOLD, FALSE_THRESHOLD = .7, .3
SOURCES = {"iqair_app": "us_aqi", "phone_weather": "us_aqi", "govt_app": "india_aqi", "news": "india_aqi"}
DEVANAGARI = str.maketrans("०१२३४५६७८९", "0123456789")


def number(text: str) -> int | None:
    for raw in re.findall(r"[0-9०-९]+", text or ""):
        value = int(raw.translate(DEVANAGARI))
        if 0 <= value <= 2000:
            return value
    return None


def _answer(raw: dict | None, key: str, choice=False):
    raw = raw or {}
    value = raw.get(key, raw.get("answers", {}).get(key))
    if not isinstance(value, dict):
        return {"value": "unknown", "confidence": 0.0}
    confidence = float(value.get("confidence", value.get("p", value.get("noul", 0))))
    label = value.get("value", value.get("label", value.get("choice", value.get("noul", "unknown"))))
    if choice:
        label = label if confidence >= CHOICE_THRESHOLD else "unknown"
    else:
        label = True if confidence >= TRUE_THRESHOLD else False if confidence <= FALSE_THRESHOLD else "unknown"
    return {"value": label, "confidence": confidence}


def understand(raw: dict | None, explicit: dict) -> dict:
    out = {"kind": _answer(raw, "mismatch_kind", True), "source": _answer(raw, "source", True),
           "unit": _answer(raw, "says_ugm3"), "indoors": _answer(raw, "indoors"),
           "indoor_smoke": _answer(raw, "indoor_smoke"), "fog_or_humid": _answer(raw, "fog_or_humid")}
    out["number"] = {"value": number(explicit.get("text", "")), "confidence": 1.0 if number(explicit.get("text", "")) is not None else 0.0}
    for key in ("source", "unit", "indoors"):
        if explicit.get(key) in {"home_purifier", "personal_monitor", "iqair_app", "phone_weather", "govt_app", "news", "unknown", "ugm3", "us_aqi", "india_aqi", "inside", "outside"}:
            value = explicit[key]
            if key == "indoors": value = value == "inside"
            out[key] = {"value": value, "confidence": 1.0}
    if out["unit"]["value"] is True: out["unit"]["value"] = "ugm3"
    elif out["unit"]["value"] is False: out["unit"]["value"] = "unknown"
    return out


def _unit(u: dict) -> str:
    if u["unit"]["value"] != "unknown": return u["unit"]["value"]
    return SOURCES.get(u["source"]["value"], "unknown")


def build(store, uid: int, now: int, lang: str, raw: dict | None, explicit: dict) -> dict | None:
    card = service.build_card(store, uid, now)
    if not card: return None
    u = understand(raw, explicit); unit = _unit(u); value = u["number"]["value"]
    needs = []
    if u["source"]["value"] == "unknown": needs.append("source")
    if unit == "unknown": needs.append("unit")
    if u["indoors"]["value"] == "unknown": needs.append("indoors")
    converted = None
    if value is not None and unit != "unknown":
        estimate = value if unit == "india_aqi" else aqi.sub_index("pm25", value) if unit == "ugm3" else aqi.cpcb_from_us("pm25", value)
        band, _ = aqi.band_names(estimate)
        converted = {"value": round(estimate), "band": band, "label": "estimate"}
    en = ["This is station air, not your street."]
    hi = ["यह स्टेशन की हवा है, आपकी गली की नहीं।"]
    if u["kind"]["value"] == "other":
        en.insert(0, "I could not tell what you are comparing. Choose the buttons below."); hi.insert(0, "मैं तुलना समझ नहीं पाया। नीचे विकल्प चुनें।")
    if unit == "ugm3": en.insert(0, "Your number appears to be PM2.5 concentration (µg/m³), not an AQI."); hi.insert(0, "आपका नंबर AQI नहीं, PM2.5 सांद्रता (µg/m³) लगता है।")
    elif unit == "us_aqi": en.insert(0, "That source usually shows the US AQI; this page uses India's CPCB scale."); hi.insert(0, "यह स्रोत आमतौर पर US AQI दिखाता है; यह पेज भारत का CPCB पैमाना उपयोग करता है।")
    if converted: en.append(f"On India's scale, the estimate is {converted['value']} ({converted['band']})."); hi.append(f"भारत के पैमाने पर अनुमान {converted['value']} ({converted['band']}) है।")
    if unit in ("ugm3", "us_aqi"):
        direction = "higher" if (value or 0) > 81 else "lower"
        en.append(f"At this pollution level, India's scale is usually {direction} than the US scale.")
        hi.append(f"इस स्तर पर भारत का पैमाना आमतौर पर US पैमाने से {"ऊपर" if direction == "higher" else "नीचे"} होता है।")
    if u["kind"]["value"] != "other":
        en.append("Official AQI is a 24-hour average; a device can show this moment.")
        hi.append("आधिकारिक AQI 24 घंटे का औसत है; उपकरण इस पल की हवा दिखा सकता है।")
    if u["indoors"]["value"] is True or u["indoor_smoke"]["value"] is True:
        en.append("Incense, cooking, smoking, mosquito coils, diyas or heaters can raise indoor readings."); hi.append("अगरबत्ती, खाना पकाना, धुआँ, कॉयल, दीया या हीटर घर के रीडिंग बढ़ा सकते हैं।")
    if u["fog_or_humid"]["value"] is True:
        en.append("Humidity can make low-cost sensors read high, and fog can look worse than the measured average."); hi.append("नमी सस्ते सेंसर की रीडिंग बढ़ा सकती है और कोहरा औसत से ज्यादा बुरा दिख सकता है।")
    if u["kind"]["value"] in ("sky_looks_worse", "station_distrust"):
        en.append("The official AQI is a 24-hour average, while the sky and a device can change moment by moment."); hi.append("आधिकारिक AQI 24 घंटे का औसत है; आसमान और उपकरण की रीडिंग पल-पल बदल सकती है।")
    station = {"name": card["name"], "value": card.get("value"), "age_min": card.get("age_min"), "note": "station air, not your street"}
    return {"understood": u, "needs_confirm": needs, "converted": converted, "station": station, "lines": hi if lang == "hi" else en}
