import { Car, Zap, Droplets, Info } from 'lucide-react';

export default function VehicleComparison() {
  return (
    <div className="space-y-6">
      <div className="glass rounded-[32px] p-8 text-center border border-accent-primary/20 bg-accent-primary/5">
        <div className="w-20 h-20 bg-glass rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent-primary/20">
          <Car className="text-accent-primary" size={40} />
        </div>
        <h3 className="text-2xl font-black text-main">Vehicle Comparison</h3>
        <p className="text-dim mt-2 max-w-md mx-auto leading-relaxed">
          Select vehicles from the route planner to compare fuel efficiency, environmental impact, and cost side-by-side. 
          Advanced analytics mode coming in the next update.
        </p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          <div className="bg-white/5 border border-glass rounded-2xl p-6 text-left">
            <Zap className="text-yellow-500 mb-4" size={24} />
            <h4 className="text-lg font-bold text-main mb-1">EV Readiness</h4>
            <p className="text-xs text-dim">Compare conventional ICE vehicles with modern Electric alternatives.</p>
          </div>
          <div className="bg-white/5 border border-glass rounded-2xl p-6 text-left">
            <Droplets className="text-blue-500 mb-4" size={24} />
            <h4 className="text-lg font-bold text-main mb-1">Fuel Economy</h4>
            <p className="text-xs text-dim">Standardized City, Highway, and Combined metrics.</p>
          </div>
          <div className="bg-white/5 border border-glass rounded-2xl p-6 text-left">
            <Info className="text-accent-primary mb-4" size={24} />
            <h4 className="text-lg font-bold text-main mb-1">Impact Score</h4>
            <p className="text-xs text-dim">Measure potential CO2 savings across identical routes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
