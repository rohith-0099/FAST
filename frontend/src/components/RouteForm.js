import { 
  MapPin, 
  Navigation2, 
  Fuel, 
  Truck, 
  Car, 
  ChevronDown, 
  ChevronUp, 
  Plus, 
  Minus,
  Search,
  RotateCcw,
  Zap,
  Info,
  Droplets
} from 'lucide-react';

const DEFAULT_FUEL_PRICE = "";
const MANUAL_VEHICLE_TYPE_OPTIONS = [
  "Bike", "Scooter", "Moped", "Car", "Van", "Truck", "Bus", "Auto Rickshaw", "Custom"
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
  const [waypoints, setWaypoints] = useState([]);
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
    if (savedFuelPrice) setFuelPricePerLitre(savedFuelPrice);

    let cancelled = false;
    async function loadYears() {
      setCatalogLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/vehicles/years`);
        const data = await res.json();
        if (!cancelled && data.years?.length) {
          setYears(data.years);
          setSelectedYear(String(data.years[0]));
        }
      } catch (error) {
        if (!cancelled) setCatalogError("Catalog link broken.");
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    }
    loadYears();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (fuelPricePerLitre) {
      window.localStorage.setItem("fast:fuel-price-per-litre", fuelPricePerLitre);
    } else {
      window.localStorage.removeItem("fast:fuel-price-per-litre");
    }
  }, [fuelPricePerLitre]);

  // Catalog loading effects... (standard logic)
  useEffect(() => {
    if (!selectedYear) return;
    let cancelled = false;
    async function loadMakes() {
      setCatalogLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/vehicles/makes?year=${encodeURIComponent(selectedYear)}`);
        const data = await res.json();
        if (!cancelled && data.makes?.length) {
          setMakes(data.makes);
          setSelectedMake(data.makes[0]);
        }
      } finally { if (!cancelled) setCatalogLoading(false); }
    }
    loadMakes();
    return () => { cancelled = true; };
  }, [selectedYear]);

  useEffect(() => {
    if (!selectedYear || !selectedMake) return;
    let cancelled = false;
    async function loadModels() {
      setCatalogLoading(true);
      try {
        const params = new URLSearchParams({ year: selectedYear, make: selectedMake });
        const res = await fetch(`${API_BASE}/api/vehicles/models?${params.toString()}`);
        const data = await res.json();
        if (!cancelled && data.models?.length) {
          setModels(data.models);
          setSelectedModel(data.models[0]);
        }
      } finally { if (!cancelled) setCatalogLoading(false); }
    }
    loadModels();
    return () => { cancelled = true; };
  }, [selectedYear, selectedMake]);

  useEffect(() => {
    if (!selectedYear || !selectedMake || !selectedModel) return;
    let cancelled = false;
    async function loadOptions() {
      setCatalogLoading(true);
      try {
        const params = new URLSearchParams({ year: selectedYear, make: selectedMake, model: selectedModel });
        const res = await fetch(`${API_BASE}/api/vehicles/options?${params.toString()}`);
        const data = await res.json();
        if (!cancelled && data.vehicles?.length) {
          setVehicleOptions(data.vehicles);
          setSelectedVehicleId(String(data.vehicles[0].id));
        }
      } finally { if (!cancelled) setCatalogLoading(false); }
    }
    loadOptions();
    return () => { cancelled = true; };
  }, [selectedYear, selectedMake, selectedModel]);

  const selectedVehicle = useMemo(
    () => vehicleOptions.find((v) => String(v.id) === String(selectedVehicleId)) || null,
    [selectedVehicleId, vehicleOptions]
  );

  const addWaypoint = () => {
    if (waypoints.length < 5) setWaypoints([...waypoints, null]);
  };

  const removeWaypoint = (index) => {
    const next = [...waypoints];
    next.splice(index, 1);
    setWaypoints(next);
  };

  const updateWaypoint = (index, loc) => {
    const next = [...waypoints];
    next[index] = loc;
    setWaypoints(next);
  };

  const canSubmit = useMemo(() => {
    const baseReady = source && dest && Number.parseFloat(fuelPricePerLitre) > 0;
    if (!baseReady) return false;
    if (vehicleSource === "official_catalog") return !!selectedVehicle;
    return manualVehicleType && manualVehicleLabel.trim() && manualFuelType && Number.parseFloat(manualCombinedKmpl) > 0;
  }, [source, dest, fuelPricePerLitre, vehicleSource, selectedVehicle, manualVehicleType, manualVehicleLabel, manualFuelType, manualCombinedKmpl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      vehicleSource,
      fuelPricePerLitre: Number.parseFloat(fuelPricePerLitre),
      waypoints: waypoints.filter(wp => !!wp),
    };

    if (vehicleSource === "official_catalog") {
      payload.vehicleId = selectedVehicle.id;
    } else {
      payload.manualVehicle = {
        vehicle_type: manualVehicleType,
        vehicle_label: manualVehicleLabel.trim(),
        fuel_type: manualFuelType,
        combined_kmpl: Number.parseFloat(manualCombinedKmpl),
        city_kmpl: manualCityKmpl ? Number.parseFloat(manualCityKmpl) : null,
        highway_kmpl: manualHighwayKmpl ? Number.parseFloat(manualHighwayKmpl) : null,
      };
    }

    onFindRoutes(payload);
  };

  return (
    <div className="card !p-6 space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-accent-primary flex items-center justify-center text-slate-900 glow shadow-lg shadow-accent-primary/20">
          <Navigation2 size={24} fill="currentColor" />
        </div>
        <div>
          <h2 className="text-xl font-black text-main uppercase tracking-tight">Route Planner</h2>
          <p className="text-[10px] text-muted font-bold uppercase tracking-widest">Intelligent Multi-Stop Routing</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <LocationSearch
            label="Source"
            placeholder="Starting point..."
            iconColor="text-accent-primary"
            onLocationSelect={onSetSource}
            existingLocation={source}
          />

          {waypoints.map((wp, idx) => (
            <div key={idx} className="relative group animate-fade-in">
              <LocationSearch
                label={`Stop ${idx + 1}`}
                placeholder="Intermediate stop..."
                iconColor="text-status-info"
                onLocationSelect={(loc) => updateWaypoint(idx, loc)}
                existingLocation={wp}
              />
              <button
                type="button"
                onClick={() => removeWaypoint(idx)}
                className="absolute -right-2 top-8 w-6 h-6 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-all scale-0 group-hover:scale-100 shadow-lg"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
            </div>
          ))}

          <LocationSearch
            label="Destination"
            placeholder="Final destination..."
            iconColor="text-red-500"
            onLocationSelect={onSetDestination}
            existingLocation={dest}
          />

          <button
            type="button"
            onClick={addWaypoint}
            className="w-full py-2 border border-dashed border-glass rounded-xl text-[10px] font-black text-muted uppercase tracking-widest hover:border-accent-primary/40 hover:text-accent-primary transition-all flex items-center justify-center gap-2 group"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform" />
            Add Interim Stop
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex p-1 glass rounded-2xl border border-glass">
            <button
              type="button"
              onClick={() => setVehicleSource("manual_profile")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                vehicleSource === "manual_profile" ? "bg-accent-primary text-slate-900 glow" : "text-dim hover:text-main"
              }`}
            >
              <Zap size={14} />
              Manual Profile
            </button>
            <button
              type="button"
              onClick={() => setVehicleSource("official_catalog")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                vehicleSource === "official_catalog" ? "bg-accent-primary text-slate-900 glow" : "text-dim hover:text-main"
              }`}
            >
              <Car size={14} />
              Vehicle Catalog
            </button>
          </div>

          <div className="glass rounded-2xl p-4 border border-glass animate-fade-in mb-4">
            {vehicleSource === "official_catalog" ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full glass border border-glass rounded-xl px-3 py-2.5 text-xs text-main focus:outline-none focus:border-accent-primary/50 transition-all appearance-none"
                    >
                      {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Make</label>
                    <select
                      value={selectedMake}
                      onChange={(e) => setSelectedMake(e.target.value)}
                      className="w-full glass border border-glass rounded-xl px-3 py-2.5 text-xs text-main focus:outline-none focus:border-accent-primary/50 transition-all appearance-none"
                    >
                      {makes.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="w-full glass border border-glass rounded-xl px-3 py-2.5 text-xs text-main focus:outline-none focus:border-accent-primary/50 transition-all appearance-none"
                  >
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Variant</label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full glass border border-glass rounded-xl px-3 py-2.5 text-xs text-main focus:outline-none focus:border-accent-primary/50 transition-all appearance-none"
                  >
                    {vehicleOptions.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Type</label>
                    <select
                      value={manualVehicleType}
                      onChange={(e) => setManualVehicleType(e.target.value)}
                      className="w-full glass border border-glass rounded-xl px-3 py-2.5 text-xs text-main focus:outline-none focus:border-accent-primary/50 transition-all"
                    >
                      <option value="">Select Type</option>
                      {MANUAL_VEHICLE_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Fuel</label>
                    <select
                      value={manualFuelType}
                      onChange={(e) => setManualFuelType(e.target.value)}
                      className="w-full glass border border-glass rounded-xl px-3 py-2.5 text-xs text-main focus:outline-none focus:border-accent-primary/50 transition-all"
                    >
                      <option value="">Select Fuel</option>
                      {MANUAL_FUEL_TYPE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Model Name</label>
                  <input
                    type="text"
                    value={manualVehicleLabel}
                    onChange={(e) => setManualVehicleLabel(e.target.value)}
                    className="w-full glass border border-glass rounded-xl px-4 py-2.5 text-xs text-main focus:outline-none focus:border-accent-primary/50 transition-all"
                    placeholder="Honda Activa, Tata Nexon..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">KMPL</label>
                    <input
                      type="number"
                      step="0.1"
                      value={manualCombinedKmpl}
                      onChange={(e) => setManualCombinedKmpl(e.target.value)}
                      className="w-full glass border border-glass rounded-xl px-4 py-2.5 text-xs text-main focus:outline-none focus:border-accent-primary/50 transition-all text-center font-black"
                      placeholder="Combined"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Rate / L</label>
                    <input
                      type="number"
                      step="0.1"
                      value={fuelPricePerLitre}
                      onChange={(e) => setFuelPricePerLitre(e.target.value)}
                      className="w-full glass border border-glass rounded-xl px-4 py-2.5 text-xs text-main focus:outline-none focus:border-accent-primary/50 transition-all text-center font-black"
                      placeholder="₹ Price"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="flex-[2] bg-accent-primary text-slate-900 py-3 rounded-2xl text-sm font-black uppercase tracking-widest glow hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : <Zap size={18} fill="currentColor" />}
            Find Eco Routes
          </button>
          <button
            type="button"
            onClick={onClear}
            className="flex-1 glass border border-glass rounded-2xl text-[10px] font-black text-dim uppercase tracking-widest hover:text-main hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} />
            Reset
          </button>
        </div>

        {catalogError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500">
            <Info size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Catalog Error: {catalogError}</span>
          </div>
        )}
      </form>
    </div>
  );
}
