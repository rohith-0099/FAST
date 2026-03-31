"""SQLite database layer for FAST."""

from __future__ import annotations

import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fast.db")

TRIP_HISTORY_SCHEMA = """
CREATE TABLE IF NOT EXISTS trip_history (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    source_name           TEXT,
    dest_name             TEXT,
    source_lat            REAL,
    source_lng            REAL,
    dest_lat              REAL,
    dest_lng              REAL,
    vehicle_type          TEXT,
    mileage               REAL,
    distance_km           REAL,
    fuel_litres           REAL,
    route_name            TEXT,
    vehicle_id            INTEGER,
    vehicle_label         TEXT,
    vehicle_year          INTEGER,
    vehicle_make          TEXT,
    vehicle_model         TEXT,
    fuel_type             TEXT,
    city_kmpl             REAL,
    highway_kmpl          REAL,
    combined_kmpl         REAL,
    fuel_price_per_litre  REAL,
    estimated_cost        REAL,
    estimation_method     TEXT,
    vehicle_data_source   TEXT,
    source_note           TEXT,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
"""

REQUIRED_COLUMNS = {
    "vehicle_id": "INTEGER",
    "vehicle_label": "TEXT",
    "vehicle_year": "INTEGER",
    "vehicle_make": "TEXT",
    "vehicle_model": "TEXT",
    "fuel_type": "TEXT",
    "city_kmpl": "REAL",
    "highway_kmpl": "REAL",
    "combined_kmpl": "REAL",
    "fuel_price_per_litre": "REAL",
    "estimated_cost": "REAL",
    "estimation_method": "TEXT",
    "vehicle_data_source": "TEXT",
    "source_note": "TEXT",
}


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn



def init_db() -> None:
    conn = _get_connection()
    try:
        conn.execute(TRIP_HISTORY_SCHEMA)
        existing_columns = {
            row["name"] for row in conn.execute("PRAGMA table_info(trip_history)").fetchall()
        }
        for column_name, column_type in REQUIRED_COLUMNS.items():
            if column_name not in existing_columns:
                conn.execute(
                    f"ALTER TABLE trip_history ADD COLUMN {column_name} {column_type}"
                )
        conn.commit()
    finally:
        conn.close()



def save_trip(data: dict) -> int:
    conn = _get_connection()
    try:
        cursor = conn.execute(
            """
            INSERT INTO trip_history (
                source_name, dest_name, source_lat, source_lng,
                dest_lat, dest_lng, vehicle_type, mileage,
                distance_km, fuel_litres, route_name,
                vehicle_id, vehicle_label, vehicle_year, vehicle_make,
                vehicle_model, fuel_type, city_kmpl, highway_kmpl,
                combined_kmpl, fuel_price_per_litre, estimated_cost,
                estimation_method, vehicle_data_source, source_note
            ) VALUES (
                :source_name, :dest_name, :source_lat, :source_lng,
                :dest_lat, :dest_lng, :vehicle_type, :mileage,
                :distance_km, :fuel_litres, :route_name,
                :vehicle_id, :vehicle_label, :vehicle_year, :vehicle_make,
                :vehicle_model, :fuel_type, :city_kmpl, :highway_kmpl,
                :combined_kmpl, :fuel_price_per_litre, :estimated_cost,
                :estimation_method, :vehicle_data_source, :source_note
            )
            """,
            {
                "source_name": data.get("source_name", ""),
                "dest_name": data.get("dest_name", ""),
                "source_lat": data.get("source_lat"),
                "source_lng": data.get("source_lng"),
                "dest_lat": data.get("dest_lat"),
                "dest_lng": data.get("dest_lng"),
                "vehicle_type": data.get("vehicle_type", ""),
                "mileage": data.get("mileage"),
                "distance_km": data.get("distance_km"),
                "fuel_litres": data.get("fuel_litres"),
                "route_name": data.get("route_name", ""),
                "vehicle_id": data.get("vehicle_id"),
                "vehicle_label": data.get("vehicle_label", ""),
                "vehicle_year": data.get("vehicle_year"),
                "vehicle_make": data.get("vehicle_make", ""),
                "vehicle_model": data.get("vehicle_model", ""),
                "fuel_type": data.get("fuel_type", ""),
                "city_kmpl": data.get("city_kmpl"),
                "highway_kmpl": data.get("highway_kmpl"),
                "combined_kmpl": data.get("combined_kmpl"),
                "fuel_price_per_litre": data.get("fuel_price_per_litre"),
                "estimated_cost": data.get("estimated_cost"),
                "estimation_method": data.get("estimation_method", ""),
                "vehicle_data_source": data.get("vehicle_data_source", ""),
                "source_note": data.get("source_note", ""),
            },
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()



def get_trips(limit: int = 20) -> list[dict]:
    conn = _get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM trip_history ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
