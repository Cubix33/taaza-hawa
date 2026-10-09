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


def test_a_wait_answer_says_when_to_look_again():
    s, c = card(2)  # fresh 230 -> WAIT
    assert c["answer"] == "WAIT"
    assert "Check again after the station's next number" in speech.spoken_text(c, "en")
    assert "अगला नंबर आने पर फिर देखें" in speech.spoken_text(c, "hi")


def test_every_spoken_answer_ends_with_the_whole_healthy_adults_line_even_for_long_names():
    s, c = card(1)
    c["name"] = "National Institute of Malaria Research, Sector 8, Dwarka, Delhi, Delhi, India"
    for uid_card in (c, card(2)[1]):
        en, hi = speech.spoken_text(uid_card, "en"), speech.spoken_text(uid_card, "hi")
        assert en.endswith("Set for healthy adults, not medical advice.")
        assert hi.endswith("यह सलाह स्वस्थ वयस्कों के लिए है, डॉक्टरी सलाह नहीं।")
        assert len(en) <= speech.MAX_CHARS and len(hi) <= speech.MAX_CHARS


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
