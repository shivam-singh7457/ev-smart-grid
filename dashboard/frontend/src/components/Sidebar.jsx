import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, AlertTriangle, TrendingUp, Info, MoreHorizontal } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area 
} from 'recharts';

// Realistic Dual-Axis Data
// Dynamic Trend Generator for the Chart
const getDynamicChartData = (current, predicted) => {
    const data = [];
    const nowIdx = 18; // Assume "Now" is the 18th hour for visual structure
    
    for (let i = 0; i < 24; i++) {
        let val;
        let predVal;
        
        if (i < nowIdx) {
            // Past: Random walk leading up to current
            const progress = i / nowIdx;
            val = (0.3 + Math.random() * 0.4) * (1 - progress) + (current * progress);
            predVal = val + (Math.random() - 0.5) * 0.1;
        } else if (i === nowIdx) {
            // Now
            val = current;
            predVal = predicted;
        } else {
            // Future: Trend towards predicted value
            const progress = (i - nowIdx) / (24 - nowIdx);
            predVal = (predicted * (1 - progress)) + (predicted + (Math.random() - 0.5) * 0.15) * progress;
            val = null; // Future actual is unknown
        }
        
        data.push({
            time: `${i}:00`,
            actual: val !== null ? parseFloat(val.toFixed(2)) : null,
            predicted: parseFloat(predVal.toFixed(2)),
        });
    }
    return data;
};

const Sidebar = ({ station, onClose, onNavigate }) => {
  if (!station) return null;
  const chartData = getDynamicChartData(station.currentOccupancy, station.predictedOccupancy);
  const isBusy = station.predictedOccupancy > 0.8;
  const engineName = station.meta?.engine || 'AFML Meta-Model V2';
  const isSimulation = station.meta?.engine === 'Resilient Simulation';

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 450, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 450, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-96 z-[1001] glass-panel rounded-none border-y-0 border-r-0 flex flex-col p-8 shadow-2xl"
      >
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`tech-badge px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest ${isBusy ? 'bg-status-busy/10 text-status-busy border-status-busy/30' : 'bg-neon-emerald/10 text-neon-emerald border-neon-emerald/30'}`}>
                {isBusy ? 'SYSTEM BUSY' : 'OPERATIONAL'}
              </span>
              <span className="tech-badge px-2 py-0.5 rounded-md bg-white/5 text-slate-450 border-white/10 uppercase tracking-widest text-[9px]">ID: {station.stationId}</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">{station.name}</h2>
            <p className="text-[10px] text-slate-450 uppercase font-bold tracking-[0.1em] mt-1">Spatio-Temporal Node Hub</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-10 pr-2 custom-scrollbar">
          {/* Real-time Occupancy HUD */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-5 bg-navy-deep/40 rounded-3xl border border-white/5 shadow-inner">
                <span className="text-[9px] text-slate-450 font-black uppercase tracking-widest block mb-1">Live Occupancy</span>
                <span className="text-2xl font-black text-white">{(station.currentOccupancy * 100).toFixed(0)}%</span>
            </div>
            <div className="p-5 bg-navy-deep/40 rounded-3xl border border-white/5 shadow-inner">
                <span className="text-[9px] text-slate-450 font-black uppercase tracking-widest block mb-1">AFML Forecast</span>
                <span className="text-2xl font-black text-arctic-violet">{(station.predictedOccupancy * 100).toFixed(0)}%</span>
            </div>
          </div>

          {/* AFML Prediction Hub - Dual Axis Chart */}
          <section>
            <div className="flex justify-between items-center mb-5">
               <h3 className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em] flex items-center gap-2">
                 <TrendingUp className="w-3.5 h-3.5 text-arctic-violet" />
                 Neural Forecast
               </h3>
               <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isSimulation ? 'bg-amber-500' : 'bg-neon-emerald'} animate-pulse`} />
                  <span className="text-[9px] font-bold text-slate-450 tracking-tight uppercase">{isSimulation ? 'Simulated' : 'Actual'}</span>
               </div>
            </div>
            <div className="h-60 w-full bg-navy-deep/60 rounded-3xl p-4 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="time" hide />
                        <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ background: '#020617', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="actual" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#actualGradient)" name="Actual Usage" />
                        <Line type="monotone" dataKey="predicted" stroke="#10b981" strokeWidth={2} strokeDasharray="6 6" name="AFML Forecast" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
          </section>

          {/* Intelligent Recommendations */}
          <section className="space-y-5">
              <h3 className="text-[10px] font-black text-slate-200 uppercase tracking-[0.2em] flex items-center gap-2">
                 <Navigation className="w-3.5 h-3.5 text-neon-emerald" />
                 Distance Based Recommendations
              </h3>

              <div className="space-y-4">
                  {station.suggestions?.map((suggest, idx) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={suggest.stationId}
                        onClick={() => onNavigate(suggest.stationId)}
                        className="p-5 bg-navy-deep/40 border border-white/5 rounded-3xl hover:border-arctic-violet/30 cursor-pointer group transition-all duration-300 hover:shadow-2xl hover:shadow-arctic-violet/5"
                      >
                          <div className="flex justify-between items-center mb-3">
                              <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">{suggest.stationId}</span>
                              <div className="px-2 py-0.5 rounded-full bg-arctic-violet/10 border border-arctic-violet/20">
                                <span className="text-[9px] font-black text-arctic-violet uppercase">{suggest.distanceText}</span>
                              </div>
                          </div>
                          <div className="flex justify-between items-end">
                              <span className="text-sm font-black text-white group-hover:text-arctic-violet transition-colors">{suggest.name}</span>
                              <div className="text-right">
                                  <span className="text-[9px] text-slate-450 block uppercase font-black tracking-widest mb-0.5">EST. Load</span>
                                  <span className={`text-xs font-black ${suggest.currentOccupancy > 0.8 ? 'text-status-busy' : 'text-neon-emerald'}`}>
                                      {(suggest.currentOccupancy * 100).toFixed(0)}%
                                  </span>
                              </div>
                          </div>
                      </motion.div>
                  ))}
              </div>
          </section>

          {/* Technical Intelligence Label */}
          <div className="p-5 rounded-3xl bg-white/5 border border-white/5 flex gap-4 items-start mb-8">
             <div className="p-2 rounded-2xl bg-white/5">
                <Info className="w-4 h-4 text-slate-450 shrink-0" />
             </div>
             <div className="flex flex-col gap-1">
                <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none mb-1">Inference Engine: {engineName}</span>
                <p className="text-[10px] text-slate-450 font-medium leading-relaxed italic opacity-80">
                  Adaptable Federated weights are processed through a 4-channel Spatio-Temporal GRU. 
                  Recommendations are ranked via Haversine Distance + Occupancy SPI metrics.
                </p>
             </div>
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
