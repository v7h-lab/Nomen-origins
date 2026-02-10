import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { LocationData } from '../types';

interface MapVisualizerProps {
  locations: LocationData[];
  selectedLocationIndex: number | null;
  onSelectLocation: (index: number) => void;
}

// Component to handle map view updates
const MapController: React.FC<{ 
    locations: LocationData[], 
    selectedIndex: number | null 
}> = ({ locations, selectedIndex }) => {
  const map = useMap();
  
  useEffect(() => {
    // Determine screen layout
    const isDesktop = window.innerWidth >= 768; // Tailwind md breakpoint
    // On desktop, sidebar is 480px. Add buffer.
    const paddingLeft = isDesktop ? 500 : 50;
    const paddingRight = 50;
    const paddingTop = 50;
    const paddingBottom = 50;

    // Helper to fly to bounds with padding
    const fitWithPadding = (bounds: L.LatLngBounds, zoomLevel?: number) => {
        map.flyToBounds(bounds, {
            paddingTopLeft: [paddingLeft, paddingTop],
            paddingBottomRight: [paddingRight, paddingBottom],
            maxZoom: zoomLevel || 6,
            duration: 2.0 // Smoother, slower animation for tour feeling
        });
    };

    if (selectedIndex !== null && locations[selectedIndex]) {
      const loc = locations[selectedIndex];
      const bounds = L.latLngBounds([[loc.lat, loc.lng], [loc.lat, loc.lng]]);
      fitWithPadding(bounds, 8); // Zoom closer for single location
    } 
    else if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.lat, loc.lng]));
      fitWithPadding(bounds);
    } else {
        map.setView([20, 0], 2);
    }
  }, [locations, selectedIndex, map]);

  return null;
};

const MapVisualizer: React.FC<MapVisualizerProps> = ({ locations, selectedLocationIndex, onSelectLocation }) => {
  
  const getColor = (type: string) => {
    switch (type) {
        case 'origin': return '#6366f1'; // Indigo-500
        case 'usage': return '#10b981';  // Emerald-500
        case 'cultural': return '#f43f5e'; // Rose-500
        default: return '#64748b';
    }
  };

  return (
    <div className="w-full h-full relative bg-slate-100">
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        scrollWheelZoom={true} 
        className="w-full h-full z-0"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        <MapController locations={locations} selectedIndex={selectedLocationIndex} />

        {locations.map((loc, idx) => {
            const isSelected = selectedLocationIndex === idx;
            return (
              <React.Fragment key={idx}>
                <CircleMarker 
                  center={[loc.lat, loc.lng]}
                  pathOptions={{ 
                    color: isSelected ? '#1e293b' : getColor(loc.type), // Dark border if selected
                    fillColor: getColor(loc.type), 
                    fillOpacity: isSelected ? 0.9 : 0.6,
                    weight: isSelected ? 3 : 2,
                    // Add pulse animation if not selected
                    className: `transition-all duration-300 ${isSelected ? '' : 'marker-pulse'}`
                  }}
                  radius={isSelected ? 12 : 8}
                  eventHandlers={{
                    click: () => onSelectLocation(idx)
                  }}
                >
                  <Popup className="font-sans">
                    <div className="p-1 text-center">
                        <strong className="block text-slate-800 text-sm mb-1">{loc.name}</strong>
                        <span className="text-xs uppercase font-bold tracking-wider text-slate-400 block mb-2">{loc.type}</span>
                        <p className="text-xs text-slate-600 m-0 leading-snug">{loc.significance}</p>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
        })}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-6 right-6 z-[400] bg-white/90 backdrop-blur-md p-3 rounded-xl border border-slate-200 shadow-lg text-xs font-medium space-y-2">
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
            <span className="text-slate-600">Origin Root</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-600">Popular Usage</span>
         </div>
         <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="text-slate-600">Cultural/Myth</span>
         </div>
      </div>
    </div>
  );
};

export default MapVisualizer;