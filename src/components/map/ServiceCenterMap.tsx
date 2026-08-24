import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ServiceCenterRecommendation, ServiceCenter } from '../../types.ts';
import { Layers, ZoomIn, ZoomOut, Compass, Navigation } from 'lucide-react';

interface ServiceCenterMapProps {
  userLat: number;
  userLng: number;
  serviceCenters: (ServiceCenterRecommendation | ServiceCenter)[];
  selectedCenterId?: string | null;
  onSelectCenter: (center: ServiceCenter) => void;
  onBookService: (center: ServiceCenter) => void;
  radiusKm?: number;
}

export const ServiceCenterMap: React.FC<ServiceCenterMapProps> = ({
  userLat,
  userLng,
  serviceCenters,
  selectedCenterId,
  onSelectCenter,
  onBookService,
  radiusKm = 50
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const routesGroupRef = useRef<L.LayerGroup | null>(null);
  const radiusGroupRef = useRef<L.LayerGroup | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const [mapTileTheme, setMapTileTheme] = useState<'standard' | 'dark' | 'voyager'>('voyager');

  // Tile layer URLs
  const getTileLayer = (theme: 'standard' | 'dark' | 'voyager') => {
    switch (theme) {
      case 'dark':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        };
      case 'voyager':
        return {
          url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
        };
      default:
        return {
          url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; OpenStreetMap contributors'
        };
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    isMountedRef.current = true;
    if (!mapContainerRef.current) return;

    const validLat = typeof userLat === 'number' && !isNaN(userLat) ? userLat : 28.6315;
    const validLng = typeof userLng === 'number' && !isNaN(userLng) ? userLng : 77.2167;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [validLat, validLng],
        zoom: 12,
        zoomControl: false,
        attributionControl: false,
        fadeAnimation: false
      });

      const tileConfig = getTileLayer(mapTileTheme);
      const tileLayer = L.tileLayer(tileConfig.url, {
        maxZoom: 19,
        attribution: tileConfig.attribution
      }).addTo(map);
      tileLayerRef.current = tileLayer;

      markersGroupRef.current = L.layerGroup().addTo(map);
      routesGroupRef.current = L.layerGroup().addTo(map);
      radiusGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;

      // Handle map resize observer for responsive containers safely
      const resizeObserver = new ResizeObserver(() => {
        if (isMountedRef.current && mapInstanceRef.current && mapContainerRef.current) {
          if (mapContainerRef.current.offsetWidth > 0 && mapContainerRef.current.offsetHeight > 0) {
            try {
              mapInstanceRef.current.invalidateSize();
            } catch (e) {
              // Ignore resize edge-cases during teardown
            }
          }
        }
      });
      resizeObserver.observe(mapContainerRef.current);
      resizeObserverRef.current = resizeObserver;
    }

    return () => {
      isMountedRef.current = false;
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {
          // Ignore removal errors
        }
        mapInstanceRef.current = null;
        tileLayerRef.current = null;
        markersGroupRef.current = null;
        routesGroupRef.current = null;
        radiusGroupRef.current = null;
      }
    };
  }, []);

  // 2. Update Tiles on theme toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !isMountedRef.current) return;
    const map = mapInstanceRef.current;

    try {
      if (tileLayerRef.current && map.hasLayer(tileLayerRef.current)) {
        map.removeLayer(tileLayerRef.current);
      }
      const tileConfig = getTileLayer(mapTileTheme);
      const newTileLayer = L.tileLayer(tileConfig.url, {
        maxZoom: 19,
        attribution: tileConfig.attribution
      }).addTo(map);
      tileLayerRef.current = newTileLayer;
    } catch (e) {
      console.warn('Failed to swap map tiles:', e);
    }
  }, [mapTileTheme]);

  // 3. Render Markers, Radius, and User Pin
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const routesGroup = routesGroupRef.current;
    const radiusGroup = radiusGroupRef.current;
    if (!map || !markersGroup || !routesGroup || !radiusGroup || !isMountedRef.current) return;

    try {
      markersGroup.clearLayers();
      routesGroup.clearLayers();
      radiusGroup.clearLayers();
    } catch (e) {
      return;
    }

    const validLat = typeof userLat === 'number' && !isNaN(userLat) ? userLat : 28.6315;
    const validLng = typeof userLng === 'number' && !isNaN(userLng) ? userLng : 77.2167;

    // User Location Marker
    const userIcon = L.divIcon({
      className: 'custom-user-marker',
      html: `
        <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(59, 130, 246, 0.35); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 20px; height: 20px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10;">
            <div style="width: 6px; height: 6px; border-radius: 50%; background: #ffffff;"></div>
          </div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    try {
      const userMarker = L.marker([validLat, validLng], { icon: userIcon, zIndexOffset: 1000 }).addTo(markersGroup);
      userMarker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; color: #18181b;">
          <strong style="color: #2563eb; font-size: 13px;">📍 Your Current Location</strong>
          <div style="font-size: 11px; color: #71717a; margin-top: 2px;">Lat: ${validLat.toFixed(4)}, Lon: ${validLng.toFixed(4)}</div>
        </div>
      `);
    } catch (e) {}

    // Radius Circle
    if (radiusKm > 0) {
      try {
        L.circle([validLat, validLng], {
          radius: radiusKm * 1000,
          color: '#3b82f6',
          fillColor: '#3b82f6',
          fillOpacity: 0.06,
          weight: 1.5,
          dashArray: '4, 6'
        }).addTo(radiusGroup);
      } catch (e) {}
    }

    // Service Center Markers
    const bounds = L.latLngBounds([[validLat, validLng]]);
    let validCenterCount = 0;

    serviceCenters.forEach((center) => {
      const cLat = Number(center.latitude);
      const cLng = Number(center.longitude);
      if (isNaN(cLat) || isNaN(cLng)) return;

      validCenterCount++;
      bounds.extend([cLat, cLng]);
      const isSelected = selectedCenterId === center.id;
      const isBest = center.isBestChoice;

      // Dynamic pin colors
      const pinColor = isBest ? '#f59e0b' : isSelected ? '#3b82f6' : '#10b981';
      const pinBg = isBest ? '#78350f' : isSelected ? '#1e3a8a' : '#064e3b';
      const badgeHtml = isBest ? '⭐' : '🔧';
      const rating = typeof center.averageRating === 'number' && !isNaN(center.averageRating) ? center.averageRating : 4.8;

      const customIcon = L.divIcon({
        className: `custom-garage-marker-${center.id}`,
        html: `
          <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transition: transform 0.2s ease;">
            <div style="
              background: ${pinBg};
              border: 2px solid ${pinColor};
              border-radius: 12px;
              padding: 4px 8px;
              color: #ffffff;
              font-size: 11px;
              font-weight: 700;
              box-shadow: 0 4px 12px rgba(0,0,0,0.45);
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
              transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            ">
              <span>${badgeHtml}</span>
              <span>${(center.name || 'Center').split(' ')[0]}</span>
              <span style="font-size: 10px; opacity: 0.85; margin-left: 2px; color: #fbbf24;">★${rating.toFixed(1)}</span>
            </div>
            <div style="
              width: 0; 
              height: 0; 
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 7px solid ${pinColor};
              margin-top: -1px;
            "></div>
          </div>
        `,
        iconSize: [120, 36],
        iconAnchor: [60, 36],
        popupAnchor: [0, -36]
      });

      try {
        const marker = L.marker([cLat, cLng], {
          icon: customIcon,
          zIndexOffset: isBest ? 900 : isSelected ? 800 : 500
        }).addTo(markersGroup);

        // Popup Content
        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 220px; max-width: 280px; padding: 6px; color: #18181b;">
            ${isBest ? '<div style="background: #fef3c7; color: #92400e; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; display: inline-block; margin-bottom: 4px;">⭐ TOP RECOMMENDED CHOICE</div>' : ''}
            <div style="font-weight: 800; font-size: 14px; color: #09090b; line-height: 1.2;">${center.name || 'Service Center'}</div>
            <div style="font-size: 11px; color: #71717a; margin-top: 2px;">${center.address || ''}, ${center.city || ''}</div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 6px; border-top: 1px solid #e4e4e7; font-size: 11px;">
              <div>
                <span style="color: #f59e0b; font-weight: bold;">★ ${rating.toFixed(1)}</span>
                <span style="color: #71717a;"> (${center.totalReviews || 0} reviews)</span>
              </div>
              <div style="font-weight: bold; color: #2563eb;">
                ${center.distanceText || (center.distanceKm !== undefined ? `${center.distanceKm.toFixed(1)} km` : '')}
              </div>
            </div>

            <div style="margin-top: 6px; font-size: 10px; color: #52525b; display: flex; gap: 8px;">
              <span>🔧 ${center.totalServicesCompleted || 0}+ repairs</span>
              <span>⏱️ ${center.experienceYears || 5}y exp</span>
              <span>🟢 ${center.workingStatus || 'OPEN'}</span>
            </div>

            <button
              id="popup-btn-book-${center.id}"
              style="
                width: 100%;
                margin-top: 10px;
                background: #2563eb;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 8px;
                font-weight: 700;
                font-size: 11px;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(37,99,235,0.3);
              "
            >
              📅 Book Service at This Center
            </button>
          </div>
        `;

        marker.bindPopup(popupHtml);

        marker.on('click', () => {
          onSelectCenter(center);
        });

        marker.on('popupopen', () => {
          setTimeout(() => {
            const btn = document.getElementById(`popup-btn-book-${center.id}`);
            if (btn) {
              btn.onclick = (e) => {
                e.preventDefault();
                onBookService(center);
              };
            }
          }, 50);
        });
      } catch (e) {}
    });

    // Draw route line to selected center
    if (selectedCenterId) {
      const selected = serviceCenters.find((c) => c.id === selectedCenterId);
      if (selected) {
        const sLat = Number(selected.latitude);
        const sLng = Number(selected.longitude);
        if (!isNaN(sLat) && !isNaN(sLng)) {
          try {
            L.polyline(
              [
                [validLat, validLng],
                [sLat, sLng]
              ],
              {
                color: '#3b82f6',
                weight: 3.5,
                opacity: 0.8,
                dashArray: '6, 8',
                lineCap: 'round'
              }
            ).addTo(routesGroup);

            if (mapContainerRef.current && mapContainerRef.current.offsetWidth > 0 && mapContainerRef.current.offsetHeight > 0) {
              map.fitBounds(
                L.latLngBounds([
                  [validLat, validLng],
                  [sLat, sLng]
                ]),
                { padding: [50, 50], maxZoom: 14, animate: false }
              );
            }
          } catch (e) {}
          return;
        }
      }
    }

    try {
      if (mapContainerRef.current && mapContainerRef.current.offsetWidth > 0 && mapContainerRef.current.offsetHeight > 0) {
        if (validCenterCount > 0) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13, animate: false });
        } else {
          map.setView([validLat, validLng], 12, { animate: false });
        }
      }
    } catch (e) {}
  }, [userLat, userLng, serviceCenters, selectedCenterId, radiusKm]);

  // Controls
  const handleZoomIn = () => {
    try {
      if (mapInstanceRef.current && isMountedRef.current) {
        mapInstanceRef.current.zoomIn();
      }
    } catch (e) {}
  };

  const handleZoomOut = () => {
    try {
      if (mapInstanceRef.current && isMountedRef.current) {
        mapInstanceRef.current.zoomOut();
      }
    } catch (e) {}
  };

  const handleCenterOnUser = () => {
    try {
      if (mapInstanceRef.current && isMountedRef.current) {
        const validLat = typeof userLat === 'number' && !isNaN(userLat) ? userLat : 28.6315;
        const validLng = typeof userLng === 'number' && !isNaN(userLng) ? userLng : 77.2167;
        mapInstanceRef.current.setView([validLat, validLng], 13, { animate: false });
      }
    } catch (e) {}
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950">
      {/* Map DOM Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 min-h-[420px]" />

      {/* Map HUD Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Layer Theme Toggle */}
        <div className="bg-zinc-900/90 backdrop-blur-md p-1 rounded-xl border border-zinc-700/80 shadow-lg flex flex-col gap-1">
          <button
            type="button"
            title="Clean Voyager Map"
            onClick={() => setMapTileTheme('voyager')}
            className={`p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              mapTileTheme === 'voyager' ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">Light</span>
          </button>
          <button
            type="button"
            title="Dark High-Contrast Map"
            onClick={() => setMapTileTheme('dark')}
            className={`p-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              mapTileTheme === 'dark' ? 'bg-blue-600 text-white' : 'text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">Dark</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="bg-zinc-900/90 backdrop-blur-md rounded-xl border border-zinc-700/80 shadow-lg flex flex-col divide-y divide-zinc-800">
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2.5 text-zinc-200 hover:bg-zinc-800 transition-colors rounded-t-xl"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2.5 text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleCenterOnUser}
            title="Center on My Location"
            className="p-2.5 text-blue-400 hover:bg-zinc-800 transition-colors rounded-b-xl"
          >
            <Navigation className="w-4 h-4 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-10 bg-zinc-900/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-zinc-800 shadow-xl text-xs text-zinc-300 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-300/30" />
          <span>My GPS</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-300/30" />
          <span className="font-bold text-amber-300">⭐ Top Recommended</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span>Open Service Centers</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 text-[11px] text-zinc-500 border-l border-zinc-800 pl-3">
          <Compass className="w-3 h-3 text-zinc-400" />
          <span>Search Radius: {radiusKm > 0 ? `${radiusKm} km` : 'Worldwide'}</span>
        </div>
      </div>
    </div>
  );
};

