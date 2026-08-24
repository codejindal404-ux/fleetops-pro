import React, { useState, useEffect } from 'react';
import { UserCheck, X, Check, Wrench, RefreshCw } from 'lucide-react';
import { apiClient } from '../services/apiClient.ts';
import { Booking, User } from '../types.ts';

interface AssignMechanicModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignMechanicModal: React.FC<AssignMechanicModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [mechanics, setMechanics] = useState<User[]>([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const loadMechanics = async () => {
      try {
        setFetching(true);
        const users = await apiClient.getUsers();
        const mechs = users.filter((u) => u.role === 'MECHANIC');
        setMechanics(mechs);
        if (mechs.length > 0) {
          setSelectedMechanicId(mechs[0].id);
        }
      } catch (err) {
        console.error('Failed to load mechanics:', err);
      } finally {
        setFetching(false);
      }
    };
    loadMechanics();
  }, [isOpen]);

  if (!isOpen || !booking) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMechanicId) return;

    try {
      setLoading(true);
      setError(null);
      await apiClient.assignMechanic(booking.id, selectedMechanicId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to assign mechanic');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
          <div>
            <h2 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-400" />
              Assign Mechanic to Service
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">Booking #{booking.id.slice(0, 8)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 mb-4 font-mono">
            {error}
          </div>
        )}

        <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 mb-5 space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">Service:</span>
            <span className="text-white font-sans font-semibold">{booking.serviceType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Vehicle:</span>
            <span className="text-amber-400">
              {booking.vehicle?.brand} {booking.vehicle?.model} ({booking.vehicle?.registrationNumber})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Customer:</span>
            <span className="text-slate-200">{booking.customer?.name}</span>
          </div>
        </div>

        {fetching ? (
          <div className="py-8 text-center">
            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-400 font-mono">Loading certified mechanics...</p>
          </div>
        ) : (
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-2">
                Select Certified Mechanic
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mechanics.map((mech) => (
                  <label
                    key={mech.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedMechanicId === mech.id
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold font-sans">{mech.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{mech.email}</p>
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="mechanic"
                      value={mech.id}
                      checked={selectedMechanicId === mech.id}
                      onChange={() => setSelectedMechanicId(mech.id)}
                      className="accent-amber-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !selectedMechanicId}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs py-3 rounded-xl font-['Oswald'] uppercase tracking-wider cursor-pointer active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Assigning...' : 'Confirm Assignment'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
