"""Forecasts augment a fresh card; they never decide its current verdict."""
from taaza import forecast, service
from taaza.store import MemoryStore

from test_service import H, NOW, rd


def seeded_fresh_wait_store():
    store = MemoryStore()
    for hour in range(72, -1, -1):
        ts = NOW - hour * H
        service.ingest(store, [rd(1, "Dwarka", 28.571, 77.072, ts, 240)], {}, ts)
    return store


def test_on_mode_adds_a_cautious_better_by_line_without_changing_the_verdict(monkeypatch):
    monkeypatch.setenv("FORECAST_MODE", "on")
    store = seeded_fresh_wait_store()
    forecast.run(store, NOW, lambda _series, _h: [(170, 180, 195), (160, 170, 190), (150, 160, 180)], mode="on")

    card = service.build_card(store, 1, NOW)
    assert card["answer"] == "WAIT"
    assert card["forecast"]["better"]["threshold"] == 200
    assert "Likely 200 or below" in card["forecast"]["sentence_en"]


def test_shadow_forecasts_are_stored_but_not_exposed_on_the_card(monkeypatch):
    monkeypatch.setenv("FORECAST_MODE", "shadow")
    store = seeded_fresh_wait_store()
    forecast.run(store, NOW, lambda _series, _h: [(210, 220, 230)] * 3, mode="shadow")
    assert store.query("FCST#1")
    assert "forecast" not in service.build_card(store, 1, NOW)


def test_future_reading_grades_forecast_without_touching_stale_estimate_accuracy():
    store = seeded_fresh_wait_store()
    forecast.run(store, NOW, lambda _series, _h: [(180, 190, 200)] * 3, mode="on")
    before = service.accuracy(store)
    service.ingest(store, [rd(1, "Dwarka", 28.571, 77.072, NOW + H, 190)], {}, NOW + H)
    summary = forecast.accuracy(store)
    assert summary["graded"] == 1 and summary["hits"] == 1
    assert service.accuracy(store) == before


def test_flat_forecast_is_uncertain_not_a_claim_that_air_will_not_improve(monkeypatch):
    monkeypatch.setenv("FORECAST_MODE", "on")
    store = seeded_fresh_wait_store()
    forecast.run(store, NOW, lambda _series, _h: [(205, 220, 240)] * 3, mode="on")
    card = service.build_card(store, 1, NOW)
    assert "can't confidently predict" in card["forecast"]["sentence_en"]


def test_scoreboard_exposes_forecast_accuracy_only_when_the_feature_is_on(monkeypatch):
    store = seeded_fresh_wait_store()
    forecast.run(store, NOW, lambda _series, _h: [(180, 190, 200)] * 3, mode="shadow")
    monkeypatch.setenv("FORECAST_MODE", "shadow")
    assert "forecast_accuracy" not in service.scoreboard(store, [service.ist_date(NOW)])
    monkeypatch.setenv("FORECAST_MODE", "on")
    assert service.scoreboard(store, [service.ist_date(NOW)])["forecast_accuracy"]["graded"] == 0
