import os
import httpx
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from .database import get_db
from .models import Trip
from .fuel_model import FuelEstimator

app = FastAPI(title="FAST API")

# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "http://localhost:5000")

class LocationRequest(BaseModel):
    lat: float
    lon: float

class TripRequest(BaseModel):
    source: LocationRequest
    destination: LocationRequest
    vehicle_type: str
    mileage_km_per_litre: float

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/plan-trip")
async def plan_trip(request: TripRequest, db: Session = Depends(get_db)):
    # 1. format OSRM request (lon,lat;lon,lat)
    coords = f"{request.source.lon},{request.source.lat};{request.destination.lon},{request.destination.lat}"
    url = f"{OSRM_BASE_URL}/route/v1/driving/{coords}?steps=true&alternatives=true&geometries=geojson&overview=full"
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Bad Gateway formatting OSRM request: {e}")
            
    if data.get("code") != "Ok":
        raise HTTPException(status_code=400, detail="Could not find route")
        
    routes = data.get("routes", [])
    if not routes:
        raise HTTPException(status_code=404, detail="No routes found")
        
    evaluated_routes = []
    
    for route in routes:
        distance_km = route.get("distance", 0) / 1000.0
        duration_s = route.get("duration", 0)
        duration_min = duration_s / 60.0
        geometry = route.get("geometry")
        
        predicted_fuel_l = FuelEstimator.estimate_fuel(
            distance_km=distance_km,
            duration_min=duration_min,
            vehicle_type=request.vehicle_type,
            mileage_km_per_litre=request.mileage_km_per_litre
        )
        
        evaluated_routes.append({
            "geometry": geometry,
            "distance_km": round(distance_km, 2),
            "duration_min": round(duration_min, 2),
            "predicted_fuel_l": predicted_fuel_l
        })
        
    # Sort by lowest fuel
    evaluated_routes.sort(key=lambda x: x["predicted_fuel_l"])
    
    selected_route = evaluated_routes[0]
    alternatives = evaluated_routes[1:]
    
    # Optionally save to DB if configured
    if db is not None:
        try:
            import json
            trip_record = Trip(
                source_lat=request.source.lat,
                source_lon=request.source.lon,
                dest_lat=request.destination.lat,
                dest_lon=request.destination.lon,
                distance_km=selected_route["distance_km"],
                duration_min=selected_route["duration_min"],
                predicted_fuel_l=selected_route["predicted_fuel_l"],
                chosen=True,
                osrm_geometry=json.dumps(selected_route.get("geometry", {}))
            )
            db.add(trip_record)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"Error saving trip to database: {e}")

    return {
        "selected_route": selected_route,
        "alternatives": alternatives
    }
