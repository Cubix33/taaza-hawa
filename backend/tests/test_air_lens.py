from taaza import service
from taaza.estimate import Neighbour, estimate
from taaza.store import MemoryStore
from test_service import NOW, seed


def test_evidence_uses_the_exact_selected_inputs():
    candidates = [
        Neighbour(1, "old nearby", 28.6, 77.2, 480, 181),
        Neighbour(2, "first", 28.61, 77.2, 100, 10),
        Neighbour(3, "second", 28.62, 77.2, 200, 20),
        Neighbour(4, "third", 28.63, 77.2, 300, 30),
        Neighbour(5, "too far", 28.8, 77.2, 400, 10),
    ]
    result = estimate(28.6, 77.2, candidates, None, {}, 4)
    evidence = result.evidence
    assert [n["uid"] for n in evidence] == [2, 3, 4]
    assert [n["name"] for n in evidence] == result.neighbours
    assert abs(sum(n["idw_share"] for n in evidence) - 1) < 1e-6
    assert abs(sum(n["value"] * n["idw_share"] for n in evidence) - result.point) < 1e-4
    assert all(n["distance_km"] > 0 for n in evidence)


def test_degraded_estimate_has_no_decorative_neighbours():
    result = estimate(28.6, 77.2, [], None, {}, 4, last_value=180)
    assert result.evidence == []


def test_card_exposes_reading_provenance_and_station_pollutants():
    store = MemoryStore()
    seed(store)
    card = service.build_card(store, 1, NOW)
    evidence = card["evidence"]
    assert len(evidence["neighbours"]) == card["interval"]["n_neighbours"]
    for item in evidence["neighbours"]:
        reading = service.latest_reading(store, item["uid"])
        assert item["reading_ts"] == reading["ts"]
        assert item["value"] == reading["values"][card["pollutant"]]
    stations = service.station_list(store, NOW)
    assert stations[0]["values"] == {"pm10": 180}
    assert stations[0]["reading_ts"] == NOW - 31 * 3600
    assert service.build_card(store, 2, NOW)["evidence"]["neighbours"] == []
