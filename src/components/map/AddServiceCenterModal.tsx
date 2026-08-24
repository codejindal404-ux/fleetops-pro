import React, { useState } from 'react';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Wrench,
  ShieldCheck,
  Star,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { ServiceCenter } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';

interface AddServiceCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCenter: ServiceCenter) => void;
  userRole?: string;
}

export const AddServiceCenterModal: React.FC<AddServiceCenterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userRole
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('New Delhi');
  const [latitude, setLatitude] = useState('28.6315');
  const [longitude, setLongitude] = useState('77.2167');
  const [phoneNumber, setPhoneNumber] = useState('+91 11 4000 8800');
  const [experienceYears, setExperienceYears] = useState('8');
  const [availableMechanics, setAvailableMechanics] = useState('4');
  const [workingStatus, setWorkingStatus] = useState<'OPEN' | 'BUSY' | 'CLOSED'>('OPEN');
  const [specialtiesStr, setSpecialtiesStr] = useState('Engine Overhaul, Brake Service, EV Battery, Fleet Diagnostics');
  const [isVerified, setIsVerified] = useState(userRole === 'ADMIN');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preset coordinate shortcuts
  const applyPresetCoords = (lat: string, lng: string, defaultCity: string) => {
    setLatitude(lat);
    setLongitude(lng);
    setCity(defaultCity);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim() || !city.trim() || !latitude || !longitude) {
      setError('Please fill in all required fields.');
      return;
    }

    const latNum = parseFloat(latitude);
    const lngNum = parseFloat(longitude);
    if (isNaN(latNum) || isNaN(lngNum)) {
      setError('Latitude and longitude must be valid numerical coordinates.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const specialties = specialtiesStr
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await apiClient.createServiceCenter({
        name: name.trim(),
        address: address.trim(),
        city: city.trim(),
        latitude: latNum,
        longitude: lngNum,
        phoneNumber: phoneNumber.trim(),
        experienceYears: parseInt(experienceYears) || 5,
        availableMechanics: parseInt(availableMechanics) || 3,
        workingStatus,
        specialties,
        isVerified: userRole === 'ADMIN' ? isVerified : false,
        averageRating: 4.8,
        totalReviews: 14,
        totalServicesCompleted: 60
      });

      onSuccess(res.serviceCenter);
      onClose();
    } catch (err: any) {
      console.error('Failed to create service center:', err);
      setError(err.message || 'Failed to register service center.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-add-service-center"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Register Service Center</h2>
              <p className="text-xs text-zinc-400">Add a new garage hub with GPS coordinates to the recommendation map</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Center Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Service Center / Garage Name *
            </label>
            <input
              type="text"
              id="input-center-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex High-Tech Diagnostics & Workshop"
              className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500 placeholder-zinc-500"
            />
          </div>

          {/* Address & City */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Street Address *</label>
              <input
                type="text"
                id="input-center-address"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Plot 42, Industrial Area Phase II"
                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">City *</label>
              <input
                type="text"
                id="input-center-city"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. New Delhi"
                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* GPS Coordinates with Quick Presets */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-300">
                GPS Latitude & Longitude *
              </label>
              <div className="flex gap-1.5 text-[10px] text-zinc-400">
                <span>Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPresetCoords('28.6315', '77.2167', 'New Delhi')}
                  className="text-blue-400 hover:underline"
                >
                  Delhi
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => applyPresetCoords('28.4900', '77.0880', 'Gurugram')}
                  className="text-blue-400 hover:underline"
                >
                  Gurgaon
                </button>
                <span>|</span>
                <button
                  type="button"
                  onClick={() => applyPresetCoords('37.7749', '-122.4194', 'San Francisco')}
                  className="text-blue-400 hover:underline"
                >
                  SF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="number"
                  step="0.000001"
                  id="input-center-lat"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="Latitude (e.g. 28.6315)"
                  className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <input
                  type="number"
                  step="0.000001"
                  id="input-center-lng"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="Longitude (e.g. 77.2167)"
                  className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Operational Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Phone Contact</label>
              <input
                type="text"
                id="input-center-phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 11 4000 8800"
                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Years Experience</label>
              <input
                type="number"
                id="input-center-experience"
                min="0"
                value={experienceYears}
                onChange={(e) => setExperienceYears(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Active Bays / Mechanics</label>
              <input
                type="number"
                id="input-center-mechanics"
                min="1"
                value={availableMechanics}
                onChange={(e) => setAvailableMechanics(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Status & Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Current Operational Status</label>
              <select
                id="select-center-status"
                value={workingStatus}
                onChange={(e) => setWorkingStatus(e.target.value as any)}
                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
              >
                <option value="OPEN">🟢 OPEN (Accepting Bookings)</option>
                <option value="BUSY">🟡 BUSY (High Queue Bay)</option>
                <option value="CLOSED">🔴 CLOSED (Maintenance)</option>
              </select>
            </div>
            {userRole === 'ADMIN' && (
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-200">
                  <input
                    type="checkbox"
                    id="checkbox-center-verified"
                    checked={isVerified}
                    onChange={(e) => setIsVerified(e.target.checked)}
                    className="w-4 h-4 rounded bg-zinc-800 border-zinc-700 text-blue-600 focus:ring-0"
                  />
                  <span>Mark as FleetOps Verified Service Center</span>
                </label>
              </div>
            )}
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Specialties & Services (Comma separated)
            </label>
            <input
              type="text"
              id="input-center-specialties"
              value={specialtiesStr}
              onChange={(e) => setSpecialtiesStr(e.target.value)}
              placeholder="e.g. Engine Diagnostics, Brake Overhaul, EV Battery, AC Service"
              className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="btn-submit-create-center"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-900/40 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
              <span>{loading ? 'Registering...' : 'Register Service Center'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
