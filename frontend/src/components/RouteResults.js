"use client";

function formatTime(minutes) {
  if (!minutes) return "N/A";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function getRouteBadge(route) {
  if (route.is_fuel_efficient) {
    return {
      label: "Most Fuel Efficient",
      className: "bg-green-500/20 text-green-400 border-green-500/30",
    };
  }
  if (route.is_fastest) {
    return {
      label: "Fastest",
      className: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };
  }
  return {
    label: "Alternative",
    className: "bg-slate-500/20 text-slate-400 border-slate-500/30",
  };
}

function WeatherCard({ weather }) {
  if (!weather) return null;

  return (
    <div className="card mb-4 bg-gradient-to-br from-[#1e293b] to-[#1e293b]/80">
      <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        Live Weather Conditions
      </h3>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-lg font-bold text-white">
            {weather.temperature_c ?? "--"}&deg;C
          </p>
          <p className="text-xs text-slate-500">Temperature</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">
            {weather.wind_speed_kmh ?? "--"} km/h
          </p>
          <p className="text-xs text-slate-500">Wind</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">
            {weather.precipitation_mm ?? "0"} mm
          </p>
          <p className="text-xs text-slate-500">Rain</p>
        </div>
      </div>
    </div>
  );
}

export default function RouteResults({ routes, weather, onSaveTrip }) {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="space-y-4">
      <WeatherCard weather={weather} />

      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
        Routes Found ({routes.length})
      </h3>

      {routes.map((route, idx) => {
        const badge = getRouteBadge(route);

        return (
          <div
            key={idx}
            className={`card ${
              route.is_fuel_efficient
                ? "border-green-500/40 shadow-lg shadow-green-500/5"
                : ""
            }`}
          >
            {/* Badge */}
            <span
              className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border mb-3 ${badge.className}`}
            >
              {badge.label}
            </span>

            {/* Route summary */}
            {route.summary && (
              <p className="text-sm text-slate-300 mb-3 font-medium">
                via {route.summary}
              </p>
            )}

            {/* Fuel - prominent */}
            <div className="text-center py-3 mb-3 bg-[#0f172a] rounded-lg">
              <p className="text-3xl font-bold text-white">
                {route.fuel_litres?.toFixed(2) ?? "--"}
                <span className="text-base font-normal text-slate-400 ml-1">
                  litres
                </span>
              </p>
              <p className="text-lg font-semibold text-green-400 mt-1">
                &#x20B9;{route.fuel_cost_inr?.toFixed(0) ?? "--"}
              </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-500 text-xs">Distance</p>
                <p className="text-white font-medium">
                  {route.distance_km?.toFixed(1)} km
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Time</p>
                <p className="text-white font-medium">
                  {formatTime(route.duration_min)}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Road Type</p>
                <p className="text-white font-medium capitalize">
                  {route.road_type}
                </p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">Avg Speed</p>
                <p className="text-white font-medium">
                  {route.avg_speed_kmh?.toFixed(0)} km/h
                </p>
              </div>
            </div>

            {/* Save button */}
            {route.is_fuel_efficient && (
              <button
                onClick={() => onSaveTrip(route)}
                className="w-full mt-4 py-2 px-4 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 rounded-lg text-sm font-medium transition-colors"
              >
                Save This Trip
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
