import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Map from './components/Map';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import StationGrid from './components/StationGrid';
import AnalyticsView from './components/AnalyticsView';
import { Loader2, AlertCircle, Cpu, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import stationsMetadata from './stations_metadata.json';

const App = () => {
    const [stations, setStations] = useState([]);
    const [selectedStation, setSelectedStation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSimulated, setIsSimulated] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('map'); // map | list | analytics

    const fetchData = useCallback(async () => {
        try {
            const res = await axios.get('/api/stations');
            if (res.data && res.data.length > 0) {
              setStations(res.data);
              setIsSimulated(false);
            } else {
              // Graceful Fallback if API is empty
              const fallback = stationsMetadata.map(s => ({
                ...s,
                currentOccupancy: 0.5 + (Math.random() * 0.2),
                predictedOccupancy: 0.5 + (Math.random() * 0.3)
              }));
              setStations(fallback);
              setIsSimulated(true);
            }
            setLoading(false);
            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            const fallback = stationsMetadata.map(s => ({
              ...s,
              currentOccupancy: 0.4 + (Math.random() * 0.2),
              predictedOccupancy: 0.4 + (Math.random() * 0.3)
            }));
            setStations(fallback);
            setIsSimulated(true);
            setError('Inference Engine Offline - Engaging Resilient Simulation');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s refresh for live feel
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleStationClick = async (station) => {
        try {
            const res = await axios.get(`/api/stations/status/${station.stationId}`);
            setSelectedStation(res.data);
            if (activeTab !== 'map') setActiveTab('map');
        } catch (err) {
            console.error('Status fetch error:', err);
            setSelectedStation(station);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-navy-deep space-y-6">
                <div className="relative">
                    <Loader2 className="w-16 h-16 text-neon-emerald animate-spin" />
                    <div className="absolute inset-0 blur-2xl bg-neon-emerald/20 animate-pulse"></div>
                </div>
                <span className="text-[10px] font-black text-slate-450 uppercase tracking-[0.3em] animate-pulse">Initializing Neural Grid</span>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-navy-deep text-white overflow-hidden select-none font-sans flex flex-col">
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-[3000] px-6 py-3 bg-red-900/40 border border-red-500/30 rounded-2xl backdrop-blur-2xl flex items-center gap-3 shadow-2xl"
                    >
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-xs font-bold uppercase tracking-wider">{error}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 relative mt-16 overflow-y-auto">
                {activeTab === 'map' && (
                    <div className="w-full h-full relative z-0">
                        {stations.length > 0 ? (
                            <Map 
                                stations={stations} 
                                onStationClick={handleStationClick} 
                                selectedStation={selectedStation}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900/50 italic text-slate-500 uppercase tracking-widest text-[10px]">
                                No grid telemetry received
                            </div>
                        )}
                        
                        <Sidebar 
                            station={selectedStation} 
                            onClose={() => setSelectedStation(null)} 
                            onNavigate={(id) => {
                                const st = stations.find(s => s.stationId === id);
                                if (st) handleStationClick(st);
                            }}
                        />
                        
                        {/* LIVE STREAM STATUS HUD */}
                        <div className="absolute top-8 left-8 z-[1000] glass-panel px-5 py-4 flex items-center gap-6">
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${isSimulated ? 'bg-amber-500' : 'bg-neon-emerald'} animate-pulse shadow-[0_0_10px_currentColor]`} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
                                        {isSimulated ? 'Resilient Sim Mode' : 'Live AFML Stream'}
                                    </span>
                                </div>
                                <span className="text-[9px] text-slate-450 font-medium">
                                    {isSimulated ? 'Engaged for performance continuity' : 'Real-time inference from meta-model v2.1'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'list' && (
                    <StationGrid 
                        stations={stations} 
                        onStationClick={handleStationClick}
                    />
                )}

                {activeTab === 'analytics' && (
                    <AnalyticsView />
                )}
            </main>
        </div>
    );
};

export default App;
