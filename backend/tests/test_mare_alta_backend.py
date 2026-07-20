"""Backend tests for Maré Alta - presets, geocode, weather, favorites."""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://tide-cast.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ----------------------- Health & Presets -----------------------
class TestHealth:
    def test_root(self, client):
        r = client.get(f"{API}/")
        assert r.status_code == 200
        assert "message" in r.json()


class TestPresets:
    def test_presets_returns_16(self, client):
        r = client.get(f"{API}/presets")
        assert r.status_code == 200
        data = r.json()
        assert "spots" in data
        spots = data["spots"]
        assert isinstance(spots, list)
        assert len(spots) == 16
        # validate schema of first entry
        for s in spots:
            for k in ("id", "name", "region", "category", "lat", "lon"):
                assert k in s, f"missing field {k} in preset"
            assert isinstance(s["lat"], (int, float))
            assert isinstance(s["lon"], (int, float))

    def test_presets_include_expected_regions(self, client):
        spots = client.get(f"{API}/presets").json()["spots"]
        regions = {s["region"] for s in spots}
        for expected in ("Litoral SP", "Bacia Amazônica", "Mato Grosso", "Barragens SP", "Santa Catarina", "Rio Grande do Sul"):
            assert expected in regions

    def test_presets_include_sc_and_rs_spots(self, client):
        spots = client.get(f"{API}/presets").json()["spots"]
        ids = {s["id"] for s in spots}
        # Santa Catarina
        for sid in ("sc-barra-do-sul", "sc-picarras", "sc-florianopolis"):
            assert sid in ids, f"missing SC preset {sid}"
        # Rio Grande do Sul
        assert "rs-balneario-mostardense" in ids
        names = {s["name"] for s in spots}
        for n in ("Barra do Sul", "Balneário Piçarras", "Florianópolis", "Balneário Mostardense"):
            assert n in names, f"missing preset name {n}"


# ----------------------- Geocode -----------------------
class TestGeocode:
    def test_geocode_santos(self, client):
        r = client.get(f"{API}/geocode", params={"q": "Santos"})
        assert r.status_code == 200
        data = r.json()
        assert "results" in data
        assert len(data["results"]) > 0
        first = data["results"][0]
        for k in ("id", "name", "region", "lat", "lon"):
            assert k in first
        assert isinstance(first["lat"], (int, float))
        assert isinstance(first["lon"], (int, float))

    def test_geocode_manaus(self, client):
        r = client.get(f"{API}/geocode", params={"q": "Manaus"})
        assert r.status_code == 200
        names = [x["name"].lower() for x in r.json()["results"]]
        assert any("manaus" in n for n in names)

    def test_geocode_min_length_validation(self, client):
        r = client.get(f"{API}/geocode", params={"q": "a"})
        assert r.status_code == 422  # min_length=2


# ----------------------- Weather -----------------------
class TestWeatherMarine:
    def test_weather_santos_marine(self, client):
        r = client.get(f"{API}/weather", params={"lat": -23.96, "lon": -46.33, "marine": "true"})
        assert r.status_code == 200
        d = r.json()
        # top-level
        for k in ("current", "hourly", "daily", "solunar", "tides"):
            assert k in d, f"missing {k}"
        cur = d["current"]
        for k in ("wind_speed_10m", "wind_direction_10m", "surface_pressure", "temperature_2m"):
            assert k in cur, f"missing current.{k}"
        # daily should have 7 days
        assert len(d["daily"]["time"]) == 7
        # solunar
        sol = d["solunar"]
        assert "major" in sol and len(sol["major"]) >= 1
        assert "minor" in sol and len(sol["minor"]) >= 1
        assert "rating" in sol
        assert "moon" in sol and "phase_name" in sol["moon"]
        assert "illumination" in sol["moon"]
        # tides
        tides = d["tides"]
        assert "events" in tides and len(tides["events"]) >= 3
        types = {e["type"] for e in tides["events"]}
        assert types.issubset({"alta", "baixa"})
        assert "type_note" in tides
        # marine
        assert d.get("marine_available") is True
        mc = d.get("marine_current", {})
        assert "wave_height" in mc
        assert "sea_surface_temperature" in mc


class TestWeatherRiver:
    def test_weather_manaus_no_marine(self, client):
        r = client.get(f"{API}/weather", params={"lat": -3.11, "lon": -60.02, "marine": "false"})
        assert r.status_code == 200
        d = r.json()
        # marine_available should be falsy since not requested
        assert not d.get("marine_available")
        # But weather, daily, solunar, tides should still be present
        assert "current" in d and "wind_speed_10m" in d["current"]
        assert len(d["daily"]["time"]) == 7
        assert "solunar" in d and "moon" in d["solunar"]
        assert "tides" in d and len(d["tides"]["events"]) >= 3


# ----------------------- Weather Date Range (NEW) -----------------------
class TestWeatherDateRange:
    def test_weather_with_range_14_days(self, client):
        # Use dates that are within Open-Meteo's allowed window (~today .. today+16)
        from datetime import date, timedelta
        today = date.today()
        s = today.isoformat()
        e = (today + timedelta(days=13)).isoformat()
        r = client.get(
            f"{API}/weather",
            params={"lat": -23.96, "lon": -46.33, "marine": "true", "start_date": s, "end_date": e},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert "period" in d and d["period"] is not None
        p = d["period"]
        assert p["start"] == s
        assert p["end"] == e
        assert p["days"] == 14
        # daily.time should have 14 entries
        assert len(d["daily"]["time"]) == 14
        assert d["daily"]["time"][0] == s
        assert d["daily"]["time"][-1] == e

    def test_weather_only_start_date_ignored(self, client):
        # With only start_date, period should be null and default 7-day forecast returned
        r = client.get(
            f"{API}/weather",
            params={"lat": -23.96, "lon": -46.33, "marine": "true", "start_date": "2026-07-20"},
        )
        assert r.status_code == 200
        d = r.json()
        assert d.get("period") is None
        assert len(d["daily"]["time"]) == 7

    def test_weather_start_after_end_swapped(self, client):
        from datetime import date, timedelta
        today = date.today()
        # start intentionally after end
        s = (today + timedelta(days=5)).isoformat()
        e = today.isoformat()
        r = client.get(
            f"{API}/weather",
            params={"lat": -23.96, "lon": -46.33, "marine": "true", "start_date": s, "end_date": e},
        )
        assert r.status_code == 200
        d = r.json()
        p = d["period"]
        assert p["start"] == today.isoformat()
        assert p["end"] == (today + timedelta(days=5)).isoformat()
        assert p["days"] == 6
        assert len(d["daily"]["time"]) == 6

    def test_weather_far_future_end_clamped(self, client):
        # end far in future should be clamped, not 500
        from datetime import date, timedelta
        today = date.today()
        s = today.isoformat()
        e_far = "2027-01-01"
        r = client.get(
            f"{API}/weather",
            params={"lat": -23.96, "lon": -46.33, "marine": "true", "start_date": s, "end_date": e_far},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        p = d["period"]
        # end should have been clamped to today+16 (or earlier)
        max_end = (today + timedelta(days=16)).isoformat()
        assert p["end"] <= max_end
        # daily.time count should equal (end - start).days + 1
        assert len(d["daily"]["time"]) == p["days"]
        # Should be at least a couple weeks
        assert p["days"] >= 15

    def test_weather_invalid_date_400(self, client):
        r = client.get(
            f"{API}/weather",
            params={"lat": -23.96, "lon": -46.33, "start_date": "20-07-2026", "end_date": "2026-08-02"},
        )
        assert r.status_code == 400


# ----------------------- Fishing scores (NEW) -----------------------
import re
HHMM_RE = re.compile(r"^\d{2}:\d{2}$")

VALID_RATINGS = {"Excelente", "Boa", "Moderada", "Fraca"}


def _assert_time_window(t, allowed_labels=None):
    for k in ("start", "end", "label"):
        assert k in t, f"time window missing {k}"
    assert HHMM_RE.match(t["start"]), f"invalid start {t['start']}"
    assert HHMM_RE.match(t["end"]), f"invalid end {t['end']}"
    # bounds
    for key in ("start", "end"):
        hh, mm = t[key].split(":")
        assert 0 <= int(hh) < 24
        assert 0 <= int(mm) < 60
    if allowed_labels is not None:
        assert t["label"] in allowed_labels, f"unexpected label {t['label']}"


MAJOR_LABELS = {"Lua no zênite", "Lua no nadir"}
MINOR_LABELS = {"Nascer da lua", "Pôr da lua"}


def _assert_fishing_shape(fishing, expected_days):
    assert fishing is not None, "fishing missing"
    assert "days" in fishing and "best_index" in fishing
    days = fishing["days"]
    assert isinstance(days, list)
    assert len(days) == expected_days
    for d in days:
        for k in ("date", "score", "rating", "reasons", "wind", "pressure_trend", "precip_prob", "moon_illum",
                 "best_times", "minor_times"):
            assert k in d, f"fishing.day missing key {k}"
        assert 0 <= d["score"] <= 100
        assert d["rating"] in VALID_RATINGS
        assert isinstance(d["reasons"], list) and len(d["reasons"]) >= 1
        # New: best_times (majors) & minor_times
        assert isinstance(d["best_times"], list) and len(d["best_times"]) == 2
        assert isinstance(d["minor_times"], list) and len(d["minor_times"]) == 2
        for t in d["best_times"]:
            _assert_time_window(t, MAJOR_LABELS)
        for t in d["minor_times"]:
            _assert_time_window(t, MINOR_LABELS)
    bi = fishing["best_index"]
    assert isinstance(bi, int)
    assert 0 <= bi < len(days)
    # best_index should point to the max score
    best_score = days[bi]["score"]
    assert best_score == max(x["score"] for x in days)


class TestFishing:
    def test_fishing_marine_default_7d(self, client):
        r = client.get(f"{API}/weather", params={"lat": -23.96, "lon": -46.33, "marine": "true"})
        assert r.status_code == 200
        d = r.json()
        assert len(d["daily"]["time"]) == 7
        _assert_fishing_shape(d.get("fishing"), 7)
        # dates in fishing.days must match daily.time in order
        assert [f["date"] for f in d["fishing"]["days"]] == d["daily"]["time"]

    def test_fishing_river_no_marine(self, client):
        r = client.get(f"{API}/weather", params={"lat": -3.11, "lon": -60.02, "marine": "false"})
        assert r.status_code == 200
        d = r.json()
        assert len(d["daily"]["time"]) == 7
        _assert_fishing_shape(d.get("fishing"), 7)

    def test_fishing_with_14_day_range(self, client):
        from datetime import date, timedelta
        today = date.today()
        s = today.isoformat()
        e = (today + timedelta(days=13)).isoformat()
        r = client.get(
            f"{API}/weather",
            params={"lat": -23.96, "lon": -46.33, "marine": "true", "start_date": s, "end_date": e},
        )
        assert r.status_code == 200
        d = r.json()
        assert len(d["daily"]["time"]) == 14
        _assert_fishing_shape(d.get("fishing"), 14)
        assert d["fishing"]["days"][0]["date"] == s
        assert d["fishing"]["days"][-1]["date"] == e

    def test_fishing_best_times_balneario_mostardense_marine(self, client):
        """NEW: Best/minor times must exist for the default location (RS coords)."""
        r = client.get(f"{API}/weather", params={"lat": -31.2394, "lon": -50.9053, "marine": "true"})
        assert r.status_code == 200
        d = r.json()
        _assert_fishing_shape(d.get("fishing"), 7)
        # Sanity: solunar 'major' labels should match the day labels
        for day in d["fishing"]["days"]:
            labels_major = {t["label"] for t in day["best_times"]}
            labels_minor = {t["label"] for t in day["minor_times"]}
            assert labels_major.issubset(MAJOR_LABELS)
            assert labels_minor.issubset(MINOR_LABELS)

    def test_fishing_best_times_river_manaus(self, client):
        """NEW: Best/minor times must exist for a river (non-marine) point."""
        r = client.get(f"{API}/weather", params={"lat": -3.11, "lon": -60.02, "marine": "false"})
        assert r.status_code == 200
        d = r.json()
        _assert_fishing_shape(d.get("fishing"), 7)
        # every day has 2 majors + 2 minors
        for day in d["fishing"]["days"]:
            assert len(day["best_times"]) == 2
            assert len(day["minor_times"]) == 2


# ----------------------- Daily Details (NEW) -----------------------
TIDE_TYPES = {"alta", "baixa"}


def _assert_daily_detail_shape(entry, expect_marine_ok=True):
    for k in ("date", "marine", "solunar", "tides"):
        assert k in entry, f"daily_details entry missing {k}"
    # date YYYY-MM-DD
    assert re.match(r"^\d{4}-\d{2}-\d{2}$", entry["date"])

    # marine (dict) or None
    m = entry["marine"]
    if expect_marine_ok:
        assert m is not None, "expected marine dict, got None"
        for k in ("wave_height", "wave_period", "wave_direction",
                 "swell_wave_height", "sea_surface_temperature"):
            assert k in m, f"marine missing {k}"
        # wave_height should be numeric (or None if truly missing)
        if m["wave_height"] is not None:
            assert isinstance(m["wave_height"], (int, float))
            assert m["wave_height"] >= 0
    else:
        assert m is None, "expected marine=None for river/non-marine point"

    # solunar
    sol = entry["solunar"]
    for k in ("major", "minor", "rating", "moon"):
        assert k in sol, f"solunar missing {k}"
    assert sol["rating"] in VALID_RATINGS
    assert isinstance(sol["major"], list) and len(sol["major"]) == 2
    assert isinstance(sol["minor"], list) and len(sol["minor"]) == 2
    for p in sol["major"]:
        _assert_time_window(p, MAJOR_LABELS)
    for p in sol["minor"]:
        _assert_time_window(p, MINOR_LABELS)
    moon = sol["moon"]
    assert "phase_name" in moon and isinstance(moon["phase_name"], str)
    assert "illumination" in moon
    assert 0 <= moon["illumination"] <= 100

    # tides
    tides = entry["tides"]
    assert "events" in tides
    events = tides["events"]
    # Spec says 4 alternating events but real astronomical estimator produces 3-4 depending on transit hour
    assert isinstance(events, list) and 3 <= len(events) <= 4
    types = [e["type"] for e in events]
    assert set(types).issubset(TIDE_TYPES)
    # alternating alta/baixa
    for i in range(1, len(events)):
        assert events[i]["type"] != events[i - 1]["type"], "tide types should alternate"
    for e in events:
        assert "time" in e and HHMM_RE.match(e["time"]), f"invalid tide time {e.get('time')}"
    assert "type_note" in tides and isinstance(tides["type_note"], str)


class TestDailyDetails:
    def test_daily_details_marine_default_7d(self, client):
        """Default 7-day forecast for a marine point (Balneário Mostardense)."""
        r = client.get(f"{API}/weather", params={"lat": -31.2394, "lon": -50.9053, "marine": "true"})
        assert r.status_code == 200
        d = r.json()
        assert "daily_details" in d
        details = d["daily_details"]
        assert isinstance(details, list)
        assert len(details) == 7
        # Aligned with daily.time
        assert [x["date"] for x in details] == d["daily"]["time"]
        for entry in details:
            _assert_daily_detail_shape(entry, expect_marine_ok=True)

    def test_daily_details_marine_8_day_range(self, client):
        """Custom date range must produce exactly (end-start+1) entries."""
        from datetime import date, timedelta
        today = date.today()
        s = today.isoformat()
        e = (today + timedelta(days=7)).isoformat()
        r = client.get(
            f"{API}/weather",
            params={"lat": -31.2394, "lon": -50.9053, "marine": "true",
                    "start_date": s, "end_date": e},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        details = d["daily_details"]
        assert len(details) == 8
        assert details[0]["date"] == s
        assert details[-1]["date"] == e
        for entry in details:
            _assert_daily_detail_shape(entry, expect_marine_ok=True)

    def test_daily_details_river_no_marine(self, client):
        """River point (Manaus) — marine=None but solunar+tides still present per day."""
        r = client.get(f"{API}/weather", params={"lat": -3.11, "lon": -60.02, "marine": "false"})
        assert r.status_code == 200
        d = r.json()
        details = d["daily_details"]
        assert isinstance(details, list) and len(details) == 7
        for entry in details:
            _assert_daily_detail_shape(entry, expect_marine_ok=False)

    def test_daily_details_14_day_range_marine(self, client):
        """14-day range: daily_details aligns with daily.time (14 entries)."""
        from datetime import date, timedelta
        today = date.today()
        s = today.isoformat()
        e = (today + timedelta(days=13)).isoformat()
        r = client.get(
            f"{API}/weather",
            params={"lat": -23.96, "lon": -46.33, "marine": "true",
                    "start_date": s, "end_date": e},
        )
        assert r.status_code == 200, r.text
        d = r.json()
        details = d["daily_details"]
        assert len(details) == 14
        assert [x["date"] for x in details] == d["daily"]["time"]
        # First few entries should have real marine data
        with_marine = sum(1 for x in details if x["marine"] is not None)
        assert with_marine >= 7, f"expected most days to have marine data (Santos), got {with_marine}"


# ----------------------- Favorites CRUD -----------------------
class TestFavorites:
    fav_id = "TEST_fav_santos_zzz"

    def test_cleanup_before(self, client):
        client.delete(f"{API}/favorites/{self.fav_id}")

    def test_add_favorite(self, client):
        payload = {
            "id": self.fav_id,
            "name": "TEST Santos",
            "region": "Litoral SP",
            "category": "praia",
            "lat": -23.96,
            "lon": -46.33,
        }
        r = client.post(f"{API}/favorites", json=payload)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == self.fav_id
        assert data["name"] == "TEST Santos"
        assert data["lat"] == -23.96

    def test_list_contains_favorite(self, client):
        r = client.get(f"{API}/favorites")
        assert r.status_code == 200
        favs = r.json()
        assert isinstance(favs, list)
        assert any(f["id"] == self.fav_id for f in favs)
        # ensure no mongo _id leaks
        for f in favs:
            assert "_id" not in f

    def test_delete_favorite(self, client):
        r = client.delete(f"{API}/favorites/{self.fav_id}")
        assert r.status_code == 200
        assert r.json().get("deleted") == self.fav_id

        # verify removed
        favs = client.get(f"{API}/favorites").json()
        assert not any(f["id"] == self.fav_id for f in favs)
