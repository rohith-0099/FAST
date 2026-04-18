import { 
  Cloud, 
  Wind, 
  Droplets, 
  Truck, 
  Fuel, 
  Leaf, 
  Clock, 
  Navigation, 
  Zap,
  Info,
  Save
} from 'lucide-react';

function formatTime(minutes) {
  if (!minutes) return "N/A";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

function WeatherCard({ weather }) {
  if (!weather) return null;

  const weatherAvailable = !!weather.available;

  return (
    <div className="glass rounded-2xl p-4 border border-glass mb-4 overflow-hidden relative group">
      <div className="absolute -right-4 -top-4 text-accent-primary/5 group-hover:text-accent-primary/10 transition-colors">
        <Cloud size={100} />
      </div>
      <h3 className="text-sm font-semibold text-main mb-3 flex items-center gap-2">
        <Cloud className="text-status-info" size={16} />
        Route Weather
      </h3>
      <div className="grid grid-cols-3 gap-3 relative z-10">
        <div className="text-center bg-white/5 rounded-xl p-2">
          <p className="text-lg font-bold text-main">
            {weather.temperature_c ?? "--"}
            {weather.temperature_c !== null ? "°C" : ""}
          </p>
          <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-1">Temp</p>
        </div>
        <div className="text-center bg-white/5 rounded-xl p-2">
          <p className="text-lg font-bold text-main">
            {weather.wind_speed_kmh ?? "--"}
            {weather.wind_speed_kmh !== null ? " km/h" : ""}
          </p>
          <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-1">Wind</p>
        </div>
        <div className="text-center bg-white/5 rounded-xl p-2">
          <p className="text-lg font-bold text-main">
            {weather.precipitation_mm ?? "--"}
            {weather.precipitation_mm !== null ? " mm" : ""}
          </p>
          <p className="text-[10px] text-muted uppercase tracking-wider font-bold mt-1">Rain</p>
        </div>
      </div>
    </div>
  );
}

function VehicleCard({ vehicle, fuelPricePerLitre }) {
  if (!vehicle) return null;

  return (
    <div className="glass rounded-2xl p-4 border border-glass mb-4 relative overflow-hidden group">
      <div className="absolute -right-4 -top-4 text-accent-primary/5 group-hover:text-accent-primary/10 transition-colors">
        <Truck size={100} />
      </div>
      <h3 className="text-sm font-semibold text-main mb-3 flex items-center gap-2">
        <Fuel className="text-accent-primary" size={16} />
        Active Vehicle
      </h3>
      <div className="relative z-10">
        <p className="text-base font-bold text-main">{vehicle.label}</p>
        <p className="text-xs text-dim mt-0.5 capitalize">
          {vehicle.data_source.replace('_', ' ')} • {vehicle.fuel_type}
        </p>
        
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <p className="text-[10px] text-muted uppercase font-bold">Fuel Price</p>
            <p className="text-sm font-bold text-main">₹{fuelPricePerLitre?.toFixed(2)}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2.5 border border-white/5">
            <p className="text-[10px] text-muted uppercase font-bold">Mileage</p>
            <p className="text-sm font-bold text-accent-primary">{vehicle.combined_kmpl} km/l</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RouteResults({ routes, weather, vehicle, fuelPricePerLitre, onSaveTrip, loading }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="glass rounded-2xl h-32 border border-glass"></div>
        <div className="glass rounded-2xl h-24 border border-glass"></div>
        <div className="flex items-center justify-between px-1 my-2">
          <div className="h-4 w-32 bg-white/10 rounded"></div>
          <div className="h-4 w-16 bg-white/10 rounded"></div>
        </div>
        <div className="card !p-5 border-glass h-64"></div>
      </div>
    );
  }

  if (!routes || routes.length === 0) return null;

  return (
    <div className="space-y-4">
      <VehicleCard vehicle={vehicle} fuelPricePerLitre={fuelPricePerLitre} />
      <WeatherCard weather={weather} />

      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-main uppercase tracking-widest">Available Routes</h3>
        <span className="text-[10px] font-black text-accent-primary bg-accent-primary/10 px-2 py-0.5 rounded-md border border-accent-primary/20">
          {routes.length} OPTIONS
        </span>
      </div>

      {routes.map((route, idx) => {
        return (
          <div
            key={idx}
            className={`card !p-5 group ${
              route.is_fuel_efficient ? "border-accent-primary/40 glow" : "border-glass"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex flex-col gap-1">
                {route.is_fuel_efficient && (
                  <span className="badge badge-green self-start animate-pulse">
                    <Leaf size={12} />
                    Most Eco-Friendly
                  </span>
                )}
                {route.is_fastest && !route.is_fuel_efficient && (
                  <span className="badge badge-blue self-start">
                    <Zap size={12} />
                    Fastest Time
                  </span>
                )}
                <p className="text-xs text-dim font-medium mt-1">via {route.summary || 'Direct Route'}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-main">₹{route.fuel_cost?.toFixed(0)}</p>
                <p className="text-[10px] text-muted font-bold uppercase tracking-tighter">Est. Cost</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-white/5 rounded-2xl p-3 border border-white/5 text-center">
                <p className="text-xl font-bold text-main">{route.fuel_litres?.toFixed(2)}</p>
                <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Litres</p>
              </div>
              <div className="bg-accent-primary/10 rounded-2xl p-3 border border-accent-primary/20 text-center relative overflow-hidden">
                <Leaf className="absolute -right-2 -bottom-2 text-accent-primary/10" size={40} />
                <p className="text-xl font-bold text-accent-primary">{route.co2_kg?.toFixed(2)}</p>
                <p className="text-[10px] text-accent-primary font-bold uppercase tracking-widest">CO2 KG</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-xs mb-5 px-1">
              <div className="flex items-center gap-2">
                <Navigation className="text-dim" size={14} />
                <span className="text-dim">Distance:</span>
                <span className="text-main font-bold">{route.distance_km?.toFixed(1)} km</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-dim" size={14} />
                <span className="text-dim">Time:</span>
                <span className="text-main font-bold">{formatTime(route.duration_min)}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-status-info" />
                <span className="text-dim">Type:</span>
                <span className="text-main font-bold capitalize">{route.road_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                <span className="text-dim">Eco:</span>
                <span className="text-main font-bold">{route.effective_kmpl?.toFixed(1)} km/l</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onSaveTrip(route)}
                className="flex-1 py-3 px-4 bg-accent-primary text-slate-900 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] glow flex items-center justify-center gap-2"
              >
                <Save size={16} />
                Save Journey
              </button>
              <button className="w-12 h-12 glass rounded-xl flex items-center justify-center text-dim hover:text-main transition-colors border-glass">
                <Info size={18} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
