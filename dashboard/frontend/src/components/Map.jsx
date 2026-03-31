import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';

const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 13, { duration: 1.5 });
  }, [center, map]);
  return null;
};

const Map = ({ stations, onStationClick, selectedStation }) => {
  const createTechIcon = (occupancy) => {
    const isBusy = occupancy > 0.8;
    const colorClass = isBusy ? 'marker-busy' : 'marker-idle';
    
    return L.divIcon({
      className: 'bg-transparent',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full ${isBusy ? 'bg-status-busy/20' : 'bg-status-idle/20'} animate-ping"></div>
          <div class="relative w-4 h-4 rounded-full border-2 border-white/50 shadow-2xl ${colorClass}"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  return (
    <div className="w-full h-full relative group">
      <MapContainer 
        center={[23.1291, 113.2644]} 
        zoom={11} 
        zoomControl={false}
        className="z-0"
        style={{ height: 'calc(100vh - 64px)', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; CARTO'
        />
        
        {stations.map((s) => (
          <Marker 
            key={s.stationId}
            position={[s.location.coordinates[1], s.location.coordinates[0]]}
            icon={createTechIcon(s.currentOccupancy)}
            eventHandlers={{
              click: () => onStationClick(s),
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
              <div className="glass-panel px-3 py-2 min-w-[140px] border-white/5 bg-navy-deep/90">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest">{s.stationId}</span>
                  <span className={`text-[10px] font-black ${s.currentOccupancy > 0.8 ? 'text-status-busy' : 'text-neon-emerald'}`}>
                    {(s.currentOccupancy * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-700 ${s.currentOccupancy > 0.8 ? 'bg-status-busy shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-neon-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}
                    style={{ width: `${s.currentOccupancy * 100}%` }}
                  />
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}

        <RecenterMap center={selectedStation ? [selectedStation.location.coordinates[1], selectedStation.location.coordinates[0]] : null} />
      </MapContainer>

      {/* Decorative Gradient Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-navy-deep to-transparent pointer-events-none z-10 transition-opacity duration-500 opacity-60"></div>
    </div>
  );
};

export default Map;
