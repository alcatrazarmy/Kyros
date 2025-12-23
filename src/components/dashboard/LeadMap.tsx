'use client';

/**
 * LeadMap Component
 * Interactive map displaying leads as pins with Mapbox
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Calendar,
  X,
  Navigation,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from 'lucide-react';
import type { Lead } from '@/types';
import { cn, timeAgo } from '@/lib/utils';

interface LeadMapProps {
  leads: Lead[];
  selectedLead: Lead | null;
  onSelectLead: (lead: Lead | null) => void;
  className?: string;
}

// Status colors for pins
const STATUS_COLORS: Record<string, string> = {
  hot: '#FF0000',
  new: '#00FFFF',
  warm: '#FF6600',
  cold: '#4D4DFF',
  contacted: '#39FF14',
  converted: '#B026FF',
  lost: '#666666',
};

export function LeadMap({
  leads,
  selectedLead,
  onSelectLead,
  className,
}: LeadMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initMap = async () => {
      try {
        const mapboxgl = (await import('mapbox-gl')).default;

        // Check for Mapbox token - if not available, show placeholder
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!mapboxToken) {
          setMapError('Map requires Mapbox token. Set NEXT_PUBLIC_MAPBOX_TOKEN in environment.');
          setIsMapLoaded(true);
          return;
        }

        mapboxgl.accessToken = mapboxToken;

        const container = mapContainerRef.current;
        if (!container) {
          setMapError('Map container not available.');
          setIsMapLoaded(true);
          return;
        }

        const map = new mapboxgl.Map({
          container,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: [-122.4194, 37.7749], // San Francisco
          zoom: 9,
        });

        map.on('load', () => {
          setIsMapLoaded(true);
          mapRef.current = map;
          addMarkers(mapboxgl, map, leads);
        });

        map.on('error', () => {
          setMapError('Failed to load map. Please check your Mapbox configuration.');
          setIsMapLoaded(true);
        });

      } catch (error) {
        console.error('Map initialization error:', error);
        setMapError('Failed to initialize map component.');
        setIsMapLoaded(true);
      }
    };

    initMap();

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Update markers when leads change
  useEffect(() => {
    if (!mapRef.current || !isMapLoaded || mapError) return;

    const updateMarkers = async () => {
      const map = mapRef.current;
      if (!map) return;
      
      const mapboxgl = (await import('mapbox-gl')).default;
      // Remove existing markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      // Add new markers
      addMarkers(mapboxgl, map, leads);
    };

    updateMarkers();
  }, [leads, isMapLoaded, mapError]);

  // Fly to selected lead
  useEffect(() => {
    if (!mapRef.current || !selectedLead) return;

    mapRef.current.flyTo({
      center: [selectedLead.location.coordinates.lng, selectedLead.location.coordinates.lat],
      zoom: 14,
      duration: 1500,
    });
  }, [selectedLead]);

  const addMarkers = (mapboxgl: typeof import('mapbox-gl').default, map: mapboxgl.Map, leadsData: Lead[]) => {
    leadsData.forEach((lead) => {
      const el = document.createElement('div');
      el.className = 'lead-marker';
      el.innerHTML = `
        <div class="relative cursor-pointer transform transition-transform hover:scale-125">
          <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
               style="background-color: ${STATUS_COLORS[lead.status]}20; border-color: ${STATUS_COLORS[lead.status]}">
            <div class="w-2 h-2 rounded-full" style="background-color: ${STATUS_COLORS[lead.status]}"></div>
          </div>
          ${lead.status === 'hot' ? `
            <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
          ` : ''}
        </div>
      `;

      el.addEventListener('click', () => {
        onSelectLead(lead);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lead.location.coordinates.lng, lead.location.coordinates.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  };

  const handleZoomIn = () => {
    mapRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapRef.current?.zoomOut();
  };

  const handleRecenter = () => {
    mapRef.current?.flyTo({
      center: [-122.4194, 37.7749],
      zoom: 9,
      duration: 1000,
    });
  };

  return (
    <div className={cn('relative h-full', className)}>
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-xl overflow-hidden bg-gray-900"
      />

      {/* Placeholder when map can't load */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-xl">
          <div className="text-center p-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center">
              <MapPin className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-400 mb-2">Map View</h3>
            <p className="text-sm text-gray-600 max-w-sm">{mapError}</p>
            
            {/* Show leads list as fallback */}
            <div className="mt-6 space-y-2 max-h-64 overflow-y-auto">
              {leads.slice(0, 5).map((lead) => (
                <button
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className={cn(
                    'w-full p-3 rounded-lg text-left transition-all',
                    'bg-gray-800/50 hover:bg-gray-800 border border-gray-700',
                    selectedLead?.id === lead.id && 'border-cyan-500/50 bg-cyan-500/10'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[lead.status] }}
                    />
                    <span className="text-white text-sm">{lead.name}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{lead.location.city}, {lead.location.state}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-xl">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full border-4 border-cyan-500/30 border-t-cyan-500 animate-spin" />
            <p className="text-gray-400 text-sm">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {isMapLoaded && !mapError && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <motion.button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-gray-900/80 backdrop-blur-sm border border-gray-700 text-gray-400 hover:text-white hover:border-cyan-500/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ZoomIn className="w-5 h-5" />
          </motion.button>
          <motion.button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-gray-900/80 backdrop-blur-sm border border-gray-700 text-gray-400 hover:text-white hover:border-cyan-500/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <ZoomOut className="w-5 h-5" />
          </motion.button>
          <motion.button
            onClick={handleRecenter}
            className="p-2 rounded-lg bg-gray-900/80 backdrop-blur-sm border border-gray-700 text-gray-400 hover:text-white hover:border-cyan-500/50"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Navigation className="w-5 h-5" />
          </motion.button>
        </div>
      )}

      {/* Lead Detail Panel */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-4 top-4 bottom-4 w-80 rounded-xl bg-gray-900/95 backdrop-blur-xl border border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[selectedLead.status] }}
                    />
                    <span
                      className="text-xs font-medium uppercase"
                      style={{ color: STATUS_COLORS[selectedLead.status] }}
                    >
                      {selectedLead.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedLead.name}
                  </h3>
                </div>
                <button
                  onClick={() => onSelectLead(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100%-80px)]">
              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 mt-0.5" />
                <div>
                  <p className="text-sm text-white">{selectedLead.location.address}</p>
                  <p className="text-xs text-gray-400">
                    {selectedLead.location.city}, {selectedLead.location.state} {selectedLead.location.zipCode}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              {selectedLead.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-green-400" />
                  <a href={`tel:${selectedLead.phone}`} className="text-sm text-white hover:text-cyan-400">
                    {selectedLead.phone}
                  </a>
                </div>
              )}

              {selectedLead.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-purple-400" />
                  <a href={`mailto:${selectedLead.email}`} className="text-sm text-white hover:text-cyan-400 truncate">
                    {selectedLead.email}
                  </a>
                </div>
              )}

              {/* Value */}
              {selectedLead.estimatedValue && (
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm text-white">
                    ${selectedLead.estimatedValue.toLocaleString()} estimated value
                  </span>
                </div>
              )}

              {/* System Size */}
              {selectedLead.systemSize && (
                <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">System Size</div>
                  <div className="text-lg font-semibold text-cyan-400">
                    {selectedLead.systemSize} kW
                  </div>
                </div>
              )}

              {/* Permit */}
              {selectedLead.permitNumber && (
                <div className="p-3 rounded-lg bg-gray-800/50 border border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Permit Number</div>
                  <div className="text-sm font-mono text-white">
                    {selectedLead.permitNumber}
                  </div>
                </div>
              )}

              {/* Tags */}
              {selectedLead.tags.length > 0 && (
                <div>
                  <div className="text-xs text-gray-400 mb-2">Tags</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedLead.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedLead.notes && (
                <div>
                  <div className="text-xs text-gray-400 mb-2">Notes</div>
                  <p className="text-sm text-gray-300">{selectedLead.notes}</p>
                </div>
              )}

              {/* Timeline */}
              <div className="pt-4 border-t border-gray-800">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Created {timeAgo(selectedLead.createdAt)}</span>
                </div>
                {selectedLead.lastContactedAt && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <Phone className="w-4 h-4" />
                    <span>Last contacted {timeAgo(selectedLead.lastContactedAt)}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <motion.button
                  className="flex-1 py-2 px-4 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 text-sm font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Contact
                </motion.button>
                <motion.button
                  className="flex-1 py-2 px-4 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/40 text-sm font-medium"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Details
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 p-3 rounded-lg bg-gray-900/90 backdrop-blur-sm border border-gray-700">
        <div className="text-xs text-gray-400 mb-2">Lead Status</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {Object.entries(STATUS_COLORS).slice(0, 6).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-gray-300 capitalize">{status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
