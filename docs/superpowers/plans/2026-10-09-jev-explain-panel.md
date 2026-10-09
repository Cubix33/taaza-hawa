# "Doesn't match what you see?" panel with TypeSafe Jev: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a panel on the Check page. A Delhi resident types what they see ("Mi purifier 487, agarbatti jal rahi hai") or taps three button groups, and gets an honest explanation of why their number differs from the station's.

**Architecture:**
- **Route:** a new read-only `POST /explain` route on the existing API Lambda calls a new pure-ish `explain` module.
- **Who decides what:**
  - TypeSafe Jev, an optional client in its own module, only *labels the user's words*.
  - A regex reads the number.
  - The app's existing CPCB maths converts it.
  - Every sentence comes from fixed Hindi/English templates.
- **Without Jev:** if there's no key, Jev fails, or Jev isn't sure, the panel works with buttons only.
- **The one test seam** is `handlers.api.route(...)`, with the Jev client passed in as `classify`, the same way `start_execution` is passed today.

**Tech Stack:**
- Backend: Python 3.12 (Lambda), stdlib `urllib` (no new dependency), pytest.
- Frontend: vanilla ES modules + Vite, `node --test`.
- Infra: AWS SAM.

**Spec:** [docs/jevintegratespec.md](../../jevintegratespec.md). Background:
- [docs/research/2026-10-09-typesafe-jev-integration.md](../../research/2026-10-09-typesafe-jev-integration.md)
- [docs/council/round-5-real-use/02-verdict.md](../../council/round-5-real-use/02-verdict.md)

**Layout update (9 Oct 2026):** where Task 4 differs from [docs/mismatchpanelspec.md](../../mismatchpanelspec.md), follow that spec:
- open the panel step by step: one text box and one button first;
- render button groups only for `needs_confirm`;
- put the opening button in the card-actions row.

That spec's neighbour check (part A) needs its own plan.

**Deviations from the spec, decided here.** Implement these, not the spec text:

1. **Conversion values follow the codebase's table.** The spec's example values (US 300 → ~381, US 190 → ~269) came from the EPA 2024 table. The spec also says "reuse the existing US→CPCB conversion". That conversion (`aqi.cpcb_from_us`) uses aqicn's pre-2024 table, the one WAQI uses, and keeping one conversion wins. The tests pin the codebase's values: **US 300 → 400 (Very Poor), US 190 → 309 (Very Poor)**. The copy never quotes a crossover number; it says "at Delhi's usual winter levels".
2. **`phone_weather` does not imply US AQI.** In India, Google can show the Indian AQI, so that source goes to `needs_confirm`. Only `iqair_app` → `us_aqi` and `govt_app` → `india_aqi` are mapped.
3. **Number extraction rule.** Remove PM labels (`PM2.5`, `pm10`), `µg/m3`, and place numbers (`sector 8`, `sec 21`, `phase 2`, `block 4`, `सेक्टर 8`). Then take the **largest** number in (0, 2000], not the first. "Dwarka sector 8 mein purifier 487" must read 487.
4. **Extra `jev` status `no_text`** for the buttons-only path.
5. **Extra explicit field `number`.** The user can correct the number the regex read.
6. **Confidences are a separate `confidence` object**, Jev's raw labels, not nested inside `understood`.
7. **`GET /card` gains `explain_ai: bool`** (whether Jev is configured), so the page shows the right privacy line.

## Global Constraints

- Jev's `state` is only `{"user_text": <the user's words>}`. Jev never receives or decides an AQI, verdict, range or grade.
- `/explain` is read-only. It never writes cards, holds, grades or readings. Its only write is the Jev label cache.
- The key is server-side only: env `TYPESAFE_API_KEY` on `ApiFn`. No key in `web/` or any `VITE_*` variable.
- Model pinned via env `TYPESAFE_MODEL`, default `jev-1.13.0`.
- Endpoint `POST https://api.typesafe.ai/v1/systemone`, timeout **1.5 s**, no retries. Any failure returns `None`.
- Text is capped at **280** characters, **never stored and never logged**. Logs carry status, labels and confidences only.
- Confidence rules: a choice is accepted at confidence **≥ 0.7**. A noul is true at **p ≥ 0.7**, false at **p ≤ 0.3**, and unknown in between.
- `JEV_LANGS` default `en,hinglish`. Text with any Devanagari counts as `hi` and is skipped unless `hi` is listed.
- Copy:
  - No word from `taaza.phrase.BANNED`. Never "wrong" / "गलत".
  - Converted numbers always say "about" / "लगभग".
  - Hindi and English i18n keys stay identical (enforced by `web/tests/copy.test.js`).
- Deploy the backend (`sam build && sam deploy`) before pushing the frontend (see `DEPLOYING.md`).

## Review Focus

The spec doesn't name these five inputs, but each would hit a real user. Each one has a test in the task that owns the code.

1. **A place number before the reading.** "Dwarka sector 8 mein purifier 487" must read 487, not 8. Pinned in Task 2, `test_extract_number`.
2. **Huge, empty or HTML text.** 1,000 characters containing `<script>`: the route returns 200, Jev receives ≤ 280 characters, and the response never echoes the text. Pinned in Task 3, `test_long_or_html_text_is_capped_and_never_echoed`.
3. **Out-of-range or decorated numbers.** "5000" and "0" are ignored, "487.5" is read as 487.5, "500+" as 500. Pinned in Task 2, `test_extract_number`.
4. **Garbage explicit fields or an unknown station.** `unit: "foo"`, `number: "abc"`, `indoors: "maybe"`, `source: "x"` are ignored, not answered with 400/500; an unknown uid gives 404. Pinned in Task 3, `test_garbage_button_values_are_ignored_and_unknown_station_is_404`.
5. **Partial Jev answers.** A response missing some questions or carrying an option we never offered must not crash; the missing fields go to `needs_confirm`. Pinned in Task 1, `test_parse_answers_tolerates_missing_and_foreign_answers`, and Task 3, `test_partial_jev_answers_ask_for_the_missing_fields`.

---

## File Structure

| File | Responsibility |
|---|---|
| `backend/src/taaza/jev.py` (create) | The Jev HTTP client: fixed questions, request body, answer parsing, `enabled()`. Knows nothing about AQI. |
| `backend/src/taaza/explain.py` (create) | Number extraction, unit resolution, conversion, confidence rules, label cache, line selection, response shape. |
| `backend/src/taaza/texts.py` (modify) | Adds the `EXPLAIN` Hindi/English templates and `explain_line()`. |
| `backend/src/handlers/api.py` (modify) | `route(..., classify=None)`, the `/explain` branch, `explain_ai` on `/card`, and the handler wiring. |
| `backend/local_server.py` (modify) | Passes `classify` to `route`, the same way production does. |
| `infra/template.yaml` (modify) | `TypeSafeApiKey` (NoEcho), `TypeSafeModel` and `JevLangs` parameters, and their env vars on `ApiFn`. |
| `backend/tests/test_jev.py` (create) | Client tests with a faked `urlopen`. |
| `backend/tests/test_explain.py` (create) | Pure helpers plus route-level behaviour. |
| `web/src/lib/explain.js` (create) | Pure helpers: request body, prefill, share text. Imports nothing, so `node --test` can load it. |
| `web/src/lib/store.js`, `web/src/lib/actions.js`, `web/src/lib/i18n.js`, `web/src/pages/check.js`, `web/src/style.css` (modify) | Panel state, the send action, copy, the view and the styles. |
| `web/tests/explain.test.js` (create) | Tests for the pure helpers. |
| `backend/eval/jev_cases.json`, `backend/eval/run_jev_eval.py` (create) | The 30-case manual evaluation. This sits outside `backend/src/`, so it isn't bundled into the Lambda. |

---

### Task 1: Jev client

**Files:**
- Create: `backend/src/taaza/jev.py`
- Test: `backend/tests/test_jev.py`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `jev.URL: str`, `jev.DEFAULT_MODEL = "jev-1.13.0"`, `jev.TIMEOUT_S = 1.5`, `jev.QUESTIONS: dict`
  - `jev.enabled() -> bool`
  - `jev.build_request(text: str) -> dict`
  - `jev.parse_answers(resp: dict) -> dict`, which returns `{"mismatch_kind": {"choice": str, "confidence": float}, "source": {...}, "says_ugm3": float, "indoors": float, "indoor_smoke": float, "fog_or_humid": float}`. Keys are absent when Jev didn't answer them or answered outside our options.
  - `jev.classify(text: str) -> dict | None`, which returns the same shape as `parse_answers`, or `None` on no key or any failure.

- [ ] **Step 1: Write the failing tests** in `backend/tests/test_jev.py`

```python
"""TypeSafe Jev client: fixed questions, only the user's words go out, any failure is None."""
import io
import json
import socket
import urllib.error

import pytest

from taaza import jev

SAMPLE = {"model": "jev-1.13.0", "answers": {
    "mismatch_kind": {"type": "choice", "choice": "device_reading",
                      "probabilities": {"device_reading": 0.93, "other": 0.07}, "confidence": 0.91},
    "source": {"type": "choice", "choice": "home_purifier", "probabilities": {}, "confidence": 0.88},
    "says_ugm3": {"type": "noul", "noul": 0.22},
    "indoors": {"type": "noul", "noul": 0.96},
    "indoor_smoke": {"type": "noul", "noul": 0.97},
    "fog_or_humid": {"type": "noul", "noul": 0.04}},
    "usage": {"input_tokens": 230, "output_tokens": 31}}


class FakeResp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


def test_parse_answers_keeps_only_labels_and_confidences():
    assert jev.parse_answers(SAMPLE) == {
        "mismatch_kind": {"choice": "device_reading", "confidence": 0.91},
        "source": {"choice": "home_purifier", "confidence": 0.88},
        "says_ugm3": 0.22, "indoors": 0.96, "indoor_smoke": 0.97, "fog_or_humid": 0.04}


def test_parse_answers_tolerates_missing_and_foreign_answers():
    resp = {"answers": {"source": {"type": "choice", "choice": "billing", "confidence": 0.99},
                        "indoors": {"type": "noul", "noul": 0.8}}}
    assert jev.parse_answers(resp) == {"indoors": 0.8}
    assert jev.parse_answers({}) == {}


def test_request_sends_only_the_users_words_and_our_fixed_questions(monkeypatch):
    monkeypatch.delenv("TYPESAFE_MODEL", raising=False)
    body = jev.build_request("purifier 487")
    assert body == {"model": "jev-1.13.0", "state": {"user_text": "purifier 487"}, "questions": jev.QUESTIONS}
    assert set(jev.QUESTIONS) == {"mismatch_kind", "source", "says_ugm3", "indoors", "indoor_smoke", "fog_or_humid"}
    monkeypatch.setenv("TYPESAFE_MODEL", "jev-preview")
    assert jev.build_request("x")["model"] == "jev-preview"


def test_no_key_means_disabled_and_no_network_call(monkeypatch):
    monkeypatch.delenv("TYPESAFE_API_KEY", raising=False)

    def boom(*a, **k):
        raise AssertionError("must not call the network without a key")
    monkeypatch.setattr(jev.urllib.request, "urlopen", boom)
    assert jev.enabled() is False
    assert jev.classify("purifier 487") is None


def test_classify_posts_with_the_key_and_a_short_timeout(monkeypatch):
    monkeypatch.setenv("TYPESAFE_API_KEY", "k-123")
    seen = {}

    def fake(req, timeout):
        seen.update(url=req.full_url, auth=req.get_header("Authorization"), timeout=timeout,
                    body=json.loads(req.data))
        return FakeResp(json.dumps(SAMPLE).encode())
    monkeypatch.setattr(jev.urllib.request, "urlopen", fake)
    out = jev.classify("purifier 487")
    assert out["source"] == {"choice": "home_purifier", "confidence": 0.88}
    assert seen["url"] == jev.URL and seen["auth"] == "Bearer k-123" and seen["timeout"] == 1.5
    assert seen["body"]["state"] == {"user_text": "purifier 487"}


@pytest.mark.parametrize("err", [
    urllib.error.HTTPError(jev.URL, 429, "rate", {}, None),
    urllib.error.HTTPError(jev.URL, 529, "overloaded", {}, None),
    socket.timeout("slow"),
    ValueError("not json"),
])
def test_any_failure_returns_none_and_never_logs_the_text(monkeypatch, capsys, err):
    monkeypatch.setenv("TYPESAFE_API_KEY", "k")

    def fake(req, timeout):
        raise err
    monkeypatch.setattr(jev.urllib.request, "urlopen", fake)
    assert jev.classify("SECRET-WORDS purifier") is None
    assert "SECRET-WORDS" not in capsys.readouterr().out
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd backend && python -m pytest -q tests/test_jev.py`
Expected: FAIL with `ImportError: cannot import name 'jev'`.

- [ ] **Step 3: Before writing the request, check the auth header**

Check the header format on `https://docs.typesafe.ai/api`. The plan assumes `Authorization: Bearer <key>`. If the docs name a different header (for example `x-api-key`), use it in Step 4 and change the assertion in `test_classify_posts_with_the_key_and_a_short_timeout` to match.

- [ ] **Step 4: Implement `backend/src/taaza/jev.py`**

```python
"""Optional TypeSafe Jev client. Words only: Jev labels what the user typed, never the air.

Enabled only when TYPESAFE_API_KEY is set. Any failure returns None and the panel falls back to buttons.
The user's text is never logged.
"""
from __future__ import annotations

import json
import os
import urllib.request

URL = "https://api.typesafe.ai/v1/systemone"
DEFAULT_MODEL = "jev-1.13.0"
TIMEOUT_S = 1.5

QUESTIONS: dict = {
    "mismatch_kind": {"type": "choice",
                      "instructions": "What does the person say does not match the air-quality app?",
                      "criteria": {"device_reading": "A number from their own air purifier or air monitor",
                                   "other_app": "A number from another app or website, such as IQAir, Google or Sameer",
                                   "sky_looks_worse": "The air or sky looks, smells or feels worse than the number",
                                   "station_distrust": "They doubt the monitoring station or its sensor",
                                   "other": None}},
    "source": {"type": "choice",
               "instructions": "Where did the person's own number come from?",
               "criteria": {"home_purifier": "An air purifier's display",
                            "personal_monitor": "A standalone air-quality monitor",
                            "iqair_app": "The IQAir or AirVisual app",
                            "phone_weather": "Google, the phone's weather app or a widget",
                            "govt_app": "Sameer, SAFAR or a CPCB website",
                            "news": "TV or a news website",
                            "unknown": None}},
    "says_ugm3": {"type": "noul", "instructions": "Does the text say the number is a PM2.5 or PM10 concentration "
                                                  "in micrograms per cubic metre (µg/m³), not an AQI?"},
    "indoors": {"type": "noul", "instructions": "Was the person's reading taken inside a home, office or car?"},
    "indoor_smoke": {"type": "noul", "instructions": "Does the text mention incense (agarbatti), cooking, smoking, "
                                                     "a mosquito coil, a diya or a heater?"},
    "fog_or_humid": {"type": "noul", "instructions": "Does the text mention fog, mist, humidity or rain?"},
}


def enabled() -> bool:
    return bool(os.environ.get("TYPESAFE_API_KEY"))


def build_request(text: str) -> dict:
    return {"model": os.environ.get("TYPESAFE_MODEL") or DEFAULT_MODEL,
            "state": {"user_text": text}, "questions": QUESTIONS}


def parse_answers(resp: dict) -> dict:
    """Keep only labels and confidences; drop answers we did not ask for or options we never offered."""
    out: dict = {}
    answers = resp.get("answers") or {}
    for key, q in QUESTIONS.items():
        a = answers.get(key)
        if not isinstance(a, dict):
            continue
        try:
            if q["type"] == "choice":
                if a.get("choice") in q["criteria"]:
                    out[key] = {"choice": a["choice"], "confidence": float(a["confidence"])}
            else:
                out[key] = float(a["noul"])
        except (KeyError, TypeError, ValueError):
            continue
    return out


def classify(text: str) -> dict | None:
    key = os.environ.get("TYPESAFE_API_KEY")
    if not key:
        return None
    req = urllib.request.Request(URL, data=json.dumps(build_request(text)).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_S) as r:
            return parse_answers(json.loads(r.read()))
    except Exception as e:  # 401/422/429/529, timeout, bad JSON: the panel shows buttons instead
        print("jev unavailable:", type(e).__name__)
        return None
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `cd backend && python -m pytest -q tests/test_jev.py`
Expected: `9 passed`.

- [ ] **Step 6: Commit**

```bash
git add backend/src/taaza/jev.py backend/tests/test_jev.py
git commit -m "feat(explain): optional TypeSafe Jev client that labels the user's words"
```

---

### Task 2: Explanation copy, number extraction and unit resolution

**Files:**
- Modify: `backend/src/taaza/texts.py` (append at the end)
- Create: `backend/src/taaza/explain.py` (the pure helpers only in this task)
- Test: `backend/tests/test_explain.py` (pure tests)

**Interfaces:**
- Consumes: `aqi.sub_index(pollutant, conc) -> float`, `aqi.cpcb_from_us(pollutant, us) -> float`, `aqi.band_names(si) -> (en, hi)`, `freshness.human_age_en/hi(age_min) -> str`.
- Produces:
  - `texts.EXPLAIN: dict[str, tuple[str, str]]` and `texts.explain_line(key: str, lang: str, **kw) -> str`
  - `explain.SOURCES`, `explain.UNITS`, `explain.MAX_TEXT = 280`
  - `explain.extract_number(text: str) -> float | None`
  - `explain.resolve_unit(source: str | None, says_ugm3: bool | None, explicit: str | None) -> str | None`
  - `explain.to_india(n: float, unit: str) -> int`
  - `explain.lang_enabled(text: str) -> bool`

- [ ] **Step 1: Write the failing tests** in `backend/tests/test_explain.py`

```python
"""'Doesn't match what you see?': the regex reads numbers, our maths converts, Jev only labels words."""
import pytest

from taaza import explain, texts
from taaza.phrase import BANNED


@pytest.mark.parametrize("text,expected", [
    ("Mi purifier bedroom mein 487 dikha raha hai", 487),
    ("मेरा प्यूरीफायर ४८७ दिखा रहा है", 487),
    ("Dwarka sector 8 mein purifier 487", 487),       # Review Focus 1
    ("सेक्टर 12 में purifier 300", 300),
    ("PM2.5 is 40 near sec 62", 40),
    ("pm10 250 ug/m3", 250),
    ("IQAir says 300 in Dwarka", 300),
    ("itna smog hai par app kam bol raha hai", None),
    ("5000", None), ("0", None),                       # Review Focus 3
    ("487.5", 487.5), ("500+", 500),
])
def test_extract_number(text, expected):
    assert explain.extract_number(text) == expected


@pytest.mark.parametrize("n,unit,india", [
    (487, "ugm3", 500),       # beyond CPCB's PM2.5 top: saturates
    (111, "ugm3", 270),       # 200 + 21/30*100
    (300, "us_aqi", 400),     # aqicn table: US 300 = 250.5 ug/m3 -> CPCB 400
    (190, "us_aqi", 309),     # 131.5 ug/m3 -> 300 + 11.5/130*100
    (270, "india_aqi", 270),
    (650, "india_aqi", 500),
])
def test_to_india_uses_the_apps_own_cpcb_maths(n, unit, india):
    assert explain.to_india(n, unit) == india


def test_resolve_unit_prefers_the_user_then_the_words_then_the_source():
    assert explain.resolve_unit("iqair_app", True, "india_aqi") == "india_aqi"
    assert explain.resolve_unit("home_purifier", True, None) == "ugm3"
    assert explain.resolve_unit("iqair_app", None, None) == "us_aqi"
    assert explain.resolve_unit("govt_app", False, None) == "india_aqi"
    assert explain.resolve_unit("home_purifier", False, None) is None
    assert explain.resolve_unit("phone_weather", None, None) is None   # Google may show India's AQI


def test_hindi_script_is_off_by_default_and_switchable(monkeypatch):
    monkeypatch.delenv("JEV_LANGS", raising=False)
    assert explain.lang_enabled("Mi purifier 487") is True
    assert explain.lang_enabled("मेरा purifier 487") is False
    monkeypatch.setenv("JEV_LANGS", "en,hinglish,hi")
    assert explain.lang_enabled("मेरा purifier 487") is True


def test_every_explanation_template_exists_in_both_languages_and_is_honest():
    kw = dict(n=487, est=500, band_en="Severe", band_hi="गंभीर", name="Najafgarh", value=230,
              lo=210, hi_=260, age_en="10 minutes", age_hi="10 मिनट")
    for key in texts.EXPLAIN:
        for lang in ("hi", "en"):
            line = texts.explain_line(key, lang, **kw)
            assert line and "{" not in line, (key, lang)
            low = line.lower()
            assert not any(b in low for b in BANNED), (key, lang)
            assert "wrong" not in low and "गलत" not in line, (key, lang)
    for key in ("unit_ugm3", "unit_us"):
        assert "about" in texts.explain_line(key, "en", **kw) and "लगभग" in texts.explain_line(key, "hi", **kw)
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd backend && python -m pytest -q tests/test_explain.py`
Expected: FAIL with `ImportError: cannot import name 'explain'`.

- [ ] **Step 3: Append the templates to `backend/src/taaza/texts.py`**

This is fixed copy. Use it exactly.

```python
# ---- "Doesn't match what you see?" (explain panel). Fixed copy: Jev only picks which lines apply. ----
EXPLAIN: dict[str, tuple[str, str]] = {
    "unit_ugm3": ("आपका नंबर {n} शायद PM2.5 की मात्रा (µg/m³) है, AQI नहीं। भारत के पैमाने पर यह लगभग AQI {est} ({band_hi}) होगा।",
                  "Your {n} is probably a PM2.5 amount in µg/m³, not an AQI. On India's scale that is about AQI {est} ({band_en})."),
    "unit_us": ("{n} अमेरिकी (US) पैमाने का AQI लगता है। भारत के पैमाने पर यह लगभग {est} ({band_hi}) होगा।",
                "{n} looks like a US-scale AQI. On India's scale that is about {est} ({band_en})."),
    "unit_india": ("{n} पहले से भारत के पैमाने पर है ({band_hi})।",
                   "{n} is already on India's scale ({band_en})."),
    "scale": ("दिल्ली की सर्दियों के आम स्तर पर भारत का नंबर अक्सर US नंबर से ज़्यादा होता है, कम नहीं।",
              "At Delhi's usual winter levels, India's number is often higher than the US number, not lower."),
    "averaging": ("सरकारी AQI (समीर, CPCB, खबरें) पिछले 24 घंटे का औसत है, इसलिए धुंध भरी सुबह वह अभी की हवा से पीछे रहता है। हमारा नंबर स्टेशन का पिछला एक घंटा है।",
                  "The official AQI (Sameer, CPCB, news) is a 24-hour average, so on a smoggy morning it lags behind the air right now. Our number is the station's latest hour."),
    "device_instant": ("आपका डिवाइस इसी पल, एक कमरे या जगह की हवा दिखाता है; स्टेशन पिछले एक घंटे की, बाहर एक तय जगह की।",
                       "Your device shows this moment in one room or spot; the station shows the last hour at one fixed place outdoors."),
    "indoor_smoke": ("अगरबत्ती, खाना पकाना, धूम्रपान, मच्छर-कॉइल, दीया या हीटर कमरे की रीडिंग बहुत बढ़ा देते हैं। यह आपके कमरे की हवा है, शहर की नहीं।",
                     "Incense, cooking, smoking, a mosquito coil, a diya or a heater push a room's reading up a lot. That is your room's air, not the city's."),
    "indoors": ("यह रीडिंग अंदर की है। अंदर की हवा खिड़कियों, प्यूरीफायर और अंदर जल रही चीज़ों के हिसाब से बाहर से अलग होती है।",
                "This reading is from indoors. Indoor air differs from outside depending on windows, purifiers and anything burning inside."),
    "humid": ("नमी या कोहरे में सस्ते सेंसर अक्सर ज़्यादा दिखाते हैं, और कोहरा आसमान को असल से ज़्यादा ख़राब दिखाता है।",
              "Cheap sensors often read high in humid or foggy air, and fog makes the sky look worse than the particles alone."),
    "visibility": ("आसमान कैसा दिखता है, यह प्रदूषण के साथ कोहरे और नमी पर भी निर्भर करता है, इसलिए धूसर सुबह नंबर से ज़्यादा ख़राब दिख सकती है।",
                   "How the sky looks depends on fog and moisture as well as pollution, so a grey morning can look worse than the number."),
    "distrust": ("हम सेंसर के अंदर नहीं देख सकते। हम दिखाते हैं कि उसकी रीडिंग कितनी पुरानी है ({age_hi}) और रिकॉर्ड पेज पर कि वह कितनी बार रिपोर्ट करता है।",
                 "We can't see inside the sensor. We show how old its reading is ({age_en}) and, on the record page, how often it reports."),
    "not_understood": ("हम समझ नहीं पाए आप क्या कहना चाहते हैं। नीचे से विकल्प चुनिए।",
                       "We couldn't tell what you meant. Pick the options below."),
    "station_fresh": ("{name} अभी: भारत के पैमाने पर लगभग {value} ({band_hi}), {age_hi} पुराना।",
                      "{name} right now: about {value} on India's scale ({band_en}), {age_en} old."),
    "station_stale": ("{name} की आख़िरी रीडिंग {age_hi} पुरानी है; हमारा अनुमान {lo}–{hi_} है ({band_hi})।",
                      "{name}'s last reading is {age_en} old; we estimate {lo}–{hi_} ({band_en})."),
    "station_none": ("{name} का अभी कोई ताज़ा नंबर नहीं है।",
                     "{name} has no current number right now."),
    "street": ("यह स्टेशन की हवा है, आपकी गली की नहीं: {name} एक तय जगह पर है।",
               "This is station air, not your street: {name} is one fixed spot."),
}


def explain_line(key: str, lang: str, **kw) -> str:
    hi_t, en_t = EXPLAIN[key]
    return (hi_t if lang == "hi" else en_t).format(**kw)  # extra keywords are ignored by str.format
```

- [ ] **Step 4: Create `backend/src/taaza/explain.py` with the pure helpers**

These are the regexes and rules the tests don't fully pin down; the rest of the module comes in Task 3.

```python
"""'Doesn't match what you see?': explain a number the user sees elsewhere.

Jev (optional) only labels the user's words. The number is read by a regex, converted with the app's own
CPCB maths, and every sentence comes from fixed templates. Nothing here touches the card's verdict.
"""
from __future__ import annotations

import os
import re

from . import aqi

MAX_TEXT = 280
SOURCES = ("home_purifier", "personal_monitor", "iqair_app", "phone_weather", "govt_app", "news")
UNITS = ("ugm3", "us_aqi", "india_aqi")
SOURCE_UNIT = {"iqair_app": "us_aqi", "govt_app": "india_aqi"}  # phone_weather may already be India's AQI

_DEV = str.maketrans("०१२३४५६७८९", "0123456789")
_LABELS = re.compile(r"(?i)pm\s*(?:2\.5|25|10)|[uµμ]g\s*/\s*m\s*3")
_PLACES = re.compile(r"(?i)(?:\b(?:sector|sec|phase|block|ward)|सेक्टर)\s*-?\s*\d+")
_NUM = re.compile(r"\d+(?:\.\d+)?")
_DEVANAGARI = re.compile(r"[ऀ-ॿ]")


def extract_number(text: str) -> float | None:
    """The reading is usually the biggest number once PM labels and place numbers are removed."""
    s = _PLACES.sub(" ", _LABELS.sub(" ", text.translate(_DEV)))
    nums = [float(m) for m in _NUM.findall(s)]
    nums = [n for n in nums if 0 < n <= 2000]
    if not nums:
        return None
    best = max(nums)
    return int(best) if best == int(best) else best
```

The rest is determined by the signatures and tests:
- `resolve_unit`: explicit, then `says_ugm3 is True` → `"ugm3"`, then `SOURCE_UNIT.get(source)`.
- `to_india`:
  - `ugm3` → `aqi.sub_index("pm25", n)`
  - `us_aqi` → `aqi.cpcb_from_us("pm25", n)`
  - `india_aqi` → `min(n, 500)`
  - then `int(round(...))`
- `lang_enabled`: read `JEV_LANGS` (default `"en,hinglish"`). Devanagari text needs `"hi"`; other text needs `"en"` or `"hinglish"`.

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `cd backend && python -m pytest -q tests/test_explain.py`
Expected: all pass (`21 passed`).

- [ ] **Step 6: Commit**

```bash
git add backend/src/taaza/texts.py backend/src/taaza/explain.py backend/tests/test_explain.py
git commit -m "feat(explain): fixed Hindi/English copy, number reader and India-scale conversion"
```

---

### Task 3: `POST /explain` route, Jev wiring, cache and infra

**Files:**
- Modify: `backend/src/taaza/explain.py` (add `explain()` and helpers)
- Modify: `backend/src/handlers/api.py` (the `route` signature at line 31, the `/card` branch at lines 38–49, a new `/explain` branch, and `handler` at lines 209–217)
- Modify: `backend/local_server.py:87`
- Modify: `infra/template.yaml` (Parameters, and `ApiFn.Environment.Variables`)
- Test: `backend/tests/test_explain.py` (append the route tests)

**Interfaces:**
- Consumes:
  - from Task 1: `jev.enabled()`, `jev.classify(text) -> dict | None`
  - from Task 2: `extract_number`, `resolve_unit`, `to_india`, `lang_enabled`, `texts.explain_line`
  - from the codebase: `service.build_card(store, uid, now) -> dict | None`
- Produces:
  - `explain.explain(store, card: dict, body: dict, classify: Callable[[str], dict | None] | None, lang: str) -> dict`
  - `api.route(method, path, q, body, s, t, start_execution=None, classify=None)`
  - `/card` response gains `explain_ai: bool`
  - The `/explain` response:

```python
{"understood": {"kind": str|None, "source": str|None, "unit": str|None, "indoors": bool|None,
                "indoor_smoke": bool|None, "fog_or_humid": bool|None, "number": float|int|None},
 "confidence": dict,              # Jev's raw labels (Task 1 shape); {} when Jev was not used
 "needs_confirm": list[str],      # subset of ["source", "unit", "indoors"], in that order
 "converted": {"number": n, "unit": str, "value": int, "band_en": str, "band_hi": str} | None,
 "station": {"uid": int, "name": str, "state": str, "answer": str, "age_min": int|None,
             "value": int|None, "lo": int|None, "hi": int|None},
 "lines": [{"key": str, "text": str}],
 "jev": "used" | "low_confidence" | "off" | "error" | "skipped_lang" | "no_text"}
```

- [ ] **Step 1: Append the failing route tests** to `backend/tests/test_explain.py`

```python
# ---------------- route level: the one seam ----------------
import json

from handlers import api
from taaza.store import MemoryStore
from test_service import NOW, seed

PURIFIER = "Mi purifier bedroom mein 487 dikha raha hai, agarbatti jal rahi hai"


def labels(kind="device_reading", kc=0.95, source="home_purifier", sc=0.9,
           ugm3=0.9, indoors=0.95, smoke=0.95, fog=0.05):
    return {"mismatch_kind": {"choice": kind, "confidence": kc}, "source": {"choice": source, "confidence": sc},
            "says_ugm3": ugm3, "indoors": indoors, "indoor_smoke": smoke, "fog_or_humid": fog}


def fake(answers, calls=None):
    def classify(text):
        if calls is not None:
            calls.append(text)
        return answers
    return classify


def ask(s, body, classify=None):
    return api.route("POST", "/explain", {}, {"uid": 2, "lang": "en", **body}, s, NOW, classify=classify)


def keys(out):
    return [line["key"] for line in out["lines"]]


@pytest.fixture
def s(monkeypatch):
    monkeypatch.delenv("JEV_LANGS", raising=False)
    st = MemoryStore()
    seed(st)          # uid 2 = Najafgarh, fresh, 230 -> WAIT; uid 1 = Dwarka, 31 h stale
    return st


def test_without_jev_the_panel_asks_all_three_and_converts_nothing(s):
    code, out = ask(s, {"text": "IQAir says 300"})
    assert code == 200 and out["jev"] == "off"
    assert out["needs_confirm"] == ["source", "unit", "indoors"]
    assert out["converted"] is None and out["understood"]["number"] == 300
    assert keys(out)[-2:] == ["station_fresh", "street"]


def test_buttons_only_path_has_no_text_status(s):
    code, out = ask(s, {})
    assert code == 200 and out["jev"] == "no_text" and out["needs_confirm"] == ["source", "unit", "indoors"]


def test_purifier_in_ugm3_with_incense_explains_the_room_not_the_city(s):
    code, out = ask(s, {"text": PURIFIER}, fake(labels()))
    assert out["jev"] == "used" and out["needs_confirm"] == []
    assert out["understood"]["unit"] == "ugm3" and out["understood"]["number"] == 487
    assert out["converted"] == {"number": 487, "unit": "ugm3", "value": 500, "band_en": "Severe", "band_hi": "गंभीर"}
    assert keys(out) == ["unit_ugm3", "device_instant", "indoor_smoke", "station_fresh", "street"]


def test_iqair_300_is_read_as_us_scale_from_the_source(s):
    lab = labels(kind="other_app", source="iqair_app", sc=0.93, ugm3=0.05, indoors=0.1, smoke=0.02, fog=0.03)
    code, out = ask(s, {"text": "IQAir says 300"}, fake(lab))
    assert out["understood"]["unit"] == "us_aqi" and out["needs_confirm"] == []
    assert out["converted"]["value"] == 400 and out["converted"]["band_en"] == "Very Poor"
    assert keys(out)[:2] == ["unit_us", "scale"]


def test_low_confidence_is_asked_not_guessed(s):
    lab = labels(kind="other_app", source="iqair_app", sc=0.4, ugm3=0.5, indoors=0.1, smoke=0.0, fog=0.0)
    code, out = ask(s, {"text": "app says 300"}, fake(lab))
    assert out["jev"] == "low_confidence"
    assert out["understood"]["source"] is None and out["needs_confirm"] == ["source", "unit"]
    assert not any(k.startswith("unit_") for k in keys(out))


def test_buttons_override_what_jev_guessed(s):
    code, out = ask(s, {"text": PURIFIER, "unit": "us_aqi", "number": 190}, fake(labels(ugm3=0.95)))
    assert out["understood"]["unit"] == "us_aqi" and out["converted"]["value"] == 309


def test_devanagari_is_skipped_by_default_but_the_number_is_still_read(s, monkeypatch):
    calls = []
    code, out = ask(s, {"text": "मेरा purifier ४८७ दिखा रहा है"}, fake(labels(), calls))
    assert out["jev"] == "skipped_lang" and calls == [] and out["understood"]["number"] == 487
    monkeypatch.setenv("JEV_LANGS", "en,hinglish,hi")
    code, out = ask(s, {"text": "मेरा purifier ४८७ दिखा रहा है"}, fake(labels(), calls))
    assert out["jev"] == "used" and len(calls) == 1


def test_sky_looks_worse_needs_no_number(s):
    lab = labels(kind="sky_looks_worse", kc=0.9, source="unknown", sc=0.9, ugm3=0.1, indoors=0.1, smoke=0.1, fog=0.8)
    code, out = ask(s, {"text": "itna smog hai par app kam bol raha hai"}, fake(lab))
    assert out["converted"] is None and out["needs_confirm"] == []
    assert keys(out) == ["averaging", "humid", "visibility", "station_fresh", "street"]


def test_jev_failure_falls_back_to_buttons(s):
    code, out = ask(s, {"text": "IQAir says 300"}, fake(None))
    assert code == 200 and out["jev"] == "error" and out["needs_confirm"] == ["source", "unit", "indoors"]


def test_unrelated_text_says_it_did_not_understand(s):
    code, out = ask(s, {"text": "what is the cricket score"}, fake(labels(kind="other", kc=0.92)))
    assert keys(out)[0] == "not_understood" and out["needs_confirm"] == ["source", "unit", "indoors"]


def test_explain_never_changes_the_card(s):
    before = api.route("GET", "/card", {"uid": "2"}, {}, s, NOW)[1]
    ask(s, {"text": PURIFIER, "unit": "india_aqi"}, fake(labels()))
    after = api.route("GET", "/card", {"uid": "2"}, {}, s, NOW)[1]
    assert (before["answer"], before["value"]) == (after["answer"], after["value"]) == ("WAIT", 230)


def test_card_says_whether_jev_is_configured(s):
    assert api.route("GET", "/card", {"uid": "2"}, {}, s, NOW)[1]["explain_ai"] is False
    assert api.route("GET", "/card", {"uid": "2"}, {}, s, NOW, classify=fake(labels()))[1]["explain_ai"] is True


@pytest.mark.parametrize("lang", ["hi", "en"])
def test_no_banned_words_and_never_calls_a_device_wrong(s, lang):
    sets = [labels(), labels(kind="sky_looks_worse", fog=0.9), labels(kind="station_distrust"),
            labels(kind="other_app", source="govt_app", ugm3=0.1), labels(kind="other", kc=0.9)]
    for lab in sets:
        _, out = api.route("POST", "/explain", {}, {"uid": 1, "lang": lang, "text": PURIFIER}, s, NOW,
                           classify=fake(lab))
        for line in out["lines"]:
            low = line["text"].lower()
            assert not any(b in low for b in BANNED) and "wrong" not in low and "गलत" not in line["text"]


def test_users_words_are_never_stored_logged_or_echoed(s, capsys):
    text = "ZQX-unique purifier 487 agarbatti"
    _, out = ask(s, {"text": text}, fake(labels()))
    assert "ZQX" not in repr(vars(s)) and "ZQX" not in capsys.readouterr().out and "ZQX" not in json.dumps(out)


def test_identical_text_is_classified_once(s):
    calls = []
    ask(s, {"text": "  Mi purifier 487 "}, fake(labels(), calls))
    ask(s, {"text": "mi purifier 487"}, fake(labels(), calls))
    assert len(calls) == 1


def test_stale_station_shows_its_range(s):
    _, out = api.route("POST", "/explain", {}, {"uid": 1, "lang": "en"}, s, NOW)
    st = out["station"]
    assert st["state"] == "stale" and st["lo"] < st["hi"] and st["value"] is None
    assert keys(out)[-2] == "station_stale" and f"{st['lo']}–{st['hi']}" in out["lines"][-2]["text"]


def test_long_or_html_text_is_capped_and_never_echoed(s):                      # Review Focus 2
    calls = []
    text = "<script>alert(1)</script> purifier 487 " + "x" * 1000
    code, out = ask(s, {"text": text}, fake(labels(), calls))
    assert code == 200 and len(calls[0]) <= 280 and "<script>" not in json.dumps(out)


def test_garbage_button_values_are_ignored_and_unknown_station_is_404(s):      # Review Focus 4
    code, out = ask(s, {"unit": "foo", "number": "abc", "indoors": "maybe", "source": "x"})
    assert code == 200 and out["needs_confirm"] == ["source", "unit", "indoors"] and out["understood"]["number"] is None
    assert api.route("POST", "/explain", {}, {"uid": 999}, s, NOW)[0] == 404


def test_partial_jev_answers_ask_for_the_missing_fields(s):                    # Review Focus 5
    partial = {"mismatch_kind": {"choice": "device_reading", "confidence": 0.9}, "indoor_smoke": 0.9}
    code, out = ask(s, {"text": PURIFIER}, fake(partial))
    assert code == 200 and out["needs_confirm"] == ["source", "unit", "indoors"]
    assert "indoor_smoke" in keys(out)
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd backend && python -m pytest -q tests/test_explain.py`
Expected: the route tests FAIL with `TypeError: route() got an unexpected keyword argument 'classify'`. The Task 2 tests still pass.

- [ ] **Step 3: Add `explain()` to `backend/src/taaza/explain.py`**

The rules below aren't fully fixed by the tests, so here is the code:

```python
import hashlib
import json
from typing import Callable

from . import texts
from .freshness import human_age_en, human_age_hi
from .store import Store

CHOICE_MIN, NOUL_TRUE, NOUL_FALSE = 0.7, 0.7, 0.3
FIELDS = ("source", "unit", "indoors")
NO_CONFIRM_KINDS = ("sky_looks_worse", "station_distrust")


def _noul(p):
    if p is None:
        return None
    return True if p >= NOUL_TRUE else False if p <= NOUL_FALSE else None


def _choice(a):
    return a["choice"] if a and a["confidence"] >= CHOICE_MIN else None


def _uncertain(raw: dict) -> bool:
    return any((isinstance(v, dict) and v["confidence"] < CHOICE_MIN) or
               (isinstance(v, float) and NOUL_FALSE < v < NOUL_TRUE) for v in raw.values())


def _explicit(body: dict) -> dict:
    out = {}
    if body.get("source") in SOURCES:
        out["source"] = body["source"]
    if body.get("unit") in UNITS:
        out["unit"] = body["unit"]
    if isinstance(body.get("indoors"), bool):
        out["indoors"] = body["indoors"]
    n = body.get("number")
    if not isinstance(n, bool):
        try:
            n = float(n)
            if 0 < n <= 2000:
                out["number"] = int(n) if n == int(n) else n
        except (TypeError, ValueError):
            pass
    return out


def understand(store: Store, text: str, classify) -> tuple[dict, str]:
    """Jev labels (cached by a hash of the normalised text; the text itself is never stored)."""
    if not text:
        return {}, "no_text"
    if classify is None:
        return {}, "off"
    if not lang_enabled(text):
        return {}, "skipped_lang"
    key = "jev#" + hashlib.sha1(" ".join(text.lower().split()).encode()).hexdigest()
    hit = store.get("KV", key)
    if hit:
        return hit["labels"], "used"
    raw = classify(text)
    if raw is None:
        return {}, "error"
    store.put("KV", key, {"labels": raw})
    return raw, "used"
```

Then implement `explain(store, card, body, classify, lang) -> dict` as follows:

1. **Read the input.** `text = (body.get("text") or "").strip()[:MAX_TEXT]`, `ex = _explicit(body)`, and `raw, status = understand(store, text, classify)`. If `status == "used" and _uncertain(raw)`, set `status = "low_confidence"`.
2. **Build `understood`:**
   - `kind = _choice(raw.get("mismatch_kind"))`
   - `source = ex.get("source") or _choice(raw.get("source"))`, where `"unknown"` counts as `None`
   - `indoors = ex["indoors"] if "indoors" in ex else _noul(raw.get("indoors"))`
   - `indoor_smoke = _noul(raw.get("indoor_smoke"))`, `fog_or_humid = _noul(raw.get("fog_or_humid"))`
   - `number = ex.get("number", extract_number(text) if text else None)`
   - `unit = resolve_unit(source, _noul(raw.get("says_ugm3")), ex.get("unit"))`
   - **Unrelated text:** if `kind == "other"` and `ex` is empty, discard Jev's other labels. Set `source`, `unit`, `indoors`, `indoor_smoke` and `fog_or_humid` to `None`, so the user is asked everything rather than shown noise.
3. **`needs_confirm`:** each of `FIELDS` whose value is `None`, unless `kind in NO_CONFIRM_KINDS`.
4. **`converted`:** only when `number` and `unit` are both set. `v = to_india(number, unit)`; the bands come from `aqi.band_names(v)`.
5. **`station`:**
   - Take the card's `uid`, `name`, `state`, `answer` and `age_min`.
   - `value = card.get("value")` (fresh only).
   - `lo`/`hi` come from `card["interval"]` when present, else `None`.
6. **Line keys, in this order:**
   1. If `kind == "other"` and `ex` is empty: `["not_understood"]`, then go straight to 6.9.
   2. If `converted`: `unit_ugm3` / `unit_us` / `unit_india`. If the unit is `us_aqi`, add `scale`.
   3. `averaging` if `source in ("govt_app", "news")` or `kind == "sky_looks_worse"`.
   4. `device_instant` if `kind == "device_reading"` or `source in ("home_purifier", "personal_monitor")`.
   5. `indoor_smoke` if `indoor_smoke`; otherwise `indoors` if `indoors`.
   6. `humid` if `fog_or_humid`.
   7. `visibility` if `kind == "sky_looks_worse"`.
   8. `distrust` if `kind == "station_distrust"`.
   9. Always `station_fresh` / `station_stale` / `station_none` (by `card["state"]`: `fresh`, `stale`, anything else), then `street`.
7. **Render every key** with `texts.explain_line(key, lang, n=number, est=v, band_en=..., band_hi=..., name=card["name"], value=..., lo=..., hi_=..., age_en=..., age_hi=...)`. The station line uses the card's `band_en`/`band_hi`. When `age_min is None`, use `"—"` for `age_en` and `age_hi`.
8. **Log** exactly `print(json.dumps({"explain": status, "labels": understood, "confidence": raw}, ensure_ascii=False))`. This holds labels only, never `text`.
9. **Return** the response shape given in **Interfaces**.

- [ ] **Step 4: Wire the route in `backend/src/handlers/api.py`**

Imports: `from taaza import explain, jev, mail, phrase, places, reliability, school, service, smoke, speech`.

Change the signature to `def route(method, path, q, body, s, t, start_execution=None, classify=None):`.

In the `/card` branch, before `return 200, card`, add `card["explain_ai"] = classify is not None`.

Add a new branch before the `/places` branch:

```python
    if path == "/explain" and method == "POST":
        card = service.build_card(s, int(body.get("uid") or DEFAULT_UID), t)
        if not card:
            return 404, {"error": "unknown station"}
        lang = body.get("lang") if body.get("lang") in ("hi", "en") else "hi"
        return 200, explain.explain(s, card, body, classify, lang)
```

In `handler`, pass `classify=jev.classify if jev.enabled() else None` as the last argument to `route`.

- [ ] **Step 5: Wire the local server and the SAM template**

`backend/local_server.py:87`:
- Change the call to `route(method, u.path, q, body, STORE, now(), classify=jev.classify if jev.enabled() else None)`.
- Add `jev` to the `from taaza import ...` line at 23.

`infra/template.yaml` Parameters, appended after `DefaultStationUid`:

```yaml
  TypeSafeApiKey:
    Type: String
    NoEcho: true
    Default: ""
    Description: TypeSafe Jev key for the "Doesn't match what you see?" panel; empty means buttons only.
  TypeSafeModel:
    Type: String
    Default: "jev-1.13.0"
    Description: Pinned Jev model id. Re-run backend/eval before changing it.
  JevLangs:
    Type: String
    Default: "en,hinglish"
    Description: Languages sent to Jev. Add ",hi" only after Hindi passes backend/eval (80% or better).
```

`ApiFn.Environment.Variables`, appended:

```yaml
          TYPESAFE_API_KEY: !Ref TypeSafeApiKey
          TYPESAFE_MODEL: !Ref TypeSafeModel
          JEV_LANGS: !Ref JevLangs
```

- [ ] **Step 6: Run the whole backend suite**

Run: `cd backend && python -m pytest -q`
Expected: all pass, with no change to the existing tests' results.

- [ ] **Step 7: Validate the template**

Run: `sam validate -t infra/template.yaml --lint`
Expected: `infra/template.yaml is a valid SAM Template`.

- [ ] **Step 8: Commit**

```bash
git add backend/src/taaza/explain.py backend/src/handlers/api.py backend/local_server.py infra/template.yaml backend/tests/test_explain.py
git commit -m "feat(explain): POST /explain with Jev labels, button fallback and label cache"
```

---

### Task 4: The panel on the Check page

**Files:**
- Create: `web/src/lib/explain.js`
- Create: `web/tests/explain.test.js`
- Modify: `web/src/lib/store.js` (the `state` object, lines 10–30)
- Modify: `web/src/lib/actions.js` (add `sendExplain`; reset the panel in `goStation` at lines 80–84)
- Modify: `web/src/lib/i18n.js` (the `hi` block from line 11 and the `en` block from line 260)
- Modify: `web/src/pages/check.js` (the `card()` column A after the hero `</section>`, plus `bind()`)
- Modify: `web/src/style.css` (append)

**Interfaces:**
- Consumes: the `POST /explain` response and `card.explain_ai` from Task 3; `post(path, body)` from `web/src/lib/api.js`.
- Produces:
  - `explainBody(e, uid, lang) -> object`
  - `prefill(e, resp) -> object`
  - `exShareText(resp, url) -> string`
  - `EX_SOURCES`, `EX_UNITS`
  - `state.explain = { open, text, number, source, unit, indoors, picked: [], resp, busy, err }`

- [ ] **Step 1: Write the failing tests** in `web/tests/explain.test.js`

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { explainBody, prefill, exShareText } from '../src/lib/explain.js';

const blank = { text: '', number: '', source: '', unit: '', indoors: '', picked: [] };

test('only fields the user tapped are sent as overrides; Jev guesses are not', () => {
  const e = { ...blank, text: '  Mi purifier 487  ', source: 'home_purifier', unit: 'ugm3', indoors: 'yes', number: '487',
              picked: ['unit', 'indoors'] };
  assert.deepEqual(explainBody(e, 2, 'hi'), { uid: 2, lang: 'hi', text: 'Mi purifier 487', unit: 'ugm3', indoors: true });
});

test('text is capped at 280 characters and a typed number becomes a number', () => {
  const e = { ...blank, text: 'x'.repeat(400), number: '190', picked: ['number'] };
  const b = explainBody(e, 1, 'en');
  assert.equal(b.text.length, 280);
  assert.equal(b.number, 190);
  assert.equal(explainBody({ ...e, number: 'abc' }, 1, 'en').number, undefined);
});

test('prefill shows what the app understood but never overwrites a tapped choice', () => {
  const resp = { understood: { source: 'iqair_app', unit: 'us_aqi', indoors: false, number: 300 } };
  const e = prefill({ ...blank, unit: 'india_aqi', picked: ['unit'] }, resp);
  assert.equal(e.source, 'iqair_app');
  assert.equal(e.unit, 'india_aqi');
  assert.equal(e.indoors, 'no');
  assert.equal(e.number, '300');
  assert.deepEqual(prefill(blank, { understood: { source: null, unit: null, indoors: null, number: null } }),
                   { ...blank });
});

test('the WhatsApp text is the explanation lines plus the link', () => {
  const resp = { lines: [{ key: 'unit_us', text: 'A.' }, { key: 'street', text: 'B.' }] };
  assert.equal(exShareText(resp, 'https://x/#/check?s=2'), 'A.\nB.\nhttps://x/#/check?s=2');
});
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd web && npm test`
Expected: `explain.test.js` FAILS with `Cannot find module '../src/lib/explain.js'`. The other test files still pass.

- [ ] **Step 3: Create `web/src/lib/explain.js`**

It takes no imports, so `node --test` can load it.

```js
// "Doesn't match what you see?": pure helpers (no imports, so node --test can load this file).
export const EX_SOURCES = ['home_purifier', 'personal_monitor', 'iqair_app', 'phone_weather', 'govt_app', 'news'];
export const EX_UNITS = ['ugm3', 'us_aqi', 'india_aqi'];
export const EX_MAX = 280;

export function explainBody(e, uid, lang) {
  const b = { uid, lang };
  const text = e.text.trim().slice(0, EX_MAX);
  if (text) b.text = text;
  for (const f of e.picked) {
    if (f === 'source' && e.source) b.source = e.source;
    if (f === 'unit' && e.unit) b.unit = e.unit;
    if (f === 'indoors' && e.indoors) b.indoors = e.indoors === 'yes';
    if (f === 'number' && Number.isFinite(Number(e.number)) && e.number !== '') b.number = Number(e.number);
  }
  return b;
}

export function prefill(e, resp) {
  const u = resp.understood || {};
  const keep = (f) => e.picked.includes(f);
  return {
    ...e,
    source: keep('source') ? e.source : u.source || '',
    unit: keep('unit') ? e.unit : u.unit || '',
    indoors: keep('indoors') ? e.indoors : u.indoors == null ? '' : u.indoors ? 'yes' : 'no',
    number: keep('number') ? e.number : u.number == null ? '' : String(u.number),
  };
}

export const exShareText = (resp, url) => [...resp.lines.map((l) => l.text), url].join('\n');
```

- [ ] **Step 4: Add the panel state to `web/src/lib/store.js`**

Add inside `state`, after `voiceErr: false,`:

```js
  explain: { open: false, text: "", number: "", source: "", unit: "", indoors: "", picked: [], resp: null, busy: false, err: false },
```

- [ ] **Step 5: Add `sendExplain` to `web/src/lib/actions.js`**

Add `import { explainBody, prefill } from "./explain.js";` at the top.

```js
export async function sendExplain() {
  set({ explain: { ...state.explain, busy: true, err: false } });
  try {
    const resp = await post("/explain", explainBody(state.explain, state.uid, state.lang));
    set({ explain: { ...prefill(state.explain, resp), resp, busy: false } });
  } catch {
    set({ explain: { ...state.explain, busy: false, err: true } });
  }
}
```

In `goStation`, next to `state.card = null;`, add `state.explain = { ...state.explain, resp: null, err: false };`. An explanation for one station must never show under another.

- [ ] **Step 6: Add the copy to `web/src/lib/i18n.js`**

Add the same keys to both blocks; `copy.test.js` enforces this. This is fixed copy, so use it exactly.

`hi` block:

```js
    exOpen: "मेल नहीं खा रहा?",
    exTitle: "आपको जो दिख रहा है, उससे मेल नहीं खा रहा?",
    exPrompt: "अपने शब्दों में बताइए आपको क्या दिख रहा है",
    exPlaceholder: "जैसे: मेरा प्यूरीफायर 487 दिखा रहा है, अगरबत्ती जल रही है",
    exPrivacy: "आपके शब्द TypeSafe को भेजे जाते हैं ताकि ऐप समझ सके। हम इन्हें सहेजते नहीं।",
    exPrivacyOff: "हम आपके शब्दों से सिर्फ़ नंबर पढ़ते हैं। कुछ भी सहेजा नहीं जाता।",
    exNumber: "आपका नंबर (अगर है)",
    exQ: { source: "आपका नंबर कहाँ से है?", unit: "यह किस तरह का नंबर है?", indoors: "घर या अंदर लिया गया?" },
    exOpt: { home_purifier: "प्यूरीफायर", personal_monitor: "एयर मॉनिटर", iqair_app: "IQAir", phone_weather: "फ़ोन मौसम / Google",
             govt_app: "समीर / CPCB", news: "टीवी / खबर", ugm3: "µg/m³ (PM2.5)", us_aqi: "US AQI", india_aqi: "भारत AQI",
             yes: "अंदर", no: "बाहर" },
    exGo: "समझाइए",
    exFail: "अभी समझा नहीं पाए। बटन चुनकर फिर कोशिश करें।",
```

`en` block:

```js
    exOpen: "Doesn't match what you see?",
    exTitle: "Doesn't match what you see?",
    exPrompt: "Tell us what you see, in your own words",
    exPlaceholder: "e.g. My purifier shows 487, incense is burning",
    exPrivacy: "Your words go to TypeSafe so the app can understand them. We don't store them.",
    exPrivacyOff: "We only read the number from your words. Nothing is stored.",
    exNumber: "Your number (if any)",
    exQ: { source: "Where is your number from?", unit: "What kind of number is it?", indoors: "Taken indoors?" },
    exOpt: { home_purifier: "Purifier", personal_monitor: "Air monitor", iqair_app: "IQAir", phone_weather: "Phone weather / Google",
             govt_app: "Sameer / CPCB", news: "TV / news", ugm3: "µg/m³ (PM2.5)", us_aqi: "US AQI", india_aqi: "India AQI",
             yes: "Indoors", no: "Outdoors" },
    exGo: "Explain",
    exFail: "Couldn't explain right now. Pick the options and try again.",
```

- [ ] **Step 7: Render and bind the panel in `web/src/pages/check.js`**

Imports:
- `import { EX_SOURCES, EX_UNITS, EX_MAX, exShareText } from "../lib/explain.js";`
- add `sendExplain` to the actions import.

In `card(c)`, insert `${explainView(c)}` directly after the hero card's closing `</section>` and before `${activityView()}`.

```js
// ---------- "doesn't match what you see?": explains a mismatch, never changes the verdict ----------
function explainView(c) {
  const e = state.explain, r = e.resp;
  if (!e.open) return `<button id="ex-open" class="btn ex-open">${t("exOpen")}</button>`;
  const need = new Set(r?.needs_confirm || []);
  const group = (f, opts) => `<fieldset class="ex-g ${need.has(f) ? "need" : ""}"><legend>${t("exQ")[f]}</legend>
    <div class="chips">${opts.map((o) => `<button type="button" class="chip-btn ${e[f] === o ? "on" : ""}" data-ex="${f}" data-v="${o}"
      aria-pressed="${e[f] === o}">${t("exOpt")[o]}</button>`).join("")}</div></fieldset>`;
  const url = `${location.origin}${location.pathname}#/check?s=${c.uid}`;
  return `<section class="panel ex" aria-labelledby="ex-h">
    <h2 id="ex-h" class="ex-h">${t("exTitle")}</h2>
    <label for="ex-text">${t("exPrompt")}</label>
    <textarea id="ex-text" rows="2" maxlength="${EX_MAX}" placeholder="${esc(t("exPlaceholder"))}">${esc(e.text)}</textarea>
    <p class="muted small"><span id="ex-count">${e.text.length}</span>/${EX_MAX} · ${t(c.explain_ai ? "exPrivacy" : "exPrivacyOff")}</p>
    <label for="ex-num">${t("exNumber")}</label>
    <input id="ex-num" inputmode="decimal" value="${esc(e.number)}">
    ${group("source", EX_SOURCES)}${group("unit", EX_UNITS)}${group("indoors", ["yes", "no"])}
    <button id="ex-go" class="btn" ${e.busy ? "disabled" : ""}>${e.busy ? t("loading") : t("exGo")}</button>
    ${e.err ? `<p class="voice-err" role="alert">${t("exFail")}</p>` : ""}
    ${r ? `<div class="ex-out" aria-live="polite">${r.lines.map((l) => `<p>${esc(l.text)}</p>`).join("")}
      <a class="btn wa" href="https://wa.me/?text=${encodeURIComponent(exShareText(r, url))}" target="_blank" rel="noopener">${icon.wa}<span>${t("share")}</span></a></div>` : ""}
  </section>`;
}
```

In `bind()`, add the handlers below. The text and number inputs change `state` without re-rendering, so focus isn't lost while typing.

```js
  $("ex-open")?.addEventListener("click", () => set({ explain: { ...state.explain, open: true } }));
  $("ex-text")?.addEventListener("input", (ev) => { state.explain.text = ev.target.value; $("ex-count").textContent = ev.target.value.length; });
  $("ex-num")?.addEventListener("input", (ev) => {
    const e = state.explain; e.number = ev.target.value;
    e.picked = ev.target.value ? [...new Set([...e.picked, "number"])] : e.picked.filter((f) => f !== "number");
  });
  document.querySelectorAll("[data-ex]").forEach((b) => b.addEventListener("click", () => {
    const e = state.explain, f = b.dataset.ex, on = e[f] === b.dataset.v && e.picked.includes(f);
    set({ explain: { ...e, [f]: on ? "" : b.dataset.v, picked: on ? e.picked.filter((x) => x !== f) : [...new Set([...e.picked, f])] } });
  }));
  $("ex-go")?.addEventListener("click", sendExplain);
```

- [ ] **Step 8: Append the styles to `web/src/style.css`**

```css
/* "doesn't match what you see?" panel */
.ex-open { margin: 12px 0 0; }
.ex { display: grid; gap: 10px; margin-top: 16px; }
.ex-h { font-size: 1.05rem; margin: 0; }
.ex textarea, .ex input { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1.5px solid var(--line); background: transparent; color: var(--ink); font: inherit; }
.ex-g { border: 0; padding: 0; margin: 0; display: grid; gap: 6px; }
.ex-g legend { font-size: .88rem; font-weight: 600; color: var(--ink2); margin-bottom: 4px; }
.ex-g.need legend::after { content: " •"; color: var(--b3); }
.ex-out { display: grid; gap: 8px; padding-top: 6px; border-top: 1px solid var(--line); }
.ex-out p { margin: 0; line-height: 1.5; }
```

- [ ] **Step 9: Run the web tests and the build**

Run: `cd web && npm test && npm run build`
Expected: all `node --test` files pass (copy, air-lens, explain), and Vite reports `✓ built`.

- [ ] **Step 10: Check it by hand against the demo server**

Run `python backend/local_server.py` and `cd web && npm run dev`. Open `http://localhost:5173/#/check`.

Expected:
- **Without a key:** the link opens the panel. Typing "IQAir says 300" and pressing Explain highlights all three groups.
- **After tapping IQAir + US AQI:** the result shows "about 400 (Very Poor)" and the station line.
- **Hindi:** switching the language re-renders the panel in Hindi.
- **Keyboard:** Tab reaches the textarea, the chips and Explain.

- [ ] **Step 11: Commit**

```bash
git add web/src/lib/explain.js web/tests/explain.test.js web/src/lib/store.js web/src/lib/actions.js web/src/lib/i18n.js web/src/pages/check.js web/src/style.css
git commit -m "feat(web): 'Doesn't match what you see?' panel on the Check page"
```

---

### Task 5: The Jev evaluation set (manual, not CI)

**Files:**
- Create: `backend/eval/jev_cases.json`
- Create: `backend/eval/run_jev_eval.py`

**Interfaces:**
- Consumes: `jev.classify(text)` from Task 1; `CHOICE_MIN`, `NOUL_TRUE`, `NOUL_FALSE` from `explain` (Task 3).
- Produces: a printed per-language report. The decision whether to add `hi` to `JevLangs` is made from it.

- [ ] **Step 1: Write `backend/eval/jev_cases.json`**

These are 30 labelled inputs. Each `expect` lists only the fields the case decides.

```json
[
  {"lang": "en", "text": "My purifier shows 487 and the app says 230", "expect": {"mismatch_kind": "device_reading", "source": "home_purifier"}},
  {"lang": "en", "text": "IQAir says 300 in Dwarka right now", "expect": {"mismatch_kind": "other_app", "source": "iqair_app"}},
  {"lang": "en", "text": "Google weather shows AQI 180 but you show 260", "expect": {"mismatch_kind": "other_app", "source": "phone_weather"}},
  {"lang": "en", "text": "It's so smoggy I can't see the next building but the app says 150", "expect": {"mismatch_kind": "sky_looks_worse"}},
  {"lang": "en", "text": "I don't trust the Anand Vihar sensor at all", "expect": {"mismatch_kind": "station_distrust"}},
  {"lang": "en", "text": "My air monitor reads PM2.5 210 µg/m3 in the bedroom", "expect": {"source": "personal_monitor", "says_ugm3": true, "indoors": true}},
  {"lang": "en", "text": "Purifier went red after we lit incense for puja", "expect": {"source": "home_purifier", "indoor_smoke": true, "indoors": true}},
  {"lang": "en", "text": "Thick fog this morning and my monitor shows 400", "expect": {"fog_or_humid": true}},
  {"lang": "en", "text": "Sameer app says 320 but you say 250", "expect": {"mismatch_kind": "other_app", "source": "govt_app"}},
  {"lang": "en", "text": "What's the cricket score today", "expect": {"mismatch_kind": "other"}},
  {"lang": "hinglish", "text": "Mi purifier bedroom mein 487 dikha raha hai, agarbatti jal rahi hai", "expect": {"source": "home_purifier", "indoors": true, "indoor_smoke": true}},
  {"lang": "hinglish", "text": "IQAir pe 300 aa raha hai, yahan 250 kyun", "expect": {"mismatch_kind": "other_app", "source": "iqair_app"}},
  {"lang": "hinglish", "text": "itna smog hai par app kam bol raha hai", "expect": {"mismatch_kind": "sky_looks_worse"}},
  {"lang": "hinglish", "text": "Anand Vihar ka sensor pe bharosa nahi", "expect": {"mismatch_kind": "station_distrust"}},
  {"lang": "hinglish", "text": "ghar ke monitor mein PM2.5 180 ug/m3 hai", "expect": {"source": "personal_monitor", "says_ugm3": true, "indoors": true}},
  {"lang": "hinglish", "text": "kitchen mein tadka laga aur purifier 500 pe chala gaya", "expect": {"indoor_smoke": true, "indoors": true}},
  {"lang": "hinglish", "text": "subah kohra bahut tha, monitor 350 dikha raha tha", "expect": {"fog_or_humid": true}},
  {"lang": "hinglish", "text": "news mein bola AQI 400 hai, app 280 bol raha", "expect": {"mismatch_kind": "other_app", "source": "news"}},
  {"lang": "hinglish", "text": "Google pe 190 dikh raha hai", "expect": {"mismatch_kind": "other_app", "source": "phone_weather"}},
  {"lang": "hinglish", "text": "aaj match kaun jeeta", "expect": {"mismatch_kind": "other"}},
  {"lang": "hi", "text": "मेरा प्यूरीफायर ४८७ दिखा रहा है और ऐप २३० बता रहा है", "expect": {"mismatch_kind": "device_reading", "source": "home_purifier"}},
  {"lang": "hi", "text": "IQAir पर 300 दिख रहा है", "expect": {"mismatch_kind": "other_app", "source": "iqair_app"}},
  {"lang": "hi", "text": "इतना धुआँ है फिर भी ऐप कम दिखा रहा है", "expect": {"mismatch_kind": "sky_looks_worse"}},
  {"lang": "hi", "text": "आनंद विहार के सेंसर पर भरोसा नहीं", "expect": {"mismatch_kind": "station_distrust"}},
  {"lang": "hi", "text": "घर के मॉनिटर में PM2.5 210 माइक्रोग्राम है", "expect": {"source": "personal_monitor", "says_ugm3": true, "indoors": true}},
  {"lang": "hi", "text": "पूजा में अगरबत्ती जलाई तो प्यूरीफायर लाल हो गया", "expect": {"indoor_smoke": true, "indoors": true}},
  {"lang": "hi", "text": "सुबह बहुत कोहरा था और मॉनिटर 400 दिखा रहा था", "expect": {"fog_or_humid": true}},
  {"lang": "hi", "text": "समीर ऐप 320 बता रहा है", "expect": {"mismatch_kind": "other_app", "source": "govt_app"}},
  {"lang": "hi", "text": "टीवी पर बताया AQI 400 है", "expect": {"mismatch_kind": "other_app", "source": "news"}},
  {"lang": "hi", "text": "आज क्रिकेट मैच कौन जीता", "expect": {"mismatch_kind": "other"}}
]
```

- [ ] **Step 2: Write `backend/eval/run_jev_eval.py`**

Rules:
- An answer counts as **accepted** when a choice has confidence ≥ `CHOICE_MIN`, or a noul is ≥ `NOUL_TRUE` / ≤ `NOUL_FALSE`.
- **Correct** means accepted and equal to `expect`.
- For each language, print: cases, fields checked, the accepted share, the **accepted-correct %**, and the share of fields sent to buttons.
- Finally print `HINDI: enable` if Hindi's accepted-correct % is ≥ 80, else `HINDI: keep off`.

```python
"""Manual Jev check (needs TYPESAFE_API_KEY). Not part of CI: it calls the real API.

  TYPESAFE_API_KEY=... python backend/eval/run_jev_eval.py
"""
import json
import sys
from collections import defaultdict
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from taaza import jev  # noqa: E402
from taaza.explain import CHOICE_MIN, NOUL_FALSE, NOUL_TRUE  # noqa: E402


def decided(v):
    if isinstance(v, dict):
        return v["choice"] if v["confidence"] >= CHOICE_MIN else None
    if v is None:
        return None
    return True if v >= NOUL_TRUE else False if v <= NOUL_FALSE else None


def main():
    if not jev.enabled():
        sys.exit("Set TYPESAFE_API_KEY first.")
    cases = json.loads((Path(__file__).parent / "jev_cases.json").read_text(encoding="utf-8"))
    stats = defaultdict(lambda: {"cases": 0, "fields": 0, "accepted": 0, "correct": 0})
    for c in cases:
        raw = jev.classify(c["text"]) or {}
        st = stats[c["lang"]]
        st["cases"] += 1
        for field, want in c["expect"].items():
            got = decided(raw.get(field))
            st["fields"] += 1
            st["accepted"] += got is not None
            st["correct"] += got is not None and got == want
    for lang, st in stats.items():
        acc = st["correct"] / st["accepted"] if st["accepted"] else 0.0
        print(f"{lang:9} cases={st['cases']} fields={st['fields']} accepted={st['accepted'] / st['fields']:.0%} "
              f"accepted-correct={acc:.0%} to-buttons={1 - st['accepted'] / st['fields']:.0%}")
    hi = stats.get("hi", {"accepted": 0, "correct": 0})
    print("HINDI:", "enable" if hi["accepted"] and hi["correct"] / hi["accepted"] >= 0.8 else "keep off")


if __name__ == "__main__":
    main()
```

- [ ] **Step 3: Check the script fails safely without a key**

Run: `python backend/eval/run_jev_eval.py`
Expected: exits with `Set TYPESAFE_API_KEY first.`

- [ ] **Step 4: Run it with the real key**

Run: `TYPESAFE_API_KEY=<your key> python backend/eval/run_jev_eval.py`
Expected: three lines (`en`, `hinglish`, `hi`) and a `HINDI:` verdict. If it says `enable`, deploy with `--parameter-overrides JevLangs=en,hinglish,hi`. Otherwise leave the default.

- [ ] **Step 5: Commit**

```bash
git add backend/eval/jev_cases.json backend/eval/run_jev_eval.py
git commit -m "test(explain): 30-case manual Jev evaluation per language"
```

---

## Deploy order (after all tasks)

1. **Backend first.** `sam build -t infra/template.yaml && sam deploy --parameter-overrides TypeSafeApiKey=<key>` (plus `JevLangs=...` if Task 5 enabled Hindi).
2. **Check the live API.** `curl -s -X POST "$API/explain" -H 'content-type: application/json' -d '{"uid":<Dwarka uid>,"lang":"en","text":"IQAir says 300"}'` must return `"jev": "used"`, `low_confidence` or `skipped_lang`, never a 5xx.
3. **Then the frontend.** Push the web changes so Amplify rebuilds.
