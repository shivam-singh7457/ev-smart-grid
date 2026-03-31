import React from 'react';
import { LayoutDashboard, Zap, Activity, ShieldCheck, Timer } from 'lucide-react';
import { motion } from 'framer-motion';

const TopBar = ({ demoMode, setDemoMode }) => {
  const [healthStatus, setHealthStatus] = React.useState('Loading...');

  React.useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setHealthStatus(data.status);
      } catch (error) {
        setHealthStatus('Offline');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const metrics = [
    { label: 'Avg R2 Score', value: '0.7821', icon: Activity, color: 'text-neon-cyan' },
    { label: 'Training Rounds', value: '500', icon: Timer, color: 'text-meta-gold' },
    { 
      label: 'System Status', 
      value: healthStatus, 
      icon: ShieldCheck, 
      color: healthStatus === 'Healthy' ? 'text-status-idle' : 'text-status-busy' 
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-[1000] flex items-center justify-between px-6 glass-panel rounded-none border-t-0 border-x-0">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-neon-blue/20 rounded-lg border border-neon-blue/30">
          <Zap className="w-5 h-5 text-neon-blue" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-widest text-white uppercase leading-none">AFML Smart Grid</h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-tighter mt-1 uppercase">Infrastructure Prediction Engine</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {metrics.map((m, idx) => (
          <div key={idx} className="flex flex-col items-center border-l border-white/5 pl-8 first:border-l-0 first:pl-0">
            <div className="flex items-center gap-2">
              <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</span>
            </div>
            <span className="text-sm font-bold text-slate-200 mt-0.5 tracking-tight">{m.value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 border-l border-white/5 pl-8">
        <div className="flex items-center gap-3">
          <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${demoMode ? 'text-neon-cyan' : 'text-slate-500'}`}>
            Demo Mode
          </span>
          <button 
            onClick={() => setDemoMode(!demoMode)}
            className={`w-10 h-5 rounded-full relative transition-all duration-300 ${demoMode ? 'bg-neon-cyan/40 border-neon-cyan/50' : 'bg-slate-700'}`}
          >
            <motion.div 
              animate={{ x: demoMode ? 20 : 2 }}
              className={`absolute top-0.5 w-4 h-4 rounded-full shadow-lg ${demoMode ? 'bg-neon-cyan shadow-[0_0_8px_rgba(0,242,254,0.8)]' : 'bg-slate-400'}`}
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
