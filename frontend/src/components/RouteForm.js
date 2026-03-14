"use client";

import { useState, useEffect } from "react";
import LocationSearch from "./LocationSearch";

const VEHICLE_DEFAULTS = {
  Bike: 40,
  Car: 15,
  SUV: 10,
  Truck: 5,
};

export default function RouteForm({ source, dest, onFindRoutes, onClear, loading, onSetSource, onSetDestination }) {
  const [vehicleType, setVehicleType] = useState("Car");
  const [mileage, setMileage] = useState(15);

  useEffect(() => {
    setMileage(VEHICLE_DEFAULTS[vehicleType] || 15);
  }, [vehicleType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onFindRoutes(vehicleType, parseFloat(mileage));
  };

  const canSubmit = source && dest && mileage > 0 && !loading;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Route Planner
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Search */}
        <LocationSearch
          label="Source"
          placeholder="Search for a location..."
          iconColor="text-green-500"
          onLocationSelect={onSetSource}
          existingLocation={source}
        />

        {/* Destination Search */}
        <LocationSearch
          label="Destination"
          placeholder="Search for a location..."
          iconColor="text-red-500"
          onLocationSelect={onSetDestination}
          existingLocation={dest}
        />

        {/* Vehicle Type */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Vehicle Type
          </label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
          >
            {Object.keys(VEHICLE_DEFAULTS).map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Mileage */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Mileage (km/l)
          </label>
          <input
            type="number"
            min="1"
            max="100"
            step="0.5"
            value={mileage}
            onChange={(e) => setMileage(e.target.value)}
            className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 transition-colors"
            placeholder="Enter mileage"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-slate-600 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Finding...
              </>
            ) : (
              "Find Routes"
            )}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2.5 bg-[#0f172a] border border-[#334155] hover:border-slate-500 rounded-lg text-sm text-slate-300 transition-colors"
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
}
