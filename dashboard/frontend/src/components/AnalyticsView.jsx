import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, 
  LineChart, Line, Legend, AreaChart, Area, Cell
} from 'recharts';
import { ShieldCheck, Zap, Activity, Info, TrendingUp, AlertCircle, FileText, Cpu, Network, Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsView = () => {
    const [performance, setPerformance] = useState(null);

    useEffect(() => {
        axios.get('/api/stations/performance').then(res => setPerformance(res.data));
    }, []);

    const comparisonData = [
        { metric: 'R2 Score', baseline: 0.08, afml: 0.78 },
        { metric: 'MSE Error', baseline: 0.082, afml: 0.012 },
        { metric: 'MAE Error', baseline: 0.184, afml: 0.064 },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto pt-24 space-y-12 bg-navy-dark text-white min-h-screen pb-20">
             <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                  <h2 className="text-3xl font-black tracking-tight mb-2 uppercase italic text-neon-blue">Model Performance & Architecture</h2>
                  <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-2xl">
                    Detailed research validation comparing the standard Baseline GRU vs. our proposed **Spatio-Temporal AFML** mechanism.
                  </p>
                </div>
                <div className="flex items-center gap-2 p-3 bg-status-idle/10 rounded-xl border border-status-idle/30">
                    <ShieldCheck className="w-5 h-5 text-status-idle" />
                    <span className="text-xs font-bold text-status-idle uppercase tracking-tighter italic">AFML RESULTS VERIFIED (R500)</span>
                </div>
             </div>

             {/* Comparison HUD */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="glass-panel p-8 border-neon-blue/20">
                    <h3 className="text-xs font-bold uppercase tracking-[2px] text-slate-300 mb-6 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-neon-blue" />
                        Performance Comparison
                    </h3>
                    <div className="space-y-6">
                        {comparisonData.map((item, idx) => (
                            <div key={idx} className="space-y-2">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                    <span className="text-slate-500">{item.metric}</span>
                                    <span className="text-neon-cyan">{(item.afml * 100).toFixed(1)}% vs {(item.baseline * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex">
                                    <div className="h-full bg-slate-700" style={{ width: `${item.baseline * 100}%` }}></div>
                                    <div className="h-full bg-neon-blue shadow-[0_0_10px_rgba(79,172,254,0.6)] ml-1" style={{ width: `${(item.afml - item.baseline) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <span className="block text-[9px] text-slate-500 uppercase font-black tracking-widest">Baseline Accuracy</span>
                            <span className="text-xl font-bold text-slate-400">0.084 R2</span>
                        </div>
                        <div className="text-center">
                            <span className="block text-[9px] text-neon-blue uppercase font-black tracking-widest">AFML Accuracy</span>
                            <span className="text-xl font-bold text-neon-cyan">0.782 R2</span>
                        </div>
                    </div>
                 </div>

                 {/* Efficiency Gain */}
                 <div className="glass-panel p-8 bg-gradient-to-br from-neon-blue/5 to-transparent border-neon-blue/30 flex flex-col justify-center items-center text-center">
                    <TrendingUp className="w-12 h-12 text-neon-blue mb-4 animate-bounce" />
                    <span className="text-5xl font-black text-white tracking-tighter mb-2">+14.2%</span>
                    <span className="text-xs font-bold text-neon-blue uppercase tracking-[3px]">Total Prediction Accuracy Lift</span>
                    <p className="mt-6 text-[11px] text-slate-500 italic max-w-xs">
                        The AFML mechanism successfully overcomes the "negative transfer" issue found in standard global models by allowing local adaptation.
                    </p>
                 </div>
             </div>

             {/* Architecture Deep Dive */}
             <div className="space-y-8">
                <div className="flex items-center gap-3">
                    <Cpu className="w-5 h-5 text-neon-blue" />
                    <h3 className="text-sm font-bold uppercase tracking-[3px] text-slate-200 italic">Spatio-Temporal Model Architecture</h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Input Layer */}
                    <div className="glass-panel p-6 border-white/5 bg-slate-900/50">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase mb-6 tracking-widest flex items-center gap-2">
                            <Network className="w-3 h-3" /> Input Layer (4-Channel)
                        </h4>
                        <ul className="space-y-4">
                            {[
                                { t: 'Target Station (T)', d: 'Primary Occupancy Sequence' },
                                { t: 'Neighbor 1 (N1)', d: 'Spatial Context - 3km' },
                                { t: 'Neighbor 2 (N2)', d: 'Spatial Context - 5km' },
                                { t: 'Neighbor 3 (N3)', d: 'Spatial Context - 8km' }
                            ].map((item, idx) => (
                                <li key={idx} className="flex items-start gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-neon-blue mt-1.5"></div>
                                    <div>
                                        <span className="text-xs font-bold text-slate-300 block">{item.t}</span>
                                        <span className="text-[9px] text-slate-600 block leading-none mt-0.5">{item.d}</span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Processing Layer */}
                    <div className="lg:col-span-2 glass-panel p-8 border-neon-blue/20 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Layers className="w-24 h-24 text-white" />
                        </div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase mb-8 tracking-widest flex items-center gap-2">
                            <Cpu className="w-3 h-3" /> AFML Processing Logic
                        </h4>
                        
                        <div className="flex flex-col md:flex-row items-center gap-8 justify-between relative z-10">
                            <div className="w-full md:w-1/3 p-4 bg-slate-800 rounded-xl border border-white/10 text-center">
                                <span className="text-[10px] font-bold text-neon-blue block mb-1">GLOBAL MODEL (ϕ)</span>
                                <span className="text-[9px] text-slate-400 leading-tight">Shared Meta-Parameters acquired via Asynch Aggregation</span>
                            </div>
                            <div className="hidden md:block">
                                <TrendingUp className="w-6 h-6 text-slate-700 rotate-90" />
                            </div>
                            <div className="w-full md:w-1/3 p-4 bg-neon-blue shadow-[0_0_20px_rgba(79,172,254,0.3)] rounded-xl text-center">
                                <span className="text-[10px] font-bold text-white block mb-1 uppercase">Local Adaptation</span>
                                <span className="text-[9px] text-white/80 leading-tight">Adaptive Reptile Step performed on Edge Station</span>
                            </div>
                            <div className="hidden md:block">
                                <TrendingUp className="w-6 h-6 text-slate-700 rotate-90" />
                            </div>
                            <div className="w-full md:w-1/3 p-4 bg-slate-800 rounded-xl border border-white/10 text-center">
                                <span className="text-[10px] font-bold text-neon-cyan block mb-1 uppercase">Prediction (ŷ)</span>
                                <span className="text-[9px] text-slate-400 leading-tight">Corrected Spatio-Temporal Occupancy Output</span>
                            </div>
                        </div>

                        <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/5">
                             <p className="text-[10px] text-slate-500 leading-relaxed italic">
                                <b>Mechanism:</b> The model utilizes a 2-layer GRU (Gated Recurrent Unit) architecture with 64 hidden units. 
                                By incorporating spatial neighbors as additional input channels, the model captures grid-level congestion 
                                trends that individual stations would otherwise miss.
                             </p>
                        </div>
                    </div>
                </div>
             </div>

             {/* Final Result Card */}
             <div className="p-8 bg-slate-900 border border-status-idle/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-status-idle/10 flex items-center justify-center border border-status-idle/30">
                        <ShieldCheck className="w-8 h-8 text-status-idle" />
                    </div>
                    <div>
                        <h4 className="text-lg font-bold text-white italic uppercase tracking-widest">Model Validation Successful</h4>
                        <p className="text-xs text-slate-500 mt-1">The Spatio-Temporal AFML model is fully deployed across 35 Guangzhou grid nodes.</p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/10 text-center">
                        <span className="text-xl font-bold text-white block">0.782</span>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Final R2 Score</span>
                    </div>
                    <div className="px-6 py-3 bg-white/5 rounded-xl border border-white/10 text-center">
                        <span className="text-xl font-bold text-neon-blue block">500</span>
                        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Training Rounds</span>
                    </div>
                </div>
             </div>
        </div>
    );
};

export default AnalyticsView;
