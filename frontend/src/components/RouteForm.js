"use client";

import { useEffect, useMemo, useState } from "react";
import LocationSearch from "./LocationSearch";
import { API_BASE } from "@/lib/api";

const DEFAULT_FUEL_PRICE = "";
const MANUAL_VEHICLE_TYPE_OPTIONS = [
  "Bike",
  "Scooter",
  "Moped",
  "Car",
  "Van",
  "Truck",
  "Bus",
  "Auto Rickshaw",
  "Custom",
];
const MANUAL_FUEL_TYPE_OPTIONS = ["Petrol", "Diesel"];

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
  const [vehicleSource, setVehicleSource] = useState("manual_profile");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [fuelPricePerLitre, setFuelPricePerLitre] = useState(DEFAULT_FUEL_PRICE);
  const [manualVehicleType, setManualVehicleType] = useState("");
  const [manualVehicleLabel, setManualVehicleLabel] = useState("");
  const [manualFuelType, setManualFuelType] = useState("");
  const [manualCombinedKmpl, setManualCombinedKmpl] = useState("");
  const [manualCityKmpl, setManualCityKmpl] = useState("");
  const [manualHighwayKmpl, setManualHighwayKmpl] = useState("");
  const [showAdvancedMileage, setShowAdvancedMileage] = useState(false);
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
    if (fuelPricePerLitre) {
      window.localStorage.setItem("fast:fuel-price-per-litre", fuelPricePerLitre);
      return;
    }
    window.localStorage.removeItem("fast:fuel-price-per-litre");
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

  const manualVehiclePreview = useMemo(
    () =>
      manualVehicleLabel
        ? {
            label: manualVehicleLabel,
            fuel_type: manualFuelType,
            vehicle_class: manualVehicleType,
            city_kmpl: manualCityKmpl || manualCombinedKmpl || "--",
            highway_kmpl: manualHighwayKmpl || manualCombinedKmpl || "--",
            combined_kmpl: manualCombinedKmpl || "--",
          }
        : null,
    [
      manualCombinedKmpl,
      manualCityKmpl,
      manualFuelType,
      manualHighwayKmpl,
      manualVehicleLabel,
      manualVehicleType,
    ]
  );

  const officialReady = Boolean(
    source && dest && selectedVehicle && Number.parseFloat(fuelPricePerLitre) > 0 && !loading && !catalogLoading
  );

  const manualReady = Boolean(
    source &&
      dest &&
      manualVehicleType &&
      manualVehicleLabel.trim() &&
      manualFuelType &&
      Number.parseFloat(manualCombinedKmpl) > 0 &&
      Number.parseFloat(fuelPricePerLitre) > 0 &&
      !loading
  );

  const canSubmit = vehicleSource === "official_catalog" ? officialReady : manualReady;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (vehicleSource === "official_catalog") {
      if (!selectedVehicle) return;

      onFindRoutes({
        vehicleSource,
        vehicleId: selectedVehicle.id,
        fuelPricePerLitre: Number.parseFloat(fuelPricePerLitre),
      });
      return;
    }

    onFindRoutes({
      vehicleSource,
      fuelPricePerLitre: Number.parseFloat(fuelPricePerLitre),
      manualVehicle: {
        vehicle_type: manualVehicleType,
        vehicle_label: manualVehicleLabel.trim(),
        fuel_type: manualFuelType,
        combined_kmpl: Number.parseFloat(manualCombinedKmpl),
        city_kmpl: manualCityKmpl ? Number.parseFloat(manualCityKmpl) : null,
        highway_kmpl: manualHighwayKmpl ? Number.parseFloat(manualHighwayKmpl) : null,
      },
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
          <p className="text-xs text-gray-500">Use a real vehicle record and enter today&apos;s local fuel price</p>
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
          FAST supports two honest paths: a free official car/light-vehicle catalog, and a manual real-vehicle
          profile for bikes, scooters, trucks, buses, and other India-heavy segments.
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setVehicleSource("manual_profile")}
            className={`rounded-xl border px-4 py-3 text-left transition-all ${
              vehicleSource === "manual_profile"
                ? "border-emerald-500 bg-emerald-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900">Manual Real Vehicle</p>
            <p className="text-xs text-gray-500 mt-1">Best for India bikes, scooters, buses, and trucks</p>
          </button>
          <button
            type="button"
            onClick={() => setVehicleSource("official_catalog")}
            className={`rounded-xl border px-4 py-3 text-left transition-all ${
              vehicleSource === "official_catalog"
                ? "border-blue-500 bg-blue-50 shadow-sm"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <p className="text-sm font-semibold text-gray-900">Free Official Catalog</p>
            <p className="text-xs text-gray-500 mt-1">Cars and light vehicles from the structured dataset</p>
          </button>
        </div>

        {vehicleSource === "official_catalog" ? (
          <>
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
          </>
        ) : (
          <>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-900">
              Required for calculation: vehicle type, vehicle name, fuel type, combined mileage, and fuel price.
              City and highway mileage are optional extras if you know them.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
                <select
                  value={manualVehicleType}
                  onChange={(e) => setManualVehicleType(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">Select vehicle type</option>
                  {MANUAL_VEHICLE_TYPE_OPTIONS.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Fuel Type</label>
                <select
                  value={manualFuelType}
                  onChange={(e) => setManualFuelType(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  <option value="">Select fuel type</option>
                  {MANUAL_FUEL_TYPE_OPTIONS.map((fuelType) => (
                    <option key={fuelType} value={fuelType}>
                      {fuelType}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Name / Model</label>
              <input
                type="text"
                value={manualVehicleLabel}
                onChange={(e) => setManualVehicleLabel(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Example: Honda Activa 125, Tata Prima 3530, Ashok Leyland Bus"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Combined Mileage (km/l)</label>
              <input
                type="number"
                min="0.1"
                step="0.01"
                value={manualCombinedKmpl}
                onChange={(e) => setManualCombinedKmpl(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Required"
              />
              <p className="mt-1 text-xs text-gray-500">
                Use your real average mileage from the manufacturer, your records, or fleet data.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <button
                type="button"
                onClick={() => setShowAdvancedMileage((prev) => !prev)}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">Advanced Mileage Details</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: enter city and highway mileage if you know them.
                  </p>
                </div>
                <span className="text-xs text-emerald-600 font-medium">
                  {showAdvancedMileage ? "Hide" : "Show"}
                </span>
              </button>

              {showAdvancedMileage && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">City km/l</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.01"
                      value={manualCityKmpl}
                      onChange={(e) => setManualCityKmpl(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Highway km/l</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.01"
                      value={manualHighwayKmpl}
                      onChange={(e) => setManualHighwayKmpl(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="Optional"
                    />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {(vehicleSource === "official_catalog" ? selectedVehicle : manualVehiclePreview) && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">Selected Vehicle</p>
            <p className="mt-1 text-xs text-gray-500">
              {(vehicleSource === "official_catalog" ? selectedVehicle : manualVehiclePreview).label}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-white border border-gray-200 p-2">
                <p className="text-lg font-bold text-gray-900">
                  {(vehicleSource === "official_catalog" ? selectedVehicle : manualVehiclePreview).city_kmpl}
                </p>
                <p className="text-xs text-gray-500">City km/l</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-2">
                <p className="text-lg font-bold text-gray-900">
                  {(vehicleSource === "official_catalog" ? selectedVehicle : manualVehiclePreview).highway_kmpl}
                </p>
                <p className="text-xs text-gray-500">Highway km/l</p>
              </div>
              <div className="rounded-lg bg-white border border-gray-200 p-2">
                <p className="text-lg font-bold text-gray-900">
                  {(vehicleSource === "official_catalog" ? selectedVehicle : manualVehiclePreview).combined_kmpl}
                </p>
                <p className="text-xs text-gray-500">Combined km/l</p>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Fuel Price Today (per litre)</label>
          <div className="relative">
            <input
              type="number"
              min="0.1"
              step="0.01"
              value={fuelPricePerLitre}
              onChange={(e) => setFuelPricePerLitre(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2.5 pr-16 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              placeholder="Enter today&apos;s price"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">
              / litre
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Required. Enter today&apos;s local pump price for the selected fuel type.
          </p>
        </div>

        {vehicleSource === "official_catalog" && catalogError && (
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
              {vehicleSource === "official_catalog" && catalogLoading
                ? "Loading vehicle catalog"
                : canSubmit
                  ? "Ready to search"
                  : "Select route, vehicle, and fuel price"}
            </span>
          </div>
        </div>
      </form>
    </div>
  );
}
