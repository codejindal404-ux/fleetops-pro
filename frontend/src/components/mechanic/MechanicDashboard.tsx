import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wrench,
  CheckCircle2,
  Clock,
  Car,
  AlertTriangle,
  ClipboardCheck,
  Activity,
  ArrowRight,
  Search,
  Filter,
  ShieldCheck,
  Calendar,
  ChevronRight,
  ExternalLink,
  Flame,
  Check,
  Radio,
  Eye,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';
import {
  Booking,
  User,
  Vehicle,
  BookingStatus,
  MechanicProfile,
  MechanicPerformanceMetrics,
  MechanicAvailabilityStatus
} from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';
import { getSocket, socketClient } from '../../services/socketClient.ts';
import { MechanicPerformanceCard } from './MechanicPerformanceCard.tsx';
import { QualityCheckModal, QualityCheckData } from './QualityCheckModal.tsx';
import { MechanicServiceCenterModal } from './MechanicServiceCenterView.tsx';

interface MechanicDashboardProps {
  user: User;
  bookings: Booking[];
  vehicles?: Vehicle[];
  onSelectBooking?: (booking: Booking) => void;
  onUpdateStatus?: (bookingId: string, nextStatus: string) => void;
  onNavigate?: (tab: string) => void;
  searchTerm?: string;
}

const WORKFLOW_STEPS = [
  { status: 'ASSIGNED', label: 'Assigned', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  { status: 'INSPECTION', label: 'Inspection', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
  { status: 'REPAIRING', label: 'Repairing', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
  { status: 'QUALITY_CHECK', label: 'Quality Check', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
  { status: 'COMPLETED', label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' }
] as const;

export const MechanicDashboard: React.FC<MechanicDashboardProps> = ({
  user,
  bookings: initialBookings,
  vehicles = [],
  onSelectBooking,
  onUpdateStatus,
  onNavigate,
  searchTerm = ''
}) => {
  const [profile, setProfile] = useState<MechanicProfile | null>(null);
  const [metrics, setMetrics] = useState<MechanicPerformanceMetrics | null>(null);
  const [jobs, setJobs] = useState<Booking[]>(initialBookings);
  const [loading, setLoading] = useState<boolean>(false);
  const [availabilityUpdating, setAvailabilityUpdating] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeQCModalBooking, setActiveQCModalBooking] = useState<Booking | null>(null);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);
  const [isBayMapOpen, setIsBayMapOpen] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAcceptJob = async (bookingId: string) => {
    if (acceptingJobId) return;
    try {
      setAcceptingJobId(bookingId);
      const res = await apiClient.acceptMechanicJob(bookingId);
      showToast(res.message || 'Job accepted into service bay');
      await loadMechanicData();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept job');
    } finally {
      setAcceptingJobId(null);
    }
  };

  const handleSubmitQC = async (data: QualityCheckData) => {
    try {
      const summaryItems = [
        data.checklist.repairCompleted ? 'Repairs Complete' : 'Repairs Incomplete',
        data.checklist.partsInstalled ? 'Parts Fitted' : 'Parts Pending',
        data.checklist.testingCompleted ? 'Testing Done' : 'Testing Pending',
        data.checklist.noUnresolvedIssues ? 'Zero Faults' : 'Issues Pending',
        data.checklist.vehicleReady ? 'Vehicle Ready' : 'Prep Pending'
      ].join(', ');

      const qcNote = `[QUALITY CHECK SIGN-OFF] Checklist: ${summaryItems}. Remarks: ${data.remarks}`;

      await apiClient.addMechanicRepairLog(data.bookingId, {
        action: 'Quality Check Completed',
        note: qcNote,
        progressPercentage: 95
      });

      if (data.completeNow && onUpdateStatus) {
        await onUpdateStatus(data.bookingId, 'COMPLETED');
      }

      showToast('Quality Check report recorded successfully');
      await loadMechanicData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record Quality Check');
      throw err;
    }
  };

  // Fetch enriched mechanic data
  const loadMechanicData = useCallback(async () => {
    try {
      setLoading(true);
      const [profRes, metricsRes, jobsRes] = await Promise.allSettled([
        apiClient.getMechanicProfile(),
        apiClient.getMechanicPerformance(),
        apiClient.getMechanicJobs()
      ]);

      if (profRes.status === 'fulfilled' && profRes.value?.profile) {
        setProfile(profRes.value.profile);
      }
      if (metricsRes.status === 'fulfilled' && metricsRes.value?.metrics) {
        setMetrics(metricsRes.value.metrics);
      }
      if (jobsRes.status === 'fulfilled' && jobsRes.value?.jobs) {
        setJobs(jobsRes.value.jobs);
      } else {
        setJobs(initialBookings);
      }
    } catch (err) {
      console.warn('Failed loading mechanic overview data:', err);
    } finally {
      setLoading(false);
    }
  }, [initialBookings]);

  useEffect(() => {
    loadMechanicData();
  }, [loadMechanicData]);

  // Sync when initialBookings updates from App.tsx
  useEffect(() => {
    if (initialBookings.length > 0) {
      setJobs((prev) => {
        return initialBookings.map((ib) => {
          const found = prev.find((p) => p.id === ib.id);
          return found ? { ...found, ...ib } : ib;
        });
      });
    }
  }, [initialBookings]);

  // Real-time Socket.IO Listeners for status updates
  useEffect(() => {
    const socket = getSocket();
    const handleStatusUpdate = (data: any) => {
      showToast(`Work Order #${data?.bookingId?.slice(-6) || ''} status updated`);
      loadMechanicData();
    };

    if (socket) {
      socket.on('status_updated', handleStatusUpdate);
    }

    const unsub = socketClient.subscribeBookingUpdates(() => {
      loadMechanicData();
    });

    return () => {
      if (socket) {
        socket.off('status_updated', handleStatusUpdate);
      }
      unsub();
    };
  }, [loadMechanicData]);

  // Mechanic-specific filtering (Enforce RBAC isolation in frontend defense-in-depth)
  const myAssignedJobs = useMemo(() => {
    return jobs.filter((b) => {
      // If booking has mechanicId or assignedMechanicId, verify it matches current mechanic
      if (b.mechanicId && b.mechanicId !== user.id) return false;
      if (b.assignedMechanicId && b.assignedMechanicId !== user.id) return false;
      return true;
    });
  }, [jobs, user.id]);

  // Calculate status-based summary counts
  const summaryCounts = useMemo(() => {
    let assigned = 0;
    let inspection = 0;
    let repairing = 0;
    let qualityCheck = 0;
    let completed = 0;
    let todayWork = 0;

    const todayDateStr = new Date().toISOString().split('T')[0];

    myAssignedJobs.forEach((job) => {
      const s = job.status?.toUpperCase();
      if (s === 'ASSIGNED') {
        assigned++;
      } else if (s === 'INSPECTION') {
        inspection++;
      } else if (s === 'REPAIRING') {
        repairing++;
      } else if (s === 'QUALITY_CHECK' || s === 'TESTING') {
        qualityCheck++;
      } else if (s === 'COMPLETED') {
        completed++;
      }

      // Check if job is scheduled for or created today
      const jobDate = (job.serviceDate || job.preferredDate || job.createdAt || '').split('T')[0];
      if (jobDate === todayDateStr && s !== 'COMPLETED') {
        todayWork++;
      }
    });

    const activeTotal = assigned + inspection + repairing + qualityCheck;

    return {
      totalAssigned: myAssignedJobs.length,
      activeTotal,
      assigned,
      inspection,
      repairing,
      qualityCheck,
      completed,
      todayWork
    };
  }, [myAssignedJobs]);

  // Handle availability update
  const handleAvailabilityToggle = async (newAvailability: MechanicAvailabilityStatus) => {
    if (availabilityUpdating || profile?.availability === newAvailability) return;
    try {
      setAvailabilityUpdating(true);
      await apiClient.updateMechanicAvailability(newAvailability);
      setProfile((prev) => (prev ? { ...prev, availability: newAvailability } : null));
      showToast(`Bay availability set to ${newAvailability}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update availability');
    } finally {
      setAvailabilityUpdating(false);
    }
  };

  // Filtered jobs list based on status filter & search
  const query = (localSearch || searchTerm).toLowerCase().trim();
  const displayedJobs = useMemo(() => {
    return myAssignedJobs.filter((job) => {
      // Status filter
      if (statusFilter === 'ASSIGNED') {
        if (job.status !== 'ASSIGNED') return false;
      } else if (statusFilter === 'INSPECTION') {
        if (job.status !== 'INSPECTION') return false;
      } else if (statusFilter === 'REPAIRING') {
        if (job.status !== 'REPAIRING') return false;
      } else if (statusFilter === 'QUALITY_CHECK') {
        if (!['QUALITY_CHECK', 'TESTING'].includes(job.status)) return false;
      } else if (statusFilter === 'COMPLETED') {
        if (job.status !== 'COMPLETED') return false;
      } else if (statusFilter === 'ACTIVE') {
        if (job.status === 'COMPLETED' || job.status === 'CANCELLED') return false;
      }

      // Search match
      if (!query) return true;
      const idMatch = job.id.toLowerCase().includes(query);
      const vehicleMatch =
        (job.vehicleName && job.vehicleName.toLowerCase().includes(query)) ||
        (job.vehicle?.brand && job.vehicle.brand.toLowerCase().includes(query)) ||
        (job.vehicle?.model && job.vehicle.model.toLowerCase().includes(query)) ||
        (job.vehicle?.registrationNumber && job.vehicle.registrationNumber.toLowerCase().includes(query));
      const customerMatch = job.customerName && job.customerName.toLowerCase().includes(query);
      const serviceMatch =
        (job.serviceType && job.serviceType.toLowerCase().includes(query)) ||
        (job.issueDescription && job.issueDescription.toLowerCase().includes(query));

      return idMatch || vehicleMatch || customerMatch || serviceMatch;
    });
  }, [myAssignedJobs, statusFilter, query]);

  // Extract recent mechanic activity from existing real repair logs and job updates
  const recentActivities = useMemo(() => {
    const list: {
      id: string;
      title: string;
      description: string;
      status: string;
      timestamp: string;
      type: 'LOG' | 'JOB' | 'STATUS';
    }[] = [];

    // Collect recent repair logs
    myAssignedJobs.forEach((job) => {
      const logs = job.repairLogs || [];
      logs.forEach((log: any, idx: number) => {
        list.push({
          id: `${job.id}-log-${idx}`,
          title: `Repair Log: #${job.id.slice(-6).toUpperCase()}`,
          description: log.note || 'Diagnostic/repair note entered',
          status: job.status,
          timestamp: log.createdAt || log.timestamp || job.createdAt,
          type: 'LOG'
        });
      });

      // Also add job status entries
      list.push({
        id: `${job.id}-status`,
        title: `${job.serviceType || 'Service'} #${job.id.slice(-6).toUpperCase()}`,
        description: `${job.vehicleName || 'Vehicle'} — Status: ${job.status}`,
        status: job.status,
        timestamp: job.updatedAt || job.createdAt,
        type: 'JOB'
      });
    });

    // Sort by timestamp descending and take top 5
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return list.slice(0, 6);
  }, [myAssignedJobs]);

  const currentAvailability = profile?.availability || (user as any).availability || 'AVAILABLE';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-amber-500/40 text-amber-300 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs font-mono animate-in fade-in slide-in-from-bottom-3">
          <Activity className="w-4 h-4 text-amber-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner: Mechanic Bay Hub */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <Wrench className="w-3.5 h-3.5" />
                Service Bay Technician
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                ID: {user.id.slice(-6).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Oswald'] uppercase tracking-tight">
              Mechanic <span className="text-amber-500">Overview</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Welcome back, <span className="text-slate-200 font-semibold">{user.name}</span>. Monitor your active service bay workload, inspections, repairs, and quality checkpoints.
            </p>
          </div>

          {/* Availability Control */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-2 sm:min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Bay Status
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  currentAvailability === 'AVAILABLE'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : currentAvailability === 'BUSY'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    currentAvailability === 'AVAILABLE'
                      ? 'bg-emerald-400 animate-pulse'
                      : currentAvailability === 'BUSY'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`}
                />
                {currentAvailability}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {(['AVAILABLE', 'BUSY', 'OFFLINE'] as MechanicAvailabilityStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => handleAvailabilityToggle(st)}
                  disabled={availabilityUpdating}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    currentAvailability === st
                      ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {st === 'AVAILABLE' ? 'Ready' : st === 'BUSY' ? 'In Bay' : 'Off Shift'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Status-Based Summary Cards (5-Stage Workflow + Today Workload) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Assigned */}
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`bg-slate-900/90 border rounded-2xl p-4 cursor-pointer transition-all hover:border-amber-500/50 hover:shadow-lg ${
            statusFilter === 'ALL' ? 'border-amber-500/60 ring-1 ring-amber-500/30 bg-slate-900' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assigned Jobs</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-['Oswald']">
            {summaryCounts.totalAssigned}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">
            {summaryCounts.activeTotal} active workload
          </span>
        </div>

        {/* Awaiting Inspection */}
        <div
          onClick={() => setStatusFilter('INSPECTION')}
          className={`bg-slate-900/90 border rounded-2xl p-4 cursor-pointer transition-all hover:border-blue-500/50 hover:shadow-lg ${
            statusFilter === 'INSPECTION' ? 'border-blue-500/60 ring-1 ring-blue-500/30 bg-slate-900' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">Inspection</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <ClipboardCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-['Oswald']">
            {summaryCounts.inspection}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Pending check</span>
        </div>

        {/* Active Repairs */}
        <div
          onClick={() => setStatusFilter('REPAIRING')}
          className={`bg-slate-900/90 border rounded-2xl p-4 cursor-pointer transition-all hover:border-purple-500/50 hover:shadow-lg ${
            statusFilter === 'REPAIRING' ? 'border-purple-500/60 ring-1 ring-purple-500/30 bg-slate-900' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">In Repair</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-['Oswald']">
            {summaryCounts.repairing}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Active on hoist</span>
        </div>

        {/* Quality Check */}
        <div
          onClick={() => setStatusFilter('QUALITY_CHECK')}
          className={`bg-slate-900/90 border rounded-2xl p-4 cursor-pointer transition-all hover:border-cyan-500/50 hover:shadow-lg ${
            statusFilter === 'QUALITY_CHECK' ? 'border-cyan-500/60 ring-1 ring-cyan-500/30 bg-slate-900' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Quality Check</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-['Oswald']">
            {summaryCounts.qualityCheck}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Final testing</span>
        </div>

        {/* Completed */}
        <div
          onClick={() => setStatusFilter('COMPLETED')}
          className={`bg-slate-900/90 border rounded-2xl p-4 cursor-pointer transition-all hover:border-emerald-500/50 hover:shadow-lg ${
            statusFilter === 'COMPLETED' ? 'border-emerald-500/60 ring-1 ring-emerald-500/30 bg-slate-900' : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Completed</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-['Oswald']">
            {summaryCounts.completed}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Ready for customer</span>
        </div>

        {/* Today's Workload */}
        <div
          onClick={() => setStatusFilter('ACTIVE')}
          className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 cursor-pointer transition-all hover:border-amber-500/50 hover:shadow-lg"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Today's Work</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-['Oswald']">
            {summaryCounts.todayWork}
          </div>
          <span className="text-[10px] text-slate-500 font-mono mt-1 block">Scheduled today</span>
        </div>
      </div>

      {/* Visual Workflow Pipeline Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Oswald'] flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              Service Pipeline Status Workflow
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Standard 5-stage workshop progression for assigned vehicle jobs
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate && onNavigate('tasks')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider font-['Oswald'] transition-all shadow-md cursor-pointer"
            >
              <span>Open Assigned Tasks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Workflow Stages Chain */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {WORKFLOW_STEPS.map((step, idx) => {
            let count = 0;
            if (step.status === 'ASSIGNED') count = summaryCounts.assigned;
            else if (step.status === 'INSPECTION') count = summaryCounts.inspection;
            else if (step.status === 'REPAIRING') count = summaryCounts.repairing;
            else if (step.status === 'QUALITY_CHECK') count = summaryCounts.qualityCheck;
            else if (step.status === 'COMPLETED') count = summaryCounts.completed;

            return (
              <div
                key={step.status}
                onClick={() => setStatusFilter(step.status)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  statusFilter === step.status
                    ? `${step.bg} ring-1 ring-amber-500/40`
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                  <span className="text-slate-400">Step {idx + 1}</span>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${step.color} bg-slate-900 border border-slate-800`}>
                    {count} jobs
                  </span>
                </div>
                <div className={`text-xs font-bold uppercase tracking-wider ${step.color}`}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Mechanic Quick Actions
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => onNavigate && onNavigate('tasks')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-400" />
            <span>View All Assigned Tasks</span>
          </button>

          <button
            onClick={() => {
              setStatusFilter('INSPECTION');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-blue-500/20 text-blue-300 text-xs font-bold border border-blue-500/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ClipboardCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Filter Awaiting Inspection ({summaryCounts.inspection})</span>
          </button>

          <button
            onClick={() => {
              setStatusFilter('REPAIRING');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-purple-400" />
            <span>Filter Active Repairs ({summaryCounts.repairing})</span>
          </button>

          <button
            onClick={() => {
              setStatusFilter('QUALITY_CHECK');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filter Quality Check ({summaryCounts.qualityCheck})</span>
          </button>

          <button
            onClick={() => {
              setStatusFilter('COMPLETED');
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Filter Completed Jobs ({summaryCounts.completed})</span>
          </button>

          <button
            onClick={() => {
              setIsBayMapOpen(true);
            }}
            data-testid="service-center-bay-map-btn"
            className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Car className="w-3.5 h-3.5 text-amber-400" />
            <span>Service Center Bay Map</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Active Workload Queue + Recent Activity & Scorecard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Assigned Jobs Queue (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-tight flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-500" />
                  Assigned Bay Workload
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Showing {displayedJobs.length} of {myAssignedJobs.length} assigned jobs
                </p>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-bold">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'INSPECTION', label: 'Inspect' },
                  { id: 'REPAIRING', label: 'Repair' },
                  { id: 'QUALITY_CHECK', label: 'QC' },
                  { id: 'COMPLETED', label: 'Done' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === tab.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar */}
            <div className="pt-3 pb-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter by vehicle, customer, or service request..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60"
                />
              </div>
            </div>

            {/* Job Items List */}
            <div className="space-y-3 pt-2">
              {displayedJobs.length === 0 ? (
                <div className="py-12 text-center bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                  <Wrench className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-400">No jobs found</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    {query
                      ? 'No assigned jobs match your search criteria.'
                      : statusFilter !== 'ALL'
                      ? `No assigned jobs currently in ${statusFilter} stage.`
                      : 'You currently have zero assigned jobs. New work orders dispatched to your bay will appear here.'}
                  </p>
                  {statusFilter !== 'ALL' && (
                    <button
                      onClick={() => setStatusFilter('ALL')}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold cursor-pointer"
                    >
                      Clear Status Filter
                    </button>
                  )}
                </div>
              ) : (
                displayedJobs.map((job) => {
                  const statusConfig = WORKFLOW_STEPS.find((s) => s.status === job.status) || {
                    color: 'text-slate-400',
                    bg: 'bg-slate-800 border-slate-700',
                    label: job.status
                  };

                  return (
                    <div
                      key={job.id}
                      className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                    >
                      {/* Left: Job & Vehicle Info */}
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-400">
                            #{job.id.slice(-6).toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${statusConfig.bg} ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                          {job.priority && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                job.priority === 'CRITICAL' || job.priority === 'URGENT'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : job.priority === 'HIGH'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {job.priority}
                            </span>
                          )}
                        </div>

                        <div className="text-sm font-bold text-white flex items-center gap-2 truncate">
                          <Car className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>
                            {job.vehicleName ||
                              (job.vehicle ? `${job.vehicle.brand} ${job.vehicle.model}` : 'Vehicle')}
                          </span>
                          {job.vehicle?.registrationNumber && (
                            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                              {job.vehicle.registrationNumber}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-semibold text-slate-300">
                            {job.serviceType || 'Standard Service'}
                          </span>
                          {job.customerName && (
                            <span className="text-slate-500">
                              Customer: <span className="text-slate-400">{job.customerName}</span>
                            </span>
                          )}
                          {(job.serviceDate || job.preferredDate) && (
                            <span className="text-slate-500 flex items-center gap-1 font-mono text-[11px]">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {new Date(job.serviceDate || job.preferredDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                        {(job.status === 'ASSIGNED' &&
                          !job.repairLogs?.some((l: any) => l.action === 'Job Accepted')) && (
                          <button
                            onClick={() => handleAcceptJob(job.id)}
                            disabled={acceptingJobId === job.id}
                            className={`px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold font-['Oswald'] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                              acceptingJobId === job.id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {acceptingJobId === job.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            <span>{acceptingJobId === job.id ? 'Accepting...' : 'Accept Job'}</span>
                          </button>
                        )}

                        {job.status === 'QUALITY_CHECK' && (
                          <button
                            onClick={() => setActiveQCModalBooking(job)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold font-['Oswald'] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Quality Check</span>
                          </button>
                        )}

                        {onSelectBooking && (
                          <button
                            onClick={() => onSelectBooking(job)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>Details</span>
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate && onNavigate('tasks')}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-['Oswald'] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                        >
                          <span>Work Bay</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Performance Scorecard & Recent Real Mechanic Activity (1 col) */}
        <div className="space-y-6">
          {/* Performance Card (Strictly technician-focused, NO financial/revenue metrics) */}
          <MechanicPerformanceCard metrics={metrics} user={user} />

          {/* Recent Real Mechanic Activity */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-['Oswald'] flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-amber-500" />
              Recent Service Activity
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">
              Real-time bay logs and work order updates for your assigned vehicles
            </p>

            <div className="space-y-3">
              {recentActivities.length === 0 ? (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No recent activity recorded yet.
                </div>
              ) : (
                recentActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      {act.type === 'LOG' ? (
                        <ClipboardCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Wrench className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-200 truncate">
                        {act.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                        {act.description}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(act.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quality Check Modal */}
      {activeQCModalBooking && (
        <QualityCheckModal
          booking={activeQCModalBooking}
          isOpen={!!activeQCModalBooking}
          onClose={() => setActiveQCModalBooking(null)}
          onSubmitQC={handleSubmitQC}
          onProceedToCompletion={
            onUpdateStatus
              ? (b) => onUpdateStatus(b.id, 'COMPLETED')
              : undefined
          }
        />
      )}

      {/* Service Center Bay Map Modal */}
      {isBayMapOpen && (
        <MechanicServiceCenterModal
          isOpen={isBayMapOpen}
          onClose={() => setIsBayMapOpen(false)}
          currentUser={user}
          profile={profile}
          onNavigateFullView={
            onNavigate
              ? () => {
                  setIsBayMapOpen(false);
                  onNavigate('service-centers');
                }
              : undefined
          }
        />
      )}
    </div>
  );
};
