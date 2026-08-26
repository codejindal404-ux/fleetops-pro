import React from 'react';
import {
  Bell,
  Calendar,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Plus,
  ChevronRight,
  Zap,
  Car
} from 'lucide-react';
import { Booking, Vehicle } from '../../types.ts';

interface MaintenanceAlert {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePlate: string;
  type: string;
  message: string;
  severity: 'OVERDUE' | 'DUE_SOON' | 'UPCOMING' | 'OK';
  nextServiceDate?: string;
  lastServiceDate?: string;
  currentMileage?: number;
  nextServiceMileage?: number;
  daysUntilDue?: number;
}

interface MaintenanceReminderCardProps {
  reminders?: MaintenanceAlert[];
  vehicles?: Vehicle[];
  bookings?: Booking[];
  onBookService?: (vehicleId?: string, serviceType?: string) => void;
  onNavigate?: (view: string) => void;
}

const SEVERITY_CONFIG = {
  OVERDUE: {
    bg: 'bg-rose-950/40 border-rose-500/40',
    badge: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
    icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
    dot: 'bg-rose-500 animate-pulse',
    label: 'OVERDUE',
    labelColor: 'text-rose-400'
  },
  DUE_SOON: {
    bg: 'bg-amber-950/30 border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
    icon: <Clock className="w-5 h-5 text-amber-400" />,
    dot: 'bg-amber-500',
    label: 'DUE SOON',
    labelColor: 'text-amber-400'
  },
  UPCOMING: {
    bg: 'bg-cyan-950/20 border-cyan-500/30',
    badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
    icon: <Calendar className="w-5 h-5 text-cyan-400" />,
    dot: 'bg-cyan-500',
    label: 'UPCOMING',
    labelColor: 'text-cyan-400'
  },
  OK: {
    bg: 'bg-emerald-950/20 border-emerald-500/30',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
    dot: 'bg-emerald-500',
    label: 'GOOD SHAPE',
    labelColor: 'text-emerald-400'
  }
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
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

// Build synthetic reminders from vehicles + bookings if real reminders not provided
function buildSyntheticReminders(vehicles: Vehicle[], bookings: Booking[]): MaintenanceAlert[] {
  return vehicles.map((v) => {
    const vehicleBookings = bookings.filter(
      (b) => b.vehicleId === v.id || b.vehicle?.id === v.id
    );
    const lastCompleted = vehicleBookings
      .filter((b) => b.status === 'COMPLETED')
      .sort((a, b) => new Date(b.preferredDate || b.createdAt || 0).getTime() - new Date(a.preferredDate || a.createdAt || 0).getTime())[0];

    const lastServiceDate = lastCompleted?.preferredDate || lastCompleted?.createdAt;
    let daysUntilDue = 180;
    let severity: MaintenanceAlert['severity'] = 'OK';

    if (lastServiceDate) {
      const daysSince = Math.floor((Date.now() - new Date(lastServiceDate).getTime()) / (1000 * 60 * 60 * 24));
      daysUntilDue = 180 - daysSince;

      if (daysUntilDue < 0) severity = 'OVERDUE';
      else if (daysUntilDue < 30) severity = 'DUE_SOON';
      else if (daysUntilDue < 60) severity = 'UPCOMING';
      else severity = 'OK';
    } else {
      severity = 'DUE_SOON';
      daysUntilDue = 0;
    }

    const nextServiceDate = lastServiceDate
      ? new Date(new Date(lastServiceDate).getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined;

    return {
      id: `rem-${v.id}`,
      vehicleId: v.id,
      vehicleName: `${v.brand} ${v.model} ${v.year}`,
      vehiclePlate: v.registrationNumber,
      type: 'Routine Service',
      message: daysUntilDue < 0
        ? `Overdue by ${Math.abs(daysUntilDue)} days — schedule service immediately`
        : daysUntilDue === 0
        ? 'No service history found — initial service recommended'
        : `Next service due in ${daysUntilDue} days`,
      severity,
      nextServiceDate,
      lastServiceDate,
      daysUntilDue
    };
  });
}

export const MaintenanceReminderCard: React.FC<MaintenanceReminderCardProps> = ({
  reminders,
  vehicles = [],
  bookings = [],
  onBookService,
  onNavigate
}) => {
  // Use provided reminders or synthesise from data
  const alerts: MaintenanceAlert[] = (reminders && reminders.length > 0)
    ? reminders as MaintenanceAlert[]
    : buildSyntheticReminders(vehicles, bookings);

  const critical = alerts.filter((a) => a.severity === 'OVERDUE' || a.severity === 'DUE_SOON');
  const upcoming = alerts.filter((a) => a.severity === 'UPCOMING');
  const ok = alerts.filter((a) => a.severity === 'OK');

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-rose-950/30 border border-rose-500/20 rounded-2xl p-3.5 text-center">
          <div className="text-2xl font-black text-rose-400 font-mono">{critical.length}</div>
          <div className="text-[10px] text-rose-300 uppercase tracking-wider mt-0.5">Need Attention</div>
        </div>
        <div className="bg-amber-950/20 border border-amber-500/20 rounded-2xl p-3.5 text-center">
          <div className="text-2xl font-black text-amber-400 font-mono">{upcoming.length}</div>
          <div className="text-[10px] text-amber-300 uppercase tracking-wider mt-0.5">Upcoming</div>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-3.5 text-center">
          <div className="text-2xl font-black text-emerald-400 font-mono">{ok.length}</div>
          <div className="text-[10px] text-emerald-300 uppercase tracking-wider mt-0.5">All Good</div>
        </div>
      </div>

      {/* Alert Cards */}
      {alerts.length === 0 ? (
        <div className="p-8 text-center bg-white/5 border border-white/10 rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-white">All Vehicles In Great Shape!</h4>
          <p className="text-xs text-slate-400 mt-1">No maintenance alerts at this time.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const config = SEVERITY_CONFIG[alert.severity];

            return (
              <div
                key={alert.id}
                className={`rounded-2xl border p-4 transition-all ${config.bg}`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: icon + info */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${config.badge} border`}>
                      {config.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-white text-sm">{alert.vehicleName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.badge}`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>

                      {/* Mileage & date info */}
                      <div className="flex flex-wrap gap-3 mt-2.5 text-[11px] text-slate-400 font-mono">
                        {alert.nextServiceDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            Next: <strong className="text-slate-200">{formatDate(alert.nextServiceDate)}</strong>
                          </span>
                        )}
                        {alert.lastServiceDate && (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-slate-500" />
                            Last: {formatDate(alert.lastServiceDate)}
                          </span>
                        )}
                        {alert.vehiclePlate && (
                          <span className="flex items-center gap-1">
                            <Car className="w-3 h-3 text-slate-500" />
                            {alert.vehiclePlate}
                          </span>
                        )}
                      </div>

                      {/* Mileage progress bar (if next service mileage known) */}
                      {alert.currentMileage != null && alert.nextServiceMileage != null && (
                        <div className="mt-3 space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-slate-400">
                              <Gauge className="w-3 h-3 inline mr-1" />
                              {alert.currentMileage.toLocaleString()} km
                            </span>
                            <span className="text-slate-400">{alert.nextServiceMileage.toLocaleString()} km</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                alert.severity === 'OVERDUE' ? 'bg-rose-500' :
                                alert.severity === 'DUE_SOON' ? 'bg-amber-500' :
                                'bg-emerald-500'
                              }`}
                              style={{
                                width: `${Math.min(100, (alert.currentMileage / alert.nextServiceMileage) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Book Now CTA */}
                  {alert.severity !== 'OK' && onBookService && (
                    <button
                      id={`book-reminder-${alert.vehicleId}`}
                      onClick={() => onBookService(alert.vehicleId, alert.type)}
                      className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                        alert.severity === 'OVERDUE'
                          ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/40'
                          : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/40'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Book Now
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View All Reminders Link */}
      {onNavigate && (
        <button
          onClick={() => onNavigate('reminders')}
          className="w-full py-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 text-xs font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
        >
          <Bell className="w-3.5 h-3.5" />
          View All Maintenance Alerts
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default MaintenanceReminderCard;
