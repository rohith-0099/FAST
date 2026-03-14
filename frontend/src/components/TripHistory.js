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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-left">
            <h2 className="text-base font-semibold text-gray-900">Trip History</h2>
            <p className="text-xs text-gray-500">View your past trips</p>
          </div>
          {trips.length > 0 && (
            <span className="ml-2 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              {trips.length} trips
            </span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-5 pb-5">
          {loading ? (
            <div className="text-center py-8">
              <span className="spinner"></span>
              <p className="text-gray-500 text-sm mt-3">Loading history...</p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">No trips saved yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Find a route and save it to see it here
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-5 font-medium">Date</th>
                    <th className="text-left py-3 px-5 font-medium">Route</th>
                    <th className="text-left py-3 px-5 font-medium">Vehicle</th>
                    <th className="text-right py-3 px-5 font-medium">Distance</th>
                    <th className="text-right py-3 px-5 font-medium">Fuel</th>
                    <th className="text-right py-3 px-5 font-medium">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip, idx) => (
                    <tr
                      key={trip.id || idx}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-5 text-gray-600">
                        {trip.created_at
                          ? new Date(trip.created_at).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })
                          : "--"}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-emerald-600 font-medium">
                            {trip.source_lat?.toFixed(2)}, {trip.source_lng?.toFixed(2)}
                          </span>
                          <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                          <span className="text-red-600 font-medium">
                            {trip.dest_lat?.toFixed(2)}, {trip.dest_lng?.toFixed(2)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-5 text-gray-700 capitalize">
                        {trip.vehicle_type || "--"}
                      </td>
                      <td className="py-3 px-5 text-right text-gray-700">
                        {trip.distance_km?.toFixed(1) || "--"} km
                      </td>
                      <td className="py-3 px-5 text-right text-emerald-600 font-semibold">
                        {trip.fuel_litres?.toFixed(2) || "--"} L
                      </td>
                      <td className="py-3 px-5 text-right text-gray-900 font-semibold">
                        ₹{trip.fuel_litres
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
