"use client";

import { useEffect, useMemo, useState } from "react";
import LocationSearch from "./LocationSearch";
import { API_BASE } from "@/lib/api";

const DEFAULT_FUEL_PRICE = "105";

export default function RouteForm({
  source,
  dest,
  onFindRoutes,
  onClear,
  loading,
  onSetSource,
  onSetDestination,
}) {
  const [years, setYears] = useState([]);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [vehicleOptions, setVehicleOptions] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [fuelPricePerLitre, setFuelPricePerLitre] = useState(DEFAULT_FUEL_PRICE);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");

  useEffect(() => {
    const savedFuelPrice = window.localStorage.getItem("fast:fuel-price-per-litre");
    if (savedFuelPrice) {
      setFuelPricePerLitre(savedFuelPrice);
    }

    let cancelled = false;

    async function loadYears() {
      setCatalogLoading(true);
      setCatalogError("");
      try {
        const res = await fetch(`${API_BASE}/api/vehicles/years`);
        const data = await res.json();
        if (!cancelled) {
          setYears(data.years || []);
          if (data.years?.length) {
            setSelectedYear(String(data.years[0]));
          }
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError("Unable to load the official vehicle catalog.");
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    loadYears();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    window.localStorage.setItem("fast:fuel-price-per-litre", fuelPricePerLitre || DEFAULT_FUEL_PRICE);
  }, [fuelPricePerLitre]);

  useEffect(() => {
    if (!selectedYear) return;

    let cancelled = false;

    async function loadMakes() {
      setCatalogLoading(true);
      setCatalogError("");
      setMakes([]);
      setModels([]);
      setVehicleOptions([]);
      setSelectedMake("");
      setSelectedModel("");
      setSelectedVehicleId("");
      try {
        const res = await fetch(`${API_BASE}/api/vehicles/makes?year=${encodeURIComponent(selectedYear)}`);
        const data = await res.json();
        if (!cancelled) {
          const nextMakes = data.makes || [];
          setMakes(nextMakes);
          if (nextMakes.length) {
            setSelectedMake(nextMakes[0]);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError("Unable to load makes for the selected year.");
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    loadMakes();
    return () => {
      cancelled = true;
    };
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedYear || !selectedMake) return;

    let cancelled = false;

    async function loadModels() {
      setCatalogLoading(true);
      setCatalogError("");
      setModels([]);
      setVehicleOptions([]);
      setSelectedModel("");
      setSelectedVehicleId("");
      try {
        const params = new URLSearchParams({
          year: selectedYear,
          make: selectedMake,
        });
        const res = await fetch(`${API_BASE}/api/vehicles/models?${params.toString()}`);
        const data = await res.json();
        if (!cancelled) {
          const nextModels = data.models || [];
          setModels(nextModels);
          if (nextModels.length) {
            setSelectedModel(nextModels[0]);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError("Unable to load models for the selected make.");
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    loadModels();
    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMake]);

  useEffect(() => {
    if (!selectedYear || !selectedMake || !selectedModel) return;

    let cancelled = false;

    async function loadVehicleOptions() {
      setCatalogLoading(true);
      setCatalogError("");
      setVehicleOptions([]);
      setSelectedVehicleId("");
      try {
        const params = new URLSearchParams({
          year: selectedYear,
          make: selectedMake,
          model: selectedModel,
        });
        const res = await fetch(`${API_BASE}/api/vehicles/options?${params.toString()}`);
        const data = await res.json();
        if (!cancelled) {
          const nextVehicles = data.vehicles || [];
          setVehicleOptions(nextVehicles);
          if (nextVehicles.length) {
            setSelectedVehicleId(String(nextVehicles[0].id));
          }
        }
      } catch (error) {
        if (!cancelled) {
          setCatalogError("Unable to load real vehicle variants for the selected model.");
        }
      } finally {
        if (!cancelled) {
          setCatalogLoading(false);
        }
      }
    }

    loadVehicleOptions();
    return () => {
      cancelled = true;
    };
  }, [selectedYear, selectedMake, selectedModel]);

  const selectedVehicle = useMemo(
    () => vehicleOptions.find((vehicle) => String(vehicle.id) === String(selectedVehicleId)) || null,
    [selectedVehicleId, vehicleOptions]
  );

  const canSubmit = Boolean(
    source &&
      dest &&
      selectedVehicle &&
      Number.parseFloat(fuelPricePerLitre) > 0 &&
      !loading &&
      !catalogLoading
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    onFindRoutes({
      vehicleId: selectedVehicle.id,
      fuelPricePerLitre: Number.parseFloat(fuelPricePerLitre),
      selectedVehicle,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-semibold text-gray-900">Route Planner</h2>
          <p className="text-xs text-gray-500">Use a real vehicle record and today&apos;s local fuel price</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <LocationSearch
          label="Source Location"
          placeholder="Search for a location..."
          iconColor="text-emerald-500"
          onLocationSelect={onSetSource}
          existingLocation={source}
        />

        <LocationSearch
          label="Destination Location"
          placeholder="Search for a location..."
          iconColor="text-red-500"
          onLocationSelect={onSetDestination}
          existingLocation={dest}
        />

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-900">
          FAST now uses a free official vehicle fuel-economy dataset instead of generic mileage defaults.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Make</label>
            <select
              value={selectedMake}
              onChange={(e) => setSelectedMake(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            >
              {makes.map((make) => (
                <option key={make} value={make}>
                  {make}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Model</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            {models.map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Variant</label>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          >
            {vehicleOptions.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.label}
              </option>
            ))}
          </select>
        </div>

        {selectedVehicle && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Selected Vehicle</p>
            <p className="mt-1 text-xs text-gray-500">{selectedVehicle.label}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white border border-gray-200 p-2">
                <p className="text-lg font-bold text-gray-900">{selectedVehicle.city_kmpl}</p>
                <p className="text-xs text-gray-500">City km/l</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-2">
                <p className="text-lg font-bold text-gray-900">{selectedVehicle.highway_kmpl}</p>
                <p className="text-xs text-gray-500">Highway km/l</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-2">
                <p className="text-lg font-bold text-gray-900">{selectedVehicle.combined_kmpl}</p>
                <p className="text-xs text-gray-500">Combined km/l</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Fuel Price (per litre)</label>
          <div className="relative">
            <input
              type="number"
              min="0.1"
              step="0.01"
              value={fuelPricePerLitre}
              onChange={(e) => setFuelPricePerLitre(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-16 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="105.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              / litre
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter today&apos;s local pump price for the selected fuel type.
          </p>
        </div>

        {catalogError && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            {catalogError}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 disabled:shadow-none"
          >
            {loading ? (
              <>
                <span className="spinner-sm"></span>
                Calculating Routes...
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

        <div className="pt-3 mt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Status</span>
            <span className={`flex items-center gap-1.5 text-xs font-medium ${canSubmit ? "text-emerald-600" : "text-gray-400"}`}>
              <span className={`w-2 h-2 rounded-full ${canSubmit ? "bg-emerald-500" : "bg-gray-300"}`}></span>
              {catalogLoading ? "Loading vehicle catalog" : canSubmit ? "Ready to search" : "Select route, vehicle, and fuel price"}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
