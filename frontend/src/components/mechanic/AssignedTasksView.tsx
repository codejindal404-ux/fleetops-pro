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
  AlertCircle,
  Loader2
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
} from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';
import { getSocket } from '../../services/socketClient.ts';
import { MechanicProfileHeader } from './MechanicProfileHeader.tsx';
import { OBDDiagnosticsModal } from './OBDDiagnosticsModal.tsx';
import { VehicleInspectionModal } from './VehicleInspectionModal.tsx';
import { RepairWorkspaceModal } from './RepairWorkspaceModal.tsx';
import { RepairImagesModal } from './RepairImagesModal.tsx';
import { SparePartsModal } from './SparePartsModal.tsx';
import { WorkshopChatModal } from './WorkshopChatModal.tsx';
import { MechanicAnalyticsView } from './MechanicAnalyticsView.tsx';
import { QualityCheckModal, QualityCheckData } from './QualityCheckModal.tsx';
import { PartsRequestView } from './PartsRequestView.tsx';
import { VehicleDiagnosticPanel } from './VehicleDiagnosticPanel.tsx';

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
  const [activeQCModalBooking, setActiveQCModalBooking] = useState<Booking | null>(null);
  const [activeCompletionBooking, setActiveCompletionBooking] = useState<Booking | null>(null);
  const [completionMileage, setCompletionMileage] = useState<number>(45000);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);

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

    socket.on('status_updated', handleStatusUpdate);
    socket.on('message:received', handleChatMessage);

    return () => {
      socket.off('status_updated', handleStatusUpdate);
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
    if (statusUpdatingId) return;
    setStatusUpdatingId(bookingId);
    try {
      const res = await apiClient.updateMechanicTaskStatus(bookingId, targetStatus, extra);
      showToast(res.message || `Status changed to ${targetStatus}`);
      await loadMechanicData();
      onUpdateStatus(bookingId, targetStatus, extra?.mileage);
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  // Accept Job
  const handleAcceptJob = async (bookingId: string) => {
    if (acceptingJobId) return;
    try {
      setAcceptingJobId(bookingId);
      const res = await apiClient.acceptMechanicJob(bookingId);
      showToast(res.message || 'Job accepted into service bay');
      await loadMechanicData();
    } catch (err: any) {
      showToast(err.message || 'Failed to accept job', 'error');
    } finally {
      setAcceptingJobId(null);
    }
  };

  // Submit Quality Check
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

      showToast('Quality Check findings recorded');
      await loadMechanicData();
    } catch (err: any) {
      showToast(err.message || 'Failed to record Quality Check', 'error');
      throw err;
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
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Toast notification banner */}
      {feedbackToast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 font-bold text-sm transition-all animate-in slide-in-from-bottom-5 duration-200 ${
            feedbackToast.type === 'error'
              ? 'bg-rose-100 text-rose-700 border-rose-200'
              : 'bg-emerald-100 text-emerald-700 border-emerald-200'
          }`}
        >
          {feedbackToast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          <span>{feedbackToast.message}</span>
        </div>
      )}

      {/* 1. Mechanic Profile Header & Live Availability */}
      <MechanicProfileHeader
        profile={profile}
        onUpdateAvailability={handleUpdateAvailability}
        isLoading={loading}
      />

      {/* 2. KPI / SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Assigned Jobs', value: jobs.length, icon: Wrench, bg: 'bg-slate-100', color: 'text-slate-600' },
          { label: 'In Inspection', value: jobs.filter(j => j.status === 'INSPECTION').length, icon: Search, bg: 'bg-cyan-100', color: 'text-cyan-600' },
          { label: 'Active Repairs', value: jobs.filter(j => j.status === 'REPAIRING').length, icon: Flame, bg: 'bg-amber-100', color: 'text-amber-600' },
          { label: 'Quality Check', value: jobs.filter(j => j.status === 'QUALITY_CHECK').length, icon: ShieldCheck, bg: 'bg-purple-100', color: 'text-purple-600' },
          { label: 'Completed', value: jobs.filter(j => j.status === 'COMPLETED').length, icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all group flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
              <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          {/* 3. ASSIGNED JOBS */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-900 font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" /> My Assigned Jobs
              </h2>
              <p className="text-sm text-slate-500 font-medium">Manage and track your active vehicle service orders</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab(activeTab === 'OBD' ? 'JOBS' : 'OBD')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'OBD' ? 'bg-cyan-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Cpu className="w-4 h-4 text-cyan-500" /> Diagnostics
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'PARTS' ? 'JOBS' : 'PARTS')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'PARTS' ? 'bg-purple-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Package className="w-4 h-4 text-purple-500" /> Parts
              </button>
              <button
                onClick={() => setActiveTab(activeTab === 'ANALYTICS' ? 'JOBS' : 'ANALYTICS')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'ANALYTICS' ? 'bg-slate-900 text-amber-400' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Analytics
              </button>
              <button onClick={loadMechanicData} className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer">
                <Activity className="w-4 h-4 text-amber-400" /> Sync
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {[
              { id: 'ALL', label: 'All Jobs' },
              { id: 'PENDING', label: 'Queue' },
              { id: 'INSPECTION', label: 'Inspection' },
              { id: 'REPAIRING', label: 'Repairing' },
              { id: 'QUALITY_CHECK', label: 'Quality Check' },
              { id: 'COMPLETED', label: 'Completed' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all whitespace-nowrap ${
                  statusFilter === st.id
                    ? 'bg-slate-900 text-amber-400 shadow-md'
                    : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {filteredJobs.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
              <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold uppercase tracking-wider">No Work Orders Found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredJobs.map((job) => {
                const stages = [
                  { id: 'PENDING', label: 'Assigned', fallback: 'ASSIGNED' },
                  { id: 'INSPECTION', label: 'Inspection' },
                  { id: 'REPAIRING', label: 'Repairing' },
                  { id: 'QUALITY_CHECK', label: 'Quality Check' },
                  { id: 'COMPLETED', label: 'Completed' }
                ];
                
                let currentIndex = stages.findIndex(s => s.id === job.status || s.fallback === job.status);
                if (currentIndex === -1) currentIndex = 0;

                return (
                  <div key={job.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
                      <div className="flex items-start gap-5">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <Car className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-amber-400 text-[10px] font-bold uppercase tracking-wider">WO #{job.id.slice(-6)}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getPriorityBadge(job.priority)}`}>{job.priority || 'NORMAL'}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getStatusBadge(job.status)}`}>{job.status.replace('_', ' ')}</span>
                          </div>
                          <h3 className="text-xl font-bold text-slate-900 font-['Oswald'] uppercase tracking-wide">
                            {job.vehicle?.brand} {job.vehicle?.model}
                          </h3>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
                            <span className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded">{job.vehicle?.registrationNumber || 'N/A'}</span>
                            <span>• {job.serviceType}</span>
                            <span>• {job.customerName || job.customer?.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 w-full md:w-48">
                        {job.status !== 'COMPLETED' ? (
                          <button
                             onClick={() => setActiveWorkspaceModalBooking(job)}
                             className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                          >
                            <Wrench className="w-4 h-4" /> Open Job
                          </button>
                        ) : (
                          <div className="w-full py-2.5 bg-slate-100 text-slate-500 font-bold text-sm rounded-xl text-center flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4" /> Completed
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 4. WORKFLOW PROGRESS */}
                    <div className="relative pt-6 border-t border-slate-100">
                      <div className="absolute top-[2.2rem] left-8 right-8 h-1 bg-slate-100 rounded-full hidden md:block"></div>
                      <div className="absolute top-[2.2rem] left-8 h-1 bg-amber-500 rounded-full transition-all duration-1000 hidden md:block" style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}></div>
                      
                      <div className="flex justify-between items-center overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                        {stages.map((stage, idx) => {
                          const isPast = idx < currentIndex;
                          const isCurrent = idx === currentIndex;
                          return (
                            <div key={stage.id} className="flex flex-col items-center gap-2 w-20 shrink-0 relative">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold z-10 border-2 transition-all ${isPast ? 'bg-amber-500 border-amber-500 text-white' : isCurrent ? 'bg-white border-amber-500 text-amber-600 ring-4 ring-amber-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                                {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${isCurrent ? 'text-amber-600' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>{stage.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-wrap gap-2 pt-6 mt-4 border-t border-slate-100">
                      <button onClick={() => setActiveInspectionModalBooking(job)} className="flex-1 min-w-[100px] py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-cyan-600" /> Inspect
                      </button>
                      <button onClick={() => setActiveOBDModalBooking(job)} className="flex-1 min-w-[100px] py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-rose-500" /> DTC
                      </button>
                      <button onClick={() => setActivePartsModalBooking(job)} className="flex-1 min-w-[100px] py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-600" /> Parts
                      </button>
                      <button onClick={() => setActiveImagesModalBooking(job)} className="flex-1 min-w-[100px] py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-1.5">
                        <Camera className="w-3.5 h-3.5 text-slate-500" /> Images
                      </button>
                      <button onClick={() => setActiveChatModalBooking(job)} className="flex-1 min-w-[100px] py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> Chat
                      </button>
                      {/* Workflow Stage Advancement Actions */}
                      {(job.status === 'ASSIGNED' &&
                        !job.repairLogs?.some((l: any) => l.action === 'Job Accepted')) ? (
                        <button
                          onClick={() => handleAcceptJob(job.id)}
                          disabled={acceptingJobId === job.id}
                          className={`flex-1 min-w-[140px] py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                            acceptingJobId === job.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {acceptingJobId === job.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {acceptingJobId === job.id ? 'Accepting...' : 'Accept Job'}
                        </button>
                      ) : job.status === 'ASSIGNED' ? (
                        <button
                          onClick={() => handleTransitionStatus(job.id, 'INSPECTION')}
                          disabled={statusUpdatingId === job.id}
                          className={`flex-1 min-w-[140px] py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                            statusUpdatingId === job.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {statusUpdatingId === job.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                          {statusUpdatingId === job.id ? 'Updating...' : 'Start Inspection'}
                        </button>
                      ) : null}

                      {job.status === 'INSPECTION' && (
                        <button
                          onClick={() => handleTransitionStatus(job.id, 'REPAIRING')}
                          disabled={statusUpdatingId === job.id}
                          className={`flex-1 min-w-[140px] py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                            statusUpdatingId === job.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {statusUpdatingId === job.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Wrench className="w-3.5 h-3.5" />
                          )}
                          {statusUpdatingId === job.id ? 'Updating...' : 'Start Repair'}
                        </button>
                      )}

                      {job.status === 'REPAIRING' && (
                        <button
                          onClick={() => handleTransitionStatus(job.id, 'QUALITY_CHECK')}
                          disabled={statusUpdatingId === job.id}
                          className={`flex-1 min-w-[160px] py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                            statusUpdatingId === job.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {statusUpdatingId === job.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          {statusUpdatingId === job.id ? 'Updating...' : 'Send to Quality Check'}
                        </button>
                      )}

                      {job.status === 'QUALITY_CHECK' && (
                        <button
                          onClick={() => setActiveQCModalBooking(job)}
                          disabled={statusUpdatingId === job.id}
                          className={`flex-1 min-w-[160px] py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                            statusUpdatingId === job.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Quality Check</span>
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 8. QUICK ACTIONS & NOTIFICATIONS */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg">
            <h3 className="font-black text-white font-['Oswald'] uppercase tracking-wide mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setActiveTab('JOBS'); setStatusFilter('ALL'); }} className="flex flex-col items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors gap-1.5 text-center group border border-slate-700 cursor-pointer">
                <Wrench className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">All Jobs</span>
              </button>
              <button onClick={() => setActiveTab('OBD')} className="flex flex-col items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors gap-1.5 text-center group border border-slate-700 cursor-pointer">
                <Cpu className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Diagnostics</span>
              </button>
              <button onClick={() => setActiveTab('PARTS')} className="flex flex-col items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors gap-1.5 text-center group border border-slate-700 cursor-pointer">
                <Package className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Parts Requisitions</span>
              </button>
              <button onClick={() => setActiveTab('ANALYTICS')} className="flex flex-col items-center justify-center p-3 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors gap-1.5 text-center group border border-slate-700 cursor-pointer">
                <BarChart3 className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Analytics</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h3 className="font-black text-slate-900 font-['Oswald'] uppercase tracking-wide mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-500" /> Recent Activity
            </h3>
            <div className="space-y-4">
               {jobs.slice(0,5).map((j, i) => (
                 <div key={i} className="flex items-start gap-3 pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{j.serviceType} for {j.vehicle?.registrationNumber}</p>
                      <p className="text-xs text-slate-500">Status changed to <span className="font-bold text-slate-700 uppercase">{j.status.replace('_',' ')}</span></p>
                    </div>
                 </div>
               ))}
               {jobs.length === 0 && <p className="text-xs text-slate-500 font-medium">No recent activity.</p>}
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'ANALYTICS' && metrics && (
        <MechanicAnalyticsView
          metrics={metrics}
          onClose={() => setActiveTab('JOBS')}
        />
      )}

      {activeTab === 'OBD' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab('JOBS')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Assigned Jobs
            </button>
          </div>
          <VehicleDiagnosticPanel
            booking={activeOBDModalBooking || jobs.find(j => j.status === 'INSPECTION' || j.status === 'REPAIRING') || jobs[0] || null}
            diagnostics={jobs.flatMap(j => j.diagnostics || [])}
            onAddDiagnostic={handleAddDiagnostic}
            onResolveDiagnostic={handleResolveDiagnostic}
          />
        </div>
      )}

      {activeTab === 'PARTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveTab('JOBS')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 rotate-180" /> Back to Assigned Jobs
            </button>
          </div>
          <PartsRequestView
            catalog={partsCatalog}
            requests={allPartsRequests}
            selectedBooking={activePartsModalBooking || jobs.find(j => j.status === 'REPAIRING' || j.status === 'INSPECTION') || jobs[0] || null}
            onSubmitRequest={async (data) => {
              const b = jobs.find(j => j.id === data.bookingId);
              await handleRequestPart({
                bookingId: data.bookingId,
                vehicleId: b?.vehicleId || '',
                partId: data.partCode || `part-${Date.now()}`,
                partName: data.partName,
                partCode: data.partCode || 'PART-GEN-01',
                quantityRequired: data.quantityRequired,
                unitCost: data.unitCost || 50,
                urgency: (data.urgency as any) || 'NORMAL',
                notes: data.notes || ''
              });
            }}
          />
        </div>
      )}

      {/* ALL MODALS PRESERVED AS REQUESTED */}
      {activeOBDModalBooking && (
        <OBDDiagnosticsModal
          booking={activeOBDModalBooking}
          isOpen={!!activeOBDModalBooking}
          onClose={() => setActiveOBDModalBooking(null)}
          onAddDiagnostic={handleAddDiagnostic}
          onResolveDiagnostic={handleResolveDiagnostic}
          onDeleteDiagnostic={handleDeleteDiagnostic}
        />
      )}

      {activeInspectionModalBooking && (
        <VehicleInspectionModal
          booking={activeInspectionModalBooking}
          isOpen={!!activeInspectionModalBooking}
          onClose={() => setActiveInspectionModalBooking(null)}
          onSaveInspection={handleSaveInspection}
        />
      )}

      {activeWorkspaceModalBooking && (
        <RepairWorkspaceModal
          booking={activeWorkspaceModalBooking}
          isOpen={!!activeWorkspaceModalBooking}
          onClose={() => setActiveWorkspaceModalBooking(null)}
          onAddLog={handleAddWorkspaceLog}
          onTransitionStatus={handleTransitionStatus}
          onOpenDiagnostics={(b) => setActiveOBDModalBooking(b)}
          onOpenPartsRequest={(b) => setActivePartsModalBooking(b)}
        />
      )}

      {activeImagesModalBooking && (
        <RepairImagesModal
          booking={activeImagesModalBooking}
          isOpen={!!activeImagesModalBooking}
          onClose={() => setActiveImagesModalBooking(null)}
          onUploadImage={handleUploadImage}
          onDeleteImage={handleDeleteImage}
        />
      )}

      {activePartsModalBooking && (
        <SparePartsModal
          booking={activePartsModalBooking}
          isOpen={!!activePartsModalBooking}
          onClose={() => setActivePartsModalBooking(null)}
          catalog={partsCatalog}
          requests={allPartsRequests.filter((r) => r.bookingId === activePartsModalBooking.id)}
          onRequestPart={handleRequestPart}
        />
      )}

      {activeChatModalBooking && (
        <WorkshopChatModal
          booking={activeChatModalBooking}
          isOpen={!!activeChatModalBooking}
          onClose={() => setActiveChatModalBooking(null)}
          onSendMessage={handleSendChatMessage}
        />
      )}

      {activeQCModalBooking && (
        <QualityCheckModal
          booking={activeQCModalBooking}
          isOpen={!!activeQCModalBooking}
          onClose={() => setActiveQCModalBooking(null)}
          onSubmitQC={handleSubmitQC}
          onProceedToCompletion={(b) => setActiveCompletionBooking(b)}
        />
      )}

      {activeCompletionBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl relative">
            <h2 className="text-xl font-bold text-white font-['Oswald'] uppercase mb-4">Complete Work Order</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1.5">Final Outbound Mileage</label>
                <input
                  type="number"
                  value={completionMileage}
                  onChange={(e) => setCompletionMileage(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500/50"
                  placeholder="e.g. 45050"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActiveCompletionBooking(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  disabled={statusUpdatingId === activeCompletionBooking.id}
                  onClick={async () => {
                    const bId = activeCompletionBooking.id;
                    await handleTransitionStatus(bId, 'COMPLETED', { mileage: completionMileage });
                    setActiveCompletionBooking(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold uppercase text-xs shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-1.5 ${statusUpdatingId === activeCompletionBooking.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {statusUpdatingId === activeCompletionBooking.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {statusUpdatingId === activeCompletionBooking.id ? 'Completing...' : 'Mark Complete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
