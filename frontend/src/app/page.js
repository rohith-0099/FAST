"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import axios from "axios";
import RouteForm from "@/components/RouteForm";
import RouteResults from "@/components/RouteResults";
import TripHistory from "@/components/TripHistory";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const API_BASE = "http://localhost:8000";

export default function Home() {
  const [source, setSource] = useState(null);
  const [destination, setDestination] = useState(null);
  const [routes, setRoutes] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);
  const vehicleRef = useRef({ type: "car", mileage: 15 });

  const handleFindRoutes = useCallback(
    async (vehicleType, mileage) => {
      if (!source || !destination) return;
      setLoading(true);
      setRoutes(null);
      setWeather(null);
      // Store for save-trip later
      vehicleRef.current = { type: vehicleType.toLowerCase(), mileage };
      try {
        const res = await axios.post(`${API_BASE}/api/routes`, {
          source_lat: source.lat,
          source_lng: source.lng,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
          vehicle_type: vehicleType.toLowerCase(),
          mileage_kmpl: mileage,
        });
        setRoutes(res.data.routes);
        setWeather(res.data.weather);
      } catch (err) {
        console.error("Error fetching routes:", err);
        alert(
          err.response?.data?.detail ||
            "Failed to fetch routes. Make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    },
    [source, destination]
  );

  const handleSaveTrip = useCallback(
    async (route) => {
      try {
        await axios.post(`${API_BASE}/api/save-trip`, {
          source_lat: source.lat,
          source_lng: source.lng,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
          vehicle_type: vehicleRef.current.type,
          mileage: vehicleRef.current.mileage,
          distance_km: route.distance_km,
          fuel_litres: route.fuel_litres,
          route_name: route.summary || "",
        });
        setRefreshHistory((prev) => prev + 1);
        alert("Trip saved successfully!");
      } catch (err) {
        console.error("Error saving trip:", err);
        alert("Failed to save trip.");
      }
    },
    [source, destination]
  );

  const handleClear = useCallback(() => {
    setSource(null);
    setDestination(null);
    setRoutes(null);
    setWeather(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a]">
      {/* Header */}
      <header className="border-b border-[#334155] bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                FAST
              </h1>
              <p className="text-xs text-slate-400">
                Fuel Aware Smart Travel
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-400 hidden sm:block">
            AI-Powered Fuel Estimation
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar */}
          <div className="w-full lg:w-[350px] flex-shrink-0 space-y-6">
            <RouteForm
              source={source}
              dest={destination}
              onFindRoutes={handleFindRoutes}
              onClear={handleClear}
              loading={loading}
              onSetSource={setSource}
              onSetDestination={setDestination}
            />
            {routes && (
              <RouteResults
                routes={routes}
                weather={weather}
                onSaveTrip={handleSaveTrip}
              />
            )}
          </div>

          {/* Map area */}
          <div className="flex-1 min-w-0">
            <div className="map-container">
              <Map
                source={source}
                destination={destination}
                routes={routes}
                onSetSource={setSource}
                onSetDestination={setDestination}
              />
            </div>
            <div className="mt-2 flex items-center gap-6 text-xs text-slate-500 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-green-500 inline-block rounded"></span>
                Fuel Efficient
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-blue-500 inline-block rounded"></span>
                Fastest
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-gray-500 inline-block rounded"></span>
                Alternative
              </span>
              <span className="ml-auto">Search or click map to set points</span>
            </div>
          </div>
        </div>

        {/* Trip History */}
        <div className="mt-8">
          <TripHistory refreshKey={refreshHistory} />
        </div>
      </main>
    </div>
  );
}
