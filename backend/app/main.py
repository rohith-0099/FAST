"""
FAST (Fuel-Aware Smart Travel) — FastAPI backend.

Provides route planning with ML-based fuel consumption prediction.
"""

from contextlib import asynccontextmanager
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import init_db, save_trip, get_trips
from ml.model import predict_fuel

# ------------------------------------------------------------------
# Constants
# ------------------------------------------------------------------
FUEL_PRICE_INR_PER_LITRE = 105.0
OSRM_BASE = "https://router.project-osrm.org/route/v1/driving"
OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"

# Keywords that signal highway-class roads
HIGHWAY_KEYWORDS = {"highway", "expressway", "motorway", "nh", "national highway", "freeway", "interstate"}
URBAN_KEYWORDS = {"street", "road", "avenue", "lane", "boulevard", "circle", "marg", "nagar"}


# ------------------------------------------------------------------
# Pydantic models
# ------------------------------------------------------------------
class RouteRequest(BaseModel):
    source_lat: float
    source_lng: float
    dest_lat: float
    dest_lng: float
    vehicle_type: str = "car"
    mileage_kmpl: float = 15.0


class TripSave(BaseModel):
    source_name: Optional[str] = ""
    dest_name: Optional[str] = ""
    source_lat: float
    source_lng: float
    dest_lat: float
    dest_lng: float
    vehicle_type: str = "car"
    mileage: float = 15.0
    distance_km: float = 0.0
    fuel_litres: float = 0.0
    route_name: Optional[str] = ""


# ------------------------------------------------------------------
# App lifespan
# ------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="FAST API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------------------------------------------------
# Helpers
# ------------------------------------------------------------------
def _classify_road_type(steps: list[dict]) -> str:
    """
    Analyse OSRM route steps to determine road type.

    Returns one of: highway, urban, mixed.
    """
    highway_count = 0
    urban_count = 0
    total = 0

    for step in steps:
        name = (step.get("name") or "").lower()
        ref = (step.get("ref") or "").lower()
        combined = f"{name} {ref}"
        total += 1

        if any(kw in combined for kw in HIGHWAY_KEYWORDS):
            highway_count += 1
        elif any(kw in combined for kw in URBAN_KEYWORDS):
            urban_count += 1

    if total == 0:
        return "mixed"

    highway_ratio = highway_count / total
    urban_ratio = urban_count / total

    if highway_ratio >= 0.5:
        return "highway"
    if urban_ratio >= 0.5:
        return "urban"
    return "mixed"


def _estimate_stops_per_km(steps: list[dict], distance_km: float) -> float:
    """
    Estimate the number of stops per km from OSRM steps.

    Each step roughly corresponds to a manoeuvre/turn/intersection.
    """
    if distance_km <= 0:
        return 0.0
    # Each step is a manoeuvre; subtract 2 for depart + arrive
    num_manoeuvres = max(len(steps) - 2, 0)
    return round(num_manoeuvres / distance_km, 4)


async def _fetch_routes(client: httpx.AsyncClient, req: RouteRequest) -> dict:
    """Call the OSRM public routing API."""
    url = (
        f"{OSRM_BASE}/{req.source_lng},{req.source_lat}"
        f";{req.dest_lng},{req.dest_lat}"
        f"?overview=full&geometries=geojson&alternatives=3&steps=true"
    )
    resp = await client.get(url, timeout=15.0)
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=f"OSRM routing service returned status {resp.status_code}",
        )
    data = resp.json()
    if data.get("code") != "Ok":
        raise HTTPException(
            status_code=502,
            detail=f"OSRM error: {data.get('message', 'Unknown error')}",
        )
    return data


async def _fetch_weather(client: httpx.AsyncClient, lat: float, lng: float) -> dict:
    """Fetch current weather from Open-Meteo."""
    url = (
        f"{OPEN_METEO_BASE}?latitude={lat}&longitude={lng}"
        f"&current=temperature_2m,wind_speed_10m,precipitation"
    )
    try:
        resp = await client.get(url, timeout=10.0)
        if resp.status_code == 200:
            current = resp.json().get("current", {})
            return {
                "temperature_c": current.get("temperature_2m", 25.0),
                "wind_speed_kmh": current.get("wind_speed_10m", 10.0),
                "precipitation_mm": current.get("precipitation", 0.0),
            }
    except Exception:
        pass
    # Fallback defaults if weather API is unreachable
    return {"temperature_c": 25.0, "wind_speed_kmh": 10.0, "precipitation_mm": 0.0}


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------
@app.post("/api/routes")
async def get_routes(req: RouteRequest):
    """Plan routes and predict fuel consumption for each alternative."""
    async with httpx.AsyncClient() as client:
        osrm_data = await _fetch_routes(client, req)
        weather = await _fetch_weather(client, req.source_lat, req.source_lng)

    routes_out = []

    for idx, route in enumerate(osrm_data.get("routes", [])):
        distance_m = route.get("distance", 0)
        duration_s = route.get("duration", 0)
        distance_km = round(distance_m / 1000.0, 2)
        duration_min = round(duration_s / 60.0, 2)

        avg_speed_kmh = round(distance_km / (duration_min / 60.0), 2) if duration_min > 0 else 30.0

        geometry = route.get("geometry", {})

        # Collect all steps from all legs
        all_steps = []
        for leg in route.get("legs", []):
            all_steps.extend(leg.get("steps", []))

        summary = route.get("legs", [{}])[0].get("summary", "") if route.get("legs") else ""

        road_type = _classify_road_type(all_steps)
        stops_per_km = _estimate_stops_per_km(all_steps, distance_km)

        # ML prediction
        try:
            fuel_litres = predict_fuel(
                distance_km=distance_km,
                avg_speed_kmh=avg_speed_kmh,
                vehicle_type=req.vehicle_type,
                vehicle_mileage_kmpl=req.mileage_kmpl,
                temperature_c=weather["temperature_c"],
                wind_speed_kmh=weather["wind_speed_kmh"],
                precipitation_mm=weather["precipitation_mm"],
                road_type=road_type,
                num_stops_per_km=stops_per_km,
            )
        except Exception as e:
            # Fallback: simple distance / mileage estimate
            fuel_litres = round(distance_km / req.mileage_kmpl, 3)

        fuel_cost = round(fuel_litres * FUEL_PRICE_INR_PER_LITRE, 2)

        routes_out.append(
            {
                "index": idx,
                "distance_km": distance_km,
                "duration_min": duration_min,
                "avg_speed_kmh": avg_speed_kmh,
                "fuel_litres": fuel_litres,
                "fuel_cost_inr": fuel_cost,
                "road_type": road_type,
                "geometry": geometry,
                "summary": summary,
                "is_fuel_efficient": False,
                "is_fastest": False,
            }
        )

    # Mark best routes
    if routes_out:
        fuel_efficient_idx = min(range(len(routes_out)), key=lambda i: routes_out[i]["fuel_litres"])
        fastest_idx = min(range(len(routes_out)), key=lambda i: routes_out[i]["duration_min"])
        routes_out[fuel_efficient_idx]["is_fuel_efficient"] = True
        routes_out[fastest_idx]["is_fastest"] = True

    return {
        "routes": routes_out,
        "weather": weather,
        "vehicle_type": req.vehicle_type,
        "mileage_kmpl": req.mileage_kmpl,
    }


@app.post("/api/save-trip")
async def save_trip_endpoint(trip: TripSave):
    """Persist a trip to the database."""
    trip_id = save_trip(trip.model_dump())
    return {"id": trip_id, "message": "Trip saved successfully"}


@app.get("/api/history")
async def trip_history():
    """Return the 20 most recent trips."""
    trips = get_trips(limit=20)
    return {"trips": trips}


@app.get("/api/health")
async def health():
    """Simple health check."""
    return {"status": "ok"}
