"""
FAST ML Pipeline — Prediction Module

Loads the trained model, scaler, and feature schema, then exposes a
`predict_fuel()` function for inference.
"""

import os
import numpy as np
import joblib

# ------------------------------------------------------------------
# Paths
# ------------------------------------------------------------------
MODEL_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

_model = None
_scaler = None
_feature_names = None


def _load_artifacts():
    """Lazy-load model artifacts on first prediction call."""
    global _model, _scaler, _feature_names

    if _model is not None:
        return

    model_path = os.path.join(MODEL_DIR, "best_model.joblib")
    scaler_path = os.path.join(MODEL_DIR, "scaler.joblib")
    features_path = os.path.join(MODEL_DIR, "feature_names.joblib")

    if not os.path.exists(model_path):
        raise FileNotFoundError(
            f"Trained model not found at {model_path}. Run train.py first."
        )

    _model = joblib.load(model_path)
    _scaler = joblib.load(scaler_path)
    _feature_names = joblib.load(features_path)


def predict_fuel(
    distance_km: float,
    avg_speed_kmh: float,
    vehicle_type: str,
    vehicle_mileage_kmpl: float,
    temperature_c: float,
    wind_speed_kmh: float,
    precipitation_mm: float,
    road_type: str,
    num_stops_per_km: float,
) -> float:
    """
    Predict fuel consumption in litres for a single trip.

    Parameters
    ----------
    distance_km : float          Route distance (5-500 km).
    avg_speed_kmh : float        Average driving speed (15-120 km/h).
    vehicle_type : str           One of: bike, car, suv, truck.
    vehicle_mileage_kmpl : float Vehicle fuel efficiency (km per litre).
    temperature_c : float        Ambient temperature in Celsius.
    wind_speed_kmh : float       Wind speed (0-50 km/h).
    precipitation_mm : float     Precipitation (0-20 mm).
    road_type : str              One of: highway, urban, mixed.
    num_stops_per_km : float     Average stops per km on the route.

    Returns
    -------
    float
        Predicted fuel consumed in litres.
    """
    _load_artifacts()

    # Build a feature vector matching the training schema
    row = {name: 0.0 for name in _feature_names}

    # Numeric features
    row["distance_km"] = distance_km
    row["avg_speed_kmh"] = avg_speed_kmh
    row["vehicle_mileage_kmpl"] = vehicle_mileage_kmpl
    row["temperature_c"] = temperature_c
    row["wind_speed_kmh"] = wind_speed_kmh
    row["precipitation_mm"] = precipitation_mm
    row["num_stops_per_km"] = num_stops_per_km

    # One-hot encoded columns
    vt_col = f"vehicle_type_{vehicle_type}"
    rt_col = f"road_type_{road_type}"

    if vt_col not in row:
        raise ValueError(
            f"Unknown vehicle_type '{vehicle_type}'. "
            f"Expected one of: bike, car, suv, truck."
        )
    if rt_col not in row:
        raise ValueError(
            f"Unknown road_type '{road_type}'. "
            f"Expected one of: highway, urban, mixed."
        )

    row[vt_col] = 1.0
    row[rt_col] = 1.0

    # Convert to array in the correct feature order
    X = np.array([[row[f] for f in _feature_names]])

    # Scale
    X_scaled = _scaler.transform(X)

    # Predict
    prediction = _model.predict(X_scaled)[0]
    return round(max(prediction, 0.0), 3)


if __name__ == "__main__":
    # Quick smoke test
    result = predict_fuel(
        distance_km=150,
        avg_speed_kmh=80,
        vehicle_type="car",
        vehicle_mileage_kmpl=15,
        temperature_c=25,
        wind_speed_kmh=10,
        precipitation_mm=0,
        road_type="highway",
        num_stops_per_km=0.3,
    )
    print(f"Predicted fuel: {result:.3f} litres")
    # Sanity: 150km / 15kmpl = 10L base, highway+good conditions ~ 11-12L
    print(f"Base estimate:  {150 / 15:.1f} litres")
