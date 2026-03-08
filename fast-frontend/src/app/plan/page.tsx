"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

const Map = dynamic(() => import('@/components/Map'), {
    ssr: false,
    loading: () => <div style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)', borderRadius: '12px' }}>Loading Map...</div>
});

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function PlanTrip() {
    const [source, setSource] = useState<{ lat: number, lon: number } | null>(null);
    const [dest, setDest] = useState<{ lat: number, lon: number } | null>(null);
    const [vehicleType, setVehicleType] = useState('Car');
    const [mileage, setMileage] = useState(15.0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<any>(null);

    const handlePlanTrip = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!source || !dest) {
            setError("Please select both source and destination on the map.");
            return;
        }
        setError('');
        setLoading(true);
        setResult(null);

        try {
            const res = await fetch(`${API_URL}/api/plan-trip`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source,
                    destination: dest,
                    vehicle_type: vehicleType,
                    mileage_km_per_litre: mileage
                })
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.detail || "Failed to plan trip. Make sure the backend and OSRM are running.");
            }

            const data = await res.json();
            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container animate-fade-in" style={{ padding: '2rem', display: 'flex', gap: '2rem', height: 'calc(100vh - 80px)' }}>
            {/* Left panel: Map */}
            <div style={{ flex: 2, borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', position: 'relative' }}>
                <Map source={source} dest={dest} setSource={setSource} setDest={setDest} routeGeometry={result?.selected_route?.geometry} alternatives={result?.alternatives} />
            </div>

            {/* Right panel: Controls & Results */}
            <div className="glass-panel" style={{ flex: 1, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Plan Trip</h2>

                <form onSubmit={handlePlanTrip} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label>Points</label>
                        <div style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>
                            {source ? <span style={{ color: '#10b981' }}>✓ Source selected</span> : <span>Click map to set Source</span>}
                            <br />
                            {dest ? <span style={{ color: '#ef4444' }}>✓ Destination selected</span> : <span>Click map again to set Dest</span>}
                        </div>
                        {(source || dest) && (
                            <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', marginTop: '0.5rem' }}
                                onClick={() => { setSource(null); setDest(null); setResult(null); }}
                            >
                                Reset Points
                            </button>
                        )}
                    </div>

                    <div>
                        <label>Vehicle Type</label>
                        <select className="input-field" value={vehicleType} onChange={e => setVehicleType(e.target.value)} style={{ appearance: 'none' }}>
                            <option value="Car">Car</option>
                            <option value="SUV">SUV</option>
                            <option value="Bike">Bike</option>
                            <option value="Truck">Truck</option>
                        </select>
                    </div>

                    <div>
                        <label>Mileage (km/l)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="1"
                            className="input-field"
                            value={mileage}
                            onChange={e => setMileage(parseFloat(e.target.value))}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Calculating...' : 'Find Efficient Route'}
                    </button>
                </form>

                {error && (
                    <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#ef4444', fontSize: '0.9rem' }}>
                        {error}
                    </div>
                )}

                {result && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade-in">
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>Optimal Route</h3>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '12px', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#a1a1aa' }}>Distance:</span>
                                <span style={{ fontWeight: 600 }}>{result.selected_route.distance_km} km</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span style={{ color: '#a1a1aa' }}>Duration:</span>
                                <span style={{ fontWeight: 600 }}>{result.selected_route.duration_min} min</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                <span style={{ color: '#10b981', fontWeight: 500 }}>Est. Fuel:</span>
                                <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1.2rem' }}>{result.selected_route.predicted_fuel_l} L</span>
                            </div>
                        </div>

                        {result.alternatives && result.alternatives.length > 0 && (
                            <>
                                <h4 style={{ fontSize: '1rem', marginTop: '1rem', color: '#a1a1aa' }}>Alternatives ({result.alternatives.length})</h4>
                                {result.alternatives.map((alt: any, idx: number) => (
                                    <div key={idx} style={{ background: 'var(--secondary)', borderRadius: '8px', padding: '1rem', fontSize: '0.9rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{alt.distance_km} km • {alt.duration_min} min</span>
                                            <span style={{ color: '#ef4444' }}>{alt.predicted_fuel_l} L</span>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
