"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import RouteForm from "@/components/RouteForm";
import RouteResults from "@/components/RouteResults";
import TripHistory from "@/components/TripHistory";
import LoadingOverlay from "@/components/LoadingOverlay";
import VehicleComparison from "@/components/VehicleComparison";

export default function Home() {
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [weather, setWeather] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [fuelPricePerLitre, setFuelPricePerLitre] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const [activeTab, setActiveTab] = useState("plan");
  const [theme, setTheme] = useState("dark");
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("fast:theme") || "dark";
    const savedTab = window.localStorage.getItem("fast:active-tab") || "plan";
    setTheme(savedTheme);
    setActiveTab(savedTab);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    window.localStorage.setItem("fast:theme", newTheme);
  }, [theme]);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    window.localStorage.setItem("fast:active-tab", tab);
  }, []);

  const handleFindRoutes = useCallback(
    async ({ vehicleSource, vehicleId, fuelPricePerLitre: enteredFuelPrice, manualVehicle, waypoints }) => {
      if (!source || !destination) return;
      setLoading(true);
      setRoutes(null);
      setWeather(null);
      try {
        const res = await axios.post(`${API_BASE}/api/routes`, {
          source_lat: source.lat,
          source_lng: source.lng,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
          waypoints: (waypoints || []).map(wp => ({ lat: wp.lat, lng: wp.lng })),
          vehicle_source: vehicleSource,
          vehicle_id: vehicleId,
          manual_vehicle: manualVehicle,
          fuel_price_per_litre: enteredFuelPrice,
        });
        setRoutes(res.data.routes);
        setWeather(res.data.weather);
        setVehicle(res.data.vehicle || null);
        setFuelPricePerLitre(res.data.fuel_price_per_litre ?? enteredFuelPrice);
      } catch (err) {
        console.error("Error fetching routes:", err);
        showToast(
          err.response?.data?.detail || "Failed to fetch routes. Ensure backend is online.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    },
    [source, destination]
  );

  const handleSaveTrip = useCallback(
    async (route) => {
      if (!source || !destination || !vehicle) return;

      try {
        await axios.post(`${API_BASE}/api/save-trip`, {
          source_name: source.displayName || "",
          dest_name: destination.displayName || "",
          source_lat: source.lat,
          source_lng: source.lng,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
          vehicle_type: vehicle.vehicle_class || vehicle.fuel_type || "",
          mileage: vehicle.combined_kmpl,
          distance_km: route.distance_km,
          fuel_litres: route.fuel_litres,
          route_name: route.summary || "",
          vehicle_id: vehicle.id,
          vehicle_label: vehicle.label,
          vehicle_year: vehicle.year,
          vehicle_make: vehicle.make,
          vehicle_model: vehicle.model,
          fuel_type: vehicle.fuel_type,
          city_kmpl: vehicle.city_kmpl,
          highway_kmpl: vehicle.highway_kmpl,
          combined_kmpl: vehicle.combined_kmpl,
          fuel_price_per_litre: fuelPricePerLitre,
          estimated_cost: route.fuel_cost,
          estimation_method: route.estimation_method,
          vehicle_data_source: vehicle.data_source || "",
          source_note: vehicle.data_source_note || "",
        });
        setRefreshHistory((prev) => prev + 1);
        showToast("Trip saved successfully!", "success");
      } catch (err) {
        console.error("Error saving trip:", err);
        showToast("Failed to save trip.", "error");
      }
    },
    [destination, fuelPricePerLitre, source, vehicle]
  );

  const handleClear = useCallback(() => {
    setSource(null);
    setDestination(null);
    setRoutes(null);
    setWeather(null);
    setVehicle(null);
    setFuelPricePerLitre(null);
  }, []);

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-6 py-3 rounded-2xl shadow-premium border backdrop-blur-md animate-in slide-in-from-top-4 duration-300 font-bold ${
          toast.type === 'success' ? 'bg-accent-primary/20 text-accent-primary border-accent-primary/50' : 'bg-status-error/20 text-status-error border-status-error/50'
        }`}>
          {toast.message}
        </div>
      )}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        theme={theme} 
        toggleTheme={toggleTheme} 
      />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {activeTab === 'plan' && (
          <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-main tracking-tight">Trip Planner</h2>
                <p className="text-dim mt-1">Plan your efficient journey across multi-stage routes</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="glass px-4 py-2 rounded-xl flex items-center gap-2 text-sm text-main">
                  <div className="w-2 h-2 rounded-full bg-accent-primary glow" />
                  Live Fuel Estimation
                </div>
              </div>
            </header>

            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-[450px] flex-shrink-0 space-y-6">
                <RouteForm
                  source={source}
                  dest={destination}
                  onFindRoutes={handleFindRoutes}
                  onClear={handleClear}
                  loading={loading}
                  onSetSource={setSource}
                  onSetDestination={setDestination}
                />
                
                {(loading || routes) && (
                  <RouteResults
                    loading={loading}
                    routes={routes}
                    weather={weather}
                    vehicle={vehicle}
                    fuelPricePerLitre={fuelPricePerLitre}
                    onSaveTrip={handleSaveTrip}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-6">
                <div className="glass rounded-[32px] overflow-hidden border border-glass shadow-premium relative">
                  <div className="absolute top-4 left-4 z-[1000] glass px-4 py-2 rounded-2xl flex items-center gap-2 text-xs font-semibold text-main border border-glass">
                    <MapIcon size={14} className="text-accent-primary" />
                    Interactive Trip Map
                  </div>
                  <div className="map-container !h-[70vh] !rounded-none !border-none">
                    <Map
                      source={source}
                      destination={destination}
                      routes={routes}
                      onSetSource={setSource}
                      onSetDestination={setDestination}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6 justify-center bg-white/5 py-4 px-6 rounded-2xl border border-glass">
                  <span className="flex items-center gap-2 text-xs font-medium text-dim">
                    <span className="w-4 h-1 bg-accent-primary rounded-full glow"></span>
                    FUEL EFFICIENT
                  </span>
                  <span className="flex items-center gap-2 text-xs font-medium text-dim">
                    <span className="w-4 h-1 bg-status-info rounded-full"></span>
                    FASTEST
                  </span>
                  <span className="flex items-center gap-2 text-xs font-medium text-dim">
                    <span className="w-4 h-1 bg-slate-500 rounded-full"></span>
                    ALTERNATIVE
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-7xl mx-auto animate-fade-in">
            <header className="mb-8">
              <h2 className="text-3xl font-bold text-main tracking-tight">Travel History</h2>
              <p className="text-dim mt-1">Review and manage your past fuel-efficient trips</p>
            </header>
            <div className="glass rounded-3xl p-6 border border-glass">
              <TripHistory refreshKey={refreshHistory} />
            </div>
          </div>
        )}

        {activeTab === 'compare' && (
          <div className="max-w-7xl mx-auto flex flex-col items-center justify-center pt-[5vh] animate-fade-in">
            <VehicleComparison />
          </div>
        )}
      </main>
    </div>
  );
}
