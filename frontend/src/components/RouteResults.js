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
      label: "Lowest Fuel Use",
      className: "badge badge-green",
    };
  }
  if (route.is_fastest) {
    return {
      label: "Fastest",
      className: "badge badge-blue",
    };
  }
  return {
    label: "Alternative",
    className: "badge badge-orange",
  };
}

function WeatherCard({ weather }) {
  if (!weather) return null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
        </svg>
        Current Weather
      </h3>
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{weather.temperature_c ?? "--"}°C</p>
          <p className="text-xs text-gray-500 mt-0.5">Temperature</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{weather.wind_speed_kmh ?? "--"} km/h</p>
          <p className="text-xs text-gray-500 mt-0.5">Wind</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{weather.precipitation_mm ?? "0"} mm</p>
          <p className="text-xs text-gray-500 mt-0.5">Precipitation</p>
        </div>
      </div>
    </div>
  );
}

function VehicleCard({ vehicle, fuelPricePerLitre }) {
  if (!vehicle) return null;

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100 mb-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V5a2 2 0 012-2h2a2 2 0 012 2v12m-6 0h6m-6 0H7a2 2 0 00-2 2v1h14v-1a2 2 0 00-2-2h-2" />
        </svg>
        Official Vehicle Record
      </h3>
      <p className="text-sm text-gray-800 font-medium">{vehicle.label}</p>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="bg-white/70 rounded-lg p-2.5 border border-emerald-100">
          <p className="text-xs text-gray-500">Fuel Type</p>
          <p className="font-semibold text-gray-900">{vehicle.fuel_type}</p>
        </div>
        <div className="bg-white/70 rounded-lg p-2.5 border border-emerald-100">
          <p className="text-xs text-gray-500">Fuel Price Used</p>
          <p className="font-semibold text-gray-900">{fuelPricePerLitre?.toFixed(2) ?? "--"} / litre</p>
        </div>
        <div className="bg-white/70 rounded-lg p-2.5 border border-emerald-100">
          <p className="text-xs text-gray-500">Official City</p>
          <p className="font-semibold text-gray-900">{vehicle.city_kmpl} km/l</p>
        </div>
        <div className="bg-white/70 rounded-lg p-2.5 border border-emerald-100">
          <p className="text-xs text-gray-500">Official Highway</p>
          <p className="font-semibold text-gray-900">{vehicle.highway_kmpl} km/l</p>
        </div>
      </div>
    </div>
  );
}

export default function RouteResults({ routes, weather, vehicle, fuelPricePerLitre, onSaveTrip }) {
  if (!routes || routes.length === 0) return null;

  return (
    <div className="space-y-4">
      <VehicleCard vehicle={vehicle} fuelPricePerLitre={fuelPricePerLitre} />
      <WeatherCard weather={weather} />

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Available Routes</h3>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {routes.length} routes found
        </span>
      </div>

      {routes.map((route, idx) => {
        const badge = getRouteBadge(route);

        return (
          <div
            key={idx}
            className={`bg-white rounded-xl border-2 p-4 transition-all ${
              route.is_fuel_efficient
                ? "border-emerald-500 shadow-md shadow-emerald-500/10"
                : "border-gray-200 hover:border-gray-300 hover:shadow-md"
            }`}
          >
            <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full mb-3 ${badge.className}`}>
              {badge.label}
            </span>

            {route.summary && (
              <p className="text-sm text-gray-600 mb-3 font-medium">via {route.summary}</p>
            )}

            <div className="text-center py-4 mb-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border border-emerald-100">
              <p className="text-3xl font-bold text-gray-900">
                {route.fuel_litres?.toFixed(2) ?? "--"}
                <span className="text-sm font-normal text-gray-500 ml-1">litres</span>
              </p>
              <p className="text-xl font-semibold text-emerald-600 mt-1">
                {route.fuel_cost?.toFixed(2) ?? "--"}
              </p>
              <p className="text-xs text-gray-500 mt-1">Estimated cost at your entered fuel price</p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <span className="text-xs">Distance</span>
                </div>
                <p className="text-gray-900 font-semibold">{route.distance_km?.toFixed(1)} km</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs">Duration</span>
                </div>
                <p className="text-gray-900 font-semibold">{formatTime(route.duration_min)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <span className="text-xs">Road Type</span>
                </div>
                <p className="text-gray-900 font-semibold capitalize">{route.road_type}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-xs">Route Efficiency</span>
                </div>
                <p className="text-gray-900 font-semibold">{route.effective_kmpl?.toFixed(2)} km/l</p>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs text-gray-600 mb-3">
              {route.estimation_method}
            </div>

            {route.is_fuel_efficient && (
              <button
                onClick={() => onSaveTrip(route)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Save This Route
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
