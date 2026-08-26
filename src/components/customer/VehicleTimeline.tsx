import React, { useState } from 'react';
import {
  Wrench,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Package,
  Zap,
  Droplets,
  Wind
} from 'lucide-react';
import { Booking } from '../../types.ts';

interface TimelineEvent {
  id: string;
  date: string;
  serviceType: string;
  status: string;
  cost?: number;
  mechanicName?: string;
  serviceCenterName?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  notes?: string;
  partsReplaced?: string[];
}

interface VehicleTimelineProps {
  bookings?: Booking[];
  vehicleId?: string;
  vehicleName?: string;
}

const SERVICE_ICON: Record<string, React.ReactNode> = {
  'Oil Change': <Droplets className="w-4 h-4" />,
  'Brake Service': <Zap className="w-4 h-4" />,
  'Engine Repair': <Wrench className="w-4 h-4" />,
  'AC Service': <Wind className="w-4 h-4" />,
  'General Inspection': <CheckCircle2 className="w-4 h-4" />,
};

const SERVICE_COLOR: Record<string, string> = {
  COMPLETED: 'from-emerald-500 to-teal-500',
  CANCELLED: 'from-rose-500 to-red-500',
  REPAIRING: 'from-amber-500 to-orange-500',
  INSPECTION: 'from-cyan-500 to-blue-500',
  PENDING: 'from-slate-500 to-slate-600',
  DEFAULT: 'from-indigo-500 to-purple-500'
};

function getServiceColor(status: string): string {
  return SERVICE_COLOR[status] || SERVICE_COLOR.DEFAULT;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export const VehicleTimeline: React.FC<VehicleTimelineProps> = ({
  bookings = [],
  vehicleId,
  vehicleName
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter by vehicleId if provided, then sort newest first
  const filteredBookings = (vehicleId
    ? bookings.filter((b) => b.vehicleId === vehicleId || b.vehicle?.id === vehicleId)
    : bookings
  ).sort((a, b) => {
    const dateA = new Date(a.preferredDate || a.createdAt || 0).getTime();
    const dateB = new Date(b.preferredDate || b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  // Convert bookings to timeline events
  const events: TimelineEvent[] = filteredBookings.map((b) => ({
    id: b.id,
    date: b.preferredDate || b.createdAt || '',
    serviceType: b.serviceType,
    status: b.status,
    cost: b.estimatedCost || b.invoice?.amount,
    mechanicName: b.mechanic?.name || b.mechanicName,
    serviceCenterName: b.serviceCenter?.name,
    vehicleBrand: b.vehicle?.brand,
    vehicleModel: b.vehicle?.model,
    vehiclePlate: b.vehicle?.registrationNumber,
    notes: b.issueDescription,
    partsReplaced: (b.repairLogs || [])
      .flatMap((log: any) => log.partsUsed || [])
      .filter(Boolean)
  }));

  const completedCount = events.filter((e) => e.status === 'COMPLETED').length;
  const totalSpend = events.reduce((sum, e) => sum + (e.cost || 0), 0);

  if (events.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-3xl p-10 text-center space-y-3">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
          <Wrench className="w-7 h-7 text-indigo-400" />
        </div>
        <h3 className="font-bold text-white text-sm">No Service History Yet</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Your vehicle's complete service timeline will appear here once you've booked your first service.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header Stats */}
      <div className="flex flex-wrap gap-3">
        <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          {completedCount} Completed Services
        </div>
        <div className="px-4 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300 flex items-center gap-2">
          <DollarSign className="w-3.5 h-3.5" />
          ${totalSpend.toLocaleString()} Total Invested
        </div>
        {vehicleName && (
          <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300">
            {vehicleName}
          </div>
        )}
      </div>

      {/* Timeline Rail */}
      <div className="relative">
        {/* Vertical connecting rail */}
        <div className="absolute left-[23px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500/60 via-slate-700 to-slate-800 rounded-full" />

        <div className="space-y-1">
          {events.map((event, idx) => {
            const isExpanded = expandedId === event.id;
            const isLast = idx === events.length - 1;
            const colorGradient = getServiceColor(event.status);

            return (
              <div key={event.id} className="relative pl-14">
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-4 w-11 h-11 rounded-2xl bg-gradient-to-br ${colorGradient} flex items-center justify-center text-white shadow-lg z-10`}
                >
                  {SERVICE_ICON[event.serviceType] || <Wrench className="w-4 h-4" />}
                </div>

                {/* Event Card */}
                <div
                  className={`mb-3 rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'bg-slate-800/60 border-indigo-500/40 shadow-lg shadow-indigo-500/5'
                      : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Card Header — Always visible */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : event.id)}
                    className="w-full text-left p-4 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-0.5">
                        <span className="font-bold text-white text-sm">{event.serviceType}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                            event.status === 'COMPLETED'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : event.status === 'CANCELLED'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {event.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {formatDate(event.date)}
                        </span>
                        {event.vehicleBrand && (
                          <span>{event.vehicleBrand} {event.vehicleModel}</span>
                        )}
                        {event.cost != null && event.cost > 0 && (
                          <span className="text-emerald-400 font-bold">${event.cost.toFixed(0)}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 space-y-3 border-t border-slate-700/60">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                        {event.mechanicName && (
                          <div className="flex items-start gap-2 text-xs">
                            <User className="w-3.5 h-3.5 text-indigo-400 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">Technician</div>
                              <div className="text-white font-semibold">{event.mechanicName}</div>
                            </div>
                          </div>
                        )}
                        {event.serviceCenterName && (
                          <div className="flex items-start gap-2 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">Service Center</div>
                              <div className="text-white font-semibold">{event.serviceCenterName}</div>
                            </div>
                          </div>
                        )}
                        {event.cost != null && event.cost > 0 && (
                          <div className="flex items-start gap-2 text-xs">
                            <DollarSign className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                              <div className="text-slate-400 text-[10px] uppercase tracking-wide mb-0.5">Total Cost</div>
                              <div className="text-emerald-400 font-bold text-sm">${event.cost.toFixed(2)}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {event.notes && (
                        <div className="bg-slate-950/60 rounded-xl p-3 text-xs text-slate-300 border border-slate-800">
                          <span className="text-slate-500 text-[10px] uppercase tracking-wide block mb-1">Issue Reported</span>
                          {event.notes}
                        </div>
                      )}

                      {event.partsReplaced && event.partsReplaced.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                            <Package className="w-3 h-3" /> Parts Replaced
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {event.partsReplaced.map((part, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-mono"
                              >
                                {part}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* WO Number */}
                      <div className="text-[10px] text-slate-600 font-mono pt-1">
                        Work Order #{event.id.slice(-8).toUpperCase()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default VehicleTimeline;
