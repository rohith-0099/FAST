"""FAST backend with real vehicle data and transparent fuel estimation."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Optional

import httpx
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import get_trips, init_db, save_trip
from fuel_estimator import estimate_route_fuel
from vehicle_catalog import (
    catalog_summary,
    get_vehicle,
    list_makes,
    list_models,
    list_vehicle_options,
    list_years,
)

OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast"
OSRM_BASE = "https://router.project-osrm.org/route/v1/driving"
DEFAULT_FUEL_PRICE_PER_LITRE = 105.0
HIGHWAY_KEYWORDS = {
    "highway",
    "expressway",
    "motorway",
    "nh",
    "national highway",
    "freeway",
    "interstate",
}
URBAN_KEYWORDS = {
    "street",
    "road",
    "avenue",
    "lane",
    "boulevard",
    "circle",
    "marg",
    "nagar",
}


class RouteRequest(BaseModel):
    source_lat: float
    source_lng: float
    dest_lat: float
    dest_lng: float
    vehicle_id: int
    fuel_price_per_litre: float = Field(default=DEFAULT_FUEL_PRICE_PER_LITRE, gt=0)


class TripSave(BaseModel):
    source_name: Optional[str] = ""
    dest_name: Optional[str] = ""
    source_lat: float
    source_lng: float
    dest_lat: float
    dest_lng: float
    vehicle_type: str = ""
    mileage: float = 0.0
    distance_km: float = 0.0
    fuel_litres: float = 0.0
    route_name: Optional[str] = ""
    vehicle_id: Optional[int] = None
    vehicle_label: Optional[str] = ""
    vehicle_year: Optional[int] = None
    vehicle_make: Optional[str] = ""
    vehicle_model: Optional[str] = ""
    fuel_type: Optional[str] = ""
    city_kmpl: Optional[float] = None
    highway_kmpl: Optional[float] = None
    combined_kmpl: Optional[float] = None
    fuel_price_per_litre: Optional[float] = None
    estimated_cost: Optional[float] = None
    estimation_method: Optional[str] = ""


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    catalog_summary()
    yield


app = FastAPI(title="FAST API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



def _road_profile(steps: list[dict]) -> dict[str, float | str]:
    highway_count = 0
    urban_count = 0
    total = 0

    for step in steps:
        name = (step.get("name") or "").lower()
        ref = (step.get("ref") or "").lower()
        combined = f"{name} {ref}"
        total += 1

        if any(keyword in combined for keyword in HIGHWAY_KEYWORDS):
            highway_count += 1
        elif any(keyword in combined for keyword in URBAN_KEYWORDS):
            urban_count += 1

    if total == 0:
        return {
            "road_type": "mixed",
            "highway_share": 0.0,
            "urban_share": 0.0,
            "unclassified_share": 1.0,
        }

    highway_share = round(highway_count / total, 3)
    urban_share = round(urban_count / total, 3)
    unclassified_share = round(max(0.0, 1.0 - highway_share - urban_share), 3)

    if highway_share >= 0.5:
        road_type = "highway"
    elif urban_share >= 0.5:
        road_type = "urban"
    else:
        road_type = "mixed"

    return {
        "road_type": road_type,
        "highway_share": highway_share,
        "urban_share": urban_share,
        "unclassified_share": unclassified_share,
    }



def _estimate_stops_per_km(steps: list[dict], distance_km: float) -> float:
    if distance_km <= 0:
        return 0.0
    num_manoeuvres = max(len(steps) - 2, 0)
    return round(num_manoeuvres / distance_km, 4)


async def _fetch_routes(client: httpx.AsyncClient, req: RouteRequest) -> dict:
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
    return {"temperature_c": 25.0, "wind_speed_kmh": 10.0, "precipitation_mm": 0.0}


@app.get("/api/vehicles/years")
async def vehicle_years():
    return {"years": list_years()}


@app.get("/api/vehicles/makes")
async def vehicle_makes(year: int = Query(..., ge=1984)):
    return {"makes": list_makes(year)}


@app.get("/api/vehicles/models")
async def vehicle_models(year: int = Query(..., ge=1984), make: str = Query(...)):
    return {"models": list_models(year, make)}


@app.get("/api/vehicles/options")
async def vehicle_options(
    year: int = Query(..., ge=1984),
    make: str = Query(...),
    model: str = Query(...),
):
    return {"vehicles": list_vehicle_options(year, make, model)}


@app.post("/api/routes")
async def get_routes(req: RouteRequest):
    vehicle = get_vehicle(req.vehicle_id)
    if vehicle is None:
        raise HTTPException(status_code=404, detail="Selected vehicle was not found in the official dataset")

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

        all_steps = []
        for leg in route.get("legs", []):
            all_steps.extend(leg.get("steps", []))

        summary = route.get("legs", [{}])[0].get("summary", "") if route.get("legs") else ""
        road_profile = _road_profile(all_steps)
        stops_per_km = _estimate_stops_per_km(all_steps, distance_km)

        estimate = estimate_route_fuel(
            vehicle=vehicle,
            distance_km=distance_km,
            avg_speed_kmh=avg_speed_kmh,
            temperature_c=weather["temperature_c"],
            wind_speed_kmh=weather["wind_speed_kmh"],
            precipitation_mm=weather["precipitation_mm"],
            stops_per_km=stops_per_km,
            road_profile=road_profile,
            fuel_price_per_litre=req.fuel_price_per_litre,
        )

        routes_out.append(
            {
                "index": idx,
                "distance_km": distance_km,
                "duration_min": duration_min,
                "avg_speed_kmh": avg_speed_kmh,
                "fuel_litres": estimate["fuel_litres"],
                "fuel_cost": estimate["fuel_cost"],
                "road_type": road_profile["road_type"],
                "urban_share": road_profile["urban_share"],
                "highway_share": road_profile["highway_share"],
                "stops_per_km": stops_per_km,
                "effective_kmpl": estimate["effective_kmpl"],
                "effective_l_per_100km": estimate["effective_l_per_100km"],
                "adjustment_factor": estimate["adjustment_factor"],
                "estimation_method": estimate["estimation_method"],
                "geometry": geometry,
                "summary": summary,
                "is_fuel_efficient": False,
                "is_fastest": False,
            }
        )

    if routes_out:
        fuel_efficient_idx = min(range(len(routes_out)), key=lambda i: routes_out[i]["fuel_litres"])
        fastest_idx = min(range(len(routes_out)), key=lambda i: routes_out[i]["duration_min"])
        routes_out[fuel_efficient_idx]["is_fuel_efficient"] = True
        routes_out[fastest_idx]["is_fastest"] = True

    return {
        "routes": routes_out,
        "weather": weather,
        "vehicle": vehicle,
        "fuel_price_per_litre": req.fuel_price_per_litre,
        "pricing_note": "Fuel price is user-provided so it can match the latest local market price.",
    }


@app.post("/api/save-trip")
async def save_trip_endpoint(trip: TripSave):
    trip_id = save_trip(trip.model_dump())
    return {"id": trip_id, "message": "Trip saved successfully"}


@app.get("/api/history")
async def trip_history():
    trips = get_trips(limit=20)
    return {"trips": trips}


@app.get("/api/health")
async def health():
    return {
        "status": "ok",
        "catalog": catalog_summary(),
        "estimation": "official vehicle dataset + transparent route adjustments",
    }
