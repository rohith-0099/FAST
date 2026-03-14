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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/25">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                FAST
              </h1>
              <p className="text-xs text-gray-500">
                Fuel Aware Smart Travel
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI-Powered Route Planning
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left sidebar */}
          <div className="w-full lg:w-[380px] flex-shrink-0 space-y-6">
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">Route Map</span>
                </div>
                <span className="text-xs text-gray-500">Click on map or search to set points</span>
              </div>
              <div className="map-container">
                <Map
                  source={source}
                  destination={destination}
                  routes={routes}
                  onSetSource={setSource}
                  onSetDestination={setDestination}
                />
              </div>
            </div>
            
            {/* Legend */}
            <div className="mt-3 flex items-center gap-6 text-xs text-gray-500">
              <span className="flex items-center gap-2">
                <span className="w-4 h-1 bg-emerald-500 rounded-full"></span>
                Fuel Efficient
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-1 bg-blue-500 rounded-full"></span>
                Fastest
              </span>
              <span className="flex items-center gap-2">
                <span className="w-4 h-1 bg-gray-400 rounded-full"></span>
                Alternative
              </span>
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
