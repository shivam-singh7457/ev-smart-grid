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
    const [demoMode, setDemoMode] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('map'); // map | list | analytics

    const fetchData = useCallback(async () => {
        try {
            const res = await axios.get('/api/stations');
            if (res.data && res.data.length > 0) {
              setStations(res.data);
            } else {
              // Fallback for demo mode if API is empty
              const fallback = stationsMetadata.map(s => ({
                ...s,
                currentOccupancy: Math.random(),
                predictedOccupancy: Math.random()
              }));
              setStations(fallback);
            }
            setLoading(false);
            setError(null);
        } catch (err) {
            console.error('Fetch error:', err);
            // On error, also use fallback data for demo
            const fallback = stationsMetadata.map(s => ({
              ...s,
              currentOccupancy: Math.random(),
              predictedOccupancy: Math.random()
            }));
            setStations(fallback);
            setError('Failed to connect to AFML Inference Engine - Using Cached Metadata');
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            if (!demoMode) fetchData();
        }, 15000);
        return () => clearInterval(interval);
    }, [fetchData, demoMode]);

    // Demo Mode Simulation
    useEffect(() => {
        let interval;
        if (demoMode && stations.length > 0) {
            interval = setInterval(() => {
                setStations(prev => {
                    const newStations = [...prev];
                    const count = Math.floor(Math.random() * 3) + 1;
                    for (let i = 0; i < count; i++) {
                        const idx = Math.floor(Math.random() * newStations.length);
                        newStations[idx] = {
                            ...newStations[idx],
                            currentOccupancy: Math.random(),
                            predictedOccupancy: Math.random()
                        };
                    }
                    return newStations;
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [demoMode, stations.length]);

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
            <div className="flex flex-col items-center justify-center h-screen bg-[#0f172a] space-y-4">
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">Initializing AFML Grid...</span>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen bg-[#0f172a] text-white overflow-hidden select-none font-sans flex flex-col">
            <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

            <AnimatePresence>
                {error && (
                    <motion.div 
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        className="fixed top-20 left-1/2 -translate-x-1/2 z-[3000] px-6 py-3 bg-red-900/40 border border-red-500/50 rounded-xl backdrop-blur-xl flex items-center gap-3 shadow-2xl"
                    >
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <span className="text-sm font-bold uppercase tracking-tight">{error}</span>
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
                                demoMode={demoMode}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-slate-900/50 italic text-slate-500 uppercase tracking-widest text-xs">
                                No infrastructure data received from hub
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
                        
                        {/* Demo Mode HUD */}
                        <div className="absolute top-8 left-8 z-[1000] glass-panel p-4 flex items-center gap-6">
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${demoMode ? 'text-neon-blue' : 'text-slate-500'}`}>Demo Simulation</span>
                                <button 
                                    onClick={() => setDemoMode(!demoMode)}
                                    className={`w-10 h-5 rounded-full relative transition-all duration-300 ${demoMode ? 'bg-neon-blue/40 border-neon-blue/50' : 'bg-slate-700'}`}
                                >
                                    <motion.div 
                                        animate={{ x: demoMode ? 20 : 2 }}
                                        className={`absolute top-0.5 w-4 h-4 rounded-full shadow-lg ${demoMode ? 'bg-neon-blue shadow-[0_0_8px_rgba(79,172,254,0.8)]' : 'bg-slate-400'}`}
                                    />
                                </button>
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
