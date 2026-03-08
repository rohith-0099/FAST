class FuelEstimator:
    @staticmethod
    def estimate_fuel(distance_km: float, duration_min: float, vehicle_type: str, mileage_km_per_litre: float) -> float:
        """
        Baseline rule-based fuel estimation.
        """
        if mileage_km_per_litre <= 0:
            return 0.0

        # Baseline fuel based purely on distance and stated mileage
        base_fuel = distance_km / mileage_km_per_litre

        # Simple correction factors
        # Average speed (km/h)
        duration_hours = duration_min / 60.0 if duration_min > 0 else 0
        avg_speed = distance_km / duration_hours if duration_hours > 0 else 0

        correction_factor = 1.0

        # Penalize very slow speeds (stop and go traffic)
        if avg_speed < 20:
            # E.g., 20% more fuel if very slow
            correction_factor += 0.20
        # Optimal speed (e.g., highway cruising)
        elif 60 <= avg_speed <= 90:
            # E.g., 10% more efficient
            correction_factor -= 0.10
        # Penalize very high speeds
        elif avg_speed > 100:
            correction_factor += 0.15

        predicted_fuel = base_fuel * correction_factor
        return round(predicted_fuel, 4)
