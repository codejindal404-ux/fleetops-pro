import React, { useState } from 'react';
import {
  Wrench,
  Car,
  User as UserIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Filter,
  Search,
  Activity,
  Package,
  Calendar,
  Phone,
  Mail,
  Zap,
  Check
} from 'lucide-react';
import { Booking, BookingStatus } from '../../types.ts';

interface MechanicJobQueueProps {
  jobs: Booking[];
  loading?: boolean;
  onUpdateStatus: (bookingId: string, status: BookingStatus, mileage?: number) => Promise<void> | void;
  onOpenDiagnostics?: (job: Booking) => void;
  onOpenPartsRequest?: (job: Booking) => void;
  onOpenInspection?: (job: Booking) => void;
  onOpenWorkspace?: (job: Booking) => void;
}

export const WORKFLOW_STAGES: { status: BookingStatus; label: string; color: string; bg: string }[] = [
  { status: 'PENDING', label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { status: 'INSPECTION', label: 'Inspection', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  { status: 'REPAIRING', label: 'Repairing', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { status: 'TESTING', label: 'Testing', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  { status: 'COMPLETED', label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' }
];

export const MechanicJobQueue: React.FC<MechanicJobQueueProps> = ({
  jobs,
  loading = false,
  onUpdateStatus,
  onOpenDiagnostics,
  onOpenPartsRequest,
  onOpenInspection,
  onOpenWorkspace
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const statusMatch = filterStatus === 'ALL' || job.status === filterStatus;
    const priorityMatch = priorityFilter === 'ALL' || (job.priority || 'NORMAL') === priorityFilter;
    const q = searchQuery.toLowerCase().trim();
    const searchMatch =
      !q ||
      job.id.toLowerCase().includes(q) ||
      (job.vehicleName && job.vehicleName.toLowerCase().includes(q)) ||
      (job.vehicle?.registrationNumber && job.vehicle.registrationNumber.toLowerCase().includes(q)) ||
      (job.customerName && job.customerName.toLowerCase().includes(q)) ||
      (job.serviceType && job.serviceType.toLowerCase().includes(q)) ||
      (job.issueDescription && job.issueDescription.toLowerCase().includes(q));

    return statusMatch && priorityMatch && searchMatch;
  });

  const todayCount = jobs.length;
  const inProgressCount = jobs.filter((j) => ['INSPECTION', 'REPAIRING', 'TESTING'].includes(j.status)).length;
  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;

  const handleNextStage = async (job: Booking) => {
    let nextStatus: BookingStatus = 'INSPECTION';
    if (job.status === 'PENDING' || job.status === 'APPROVED' || job.status === 'ASSIGNED') {
      nextStatus = 'INSPECTION';
    } else if (job.status === 'INSPECTION') {
      nextStatus = 'REPAIRING';
    } else if (job.status === 'REPAIRING') {
      nextStatus = 'TESTING';
    } else if (job.status === 'TESTING' || job.status === 'QUALITY_CHECK') {
      nextStatus = 'COMPLETED';
    }

    try {
      setUpdatingJobId(job.id);
      await onUpdateStatus(job.id, nextStatus);
    } finally {
      setUpdatingJobId(null);
    }
  };

  const getPriorityBadge = (priority: string = 'NORMAL') => {
    switch (priority.toUpperCase()) {
      case 'CRITICAL':
      case 'URGENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <Flame className="w-3.5 h-3.5" /> Critical
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> High
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Normal
          </span>
        );
    }
  };

  const getStatusBadge = (status: BookingStatus) => {
    const stage = WORKFLOW_STAGES.find((s) => s.status === status);
    if (stage) {
      return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${stage.bg} ${stage.color}`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          {stage.label}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Quick Metric Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-400" />
            Mechanic Work Queue
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Active workshop repair pipeline & multi-stage status management
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-3.5 py-1.5 rounded-xl border border-slate-700 text-center">
            <div className="text-xs text-slate-400 font-medium">Assigned Jobs</div>
            <div className="text-lg font-bold text-white">{todayCount}</div>
          </div>
          <div className="bg-indigo-950/40 px-3.5 py-1.5 rounded-xl border border-indigo-800/50 text-center">
            <div className="text-xs text-indigo-300 font-medium">In Progress</div>
            <div className="text-lg font-bold text-indigo-400">{inProgressCount}</div>
          </div>
          <div className="bg-emerald-950/40 px-3.5 py-1.5 rounded-xl border border-emerald-800/50 text-center">
            <div className="text-xs text-emerald-300 font-medium">Completed</div>
            <div className="text-lg font-bold text-emerald-400">{completedCount}</div>
          </div>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by customer, vehicle, registration #, or service type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter work orders by status"
            className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="INSPECTION">Inspection</option>
            <option value="REPAIRING">Repairing</option>
            <option value="TESTING">Testing</option>
            <option value="COMPLETED">Completed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter work orders by priority"
            className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="NORMAL">Normal</option>
          </select>
        </div>
      </div>

      {/* Workflow Stage Progress Guide */}
      <div className="hidden md:flex items-center justify-between p-4 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs">
        <span className="text-slate-400 font-semibold uppercase tracking-wider">Workflow Pipeline:</span>
        <div className="flex items-center gap-2 flex-wrap">
          {WORKFLOW_STAGES.map((st, idx) => (
            <React.Fragment key={st.status}>
              <span className={`px-2.5 py-1 rounded-md font-medium border ${st.bg} ${st.color}`}>
                {idx + 1}. {st.label}
              </span>
              {idx < WORKFLOW_STAGES.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div className="bg-slate-900/40 rounded-2xl border border-slate-800/80 p-12 text-center">
          <Car className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No jobs match your filter</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or status filter to see pending work orders.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredJobs.map((job) => {
            const isCompleted = job.status === 'COMPLETED';
            const vehicle = job.vehicle;
            const customer = job.customer;

            return (
              <div
                key={job.id}
                className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-200 shadow-lg"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/70">
                  {/* Vehicle & Order Header */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                      <Car className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-base font-bold text-white">
                          {job.vehicleName || (vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Vehicle Job')}
                        </span>
                        {vehicle?.year && (
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                            {vehicle.year}
                          </span>
                        )}
                        <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/40">
                          {vehicle?.registrationNumber || 'NO-PLATE'}
                        </span>
                        {getPriorityBadge(job.priority)}
                      </div>
                      <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <span>Work Order: <span className="text-slate-300 font-mono">#{job.id.slice(-6)}</span></span>
                        <span>•</span>
                        <span>Service: <span className="text-indigo-300 font-medium">{job.serviceType || 'Standard Maintenance'}</span></span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge & Actions */}
                  <div className="flex items-center gap-3">
                    {getStatusBadge(job.status)}
                    {!isCompleted && (
                      <button
                        onClick={() => handleNextStage(job)}
                        disabled={updatingJobId === job.id}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                      >
                        {updatingJobId === job.id ? (
                          <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Advance Stage</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Card Content Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
                  {/* Customer Information */}
                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60 space-y-1.5">
                    <div className="text-slate-400 font-semibold flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                      Customer Details
                    </div>
                    <div className="font-semibold text-slate-200 text-sm">
                      {job.customerName || customer?.name || 'Customer'}
                    </div>
                    <div className="text-slate-400 flex items-center gap-2">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{customer?.email || 'N/A'}</span>
                    </div>
                    <div className="text-slate-400 flex items-center gap-2">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{customer?.phone || '+1 (555) 0199'}</span>
                    </div>
                  </div>

                  {/* Vehicle Diagnostics & Telemetry */}
                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60 space-y-1.5">
                    <div className="text-slate-400 font-semibold flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      Vehicle Status
                    </div>
                    <div className="text-slate-300">
                      Odometer: <span className="font-semibold text-white">{(vehicle?.mileage || 28500).toLocaleString()} mi</span>
                    </div>
                    <div className="text-slate-300">
                      Scheduled: <span className="text-slate-400">{job.serviceDate || job.preferredDate ? new Date(job.serviceDate || job.preferredDate).toLocaleDateString() : 'Today'}</span>
                    </div>
                    <div className="text-slate-400 line-clamp-1">
                      Issue: {job.issueDescription || 'Routine Scheduled Inspection'}
                    </div>
                  </div>

                  {/* Quick Action Hub */}
                  <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/60 flex flex-col justify-between gap-2">
                    <div className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                      Workshop Modules
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onOpenDiagnostics && onOpenDiagnostics(job)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        Diagnostics
                      </button>
                      <button
                        onClick={() => onOpenPartsRequest && onOpenPartsRequest(job)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Package className="w-3.5 h-3.5 text-purple-400" />
                        Parts Req
                      </button>
                      <button
                        onClick={() => onOpenInspection && onOpenInspection(job)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg text-slate-200 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Activity className="w-3.5 h-3.5 text-blue-400" />
                        Inspection
                      </button>
                      <button
                        onClick={() => onOpenWorkspace && onOpenWorkspace(job)}
                        className="px-2.5 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/50 rounded-lg text-indigo-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                        Work Log
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MechanicJobQueue;
