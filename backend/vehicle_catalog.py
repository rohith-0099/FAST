"""Official vehicle catalog backed by the free EPA fuel economy dataset."""

from __future__ import annotations

import csv
import os
import zipfile
from functools import lru_cache
from typing import Any

DATASET_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "vehicles.csv.zip")
SUPPORTED_PRIMARY_FUELS = {
    "Regular Gasoline",
    "Premium Gasoline",
    "Midgrade Gasoline",
    "Diesel",
}
MPG_TO_KMPL = 1.609344 / 3.785411784


def _parse_float(value: str | None) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except ValueError:
        return None



def _parse_int(value: str | None) -> int | None:
    if value is None or value == "":
        return None
    try:
        return int(value)
    except ValueError:
        return None



def _compact(parts: list[str | None]) -> list[str]:
    return [part.strip() for part in parts if part and part.strip()]



def _build_vehicle_label(row: dict[str, str], combined_kmpl: float) -> str:
    engine_bits = _compact([
        f"{row['displ']}L" if row.get("displ") else None,
        f"{row['cylinders']} cyl" if row.get("cylinders") else None,
    ])
    engine = " ".join(engine_bits)

    descriptor = " | ".join(
        _compact(
            [
                engine,
                row.get("trany"),
                row.get("drive"),
                row.get("fuelType1"),
                f"{combined_kmpl:.1f} km/l combined",
            ]
        )
    )

    title = f"{row['year']} {row['make']} {row['model']}"
    return f"{title} | {descriptor}" if descriptor else title



def _is_supported(row: dict[str, str]) -> bool:
    fuel_type = (row.get("fuelType1") or "").strip()
    if fuel_type not in SUPPORTED_PRIMARY_FUELS:
        return False
    if (row.get("fuelType2") or "").strip():
        return False

    city_mpg = _parse_float(row.get("city08"))
    highway_mpg = _parse_float(row.get("highway08"))
    combined_mpg = _parse_float(row.get("comb08"))
    year = _parse_int(row.get("year"))

    return (
        year is not None
        and city_mpg is not None
        and highway_mpg is not None
        and combined_mpg is not None
        and city_mpg > 0
        and highway_mpg > 0
        and combined_mpg > 0
    )



def _load_rows() -> list[dict[str, str]]:
    if not os.path.exists(DATASET_PATH):
        raise FileNotFoundError(
            f"Vehicle dataset not found at {DATASET_PATH}. "
            "Download the free EPA dataset before starting the backend."
        )

    with zipfile.ZipFile(DATASET_PATH) as archive:
        member = archive.namelist()[0]
        with archive.open(member) as handle:
            return list(csv.DictReader(line.decode("utf-8", "ignore") for line in handle))



@lru_cache(maxsize=1)
def _build_catalog() -> dict[str, Any]:
    vehicles_by_id: dict[int, dict[str, Any]] = {}
    makes_by_year: dict[int, set[str]] = {}
    models_by_year_make: dict[tuple[int, str], set[str]] = {}
    options_by_key: dict[tuple[int, str, str], list[dict[str, Any]]] = {}

    for row in _load_rows():
        if not _is_supported(row):
            continue

        vehicle_id = _parse_int(row.get("id"))
        year = _parse_int(row.get("year"))
        city_mpg = _parse_float(row.get("city08"))
        highway_mpg = _parse_float(row.get("highway08"))
        combined_mpg = _parse_float(row.get("comb08"))
        if None in {vehicle_id, year, city_mpg, highway_mpg, combined_mpg}:
            continue

        make = (row.get("make") or "").strip()
        model = (row.get("model") or "").strip()
        if not make or not model:
            continue

        city_kmpl = round(city_mpg * MPG_TO_KMPL, 2)
        highway_kmpl = round(highway_mpg * MPG_TO_KMPL, 2)
        combined_kmpl = round(combined_mpg * MPG_TO_KMPL, 2)

        vehicle = {
            "id": vehicle_id,
            "year": year,
            "make": make,
            "model": model,
            "fuel_type": row.get("fuelType1", "").strip(),
            "transmission": (row.get("trany") or "").strip(),
            "drive": (row.get("drive") or "").strip(),
            "vehicle_class": (row.get("VClass") or "").strip(),
            "displacement_l": _parse_float(row.get("displ")),
            "cylinders": _parse_int(row.get("cylinders")),
            "city_mpg": round(city_mpg, 2),
            "highway_mpg": round(highway_mpg, 2),
            "combined_mpg": round(combined_mpg, 2),
            "city_kmpl": city_kmpl,
            "highway_kmpl": highway_kmpl,
            "combined_kmpl": combined_kmpl,
        }
        vehicle["label"] = _build_vehicle_label(row, combined_kmpl)

        vehicles_by_id[vehicle_id] = vehicle
        makes_by_year.setdefault(year, set()).add(make)
        models_by_year_make.setdefault((year, make), set()).add(model)
        options_by_key.setdefault((year, make, model), []).append(vehicle)

    years = sorted(makes_by_year.keys(), reverse=True)

    return {
        "years": years,
        "makes_by_year": {year: sorted(values) for year, values in makes_by_year.items()},
        "models_by_year_make": {
            key: sorted(values) for key, values in models_by_year_make.items()
        },
        "options_by_key": {
            key: sorted(
                values,
                key=lambda item: (-item["combined_kmpl"], item["label"]),
            )
            for key, values in options_by_key.items()
        },
        "vehicles_by_id": vehicles_by_id,
    }



@lru_cache(maxsize=1)
def list_years() -> list[int]:
    return _build_catalog()["years"]



@lru_cache(maxsize=128)
def list_makes(year: int) -> list[str]:
    return _build_catalog()["makes_by_year"].get(year, [])



@lru_cache(maxsize=512)
def list_models(year: int, make: str) -> list[str]:
    return _build_catalog()["models_by_year_make"].get((year, make), [])



@lru_cache(maxsize=1024)
def list_vehicle_options(year: int, make: str, model: str) -> list[dict[str, Any]]:
    return _build_catalog()["options_by_key"].get((year, make, model), [])



@lru_cache(maxsize=2048)
def get_vehicle(vehicle_id: int) -> dict[str, Any] | None:
    return _build_catalog()["vehicles_by_id"].get(vehicle_id)



def catalog_summary() -> dict[str, Any]:
    catalog = _build_catalog()
    return {
        "vehicle_count": len(catalog["vehicles_by_id"]),
        "year_count": len(catalog["years"]),
        "latest_year": catalog["years"][0] if catalog["years"] else None,
        "oldest_year": catalog["years"][-1] if catalog["years"] else None,
    }
