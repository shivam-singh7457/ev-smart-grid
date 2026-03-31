import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Info, TrendingUp, ShieldCheck, Zap, ServerIcon } from 'lucide-react';

const convergenceData = [
  { round: 0, r2: 0.22 },
  { round: 50, r2: 0.35 },
  { round: 100, r2: 0.48 },
  { round: 150, r2: 0.58 },
  { round: 200, r2: 0.65 },
  { round: 250, r2: 0.70 },
  { round: 300, r2: 0.73 },
  { round: 350, r2: 0.75 },
  { round: 400, r2: 0.76 },
  { round: 450, r2: 0.77 },
  { round: 500, r2: 0.78 },
];

const PerformanceHub = () => {
  return (
    <motion.div 
      initial={{ y: 200, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-6 left-6 z-[1000] flex gap-6"
    >
      <div className="glass-panel p-6 w-[450px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[2px] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neon-cyan" />
            Meta-Learning Convergence
          </h3>
          <span className="text-[10px] font-bold text-neon-cyan px-2 py-0.5 rounded border border-neon-cyan/20 bg-neon-cyan/5">500 Rounds</span>
        </div>
        
        <div className="h-32 w-full mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={convergenceData}>
              <defs>
                <linearGradient id="r2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
              <XAxis dataKey="round" hide />
              <YAxis domain={[0, 1]} hide />
              <Tooltip 
                contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ fontSize: '10px' }}
              />
              <Area type="monotone" dataKey="r2" stroke="#00f2fe" strokeWidth={2} fillOpacity={1} fill="url(#r2Gradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
             <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Accuracy Boost</span>
             <span className="text-lg font-bold text-slate-200">+14.2%</span>
          </div>
          <div className="space-y-1">
             <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest block">Deployment Round</span>
             <span className="text-lg font-bold text-slate-200">R500 (Final)</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 w-[350px] border-status-idle/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-status-idle/10 rounded-lg">
            <Zap className="w-4 h-4 text-status-idle" />
          </div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-[2px]">AFML Mechanism Success</h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
          Global Meta-Model (ϕ) successfully integrates spatio-temporal correction by capturing 3-NN adjacency context. 
          <span className="block mt-2 font-semibold text-slate-200 italic">Individual Deployment success of AFML mechanism confirmed on Guangzhou Edge Nodes.</span>
        </p>
        <div className="flex gap-4">
            <div className="flex items-center gap-2">
                <ServerIcon className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 tracking-tight">35 Nodes</span>
            </div>
            <div className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 tracking-tight">GeoJSON Point Map</span>
            </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PerformanceHub;
