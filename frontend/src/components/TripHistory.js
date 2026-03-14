"use client";

import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:8000";
const FUEL_PRICE = 105;

export default function TripHistory({ refreshKey }) {
  const [trips, setTrips] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/history`);
        setTrips(Array.isArray(res.data) ? res.data : res.data.trips || []);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [refreshKey]);

  return (
    <div className="card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <svg
            className="w-5 h-5 text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Trip History
          {trips.length > 0 && (
            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
              {trips.length}
            </span>
          )}
        </h2>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4">
          {loading ? (
            <div className="text-center py-6">
              <span className="spinner"></span>
              <p className="text-slate-500 text-sm mt-2">Loading history...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="w-12 h-12 text-slate-600 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-slate-500 text-sm">No trips saved yet</p>
              <p className="text-slate-600 text-xs mt-1">
                Find a route and save it to see it here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-[#334155]">
                    <th className="text-left py-2 px-3 font-medium">Date</th>
                    <th className="text-left py-2 px-3 font-medium">
                      From &rarr; To
                    </th>
                    <th className="text-left py-2 px-3 font-medium">Vehicle</th>
                    <th className="text-right py-2 px-3 font-medium">
                      Distance
                    </th>
                    <th className="text-right py-2 px-3 font-medium">
                      Fuel (L)
                    </th>
                    <th className="text-right py-2 px-3 font-medium">
                      Cost (&#x20B9;)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip, idx) => (
                    <tr
                      key={trip.id || idx}
                      className="border-b border-[#334155]/50 hover:bg-[#334155]/20 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-slate-400">
                        {trip.created_at
                          ? new Date(trip.created_at).toLocaleDateString()
                          : "--"}
                      </td>
                      <td className="py-2.5 px-3 text-white">
                        <span className="text-xs">
                          {trip.source_lat?.toFixed(2)},{" "}
                          {trip.source_lng?.toFixed(2)}
                        </span>
                        <span className="text-slate-500 mx-1">&rarr;</span>
                        <span className="text-xs">
                          {trip.dest_lat?.toFixed(2)},{" "}
                          {trip.dest_lng?.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 capitalize">
                        {trip.vehicle_type || "--"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {trip.distance_km?.toFixed(1) || "--"} km
                      </td>
                      <td className="py-2.5 px-3 text-right text-green-400 font-medium">
                        {trip.fuel_litres?.toFixed(2) || "--"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-300">
                        {trip.fuel_litres
                          ? (trip.fuel_litres * FUEL_PRICE).toFixed(0)
                          : "--"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
