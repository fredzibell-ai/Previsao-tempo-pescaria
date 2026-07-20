from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import math
import asyncio
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta, date
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Mare Alta API")
api_router = APIRouter(prefix="/api")

# ----------------------- External API endpoints -----------------------
OPEN_METEO_FORECAST = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_MARINE = "https://marine-api.open-meteo.com/v1/marine"
OPEN_METEO_GEOCODE = "https://geocoding-api.open-meteo.com/v1/search"

# ----------------------- Preset fishing spots -----------------------
PRESET_SPOTS = [
    # Mar aberto / Litoral SP
    {"id": "sp-santos", "name": "Santos", "region": "Litoral SP", "category": "praia", "lat": -23.9608, "lon": -46.3336},
    {"id": "sp-guaruja", "name": "Guarujá", "region": "Litoral SP", "category": "praia", "lat": -23.9935, "lon": -46.2564},
    {"id": "sp-ubatuba", "name": "Ubatuba", "region": "Litoral SP", "category": "praia", "lat": -23.4336, "lon": -45.0838},
    {"id": "sp-ilhabela", "name": "Ilhabela", "region": "Litoral SP", "category": "mar-aberto", "lat": -23.7781, "lon": -45.3581},
    {"id": "sp-cananeia", "name": "Cananéia", "region": "Litoral SP", "category": "mar-aberto", "lat": -25.0148, "lon": -47.9268},
    # Bacia Amazônica
    {"id": "am-manaus", "name": "Manaus (Rio Negro)", "region": "Bacia Amazônica", "category": "rio", "lat": -3.1190, "lon": -60.0217},
    {"id": "pa-santarem", "name": "Santarém (Tapajós)", "region": "Bacia Amazônica", "category": "rio", "lat": -2.4431, "lon": -54.7083},
    {"id": "am-barcelos", "name": "Barcelos (Rio Negro)", "region": "Bacia Amazônica", "category": "rio", "lat": -0.9750, "lon": -62.9239},
    # Mato Grosso
    {"id": "mt-caceres", "name": "Cáceres (Rio Paraguai)", "region": "Mato Grosso", "category": "rio", "lat": -16.0708, "lon": -57.6819},
    {"id": "mt-barra-garcas", "name": "Barra do Garças (Rio Araguaia)", "region": "Mato Grosso", "category": "rio", "lat": -15.8901, "lon": -52.2569},
    # Barragens SP
    {"id": "sp-jurumirim", "name": "Represa de Jurumirim", "region": "Barragens SP", "category": "barragem", "lat": -23.2181, "lon": -49.2181},
    {"id": "sp-billings", "name": "Represa Billings", "region": "Barragens SP", "category": "barragem", "lat": -23.7800, "lon": -46.5500},
]


class SavedLocation(BaseModel):
    id: str
    name: str
    region: Optional[str] = ""
    category: Optional[str] = ""
    lat: float
    lon: float


# ----------------------- Astronomy helpers -----------------------
def moon_phase(dt: datetime):
    """Return moon phase info based on known new moon reference."""
    # Reference new moon: 2000-01-06 18:14 UTC
    ref = datetime(2000, 1, 6, 18, 14, tzinfo=timezone.utc)
    synodic = 29.53058867
    days = (dt - ref).total_seconds() / 86400.0
    age = days % synodic
    illumination = (1 - math.cos(2 * math.pi * age / synodic)) / 2
    if age < 1.84566:
        name = "Lua Nova"
    elif age < 5.53699:
        name = "Crescente Côncava"
    elif age < 9.22831:
        name = "Quarto Crescente"
    elif age < 12.91963:
        name = "Crescente Gibosa"
    elif age < 16.61096:
        name = "Lua Cheia"
    elif age < 20.30228:
        name = "Minguante Gibosa"
    elif age < 23.99361:
        name = "Quarto Minguante"
    elif age < 27.68493:
        name = "Minguante Côncava"
    else:
        name = "Lua Nova"
    return {
        "age_days": round(age, 1),
        "phase_name": name,
        "illumination": round(illumination * 100),
    }


def solunar_periods(dt: datetime, tz_offset_hours: float, sunrise: Optional[str], sunset: Optional[str]):
    """Approximate solunar major/minor periods.
    Major periods ~ lunar transit (overhead) and underfoot.
    Minor periods ~ moonrise/moonset (transit +/- 6h).
    """
    mp = moon_phase(dt)
    age = mp["age_days"]
    # Lunar transit shifts ~0.83h later per day after new moon; at new moon near local noon.
    transit_local = (12.0 + age * (24.0 / 29.53)) % 24.0
    underfoot = (transit_local + 12.0) % 24.0
    minor1 = (transit_local + 6.0) % 24.0
    minor2 = (transit_local - 6.0) % 24.0

    def hm(h):
        hh = int(h) % 24
        mm = int(round((h - int(h)) * 60)) % 60
        return f"{hh:02d}:{mm:02d}"

    majors = [
        {"start": hm(transit_local - 1), "end": hm(transit_local + 1), "label": "Lua no zênite"},
        {"start": hm(underfoot - 1), "end": hm(underfoot + 1), "label": "Lua no nadir"},
    ]
    minors = [
        {"start": hm(minor1 - 0.5), "end": hm(minor1 + 0.5), "label": "Nascer da lua"},
        {"start": hm(minor2 - 0.5), "end": hm(minor2 + 0.5), "label": "Pôr da lua"},
    ]
    # Simple activity rating: fuller / newer moon => higher peak activity
    illum = mp["illumination"]
    if illum < 10 or illum > 90:
        rating = "Excelente"
    elif illum < 30 or illum > 70:
        rating = "Boa"
    else:
        rating = "Moderada"
    return {"major": majors, "minor": minors, "rating": rating, "moon": mp}


def estimate_tides(dt: datetime, tz_offset_hours: float):
    """Estimate semi-diurnal tide highs/lows for the day (astronomical approximation).
    Clearly labelled as estimate on the frontend."""
    mp = moon_phase(dt)
    age = mp["age_days"]
    # Lunar transit as tide driver
    transit_local = (12.0 + age * (24.0 / 29.53)) % 24.0
    lunar_day = 24.84  # hours between successive moon transits
    step = lunar_day / 4.0  # ~6.21h between alternating high/low tides
    events = []
    # High tide near lunar transit; alternate high/low every ~6.21h across the day
    for k in range(-4, 5):
        t = transit_local + k * step
        if 0 <= t < 24:
            hh = int(t) % 24
            mm = int(round((t - int(t)) * 60)) % 60
            events.append({
                "time": f"{hh:02d}:{mm:02d}",
                "type": "alta" if k % 2 == 0 else "baixa",
                "hour": round(t, 2),
            })
    events.sort(key=lambda e: e["hour"])
    # Spring/neap indicator
    coeff = "Sizígia (marés fortes)" if (mp["illumination"] < 15 or mp["illumination"] > 85) else "Quadratura (marés fracas)"
    return {"events": events, "type_note": coeff}


def fishing_scores(daily, hourly):
    """Rank each forecast day for fishing quality using wind, pressure trend,
    moon phase and rain probability. Returns list + index of best day."""
    times = (daily or {}).get("time") or []
    if not times:
        return {"days": [], "best_index": None}

    wind_max = daily.get("wind_speed_10m_max") or []
    precip_prob = daily.get("precipitation_probability_max") or []

    # Per-date pressure trend from hourly surface_pressure
    press_by_date = {}
    h_time = (hourly or {}).get("time") or []
    h_press = (hourly or {}).get("surface_pressure") or []
    for t, p in zip(h_time, h_press):
        if p is None:
            continue
        d = t[:10]
        press_by_date.setdefault(d, []).append(p)

    def clamp(v, lo=0, hi=100):
        return max(lo, min(hi, v))

    results = []
    for i, day in enumerate(times):
        wind = wind_max[i] if i < len(wind_max) and wind_max[i] is not None else 20
        pprob = precip_prob[i] if i < len(precip_prob) and precip_prob[i] is not None else 0
        plist = press_by_date.get(day, [])
        p_trend = (plist[-1] - plist[0]) if len(plist) >= 2 else 0.0
        illum = moon_phase(datetime.strptime(day, "%Y-%m-%d").replace(tzinfo=timezone.utc))["illumination"]

        wind_score = clamp(100 - wind * 2.5)
        # Falling pressure favours fishing
        if p_trend <= -3:
            press_score = 100
        elif p_trend >= 4:
            press_score = 35
        else:
            press_score = clamp(70 - p_trend * 8)
        rain_score = clamp(100 - pprob)
        moon_score = clamp(60 + 40 * abs(illum - 50) / 50)

        total = round(wind_score * 0.35 + press_score * 0.30 + moon_score * 0.20 + rain_score * 0.15)
        if total >= 75:
            rating = "Excelente"
        elif total >= 60:
            rating = "Boa"
        elif total >= 45:
            rating = "Moderada"
        else:
            rating = "Fraca"

        reasons = []
        reasons.append("Vento fraco" if wind < 18 else ("Vento moderado" if wind < 30 else "Vento forte"))
        if p_trend <= -1.5:
            reasons.append("Pressão caindo")
        elif p_trend >= 1.5:
            reasons.append("Pressão subindo")
        else:
            reasons.append("Pressão estável")
        reasons.append("Lua favorável" if moon_score >= 80 else "Lua neutra")
        if pprob >= 70:
            reasons.append("Alta chance de chuva")
        elif pprob <= 20:
            reasons.append("Céu seco")

        results.append({
            "date": day,
            "score": total,
            "rating": rating,
            "reasons": reasons,
            "wind": round(wind),
            "pressure_trend": round(p_trend, 1),
            "precip_prob": round(pprob),
            "moon_illum": illum,
        })

    best_index = max(range(len(results)), key=lambda k: results[k]["score"]) if results else None
    return {"days": results, "best_index": best_index}



# ----------------------- API routes -----------------------
@api_router.get("/")
async def root():
    return {"message": "Mare Alta API online"}


@api_router.get("/presets")
async def get_presets():
    return {"spots": PRESET_SPOTS}


@api_router.get("/geocode")
async def geocode(q: str = Query(..., min_length=2)):
    params = {"name": q, "count": 8, "language": "pt", "format": "json"}
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            r = await c.get(OPEN_METEO_GEOCODE, params=params)
            r.raise_for_status()
            data = r.json()
    except Exception as e:
        logger.error(f"geocode error: {e}")
        raise HTTPException(status_code=502, detail="Erro ao buscar localidade")
    results = []
    for item in data.get("results", []) or []:
        parts = [p for p in [item.get("admin1"), item.get("country")] if p]
        results.append({
            "id": str(item.get("id")),
            "name": item.get("name"),
            "region": ", ".join(parts),
            "lat": item.get("latitude"),
            "lon": item.get("longitude"),
            "category": "busca",
        })
    return {"results": results}


@api_router.get("/weather")
async def weather(
    lat: float = Query(...),
    lon: float = Query(...),
    marine: bool = Query(True),
    start_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD"),
):
    """Aggregate weather + marine + astronomy for a coordinate.
    Optional start_date/end_date (YYYY-MM-DD) select a custom period."""
    forecast_params = {
        "latitude": lat,
        "longitude": lon,
        "current": ",".join([
            "temperature_2m", "relative_humidity_2m", "apparent_temperature",
            "surface_pressure", "pressure_msl", "wind_speed_10m",
            "wind_direction_10m", "wind_gusts_10m", "weather_code",
            "precipitation", "cloud_cover", "is_day",
        ]),
        "hourly": ",".join([
            "temperature_2m", "precipitation_probability", "precipitation",
            "surface_pressure", "wind_speed_10m", "wind_direction_10m",
            "wind_gusts_10m", "weather_code",
        ]),
        "daily": ",".join([
            "weather_code", "temperature_2m_max", "temperature_2m_min",
            "precipitation_sum", "precipitation_probability_max",
            "wind_speed_10m_max", "wind_gusts_10m_max", "wind_direction_10m_dominant",
            "sunrise", "sunset", "uv_index_max",
        ]),
        "timezone": "auto",
        "wind_speed_unit": "kmh",
        "forecast_days": 7,
    }

    result = {"lat": lat, "lon": lon}
    marine_params = {
        "latitude": lat,
        "longitude": lon,
        "current": "wave_height,wave_direction,wave_period,swell_wave_height,sea_surface_temperature",
        "hourly": "wave_height,wave_direction,wave_period,swell_wave_height,sea_surface_temperature",
        "timezone": "auto",
        "forecast_days": 3,
    }

    # Optional custom date range (clamped to Open-Meteo limits: ~92d past .. 16d future)
    period = None
    if start_date and end_date:
        try:
            today = date.today()
            sd = datetime.strptime(start_date, "%Y-%m-%d").date()
            ed = datetime.strptime(end_date, "%Y-%m-%d").date()
            if sd > ed:
                sd, ed = ed, sd
            lo = today - timedelta(days=92)
            hi = today + timedelta(days=15)
            sd = min(max(sd, lo), hi)
            ed = min(max(ed, lo), hi)
            s, e = sd.isoformat(), ed.isoformat()
            forecast_params.pop("forecast_days", None)
            forecast_params["start_date"] = s
            forecast_params["end_date"] = e
            marine_params.pop("forecast_days", None)
            marine_params["start_date"] = s
            marine_params["end_date"] = e
            period = {"start": s, "end": e, "days": (ed - sd).days + 1}
        except ValueError:
            raise HTTPException(status_code=400, detail="Datas inválidas (use YYYY-MM-DD)")

    try:
        async with httpx.AsyncClient(timeout=15) as c:
            tasks = [c.get(OPEN_METEO_FORECAST, params=forecast_params)]
            if marine:
                tasks.append(c.get(OPEN_METEO_MARINE, params=marine_params))
            responses = await asyncio.gather(*tasks, return_exceptions=True)

            fr = responses[0]
            if isinstance(fr, Exception):
                raise fr
            fr.raise_for_status()
            fdata = fr.json()
            result["current"] = fdata.get("current", {})
            result["current_units"] = fdata.get("current_units", {})
            result["hourly"] = fdata.get("hourly", {})
            result["daily"] = fdata.get("daily", {})
            result["timezone"] = fdata.get("timezone")
            result["utc_offset_seconds"] = fdata.get("utc_offset_seconds", 0)

            if marine:
                mr = responses[1]
                if not isinstance(mr, Exception) and mr.status_code == 200:
                    mdata = mr.json()
                    result["marine_current"] = mdata.get("current", {})
                    result["marine_hourly"] = mdata.get("hourly", {})
                    result["marine_available"] = bool(mdata.get("current"))
                else:
                    logger.warning(f"marine unavailable for {lat},{lon}")
                    result["marine_available"] = False
    except Exception as e:
        logger.error(f"forecast error: {e}")
        raise HTTPException(status_code=502, detail="Erro ao buscar previsão do tempo")

    now = datetime.now(timezone.utc)
    tz_offset = result.get("utc_offset_seconds", 0) / 3600.0
    daily = result.get("daily", {})
    sunrise = daily.get("sunrise", [None])[0] if daily.get("sunrise") else None
    sunset = daily.get("sunset", [None])[0] if daily.get("sunset") else None
    result["solunar"] = solunar_periods(now, tz_offset, sunrise, sunset)
    result["tides"] = estimate_tides(now, tz_offset)
    result["fishing"] = fishing_scores(result.get("daily", {}), result.get("hourly", {}))
    result["period"] = period
    return result


@api_router.get("/favorites", response_model=List[SavedLocation])
async def list_favorites():
    docs = await db.favorites.find({}, {"_id": 0}).to_list(200)
    return docs


@api_router.post("/favorites", response_model=SavedLocation)
async def add_favorite(loc: SavedLocation):
    await db.favorites.update_one({"id": loc.id}, {"$set": loc.model_dump()}, upsert=True)
    return loc


@api_router.delete("/favorites/{loc_id}")
async def delete_favorite(loc_id: str):
    await db.favorites.delete_one({"id": loc_id})
    return {"deleted": loc_id}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
