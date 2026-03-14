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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Route Planner</h2>
          <p className="text-xs text-gray-500">Set your route details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Source Search */}
        <LocationSearch
          label="Source Location"
          placeholder="Search for a location..."
          iconColor="text-emerald-500"
          onLocationSelect={onSetSource}
          existingLocation={source}
        />

        {/* Destination Search */}
        <LocationSearch
          label="Destination Location"
          placeholder="Search for a location..."
          iconColor="text-red-500"
          onLocationSelect={onSetDestination}
          existingLocation={dest}
        />

        {/* Vehicle Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Vehicle Type
          </label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Mileage (km/l)
          </label>
          <div className="relative">
            <input
              type="number"
              min="1"
              max="100"
              step="0.5"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="15.0"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              km/l
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:shadow-none"
          >
            {loading ? (
              <>
                <span className="spinner-sm"></span>
                Finding Routes...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Routes
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onClear}
            className="px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 hover:bg-gray-50 rounded-lg text-sm text-gray-700 font-medium transition-all"
          >
            Clear
          </button>
        </div>

        {/* Status indicator */}
        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            <span className={`flex items-center gap-1.5 text-xs font-medium ${source && dest ? 'text-emerald-600' : 'text-gray-400'}`}>
              <span className={`w-2 h-2 rounded-full ${source && dest ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
              {source && dest ? 'Ready to search' : 'Select locations'}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
