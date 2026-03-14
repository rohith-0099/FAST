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
    width: 28px; height: 28px;
    background: #22c55e;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
});

const destIcon = new L.DivIcon({
  className: "",
  html: `<div style="
    width: 28px; height: 28px;
    background: #ef4444;
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -16],
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
  if (route.is_fuel_efficient) return "#22c55e";
  if (route.is_fastest) return "#3b82f6";
  return "#6b7280";
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
  // Default center: India
  const center = useMemo(() => {
    if (source) return [source.lat, source.lng];
    return [20.5937, 78.9629];
  }, [source]);

  const zoom = source ? 13 : 5;

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
            <strong>Source</strong>
            <br />
            {source.displayName || `${source.lat.toFixed(4)}, ${source.lng.toFixed(4)}`}
          </Popup>
        </Marker>
      )}

      {destination && (
        <Marker
          position={[destination.lat, destination.lng]}
          icon={destIcon}
        >
          <Popup>
            <strong>Destination</strong>
            <br />
            {destination.displayName || `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}`}
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
                <div>
                  <strong>{route.summary || `Route ${idx + 1}`}</strong>
                  <br />
                  Distance: {route.distance_km?.toFixed(1)} km
                  <br />
                  Fuel: {route.fuel_litres?.toFixed(2)} L
                  <br />
                  Time: {formatTime(route.duration_min)}
                </div>
              </Popup>
            </Polyline>
          );
        })}
    </MapContainer>
  );
}
