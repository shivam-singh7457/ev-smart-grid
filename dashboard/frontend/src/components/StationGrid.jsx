import React, { useState } from 'react';
import { Search, MapPin, Zap, Info, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StationGrid = ({ stations, onStationClick }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.stationId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen pt-24 bg-navy-dark text-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight mb-2 uppercase italic text-neon-blue">Station Catalog</h2>
          <p className="text-slate-400 text-sm font-medium">Real-time status tracking for all 35 infrastructure nodes in the Guangzhou-Shenzhen grid.</p>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-neon-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Search Hub ID or Name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-neon-blue/50 focus:ring-4 focus:ring-neon-blue/5 transition-all shadow-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredStations.map((station, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              key={station.stationId}
              onClick={() => onStationClick(station)}
              className="glass-panel p-6 cursor-pointer hover:border-neon-blue/40 group transition-all relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">ID: {station.stationId}</span>
                  <h3 className="font-bold text-lg group-hover:text-neon-blue transition-colors">{station.name}</h3>
                </div>
                <div className={`p-2 rounded-lg ${station.currentOccupancy > 0.8 ? 'bg-status-busy/10 text-status-busy' : 'bg-status-idle/10 text-status-idle'}`}>
                   <Zap className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Load</span>
                  <span className={`text-sm font-black ${station.currentOccupancy > 0.8 ? 'text-status-busy' : 'text-slate-200'}`}>
                    {(station.currentOccupancy * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${station.currentOccupancy * 100}%` }}
                        className={`h-full transition-all duration-1000 ${station.currentOccupancy > 0.8 ? 'bg-status-busy' : 'bg-neon-blue shadow-[0_0_10px_rgba(79,172,254,0.4)]'}`}
                    />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between opacity-60 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{station.city} HUB</span>
                </div>
                <ArrowRight className="w-4 h-4 text-neon-blue translate-x-[-10px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300" />
              </div>

              {/* Grid Background Effect */}
              <div className="absolute -bottom-8 -right-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500">
                  <Info className="w-32 h-32 text-white" />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredStations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 opacity-20">
          <Search className="w-16 h-16 mb-4" />
          <span className="text-xl font-bold uppercase tracking-widest italic">No Hubs Found</span>
        </div>
      )}
    </div>
  );
};

export default StationGrid;
