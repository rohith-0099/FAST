"""
FAST ML Pipeline — Training Script

Trains multiple regression models to predict fuel consumption (litres)
from route and vehicle features. Selects and saves the best model.
"""

import os
import warnings
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor, VotingRegressor
from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error

warnings.filterwarnings("ignore")

# ------------------------------------------------------------------
# Paths
# ------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "fuel_dataset.csv")
MODEL_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODEL_DIR, exist_ok=True)


def load_data(path: str) -> pd.DataFrame:
    """Load CSV, skipping comment lines at the top."""
    return pd.read_csv(path, comment="#")


def preprocess(df: pd.DataFrame):
    """
    One-hot encode categoricals, scale numerics, split into train/test.

    Returns:
        X_train, X_test, y_train, y_test, scaler, feature_names
    """
    target = "fuel_consumed_litres"
    y = df[target].values
    X = df.drop(columns=[target])

    # One-hot encode categorical columns
    X = pd.get_dummies(X, columns=["vehicle_type", "road_type"], dtype=float)

    feature_names = list(X.columns)

    # Train/test split (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        X.values, y, test_size=0.20, random_state=42
    )

    # Scale numeric features (fit on train only)
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)

    return X_train, X_test, y_train, y_test, scaler, feature_names


def evaluate(y_true, y_pred):
    """Return dict of R2, MAE, RMSE."""
    return {
        "R2":   r2_score(y_true, y_pred),
        "MAE":  mean_absolute_error(y_true, y_pred),
        "RMSE": np.sqrt(mean_squared_error(y_true, y_pred)),
    }


def main():
    print("=" * 60)
    print("  FAST — Fuel Consumption Model Training")
    print("=" * 60)

    # Load & preprocess
    print(f"\nLoading data from {DATA_PATH} ...")
    df = load_data(DATA_PATH)
    print(f"  Rows: {len(df)}  |  Columns: {list(df.columns)}")

    X_train, X_test, y_train, y_test, scaler, feature_names = preprocess(df)
    print(f"  Train: {X_train.shape[0]}  |  Test: {X_test.shape[0]}")
    print(f"  Features ({len(feature_names)}): {feature_names}")

    # ------------------------------------------------------------------
    # Train individual models
    # ------------------------------------------------------------------
    models = {
        "LinearRegression":      LinearRegression(),
        "DecisionTree":          DecisionTreeRegressor(random_state=42, max_depth=15),
        "RandomForest":          RandomForestRegressor(
                                     n_estimators=200, max_depth=20,
                                     random_state=42, n_jobs=-1
                                 ),
    }

    results = {}
    fitted_models = {}

    print("\nTraining individual models ...")
    for name, model in models.items():
        model.fit(X_train, y_train)
        preds = model.predict(X_test)
        metrics = evaluate(y_test, preds)
        results[name] = metrics
        fitted_models[name] = model
        print(f"  {name:25s}  R2={metrics['R2']:.4f}  MAE={metrics['MAE']:.3f}  RMSE={metrics['RMSE']:.3f}")

    # ------------------------------------------------------------------
    # Ensemble: VotingRegressor (soft average of all three)
    # ------------------------------------------------------------------
    print("\nTraining VotingRegressor ensemble ...")
    ensemble = VotingRegressor(
        estimators=[
            ("lr",  LinearRegression()),
            ("dt",  DecisionTreeRegressor(random_state=42, max_depth=15)),
            ("rf",  RandomForestRegressor(n_estimators=200, max_depth=20,
                                          random_state=42, n_jobs=-1)),
        ]
    )
    ensemble.fit(X_train, y_train)
    ens_preds = ensemble.predict(X_test)
    ens_metrics = evaluate(y_test, ens_preds)
    results["VotingEnsemble"] = ens_metrics
    fitted_models["VotingEnsemble"] = ensemble
    print(f"  {'VotingEnsemble':25s}  R2={ens_metrics['R2']:.4f}  MAE={ens_metrics['MAE']:.3f}  RMSE={ens_metrics['RMSE']:.3f}")

    # ------------------------------------------------------------------
    # Comparison table
    # ------------------------------------------------------------------
    print("\n" + "=" * 60)
    print("  Model Comparison")
    print("=" * 60)
    print(f"  {'Model':25s} {'R2':>8s} {'MAE':>10s} {'RMSE':>10s}")
    print("  " + "-" * 55)
    for name, m in results.items():
        print(f"  {name:25s} {m['R2']:8.4f} {m['MAE']:10.3f} {m['RMSE']:10.3f}")

    # ------------------------------------------------------------------
    # Select and save best model (by R2 score)
    # ------------------------------------------------------------------
    best_name = max(results, key=lambda k: results[k]["R2"])
    best_model = fitted_models[best_name]
    best_metrics = results[best_name]

    print(f"\n  Best model: {best_name}  (R2={best_metrics['R2']:.4f})")

    model_path = os.path.join(MODEL_DIR, "best_model.joblib")
    scaler_path = os.path.join(MODEL_DIR, "scaler.joblib")
    features_path = os.path.join(MODEL_DIR, "feature_names.joblib")
    meta_path = os.path.join(MODEL_DIR, "model_metadata.joblib")

    joblib.dump(best_model, model_path)
    joblib.dump(scaler, scaler_path)
    joblib.dump(feature_names, features_path)
    joblib.dump({
        "model_name": best_name,
        "metrics": best_metrics,
        "feature_names": feature_names,
        "train_rows": X_train.shape[0],
        "test_rows": X_test.shape[0],
    }, meta_path)

    print(f"\n  Saved to {MODEL_DIR}/")
    print(f"    - best_model.joblib       ({best_name})")
    print(f"    - scaler.joblib")
    print(f"    - feature_names.joblib")
    print(f"    - model_metadata.joblib")
    print("=" * 60)


if __name__ == "__main__":
    main()
