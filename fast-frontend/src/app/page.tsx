import Link from 'next/link';

export default function Home() {
  return (
    <div className="container animate-fade-in" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.1 }}>
          The <span className="gradient-text">Smart Way</span> to Plan Your Road Trips
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#a1a1aa', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          FAST (Fuel Aware Smart Travel) calculates the most fuel-efficient routes using advanced routing engines and real-world metrics, saving your wallet and the environment.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/plan">
            <button className="btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
              Start Planning
            </button>
          </Link>
          <a href="#how-it-works">
            <button className="btn-secondary" style={{ fontSize: '1.1rem', padding: '1rem 2.5rem' }}>
              How it works
            </button>
          </a>
        </div>
      </div>

      <div id="how-it-works" style={{ marginTop: '8rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#3b82f6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Pick Your Route</h3>
          <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>Simply select your source and destination on our interactive map. We support detailed address finding globally.</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#10b981' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Set Vehicle Profile</h3>
          <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>Tell us what you drive and its average mileage. Our engine calculates estimates tailored specifically for your vehicle.</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: '#8b5cf6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Save Fuel & Time</h3>
          <p style={{ color: '#a1a1aa', lineHeight: 1.6 }}>We analyze multiple alternatives and pick the one that minimizes fuel consumption while keeping you on schedule.</p>
        </div>
      </div>
    </div>
  );
}
