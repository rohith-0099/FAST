import { 
  MapPin, 
  Search, 
  X, 
  Loader2, 
  Navigation 
} from 'lucide-react';

export default function LocationSearch({
  label,
  placeholder,
  iconColor,
  onLocationSelect,
  existingLocation,
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef(null);

  // Sync with existing location
  useEffect(() => {
    if (existingLocation && !query) {
      setQuery(existingLocation.displayName);
    }
  }, [existingLocation]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 3 && query !== existingLocation?.displayName) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchQuery) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&limit=5&addressdetails=1`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (suggestion) => {
    const location = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
      displayName: suggestion.display_name,
    };
    onLocationSelect(location);
    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSelect(null);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-[10px] font-black text-muted uppercase tracking-widest mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative group/input">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
          <MapPin 
            className={`${existingLocation ? iconColor : 'text-dim'} group-focus-within/input:text-accent-primary transition-colors`} 
            size={18} 
          />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 3 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full glass border border-glass rounded-2xl pl-12 pr-10 py-3 text-xs text-main placeholder-dim focus:outline-none focus:border-accent-primary/40 focus:bg-white/10 transition-all font-medium"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-dim hover:text-main hover:bg-white/10 rounded-full transition-all p-1.5"
            title="Clear search"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="absolute z-[100] w-full mt-2 glass border border-glass rounded-2xl shadow-premium max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200">
          {loading ? (
            <div className="px-5 py-4 text-xs text-dim flex items-center gap-3">
              <Loader2 className="animate-spin text-accent-primary" size={16} />
              Searching global registry...
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelect(suggestion)}
                className="w-full px-5 py-4 text-left text-xs text-main hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 group/item flex items-start gap-4"
              >
                <Navigation className="text-dim group-hover/item:text-accent-primary transition-colors mt-0.5 mt-0.5 flex-shrink-0" size={14} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-main truncate group-hover/item:text-accent-primary transition-colors">
                    {suggestion.name || suggestion.display_name.split(',')[0]}
                  </p>
                  <p className="text-[10px] text-dim truncate mt-0.5">
                    {suggestion.display_name}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
