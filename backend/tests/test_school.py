"""School mode: register, the 06:30 plan, the action log, grading, email confirmation."""
from datetime import datetime

from handlers import api
from taaza import school, service
from taaza.store import MemoryStore

from test_service import NOW, H, seed

# NOW is 19:43 IST; MORNING is the next day's 07:00 IST (after the 06:30 decision), and the
# usual fixture (Dwarka 31 h old, three fresh neighbours) is seeded at MORNING
MORNING = NOW + 11 * H + 1000
assert datetime.fromtimestamp(MORNING, service.IST).strftime("%H:%M") == "07:00"
EARLY = MORNING - H  # 06:00 IST, before the decision


def post(s, path, body, t=MORNING):
    return api.route("POST", path, {}, body, s, t)


def get(s, q, t=MORNING):
    return api.route("GET", "/school", q, {}, s, t)


def test_plan_table_follows_the_public_bands():
    assert school.plan(school.level_for(80)) == {"assembly": "out", "pe": "out", "recess": "out", "sensitive": "out"}
    assert school.plan(school.level_for(150))["sensitive"] == "limit"
    assert school.plan(school.level_for(250)) == {"assembly": "in", "pe": "in", "recess": "limit", "sensitive": "in"}
    assert set(school.plan(school.level_for(350)).values()) == {"in"}
    assert school.plan(None) is None


def test_register_decides_today_on_the_top_of_the_estimate():
    s = MemoryStore()
    seed(s, MORNING)
    code, out = post(s, "/school", {"name": "  Govt  Girls School, Dwarka ", "uid": 1, "lang": "en"})
    assert code == 201 and out["key"] and out["school"]["name"] == "Govt Girls School, Dwarka"
    day = out["today"]
    assert day["basis"]["state"] == "stale" and day["basis"]["lo"] < day["basis"]["hi"]
    assert day["level"] == school.level_for(day["basis"]["hi"])
    assert out["school"]["station"] == "Dwarka Sector 8"


def test_a_plan_made_at_night_is_made_again_at_0630_and_the_key_is_required():
    s = MemoryStore()
    seed(s, MORNING)
    code, out = post(s, "/school", {"name": "Early School", "uid": 2}, t=EARLY)
    assert code == 201 and out["today"]["early"] is True and out["today"]["decided_ts"] == EARLY
    assert get(s, {"id": out["school"]["id"], "k": "wrong"})[0] == 404
    code, later = get(s, {"id": out["school"]["id"], "k": out["key"]})  # 07:00
    assert code == 200 and later["today"]["decided_ts"] == MORNING and not later["today"]["early"]
    assert later["today"]["basis"]["state"] == "fresh"


def test_an_early_plan_someone_already_acted_on_is_kept():
    s = MemoryStore()
    seed(s, MORNING)
    _, out = post(s, "/school", {"name": "Busy School", "uid": 1}, t=EARLY)
    ident = {"id": out["school"]["id"], "k": out["key"]}
    post(s, "/school/act", {**ident, "date": out["today"]["date"], "act": "inhalers", "done": True}, t=EARLY + 60)
    later = get(s, ident)[1]
    assert later["today"]["decided_ts"] == EARLY and later["today"]["acts"]["inhalers"] == EARLY + 60


def test_tidy_deletes_old_days_and_plans_nobody_opens_once_a_day():
    s = MemoryStore()
    seed(s, MORNING)
    _, used = post(s, "/school", {"name": "Used School", "uid": 1}, t=MORNING)
    _, idle = post(s, "/school", {"name": "Idle School", "uid": 1}, t=MORNING)
    used_id, idle_id = used["school"]["id"], idle["school"]["id"]
    s.put(f"SDAY#{used_id}", "2026-01-01", {"date": "2026-01-01", "level": 2, "basis": {"state": "fresh"}})
    later = MORNING + 50 * 86400
    get(s, {"id": used_id, "k": used["key"]}, t=later - 86400)  # opened recently: kept
    assert school.tidy(s, later) == {"plans": 1, "days": 1}
    assert s.get("SCHOOL", idle_id) is None and s.get("SCHOOL", used_id)
    assert s.get(f"SDAY#{used_id}", "2026-01-01") is None
    assert school.tidy(s, later + 60) == {"plans": 0, "days": 0}  # once a day


def test_the_plan_is_decided_once_and_kept_for_the_day():
    s = MemoryStore()
    seed(s, MORNING)
    _, out = post(s, "/school", {"name": "Kept School", "uid": 1})
    q = {"id": out["school"]["id"], "k": out["key"]}
    first = out["today"]["decided_ts"]
    assert get(s, q, t=MORNING + 3 * H)[1]["today"]["decided_ts"] == first


def test_action_log_and_summary():
    s = MemoryStore()
    seed(s, MORNING)
    _, out = post(s, "/school", {"name": "Log School", "uid": 1})
    ident = {"id": out["school"]["id"], "k": out["key"]}
    date = out["today"]["date"]
    assert post(s, "/school/log", {**ident, "date": date, "action": "maybe"})[0] == 400
    assert post(s, "/school/log", {**ident, "date": "1999-01-01", "action": "followed"})[0] == 404
    code, v = post(s, "/school/log", {**ident, "date": date, "action": "followed"})
    assert code == 200 and v["today"]["action"] == "followed"
    if v["today"]["level"] >= 2:
        assert v["summary"]["bad_days"] == 1 and v["summary"]["followed"] == 1
    code, v = post(s, "/school/log", {**ident, "date": date, "action": None})
    assert v["today"]["action"] is None


def test_estimate_based_plan_is_graded_by_the_same_morning_promise():
    s = MemoryStore()
    seed(s, MORNING)
    sc, _ = school.register(s, "Graded School", 1, MORNING)
    service.morning_predictions(s, MORNING)
    school.morning(s, MORNING)
    # Dwarka reports again later that morning
    from test_service import rd
    service.ingest(s, [rd(1, "Dwarka Sector 8", 28.5710, 77.0720, MORNING + H, 235)], {}, MORNING + H + 60)
    v = school.view(s, sc, MORNING + 2 * H)
    assert v["today"]["grade"]["status"] in ("HIT", "MISSED") and v["today"]["grade"]["actual"] == 235
    assert v["summary"]["est_graded"] == 1


def test_morning_emails_only_confirmed_contacts_once(monkeypatch):
    monkeypatch.setenv("SES_SENDER", "bot@example.org")
    sent_confirm = []
    monkeypatch.setattr(school, "send_confirm", lambda sc, tok: sent_confirm.append(tok))
    s = MemoryStore()
    seed(s, MORNING)
    code, out = post(s, "/school", {"name": "Mail School", "uid": 1, "email": "head@school.in"}, t=EARLY)
    assert code == 201 and out["school"]["email_hint"] == "he…@school.in" and not out["school"]["email_confirmed"]
    assert "head@school.in" not in str(out) and len(sent_confirm) == 1
    sent = []
    send = lambda sc, day: sent.append(sc["id"])  # noqa: E731
    school.morning(s, MORNING, send)
    assert sent == []  # not confirmed yet
    ident = {"id": out["school"]["id"], "k": out["key"]}
    assert post(s, "/school/confirm", {**ident, "token": "nope"})[0] == 409
    code, v = post(s, "/school/confirm", {**ident, "token": sent_confirm[0]})
    assert code == 200 and v["school"]["email_confirmed"]
    s.delete(f"SDAY#{ident['id']}", service.ist_date(MORNING))  # a fresh day for the next run
    school.morning(s, MORNING, send)
    school.morning(s, MORNING + 60, send)
    assert sent == [ident["id"]]
    # no "morning" email after 10:00 IST
    s.delete(f"SDAY#{ident['id']}", service.ist_date(MORNING))
    school.morning(s, MORNING + 4 * H, send)
    assert sent == [ident["id"]]


def test_changing_the_address_needs_a_new_confirmation_and_delete_removes_everything(monkeypatch):
    monkeypatch.setenv("SES_SENDER", "bot@example.org")
    monkeypatch.setattr(school, "send_confirm", lambda sc, tok: None)
    s = MemoryStore()
    seed(s, MORNING)
    _, out = post(s, "/school", {"name": "Edit School", "uid": 1})
    ident = {"id": out["school"]["id"], "k": out["key"]}
    assert post(s, "/school/edit", {**ident, "email": "bad"})[0] == 400
    assert post(s, "/school/edit", {**ident, "uid": 999})[0] == 404
    code, v = post(s, "/school/edit", {**ident, "email": "pe@school.in", "uid": 2, "name": "Edited"})
    assert code == 200 and v["school"]["uid"] == 2 and v["school"]["name"] == "Edited"
    assert v["school"]["email_hint"] and not v["school"]["email_confirmed"]
    assert post(s, "/school/edit", {**ident, "email": ""})[1]["school"]["email_hint"] is None
    assert post(s, "/school/delete", ident) == (200, {"deleted": True})
    assert get(s, ident)[0] == 404 and s.query(f"SDAY#{ident['id']}") == []


def test_email_text_carries_the_plan_and_basis():
    s = MemoryStore()
    seed(s, MORNING)
    sc, _ = school.register(s, "Text School", 1, MORNING, lang="en")
    day = school.ensure_day(s, sc, MORNING)
    subject, body = school.plan_text(sc, day)
    assert subject.startswith("Text School: ")
    assert "Morning assembly:" in body and "31 hours" in body and "probably" in body
    for banned in ("dark", "tamper", "true aqi"):
        assert banned not in body.lower()


def test_place_search_prefers_amazon_location_falls_back_and_caches(monkeypatch):
    from taaza import places
    calls = []

    def amazon(q):
        calls.append(q)
        raise RuntimeError("no credentials")
    monkeypatch.setattr(places, "_amazon", amazon)
    monkeypatch.setattr(places, "_photon", lambda q: [
        {"name": "Hostel", "address": "", "lat": 28.6, "lon": 77.1, "school": False},
        {"name": "Sarvodaya Kanya Vidyalaya", "address": "Sector 7, Dwarka", "lat": 28.588, "lon": 77.068, "school": True}])
    s = MemoryStore()
    assert api.route("GET", "/places", {"q": "sa"}, {}, s, MORNING)[1]["results"] == []
    code, out = api.route("GET", "/places", {"q": "Sarvodaya  dwarka"}, {}, s, MORNING)
    assert code == 200 and out["source"] == "OpenStreetMap" and out["results"][0]["school"] is True
    api.route("GET", "/places", {"q": "sarvodaya dwarka"}, {}, s, MORNING)
    assert calls == ["Sarvodaya dwarka"]  # second, same query (any case) is served from the cache


def test_a_school_found_on_the_map_keeps_its_place_and_distance():
    s = MemoryStore()
    seed(s, MORNING)
    place = {"lat": 28.588, "lon": 77.068, "address": "Sector 7, Dwarka"}
    code, out = post(s, "/school", {"name": "Mapped School", "uid": 1, "place": place})
    assert code == 201 and out["school"]["address"] == "Sector 7, Dwarka"
    assert 1.5 < out["school"]["station_km"] < 2.5
    # a position outside Delhi NCR is ignored, not stored
    code, out = post(s, "/school", {"name": "Far School", "uid": 1, "place": {"lat": 19.07, "lon": 72.87}})
    assert code == 201 and out["school"]["station_km"] is None


def test_changing_school_moves_the_map_position_and_remakes_todays_plan():
    s = MemoryStore()
    seed(s, MORNING)
    place = {"lat": 28.588, "lon": 77.068, "address": "Sector 7, Dwarka"}
    _, out = post(s, "/school", {"name": "Old School", "uid": 1, "place": place})
    ident = {"id": out["school"]["id"], "k": out["key"]}
    date = out["today"]["date"]
    post(s, "/school/log", {**ident, "date": date, "action": "followed"})
    new_place = {"lat": 28.6, "lon": 76.99, "address": "Najafgarh Road"}
    code, v = post(s, "/school/edit", {**ident, "name": "New School", "uid": 2, "place": new_place})
    assert code == 200 and v["school"]["name"] == "New School" and v["school"]["address"] == "Najafgarh Road"
    assert v["school"]["station"] == "Najafgarh" and v["school"]["place"]["lat"] == 28.6
    assert v["today"]["station"] == "Najafgarh" and v["today"].get("action") is None  # plan made again, log reset
    # the same station again keeps the plan and its log
    post(s, "/school/log", {**ident, "date": date, "action": "outdoor"})
    code, v = post(s, "/school/edit", {**ident, "name": "New School", "uid": 2})
    assert v["today"]["action"] == "outdoor" and v["school"]["address"] == "Najafgarh Road"  # no "place" key: unchanged
    code, v = post(s, "/school/edit", {**ident, "place": None})
    assert v["school"]["address"] is None and v["school"]["station_km"] is None
    assert post(s, "/school/edit", {**ident, "place": {"lat": 19.0, "lon": 72.8}})[1]["school"]["address"] is None  # outside NCR
