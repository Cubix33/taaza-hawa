from handlers import api
from taaza import explain
from taaza.store import MemoryStore
from test_service import NOW, seed


def fake(_):
    return {"mismatch_kind": {"value": "device_reading", "confidence": .9}, "source": {"value": "home_purifier", "confidence": .9}, "says_ugm3": {"value": True, "confidence": .9}, "indoors": {"value": True, "confidence": .9}, "indoor_smoke": {"value": True, "confidence": .9}, "fog_or_humid": {"value": False, "confidence": .9}}


def call(s, body, client=None):
    return api.route("POST", "/explain", {}, {"uid": 1, "lang": "en", **body}, s, NOW, jev_client=client)


def test_extracts_western_and_devanagari_numbers():
    assert explain.number("487") == 487 and explain.number("४८७") == 487


def test_no_key_uses_buttons_without_persisting_text(monkeypatch):
    monkeypatch.delenv("JEV_API_KEY", raising=False)
    s = MemoryStore(); seed(s)
    code, out = call(s, {"text": "my purifier says 487"})
    assert code == 200 and out["jev"] == "off" and {"source", "unit", "indoors"} <= set(out["needs_confirm"])
    assert "purifier says" not in str(s._d)


def test_typed_answer_converts_and_caches():
    s = MemoryStore(); seed(s); seen = []
    def client(text): seen.append(text); return fake(text)
    _, out = call(s, {"text": "purifier 487 incense"}, client)
    _, again = call(s, {"text": "purifier 487 incense"}, client)
    assert out["converted"]["band"] == "Severe" and any("Incense" in x for x in out["lines"])
    assert len(seen) == 1 and again["jev"] == "used"


def test_explicit_unit_overrides_typed_answer():
    s = MemoryStore(); seed(s)
    _, out = call(s, {"text": "487", "unit": "india_aqi"}, fake)
    assert out["converted"]["value"] == 487 and out["jev"] == "off"
