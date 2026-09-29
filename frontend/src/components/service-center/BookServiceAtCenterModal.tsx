import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Wrench,
  Car,
  MapPin,
  Star,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { ServiceCenter, Vehicle } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';

interface BookServiceAtCenterModalProps {
  center: ServiceCenter | null;
  isOpen: boolean;
  onClose: () => void;
  onBookingSuccess?: () => void;
  onSuccess?: () => void;
}

export const BookServiceAtCenterModal: React.FC<BookServiceAtCenterModalProps> = ({
  center,
  isOpen,
  onClose,
  onBookingSuccess,
  onSuccess
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('Full Periodic Maintenance');
  const [preferredDate, setPreferredDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingVehicles, setFetchingVehicles] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && center) {
      loadCustomerVehicles();
    }
  }, [isOpen, center]);

  const loadCustomerVehicles = async () => {
    setFetchingVehicles(true);
    setError(null);
    try {
      const myVehicles = await apiClient.getVehicles();
      setVehicles(myVehicles);
      if (myVehicles.length > 0) {
        setSelectedVehicleId(myVehicles[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load customer vehicles:', err);
      setError('Failed to fetch your registered fleet vehicles.');
    } finally {
      setFetchingVehicles(false);
    }
  };

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId) {
      setError('Please select a vehicle or register one first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.createBooking({
        vehicleId: selectedVehicleId,
        serviceCenterId: center.id,
        serviceType,
        preferredDate: new Date(preferredDate).toISOString()
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onBookingSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create booking at service center:', err);
      setError(err.message || 'Failed to complete booking.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="modal-book-service-center"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">Book Service Appointment</h2>
              <p className="text-xs text-zinc-400">Reserve priority workshop bay at {center.name}</p>
            </div>
          </div>
          <button
            type="button"
            id="btn-close-booking-modal"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Garage Quick Summary Card */}
        <div className="p-4 mx-5 mt-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-200">{center.name}</span>
              {center.isVerified && (
                <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-500/30 font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-zinc-400 mt-1">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <span>{center.address}, {center.city}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-2">
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {center.averageRating.toFixed(1)} ({center.totalReviews} reviews)
              </span>
              <span>•</span>
              <span className="text-emerald-400 font-medium">
                🟢 {center.workingStatus || 'OPEN'} ({center.availableMechanics ?? 3} bays active)
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleBook} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/80 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-950/50 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Booking reserved successfully! Redirecting to queue...</span>
            </div>
          )}

          {/* Vehicle Selection */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Select Fleet Vehicle *
            </label>
            {fetchingVehicles ? (
              <div className="flex items-center gap-2 p-3 bg-zinc-800/50 rounded-xl text-xs text-zinc-400 border border-zinc-700">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> Loading your vehicles...
              </div>
            ) : vehicles.length === 0 ? (
              <div className="p-3 bg-amber-950/30 rounded-xl text-xs text-amber-300 border border-amber-800/60">
                No vehicles found on your profile. Please add a vehicle first under "My Vehicles".
              </div>
            ) : (
              <select
                id="select-booking-vehicle"
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-medium"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.brand} {v.model} ({v.year}) [{v.vehicleType}]
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Service Package Type */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Service Type & Diagnostics *
            </label>
            <select
              id="select-booking-service-type"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-medium"
            >
              <option value="Full Periodic Maintenance">Full Periodic Maintenance & Fluids (120-Point)</option>
              <option value="Engine & Powertrain Diagnostics">Engine & Powertrain Diagnostics (OBD-II Remap)</option>
              <option value="Brake System Overhaul & Pads">Brake System Overhaul, Discs & Hydraulic Flush</option>
              <option value="Transmission & Clutch Repair">Transmission Tuning & Clutch Replacement</option>
              <option value="EV / Hybrid Battery Health Check">EV / Hybrid Battery Diagnostics & High-Voltage Check</option>
              <option value="Suspension & Wheel Alignment">Suspension Overhaul & Laser Wheel Alignment</option>
              <option value="Express Oil & Filter Change">Express Oil & Filter Change (30 Min Quick Bay)</option>
            </select>
          </div>

          {/* Preferred Date */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Preferred Appointment Date *
            </label>
            <div className="relative">
              <input
                type="date"
                id="input-booking-preferred-date"
                value={preferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPreferredDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Notes / Special Instructions */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Additional Fault Notes / Symptoms (Optional)
            </label>
            <textarea
              id="input-booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="e.g. Squeaking brake noise at low speeds, check tire tread depth..."
              className="w-full px-3.5 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-xs text-zinc-100 focus:outline-none focus:border-blue-500 placeholder-zinc-500 resize-none"
            />
          </div>

          {/* Modal Actions */}
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
              id="btn-submit-center-booking"
              disabled={loading || fetchingVehicles || vehicles.length === 0 || success}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-900/40 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
              <span>{loading ? 'Confirming...' : 'Confirm Workshop Booking'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
