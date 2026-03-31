"""Transparent route fuel estimator based on official vehicle economy data."""

from __future__ import annotations

from typing import Any

US_MPG_TO_L_PER_100KM = 235.214583


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))



def _mpg_to_l_per_100km(mpg: float) -> float:
    return US_MPG_TO_L_PER_100KM / mpg



def _blend_base_consumption(vehicle: dict[str, Any], road_profile: dict[str, float]) -> float:
    city_share = _clamp(float(road_profile.get("urban_share", 0.0)), 0.0, 1.0)
    highway_share = _clamp(float(road_profile.get("highway_share", 0.0)), 0.0, 1.0)
    neutral_share = max(0.0, 1.0 - city_share - highway_share)

    city_l100 = _mpg_to_l_per_100km(float(vehicle["city_mpg"]))
    highway_l100 = _mpg_to_l_per_100km(float(vehicle["highway_mpg"]))
    combined_l100 = _mpg_to_l_per_100km(float(vehicle["combined_mpg"]))

    if city_share == 0.0 and highway_share == 0.0:
        return combined_l100

    return (
        city_share * city_l100
        + highway_share * highway_l100
        + neutral_share * combined_l100
    )



def _temperature_factor(temperature_c: float) -> float:
    if temperature_c < 10:
        return 1.0 + min(0.12, (10 - temperature_c) * 0.008)
    if temperature_c > 30:
        return 1.0 + min(0.06, (temperature_c - 30) * 0.004)
    return 1.0



def _wind_factor(wind_speed_kmh: float) -> float:
    return 1.0 + min(0.10, max(wind_speed_kmh, 0.0) * 0.002)



def _rain_factor(precipitation_mm: float) -> float:
    return 1.0 + min(0.05, max(precipitation_mm, 0.0) * 0.003)



def _speed_factor(avg_speed_kmh: float) -> float:
    if avg_speed_kmh < 20:
        return 1.0 + min(0.10, (20 - avg_speed_kmh) * 0.008)
    if avg_speed_kmh > 95:
        return 1.0 + min(0.15, (avg_speed_kmh - 95) * 0.005)
    return 1.0



def _stop_factor(stops_per_km: float) -> float:
    if stops_per_km <= 2.0:
        return 1.0
    return 1.0 + min(0.12, (stops_per_km - 2.0) * 0.025)



def estimate_route_fuel(
    *,
    vehicle: dict[str, Any],
    distance_km: float,
    avg_speed_kmh: float,
    temperature_c: float,
    wind_speed_kmh: float,
    precipitation_mm: float,
    stops_per_km: float,
    road_profile: dict[str, float],
    fuel_price_per_litre: float,
) -> dict[str, float | str]:
    base_l_per_100km = _blend_base_consumption(vehicle, road_profile)

    factors = {
        "temperature": _temperature_factor(temperature_c),
        "wind": _wind_factor(wind_speed_kmh),
        "rain": _rain_factor(precipitation_mm),
        "speed": _speed_factor(avg_speed_kmh),
        "stops": _stop_factor(stops_per_km),
    }

    adjustment_factor = 1.0
    for factor in factors.values():
        adjustment_factor *= factor

    effective_l_per_100km = base_l_per_100km * adjustment_factor
    fuel_litres = round(max(distance_km, 0.0) * effective_l_per_100km / 100.0, 3)
    fuel_cost = round(fuel_litres * fuel_price_per_litre, 2)
    effective_kmpl = round(distance_km / fuel_litres, 2) if fuel_litres > 0 else 0.0

    return {
        "fuel_litres": fuel_litres,
        "fuel_cost": fuel_cost,
        "base_l_per_100km": round(base_l_per_100km, 2),
        "effective_l_per_100km": round(effective_l_per_100km, 2),
        "effective_kmpl": effective_kmpl,
        "adjustment_factor": round(adjustment_factor, 3),
        "estimation_method": "Official vehicle fuel-economy data with route and weather adjustments",
    }
