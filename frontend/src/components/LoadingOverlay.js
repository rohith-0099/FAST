import { Loader2, Zap } from 'lucide-react';

export default function LoadingOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative">
        {/* Pulsing glow background */}
        <div className="absolute inset-0 bg-accent-primary rounded-full blur-[60px] opacity-20 animate-pulse" />
        
        <div className="relative glass border border-glass p-10 rounded-[40px] shadow-premium flex flex-col items-center max-w-sm text-center">
          <div className="w-20 h-20 bg-accent-primary/20 rounded-3xl flex items-center justify-center mb-6 relative">
             <Loader2 size={40} className="text-accent-primary animate-spin" />
             <Zap size={20} className="absolute text-accent-primary fill-accent-primary glow" />
          </div>
          
          <h3 className="text-2xl font-black text-main uppercase tracking-tighter">Calculating Routes</h3>
          <p className="text-xs text-dim mt-3 font-bold uppercase tracking-widest leading-relaxed">
            Optimizing multi-stop logistics<br/>& carbon coefficients...
          </p>
          
          <div className="flex gap-1 mt-8">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
}
