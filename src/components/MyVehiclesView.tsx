import React, { useState, useEffect } from 'react';
import {
  Car,
  Truck,
  Bus,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Wrench,
  Search,
  X,
  Filter,
  RotateCcw,
  Maximize2,
  Sparkles,
  Eye,
  History,
  Clock,
  Bell,
  Calendar,
  Gauge,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { Vehicle, Booking, User } from '../types.ts';
import { apiClient } from '../services/apiClient.ts';
import { ServiceReminderModal } from './ServiceReminderModal.tsx';
import { FleetRemindersOverviewModal } from './FleetRemindersOverviewModal.tsx';

import vehicleSedanImg from '../assets/images/vehicle_sedan_1785355520687.jpg';
import vehicleTruckImg from '../assets/images/vehicle_truck_1785355537774.jpg';
import vehicleVanImg from '../assets/images/vehicle_van_1785355569391.jpg';
import vehicleBusImg from '../assets/images/vehicle_bus_1785355604471.jpg';

interface MyVehiclesViewProps {
  vehicles: Vehicle[];
  bookings?: Booking[];
  user: User | null;
  onOpenAddVehicle: () => void;
  onBookServiceForVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: string) => void;
  searchTerm: string;
  onVehicleUpdated?: (updated: Vehicle) => void;
}

export const MyVehiclesView: React.FC<MyVehiclesViewProps> = ({
  vehicles,
  bookings = [],
  user,
  onOpenAddVehicle,
  onBookServiceForVehicle,
  onDeleteVehicle,
  searchTerm,
  onVehicleUpdated
}) => {
  const [query, setQuery] = useState<string>(searchTerm || '');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('ALL');
  const [selectedPreviewVehicle, setSelectedPreviewVehicle] = useState<Vehicle | null>(null);
  const [selectedReminderVehicle, setSelectedReminderVehicle] = useState<Vehicle | null>(null);
  const [isFleetOverviewOpen, setIsFleetOverviewOpen] = useState<boolean>(false);
  const [vehicleHistory, setVehicleHistory] = useState<Booking[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);

  useEffect(() => {
    if (searchTerm) {
      setQuery(searchTerm);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (selectedPreviewVehicle) {
      setIsLoadingHistory(true);
      apiClient.getVehicleDetails(selectedPreviewVehicle.id)
        .then((res) => {
          if (res && res.bookingHistory) {
            setVehicleHistory(res.bookingHistory);
          } else {
            setVehicleHistory([]);
          }
        })
        .catch(() => setVehicleHistory([]))
        .finally(() => setIsLoadingHistory(false));
    } else {
      setVehicleHistory([]);
    }
  }, [selectedPreviewVehicle]);

  const getVehicleIllustration = (type?: string, model?: string) => {
    const t = (type || '').toUpperCase();
    const m = (model || '').toLowerCase();

    if (t === 'TRUCK' || m.includes('truck') || m.includes('f-150') || m.includes('actros')) {
      return {
        img: vehicleTruckImg,
        alt: 'Commercial Fleet Truck Illustration',
        label: 'Heavy Transport',
        icon: Truck,
        badgeBg: 'bg-indigo-500/90 text-white'
      };
    }
    if (t === 'VAN' || m.includes('van') || m.includes('transit') || m.includes('sprinter')) {
      return {
        img: vehicleVanImg,
        alt: 'Commercial Delivery Van Illustration',
        label: 'Delivery Van',
        icon: Truck,
        badgeBg: 'bg-amber-500/90 text-slate-950'
      };
    }
    if (t === 'BUS' || m.includes('bus') || m.includes('shuttle')) {
      return {
        img: vehicleBusImg,
        alt: 'Fleet Passenger Bus Illustration',
        label: 'Passenger Bus',
        icon: Bus,
        badgeBg: 'bg-emerald-500/90 text-white'
      };
    }
    // Default to sedan/car
    return {
      img: vehicleSedanImg,
      alt: 'Fleet Executive Sedan Illustration',
      label: 'Executive Sedan',
      icon: Car,
      badgeBg: 'bg-sky-500/90 text-white'
    };
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesType = vehicleTypeFilter === 'ALL' || v.vehicleType?.toUpperCase() === vehicleTypeFilter;
    if (!query.trim()) return matchesType;

    const q = query.toLowerCase().trim();
    return (
      matchesType &&
      (v.brand.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        v.registrationNumber.toLowerCase().includes(q) ||
        (v.vehicleType && v.vehicleType.toLowerCase().includes(q)))
    );
  });

  // Calculate real metrics from actual bookings & vehicles
  const vehiclesWithActiveService = vehicles.filter((v) =>
    bookings.some(
      (b) =>
        b.vehicleId === v.id &&
        (b.status === 'PENDING' || b.status === 'APPROVED' || b.status === 'ASSIGNED' || b.status === 'REPAIRING')
    )
  );

  const activeServicesCount = vehiclesWithActiveService.length;

  const overdueVehiclesCount = vehicles.filter((v) => v.reminderStatus === 'OVERDUE').length;
  const dueSoonVehiclesCount = vehicles.filter((v) => v.reminderStatus === 'DUE_SOON').length;

  const fleetReadinessPercentage =
    vehicles.length === 0
      ? 100
      : Math.round(((vehicles.length - activeServicesCount) / vehicles.length) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-['Oswald'] uppercase">My Fleet Directory</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage registered fleet vehicles, 30-day recurring maintenance rules, and service schedules.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsFleetOverviewOpen(true)}
            className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-xs px-3.5 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xs font-['Oswald'] uppercase tracking-wider"
          >
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Recurring Maintenance ({overdueVehiclesCount + dueSoonVehiclesCount})</span>
          </button>

          <button
            onClick={onOpenAddVehicle}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm font-['Oswald'] uppercase tracking-wider active:scale-98"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add New Vehicle</span>
          </button>
        </div>
      </div>

      {/* Fleet Health & Quick Stats Bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
              <Car className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {vehicles.length > 0 ? 'ACTIVE' : 'EMPTY'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-amber-600 font-mono tracking-tight">{vehicles.length}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mt-0.5">Fleet Size</p>
          </div>
        </div>

        {/* 30-Day Reminder Metric Card */}
        <div
          onClick={() => setIsFleetOverviewOpen(true)}
          className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm hover:border-amber-400 cursor-pointer transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20 group-hover:scale-105 transition-transform">
              <Bell className="w-5 h-5 text-amber-600" />
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                overdueVehiclesCount > 0
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : dueSoonVehiclesCount > 0
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}
            >
              {overdueVehiclesCount > 0 ? 'OVERDUE' : dueSoonVehiclesCount > 0 ? 'DUE (30D)' : 'ON SCHEDULE'}
            </span>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-slate-900 font-mono tracking-tight">
                {overdueVehiclesCount + dueSoonVehiclesCount}
              </p>
              <span className="text-[11px] font-mono text-slate-500">
                ({overdueVehiclesCount} overdue / {dueSoonVehiclesCount} due)
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mt-0.5">
              30-Day Service Reminders
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 border border-rose-200">
              <Wrench className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                activeServicesCount > 0
                  ? 'text-rose-700 bg-rose-50 border-rose-200'
                  : 'text-slate-600 bg-slate-50 border-slate-200'
              }`}
            >
              {activeServicesCount > 0 ? 'IN BAY' : 'CLEAR'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-bold text-rose-600 font-mono tracking-tight">{activeServicesCount}</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono mt-0.5">Active In Workshop</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 text-slate-900 flex justify-between items-center relative overflow-hidden shadow-sm border border-slate-200">
          <div className="space-y-1 relative z-10">
            <h3 className="text-base font-bold text-slate-900 font-['Oswald'] uppercase">Fleet Readiness</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold font-mono text-amber-600">{fleetReadinessPercentage}%</span>
              <span className="text-xs text-slate-500">
                {activeServicesCount === 0 ? 'Operational' : `${activeServicesCount} in bay`}
              </span>
            </div>
          </div>
          <div className="w-14 h-14 rounded-2xl border border-amber-200 flex items-center justify-center relative z-10 bg-amber-50">
            <ShieldCheck className="w-7 h-7 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Real-time Fleet Search Bar & Type Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by model, make (e.g. Ford), or license plate number (e.g. FL-1024)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all shadow-2xs"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Vehicle Type Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3 h-3 text-amber-500" /> Type:
            </span>
            {['ALL', 'CAR', 'TRUCK', 'VAN', 'BUS'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setVehicleTypeFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all shrink-0 ${
                  vehicleTypeFilter === type
                    ? 'bg-amber-500 text-slate-950 shadow-2xs border border-amber-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Results Info Strip */}
        <div className="flex justify-between items-center text-xs font-mono text-slate-500 border-t border-slate-100 pt-2 px-1">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong className="text-slate-900">{filteredVehicles.length}</strong> of{' '}
              <strong className="text-slate-900">{vehicles.length}</strong> vehicles
            </span>
            {(query || vehicleTypeFilter !== 'ALL') && (
              <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">
                Filtered
              </span>
            )}
          </div>

          {(query || vehicleTypeFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setVehicleTypeFilter('ALL');
              }}
              className="text-[11px] text-slate-500 hover:text-amber-600 font-bold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
            <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4">
              <Search className="w-7 h-7" />
            </div>
            <p className="text-base font-bold text-slate-800 font-['Oswald'] uppercase">No matching vehicles found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {query || vehicleTypeFilter !== 'ALL'
                ? `No vehicles found matching "${query || vehicleTypeFilter}". Try clearing your search query or vehicle type filter.`
                : 'There are no vehicles registered in your fleet directory yet.'}
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              {(query || vehicleTypeFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setVehicleTypeFilter('ALL');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 border border-slate-300"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Search Filters</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenAddVehicle}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Register New Vehicle</span>
              </button>
            </div>
          </div>
        ) : (
          filteredVehicles.map((v) => {
            const activeBooking = bookings.find(
              (b) =>
                b.vehicleId === v.id &&
                (b.status === 'PENDING' ||
                  b.status === 'APPROVED' ||
                  b.status === 'ASSIGNED' ||
                  b.status === 'REPAIRING')
            );

            const reminderStatus = v.reminderStatus || 'OK';
            const illus = getVehicleIllustration(v.vehicleType, v.model);
            const TypeIcon = illus.icon;

            return (
              <div key={v.id} className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col shadow-sm overflow-hidden group">
                {/* Generated Vehicle Type Banner Illustration */}
                <div
                  onClick={() => setSelectedPreviewVehicle(v)}
                  className="relative h-44 w-full bg-slate-900 overflow-hidden cursor-pointer group-hover:opacity-95 transition-all"
                >
                  <img
                    src={illus.img}
                    alt={illus.alt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Top Overlay Badges */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase backdrop-blur-md shadow-sm ${illus.badgeBg}`}>
                      <TypeIcon className="w-3.5 h-3.5" />
                      <span>{v.vehicleType || illus.label}</span>
                    </span>

                    {/* 30-Day Reminder Badge */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReminderVehicle(v);
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border backdrop-blur-md shadow-sm transition-all hover:scale-105 ${
                        reminderStatus === 'OVERDUE'
                          ? 'bg-rose-500/90 text-white border-rose-300 animate-pulse'
                          : reminderStatus === 'DUE_SOON'
                          ? 'bg-amber-500/95 text-slate-950 border-amber-300'
                          : 'bg-slate-900/80 text-emerald-400 border-emerald-500/40'
                      }`}
                    >
                      <Bell className="w-3 h-3" />
                      <span>
                        {reminderStatus === 'OVERDUE'
                          ? 'Overdue'
                          : reminderStatus === 'DUE_SOON'
                          ? 'Due in 30d'
                          : 'Service OK'}
                      </span>
                    </button>
                  </div>

                  {/* Bottom Banner Title Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                    <div>
                      <h3 className="text-lg font-bold text-white font-['Oswald'] uppercase drop-shadow-md tracking-wide">
                        {v.brand} {v.model}
                      </h3>
                      <p className="text-[11px] font-mono font-semibold text-amber-400 tracking-wider drop-shadow-sm">
                        REG: {v.registrationNumber}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="p-1.5 rounded-lg bg-white/20 text-white backdrop-blur-md hover:bg-white/30 transition-all border border-white/30 shadow-xs"
                      title="Inspect Vehicle Spec Illustration"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  {/* Service Horizon & Telemetry Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        {(v.mileage || 0).toLocaleString()} mi
                      </span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Due: {v.nextServiceDueDate || 'In 30d'}
                      </span>
                    </div>

                    {/* Next Maintenance Interval Info */}
                    <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-500 text-[11px]">Next Milestone</span>
                      <span className="font-bold text-slate-900 text-[11px]">
                        {(v.nextMaintenanceMileage || ((v.mileage || 0) + 5000)).toLocaleString()} mi
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-mono font-bold text-slate-400">Manufacture Year</p>
                      <p className="font-semibold text-slate-800 font-mono mt-0.5">{v.year}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-mono font-bold text-slate-400">Bay Queue / Status</p>
                      <p className="font-semibold text-slate-800 font-mono truncate mt-0.5">
                        {activeBooking ? activeBooking.serviceType : 'In Fleet Operations'}
                      </p>
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onBookServiceForVehicle(v)}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 font-['Oswald'] uppercase tracking-wider shadow-2xs"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-600" />
                      <span>Book Service</span>
                    </button>

                    <button
                      onClick={() => setSelectedReminderVehicle(v)}
                      className="p-2 rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all"
                      title="Manage 30-Day Service Reminders & Schedule"
                    >
                      <Bell className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setSelectedPreviewVehicle(v)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
                      title="Preview Vehicle Specs & History"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {(user?.role === 'ADMIN' || user?.role === 'CUSTOMER') && (
                      <button
                        onClick={() => onDeleteVehicle(v.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Service Reminder Modal for Vehicle */}
      {selectedReminderVehicle && (
        <ServiceReminderModal
          vehicle={selectedReminderVehicle}
          isOpen={Boolean(selectedReminderVehicle)}
          onClose={() => setSelectedReminderVehicle(null)}
          onBookService={(v) => {
            setSelectedReminderVehicle(null);
            onBookServiceForVehicle(v);
          }}
          onVehicleUpdated={(updated) => {
            if (onVehicleUpdated) onVehicleUpdated(updated);
            setSelectedReminderVehicle(updated);
          }}
        />
      )}

      {/* Fleet Reminders Overview Modal */}
      {isFleetOverviewOpen && (
        <FleetRemindersOverviewModal
          isOpen={isFleetOverviewOpen}
          onClose={() => setIsFleetOverviewOpen(false)}
          vehicles={vehicles}
          onSelectVehicleReminder={(v) => {
            setIsFleetOverviewOpen(false);
            setSelectedReminderVehicle(v);
          }}
          onBookService={(v) => {
            setIsFleetOverviewOpen(false);
            onBookServiceForVehicle(v);
          }}
        />
      )}

      {/* Vehicle Specification Image Lightbox Modal */}
      {selectedPreviewVehicle && (() => {
        const modalIllus = getVehicleIllustration(selectedPreviewVehicle.vehicleType, selectedPreviewVehicle.model);
        const ModalIcon = modalIllus.icon;

        return (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0 text-white relative">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedPreviewVehicle(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-950/80 text-slate-300 hover:text-white border border-white/20 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Full Image Banner */}
              <div className="relative h-64 sm:h-72 w-full bg-slate-950 overflow-hidden">
                <img
                  src={modalIllus.img}
                  alt={modalIllus.alt}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40" />

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold uppercase ${modalIllus.badgeBg}`}>
                    <ModalIcon className="w-4 h-4" />
                    <span>{selectedPreviewVehicle.vehicleType || modalIllus.label}</span>
                  </span>
                </div>

                <div className="absolute bottom-4 left-6 right-6">
                  <h3 className="text-2xl font-bold font-['Oswald'] uppercase text-white tracking-wide">
                    {selectedPreviewVehicle.brand} {selectedPreviewVehicle.model}
                  </h3>
                  <p className="text-xs font-mono font-bold text-amber-400 mt-1">
                    REGISTRATION NUMBER: {selectedPreviewVehicle.registrationNumber}
                  </p>
                </div>
              </div>

              {/* Specification Specs & Service History Footer */}
              <div className="p-6 space-y-4 bg-slate-900 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-4 bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs">
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Category</p>
                    <p className="text-white font-bold mt-0.5">{selectedPreviewVehicle.vehicleType || 'CAR'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Model Year</p>
                    <p className="text-white font-bold mt-0.5">{selectedPreviewVehicle.year}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Current Odometer</p>
                    <p className="text-amber-400 font-bold mt-0.5">{(selectedPreviewVehicle.mileage ?? 45000).toLocaleString()} mi</p>
                  </div>
                </div>

                {/* Service History Timeline (Loaded via GET /api/vehicles/:id) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="font-bold text-amber-500 font-['Oswald'] uppercase text-xs tracking-wider flex items-center gap-1.5">
                      <History className="w-4 h-4" />
                      <span>Vehicle Repair & Service History</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">
                      {vehicleHistory.length} Record{vehicleHistory.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {isLoadingHistory ? (
                    <div className="p-4 text-center text-xs font-mono text-slate-500 animate-pulse">
                      Loading vehicle service history...
                    </div>
                  ) : vehicleHistory.length === 0 ? (
                    <p className="text-slate-500 italic text-xs bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                      No past repair or maintenance records registered for this vehicle.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {vehicleHistory.map((item) => (
                        <div key={item.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200 font-mono">{item.serviceType}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                              item.status === 'COMPLETED' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                              item.status === 'REPAIRING' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                              'bg-slate-800 text-slate-300'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {item.preferredDate ? new Date(item.preferredDate).toLocaleDateString() : 'N/A'}
                            </span>
                            {item.repairLogs && item.repairLogs.length > 0 && (
                              <span className="truncate max-w-[200px] text-slate-500">{item.repairLogs[0].note}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewVehicle(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all"
                  >
                    Close Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const v = selectedPreviewVehicle;
                      setSelectedPreviewVehicle(null);
                      onBookServiceForVehicle(v);
                    }}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl font-['Oswald'] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>Book Service For Vehicle</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

