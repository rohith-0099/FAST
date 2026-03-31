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

// Fix Leaflet default icon issue in Next.js
const sourceIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    width: 20px; height: 20px;
    background: #10b981;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
});

const destIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    width: 20px; height: 20px;
    background: #ef4444;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -12],
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
      zoomControl={true}
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
          <Popup>
            <div className="text-sm">
              <strong className="text-emerald-600 block mb-1">Source</strong>
              <div className="text-gray-600">
                {source.lat.toFixed(4)}, {source.lng.toFixed(4)}
              </div>
              {source.displayName && (
                <div className="text-gray-500 text-xs mt-1 truncate max-w-[200px]">
                  {source.displayName}
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker
          position={[destination.lat, destination.lng]}
          icon={destIcon}
        >
          <Popup>
            <div className="text-sm">
              <strong className="text-red-600 block mb-1">Destination</strong>
              <div className="text-gray-600">
                {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
              </div>
              {destination.displayName && (
                <div className="text-gray-500 text-xs mt-1 truncate max-w-[200px]">
                  {destination.displayName}
                </div>
              )}
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
