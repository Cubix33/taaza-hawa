"""Bad-air plan for work teams and communities, the checklist, the crew page, and the action ledger."""
from handlers import api
from taaza import school
from taaza.store import MemoryStore

from test_school import MORNING, EARLY, post, get
from test_service import seed

DWARKA = {"name": "Dwarka site", "uid": 1}       # 31 h old: planned on the top of its estimate
NAJAFGARH = {"name": "Najafgarh depot", "uid": 2}  # fresh, AQI 230 (Poor)


def work_team(s, **extra):
    body = {"name": "Metro Phase 4 crew", "kind": "work", "zones": [NAJAFGARH, DWARKA], "shift": [7, 19], **extra}
    code, out = post(s, "/school", body)
    assert code == 201, out
    return out, {"id": out["school"]["id"], "k": out["key"]}


def test_work_team_is_planned_on_its_worst_zone_with_shift_hours():
    s = MemoryStore()
    seed(s, MORNING)
    out, _ = work_team(s)
    day = out["today"]
    assert [z["name"] for z in day["zones"]] == ["Najafgarh depot", "Dwarka site"]
    assert day["level"] == max(z["level"] for z in day["zones"]) and day["level"] >= 2
    assert day["station"] == "Dwarka Sector 8"  # the worst zone decides the plan
    assert day["todo"] == ["brief", "less_strenuous", "breaks_in", "masks"] and day["plan"] is None
    assert out["school"]["kind"] == "work" and out["school"]["shift_h"] == 12
    assert [z["station"] for z in out["school"]["zones"]] == ["Najafgarh", "Dwarka Sector 8"]


def test_work_team_needs_a_zone_and_odd_shifts_fall_back():
    s = MemoryStore()
    seed(s, MORNING)
    assert post(s, "/school", {"name": "No zones", "kind": "work", "zones": []})[0] == 400
    out, _ = work_team(s, shift=[20, 6])
    assert out["school"]["shift"] == list(school.DEFAULT_SHIFT)


def test_community_plan_rows_and_checklist():
    s = MemoryStore()
    seed(s, MORNING)
    code, out = post(s, "/school", {"name": "Sector 7 RWA", "kind": "community", "uid": 2})
    assert code == 201
    day = out["today"]
    assert day["level"] == 2 and day["plan"] == {"events": "in", "walks": "limit", "sensitive": "in"}
    assert day["todo"] == ["share", "pause_events", "check_neighbours"]


def test_checklist_marks_actions_done_with_a_time_and_opening_counts_as_seen():
    s = MemoryStore()
    seed(s, MORNING)
    out, ident = work_team(s)
    date = out["today"]["date"]
    assert out["today"]["seen_ts"] == MORNING  # the plan was opened
    assert post(s, "/school/act", {**ident, "date": date, "act": "pe_in", "done": True})[0] == 404  # not a work action
    code, v = post(s, "/school/act", {**ident, "date": date, "act": "brief", "done": True}, t=MORNING + 600)
    assert code == 200 and v["today"]["acts"] == {"brief": MORNING + 600}
    post(s, "/school/act", {**ident, "date": date, "act": "brief", "done": True}, t=MORNING + 900)
    v = post(s, "/school/act", {**ident, "date": date, "act": "masks", "done": True}, t=MORNING + 900)[1]
    assert v["today"]["acts"]["brief"] == MORNING + 600  # marking again keeps the first time
    assert v["summary"]["bad_days"] == 1 and v["summary"]["acted"] == 1
    v = post(s, "/school/act", {**ident, "date": date, "act": "masks", "done": False})[1]
    assert set(v["today"]["acts"]) == {"brief"}


def test_crew_page_is_public_read_only_and_shows_no_key_or_email(monkeypatch):
    monkeypatch.setenv("SES_SENDER", "bot@example.org")
    monkeypatch.setattr(school, "send_confirm", lambda sc, tok: None)
    s = MemoryStore()
    seed(s, MORNING)
    out, ident = work_team(s, email="boss@site.in")
    code, page = api.route("GET", "/zone", {"t": out["school"]["pub"]}, {}, s, MORNING)
    assert code == 200 and page["name"] == "Metro Phase 4 crew" and page["shift_h"] == 12
    assert len(page["today"]["zones"]) == 2
    text = str(page)
    assert ident["k"] not in text and "boss@site.in" not in text and "bo…@" not in text
    assert api.route("GET", "/zone", {"t": "nope"}, {}, s, MORNING)[0] == 404
    post(s, "/school/delete", ident)
    assert api.route("GET", "/zone", {"t": out["school"]["pub"]}, {}, s, MORNING)[0] == 404


def test_changing_zones_makes_todays_plan_again():
    s = MemoryStore()
    seed(s, MORNING)
    out, ident = work_team(s)
    v = post(s, "/school/edit", {**ident, "zones": [NAJAFGARH]})[1]
    assert [z["name"] for z in v["today"]["zones"]] == ["Najafgarh depot"] and v["today"]["station"] == "Najafgarh"
    assert post(s, "/school/edit", {**ident, "zones": []})[0] == 400


def test_ledger_counts_warned_seen_acted_and_silent_without_names():
    s = MemoryStore()
    seed(s, MORNING)
    # acted: a work team that briefed its crew
    out, ident = work_team(s)
    post(s, "/school/act", {**ident, "date": out["today"]["date"], "act": "brief", "done": True})
    # seen only: a school whose plan was opened (registering opens it)
    post(s, "/school", {"name": "Seen School", "uid": 1})
    # no response: decided by the 06:30 job, never opened
    school.register(s, "Silent RWA", 2, EARLY, kind="community")
    school.morning(s, MORNING)
    # closed: no school that day, not counted
    _, closed = post(s, "/school", {"name": "Closed School", "uid": 1})
    post(s, "/school/log", {"id": closed["school"]["id"], "k": closed["key"], "date": closed["today"]["date"], "action": "closed"})
    code, board = api.route("GET", "/scoreboard", {}, {}, s, MORNING)
    led = board["ledger"]
    assert led["total"] == {"warned": 3, "seen": 2, "acted": 1, "no_response": 1}
    assert led["by_kind"]["work"]["acted"] == 1 and led["by_kind"]["community"]["no_response"] == 1
    assert led["top_actions"] == [{"act": "brief", "n": 1}]
    assert "Silent RWA" not in str(led) and "Metro" not in str(led)


def test_work_email_lists_zones_hours_checklist_and_never_claims_a_dose():
    s = MemoryStore()
    seed(s, MORNING)
    out, ident = work_team(s, lang="en")
    org = school.authorize(s, ident["id"], ident["k"])
    day = school.ensure_day(s, org, MORNING)
    subject, body = school.plan_text(org, day)
    assert subject.startswith("Metro Phase 4 crew: ")
    assert "Najafgarh depot: Poor" in body and "Dwarka site:" in body
    assert "outside about 12 h" in body and "Brief the crew" in body
    assert "not anyone's measured dose" in body
    for banned in ("your dose is", "inhaled", "you breathed"):
        assert banned not in body.lower()


def test_old_schools_without_a_kind_still_work():
    s = MemoryStore()
    seed(s, MORNING)
    org = {"id": "legacy01", "key": "k" * 24, "name": "Legacy School", "uid": 1, "lang": "en", "created_ts": MORNING - 86400 * 3}
    s.put("SCHOOL", "legacy01", org)
    code, v = get(s, {"id": "legacy01", "k": "k" * 24})
    assert code == 200 and v["school"]["kind"] == "school" and v["today"]["plan"]["assembly"] in ("in", "out", "limit")
    assert v["today"]["todo"][0] == "inhalers"
