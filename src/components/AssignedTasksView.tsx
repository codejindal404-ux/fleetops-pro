import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Wrench,
  Play,
  CheckCircle2,
  Clock,
  Car,
  AlertTriangle,
  ClipboardCheck,
  Gauge,
  Activity,
  Cpu,
  Flame,
  Search,
  MessageSquare,
  Camera,
  Package,
  Layers,
  Sparkles,
  BarChart3,
  Calendar,
  Phone,
  Mail,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import {
  Booking,
  User,
  BookingStatus,
  MechanicProfile,
  MechanicAvailabilityStatus,
  OBDDiagnosticRecord,
  RepairInspectionReport,
  RepairImageRecord,
  SparePartCatalogItem,
  SparePartsRequest,
  ChatMessage,
  MechanicPerformanceMetrics
} from '../types.ts';
import { apiClient } from '../services/apiClient.ts';
import { getSocket } from '../services/socketClient.ts';
import { MechanicProfileHeader } from './mechanic/MechanicProfileHeader.tsx';
import { OBDDiagnosticsModal } from './mechanic/OBDDiagnosticsModal.tsx';
import { VehicleInspectionModal } from './mechanic/VehicleInspectionModal.tsx';
import { RepairWorkspaceModal } from './mechanic/RepairWorkspaceModal.tsx';
import { RepairImagesModal } from './mechanic/RepairImagesModal.tsx';
import { SparePartsModal } from './mechanic/SparePartsModal.tsx';
import { WorkshopChatModal } from './mechanic/WorkshopChatModal.tsx';
import { MechanicAnalyticsView } from './mechanic/MechanicAnalyticsView.tsx';

interface AssignedTasksViewProps {
  bookings: Booking[];
  user: User | null;
  onUpdateStatus: (bookingId: string, status: string, mileage?: number) => void;
  onAddRepairLog: (bookingId: string, note: string) => void;
  searchTerm: string;
}

type WorkshopTab = 'JOBS' | 'OBD' | 'PARTS' | 'ANALYTICS';

export const AssignedTasksView: React.FC<AssignedTasksViewProps> = ({
  bookings: initialBookings,
  user,
  onUpdateStatus,
  onAddRepairLog,
  searchTerm
}) => {
  // Navigation & Filter State
  const [activeTab, setActiveTab] = useState<WorkshopTab>('JOBS');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Server-synced state
  const [profile, setProfile] = useState<MechanicProfile | null>(null);
  const [metrics, setMetrics] = useState<MechanicPerformanceMetrics | null>(null);
  const [jobs, setJobs] = useState<Booking[]>(initialBookings);
  const [partsCatalog, setPartsCatalog] = useState<SparePartCatalogItem[]>([]);
  const [allPartsRequests, setAllPartsRequests] = useState<SparePartsRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Active Modals State
  const [activeOBDModalBooking, setActiveOBDModalBooking] = useState<Booking | null>(null);
  const [activeInspectionModalBooking, setActiveInspectionModalBooking] = useState<Booking | null>(null);
  const [activeWorkspaceModalBooking, setActiveWorkspaceModalBooking] = useState<Booking | null>(null);
  const [activeImagesModalBooking, setActiveImagesModalBooking] = useState<Booking | null>(null);
  const [activePartsModalBooking, setActivePartsModalBooking] = useState<Booking | null>(null);
  const [activeChatModalBooking, setActiveChatModalBooking] = useState<Booking | null>(null);
  const [activeCompletionBooking, setActiveCompletionBooking] = useState<Booking | null>(null);
  const [completionMileage, setCompletionMileage] = useState<number>(45000);

  // Toast trigger helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 4000);
  };

  // Fetch full mechanic profile, analytics & enriched job state
  const loadMechanicData = useCallback(async () => {
    try {
      setLoading(true);
      const [profRes, metricsRes, jobsRes, partsRes, reqsRes] = await Promise.allSettled([
        apiClient.getMechanicProfile(),
        apiClient.getMechanicPerformance(),
        apiClient.getMechanicJobs(),
        apiClient.getSparePartsCatalog(),
        apiClient.getSparePartsRequests()
      ]);

      if (profRes.status === 'fulfilled' && profRes.value.profile) {
        setProfile(profRes.value.profile);
      }
      if (metricsRes.status === 'fulfilled' && metricsRes.value.metrics) {
        setMetrics(metricsRes.value.metrics);
      }
      if (jobsRes.status === 'fulfilled' && jobsRes.value.jobs) {
        setJobs(jobsRes.value.jobs);
      } else {
        setJobs(initialBookings);
      }
      if (partsRes.status === 'fulfilled' && partsRes.value.parts) {
        setPartsCatalog(partsRes.value.parts);
      }
      if (reqsRes.status === 'fulfilled' && reqsRes.value.requests) {
        setAllPartsRequests(reqsRes.value.requests);
      }
    } catch (err) {
      console.error('Failed loading mechanic workshop data:', err);
    } finally {
      setLoading(false);
    }
  }, [initialBookings]);

  useEffect(() => {
    loadMechanicData();
  }, [loadMechanicData]);

  // Sync when initialBookings updates
  useEffect(() => {
    if (initialBookings.length > 0) {
      setJobs((prev) => {
        // preserve enriched properties where possible
        return initialBookings.map((ib) => {
          const found = prev.find((p) => p.id === ib.id);
          return found ? { ...found, ...ib } : ib;
        });
      });
    }
  }, [initialBookings]);

  // Real-time Socket.IO Listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleStatusUpdate = (data: any) => {
      showToast(`Work Order #${data.bookingId?.slice(-6) || ''}: ${data.message || 'Status Updated'}`);
      loadMechanicData();
    };

    const handleChatMessage = (data: any) => {
      showToast(`New message for Work Order #${data.bookingId?.slice(-6)}: ${data.message?.substring(0, 40)}...`);
      // update chat modal if open for this booking
      setJobs((prev) =>
        prev.map((j) => {
          if (j.id === data.bookingId) {
            const currentMsgs = j.chatMessages || [];
            return { ...j, chatMessages: [...currentMsgs, data] };
          }
          return j;
        })
      );
    };

    socket.on('repair:status_updated', handleStatusUpdate);
    socket.on('message:received', handleChatMessage);

    return () => {
      socket.off('repair:status_updated', handleStatusUpdate);
      socket.off('message:received', handleChatMessage);
    };
  }, [loadMechanicData]);

  // 1. Availability Status Handler
  const handleUpdateAvailability = async (availability: MechanicAvailabilityStatus) => {
    try {
      await apiClient.updateMechanicAvailability(availability);
      setProfile((prev) => (prev ? { ...prev, availability } : null));
      showToast(`Bay availability set to ${availability}`);
    } catch (err: any) {
      showToast(err.message || 'Failed to update availability', 'error');
    }
  };

  // 2. Status Workflow Handler
  const handleTransitionStatus = async (
    bookingId: string,
    targetStatus: BookingStatus,
    extra?: { mileage?: number; notes?: string; progressPercentage?: number }
  ) => {
    try {
      const res = await apiClient.updateMechanicTaskStatus(bookingId, targetStatus, extra);
      showToast(res.message || `Status changed to ${targetStatus}`);
      await loadMechanicData();
      onUpdateStatus(bookingId, targetStatus, extra?.mileage);
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  // Accept Job
  const handleAcceptJob = async (bookingId: string) => {
    try {
      const res = await apiClient.acceptMechanicJob(bookingId);
      showToast(res.message || 'Job accepted into service bay');
      await loadMechanicData();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept job', 'error');
    }
  };

  // 3. OBD-II Diagnostics Handlers
  const handleAddDiagnostic = async (data: any) => {
    try {
      const res = await apiClient.addDiagnostic(data);
      showToast(res.message || 'DTC fault code recorded');
      await loadMechanicData();
      // update active booking diagnostics in state
      if (activeOBDModalBooking) {
        const current = activeOBDModalBooking.diagnostics || [];
        setActiveOBDModalBooking({
          ...activeOBDModalBooking,
          diagnostics: [...current, res.diagnostic]
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add diagnostic code', 'error');
    }
  };

  const handleResolveDiagnostic = async (id: string) => {
    try {
      await apiClient.resolveDiagnostic(id);
      showToast('DTC fault marked resolved');
      await loadMechanicData();
      if (activeOBDModalBooking) {
        const updated = (activeOBDModalBooking.diagnostics || []).map((d) =>
          d.id === id ? { ...d, status: 'RESOLVED' as const } : d
        );
        setActiveOBDModalBooking({ ...activeOBDModalBooking, diagnostics: updated });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to resolve diagnostic', 'error');
    }
  };

  const handleDeleteDiagnostic = async (id: string) => {
    try {
      await apiClient.deleteDiagnostic(id);
      showToast('Diagnostic fault removed');
      await loadMechanicData();
      if (activeOBDModalBooking) {
        const filtered = (activeOBDModalBooking.diagnostics || []).filter((d) => d.id !== id);
        setActiveOBDModalBooking({ ...activeOBDModalBooking, diagnostics: filtered });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete diagnostic', 'error');
    }
  };

  // 4. Vehicle Inspection Handler
  const handleSaveInspection = async (data: any) => {
    try {
      const res = await apiClient.saveInspection(data);
      showToast(res.message || 'Inspection report saved');
      await loadMechanicData();
      if (activeInspectionModalBooking) {
        setActiveInspectionModalBooking({
          ...activeInspectionModalBooking,
          inspection: res.inspection
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save inspection', 'error');
    }
  };

  // 5. Repair Workspace Log Handler
  const handleAddWorkspaceLog = async (data: any) => {
    try {
      const res = await apiClient.addMechanicRepairLog(data.bookingId, data);
      showToast(res.message || 'Repair entry recorded');
      await loadMechanicData();
      if (activeWorkspaceModalBooking) {
        const currentLogs = activeWorkspaceModalBooking.repairLogs || [];
        setActiveWorkspaceModalBooking({
          ...activeWorkspaceModalBooking,
          repairLogs: [...currentLogs, res.repairLog],
          progressPercentage: data.progressPercentage || activeWorkspaceModalBooking.progressPercentage
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add repair entry', 'error');
    }
  };

  // 6. Repair Images Handlers
  const handleUploadImage = async (data: any) => {
    try {
      const res = await apiClient.uploadRepairImage(data);
      showToast(res.message || 'Photo attached successfully');
      await loadMechanicData();
      if (activeImagesModalBooking) {
        const current = activeImagesModalBooking.images || [];
        setActiveImagesModalBooking({
          ...activeImagesModalBooking,
          images: [...current, res.image]
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to upload photo', 'error');
    }
  };

  const handleDeleteImage = async (id: string) => {
    try {
      await apiClient.deleteRepairImage(id);
      showToast('Photo removed');
      await loadMechanicData();
      if (activeImagesModalBooking) {
        const filtered = (activeImagesModalBooking.images || []).filter((i) => i.id !== id);
        setActiveImagesModalBooking({ ...activeImagesModalBooking, images: filtered });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to delete photo', 'error');
    }
  };

  const handleToggleImageApproval = async (id: string, isApproved: boolean) => {
    try {
      const res = await apiClient.toggleImageApproval(id, isApproved);
      showToast(res.message || 'Customer visibility updated');
      await loadMechanicData();
      if (activeImagesModalBooking) {
        const updated = (activeImagesModalBooking.images || []).map((img) =>
          img.id === id ? { ...img, isApprovedForCustomer: isApproved } : img
        );
        setActiveImagesModalBooking({ ...activeImagesModalBooking, images: updated });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update approval', 'error');
    }
  };

  // 7. Spare Parts Request Handler
  const handleRequestPart = async (data: any) => {
    try {
      const res = await apiClient.createSparePartsRequest(data);
      showToast(res.message || 'Parts requisition submitted');
      await loadMechanicData();
      if (activePartsModalBooking) {
        const current = activePartsModalBooking.partsRequests || [];
        setActivePartsModalBooking({
          ...activePartsModalBooking,
          partsRequests: [...current, res.request]
        });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to submit parts requisition', 'error');
    }
  };

  // 8. Workshop Chat Handlers
  const handleSendChatMessage = async (data: any) => {
    try {
      const res = await apiClient.sendWorkshopChatMessage(data.bookingId, data);
      if (activeChatModalBooking) {
        const current = activeChatModalBooking.chatMessages || [];
        setActiveChatModalBooking({
          ...activeChatModalBooking,
          chatMessages: [...current, res.chatMessage]
        });
      }
      await loadMechanicData();
    } catch (err: any) {
      showToast(err.message || 'Failed to send message', 'error');
    }
  };

  const handleUpdateChatApproval = async (messageId: string, approvalStatus: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await apiClient.updateWorkshopChatApproval(messageId, approvalStatus);
      showToast(res.message || `Authorization recorded: ${approvalStatus}`);
      await loadMechanicData();
      if (activeChatModalBooking) {
        const updated = (activeChatModalBooking.chatMessages || []).map((m) =>
          m.id === messageId ? { ...m, approvalStatus } : m
        );
        setActiveChatModalBooking({ ...activeChatModalBooking, chatMessages: updated });
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update authorization', 'error');
    }
  };

  // Filtered Jobs Computation
  const filteredJobs = useMemo(() => {
    return jobs.filter((b) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.serviceType.toLowerCase().includes(q) ||
        b.vehicle?.brand.toLowerCase().includes(q) ||
        b.vehicle?.model.toLowerCase().includes(q) ||
        b.vehicle?.registrationNumber.toLowerCase().includes(q) ||
        (b.customerName && b.customerName.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter === 'PENDING') {
        matchesStatus = b.status === 'PENDING' || b.status === 'APPROVED' || b.status === 'ASSIGNED';
      } else if (statusFilter === 'INSPECTION') {
        matchesStatus = b.status === 'INSPECTION';
      } else if (statusFilter === 'REPAIRING') {
        matchesStatus = b.status === 'REPAIRING';
      } else if (statusFilter === 'QUALITY_CHECK') {
        matchesStatus = b.status === 'QUALITY_CHECK';
      } else if (statusFilter === 'COMPLETED') {
        matchesStatus = b.status === 'COMPLETED';
      }

      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, statusFilter]);

  // Priority badge helper
  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case 'URGENT':
        return 'bg-red-500/20 text-red-400 border-red-500/40 ring-1 ring-red-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW':
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
      case 'NORMAL':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  // Status badge helper
  const getStatusBadge = (s: BookingStatus) => {
    switch (s) {
      case 'COMPLETED':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'QUALITY_CHECK':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'REPAIRING':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'INSPECTION':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'APPROVED':
      case 'ASSIGNED':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'CANCELLED':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'PENDING':
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast notification banner */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 font-mono text-xs font-bold transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            feedbackToast.type === 'error'
              ? 'bg-red-950/90 text-red-200 border-red-600'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500'
          }`}
        >
          {feedbackToast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* 1. Mechanic Profile Header & Live Availability & KPIs */}
      <MechanicProfileHeader
        profile={profile}
        onUpdateAvailability={handleUpdateAvailability}
        isLoading={loading}
      />

      {/* Top-Level Workshop Navigation Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            type="button"
            id="tab-btn-jobs"
            onClick={() => setActiveTab('JOBS')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'JOBS'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Active Service Bays ({jobs.length})
          </button>

          <button
            type="button"
            id="tab-btn-obd"
            onClick={() => setActiveTab('OBD')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'OBD'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            OBD-II Telemetry Bay
          </button>

          <button
            type="button"
            id="tab-btn-parts"
            onClick={() => setActiveTab('PARTS')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'PARTS'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            Parts Requisitions ({allPartsRequests.length})
          </button>

          <button
            type="button"
            id="tab-btn-analytics"
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'ANALYTICS'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Workshop Analytics
          </button>
        </div>

        {/* Refresh Sync Button */}
        <button
          type="button"
          onClick={loadMechanicData}
          className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 self-end sm:self-auto"
        >
          <Activity className="w-3.5 h-3.5 text-amber-400" />
          <span>Sync Bays</span>
        </button>
      </div>

      {/* TAB 1: WORK ORDER SERVICE BAYS */}
      {activeTab === 'JOBS' && (
        <div className="space-y-6">
          {/* Status Sub-Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 font-mono text-xs">
            {[
              { id: 'ALL', label: 'All Bays' },
              { id: 'PENDING', label: 'Queue / Staged' },
              { id: 'INSPECTION', label: 'Inspection Bay' },
              { id: 'REPAIRING', label: 'Active Repair' },
              { id: 'QUALITY_CHECK', label: 'Quality Check' },
              { id: 'COMPLETED', label: 'Completed' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3.5 py-1.5 rounded-xl uppercase transition whitespace-nowrap border ${
                  statusFilter === st.id
                    ? 'bg-slate-900 border-amber-500/60 text-amber-400 font-bold shadow-md'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Job Cards Grid */}
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <Wrench className="w-12 h-12 text-slate-700 mx-auto" />
              <h3 className="text-base font-bold text-white font-mono uppercase">
                No Work Orders in Selected Bay View
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No active vehicle repair jobs match your current search and status filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredJobs.map((job) => {
                const progress = job.progressPercentage || (
                  job.status === 'COMPLETED' ? 100 :
                  job.status === 'QUALITY_CHECK' ? 90 :
                  job.status === 'REPAIRING' ? 60 :
                  job.status === 'INSPECTION' ? 30 : 10
                );

                const activeDTCsCount = (job.diagnostics || []).filter((d) => d.status === 'ACTIVE').length;
                const photosCount = (job.images || []).length;
                const msgsCount = (job.chatMessages || []).length;
                const partsCount = (job.partsRequests || []).length;

                return (
                  <div
                    key={job.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 transition duration-200 group"
                  >
                    {/* Top row: Order ID, Priority, Status */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-800 text-amber-400 font-mono text-xs font-bold tracking-wider">
                          WO #{job.id.slice(-6).toUpperCase()}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold uppercase ${getPriorityBadge(job.priority)}`}>
                          {job.priority || 'NORMAL'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full border text-xs font-mono font-bold uppercase ${getStatusBadge(job.status)}`}>
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Vehicle & Customer Identity */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Left: Vehicle Details */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
                          <Car className="w-3.5 h-3.5 text-amber-400" />
                          <span>Vehicle Specification</span>
                        </div>
                        <div className="text-lg font-bold text-white font-['Oswald'] uppercase">
                          {job.vehicle?.brand} {job.vehicle?.model}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-amber-300 font-bold">
                            {job.vehicle?.registrationNumber || 'NO-PLATE'}
                          </span>
                          <span>•</span>
                          <span>{job.vehicle?.year || '2022'}</span>
                          <span>•</span>
                          <span>{job.vehicle?.mileage ? `${job.vehicle.mileage.toLocaleString()} mi` : '42,000 mi'}</span>
                        </div>
                      </div>

                      {/* Right: Customer Info */}
                      <div className="space-y-1.5 sm:border-l sm:border-slate-800 sm:pl-4">
                        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span>Customer Contact</span>
                        </div>
                        <div className="text-sm font-bold text-white">
                          {job.customerName || job.customer?.name || 'Customer'}
                        </div>
                        <div className="space-y-0.5 text-xs text-slate-400 font-mono">
                          {job.customer?.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{job.customer.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 truncate">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>Booked for: {job.serviceDate || job.preferredDate || 'Immediate'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Problem Description & Service Type */}
                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 uppercase font-bold">Service Package:</span>
                        <span className="text-amber-300 font-bold">{job.serviceType}</span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2">
                        {job.issueDescription || 'Customer reported vibration under heavy braking and requested general multi-point diagnostic check.'}
                      </p>
                    </div>

                    {/* Progress Bar & Cost Calculation */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 uppercase">Repair Bay Progress</span>
                        <span className="text-emerald-400 font-bold">{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                        <span>Est. Cost: <strong className="text-slate-200">${job.estimatedCost || 250}</strong></span>
                        {job.serviceCenter && (
                          <span>Hub: {job.serviceCenter.name}</span>
                        )}
                      </div>
                    </div>

                    {/* Modal Sub-Action Trigger Buttons */}
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-2 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setActiveWorkspaceModalBooking(job)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 text-[10px] font-mono font-bold flex flex-col items-center gap-1 transition"
                        title="Repair Workspace Logs"
                      >
                        <Wrench className="w-3.5 h-3.5 text-amber-400" />
                        <span>Logs ({(job.repairLogs || []).length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveOBDModalBooking(job)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 text-[10px] font-mono font-bold flex flex-col items-center gap-1 transition"
                        title="OBD-II DTC Diagnostic Codes"
                      >
                        <Cpu className="w-3.5 h-3.5 text-rose-400" />
                        <span>DTC ({activeDTCsCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveInspectionModalBooking(job)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 hover:text-emerald-400 text-[10px] font-mono font-bold flex flex-col items-center gap-1 transition"
                        title="Multi-Point Safety Inspection"
                      >
                        <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Health</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveImagesModalBooking(job)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-400 text-[10px] font-mono font-bold flex flex-col items-center gap-1 transition"
                        title="Before / After Photos"
                      >
                        <Camera className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Photos ({photosCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActivePartsModalBooking(job)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 text-[10px] font-mono font-bold flex flex-col items-center gap-1 transition"
                        title="Spare Parts Requisitions"
                      >
                        <Package className="w-3.5 h-3.5 text-amber-400" />
                        <span>Parts ({partsCount})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveChatModalBooking(job)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 text-slate-300 hover:text-blue-400 text-[10px] font-mono font-bold flex flex-col items-center gap-1 transition"
                        title="Customer Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                        <span>Chat ({msgsCount})</span>
                      </button>
                    </div>

                    {/* Primary Status Workflow Execution Buttons */}
                    <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      {/* PENDING / APPROVED -> ACCEPT */}
                      {(job.status === 'PENDING' || job.status === 'APPROVED' || job.status === 'ASSIGNED') && (
                        <button
                          type="button"
                          onClick={() => handleAcceptJob(job.id)}
                          className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50"
                        >
                          <Play className="w-4 h-4" />
                          Accept Job & Stage Bay
                        </button>
                      )}

                      {/* INSPECTION PHASE */}
                      {job.status === 'INSPECTION' && (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => setActiveInspectionModalBooking(job)}
                            className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/50"
                          >
                            <ClipboardCheck className="w-4 h-4" />
                            Perform Inspection
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransitionStatus(job.id, 'REPAIRING', { progressPercentage: 50 })}
                            className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50"
                          >
                            <Wrench className="w-4 h-4" />
                            Start Mechanical Repair
                          </button>
                        </div>
                      )}

                      {/* REPAIRING PHASE */}
                      {job.status === 'REPAIRING' && (
                        <div className="flex items-center gap-2 w-full">
                          <button
                            type="button"
                            onClick={() => setActiveWorkspaceModalBooking(job)}
                            className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2"
                          >
                            <Wrench className="w-4 h-4" />
                            Log Workspace Entry
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTransitionStatus(job.id, 'QUALITY_CHECK', { progressPercentage: 90 })}
                            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            Send to Quality Check
                          </button>
                        </div>
                      )}

                      {/* QUALITY CHECK PHASE */}
                      {job.status === 'QUALITY_CHECK' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCompletionMileage(job.vehicle?.mileage ? job.vehicle.mileage + 15 : 45000);
                            setActiveCompletionBooking(job);
                          }}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Complete & Release Vehicle
                        </button>
                      )}

                      {/* COMPLETED PHASE */}
                      {job.status === 'COMPLETED' && (
                        <div className="w-full py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Job Completed & Released to Customer</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OBD-II TELEMETRY BAY VIEW */}
      {activeTab === 'OBD' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white font-['Oswald'] uppercase">
                  Active Fleet OBD-II Fault Telemetry
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Select a work order below to run real-time sensor diagnostic scans and log ECU trouble codes.
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Cpu className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {jobs.map((job) => {
                const dtcs = job.diagnostics || [];
                const activeDTCs = dtcs.filter((d) => d.status === 'ACTIVE');

                return (
                  <div
                    key={job.id}
                    className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between hover:border-rose-500/40 transition"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          WO #{job.id.slice(-6).toUpperCase()}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                          activeDTCs.length > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        }`}>
                          {activeDTCs.length} Active DTCs
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white font-['Oswald'] uppercase">
                        {job.vehicle?.brand} {job.vehicle?.model}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        Plate: {job.vehicle?.registrationNumber || 'N/A'}
                      </div>
                    </div>

                    {/* DTC Code Pills */}
                    {activeDTCs.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 py-1">
                        {activeDTCs.map((d) => (
                          <span
                            key={d.id}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-rose-500/40 text-rose-400 font-mono text-[11px] font-bold"
                          >
                            {d.faultCode}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-400 font-mono py-1">
                        ✓ No Active Engine Faults
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setActiveOBDModalBooking(job)}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 text-xs font-mono font-bold uppercase transition flex items-center justify-center gap-1.5"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      Open OBD-II Diagnostics
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SPARE PARTS REQUISITIONS VIEW */}
      {activeTab === 'PARTS' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white font-['Oswald'] uppercase">
                  Workshop Parts Inventory & Requisition Feed
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Browse central warehouse catalog, order OEM spare parts, and monitor technician dispatch status.
                </p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Package className="w-5 h-5" />
              </div>
            </div>

            {/* Quick Catalog Preview Cards */}
            <div className="space-y-2">
              <h3 className="text-xs font-mono uppercase text-slate-400 font-bold">
                Available In-Stock Spare Parts ({partsCatalog.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {partsCatalog.slice(0, 8).map((part) => (
                  <div
                    key={part.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-1 hover:border-amber-500/40 transition"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-white truncate">{part.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">Code: {part.partNumber}</div>
                    <div className="flex items-center justify-between pt-1 text-xs font-mono">
                      <span className="text-emerald-400 font-bold">${part.unitPrice}</span>
                      <span className="text-slate-500">{part.inStock} in stock</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Requisitions Feed Table */}
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-mono uppercase text-slate-400 font-bold">
                Active Requisitions Queue ({allPartsRequests.length})
              </h3>

              {allPartsRequests.length === 0 ? (
                <div className="p-8 text-center bg-slate-950 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs font-mono">
                  No spare parts requisitions submitted yet. Use the "Parts" action on any active work order to dispatch a request.
                </div>
              ) : (
                <div className="space-y-2">
                  {allPartsRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white">{req.partName}</span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300">
                            {req.partCode}
                          </span>
                          <span className="text-slate-400 font-mono text-[11px]">
                            Qty: {req.quantityRequired} • Total: ${req.totalCost}
                          </span>
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono">
                          Work Order #{req.bookingId.slice(-6).toUpperCase()} • Urgency: <strong className="text-amber-400">{req.urgency}</strong> • {new Date(req.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono text-xs font-bold uppercase">
                          {req.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MECHANIC ANALYTICS & KPIS */}
      {activeTab === 'ANALYTICS' && (
        <MechanicAnalyticsView metrics={metrics} />
      )}

      {/* ================= MODAL OVERLAYS ================= */}

      {/* 1. OBD-II Diagnostics Modal */}
      {activeOBDModalBooking && (
        <OBDDiagnosticsModal
          booking={activeOBDModalBooking}
          isOpen={!!activeOBDModalBooking}
          onClose={() => setActiveOBDModalBooking(null)}
          diagnostics={activeOBDModalBooking.diagnostics || []}
          onAddDiagnostic={handleAddDiagnostic}
          onResolveDiagnostic={handleResolveDiagnostic}
          onDeleteDiagnostic={handleDeleteDiagnostic}
        />
      )}

      {/* 2. Vehicle Health Inspection Modal */}
      {activeInspectionModalBooking && (
        <VehicleInspectionModal
          booking={activeInspectionModalBooking}
          isOpen={!!activeInspectionModalBooking}
          onClose={() => setActiveInspectionModalBooking(null)}
          existingInspection={activeInspectionModalBooking.inspection}
          onSaveInspection={handleSaveInspection}
        />
      )}

      {/* 3. Repair Workspace Modal */}
      {activeWorkspaceModalBooking && (
        <RepairWorkspaceModal
          booking={activeWorkspaceModalBooking}
          isOpen={!!activeWorkspaceModalBooking}
          onClose={() => setActiveWorkspaceModalBooking(null)}
          onAddLog={handleAddWorkspaceLog}
        />
      )}

      {/* 4. Repair Images Modal */}
      {activeImagesModalBooking && (
        <RepairImagesModal
          booking={activeImagesModalBooking}
          isOpen={!!activeImagesModalBooking}
          onClose={() => setActiveImagesModalBooking(null)}
          images={activeImagesModalBooking.images || []}
          onUploadImage={handleUploadImage}
          onDeleteImage={handleDeleteImage}
          onToggleApproval={handleToggleImageApproval}
        />
      )}

      {/* 5. Spare Parts Modal */}
      {activePartsModalBooking && (
        <SparePartsModal
          booking={activePartsModalBooking}
          isOpen={!!activePartsModalBooking}
          onClose={() => setActivePartsModalBooking(null)}
          partsCatalog={partsCatalog}
          partsRequests={activePartsModalBooking.partsRequests || []}
          onRequestPart={handleRequestPart}
        />
      )}

      {/* 6. Customer Chat Modal */}
      {activeChatModalBooking && (
        <WorkshopChatModal
          booking={activeChatModalBooking}
          currentUser={user}
          isOpen={!!activeChatModalBooking}
          onClose={() => setActiveChatModalBooking(null)}
          messages={activeChatModalBooking.chatMessages || []}
          onSendMessage={handleSendChatMessage}
          onUpdateApproval={handleUpdateChatApproval}
        />
      )}

      {/* 7. Complete & Release Work Order Modal */}
      {activeCompletionBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Oswald'] uppercase">
                  Finalize & Release Vehicle
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  WO #{activeCompletionBooking.id.slice(-6).toUpperCase()} • {activeCompletionBooking.vehicle?.brand} {activeCompletionBooking.vehicle?.model}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Final Odometer Mileage Reading (mi)
                </label>
                <input
                  type="number"
                  value={completionMileage}
                  onChange={(e) => setCompletionMileage(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="text-emerald-400 font-mono uppercase text-[11px] font-bold">
                  Automated Completion Workflow:
                </div>
                <p className="text-[11px] text-slate-400">
                  • Resets next scheduled maintenance reminder clock.<br />
                  • Updates vehicle odometer record in database.<br />
                  • Dispatches pickup notification to customer.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveCompletionBooking(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono uppercase hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const bId = activeCompletionBooking.id;
                  setActiveCompletionBooking(null);
                  await handleTransitionStatus(bId, 'COMPLETED', {
                    mileage: completionMileage,
                    progressPercentage: 100,
                    notes: `Job successfully finalized and quality approved by master technician at ${completionMileage} miles.`
                  });
                }}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono uppercase font-bold shadow-lg shadow-emerald-950/50"
              >
                Sign-Off & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
