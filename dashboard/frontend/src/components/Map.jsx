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

const Map = ({ stations, onStationClick, selectedStation, demoMode }) => {
  const createTechIcon = (occupancy) => {
    const isBusy = occupancy > 0.8;
    const colorClass = isBusy ? 'marker-busy' : 'marker-idle';
    
    return L.divIcon({
      className: 'bg-transparent',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute w-8 h-8 rounded-full ${isBusy ? 'bg-status-busy/20' : 'bg-status-idle/20'} animate-ping"></div>
          <div class="relative w-4 h-4 rounded-full border-2 border-white shadow-xl ${colorClass}"></div>
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
              <div className="glass-panel p-2 min-w-[120px] border-neon-blue/20 bg-slate-900/90 shadow-neon-blue/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{s.stationId}</span>
                  <span className={`text-[10px] font-bold ${s.currentOccupancy > 0.8 ? 'text-status-busy' : 'text-status-idle'}`}>
                    {(s.currentOccupancy * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${s.currentOccupancy > 0.8 ? 'bg-status-busy' : 'bg-status-idle'}`}
                    style={{ width: `${s.currentOccupancy * 100}%` }}
                  />
                </div>
              </div>
            </Tooltip>
          </Marker>
        ))}

        <RecenterMap center={selectedStation ? [selectedStation.location.coordinates[1], selectedStation.location.coordinates[0]] : null} />
      </MapContainer>

      {/* Decorative Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[24px] border-navy-dark/40 z-10 transition-opacity duration-500 group-hover:opacity-20"></div>
    </div>
  );
};

export default Map;
