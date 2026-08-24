import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Bell, User as UserIcon, Code2, LogOut, UserCog, AlertTriangle, Clock, Wrench, CheckCircle, X, Gauge, Calendar, ChevronRight } from 'lucide-react';
import { User, Vehicle } from '../types.ts';
import { NotificationBell } from './notifications/NotificationBell.tsx';

interface TopBarProps {
  user: User | null;
  token?: string | null;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onOpenPostman: () => void;
  onLogout: () => void;
  onOpenEditProfile?: () => void;
  onNavigate?: (tabOrLink: string) => void;
  vehicles?: Vehicle[];
  onBookServiceForVehicle?: (vehicle: Vehicle) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  user,
  token,
  searchTerm,
  setSearchTerm,
  onOpenPostman,
  onLogout,
  onOpenEditProfile,
  onNavigate,
  vehicles = [],
  onBookServiceForVehicle
}) => {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [filterType, setFilterType] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON'>('ALL');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute maintenance alerts from vehicles
  const maintenanceAlerts = useMemo(() => {
    return vehicles.map((v) => {
      const currentMileage = v.mileage ?? 45000;
      const targetMileage = v.nextMaintenanceMileage ?? (currentMileage + 3000);
      const kmRemaining = targetMileage - currentMileage;

      const now = new Date();
      let daysRemaining = 30;
      if (v.nextServiceDueDate) {
        const dueDate = new Date(v.nextServiceDueDate);
        const diffTime = dueDate.getTime() - now.getTime();
        daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      } else {
        daysRemaining = Math.max(1, Math.round(kmRemaining / 100));
      }

      const isMileageOverdue = kmRemaining <= 0;
      const isMileageDueSoon = kmRemaining > 0 && kmRemaining <= 2000;

      const isTimeOverdue = daysRemaining <= 0;
      const isTimeDueSoon = daysRemaining > 0 && daysRemaining <= 14;

      let alertType: 'OVERDUE' | 'DUE_SOON' | 'OK' = 'OK';
      let urgencyText = 'Up-to-Date';

      if (isMileageOverdue || isTimeOverdue) {
        alertType = 'OVERDUE';
        urgencyText = isMileageOverdue
          ? `Overdue by ${Math.abs(kmRemaining).toLocaleString()} mi`
          : `Overdue by ${Math.abs(daysRemaining)} days`;
      } else if (isMileageDueSoon || isTimeDueSoon) {
        alertType = 'DUE_SOON';
        urgencyText = isTimeDueSoon && daysRemaining <= 7
          ? `Due in ${daysRemaining} days`
          : `Due in ${kmRemaining.toLocaleString()} mi`;
      }

      return {
        vehicle: v,
        alertType,
        currentMileage,
        targetMileage,
        kmRemaining,
        daysRemaining,
        urgencyText
      };
    }).filter((item) => item.alertType !== 'OK');
  }, [vehicles]);

  const overdueCount = useMemo(() => maintenanceAlerts.filter(a => a.alertType === 'OVERDUE').length, [maintenanceAlerts]);
  const dueSoonCount = useMemo(() => maintenanceAlerts.filter(a => a.alertType === 'DUE_SOON').length, [maintenanceAlerts]);

  const filteredAlerts = useMemo(() => {
    if (filterType === 'OVERDUE') return maintenanceAlerts.filter(a => a.alertType === 'OVERDUE');
    if (filterType === 'DUE_SOON') return maintenanceAlerts.filter(a => a.alertType === 'DUE_SOON');
    return maintenanceAlerts;
  }, [maintenanceAlerts, filterType]);

  return (
    <header className="sticky top-0 z-40 h-16 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/90 px-8 flex items-center justify-between shadow-lg">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-80">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search ID, Customer, Registration..."
            className="w-full pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-mono"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Role Badge */}
        {user && (
          <div
            className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
              user.role === 'ADMIN'
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                : user.role === 'MECHANIC'
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-blue-500/40 bg-blue-500/10 text-blue-300'
            }`}
          >
            <span>{user.role === 'ADMIN' ? '👑 ADMIN' : user.role === 'MECHANIC' ? '🔧 MECHANIC' : '🚗 CUSTOMER'}</span>
          </div>
        )}

        {/* Postman Collection Viewer Button */}
        <button
          onClick={onOpenPostman}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 text-xs font-mono font-semibold transition-all shadow-sm"
          title="View & Export Postman API Collection"
        >
          <Code2 className="w-3.5 h-3.5 text-amber-500" />
          <span>Postman API</span>
        </button>

        {/* Real-Time Socket.IO Notification System */}
        <NotificationBell token={token || null} onNavigate={onNavigate} />

        {/* Maintenance Telemetry Alert Popover */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
              maintenanceAlerts.length > 0
                ? 'bg-rose-500/10 text-rose-400 border-rose-500/40 hover:bg-rose-500/20'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="Scheduled Maintenance Telemetry Alerts"
          >
            <Gauge className="w-4 h-4" />
            {maintenanceAlerts.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-rose-600 text-white text-[10px] font-mono font-bold rounded-full flex items-center justify-center ring-2 ring-slate-950 shadow-md">
                {maintenanceAlerts.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Popover Header */}
              <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-100 font-['Oswald'] uppercase tracking-wider">
                      Maintenance Alerts
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Mileage & Service Schedule Telemetry
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Filter Tabs */}
              {maintenanceAlerts.length > 0 && (
                <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-1.5 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => setFilterType('ALL')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      filterType === 'ALL'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All ({maintenanceAlerts.length})
                  </button>
                  {overdueCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterType('OVERDUE')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        filterType === 'OVERDUE'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold'
                          : 'text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      Overdue ({overdueCount})
                    </button>
                  )}
                  {dueSoonCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterType('DUE_SOON')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        filterType === 'DUE_SOON'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
                          : 'text-slate-400 hover:text-amber-400'
                      }`}
                    >
                      Due Soon ({dueSoonCount})
                    </button>
                  )}
                </div>
              )}

              {/* Popover Alert List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {filteredAlerts.length === 0 ? (
                  <div className="p-6 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-xs font-bold text-slate-300">All Fleet Vehicles Up-to-Date</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">No scheduled maintenance alerts triggered at this time.</p>
                  </div>
                ) : (
                  filteredAlerts.map(({ vehicle, alertType, currentMileage, targetMileage, urgencyText }) => (
                    <div
                      key={vehicle.id}
                      className="p-3.5 hover:bg-slate-850/50 transition-colors flex flex-col gap-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                              {vehicle.registrationNumber}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 uppercase">
                              {vehicle.brand} {vehicle.model}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                            <Gauge className="w-3 h-3 text-slate-500" />
                            <span>{currentMileage.toLocaleString()} / {targetMileage.toLocaleString()} mi</span>
                          </p>
                        </div>

                        <span
                          className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded border shrink-0 ${
                            alertType === 'OVERDUE'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          }`}
                        >
                          {urgencyText}
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-500 font-mono">
                          {vehicle.nextServiceDueDate ? `Due: ${vehicle.nextServiceDueDate}` : 'Maintenance interval'}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setIsNotificationsOpen(false);
                            if (onBookServiceForVehicle) {
                              onBookServiceForVehicle(vehicle);
                            }
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 font-['Oswald'] uppercase tracking-wider cursor-pointer"
                        >
                          <Wrench className="w-3 h-3" />
                          <span>Book Service</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Popover Footer */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 font-mono">
                  Showing real-time maintenance interval status
                </span>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-rose-400 hover:border-rose-500/30 hover:bg-rose-500/10 text-xs font-semibold transition-all shadow-sm"
          title="Sign Out of Session"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-500/80" />
          <span className="hidden sm:inline font-['Oswald'] uppercase tracking-wider">Sign Out</span>
        </button>
      </div>
    </header>
  );
};

