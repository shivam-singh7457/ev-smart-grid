import React from 'react';
import { LayoutDashboard, List, BarChart3, Map as MapIcon, Zap } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: 'map', label: 'Interactive Map', icon: MapIcon },
    { id: 'list', label: 'Station Catalog', icon: List },
    { id: 'analytics', label: 'Model Insights', icon: BarChart3 },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 h-16 z-[2000] flex items-center justify-between px-8 bg-slate-900 border-b border-white/5 shadow-xl">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-neon-blue rounded shadow-[0_0_10px_rgba(79,172,254,0.4)]">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-black tracking-widest text-white uppercase italic">AFML GRID</span>
      </div>

      <div className="flex items-center gap-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 group
              ${activeTab === item.id 
                ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30 shadow-[0_0_15px_rgba(79,172,254,0.1)]' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'}`}
          >
            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-neon-blue' : 'text-slate-400 group-hover:text-slate-200'}`} />
            <span className="text-[11px] font-bold uppercase tracking-widest">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter leading-none mb-1">Infrastructure Load</span>
            <div className="w-24 h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-neon-blue rounded-full"></div>
            </div>
        </div>
        <div className="w-8 h-8 rounded-full border border-white/10 bg-slate-800 flex items-center justify-center">
             <span className="text-[10px] font-bold text-slate-300">ADMIN</span>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
