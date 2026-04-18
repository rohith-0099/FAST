"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";

const sourceIcon = new L.DivIcon({
  className: "",
  html: `<div class="relative w-6 h-6 flex items-center justify-center">
    <div class="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-25"></div>
    <div class="relative w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full glow"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const destIcon = new L.DivIcon({
  className: "",
  html: `<div class="relative w-6 h-6 flex items-center justify-center">
    <div class="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25"></div>
    <div class="relative w-4 h-4 bg-red-500 border-2 border-slate-900 rounded-full shadow-lg"></div>
  </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});

const wpIcon = new L.DivIcon({
  className: "",
  html: `<div class="w-3 h-3 bg-slate-400 border-2 border-slate-900 rounded-full shadow-md"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  popupAnchor: [0, -6],
});

function MapClickHandler({ source, destination, onSetSource, onSetDestination }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      if (!source) {
        onSetSource({ lat, lng });
      } else if (!destination) {
        onSetDestination({ lat, lng });
      } else {
        // Reset: start new selection
        onSetSource({ lat, lng });
        onSetDestination(null);
      }
    },
  });
  return null;
}

function FitBounds({ routes, source, destination }) {
  const map = useMap();

  useEffect(() => {
    if (routes && routes.length > 0) {
      const allPoints = [];
      routes.forEach((route) => {
        // geometry is GeoJSON: {type: "LineString", coordinates: [[lng, lat], ...]}
        const coords = route.geometry?.coordinates;
        if (coords) {
          coords.forEach(([lng, lat]) => allPoints.push([lat, lng]));
        }
      });
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } else if (source && destination) {
      const bounds = L.latLngBounds(
        [source.lat, source.lng],
        [destination.lat, destination.lng]
      );
      map.fitBounds(bounds, { padding: [60, 60] });
    } else if (source) {
      map.setView([source.lat, source.lng], 13);
    }
  }, [routes, source, destination, map]);

  return null;
}

function getRouteColor(route) {
  if (route.is_fuel_efficient) return "#10b981";
  if (route.is_fastest) return "#3b82f6";
  return "#9ca3af";
}

function getRouteWeight(route) {
  if (route.is_fuel_efficient) return 6;
  if (route.is_fastest) return 5;
  return 4;
}

function formatTime(minutes) {
  if (!minutes) return "N/A";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

export default function MapComponent({
  source,
  destination,
  waypoints = [],
  routes,
  onSetSource,
  onSetDestination,
}) {
  // Default center: world view
  const center = useMemo(() => {
    if (source) return [source.lat, source.lng];
    return [20, 0];
  }, [source]);

  const zoom = source ? 13 : 2;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "100%", width: "100%" }}
      zoomControl={false}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapClickHandler
        source={source}
        destination={destination}
        onSetSource={onSetSource}
        onSetDestination={onSetDestination}
      />

      <FitBounds routes={routes} source={source} destination={destination} />

      {source && (
        <Marker position={[source.lat, source.lng]} icon={sourceIcon}>
          <Popup className="premium-popup">
            <div className="p-2">
              <p className="text-[10px] font-black text-accent-primary uppercase tracking-widest mb-1">Origin</p>
              <p className="text-xs font-bold text-slate-800">{source.displayName || 'Selected Point'}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {waypoints.map((wp, idx) => wp && (
        <Marker key={idx} position={[wp.lat, wp.lng]} icon={wpIcon}>
          <Popup className="premium-popup">
            <div className="p-2">
              <p className="text-[10px] font-black text-status-info uppercase tracking-widest mb-1">Stop {idx + 1}</p>
              <p className="text-xs font-bold text-slate-800">{wp.displayName || 'Waystop'}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      {destination && (
        <Marker
          position={[destination.lat, destination.lng]}
          icon={destIcon}
        >
          <Popup className="premium-popup">
            <div className="p-2">
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Destination</p>
              <p className="text-xs font-bold text-slate-800">{destination.displayName || 'Target'}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {routes &&
        routes.map((route, idx) => {
          const coords = route.geometry?.coordinates;
          if (!coords || coords.length === 0) return null;
          // Convert GeoJSON [lng, lat] to Leaflet [lat, lng]
          const positions = coords.map(([lng, lat]) => [lat, lng]);
          return (
            <Polyline
              key={idx}
              positions={positions}
              color={getRouteColor(route)}
              weight={getRouteWeight(route)}
              opacity={0.85}
            >
              <Popup>
                <div className="text-sm">
                  <strong className="text-gray-900 block mb-1">{route.summary || `Route ${idx + 1}`}</strong>
                  <div className="space-y-0.5 text-gray-600">
                    <div><span className="font-medium">Distance:</span> {route.distance_km?.toFixed(1)} km</div>
                    <div><span className="font-medium">Fuel:</span> {route.fuel_litres?.toFixed(2)} L</div>
                    <div><span className="font-medium">Time:</span> {formatTime(route.duration_min)}</div>
                  </div>
                </div>
              </Popup>
            </Polyline>
          );
        })}
    </MapContainer>
  );
}
