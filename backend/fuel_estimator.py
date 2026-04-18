"""Transparent route fuel estimator based on real vehicle efficiency data."""

from __future__ import annotations

from typing import Any

CO2_GRAMS_PER_LITRE = {
    "Petrol": 2310,  # ~2.31 kg/L
    "Diesel": 2680,  # ~2.68 kg/L
}

def _calculate_co2(fuel_litres: float, fuel_type: str) -> float:
    factor = CO2_GRAMS_PER_LITRE.get(fuel_type, 2310)  # Default to Petrol if unknown
    return round((fuel_litres * factor) / 1000.0, 3)  # Convert to kg


def _clamp(value: float, lower: float, upper: float) -> float:
    return max(lower, min(upper, value))



def _kmpl_to_l_per_100km(kmpl: float) -> float:
    return 100.0 / kmpl



def _blend_base_consumption(vehicle: dict[str, Any], road_profile: dict[str, float]) -> float:
    city_share = _clamp(float(road_profile.get("urban_share", 0.0)), 0.0, 1.0)
    highway_share = _clamp(float(road_profile.get("highway_share", 0.0)), 0.0, 1.0)
    neutral_share = max(0.0, 1.0 - city_share - highway_share)

    city_l100 = _kmpl_to_l_per_100km(float(vehicle["city_kmpl"]))
    highway_l100 = _kmpl_to_l_per_100km(float(vehicle["highway_kmpl"]))
    combined_l100 = _kmpl_to_l_per_100km(float(vehicle["combined_kmpl"]))

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
    temperature_c: float | None,
    wind_speed_kmh: float | None,
    precipitation_mm: float | None,
    stops_per_km: float,
    road_profile: dict[str, float],
    fuel_price_per_litre: float,
) -> dict[str, float | str]:
    base_l_per_100km = _blend_base_consumption(vehicle, road_profile)

    factors = {
        "temperature": _temperature_factor(temperature_c) if temperature_c is not None else 1.0,
        "wind": _wind_factor(wind_speed_kmh) if wind_speed_kmh is not None else 1.0,
        "rain": _rain_factor(precipitation_mm) if precipitation_mm is not None else 1.0,
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
    co2_kg = _calculate_co2(fuel_litres, vehicle.get("fuel_type", "Petrol"))

    return {
        "fuel_litres": fuel_litres,
        "fuel_cost": fuel_cost,
        "co2_kg": co2_kg,
        "base_l_per_100km": round(base_l_per_100km, 2),
        "effective_l_per_100km": round(effective_l_per_100km, 2),
        "effective_kmpl": effective_kmpl,
        "adjustment_factor": round(adjustment_factor, 3),
        "estimation_method": (
            "Real vehicle efficiency data with route adjustments and live weather adjustments when available"
        ),
    }
