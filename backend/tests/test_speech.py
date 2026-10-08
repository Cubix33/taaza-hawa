import base64
import io

from handlers import api
from taaza import service, speech
from taaza.store import MemoryStore

from test_service import NOW, seed


class FakePolly:
    def __init__(self):
        self.calls = []

    def synthesize_speech(self, **kw):
        self.calls.append(kw)
        return {"AudioStream": io.BytesIO(b"ID3-fake-mp3")}


def card(uid):
    s = MemoryStore()
    seed(s)
    return s, service.build_card(s, uid, NOW)


def test_spoken_text_is_plain_words_and_has_no_symbols_polly_would_misread():
    s, c = card(1)  # stale -> interval
    for lang in ("hi", "en"):
        txt = speech.spoken_text(c, lang)
        assert str(c["interval"]["lo"]) in txt and str(c["interval"]["hi"]) in txt
        assert "–" not in txt and "<" not in txt and len(txt) <= speech.MAX_CHARS
    hi = speech.spoken_text(c, "hi")
    assert "सब-इंडेक्स" not in hi and "परखो" not in hi
    assert "31 घंटे" in hi and "31 hours" in speech.spoken_text(c, "en")


def test_fresh_station_says_when_the_number_was_measured():
    s, c = card(2)
    assert "measured" in speech.spoken_text(c, "en") and "नापा गया" in speech.spoken_text(c, "hi")


def test_synthesize_uses_kajal_neural_and_caches_by_text(monkeypatch):
    fake = FakePolly()
    monkeypatch.setattr(speech, "_client", lambda: fake)
    s = MemoryStore()
    a = speech.synthesize(s, "नमस्ते", "hi")
    b = speech.synthesize(s, "नमस्ते", "hi")
    assert len(fake.calls) == 1 and a["cached"] is False and b["cached"] is True
    k = fake.calls[0]
    assert (k["VoiceId"], k["Engine"], k["LanguageCode"], k["OutputFormat"]) == ("Kajal", "neural", "hi-IN", "mp3")
    assert base64.b64decode(a["audio"]) == b"ID3-fake-mp3" and a["audio"] == b["audio"]
    speech.synthesize(s, "hello", "en")
    assert fake.calls[1]["LanguageCode"] == "en-IN"


def test_speak_route_builds_text_server_side_and_degrades_to_503(monkeypatch):
    s = MemoryStore()
    seed(s)
    fake = FakePolly()
    monkeypatch.setattr(speech, "_client", lambda: fake)
    code, out = api.route("GET", "/speak", {"uid": "1", "lang": "en", "text": "ignored attacker text"}, {}, s, NOW)
    assert code == 200 and "attacker" not in fake.calls[0]["Text"] and "Dwarka" in fake.calls[0]["Text"]
    assert api.route("GET", "/speak", {"uid": "999"}, {}, s, NOW)[0] == 404

    def boom():
        raise RuntimeError("no credentials")

    monkeypatch.setattr(speech, "_client", boom)
    assert api.route("GET", "/speak", {"uid": "2", "lang": "hi"}, {}, s, NOW) == (503, {"error": "voice unavailable"})
