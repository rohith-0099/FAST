import { 
  History, 
  MapPin, 
  Car, 
  Fuel, 
  Leaf, 
  Calendar, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Search
} from 'lucide-react';

export default function TripHistory({ refreshKey }) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/api/history`);
        setTrips(Array.isArray(res.data?.trips) ? res.data.trips : []);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [refreshKey]);

  const filteredTrips = trips.filter(trip => 
    trip.vehicle_label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.route_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-dim group-focus-within:text-accent-primary transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search your journeys..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-glass rounded-2xl py-3 pl-12 pr-4 text-main placeholder-dim focus:outline-none focus:border-accent-primary/50 focus:bg-white/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-dim bg-white/5 px-4 py-2 rounded-xl border border-glass">
          <History size={14} />
          TOTAL TRIPS: {trips.length}
        </div>
      </div>

      <div className="glass rounded-[32px] overflow-hidden border border-glass">
        {loading ? (
          <div className="text-center py-20 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-accent-primary/20 border-t-accent-primary rounded-full animate-spin" />
            <p className="text-dim font-medium">Accessing encrypted history...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-white/5 rounded-[32px] border border-glass flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
              {searchTerm ? <Search className="text-accent-primary" size={32} /> : <History className="text-accent-primary" size={32} />}
            </div>
            <h3 className="text-xl font-black text-main">{searchTerm ? "No Matching Journeys" : "No Journeys Logged"}</h3>
            <p className="text-dim mt-2 flex max-w-sm mx-auto text-sm leading-relaxed">
              {searchTerm 
                ? `We couldn't find any recorded trips matching "${searchTerm}". Please try adjusting your keywords.` 
                : "Start planning your first eco-friendly or fast trip to monitor your environmental and financial savings here."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-white/5 border-b border-glass">
                  <th className="text-left py-5 px-6 text-[10px] font-black text-muted uppercase tracking-widest">Journey Details</th>
                  <th className="text-left py-5 px-6 text-[10px] font-black text-muted uppercase tracking-widest">Vehicle</th>
                  <th className="text-right py-5 px-6 text-[10px] font-black text-muted uppercase tracking-widest">Stats</th>
                  <th className="text-right py-5 px-6 text-[10px] font-black text-muted uppercase tracking-widest text-accent-primary">Eco Impact</th>
                  <th className="text-right py-5 px-6 text-[10px] font-black text-muted uppercase tracking-widest">Cost (Est)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-glass">
                {filteredTrips.map((trip) => (
                  <tr key={trip.id} className="group hover:bg-white/5 transition-colors">
                    <td className="py-6 px-6">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-main">{trip.route_name || "Custom Journey"}</span>
                          <ExternalLink size={12} className="text-dim opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-dim">
                          <Calendar size={12} />
                          {new Date(trip.created_at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-main flex items-center gap-2">
                          <Car size={14} className="text-accent-primary" />
                          {trip.vehicle_label}
                        </span>
                        <span className="text-[10px] font-bold text-dim uppercase tracking-wider">
                          {trip.fuel_type} • {trip.combined_kmpl} KMPL
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-right">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-main">{trip.distance_km?.toFixed(1)} km</span>
                        <span className="text-[10px] font-bold text-dim uppercase tracking-wider">{trip.fuel_litres?.toFixed(2)} litres</span>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-right">
                      <div className="flex items-center justify-end gap-2 px-3 py-1.5 bg-accent-primary/10 rounded-xl border border-accent-primary/20 self-end ml-auto w-fit">
                        <Leaf className="text-accent-primary" size={14} />
                        <span className="text-sm font-black text-accent-primary">{trip.co2_kg?.toFixed(2)} KG</span>
                      </div>
                    </td>
                    <td className="py-6 px-6 text-right">
                      <span className="text-base font-black text-main">₹{trip.estimated_cost?.toFixed(0)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
