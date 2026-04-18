'use client';

import React from 'react';
import { 
  Map as MapIcon, 
  History, 
  Settings, 
  PlusCircle, 
  Zap, 
  Leaf, 
  BarChart3,
  Moon,
  Sun
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, theme, toggleTheme }) {
  const menuItems = [
    { id: 'plan', label: 'Trip Planner', icon: MapIcon },
    { id: 'history', label: 'Travel History', icon: History },
    { id: 'compare', label: 'Comparison', icon: BarChart3 },
    { id: 'favorites', label: 'Saved Places', icon: PlusCircle },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 glass border-r border-glass z-50 flex flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-accent-primary p-2 rounded-xl glow">
          <Zap className="text-slate-900" size={24} fill="currentColor" />
        </div>
        <h1 className="text-2xl font-bold text-gradient">FAST</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            role="tab"
            aria-selected={activeTab === item.id}
            aria-controls={`${item.id}-panel`}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-accent-primary/10 text-accent-primary border border-accent-primary/20 glow' 
                : 'text-text-dim hover:bg-white/5 hover:text-text-main'
            }`}
          >
            <item.icon size={20} />
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-glass space-y-4">
        <div className="flex items-center justify-between px-4 py-2 rounded-xl bg-white/5">
          <Leaf className="text-accent-primary" size={18} />
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">ECO MODE ON</span>
        </div>
        
        <button 
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          role="switch"
          aria-checked={theme === 'dark'}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-white/5 transition-colors text-text-dim hover:text-text-main"
        >
          <div className="flex items-center gap-3">
            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            <span className="font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>
          <div className="w-10 h-6 bg-slate-700 rounded-full relative p-1 transition-colors">
            <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${theme === 'dark' ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </button>
      </div>
    </aside>
  );
}
