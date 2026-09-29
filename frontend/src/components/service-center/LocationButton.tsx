import React, { useState } from 'react';
import { Navigation, MapPin, Loader2, ChevronDown, Check, Compass } from 'lucide-react';

export interface LocationPreset {
  label: string;
  city: string;
  lat: number;
  lng: number;
}

export const LOCATION_PRESETS: LocationPreset[] = [
  { label: 'Delhi (Connaught Place)', city: 'New Delhi', lat: 28.6315, lng: 77.2167 },
  { label: 'Gurgaon (Cyber Hub)', city: 'Gurugram', lat: 28.4900, lng: 77.0880 },
  { label: 'Noida (Sector 62)', city: 'Noida', lat: 28.6280, lng: 77.3649 },
  { label: 'Aerocity / Airport NH-48', city: 'New Delhi', lat: 28.5535, lng: 77.1215 },
  { label: 'Dwarka (Sector 12)', city: 'New Delhi', lat: 28.5921, lng: 77.0460 },
  { label: 'San Francisco (SoMa & Downtown)', city: 'San Francisco', lat: 37.7749, lng: -122.4194 }
];

interface LocationButtonProps {
  currentLat: number;
  currentLng: number;
  onLocationChange: (lat: number, lng: number, label?: string) => void;
  isLoading?: boolean;
}

export const LocationButton: React.FC<LocationButtonProps> = ({
  currentLat,
  currentLng,
  onLocationChange,
  isLoading = false
}) => {
  const [locating, setLocating] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser');
      setShowPresets(true);
      return;
    }

    setLocating(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onLocationChange(position.coords.latitude, position.coords.longitude, 'My Current GPS Location');
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error or permission denied:', err.message);
        setErrorMsg('GPS location blocked or unavailable. Selected quick preset below.');
        setShowPresets(true);
        // Fallback to Delhi default
        onLocationChange(28.6315, 77.2167, 'Delhi (Connaught Place)');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const handleSelectPreset = (preset: LocationPreset) => {
    onLocationChange(preset.lat, preset.lng, preset.label);
    setShowPresets(false);
    setErrorMsg(null);
  };

  // Find if current coordinates match a preset
  const matchedPreset = LOCATION_PRESETS.find(
    (p) => Math.abs(p.lat - currentLat) < 0.005 && Math.abs(p.lng - currentLng) < 0.005
  );

  return (
    <div className="relative inline-flex items-center gap-2">
      {/* Primary GPS Button */}
      <button
        type="button"
        id="btn-detect-gps-location"
        onClick={handleGetCurrentLocation}
        disabled={locating || isLoading}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-900/30 transition-all disabled:opacity-50"
      >
        {locating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Navigation className="w-3.5 h-3.5 animate-pulse" />
        )}
        <span>{locating ? 'Locating...' : 'Use My GPS'}</span>
      </button>

      {/* Preset Selector Dropdown Trigger */}
      <button
        type="button"
        id="btn-location-presets-toggle"
        onClick={() => setShowPresets(!showPresets)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-medium transition-all"
      >
        <MapPin className="w-3.5 h-3.5 text-amber-400" />
        <span className="max-w-[160px] truncate">
          {matchedPreset ? matchedPreset.label : `${currentLat.toFixed(3)}, ${currentLng.toFixed(3)}`}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
      </button>

      {/* Dropdown Menu */}
      {showPresets && (
        <div
          id="location-presets-menu"
          className="absolute z-50 top-full left-0 mt-2 w-72 p-2 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl space-y-1"
        >
          <div className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between border-b border-zinc-800">
            <span className="flex items-center gap-1">
              <Compass className="w-3 h-3 text-blue-400" /> Test Location Presets
            </span>
            <button
              onClick={() => setShowPresets(false)}
              className="text-zinc-500 hover:text-zinc-300 text-xs"
            >
              ✕
            </button>
          </div>

          {errorMsg && (
            <div className="p-2 mx-1 my-1 text-[11px] bg-amber-950/50 border border-amber-800/60 text-amber-300 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-1 py-1">
            {LOCATION_PRESETS.map((preset) => {
              const isSelected =
                Math.abs(preset.lat - currentLat) < 0.005 && Math.abs(preset.lng - currentLng) < 0.005;
              return (
                <button
                  key={preset.label}
                  type="button"
                  id={`preset-${preset.city.toLowerCase()}`}
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-300 font-semibold border border-blue-500/40'
                      : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-zinc-200">{preset.label}</span>
                    <span className="text-[10px] text-zinc-500">
                      Lat: {preset.lat.toFixed(4)}, Lon: {preset.lng.toFixed(4)}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
