"use client";

import { useState, useEffect, useRef } from "react";

/**
 * LocationSearch component with autocomplete using Nominatim (OpenStreetMap)
 * Free, open-source alternative to Google Maps Geocoding
 */
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

  // Debounce search to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 3) {
        fetchSuggestions(query);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close suggestions when clicking outside
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
        )}&limit=5&addressdetails=1&countrycodes=in`
      );
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
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

  const getIconColor = () => {
    if (existingLocation) return iconColor;
    return "text-slate-500";
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-sm font-medium text-slate-300 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2">
          <svg
            className={`w-4 h-4 ${getIconColor()}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 3 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full bg-[#0f172a] border border-[#334155] rounded-lg pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-green-500 transition-colors"
        />

        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-[#1e293b] border border-[#334155] rounded-lg shadow-xl max-h-64 overflow-y-auto">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-400 flex items-center gap-2">
              <span className="spinner spinner-sm"></span>
              Searching...
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSelect(suggestion)}
                className="w-full px-4 py-3 text-left text-sm text-slate-200 hover:bg-[#334155] transition-colors border-b border-[#334155] last:border-b-0"
              >
                <div className="flex items-start gap-2">
                  <svg
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{suggestion.name}</p>
                    {suggestion.display_name !== suggestion.name && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {suggestion.display_name}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}

      {showSuggestions && suggestions.length === 0 && query.trim().length >= 3 && !loading && (
        <div className="absolute z-50 w-full mt-1 bg-[#1e293b] border border-[#334155] rounded-lg shadow-xl px-4 py-3 text-sm text-slate-400">
          No locations found. Try a different search term.
        </div>
      )}
    </div>
  );
}
