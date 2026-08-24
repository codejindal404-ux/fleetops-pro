import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Star,
  Zap,
  Activity,
  ShieldCheck,
  Building,
  MapPin,
  Flame,
  Radio,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { MechanicProfile, MechanicAvailabilityStatus } from '../../types.ts';

interface MechanicProfileHeaderProps {
  profile: MechanicProfile | null;
  onUpdateAvailability: (status: MechanicAvailabilityStatus) => Promise<void>;
  isLoading?: boolean;
}

export const MechanicProfileHeader: React.FC<MechanicProfileHeaderProps> = ({
  profile,
  onUpdateAvailability,
  isLoading
}) => {
  const [updating, setUpdating] = useState(false);

  const handleStatusChange = async (status: MechanicAvailabilityStatus) => {
    if (updating || profile?.availability === status) return;
    setUpdating(true);
    try {
      await onUpdateAvailability(status);
    } finally {
      setUpdating(false);
    }
  };

  const availability = profile?.availability || 'AVAILABLE';

  const availabilityConfig = {
    AVAILABLE: {
      label: 'Available for Dispatch',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      dotClass: 'bg-emerald-400 animate-pulse',
      btnActive: 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40 ring-2 ring-emerald-400'
    },
    BUSY: {
      label: 'Bay Busy / In Repair',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      dotClass: 'bg-amber-400',
      btnActive: 'bg-amber-600 text-white shadow-lg shadow-amber-900/40 ring-2 ring-amber-400'
    },
    OFFLINE: {
      label: 'Off Shift / Offline',
      badgeClass: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
      dotClass: 'bg-slate-500',
      btnActive: 'bg-slate-700 text-white shadow-lg shadow-slate-900/40 ring-2 ring-slate-400'
    }
  };

  return (
    <div className="space-y-6">
      {/* Mechanic Profile Banner Card */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden">
        {/* Glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* Left: Mechanic Identity & Center Info */}
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-500 p-0.5 shadow-xl flex-shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-2xl flex items-center justify-center text-amber-400">
                <Wrench className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>MASTER CERTIFIED TECHNICIAN</span>
                </span>
                <span className={`px-3 py-1 rounded-full border text-xs font-mono font-medium flex items-center gap-1.5 ${availabilityConfig[availability].badgeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${availabilityConfig[availability].dotClass}`} />
                  <span>{availabilityConfig[availability].label}</span>
                </span>
                {profile?.badgeNumber && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs">
                    {profile.badgeNumber}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-['Oswald'] uppercase mt-2">
                {profile?.name || 'Master Technician'}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-amber-400" />
                  <span className="font-semibold text-slate-200">{profile?.serviceCenterName || 'FleetOps Central Technical Hub'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{profile?.serviceCenterCity || 'San Francisco, CA'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>{profile?.shiftName || 'Shift: 08:00 - 17:00'}</span>
                </div>
              </div>

              {/* Specialties */}
              {profile?.specialties && profile.specialties.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {profile.specialties.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 font-mono"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Interactive Availability Toggle Buttons */}
          <div className="w-full lg:w-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-inner flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1">
                <Radio className="w-3 h-3 text-amber-400" />
                Bay Status Toggle
              </span>
              {updating && (
                <span className="text-[10px] text-amber-400 font-mono animate-pulse">Syncing...</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                type="button"
                id="btn-availability-available"
                disabled={updating}
                onClick={() => handleStatusChange('AVAILABLE')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono uppercase transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  availability === 'AVAILABLE'
                    ? availabilityConfig.AVAILABLE.btnActive
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Available
              </button>

              <button
                type="button"
                id="btn-availability-busy"
                disabled={updating}
                onClick={() => handleStatusChange('BUSY')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono uppercase transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  availability === 'BUSY'
                    ? availabilityConfig.BUSY.btnActive
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Busy
              </button>

              <button
                type="button"
                id="btn-availability-offline"
                disabled={updating}
                onClick={() => handleStatusChange('OFFLINE')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold font-mono uppercase transition-all duration-200 flex items-center justify-center gap-1.5 ${
                  availability === 'OFFLINE'
                    ? availabilityConfig.OFFLINE.btnActive
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-slate-500" />
                Offline
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Completed */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {profile?.completedJobsCount ?? 0}
          </div>
          <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1">
            <span>Repairs Finalized</span>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Active Jobs</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Activity className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {profile?.activeJobsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">In Repair Bay</div>
        </div>

        {/* Pending Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Pending</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {profile?.pendingJobsCount ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">Queue & Diagnostics</div>
        </div>

        {/* Avg Repair Time */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Avg Time</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            1.8 <span className="text-xs text-slate-400 font-normal">hrs</span>
          </div>
          <div className="text-[11px] text-purple-400 font-mono mt-1">Turnaround Rate</div>
        </div>

        {/* Customer Rating */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">CSAT Rating</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-300 font-mono flex items-center gap-1">
            {profile?.rating ? profile.rating.toFixed(1) : '4.9'}
            <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-1">
            {profile?.totalRatingsCount ?? 12} Verified Reviews
          </div>
        </div>

        {/* Efficiency Score */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase tracking-wider">Efficiency</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {profile?.efficiencyScore ?? 95}%
          </div>
          <div className="text-[11px] text-cyan-300 font-mono mt-1">98.2% First-Time Fix</div>
        </div>
      </div>
    </div>
  );
};
