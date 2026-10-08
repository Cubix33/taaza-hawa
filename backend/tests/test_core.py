import random

from taaza import aqi, conformal, grader
from taaza.estimate import Neighbour, estimate
from taaza.freshness import human_age_hi, is_stale


def test_sub_index_breakpoints():
    assert aqi.sub_index("pm10", 0) == 0
    assert aqi.sub_index("pm10", 100) == 100
    assert aqi.sub_index("pm10", 250) == 200
    assert abs(aqi.sub_index("pm10", 300) - 250) < 1e-9
    assert aqi.sub_index("pm25", 60) == 100
    assert aqi.sub_index("pm25", 90) == 200
    assert aqi.sub_index("pm10", 5000) == 500  # saturates by design


def test_band_to_answer_mapping_is_fixed():
    assert aqi.answer_for(50) == "GO"
    assert aqi.answer_for(168) == "GO"
    assert aqi.answer_for(200) == "GO"
    assert aqi.answer_for(201) == "WAIT"
    assert aqi.answer_for(300) == "WAIT"
    assert aqi.answer_for(301) == "STAY"
    assert aqi.answer_for(500) == "STAY"


def test_staleness_threshold_and_hindi_age():
    assert not is_stale(180) and is_stale(181)
    assert human_age_hi(40) == "40 मिनट"
    assert human_age_hi(31 * 60) == "31 घंटे"


def test_grader_hit_and_missed_by_n():
    assert grader.grade(210, 260, 238).status == grader.HIT
    g = grader.grade(210, 260, 288)
    assert (g.status, g.miss_by) == (grader.MISSED, 28)
    g = grader.grade(210, 260, 190)
    assert (g.status, g.miss_by) == (grader.MISSED, 20)


def test_only_later_reading_can_judge():
    assert not grader.is_judge_reading(1000, 1000)
    assert not grader.is_judge_reading(1000, 900)  # backfilled hour never grades a promise
    assert grader.is_judge_reading(1000, 1001)


def test_conformal_uncalibrated_below_min():
    lo, hi, cal = conformal.conformal_offsets([1.0] * 5)
    assert cal is False and lo < 0 < hi


def test_conformal_coverage_is_near_target():
    rng = random.Random(7)
    calib = [rng.gauss(0, 30) for _ in range(500)]
    test = [rng.gauss(0, 30) for _ in range(5000)]
    lo, hi, cal = conformal.conformal_offsets(calib)
    assert cal
    cov = conformal.coverage([0.0] * len(test), test, lo, hi)
    assert 0.77 <= cov <= 0.83


def test_conformal_is_asymmetric_when_residuals_are():
    # neighbours run low at hotspots: actual - pred is mostly positive
    lo, hi, _ = conformal.conformal_offsets([float(x) for x in range(0, 100)])
    assert lo > -1 and hi > 80


def nb(uid, lat, lon, v, age=30):
    return Neighbour(uid, f"S{uid}", lat, lon, v, age)


def test_estimate_ignores_stale_neighbours_and_picks_three_nearest():
    cands = [nb(1, 28.60, 77.00, 200), nb(2, 28.61, 77.01, 220), nb(3, 28.62, 77.02, 240),
             nb(4, 28.90, 77.40, 999), nb(5, 28.61, 77.00, 999, age=600)]
    e = estimate(28.61, 77.00, cands, None, {}, 31.0)
    assert e.n_neighbours == 3 and not e.used_cams and not e.calibrated
    assert 200 <= e.point <= 240


def test_estimate_uses_cams_only_with_ratio_history():
    cands = [nb(1, 28.6, 77.0, 200)]
    assert not estimate(28.6, 77.0, cands, 150, {"ratios": [1.0] * 4}, 5).used_cams
    e = estimate(28.6, 77.0, cands, 150, {"ratios": [1.2] * 6}, 5)
    assert e.used_cams and abs(e.point - (0.6 * 200 + 0.4 * 180)) < 1e-6


def test_estimate_degrades_to_last_value_and_says_so():
    e = estimate(28.6, 77.0, [], None, {}, 40.0, last_value=180)
    assert e.degraded and not e.calibrated and e.lo < 180 < e.hi
    assert estimate(28.6, 77.0, [], None, {}, 40.0, last_value=None) is None


def test_stale_sentence_never_claims_zero_neighbours():
    from taaza.texts import stale_sentence
    hi, en = stale_sentence("Dwarka Sector 8", 35 * 60, 182, 332, 0, False, False)
    assert "0 " not in en.split("(")[1] and "only the last reading" in en
    assert "सिर्फ़ आख़िरी रीडिंग" in hi
    hi, en = stale_sentence("X", 300, 1, 2, 3, True, True)
    assert "3 live neighbouring stations, bias-corrected CAMS" in en
