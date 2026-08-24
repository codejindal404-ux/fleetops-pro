import React, { useState, useEffect } from 'react';
import { X, Wrench, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { Vehicle } from '../types.ts';

interface NewServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onSubmitBooking: (vehicleId: string, serviceType: string, preferredDate: string) => void;
  preselectedVehicle?: Vehicle | null;
  onOpenAddVehicle?: () => void;
  onQuickAddVehicle?: (vehicleData: { registrationNumber: string; brand: string; model: string; year: number; vehicleType?: string }) => Promise<void>;
}

export const NewServiceModal: React.FC<NewServiceModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onSubmitBooking,
  preselectedVehicle,
  onOpenAddVehicle,
  onQuickAddVehicle
}) => {
  const [vehicleId, setVehicleId] = useState<string>(preselectedVehicle?.id || (vehicles[0]?.id || ''));
  const [serviceType, setServiceType] = useState<string>('Full Engine Diagnostic & Fluid Check');
  const [preferredDate, setPreferredDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState<string>('09:00 AM - 11:00 AM (Morning Slot)');
  const [isAddingQuickVehicle, setIsAddingQuickVehicle] = useState<boolean>(false);

  // Synchronize state whenever modal opens or vehicle list/preselected vehicle updates
  useEffect(() => {
    if (isOpen) {
      if (preselectedVehicle?.id) {
        setVehicleId(preselectedVehicle.id);
      } else if (vehicles.length > 0) {
        if (!vehicleId || !vehicles.some((v) => v.id === vehicleId)) {
          setVehicleId(vehicles[0].id);
        }
      } else {
        setVehicleId('');
      }
    }
  }, [isOpen, preselectedVehicle, vehicles]);

  if (!isOpen) return null;

  const handleQuickAdd = async () => {
    if (!onQuickAddVehicle) return;
    setIsAddingQuickVehicle(true);
    try {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      await onQuickAddVehicle({
        registrationNumber: `FL-${randomNum}-X`,
        brand: 'Ford',
        model: 'Transit Custom',
        year: 2024,
        vehicleType: 'VAN'
      });
    } catch (err) {
      console.error('Failed to quick add vehicle:', err);
    } finally {
      setIsAddingQuickVehicle(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) return;
    onSubmitBooking(vehicleId, serviceType, preferredDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md p-6 space-y-4 shadow-xl">
        <div className="flex justify-between items-center border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-base text-slate-900 font-['Oswald'] uppercase tracking-wide">Request Bay Service</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {vehicles.length === 0 ? (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-mono font-bold text-amber-900">No Vehicles Registered</p>
                <p className="text-[11px] text-amber-700">
                  You need at least one registered vehicle in your fleet to request a bay service booking.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {onOpenAddVehicle && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAddVehicle();
                  }}
                  className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-['Oswald'] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>Register Fleet Vehicle</span>
                </button>
              )}

              {onQuickAddVehicle && (
                <button
                  type="button"
                  disabled={isAddingQuickVehicle}
                  onClick={handleQuickAdd}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold font-['Oswald'] uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-xs disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAddingQuickVehicle ? 'Adding Vehicle...' : '⚡ Add Sample Demo Vehicle (Ford Transit)'}</span>
                </button>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-700 font-mono font-bold">Select Fleet Vehicle</label>
                {onOpenAddVehicle && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAddVehicle();
                    }}
                    className="text-[11px] font-mono font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add New</span>
                  </button>
                )}
              </div>
              <select
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-amber-700 focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Select Registered Vehicle --</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.registrationNumber}) - {v.vehicleType || 'CAR'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-mono font-bold mb-1">Service Work Order</label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
              >
                <option value="Full Engine Diagnostic & Fluid Check">Full Engine Diagnostic & Fluid Check</option>
                <option value="Brake Pad & Rotor Replacement">Brake Pad & Rotor Replacement</option>
                <option value="Tire Rotation & Laser Wheel Alignment">Tire Rotation & Laser Wheel Alignment</option>
                <option value="Full Synthetic Engine Oil Change">Full Synthetic Engine Oil Change</option>
                <option value="Transmission Inspection & Service">Transmission Inspection & Service</option>
                <option value="Electrical System & Battery Check">Electrical System & Battery Check</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-mono font-bold mb-1">Preferred Bay Schedule Date & Time Slot</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                />
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  <option value="09:00 AM - 11:00 AM (Morning Slot)">09:00 AM (Morning Slot)</option>
                  <option value="11:30 AM - 01:30 PM (Mid-Day Slot)">11:30 AM (Mid-Day Slot)</option>
                  <option value="02:30 PM - 04:30 PM (Afternoon Slot)">02:30 PM (Afternoon Slot)</option>
                  <option value="05:00 PM - 07:00 PM (Evening Slot)">05:00 PM (Evening Slot)</option>
                </select>
              </div>
            </div>

            {/* Service Duration & Policy */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Estimated Bay Duration: ~90 mins</span>
                <span className="text-emerald-600">Est. Cost: ~$120 - $280</span>
              </div>
              <p className="text-[10px] text-slate-500">
                🛡️ <strong>Free Cancellation:</strong> You may modify or cancel this appointment at zero penalty before mechanic check-in.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!vehicleId}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold font-['Oswald'] uppercase tracking-wider transition-colors shadow-xs disabled:opacity-50"
              >
                Submit Service Booking
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
