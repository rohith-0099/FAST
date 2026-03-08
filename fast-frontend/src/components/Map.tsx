"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
const customIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Create different colored icons for source and destination if needed, or use same.
const sourceIcon = customIcon;
const destIcon = customIcon;

interface MapProps {
    source: { lat: number, lon: number } | null;
    dest: { lat: number, lon: number } | null;
    setSource: (pt: { lat: number, lon: number } | null) => void;
    setDest: (pt: { lat: number, lon: number } | null) => void;
    routeGeometry?: any;
    alternatives?: any[];
}

function MapClickHandler({ source, dest, setSource, setDest }: any) {
    useMapEvents({
        click(e) {
            if (!source) {
                setSource({ lat: e.latlng.lat, lon: e.latlng.lng });
            } else if (!dest) {
                setDest({ lat: e.latlng.lat, lon: e.latlng.lng });
            }
            // If both are set, do nothing until reset
        },
    });
    return null;
}

export default function MapComponent({ source, dest, setSource, setDest, routeGeometry, alternatives }: MapProps) {
    // Center roughly on India, as requested in prompt example
    const defaultCenter: [number, number] = [20.5937, 78.9629];

    // OSRM returns GeoJSON coordinates as [lon, lat], Leaflet needs [lat, lon]
    const parseGeoJSONCoords = (geometry: any) => {
        if (!geometry || !geometry.coordinates) return [];
        return geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]] as [number, number]);
    };

    const optimalRouteCoords = routeGeometry ? parseGeoJSONCoords(typeof routeGeometry === "string" ? JSON.parse(routeGeometry) : routeGeometry) : [];

    return (
        <div style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}>
            <MapContainer
                center={defaultCenter}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    className="map-tiles"
                />

                <MapClickHandler source={source} dest={dest} setSource={setSource} setDest={setDest} />

                {source && (
                    <Marker position={[source.lat, source.lon]} icon={sourceIcon}>
                        <Popup>Source</Popup>
                    </Marker>
                )}

                {dest && (
                    <Marker position={[dest.lat, dest.lon]} icon={destIcon}>
                        <Popup>Destination</Popup>
                    </Marker>
                )}

                {/* Draw Alternatives first so they are under optimal route */}
                {alternatives && alternatives.map((alt, idx) => {
                    const altCoords = parseGeoJSONCoords(typeof alt.geometry === "string" ? JSON.parse(alt.geometry) : alt.geometry);
                    return (
                        <Polyline
                            key={`alt-${idx}`}
                            positions={altCoords}
                            color="#ef4444"
                            weight={4}
                            opacity={0.5}
                            dashArray="10, 10"
                        />
                    );
                })}

                {/* Draw Optimal Route */}
                {optimalRouteCoords.length > 0 && (
                    <Polyline
                        positions={optimalRouteCoords}
                        color="#10b981"
                        weight={6}
                        opacity={0.8}
                    />
                )}
            </MapContainer>

            <style jsx global>{`
        /* Dark mode map tiles override using CSS filters to make it match the sleek theme */
        .map-tiles {
          filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7);
        }
      `}</style>
        </div>
    );
}
