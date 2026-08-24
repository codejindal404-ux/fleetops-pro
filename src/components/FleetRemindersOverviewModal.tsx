import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  Gauge,
  Clock,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  X,
  Wrench,
  ChevronRight,
  ShieldCheck,
  Search,
  Filter
} from 'lucide-react';
import { Vehicle } from '../types.ts';
import { apiClient } from '../services/apiClient.ts';

interface FleetRemindersOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  onSelectVehicleReminder: (vehicle: Vehicle) => void;
  onBookService: (vehicle: Vehicle) => void;
}

export const FleetRemindersOverviewModal: React.FC<FleetRemindersOverviewModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  onSelectVehicleReminder,
  onBookService
}) => {
  if (!isOpen) return null;

  const [filter, setFilter] = useState<'ALL' | 'DUE_SOON' | 'OVERDUE' | 'OK'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleScanFleet = async () => {
    setIsScanning(true);
    try {
      const res = await apiClient.checkAllFleetReminders(true);
      setScanMessage(res.message || 'Fleet maintenance scan completed.');
      setTimeout(() => setScanMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to scan fleet reminders.');
    } finally {
      setIsScanning(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch =
      v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'ALL') return true;
    return v.reminderStatus === filter;
  });

  const overdueCount = vehicles.filter((v) => v.reminderStatus === 'OVERDUE').length;
  const dueSoonCount = vehicles.filter((v) => v.reminderStatus === 'DUE_SOON').length;
  const okCount = vehicles.filter((v) => !v.reminderStatus || v.reminderStatus === 'OK').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl space-y-0 text-slate-900 relative">
        
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  Fleet Service Horizon
                </span>
                <span className="text-xs font-mono text-slate-400">{vehicles.length} Monitored Vehicles</span>
              </div>
              <h2 className="text-2xl font-bold font-['Oswald'] uppercase tracking-wide text-white mt-1">
                Fleet Recurring Maintenance Manager
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleScanFleet}
              disabled={isScanning}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-700 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Evaluating...' : 'Scan Fleet Now'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scan message */}
        {scanMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{scanMessage}</span>
          </div>
        )}

        {/* Summary Metrics Bar */}
        <div className="grid grid-cols-3 gap-3 p-6 bg-slate-50 border-b border-slate-200">
          <button
            onClick={() => setFilter('OVERDUE')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              filter === 'OVERDUE' ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-400' : 'bg-rose-50 border-rose-200 hover:bg-rose-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-rose-700">Overdue Service</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-bold font-['Oswald'] text-rose-950 mt-1">{overdueCount}</p>
            <p className="text-[10px] font-mono text-rose-600 mt-0.5">Immediate bay booking required</p>
          </button>

          <button
            onClick={() => setFilter('DUE_SOON')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              filter === 'DUE_SOON' ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400' : 'bg-amber-50 border-amber-200 hover:bg-amber-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-800">Due In 30 Days</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold font-['Oswald'] text-amber-950 mt-1">{dueSoonCount}</p>
            <p className="text-[10px] font-mono text-amber-700 mt-0.5">30-day window or mileage alert</p>
          </button>

          <button
            onClick={() => setFilter('OK')}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              filter === 'OK' ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-800">Compliant / OK</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold font-['Oswald'] text-emerald-950 mt-1">{okCount}</p>
            <p className="text-[10px] font-mono text-emerald-700 mt-0.5">All intervals up to date</p>
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="px-6 py-3 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search registration, brand, model..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                filter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({vehicles.length})
            </button>
            <button
              onClick={() => setFilter('DUE_SOON')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                filter === 'DUE_SOON' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Due Soon ({dueSoonCount})
            </button>
            <button
              onClick={() => setFilter('OVERDUE')}
              className={`px-3 py-1 text-xs font-mono font-bold rounded-lg transition-all ${
                filter === 'OVERDUE' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Overdue ({overdueCount})
            </button>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="p-6 max-h-[55vh] overflow-y-auto space-y-3">
          {filteredVehicles.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-mono text-xs">
              No vehicles found matching current maintenance filter.
            </div>
          ) : (
            filteredVehicles.map((v) => {
              const status = v.reminderStatus || 'OK';
              return (
                <div
                  key={v.id}
                  className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {v.registrationNumber}
                      </span>
                      <h4 className="font-['Oswald'] uppercase font-bold text-slate-900 text-base">
                        {v.brand} {v.model} ({v.year})
                      </h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500">
                      <span className="flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        {(v.mileage || 0).toLocaleString()} mi
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Due: {v.nextServiceDueDate || 'N/A'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 text-slate-400" />
                        Target: {(v.nextMaintenanceMileage || 0).toLocaleString()} mi
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 ${
                        status === 'OVERDUE'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : status === 'DUE_SOON'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {status === 'OVERDUE' && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                      {status === 'DUE_SOON' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      {status === 'OK' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>
                        {status === 'OVERDUE' ? 'Overdue' : status === 'DUE_SOON' ? 'Due Soon (30d)' : 'OK'}
                      </span>
                    </span>

                    <button
                      onClick={() => {
                        onClose();
                        onSelectVehicleReminder(v);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold font-mono transition-all"
                    >
                      Configure
                    </button>

                    <button
                      onClick={() => {
                        onClose();
                        onBookService(v);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-['Oswald'] uppercase font-bold text-xs rounded-xl tracking-wider transition-all shadow-2xs"
                    >
                      Book Bay
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>Automated 30-Day Periodic Reminders Engine Active</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
