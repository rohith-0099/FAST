import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FAST | Fuel Aware Smart Travel",
  description: "Find the most fuel-efficient route for your journey using advanced routing and routing predictions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--background)', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              FAST
            </span>
            <span style={{ color: '#a1a1aa', fontSize: '0.9rem', fontWeight: 500, marginLeft: '0.5rem', display: 'none' }}>
              Fuel Aware Smart Travel
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <a href="/" style={{ color: '#e4e4e7', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }}>Home</a>
            <a href="/plan" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}>Plan Trip</a>
          </div>
        </nav>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
