"""API routes on the in-memory store: who may hold, and the add-email-later flow."""
from handlers import api
from taaza.store import MemoryStore

from test_service import NOW, seed


def post(s, path, body, t=NOW):
    return api.route("POST", path, {}, body, s, t)


def test_fresh_station_cannot_be_held(monkeypatch):
    s = MemoryStore()
    seed(s)
    code, out = post(s, "/hold", {"uid": 2})  # Najafgarh is fresh
    assert code == 409


def test_card_reports_whether_email_is_configured(monkeypatch):
    s = MemoryStore()
    seed(s)
    monkeypatch.delenv("SES_SENDER", raising=False)
    assert api.route("GET", "/card", {"uid": "1"}, {}, s, NOW)[1]["email_enabled"] is False
    monkeypatch.setenv("SES_SENDER", "bot@example.org")
    assert api.route("GET", "/card", {"uid": "1"}, {}, s, NOW)[1]["email_enabled"] is True


def test_email_can_be_added_after_the_hold_and_is_never_echoed(monkeypatch):
    monkeypatch.setenv("SES_SENDER", "bot@example.org")
    s = MemoryStore()
    seed(s)
    code, hold = post(s, "/hold", {"uid": 1})
    assert code == 201 and hold["email_hint"] is None
    assert post(s, "/hold/email", {"id": hold["id"], "email": "not-an-email"})[0] == 400
    code, out = post(s, "/hold/email", {"id": hold["id"], "email": "runner@gmail.com"})
    assert code == 200 and out["email_hint"] == "ru…@gmail.com"
    assert "runner@gmail.com" not in str(out)


def test_email_is_ignored_when_ses_is_off(monkeypatch):
    monkeypatch.delenv("SES_SENDER", raising=False)
    s = MemoryStore()
    seed(s)
    code, hold = post(s, "/hold", {"uid": 1, "email": "runner@gmail.com"})
    assert code == 201 and hold["email_hint"] is None
