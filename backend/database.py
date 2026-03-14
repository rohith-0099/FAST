"""
FAST — SQLite database layer using Python's built-in sqlite3.

Tables
------
trip_history : stores every saved trip with fuel predictions.
"""

import os
import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "fast.db")


def _get_connection() -> sqlite3.Connection:
    """Return a connection with row-factory set to sqlite3.Row."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """Create tables if they don't already exist."""
    conn = _get_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS trip_history (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                source_name     TEXT,
                dest_name       TEXT,
                source_lat      REAL,
                source_lng      REAL,
                dest_lat        REAL,
                dest_lng        REAL,
                vehicle_type    TEXT,
                mileage         REAL,
                distance_km     REAL,
                fuel_litres     REAL,
                route_name      TEXT,
                created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


def save_trip(data: dict) -> int:
    """
    Insert a trip record and return the new row id.

    Parameters
    ----------
    data : dict
        Keys should match the column names in trip_history
        (source_name, dest_name, source_lat, source_lng, dest_lat, dest_lng,
         vehicle_type, mileage, distance_km, fuel_litres, route_name).
    """
    conn = _get_connection()
    try:
        cursor = conn.execute(
            """
            INSERT INTO trip_history
                (source_name, dest_name, source_lat, source_lng,
                 dest_lat, dest_lng, vehicle_type, mileage,
                 distance_km, fuel_litres, route_name)
            VALUES
                (:source_name, :dest_name, :source_lat, :source_lng,
                 :dest_lat, :dest_lng, :vehicle_type, :mileage,
                 :distance_km, :fuel_litres, :route_name)
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
            },
        )
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()


def get_trips(limit: int = 20) -> list[dict]:
    """Return the most recent *limit* trips, newest first."""
    conn = _get_connection()
    try:
        rows = conn.execute(
            "SELECT * FROM trip_history ORDER BY created_at DESC LIMIT ?",
            (limit,),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()
