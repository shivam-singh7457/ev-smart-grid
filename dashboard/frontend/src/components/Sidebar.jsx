import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, AlertTriangle, TrendingUp, Info, MoreHorizontal } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts';

// Realistic Dual-Axis Data
const getMockData = () => {
    const data = [];
    for (let i = 0; i < 24; i++) {
        const actual = 0.3 + Math.random() * 0.6;
        const predicted = actual + (Math.random() - 0.5) * 0.15;
        data.push({
            time: `${i}:00`,
            actual: parseFloat(actual.toFixed(2)),
            predicted: parseFloat(predicted.toFixed(2)),
            error: Math.abs(actual - predicted).toFixed(3)
        });
    }
    return data;
};

const Sidebar = ({ station, onClose, onNavigate }) => {
  if (!station) return null;
  const chartData = getMockData();
  const isBusy = station.predictedOccupancy > 0.8;
  const localR2 = (0.75 + Math.random() * 0.2).toFixed(4); // Simulated local accuracy

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 450, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 450, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-96 z-[1001] glass-panel rounded-none border-y-0 border-r-0 flex flex-col p-6 shadow-2xl"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`tech-badge ${isBusy ? 'bg-status-busy/10 text-status-busy border-status-busy/30' : 'bg-status-idle/10 text-status-idle border-status-idle/30'}`}>
                {isBusy ? 'System Busy' : 'Operational'}
              </span>
              <span className="tech-badge bg-white/5 text-slate-400 border-white/10 uppercase tracking-widest text-[9px]">ID: {station.stationId}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{station.name}</h2>
            <p className="text-xs text-slate-500 uppercase tracking-tighter mt-0.5">{station.city} Hub Protocol</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-8 pr-2 custom-scrollbar">
          {/* Real-time Occupancy HUD */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Live Load</span>
                <span className="text-2xl font-bold text-slate-200">{(station.currentOccupancy * 100).toFixed(1)}%</span>
            </div>
            <div className="p-4 bg-slate-900/40 rounded-xl border border-white/5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Prediction</span>
                <span className="text-2xl font-bold text-neon-cyan">{(station.predictedOccupancy * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* AFML Prediction Hub - Dual Axis Chart */}
          <section>
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-neon-cyan" />
                 AFML Prediction Hub
               </h3>
               <span className="text-[10px] font-bold text-meta-gold tracking-tight italic">Local R2: {localR2}</span>
            </div>
            <div className="h-60 w-full bg-slate-900/60 rounded-xl p-2 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '11px' }}
                        />
                        <Area type="monotone" dataKey="actual" stroke="#00f2fe" strokeWidth={2} fillOpacity={1} fill="url(#actualGradient)" name="Actual" />
                        <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="AFML Predicted" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </section>

          {/* Top 3 Closest Recommendations */}
          <section className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                 <Navigation className="w-4 h-4 text-neon-blue" />
                 Closest 3 Recommendations
              </h3>

              <div className="space-y-3">
                  {station.suggestions?.map((suggest, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={suggest.stationId}
                        onClick={() => onNavigate(suggest.stationId)}
                        className="p-4 bg-slate-900 border border-white/5 rounded-xl hover:border-neon-blue/40 cursor-pointer group transition-all"
                      >
                          <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{suggest.stationId}</span>
                              <span className="text-[10px] font-bold text-neon-blue italic">{suggest.distance}</span>
                          </div>
                          <div className="flex justify-between items-end">
                              <span className="text-sm font-bold text-slate-200 group-hover:text-neon-blue transition-colors">{suggest.name}</span>
                              <div className="text-right">
                                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Occupancy</span>
                                  <span className={`text-xs font-bold ${suggest.currentOccupancy > 0.8 ? 'text-status-busy' : 'text-status-idle'}`}>
                                      {(suggest.currentOccupancy * 100).toFixed(0)}%
                                  </span>
                              </div>
                          </div>
                      </motion.div>
                  ))}
              </div>
          </section>

          {/* Technical Disclosure */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex gap-3 items-start">
             <Info className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
             <p className="text-[10px] text-slate-500 italic leading-snug">
               Predictions calculated using Asynchronous Federated Meta-Learning (AFML) across 500 training rounds. 
               Model incorporates a 3-NN spatial adjacency matrix for temporal correction.
             </p>
          </div>
        </div>

        <div className="mt-6 flex justify-between pt-6 border-t border-white/5">
           <button className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-[2px] transition-colors">Diagnostics</button>
           <button className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-[2px] transition-colors">Export Logs</button>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
};

export default Sidebar;
