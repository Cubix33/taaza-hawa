# Saaf Twin Implementation Plan

> **ARCHIVED, incomplete:** superseded by the software-only pivot (Oct 4, 2026). Do not implement.

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Saaf Twin end to end during Oct 8–11 2026. A twin-panel sensor decides *dust vs smog* by physics (IEC 61724-1 soiling ratio). An AWS serverless workflow sends the vendor who owes the cleaning, and the panel itself verifies the cleaning before the ticket closes.

**Architecture:**
- An ESP32 measures short-circuit current of two mini panels (one exposed, one under a servo shutter) and publishes a 1-per-window median over MQTT to AWS IoT Core.
- An IoT Rule invokes a Python Lambda. It computes the soiling ratio, runs a pure-function decision table and stores everything in one DynamoDB table.
- A Step Functions state machine drives the vendor ticket: SES email → `waitForTaskToken` until the technician taps → verify loop → close / reopen / escalate.
- A Vite + React PWA on Amplify Hosting gives one screen per role. Bedrock only rewrites text, guarded so it can never change a number.
- Everything is deployed by AWS CDK (Python).

**Tech Stack:**
- Python 3.12 (Lambda, pytest, moto 5), AWS CDK v2 (Python)
- AWS IoT Core, Lambda, DynamoDB, Step Functions, EventBridge Scheduler, API Gateway HTTP API, SES, Bedrock (Converse API), CloudWatch, Amplify Hosting
- ESP32 Arduino (PubSubClient, Adafruit INA219, ESP32Servo, ArduinoJson v7)
- Vite + React 18 + TypeScript + react-router-dom

**Spec:** `docs/PROBLEM_STATEMENT.md` (read §5 system, §6/6A screens and design, §7 AWS, §8 scope, §10 kill-tests, §12 video before starting).

---

## ⚠️ Hackathon rule: read before touching anything

The rules say: *"Build something new once the clock starts. If you began the project before the hackathon opened, it does not qualify."*

- **Before Oct 8 08:00 IST:** only Task 0 (buying, accounts, learning, kill-tests). **Do not create the repo, type, or paste any code from this plan before the clock starts.**
- **After the clock starts:** create the repo fresh, implement task by task, and **commit after every task** (small, timestamped commits). Never batch-commit. Our last entry was flagged for 30 commits in 65 seconds.
- List the AI tools used (Claude Code) in the README.

---

## Team split (2 people; works solo by doing tracks sequentially)

| Track | Owner | Tasks |
|---|---|---|
| **A: cloud + device** | Person A | 0, 1–11, 12–14, 22 |
| **B: web + story** | Person B (teammate) | 0 (accounts, SES verify), 15–21, 23–24 |
| **Shared contract** | both | API shapes in Task 9 (`backend/saaf/handlers/api.py` docstring) are the contract. B can build UI against the `/demo/*` simulator as soon as Task 13 is deployed |

Day mapping:
- **Thu:** Tasks 1–13.
- **Fri:** Tasks 14–19.
- **Sat (DTU):** Tasks 20–22 + filming.
- **Sun AM:** Tasks 23–24.

---

## File structure (locked before coding)

```
saaf-twin/                      ← new public GitHub repo, created after the clock starts
├── README.md                   problem, architecture, why-each-service, run/deploy, AI-tools disclosure
├── amplify.yml                 Amplify Hosting monorepo build (frontend/)
├── .gitignore
├── backend/                    all Lambda code (one package, many handlers)
│   ├── pytest.ini
│   ├── requirements-dev.txt
│   ├── saaf/
│   │   ├── __init__.py
│   │   ├── config.py           thresholds, defaults, constants (no AWS)
│   │   ├── classify.py         IEC soiling ratio + decision table + dhool streak (pure)
│   │   ├── solar.py            NOAA solar zenith + Haurwitz clear-sky GHI (pure)
│   │   ├── impact.py           expected reference current, ₹/day, litres per wash (pure)
│   │   ├── verify.py           Proof-of-Wipe decision over readings (pure)
│   │   ├── messages.py         hi/en templates for owner, vendor, escalation (pure)
│   │   ├── ai.py               Bedrock Converse rewrite with number guard + fallback
│   │   ├── repo.py             DynamoDB single-table access
│   │   ├── pipeline.py         process_reading(): one reading → verdict → device state
│   │   └── handlers/
│   │       ├── __init__.py
│   │       ├── ingest.py       IoT Rule → pipeline
│   │       ├── flow.py         Step Functions tasks: notify_vendor, verify, reopen, escalate
│   │       ├── api.py          HTTP API router (owner, technician, judge simulator, stats, health)
│   │       └── daily.py        EventBridge Scheduler: noon-block summary
│   └── tests/
│       ├── conftest.py
│       ├── test_classify.py
│       ├── test_solar.py
│       ├── test_impact.py
│       ├── test_verify.py
│       ├── test_messages.py
│       ├── test_ai.py
│       ├── test_repo.py
│       ├── test_pipeline.py
│       ├── test_flow.py
│       ├── test_api.py
│       └── test_daily.py
├── infra/                      AWS CDK (Python)
│   ├── app.py
│   ├── cdk.json
│   ├── requirements.txt
│   ├── saaf_stack.py
│   └── tests/test_stack.py
├── firmware/
│   └── saaf_twin/
│       ├── saaf_twin.ino
│       └── secrets.h.example   (real secrets.h is git-ignored)
└── frontend/                   Vite React TS PWA
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.tsx            routes
        ├── theme.css           design tokens (spec §6A)
        ├── api.ts              typed API client
        ├── i18n.ts             hi/en UI strings + useLang
        ├── usePoll.ts          polling hook
        ├── components/
        │   ├── StatusWord.tsx
        │   ├── HealthStrip.tsx
        │   ├── RoleSwitcher.tsx
        │   ├── SrBar.tsx
        │   └── Sparkline.tsx
        └── pages/
            ├── Landing.tsx      /
            ├── OwnerHome.tsx    /home
            ├── Technician.tsx   /t/:ticketId
            ├── Setup.tsx        /setup
            ├── Audit.tsx        /audit
            ├── Judge.tsx        /judge
            └── How.tsx          /how
```

### Domain vocabulary (use these exact identifiers everywhere)
| Term | Meaning |
|---|---|
| `isc_test_ma` / `isc_ref_ma` | Median short-circuit current (mA) of the exposed / shuttered panel over one window |
| `raw_ratio` | `isc_test_ma / isc_ref_ma` |
| `k` | `raw_ratio` recorded at the last verified clean (calibration) |
| `sr` | Soiling ratio = `raw_ratio / k` |
| `expected_ref_ma` | What the reference *should* read in clear air: demo = baseline at calibration; real = clear-sky model × `isc_stc_eff_ma` |
| Window verdicts | `NO_LIGHT`, `SAAF`, `SMOG_HOLD`, `WATCH`, `DHOOL` |
| Device `status` | Same set minus `NO_LIGHT`. `DHOOL` only after `dhool_consecutive` (=2) DHOOL windows in a row |
| Ticket `status` | `OPEN` → `AWAITING_TECH` → `VERIFYING` → `CLOSED` \| `REOPENED` → (`AWAITING_TECH` again) \| `ESCALATION_DRAFTED` → `ESCALATED` |
| Devices | `saaf-twin-01` = real hardware · `sim-01` = judge simulator (all its readings have `source: "simulated"`) |

### DynamoDB single table `SaafTwin` (PK, SK strings; TTL attribute `ttl`)
| PK | SK | Item |
|---|---|---|
| `DEVICE#{id}` | `META` | device config + live state (see `config.DEVICE_DEFAULTS`) |
| `DEVICE#{id}` | `READING#{iso_ts}` | one window: `isc_test_ma, isc_ref_ma, raw_ratio, sr, verdict, source, ttl` |
| `DEVICE#{id}` | `DAILY#{yyyy-mm-dd}` | noon-block summary |
| `TICKET#{tid}` | `META` | ticket incl. `task_token`, `timeline[]`, `execution_arn` |
| `STATS` | `GLOBAL` | counters `litres_saved`, `cleanings_claimed`, `wipes_verified`, `tickets_reopened` |

Timestamps everywhere: `datetime.now(timezone.utc).isoformat(timespec="seconds")` (e.g. `2026-10-08T10:00:00+00:00`). Lexicographic order = time order.

---

### Task 0: Pre-clock preparation (before Oct 8 08:00; NO project code)

**Files:** none (no repo yet).

- [ ] **Step 1: Buy hardware (spec §9).** 3× 6 V 1–2 W mini panels from the **same batch**, 3× INA219, 2× ESP32 DevKit, 2× SG90, multimeter, jumpers, breadboard, power bank, halogen lamp, frosted sheet, sieve. On the second INA219, solder the **A0 bridge** so its I²C address becomes `0x41`.
- [ ] **Step 2: Accounts.**
  - AWS account in **ap-south-1** with an IAM user + access key. Run `aws configure` with region `ap-south-1`.
  - Install Node.js 20+, `npm i -g aws-cdk`, Python 3.12, Arduino IDE 2.
  - Verify student status on AWS Builder Center.
- [ ] **Step 3: Bedrock readiness (the HaqCheck killer).**
  - In the Bedrock console (ap-south-1), open *Model access* and enable **Amazon Nova Lite**.
  - Test:
    ```bash
    aws bedrock-runtime converse --region ap-south-1 \
      --model-id apac.amazon.nova-lite-v1:0 \
      --messages '[{"role":"user","content":[{"text":"एक वाक्य में नमस्ते कहो"}]}]'
    ```
    Expected: JSON with `output.message.content[0].text` in Hindi.
  - If the model id is rejected, copy the exact *inference profile ID* from Bedrock → *Cross-region inference* and use it as `modelId` everywhere below.
- [ ] **Step 4: SES sandbox.** In the SES console (ap-south-1), *Verified identities*: verify every email used in the demo:
  - sender (`sesFrom`)
  - "vendor" inbox (`demoVendorEmail`, e.g. the teammate's)
  - "authority" inbox (`authorityEmail`)

  Click each verification link.
- [ ] **Step 5: IoT learning (allowed: a throwaway sketch, not project code).** Follow the AWS tutorial "Connect an ESP32 to AWS IoT Core" with a hello-world topic, to learn certificates and the MQTT test client. Delete the throwaway thing afterwards.
- [ ] **Step 6: Kill-tests K1–K3 (spec §10).** Record results in a notebook (photos of multimeter readings).
  - K1 (Oct 5 noon): Isc of both panels at 10:00 / 12:00 / 14:00; ratio drift must be ≤2%; an even dust layer must drop the test panel ≥8%.
  - K2: hazy-noon reference deficit.
  - K3: phone 3 owners + 1 vendor helpline.

  **If K1 fails, stop and tell the team. Do not start Task 1 on this idea.**

---

### Task 1: Repository scaffold (first thing after the clock starts)

**Files:**
- Create: `.gitignore`, `README.md`, `backend/pytest.ini`, `backend/requirements-dev.txt`, `backend/saaf/__init__.py`, `backend/saaf/handlers/__init__.py`

- [ ] **Step 1: Create repo**
```bash
mkdir saaf-twin && cd saaf-twin && git init -b main
mkdir -p backend/saaf/handlers backend/tests infra/tests firmware/saaf_twin
```
- [ ] **Step 2: Write `.gitignore`**
```gitignore
__pycache__/
*.pyc
.venv/
node_modules/
dist/
cdk.out/
.env
frontend/.env.local
firmware/saaf_twin/secrets.h
*.pem
*.key
```
- [ ] **Step 3: Write `backend/requirements-dev.txt`**
```text
boto3>=1.34
pytest>=8
moto[dynamodb]>=5.0
```
- [ ] **Step 4: Write `backend/pytest.ini`**
```ini
[pytest]
pythonpath = .
testpaths = tests
```
- [ ] **Step 5: Create empty package files and README stub**
```bash
: > backend/saaf/__init__.py
: > backend/saaf/handlers/__init__.py
printf "# Saaf Twin\n\nDust or smog? Know before you wash.\n\nBuilt with AI coding assistance (Claude Code); see 'AI tools' section.\n" > README.md
```
- [ ] **Step 6: Install and smoke-run pytest**
```bash
cd backend && python -m venv .venv && . .venv/Scripts/activate   # Windows Git Bash; on macOS/Linux: . .venv/bin/activate
pip install -r requirements-dev.txt
pytest -q
```
Expected: `no tests ran` (exit code 5 is fine).
- [ ] **Step 7: Commit**
```bash
cd .. && git add -A && git commit -m "chore: scaffold saaf-twin repo"
```

---

### Task 2: Config + decision table (the deterministic judge)

**Files:**
- Create: `backend/saaf/config.py`, `backend/saaf/classify.py`
- Test: `backend/tests/test_classify.py`

- [ ] **Step 1: Write the failing test** `backend/tests/test_classify.py`
```python
import pytest
from saaf.classify import Verdict, classify, apply_streak


@pytest.mark.parametrize(
    "test_ma, ref_ma, k, expected_ref, verdict",
    [
        (100, 100, 1.0, 100, Verdict.SAAF),       # clean, clear air
        (97, 100, 1.0, 100, Verdict.SAAF),        # boundary: sr == 0.97 is clean
        (96, 100, 1.0, 100, Verdict.WATCH),
        (90, 100, 1.0, 100, Verdict.WATCH),       # boundary: sr == 0.90 is watch
        (89, 100, 1.0, 100, Verdict.DHOOL),
        (60, 60, 1.0, 100, Verdict.SMOG_HOLD),    # both dimmed equally, ref < 80% expected
        (80, 80, 1.0, 100, Verdict.SAAF),         # boundary: ref == 80% expected is not smog
        (50, 60, 1.0, 100, Verdict.DHOOL),        # dust wins even on a smoggy day
        (110, 100, 1.1, 100, Verdict.SAAF),       # k cancels panel mismatch
        (100, 100, 1.0, None, Verdict.SAAF),      # no expected value -> never smog
        (3, 4, 1.0, 100, Verdict.NO_LIGHT),       # night / no light
    ],
)
def test_classify_table(test_ma, ref_ma, k, expected_ref, verdict):
    got, sr = classify(test_ma, ref_ma, k, expected_ref)
    assert got == verdict
    if verdict == Verdict.NO_LIGHT:
        assert sr is None
    else:
        assert sr == pytest.approx((test_ma / ref_ma) / k)


@pytest.mark.parametrize(
    "window, prev, status, streak",
    [
        (Verdict.DHOOL, 0, Verdict.WATCH, 1),     # first dusty window only "watch"
        (Verdict.DHOOL, 1, Verdict.DHOOL, 2),     # second in a row confirms dhool
        (Verdict.SAAF, 3, Verdict.SAAF, 0),
        (Verdict.WATCH, 1, Verdict.WATCH, 0),
        (Verdict.SMOG_HOLD, 1, Verdict.SMOG_HOLD, 0),
        (Verdict.NO_LIGHT, 1, None, 1),           # no light: status unchanged, streak kept
    ],
)
def test_apply_streak(window, prev, status, streak):
    assert apply_streak(window, prev, 2) == (status, streak)
```
- [ ] **Step 2: Run to verify it fails**

Run: `cd backend && pytest tests/test_classify.py -q`
Expected: FAIL with `ModuleNotFoundError: No module named 'saaf.classify'`
- [ ] **Step 3: Write `backend/saaf/config.py`**
```python
"""Thresholds and defaults. Pure constants, no AWS imports."""
from dataclasses import dataclass


@dataclass(frozen=True)
class Thresholds:
    clean_sr: float = 0.97          # SR >= this is clean (a wipe leaves a film, so not 1.0)
    dhool_sr: float = 0.90          # SR < this is a dusty window
    smog_ref_fraction: float = 0.80  # ref below 80% of expected (with SR clean) = haze in the air
    min_light_ma: float = 5.0       # below this the reference is too dark to judge
    dhool_consecutive: int = 2      # dusty windows in a row before raising a job


THRESHOLDS = Thresholds()

LITRES_PER_KW_WASH = 13.5   # CEEW: 7,000-20,000 L per MW per wash -> midpoint 13.5 L/kW
READING_TTL_DAYS = 30
MAX_WIPE_ATTEMPTS = 2       # second failed wipe -> escalate

DELHI_DWARKA = (28.5921, 77.0460)

DEVICE_DEFAULTS = {
    "mode": "demo",                 # "demo" (lamp / props) or "real" (sun, clear-sky model)
    "k": 1.0,
    "demo_ref_baseline_ma": None,   # set at calibration
    "isc_stc_eff_ma": None,         # real mode: ref Isc at 1000 W/m2, set at clear-noon calibration
    "lat": DELHI_DWARKA[0],
    "lon": DELHI_DWARKA[1],
    "system_kw": 3.0,
    "daily_kwh": 12.0,              # clean-day units (from install sheet / March)
    "tariff": 6.5,                  # INR per kWh
    "owner_name": "Sharma ji",
    "vendor_name": "Vendor",
    "vendor_email": None,
    "hold_s": 60,                   # Proof of Wipe hold (hardware demo 60, real 600)
    "verify_deadline_s": 180,       # give up verifying after this (real: 7200)
    "status": "SAAF",
    "dhool_streak": 0,
    "calibrate_pending": False,
    "open_ticket_id": None,
    "litres_saved_total": 0,
    "last_smog_date": None,
    "message_hi": "पैनल साफ़ हैं। अभी कुछ करने की ज़रूरत नहीं।",
    "message_en": "Panels are clean. Nothing to do right now.",
    "ai_ok": False,
}
```
- [ ] **Step 4: Write `backend/saaf/classify.py`**
```python
"""IEC 61724-1 style soiling ratio and the Saaf Twin decision table. Pure functions."""
from enum import Enum
from typing import Optional, Tuple

from saaf.config import THRESHOLDS, Thresholds


class Verdict(str, Enum):
    NO_LIGHT = "NO_LIGHT"
    SAAF = "SAAF"
    SMOG_HOLD = "SMOG_HOLD"
    WATCH = "WATCH"
    DHOOL = "DHOOL"


def classify(
    isc_test_ma: float,
    isc_ref_ma: float,
    k: float,
    expected_ref_ma: Optional[float],
    t: Thresholds = THRESHOLDS,
) -> Tuple[Verdict, Optional[float]]:
    """Return (window verdict, soiling ratio). Order matters: dust beats smog."""
    if isc_ref_ma < t.min_light_ma:
        return Verdict.NO_LIGHT, None
    sr = (isc_test_ma / isc_ref_ma) / k
    if sr < t.dhool_sr:
        return Verdict.DHOOL, sr
    if sr < t.clean_sr:
        return Verdict.WATCH, sr
    if expected_ref_ma and isc_ref_ma < t.smog_ref_fraction * expected_ref_ma:
        return Verdict.SMOG_HOLD, sr
    return Verdict.SAAF, sr


def apply_streak(window: Verdict, prev_streak: int, needed: int) -> Tuple[Optional[Verdict], int]:
    """Turn a window verdict into a device status. None means 'leave status unchanged'."""
    if window == Verdict.NO_LIGHT:
        return None, prev_streak
    if window == Verdict.DHOOL:
        streak = prev_streak + 1
        return (Verdict.DHOOL if streak >= needed else Verdict.WATCH), streak
    return window, 0
```
- [ ] **Step 5: Run tests**

Run: `pytest tests/test_classify.py -q`
Expected: `17 passed`
- [ ] **Step 6: Commit**
```bash
git add backend && git commit -m "feat(core): soiling ratio decision table with dhool streak"
```

---

### Task 3: Solar geometry + clear-sky model

**Files:**
- Create: `backend/saaf/solar.py`
- Test: `backend/tests/test_solar.py`

- [ ] **Step 1: Write the failing test**
```python
from datetime import datetime, timezone
import pytest
from saaf.solar import solar_zenith_deg, clear_sky_ghi

DELHI = (28.61, 77.21)


def test_zenith_june_solstice_noon_is_small():
    # Delhi solar noon ~06:52 UTC on Jun 21; zenith ~ 28.6 - 23.44 = 5.2 deg
    z = solar_zenith_deg(*DELHI, datetime(2026, 6, 21, 6, 52, tzinfo=timezone.utc))
    assert z == pytest.approx(5.2, abs=1.0)


def test_zenith_march_equinox_noon_equals_latitude():
    z = solar_zenith_deg(*DELHI, datetime(2026, 3, 20, 6, 59, tzinfo=timezone.utc))
    assert z == pytest.approx(28.6, abs=1.0)


def test_zenith_at_local_midnight_is_below_horizon():
    z = solar_zenith_deg(*DELHI, datetime(2026, 10, 8, 18, 30, tzinfo=timezone.utc))
    assert z > 90


def test_clear_sky_overhead_and_night():
    assert clear_sky_ghi(0.0) == pytest.approx(1035.1, abs=0.5)  # 1098*exp(-0.059)
    assert clear_sky_ghi(95.0) == 0.0
```
- [ ] **Step 2: Run to verify it fails**

Run: `pytest tests/test_solar.py -q` → FAIL (module missing)
- [ ] **Step 3: Write `backend/saaf/solar.py`**
```python
"""Deterministic clear-sky model: NOAA solar position + Haurwitz (1945) clear-sky GHI."""
import math
from datetime import datetime, timezone


def solar_zenith_deg(lat: float, lon: float, when: datetime) -> float:
    """Solar zenith angle in degrees (NOAA general solar position equations). `when` must be tz-aware."""
    t = when.astimezone(timezone.utc)
    doy = t.timetuple().tm_yday
    hour = t.hour + t.minute / 60 + t.second / 3600
    g = 2 * math.pi / 365 * (doy - 1 + (hour - 12) / 24)
    eqtime = 229.18 * (0.000075 + 0.001868 * math.cos(g) - 0.032077 * math.sin(g)
                       - 0.014615 * math.cos(2 * g) - 0.040849 * math.sin(2 * g))
    decl = (0.006918 - 0.399912 * math.cos(g) + 0.070257 * math.sin(g)
            - 0.006758 * math.cos(2 * g) + 0.000907 * math.sin(2 * g)
            - 0.002697 * math.cos(3 * g) + 0.00148 * math.sin(3 * g))
    true_solar_min = hour * 60 + eqtime + 4 * lon
    ha = math.radians(true_solar_min / 4 - 180)
    phi = math.radians(lat)
    cos_z = math.sin(phi) * math.sin(decl) + math.cos(phi) * math.cos(decl) * math.cos(ha)
    return math.degrees(math.acos(max(-1.0, min(1.0, cos_z))))


def clear_sky_ghi(zenith_deg: float) -> float:
    """Haurwitz clear-sky global horizontal irradiance, W/m2."""
    cz = math.cos(math.radians(zenith_deg))
    if cz <= 0:
        return 0.0
    return 1098.0 * cz * math.exp(-0.059 / cz)
```
- [ ] **Step 4: Run tests** → `4 passed`
- [ ] **Step 5: Commit**
```bash
git add backend && git commit -m "feat(core): NOAA solar zenith and Haurwitz clear-sky model"
```

---

### Task 4: Impact formulas (expected reference, ₹/day, litres)

**Files:**
- Create: `backend/saaf/impact.py`
- Test: `backend/tests/test_impact.py`

- [ ] **Step 1: Write the failing test**
```python
from datetime import datetime, timezone
import pytest
from saaf.impact import rupees_per_day, litres_per_wash, expected_ref_ma


def test_rupees_formula_matches_spec():
    # (1 - 0.84) * 12 kWh * 6.5 = 12.48 -> 12
    assert rupees_per_day(0.84, 12, 6.5) == 12


def test_rupees_never_negative():
    assert rupees_per_day(1.02, 12, 6.5) == 0
    assert rupees_per_day(None, 12, 6.5) == 0


def test_litres_for_3kw():
    assert litres_per_wash(3.0) == 40   # 3 * 13.5 = 40.5 -> round half to even -> 40


def test_expected_ref_demo_uses_baseline():
    dev = {"mode": "demo", "demo_ref_baseline_ma": 100.0}
    assert expected_ref_ma(dev, datetime.now(timezone.utc)) == 100.0


def test_expected_ref_real_without_calibration_is_none():
    dev = {"mode": "real", "isc_stc_eff_ma": None, "lat": 28.61, "lon": 77.21}
    assert expected_ref_ma(dev, datetime.now(timezone.utc)) is None


def test_expected_ref_real_at_equinox_noon():
    dev = {"mode": "real", "isc_stc_eff_ma": 300.0, "lat": 28.61, "lon": 77.21}
    got = expected_ref_ma(dev, datetime(2026, 3, 20, 6, 59, tzinfo=timezone.utc))
    # Haurwitz at ~28.6 deg zenith ~ 900 W/m2 -> ~270 mA
    assert got == pytest.approx(270, rel=0.05)
```
- [ ] **Step 2: Run to verify it fails** → FAIL (module missing)
- [ ] **Step 3: Write `backend/saaf/impact.py`**
```python
"""Deterministic impact numbers. Every number shown to users comes from here."""
from datetime import datetime
from typing import Optional

from saaf.config import LITRES_PER_KW_WASH
from saaf.solar import clear_sky_ghi, solar_zenith_deg


def rupees_per_day(sr: Optional[float], daily_kwh: float, tariff: float) -> int:
    if sr is None:
        return 0
    return int(round(max(0.0, 1.0 - sr) * daily_kwh * tariff))


def litres_per_wash(system_kw: float) -> int:
    return int(round(system_kw * LITRES_PER_KW_WASH))


def expected_ref_ma(device: dict, now: datetime) -> Optional[float]:
    """What the reference panel should read in clear air right now."""
    if device.get("mode", "demo") == "demo":
        return device.get("demo_ref_baseline_ma")
    eff = device.get("isc_stc_eff_ma")
    if not eff:
        return None
    z = solar_zenith_deg(device["lat"], device["lon"], now)
    return clear_sky_ghi(z) / 1000.0 * eff
```
- [ ] **Step 4: Run tests** → `6 passed`. (If the equinox test is off, print `got` and check Task 3 first.)
- [ ] **Step 5: Commit**
```bash
git add backend && git commit -m "feat(core): honest impact formulas and expected reference current"
```

---

### Task 5: Proof-of-Wipe decision

**Files:**
- Create: `backend/saaf/verify.py`
- Test: `backend/tests/test_verify.py`

- [ ] **Step 1: Write the failing test**
```python
from datetime import datetime, timedelta, timezone
from saaf.verify import verify_decision

T0 = datetime(2026, 10, 9, 10, 0, tzinfo=timezone.utc)


def pts(*pairs):
    return [(T0 + timedelta(seconds=s), sr) for s, sr in pairs]


def test_recovered_when_clean_run_spans_hold():
    p = pts((10, 0.98), (40, 0.99), (70, 0.985))
    assert verify_decision(p, T0, T0 + timedelta(seconds=75), 60, 180, 0.97) == "RECOVERED"


def test_pending_when_clean_run_too_short():
    p = pts((10, 0.98), (40, 0.99))
    assert verify_decision(p, T0, T0 + timedelta(seconds=45), 60, 180, 0.97) == "PENDING"


def test_dirty_reading_resets_the_run():
    p = pts((10, 0.98), (40, 0.85), (70, 0.99))
    assert verify_decision(p, T0, T0 + timedelta(seconds=75), 60, 180, 0.97) == "PENDING"


def test_no_light_breaks_the_run():
    p = pts((10, 0.98), (40, None), (80, 0.99))
    assert verify_decision(p, T0, T0 + timedelta(seconds=85), 60, 180, 0.97) == "PENDING"


def test_failed_after_deadline():
    p = pts((10, 0.80), (40, 0.81))
    assert verify_decision(p, T0, T0 + timedelta(seconds=181), 60, 180, 0.97) == "FAILED"


def test_zero_hold_single_clean_reading_recovers():
    p = pts((5, 0.99))
    assert verify_decision(p, T0, T0 + timedelta(seconds=6), 0, 45, 0.97) == "RECOVERED"


def test_no_points_pending_then_failed():
    assert verify_decision([], T0, T0 + timedelta(seconds=10), 60, 180, 0.97) == "PENDING"
    assert verify_decision([], T0, T0 + timedelta(seconds=200), 60, 180, 0.97) == "FAILED"
```
- [ ] **Step 2: Run to verify it fails** → FAIL
- [ ] **Step 3: Write `backend/saaf/verify.py`**
```python
"""Proof of Wipe: the technician's tap is necessary, the panel is sufficient."""
from datetime import datetime
from typing import List, Optional, Tuple


def verify_decision(
    points: List[Tuple[datetime, Optional[float]]],
    acked_at: datetime,
    now: datetime,
    hold_s: float,
    deadline_s: float,
    clean_sr: float,
) -> str:
    """points: (timestamp, sr) taken at/after the ack, sorted ascending. Returns RECOVERED|PENDING|FAILED."""
    run_start = None
    for ts, sr in points:
        if sr is not None and sr >= clean_sr:
            if run_start is None:
                run_start = ts
        else:
            run_start = None
    if run_start is not None and (points[-1][0] - run_start).total_seconds() >= hold_s:
        return "RECOVERED"
    if (now - acked_at).total_seconds() >= deadline_s:
        return "FAILED"
    return "PENDING"
```
- [ ] **Step 4: Run tests** → `7 passed`
- [ ] **Step 5: Commit**
```bash
git add backend && git commit -m "feat(core): proof-of-wipe verification decision"
```

---

### Task 6: Message templates + Bedrock rewrite with number guard

**Files:**
- Create: `backend/saaf/messages.py`, `backend/saaf/ai.py`
- Test: `backend/tests/test_messages.py`, `backend/tests/test_ai.py`

- [ ] **Step 1: Write failing tests** `backend/tests/test_messages.py`
```python
from saaf.messages import owner_message, vendor_email, escalation_text, numbers_preserved


def test_dhool_hindi_has_rupees():
    assert "₹12" in owner_message("DHOOL", "hi", rupees=12, litres=40)


def test_smog_english_has_litres():
    assert "40" in owner_message("SMOG_HOLD", "en", rupees=0, litres=40)


def test_every_status_has_both_languages():
    for s in ["SAAF", "SMOG_HOLD", "WATCH", "DHOOL", "NO_LIGHT"]:
        assert owner_message(s, "hi", 1, 1) and owner_message(s, "en", 1, 1)


def test_vendor_email_cites_clause_and_link():
    subject, body = vendor_email("Sharma ji", 0.84, 12, "https://x/t/abc")
    assert "5" in body and "https://x/t/abc" in body and "0.84" in body
    assert subject


def test_escalation_mentions_attempts():
    assert "2" in escalation_text("Sharma ji", "Vendor", 2, 12)


def test_numbers_preserved():
    assert numbers_preserved("₹12 and 40 L", "you lose 12 rupees and save 40 litres")
    assert not numbers_preserved("₹12 and 40 L", "you lose some rupees and save 40 litres")
```
`backend/tests/test_ai.py`
```python
from saaf import ai


class FakeBedrock:
    def __init__(self, text=None, boom=False):
        self.text, self.boom = text, boom

    def converse(self, **kwargs):
        if self.boom:
            raise RuntimeError("AccessDenied")
        return {"output": {"message": {"content": [{"text": self.text}]}}}


def test_disabled_returns_template(monkeypatch):
    monkeypatch.setenv("AI_ENABLED", "false")
    assert ai.polish("₹12 loss", "en") == ("₹12 loss", False)


def test_rewrite_kept_when_numbers_preserved(monkeypatch):
    monkeypatch.setenv("AI_ENABLED", "true")
    monkeypatch.setenv("MODEL_ID", "m")
    fake = FakeBedrock("Around ₹12 is lost daily.")
    assert ai.polish("₹12 loss", "en", client=fake) == ("Around ₹12 is lost daily.", True)


def test_rewrite_rejected_when_number_changed(monkeypatch):
    monkeypatch.setenv("AI_ENABLED", "true")
    monkeypatch.setenv("MODEL_ID", "m")
    fake = FakeBedrock("Around ₹15 is lost daily.")
    assert ai.polish("₹12 loss", "en", client=fake) == ("₹12 loss", True)


def test_outage_falls_back_loudly(monkeypatch):
    monkeypatch.setenv("AI_ENABLED", "true")
    monkeypatch.setenv("MODEL_ID", "m")
    assert ai.polish("₹12 loss", "en", client=FakeBedrock(boom=True)) == ("₹12 loss", False)
```
- [ ] **Step 2: Run to verify they fail** → `pytest tests/test_messages.py tests/test_ai.py -q` FAIL
- [ ] **Step 3: Write `backend/saaf/messages.py`**
```python
"""All user-facing text templates. Numbers are filled in here, never by the model."""
import re
from typing import Tuple

OWNER = {
    "SAAF": {
        "hi": "पैनल साफ़ हैं। अभी कुछ करने की ज़रूरत नहीं।",
        "en": "Panels are clean. Nothing to do right now.",
    },
    "SMOG_HOLD": {
        "hi": "धुआँ है, धूल नहीं। धुलाई मत कराइए, लगभग {litres} लीटर पानी बचेगा।",
        "en": "It's the air, not the glass. Don't wash, you'll save about {litres} litres of water.",
    },
    "WATCH": {
        "hi": "थोड़ी धूल जम रही है। हम नज़र रख रहे हैं।",
        "en": "A little dust is building up. We're watching it.",
    },
    "DHOOL": {
        "hi": "धूल जमी है, रोज़ लगभग ₹{rupees} का नुकसान। सफ़ाई आपके vendor की ज़िम्मेदारी है, मुफ़्त।",
        "en": "Dust on the glass is costing about ₹{rupees} a day. Your vendor must clean it, free.",
    },
    "NO_LIGHT": {
        "hi": "अभी रोशनी कम है। उजाला होने पर फिर जाँचेंगे।",
        "en": "Not enough light right now. We'll check again in daylight.",
    },
}

CLAUSE = ("Under PM Surya Ghar, the installing vendor is responsible for cleaning of solar panels "
          "and all-inclusive O&M for 5 years at no cost to the consumer (solar.delhi.gov.in).")


def owner_message(status: str, lang: str, rupees: int, litres: int) -> str:
    return OWNER[status][lang].format(rupees=rupees, litres=litres)


def vendor_email(owner_name: str, sr: float, rupees: int, tech_link: str) -> Tuple[str, str]:
    subject = f"Saaf Twin: free cleaning due for {owner_name}"
    body = (
        f"Namaste,\n\nSaaf Twin measured a soiling ratio of {sr:.2f} on {owner_name}'s rooftop "
        f"(clean is 0.97 or more). Estimated loss: about Rs {rupees} per day.\n\n{CLAUSE}\n\n"
        f"Please clean the panels (including the small Saaf Twin sensor) and then tap the button here:\n"
        f"{tech_link}\n\nThe job closes automatically only when the panel confirms it is clean.\n"
    )
    return subject, body


def escalation_text(owner_name: str, vendor_name: str, attempts: int, rupees: int) -> str:
    return (
        f"Complaint on behalf of {owner_name}: rooftop solar cleaning owed by {vendor_name} under the "
        f"5-year PM Surya Ghar O&M obligation has not been completed. Attempts recorded: {attempts}. "
        f"Measured loss: about Rs {rupees} per day. Sensor evidence is attached in the Saaf Twin audit log."
    )


def numbers_preserved(source: str, candidate: str) -> bool:
    """Every number in the template must appear in the rewrite (guards against invented numbers)."""
    return all(n in re.findall(r"\d+", candidate) for n in re.findall(r"\d+", source))
```
- [ ] **Step 4: Write `backend/saaf/ai.py`**
```python
"""Bedrock is a copy-editor only. It can never change a number or a verdict."""
import os
from typing import Optional, Tuple

import boto3

from saaf.messages import numbers_preserved

PROMPT = (
    "Rewrite this message for a rooftop-solar owner in {lang_name}. Keep it warm and under 30 words. "
    "Keep every number exactly as written, using the same digits. Do not add advice or facts. "
    "Return only the rewritten message.\n\nMessage: {text}"
)


def polish(text: str, lang: str, client: Optional[object] = None) -> Tuple[str, bool]:
    """Return (final_text, ai_ok). ai_ok False means Bedrock was off or failed; show 'AI बंद'."""
    if os.environ.get("AI_ENABLED", "true").lower() != "true":
        return text, False
    try:
        client = client or boto3.client("bedrock-runtime")
        resp = client.converse(
            modelId=os.environ["MODEL_ID"],
            messages=[{"role": "user", "content": [{"text": PROMPT.format(
                lang_name="Hindi (Devanagari script)" if lang == "hi" else "simple English", text=text)}]}],
            inferenceConfig={"maxTokens": 200, "temperature": 0.2},
        )
        out = resp["output"]["message"]["content"][0]["text"].strip()
    except Exception:  # noqa: BLE001 - any Bedrock failure must degrade loudly, not crash
        return text, False
    return (out, True) if out and numbers_preserved(text, out) else (text, True)
```
- [ ] **Step 5: Run tests** → `10 passed`
- [ ] **Step 6: Commit**
```bash
git add backend && git commit -m "feat(core): templates and number-guarded Bedrock rewrite"
```

---

### Task 7: DynamoDB repository

**Files:**
- Create: `backend/saaf/repo.py`, `backend/tests/conftest.py`
- Test: `backend/tests/test_repo.py`

- [ ] **Step 1: Write `backend/tests/conftest.py`**
```python
import boto3
import pytest
from moto import mock_aws


@pytest.fixture
def table(monkeypatch):
    monkeypatch.setenv("AWS_DEFAULT_REGION", "ap-south-1")
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test")
    monkeypatch.setenv("TABLE_NAME", "SaafTwinTest")
    monkeypatch.setenv("AI_ENABLED", "false")
    with mock_aws():
        ddb = boto3.resource("dynamodb", region_name="ap-south-1")
        t = ddb.create_table(
            TableName="SaafTwinTest",
            KeySchema=[{"AttributeName": "PK", "KeyType": "HASH"}, {"AttributeName": "SK", "KeyType": "RANGE"}],
            AttributeDefinitions=[{"AttributeName": "PK", "AttributeType": "S"},
                                  {"AttributeName": "SK", "AttributeType": "S"}],
            BillingMode="PAY_PER_REQUEST",
        )
        yield t
```
- [ ] **Step 2: Write failing test** `backend/tests/test_repo.py`
```python
from saaf import repo


def test_device_roundtrip_with_floats_and_none(table):
    repo.put_device({"device_id": "d1", "k": 1.07, "open_ticket_id": None, "hold_s": 60})
    d = repo.get_device("d1")
    assert d["k"] == 1.07 and d["hold_s"] == 60 and "open_ticket_id" not in d


def test_readings_order_and_since(table):
    for ts, sr in [("2026-10-09T10:00:00+00:00", 0.9), ("2026-10-09T10:00:30+00:00", 0.95),
                   ("2026-10-09T10:01:00+00:00", 0.99)]:
        repo.put_reading("d1", {"ts": ts, "sr": sr, "isc_test_ma": 1.0, "isc_ref_ma": 1.0})
    recent = repo.recent_readings("d1", limit=2)
    assert [r["sr"] for r in recent] == [0.95, 0.99]           # oldest -> newest
    since = repo.readings_since("d1", "2026-10-09T10:00:30+00:00")
    assert [r["sr"] for r in since] == [0.95, 0.99]


def test_ticket_and_stats(table):
    repo.put_ticket({"ticket_id": "t1", "status": "OPEN", "timeline": []})
    assert repo.get_ticket("t1")["status"] == "OPEN"
    repo.incr_stat("wipes_verified")
    repo.incr_stat("litres_saved", 40)
    assert repo.get_stats() == {"wipes_verified": 1, "litres_saved": 40}


def test_list_devices(table):
    repo.put_device({"device_id": "a"})
    repo.put_device({"device_id": "b"})
    assert sorted(d["device_id"] for d in repo.list_devices()) == ["a", "b"]
```
- [ ] **Step 3: Run to verify it fails** → FAIL
- [ ] **Step 4: Write `backend/saaf/repo.py`**
```python
"""DynamoDB single-table access. Floats <-> Decimal handled here only."""
import os
import time
from decimal import Decimal
from typing import Optional

import boto3
from boto3.dynamodb.conditions import Attr, Key

from saaf.config import READING_TTL_DAYS


def _table():
    return boto3.resource("dynamodb").Table(os.environ["TABLE_NAME"])


def to_ddb(obj):
    if isinstance(obj, bool) or obj is None:
        return obj
    if isinstance(obj, float):
        return Decimal(str(obj))
    if isinstance(obj, dict):
        return {k: to_ddb(v) for k, v in obj.items() if v is not None}
    if isinstance(obj, list):
        return [to_ddb(v) for v in obj]
    return obj


def from_ddb(obj):
    if isinstance(obj, Decimal):
        return int(obj) if obj == obj.to_integral_value() else float(obj)
    if isinstance(obj, dict):
        return {k: from_ddb(v) for k, v in obj.items() if k not in ("PK", "SK")}
    if isinstance(obj, list):
        return [from_ddb(v) for v in obj]
    return obj


# ---- devices
def get_device(device_id: str) -> Optional[dict]:
    item = _table().get_item(Key={"PK": f"DEVICE#{device_id}", "SK": "META"}).get("Item")
    return from_ddb(item) if item else None


def put_device(device: dict) -> None:
    _table().put_item(Item=to_ddb({**device, "PK": f"DEVICE#{device['device_id']}", "SK": "META"}))


def list_devices() -> list:
    resp = _table().scan(FilterExpression=Attr("SK").eq("META") & Attr("PK").begins_with("DEVICE#"))
    return [from_ddb(i) for i in resp.get("Items", [])]


# ---- readings
def put_reading(device_id: str, reading: dict) -> None:
    ttl = int(time.time()) + READING_TTL_DAYS * 86400
    _table().put_item(Item=to_ddb({**reading, "PK": f"DEVICE#{device_id}",
                                   "SK": f"READING#{reading['ts']}", "ttl": ttl}))


def recent_readings(device_id: str, limit: int = 60) -> list:
    resp = _table().query(
        KeyConditionExpression=Key("PK").eq(f"DEVICE#{device_id}") & Key("SK").begins_with("READING#"),
        ScanIndexForward=False, Limit=limit)
    return [from_ddb(i) for i in reversed(resp.get("Items", []))]


def readings_since(device_id: str, since_iso: str) -> list:
    resp = _table().query(
        KeyConditionExpression=Key("PK").eq(f"DEVICE#{device_id}")
        & Key("SK").between(f"READING#{since_iso}", "READING#￿"))
    return [from_ddb(i) for i in resp.get("Items", [])]


def put_daily(device_id: str, date: str, summary: dict) -> None:
    _table().put_item(Item=to_ddb({**summary, "PK": f"DEVICE#{device_id}", "SK": f"DAILY#{date}"}))


# ---- tickets
def get_ticket(ticket_id: str) -> Optional[dict]:
    item = _table().get_item(Key={"PK": f"TICKET#{ticket_id}", "SK": "META"}).get("Item")
    return from_ddb(item) if item else None


def put_ticket(ticket: dict) -> None:
    _table().put_item(Item=to_ddb({**ticket, "PK": f"TICKET#{ticket['ticket_id']}", "SK": "META"}))


# ---- stats
def incr_stat(name: str, amount: int = 1) -> None:
    _table().update_item(Key={"PK": "STATS", "SK": "GLOBAL"},
                         UpdateExpression="ADD #n :a",
                         ExpressionAttributeNames={"#n": name},
                         ExpressionAttributeValues={":a": amount})


def get_stats() -> dict:
    item = _table().get_item(Key={"PK": "STATS", "SK": "GLOBAL"}).get("Item")
    return from_ddb(item) if item else {}
```
- [ ] **Step 5: Run tests** → `4 passed`
- [ ] **Step 6: Commit**
```bash
git add backend && git commit -m "feat(data): dynamodb single-table repository"
```

---

### Task 8: Reading pipeline + IoT ingest handler

**Files:**
- Create: `backend/saaf/pipeline.py`, `backend/saaf/handlers/ingest.py`
- Test: `backend/tests/test_pipeline.py`

- [ ] **Step 1: Write the failing test**
```python
from datetime import datetime, timedelta, timezone

from saaf import repo
from saaf.pipeline import new_device, process_reading
from saaf.handlers import ingest

NOW = datetime(2026, 10, 9, 5, 0, tzinfo=timezone.utc)


def calibrated(device_id="d1"):
    d = new_device(device_id)
    d.update(k=1.0, demo_ref_baseline_ma=100.0)
    repo.put_device(d)
    return d


def test_calibration_sets_k_and_baseline(table):
    d = new_device("d1")
    d["calibrate_pending"] = True
    reading, d = process_reading(d, 110.0, 100.0, NOW, "device")
    assert reading["verdict"] == "CALIBRATED"
    assert d["k"] == 1.1 and d["demo_ref_baseline_ma"] == 100.0 and d["calibrate_pending"] is False


def test_two_dusty_windows_confirm_dhool(table):
    d = calibrated()
    _, d = process_reading(d, 80.0, 100.0, NOW, "device")
    assert d["status"] == "WATCH"
    _, d = process_reading(d, 80.0, 100.0, NOW + timedelta(seconds=30), "device")
    assert d["status"] == "DHOOL"
    assert "₹" in d["message_hi"] and d["ai_ok"] is False      # AI disabled in tests -> template
    assert len(repo.recent_readings("d1")) == 2


def test_smog_hold_counts_litres_once_per_day(table):
    d = calibrated()
    _, d = process_reading(d, 60.0, 60.0, NOW, "device")
    assert d["status"] == "SMOG_HOLD" and d["litres_saved_total"] == 40
    _, d = process_reading(d, 60.0, 60.0, NOW + timedelta(minutes=1), "device")
    assert d["litres_saved_total"] == 40
    assert repo.get_stats()["litres_saved"] == 40


def test_ingest_handler_creates_unknown_device(table):
    out = ingest.handler({"device_id": "new-1", "isc_test_ma": 50, "isc_ref_ma": 50}, None)
    assert out["ok"] is True
    assert repo.get_device("new-1") is not None
```
- [ ] **Step 2: Run to verify it fails** → FAIL
- [ ] **Step 3: Write `backend/saaf/pipeline.py`**
```python
"""One reading in -> verdict -> device state. Shared by the IoT ingest and the judge simulator."""
from datetime import datetime, timedelta, timezone
from typing import Tuple

from saaf import ai, repo
from saaf.classify import Verdict, apply_streak, classify
from saaf.config import DEVICE_DEFAULTS, THRESHOLDS
from saaf.impact import expected_ref_ma, litres_per_wash, rupees_per_day
from saaf.messages import owner_message
from saaf.solar import clear_sky_ghi, solar_zenith_deg

IST = timezone(timedelta(hours=5, minutes=30))


def new_device(device_id: str) -> dict:
    return {**DEVICE_DEFAULTS, "device_id": device_id}


def iso(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat(timespec="seconds")


def refresh_message(d: dict) -> None:
    rupees = rupees_per_day(d.get("last_sr"), d["daily_kwh"], d["tariff"])
    litres = litres_per_wash(d["system_kw"])
    hi, ok_hi = ai.polish(owner_message(d["status"], "hi", rupees, litres), "hi")
    en, ok_en = ai.polish(owner_message(d["status"], "en", rupees, litres), "en")
    d.update(message_hi=hi, message_en=en, ai_ok=ok_hi and ok_en)


def process_reading(device: dict, isc_test_ma: float, isc_ref_ma: float,
                    now: datetime, source: str) -> Tuple[dict, dict]:
    d = {**DEVICE_DEFAULTS, **device}
    status_changed = False
    if d.get("calibrate_pending") and isc_ref_ma >= THRESHOLDS.min_light_ma:
        d.update(k=isc_test_ma / isc_ref_ma, demo_ref_baseline_ma=isc_ref_ma,
                 calibrate_pending=False, dhool_streak=0, last_sr=1.0)
        if d["mode"] == "real":
            ghi = clear_sky_ghi(solar_zenith_deg(d["lat"], d["lon"], now))
            if ghi > 200:
                d["isc_stc_eff_ma"] = isc_ref_ma / (ghi / 1000.0)
        verdict, sr = "CALIBRATED", 1.0
        status_changed = d.get("status") != Verdict.SAAF.value
        d["status"] = Verdict.SAAF.value
    else:
        window, sr = classify(isc_test_ma, isc_ref_ma, d["k"], expected_ref_ma(d, now))
        status, d["dhool_streak"] = apply_streak(window, d.get("dhool_streak", 0),
                                                 THRESHOLDS.dhool_consecutive)
        verdict = window.value
        if sr is not None:
            d["last_sr"] = sr
        if status is not None and status.value != d.get("status"):
            d["status"] = status.value
            status_changed = True
        today = now.astimezone(IST).date().isoformat()
        if d["status"] == Verdict.SMOG_HOLD.value and d.get("last_smog_date") != today:
            litres = litres_per_wash(d["system_kw"])
            d["litres_saved_total"] = d.get("litres_saved_total", 0) + litres
            d["last_smog_date"] = today
            repo.incr_stat("litres_saved", litres)
    reading = {"ts": iso(now), "isc_test_ma": isc_test_ma, "isc_ref_ma": isc_ref_ma,
               "raw_ratio": isc_test_ma / isc_ref_ma if isc_ref_ma else None,
               "sr": sr, "verdict": verdict, "source": source}
    repo.put_reading(d["device_id"], reading)
    d["last_reading_at"] = reading["ts"]
    if status_changed:
        refresh_message(d)
    repo.put_device(d)
    return reading, d
```
- [ ] **Step 4: Write `backend/saaf/handlers/ingest.py`**
```python
"""IoT Rule target: SELECT *, topic(2) AS device_id FROM 'saaftwin/+/reading'."""
from datetime import datetime, timezone

from saaf import repo
from saaf.pipeline import new_device, process_reading


def handler(event, context):
    device_id = event["device_id"]
    device = repo.get_device(device_id) or new_device(device_id)
    _, d = process_reading(device, float(event["isc_test_ma"]), float(event["isc_ref_ma"]),
                           datetime.now(timezone.utc), "device")
    return {"ok": True, "status": d["status"]}
```
- [ ] **Step 5: Run tests** → `pytest -q` all pass (classify, solar, impact, verify, messages, ai, repo, pipeline)
- [ ] **Step 6: Commit**
```bash
git add backend && git commit -m "feat(ingest): reading pipeline with streak, smog litres and IoT handler"
```

---

### Task 9: Ticket workflow tasks (Step Functions Lambda handlers)

**Files:**
- Create: `backend/saaf/handlers/flow.py`
- Test: `backend/tests/test_flow.py`

- [ ] **Step 1: Write the failing test**
```python
from datetime import datetime, timedelta, timezone

from saaf import repo
from saaf.handlers import flow
from saaf.pipeline import iso, new_device


class FakeSES:
    def __init__(self):
        self.sent = []

    def send_email(self, **kw):
        self.sent.append(kw)
        return {"MessageId": "m1"}


def setup_ticket(acked_seconds_ago=None, status="OPEN", attempts=0):
    d = new_device("d1")
    d.update(k=1.0, demo_ref_baseline_ma=100.0, vendor_email="vendor@example.com",
             open_ticket_id="t1", status="DHOOL", last_sr=0.84, hold_s=0, verify_deadline_s=45)
    repo.put_device(d)
    t = {"ticket_id": "t1", "device_id": "d1", "status": status, "attempts": attempts,
         "timeline": [], "sr_at_open": 0.84, "rupees_per_day": 12}
    if acked_seconds_ago is not None:
        t["acked_at"] = iso(datetime.now(timezone.utc) - timedelta(seconds=acked_seconds_ago))
    repo.put_ticket(t)


def test_notify_vendor_stores_token_and_emails(table, monkeypatch):
    monkeypatch.setenv("SES_FROM", "from@example.com")
    monkeypatch.setenv("FRONTEND_URL", "https://app.example.com")
    fake = FakeSES()
    monkeypatch.setattr(flow, "_ses", lambda: fake)
    setup_ticket()
    flow.notify_vendor({"ticket_id": "t1", "task_token": "TOKEN"}, None)
    t = repo.get_ticket("t1")
    assert t["status"] == "AWAITING_TECH" and t["task_token"] == "TOKEN"
    assert fake.sent[0]["Destination"]["ToAddresses"] == ["vendor@example.com"]
    assert "https://app.example.com/t/t1" in fake.sent[0]["Message"]["Body"]["Text"]["Data"]


def test_verify_recovered_closes_and_rezeros(table):
    setup_ticket(acked_seconds_ago=5, status="VERIFYING")
    repo.put_reading("d1", {"ts": iso(datetime.now(timezone.utc)), "sr": 0.99, "raw_ratio": 1.05,
                            "isc_test_ma": 105.0, "isc_ref_ma": 100.0, "verdict": "SAAF"})
    out = flow.verify({"ticket_id": "t1"}, None)
    assert out["status"] == "RECOVERED"
    t, d = repo.get_ticket("t1"), repo.get_device("d1")
    assert t["status"] == "CLOSED" and d["status"] == "SAAF" and "open_ticket_id" not in d
    assert d["k"] == 1.05
    assert repo.get_stats()["wipes_verified"] == 1


def test_verify_failed_after_deadline(table):
    setup_ticket(acked_seconds_ago=60, status="VERIFYING")
    assert flow.verify({"ticket_id": "t1"}, None)["status"] == "FAILED"


def test_reopen_then_escalate_on_second_failure(table):
    setup_ticket(status="VERIFYING")
    assert flow.reopen({"ticket_id": "t1"}, None)["escalate"] is False
    assert repo.get_ticket("t1")["status"] == "REOPENED"
    assert flow.reopen({"ticket_id": "t1"}, None)["escalate"] is True
    assert repo.get_stats()["tickets_reopened"] == 2


def test_escalate_drafts_complaint(table):
    setup_ticket(status="AWAITING_TECH", attempts=2)
    flow.escalate({"ticket_id": "t1"}, None)
    t = repo.get_ticket("t1")
    assert t["status"] == "ESCALATION_DRAFTED" and "5-year" in t["escalation_draft"]
```
- [ ] **Step 2: Run to verify it fails** → FAIL
- [ ] **Step 3: Write `backend/saaf/handlers/flow.py`**
```python
"""Step Functions task handlers for the Proof-of-Wipe ticket loop."""
import os
import statistics
from datetime import datetime, timezone

import boto3

from saaf import ai, repo
from saaf.classify import Verdict
from saaf.config import MAX_WIPE_ATTEMPTS, THRESHOLDS
from saaf.messages import escalation_text, vendor_email
from saaf.pipeline import iso, refresh_message
from saaf.verify import verify_decision


def _ses():
    return boto3.client("ses")


def _log(ticket: dict, event: str) -> None:
    ticket.setdefault("timeline", []).append({"ts": iso(datetime.now(timezone.utc)), "event": event})


def notify_vendor(event, context):
    """Invoked with waitForTaskToken. Stores the token, emails the vendor, then the state machine waits."""
    t = repo.get_ticket(event["ticket_id"])
    d = repo.get_device(t["device_id"])
    link = f"{os.environ['FRONTEND_URL']}/t/{t['ticket_id']}"
    subject, body = vendor_email(d.get("owner_name", "owner"), t["sr_at_open"], t["rupees_per_day"], link)
    _ses().send_email(
        Source=os.environ["SES_FROM"],
        Destination={"ToAddresses": [d["vendor_email"]]},
        Message={"Subject": {"Data": subject, "Charset": "UTF-8"},
                 "Body": {"Text": {"Data": body, "Charset": "UTF-8"}}},
    )
    t.update(task_token=event["task_token"], status="AWAITING_TECH")
    _log(t, "VENDOR_NOTIFIED")
    repo.put_ticket(t)
    return {"ok": True}


def verify(event, context):
    t = repo.get_ticket(event["ticket_id"])
    d = repo.get_device(t["device_id"])
    now = datetime.now(timezone.utc)
    acked_at = datetime.fromisoformat(t["acked_at"])
    rows = repo.readings_since(d["device_id"], t["acked_at"])
    points = [(datetime.fromisoformat(r["ts"]), r.get("sr")) for r in rows]
    status = verify_decision(points, acked_at, now, d["hold_s"], d["verify_deadline_s"], THRESHOLDS.clean_sr)
    if status == "RECOVERED":
        clean_raw = [r["raw_ratio"] for r in rows
                     if r.get("sr") is not None and r["sr"] >= THRESHOLDS.clean_sr and r.get("raw_ratio")]
        d["k"] = statistics.median(clean_raw)
        d.update(status=Verdict.SAAF.value, dhool_streak=0, open_ticket_id=None, last_sr=1.0)
        refresh_message(d)
        repo.put_device(d)
        t.update(status="CLOSED", closed_at=iso(now))
        _log(t, "PROOF_OF_WIPE")
        repo.put_ticket(t)
        repo.incr_stat("wipes_verified")
        repo.incr_stat("cleanings_claimed")
    return {"ticket_id": t["ticket_id"], "status": status}


def reopen(event, context):
    t = repo.get_ticket(event["ticket_id"])
    t["attempts"] = t.get("attempts", 0) + 1
    t["status"] = "REOPENED"
    _log(t, "REOPENED_PANEL_STILL_DIRTY")
    repo.put_ticket(t)
    repo.incr_stat("tickets_reopened")
    return {"ticket_id": t["ticket_id"], "escalate": t["attempts"] >= MAX_WIPE_ATTEMPTS}


def escalate(event, context):
    t = repo.get_ticket(event["ticket_id"])
    d = repo.get_device(t["device_id"])
    draft = escalation_text(d.get("owner_name", "owner"), d.get("vendor_name", "vendor"),
                            t.get("attempts", 0), t.get("rupees_per_day", 0))
    polished, ai_ok = ai.polish(draft, "en")
    t.update(status="ESCALATION_DRAFTED", escalation_draft=polished, escalation_ai_ok=ai_ok)
    _log(t, "ESCALATION_DRAFTED")
    repo.put_ticket(t)
    return {"ticket_id": t["ticket_id"]}
```
- [ ] **Step 4: Run tests** → `pytest tests/test_flow.py -q` → `5 passed`
- [ ] **Step 5: Commit**
```bash
git add backend && git commit -m "feat(flow): notify, verify, reopen and escalate task handlers"
```

---

### Task 10: HTTP API router (the frontend contract)

**Files:**
- Create: `backend/saaf/handlers/api.py`
- Test: `backend/tests/test_api.py`

- [ ] **Step 1: Write the failing test**
```python
import json

from saaf import repo
from saaf.handlers import api


def call(method, path, body=None):
    ev = {"requestContext": {"http": {"method": method}}, "rawPath": path,
          "body": json.dumps(body) if body is not None else None, "isBase64Encoded": False}
    r = api.handler(ev, None)
    return r["statusCode"], json.loads(r["body"])


class FakeSFN:
    def __init__(self):
        self.started, self.success = [], []

    def start_execution(self, **kw):
        self.started.append(kw)
        return {"executionArn": "arn:aws:states:ap-south-1:1:execution:sm:" + kw["name"]}

    def send_task_success(self, **kw):
        self.success.append(kw)
        return {}


def test_judge_flow_reset_simulate_ticket_ack(table, monkeypatch):
    monkeypatch.setenv("STATE_MACHINE_ARN", "arn:sm")
    monkeypatch.setenv("DEMO_VENDOR_EMAIL", "vendor@example.com")
    fake = FakeSFN()
    monkeypatch.setattr(api, "_sfn", lambda: fake)

    assert call("POST", "/demo/reset")[0] == 200
    code, body = call("POST", "/demo/simulate", {"scenario": "smog"})
    assert code == 200 and body["device"]["status"] == "SMOG_HOLD"
    code, body = call("POST", "/demo/simulate", {"scenario": "dust"})
    assert body["device"]["status"] == "DHOOL"

    code, ticket = call("POST", "/devices/sim-01/tickets")
    assert code == 201 and fake.started[0]["name"] == ticket["ticket_id"]
    assert call("POST", "/devices/sim-01/tickets")[0] == 409         # one open ticket at a time

    tid = ticket["ticket_id"]
    t = repo.get_ticket(tid)
    t.update(status="AWAITING_TECH", task_token="TOKEN")
    repo.put_ticket(t)
    code, _ = call("POST", f"/tickets/{tid}/ack")
    assert code == 200 and fake.success[0]["taskToken"] == "TOKEN"
    assert repo.get_ticket(tid)["status"] == "VERIFYING"
    assert call("POST", f"/tickets/{tid}/ack")[0] == 409             # double tap rejected


def test_state_includes_rupees_and_readings(table, monkeypatch):
    monkeypatch.setenv("DEMO_VENDOR_EMAIL", "vendor@example.com")
    call("POST", "/demo/reset")
    call("POST", "/demo/simulate", {"scenario": "dust"})
    code, body = call("GET", "/devices/sim-01/state")
    assert code == 200 and body["device"]["rupees_per_day"] == 16   # (1-0.8)*12*6.5 = 15.6 -> 16
    assert len(body["readings"]) == 2 and body["readings"][0]["source"] == "simulated"


def test_simulator_refuses_real_device(table):
    assert call("POST", "/demo/simulate", {"scenario": "dust", "device_id": "saaf-twin-01"})[0] == 400


def test_configure_and_calibrate(table):
    code, _ = call("PUT", "/devices/saaf-twin-01", {"owner_name": "Sunita ji", "vendor_email": "v@x.com",
                                                    "daily_kwh": 14, "evil": "ignored"})
    assert code == 200
    d = repo.get_device("saaf-twin-01")
    assert d["owner_name"] == "Sunita ji" and "evil" not in d
    assert call("POST", "/devices/saaf-twin-01/calibrate")[0] == 200
    assert repo.get_device("saaf-twin-01")["calibrate_pending"] is True


def test_unknown_route_404(table):
    assert call("GET", "/nope")[0] == 404
```
- [ ] **Step 2: Run to verify it fails** → FAIL
- [ ] **Step 3: Write `backend/saaf/handlers/api.py`**
```python
"""HTTP API (API Gateway HTTP API, payload v2). This docstring is the frontend contract.

GET  /devices/{id}/state            -> {device: {...device, rupees_per_day}, readings: [...last 60], ticket: {...}|null}
PUT  /devices/{id}                  body: subset of CONFIG_FIELDS -> {device}
POST /devices/{id}/calibrate        -> {ok}  (next reading becomes the clean baseline)
POST /devices/{id}/tickets          -> 201 {ticket}  (409 unless status DHOOL and no open ticket)
GET  /tickets/{tid}                 -> {ticket (no task_token), device, readings}
POST /tickets/{tid}/ack             -> {ok}  (409 unless AWAITING_TECH)
POST /tickets/{tid}/approve-escalation -> {ok}  (409 unless ESCALATION_DRAFTED)
POST /demo/reset                    -> {device}  (recreates sim-01, calibrated, hold 0 s, deadline 45 s)
POST /demo/simulate                 body {scenario: clean|smog|dust|wipe} -> {device}  (sim-01 only)
GET  /stats                         -> {litres_saved, cleanings_claimed, wipes_verified, tickets_reopened}
GET  /health/deep                   -> {ddb, device_last_reading_age_s, ai_ok, model_id}
"""
import base64
import json
import os
import re
import uuid
from datetime import datetime, timedelta, timezone

import boto3

from saaf import repo
from saaf.impact import rupees_per_day
from saaf.pipeline import iso, new_device, process_reading

SIM_ID = "sim-01"
CONFIG_FIELDS = {"owner_name", "vendor_name", "vendor_email", "daily_kwh", "system_kw", "tariff",
                 "mode", "lat", "lon", "hold_s", "verify_deadline_s"}
SCENARIOS = {"clean": [(100.0, 100.0)], "smog": [(60.0, 60.0)],
             "dust": [(80.0, 100.0), (80.0, 100.0)], "wipe": [(99.0, 100.0)]}


def _sfn():
    return boto3.client("stepfunctions")


def _ses():
    return boto3.client("ses")


def _resp(code, body):
    return {"statusCode": code, "headers": {"content-type": "application/json"},
            "body": json.dumps(body, ensure_ascii=False, default=str)}


def _body(event):
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode()
    return json.loads(raw)


def _public_device(d):
    return {**d, "rupees_per_day": rupees_per_day(d.get("last_sr"), d["daily_kwh"], d["tariff"])}


def _public_ticket(t):
    return {k: v for k, v in t.items() if k != "task_token"} if t else None


def _log(t, event):
    t.setdefault("timeline", []).append({"ts": iso(datetime.now(timezone.utc)), "event": event})


# ---- routes
def get_state(ev, device_id):
    d = repo.get_device(device_id)
    if not d:
        return _resp(404, {"error": "unknown device"})
    t = repo.get_ticket(d["open_ticket_id"]) if d.get("open_ticket_id") else None
    return _resp(200, {"device": _public_device(d), "readings": repo.recent_readings(device_id, 60),
                       "ticket": _public_ticket(t)})


def put_config(ev, device_id):
    d = repo.get_device(device_id) or new_device(device_id)
    d.update({k: v for k, v in _body(ev).items() if k in CONFIG_FIELDS})
    repo.put_device(d)
    return _resp(200, {"device": _public_device(d)})


def calibrate(ev, device_id):
    d = repo.get_device(device_id) or new_device(device_id)
    d["calibrate_pending"] = True
    repo.put_device(d)
    return _resp(200, {"ok": True})


def start_ticket(ev, device_id):
    d = repo.get_device(device_id)
    if not d or d.get("status") != "DHOOL" or d.get("open_ticket_id"):
        return _resp(409, {"error": "a ticket needs a confirmed DHOOL status and no open ticket"})
    tid = uuid.uuid4().hex
    t = {"ticket_id": tid, "device_id": device_id, "status": "OPEN", "attempts": 0, "timeline": [],
         "created_at": iso(datetime.now(timezone.utc)), "sr_at_open": d.get("last_sr"),
         "rupees_per_day": rupees_per_day(d.get("last_sr"), d["daily_kwh"], d["tariff"])}
    _log(t, "OWNER_CALLED_VENDOR")
    repo.put_ticket(t)
    d["open_ticket_id"] = tid
    repo.put_device(d)
    ex = _sfn().start_execution(stateMachineArn=os.environ["STATE_MACHINE_ARN"], name=tid,
                                input=json.dumps({"ticket_id": tid}))
    t["execution_arn"] = ex["executionArn"]
    repo.put_ticket(t)
    return _resp(201, _public_ticket(t))


def get_ticket(ev, tid):
    t = repo.get_ticket(tid)
    if not t:
        return _resp(404, {"error": "unknown ticket"})
    d = repo.get_device(t["device_id"])
    return _resp(200, {"ticket": _public_ticket(t), "device": _public_device(d),
                       "readings": repo.recent_readings(t["device_id"], 20)})


def ack_ticket(ev, tid):
    t = repo.get_ticket(tid)
    if not t or t.get("status") != "AWAITING_TECH":
        return _resp(409, {"error": "ticket is not waiting for the technician"})
    t.update(status="VERIFYING", acked_at=iso(datetime.now(timezone.utc)))
    _log(t, "TECHNICIAN_SAYS_CLEANED")
    repo.put_ticket(t)
    _sfn().send_task_success(taskToken=t["task_token"], output=json.dumps({"ticket_id": tid}))
    return _resp(200, {"ok": True})


def approve_escalation(ev, tid):
    t = repo.get_ticket(tid)
    if not t or t.get("status") != "ESCALATION_DRAFTED":
        return _resp(409, {"error": "no drafted escalation"})
    _ses().send_email(
        Source=os.environ["SES_FROM"], Destination={"ToAddresses": [os.environ["AUTHORITY_EMAIL"]]},
        Message={"Subject": {"Data": "Rooftop solar O&M complaint (Saaf Twin)", "Charset": "UTF-8"},
                 "Body": {"Text": {"Data": t["escalation_draft"], "Charset": "UTF-8"}}})
    t["status"] = "ESCALATED"
    _log(t, "OWNER_APPROVED_ESCALATION")
    repo.put_ticket(t)
    d = repo.get_device(t["device_id"])
    d["open_ticket_id"] = None
    repo.put_device(d)
    return _resp(200, {"ok": True})


def demo_reset(ev):
    d = new_device(SIM_ID)
    d.update(k=1.0, demo_ref_baseline_ma=100.0, hold_s=0, verify_deadline_s=45,
             vendor_email=os.environ.get("DEMO_VENDOR_EMAIL"), owner_name="Sharma ji (demo)",
             vendor_name="Demo Vendor")
    repo.put_device(d)
    return _resp(200, {"device": _public_device(d)})


def demo_simulate(ev):
    body = _body(ev)
    if body.get("device_id", SIM_ID) != SIM_ID or body.get("scenario") not in SCENARIOS:
        return _resp(400, {"error": "simulator only drives sim-01 with clean|smog|dust|wipe"})
    d = repo.get_device(SIM_ID)
    if not d:
        return _resp(409, {"error": "call /demo/reset first"})
    pairs = SCENARIOS[body["scenario"]]
    now = datetime.now(timezone.utc)
    for i, (test_ma, ref_ma) in enumerate(pairs):
        _, d = process_reading(d, test_ma, ref_ma, now - timedelta(seconds=len(pairs) - 1 - i), "simulated")
    return _resp(200, {"device": _public_device(d)})


def stats(ev):
    s = repo.get_stats()
    keys = ["litres_saved", "cleanings_claimed", "wipes_verified", "tickets_reopened"]
    return _resp(200, {k: s.get(k, 0) for k in keys})


def health(ev):
    out = {"ddb": True, "model_id": os.environ.get("MODEL_ID")}
    try:
        repo.get_stats()
    except Exception:  # noqa: BLE001
        out["ddb"] = False
    d = repo.get_device(os.environ.get("DEVICE_ID", "saaf-twin-01")) if out["ddb"] else None
    if d and d.get("last_reading_at"):
        age = datetime.now(timezone.utc) - datetime.fromisoformat(d["last_reading_at"])
        out["device_last_reading_age_s"] = int(age.total_seconds())
    out["ai_ok"] = bool(d and d.get("ai_ok"))
    return _resp(200, out)


ROUTES = [
    ("GET", r"^/devices/([\w-]+)/state$", get_state),
    ("PUT", r"^/devices/([\w-]+)$", put_config),
    ("POST", r"^/devices/([\w-]+)/calibrate$", calibrate),
    ("POST", r"^/devices/([\w-]+)/tickets$", start_ticket),
    ("GET", r"^/tickets/([\w-]+)$", get_ticket),
    ("POST", r"^/tickets/([\w-]+)/ack$", ack_ticket),
    ("POST", r"^/tickets/([\w-]+)/approve-escalation$", approve_escalation),
    ("POST", r"^/demo/reset$", demo_reset),
    ("POST", r"^/demo/simulate$", demo_simulate),
    ("GET", r"^/stats$", stats),
    ("GET", r"^/health/deep$", health),
]


def handler(event, context):
    method = event["requestContext"]["http"]["method"]
    path = event["rawPath"]
    if method == "OPTIONS":
        return _resp(204, {})
    for m, pattern, fn in ROUTES:
        match = re.match(pattern, path)
        if m == method and match:
            return fn(event, *match.groups())
    return _resp(404, {"error": f"no route {method} {path}"})
```
- [ ] **Step 4: Run tests** → `pytest -q` → all pass
- [ ] **Step 5: Commit**
```bash
git add backend && git commit -m "feat(api): owner, technician, judge-simulator, stats and health routes"
```

---

### Task 11: Daily noon-block summary (EventBridge Scheduler target)

**Files:**
- Create: `backend/saaf/handlers/daily.py`
- Test: `backend/tests/test_daily.py`

- [ ] **Step 1: Write the failing test**
```python
from saaf import repo
from saaf.handlers import daily
from saaf.pipeline import new_device


def test_noon_block_median_for_real_devices_only(table):
    real = new_device("r1"); real["mode"] = "real"; repo.put_device(real)
    demo = new_device("d1"); repo.put_device(demo)
    # 10:30, 12:00, 13:30 IST on 2026-10-09 = 05:00, 06:30, 08:00 UTC; 15:00 IST excluded
    for ts, sr in [("2026-10-09T05:00:00+00:00", 0.95), ("2026-10-09T06:30:00+00:00", 0.91),
                   ("2026-10-09T08:00:00+00:00", 0.93), ("2026-10-09T09:30:00+00:00", 0.50)]:
        repo.put_reading("r1", {"ts": ts, "sr": sr, "isc_test_ma": 1.0, "isc_ref_ma": 1.0})
    out = daily.summarise("2026-10-09")
    assert out == {"r1": 0.93}
```
- [ ] **Step 2: Run to verify it fails** → FAIL
- [ ] **Step 3: Write `backend/saaf/handlers/daily.py`**
```python
"""Daily 14:05 IST: median SR of the 10:00-14:00 IST noon block for real-mode devices."""
import statistics
from datetime import datetime, timedelta, timezone

from saaf import repo
from saaf.pipeline import IST


def _utc(dt: datetime) -> str:
    return dt.astimezone(timezone.utc).isoformat(timespec="seconds")


def summarise(date_ist: str) -> dict:
    day = datetime.fromisoformat(date_ist).replace(tzinfo=IST)
    start, end = _utc(day + timedelta(hours=10)), _utc(day + timedelta(hours=14))
    out = {}
    for d in repo.list_devices():
        if d.get("mode") != "real":
            continue
        rows = [r for r in repo.readings_since(d["device_id"], start)
                if r["ts"] < end and r.get("sr") is not None]
        if rows:
            med = statistics.median(r["sr"] for r in rows)
            repo.put_daily(d["device_id"], date_ist, {"median_sr": med, "n": len(rows)})
            out[d["device_id"]] = med
    return out


def handler(event, context):
    return summarise(datetime.now(IST).date().isoformat())
```
- [ ] **Step 4: Run tests** → `pytest -q` all pass
- [ ] **Step 5: Commit**
```bash
git add backend && git commit -m "feat(daily): noon-block median summary for real-mode devices"
```
