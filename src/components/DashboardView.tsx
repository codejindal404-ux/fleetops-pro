import React, { useState, useMemo } from 'react';
import {
  Wrench,
  FileSpreadsheet,
  Plus,
  Eye,
  Clock,
  AlertCircle,
  AlertTriangle,
  Bell,
  Calendar,
  Gauge,
  Truck,
  Car,
  Bus,
  ArrowUpRight,
  ShieldAlert,
  Filter,
  CheckCircle,
  ChevronRight,
  Activity,
  Cpu,
  ShieldCheck,
  Receipt,
  TrendingUp,
  BarChart3,
  DollarSign,
  PieChart as PieChartIcon,
  CheckCircle2,
  XCircle,
  UserCheck,
  Sparkles,
  Calculator,
  Sliders,
  MapPin,
  Navigation,
  Star,
  Award,
  Building2
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Booking, Invoice, Vehicle, User, ServiceCenter, ServiceCenterRecommendation } from '../types.ts';
import { apiClient } from '../services/apiClient.ts';
import { ServiceCenterDetails } from './service-center/ServiceCenterDetails.tsx';
import { BookServiceAtCenterModal } from './map/BookServiceAtCenterModal.tsx';
import { CustomerDashboardView } from './customer/CustomerDashboardView.tsx';
import { AdminDashboardView } from './admin/AdminDashboardView.tsx';

interface DashboardViewProps {
  bookings: Booking[];
  invoices: Invoice[];
  vehicles: Vehicle[];
  user: User | null;
  onSelectBooking: (booking: Booking) => void;
  onUpdateStatus: (bookingId: string, nextStatus: string) => void;
  onOpenNewService: () => void;
  onBookServiceForVehicle?: (vehicle: Vehicle) => void;
  onNavigateToServiceCenters?: () => void;
  searchTerm: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  bookings,
  invoices,
  vehicles,
  user,
  onSelectBooking,
  onUpdateStatus,
  onOpenNewService,
  onBookServiceForVehicle,
  onNavigateToServiceCenters,
  searchTerm
}) => {
  if (user && user.role === 'CUSTOMER') {
    return (
      <CustomerDashboardView
        user={user}
        onNavigate={(view) => {
          if (view === 'find-service-center' && onNavigateToServiceCenters) {
            onNavigateToServiceCenters();
          } else {
            window.dispatchEvent(new CustomEvent('fleetops:navigate', { detail: view }));
          }
        }}
        onOpenNewService={(vehicleId, serviceType) => {
          if (vehicleId) {
            const found = vehicles.find((v) => v.id === vehicleId);
            if (found && onBookServiceForVehicle) {
              onBookServiceForVehicle(found);
              return;
            }
          }
          onOpenNewService();
        }}
        onOpenAddVehicle={() => {
          window.dispatchEvent(new CustomEvent('fleetops:open-add-vehicle'));
        }}
      />
    );
  }

  if (user && user.role === 'ADMIN') {
    return (
      <AdminDashboardView
        user={user}
        bookings={bookings}
        invoices={invoices}
        vehicles={vehicles}
        onSelectBooking={onSelectBooking}
        onNavigateToTab={(tab) => {
          window.dispatchEvent(new CustomEvent('fleetops:navigate', { detail: tab }));
        }}
        onOpenNewService={onOpenNewService}
        onOpenAddServiceCenter={() => {
          window.dispatchEvent(new CustomEvent('fleetops:navigate', { detail: 'service-centers' }));
        }}
      />
    );
  }

  const [queueFilter, setQueueFilter] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<'6M' | '12M'>('6M');
  const [chartMetricView, setChartMetricView] = useState<'ALL' | 'REVENUE' | 'BOOKINGS'>('ALL');
  const [maintenanceFilter, setMaintenanceFilter] = useState<'ALL' | 'OVERDUE' | 'DUE_SOON' | 'UP_TO_DATE'>('ALL');

  // Service Center recommendations state
  const [recommendedCenters, setRecommendedCenters] = useState<ServiceCenterRecommendation[]>([]);
  const [selectedDetailCenter, setSelectedDetailCenter] = useState<ServiceCenter | null>(null);
  const [bookingModalCenter, setBookingModalCenter] = useState<ServiceCenter | null>(null);

  React.useEffect(() => {
    const fetchTopCenters = async () => {
      try {
        const data = await apiClient.getRecommendedServiceCenters(28.6315, 77.2167, 40);
        setRecommendedCenters((data.recommendations || []).slice(0, 3));
      } catch (err) {
        console.warn('Could not fetch top recommended service centers:', err);
      }
    };
    fetchTopCenters();
  }, []);

  // Predictive Maintenance Date Estimator State
  const [globalUsageRate, setGlobalUsageRate] = useState<number>(1500);
  const [customMonthlyMileageMap, setCustomMonthlyMileageMap] = useState<Record<string, number>>({});

  // Predictive Maintenance Date Estimation Memoized Calculation
  const predictiveMaintenanceEstimates = useMemo(() => {
    return vehicles.map((v) => {
      const currentMileage = v.mileage ?? 45000;
      const targetMileage = v.nextMaintenanceMileage ?? (currentMileage + 3000);
      const kmRemaining = Math.max(0, targetMileage - currentMileage);

      // Default monthly usage based on vehicle type or user override
      const defaultMonthly = v.avgMonthlyMileage ?? (v.vehicleType === 'TRUCK' ? 2500 : v.vehicleType === 'BUS' ? 3000 : globalUsageRate);
      const monthlyRate = customMonthlyMileageMap[v.id] ?? defaultMonthly;
      const dailyRate = Math.max(1, monthlyRate / 30.416);

      const daysRemaining = targetMileage <= currentMileage ? 0 : Math.round(kmRemaining / dailyRate);
      const projectedDate = new Date(Date.now() + daysRemaining * 86400000);
      const formattedDate = targetMileage <= currentMileage
        ? 'Overdue Now'
        : projectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      let urgencyLevel: 'OVERDUE' | 'CRITICAL' | 'DUE_SOON' | 'ON_TRACK' = 'ON_TRACK';
      if (targetMileage <= currentMileage) {
        urgencyLevel = 'OVERDUE';
      } else if (daysRemaining <= 14) {
        urgencyLevel = 'CRITICAL';
      } else if (daysRemaining <= 30) {
        urgencyLevel = 'DUE_SOON';
      }

      return {
        vehicle: v,
        currentMileage,
        targetMileage,
        kmRemaining,
        monthlyRate,
        dailyRate,
        daysRemaining,
        projectedDate,
        formattedDate,
        urgencyLevel
      };
    });
  }, [vehicles, globalUsageRate, customMonthlyMileageMap]);

  // Calculate KPI metrics dynamically from backend state
  const activeBookingsCount = bookings.filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED').length;
  const vehiclesInServiceCount = bookings.filter((b) => b.status === 'REPAIRING' || b.status === 'ASSIGNED').length;
  const pendingInvoicesCount = invoices.filter((i) => i.status === 'UNPAID').length;

  // Maintenance Alerts computation based on mileage or time intervals
  const vehicleMaintenanceAlerts = useMemo(() => {
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

      const progressPercent = Math.min(100, Math.max(0, Math.round((currentMileage / targetMileage) * 100)));

      let alertType: 'OVERDUE' | 'DUE_SOON' | 'OK' = 'OK';
      let urgencyText = 'Service Up-to-Date';
      let badgeStyle = 'bg-emerald-500/10 text-emerald-700 border-emerald-300';
      let pillBg = 'bg-emerald-500';

      if (isMileageOverdue || isTimeOverdue) {
        alertType = 'OVERDUE';
        urgencyText = isMileageOverdue
          ? `OVERDUE BY ${Math.abs(kmRemaining).toLocaleString()} MI`
          : `OVERDUE BY ${Math.abs(daysRemaining)} DAYS`;
        badgeStyle = 'bg-rose-500/10 text-rose-700 border-rose-300';
        pillBg = 'bg-rose-600';
      } else if (isMileageDueSoon || isTimeDueSoon) {
        alertType = 'DUE_SOON';
        urgencyText = isTimeDueSoon && daysRemaining <= 7
          ? `DUE IN ${daysRemaining} DAYS`
          : `DUE IN ${kmRemaining.toLocaleString()} MI`;
        badgeStyle = 'bg-amber-500/10 text-amber-700 border-amber-300';
        pillBg = 'bg-amber-500';
      }

      return {
        vehicle: v,
        alertType,
        currentMileage,
        targetMileage,
        kmRemaining,
        daysRemaining,
        urgencyText,
        badgeStyle,
        pillBg,
        progressPercent
      };
    });
  }, [vehicles]);

  const overdueAlerts = useMemo(() => vehicleMaintenanceAlerts.filter((a) => a.alertType === 'OVERDUE'), [vehicleMaintenanceAlerts]);
  const dueSoonAlerts = useMemo(() => vehicleMaintenanceAlerts.filter((a) => a.alertType === 'DUE_SOON'), [vehicleMaintenanceAlerts]);
  const totalAlertsCount = overdueAlerts.length + dueSoonAlerts.length;

  const filteredMaintenanceAlerts = useMemo(() => {
    if (maintenanceFilter === 'OVERDUE') return vehicleMaintenanceAlerts.filter((a) => a.alertType === 'OVERDUE');
    if (maintenanceFilter === 'DUE_SOON') return vehicleMaintenanceAlerts.filter((a) => a.alertType === 'DUE_SOON');
    if (maintenanceFilter === 'UP_TO_DATE') return vehicleMaintenanceAlerts.filter((a) => a.alertType === 'OK');
    return vehicleMaintenanceAlerts;
  }, [vehicleMaintenanceAlerts, maintenanceFilter]);

  // Compute aggregated monthly trends for Recharts visualization
  const monthlyData = useMemo(() => {
    const monthsCount = timeRange === '6M' ? 6 : 12;
    const now = new Date();
    const result: Array<{
      monthKey: string;
      month: string;
      bookingsCount: number;
      completedCount: number;
      revenue: number;
      pendingRevenue: number;
    }> = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${monthNum}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });

      result.push({
        monthKey,
        month: monthLabel,
        bookingsCount: 0,
        completedCount: 0,
        revenue: 0,
        pendingRevenue: 0
      });
    }

    const resultMap = new Map(result.map((r) => [r.monthKey, r]));

    // Map bookings
    bookings.forEach((b) => {
      const d = new Date(b.createdAt || b.preferredDate);
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const item = resultMap.get(key);
        if (item) {
          item.bookingsCount += 1;
          if (b.status === 'COMPLETED') {
            item.completedCount += 1;
          }
        }
      }
    });

    // Map invoices
    invoices.forEach((inv) => {
      const d = new Date(inv.issuedAt || inv.paidAt || Date.now());
      if (!isNaN(d.getTime())) {
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const item = resultMap.get(key);
        if (item) {
          const amt = inv.amount || (inv.serviceCharges + inv.partsCost + (inv.tax || 0));
          if (inv.status === 'PAID') {
            item.revenue += amt;
          } else {
            item.pendingRevenue += amt;
          }
        }
      }
    });

    return result;
  }, [bookings, invoices, timeRange]);

  const totalRevenuePeriod = monthlyData.reduce((sum, m) => sum + m.revenue, 0);
  const totalBookingsPeriod = monthlyData.reduce((sum, m) => sum + m.bookingsCount, 0);
  const avgRevenuePerBooking = totalBookingsPeriod > 0 ? Math.round(totalRevenuePeriod / totalBookingsPeriod) : 0;

  // Compute status distribution for Pie Chart
  const statusDistribution = useMemo(() => {
    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    bookings.forEach((b) => {
      if (b.status === 'PENDING' || b.status === 'APPROVED') {
        pendingCount++;
      } else if (b.status === 'ASSIGNED' || b.status === 'REPAIRING') {
        inProgressCount++;
      } else if (b.status === 'COMPLETED') {
        completedCount++;
      } else if (b.status === 'CANCELLED') {
        cancelledCount++;
      }
    });

    const total = bookings.length;

    return [
      {
        name: 'Pending',
        value: pendingCount,
        color: '#f59e0b',
        badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        percent: total ? Math.round((pendingCount / total) * 100) : 0
      },
      {
        name: 'In Progress',
        value: inProgressCount,
        color: '#3b82f6',
        badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        percent: total ? Math.round((inProgressCount / total) * 100) : 0
      },
      {
        name: 'Completed',
        value: completedCount,
        color: '#10b981',
        badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
        percent: total ? Math.round((completedCount / total) * 100) : 0
      },
      {
        name: 'Cancelled',
        value: cancelledCount,
        color: '#ef4444',
        badgeBg: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
        percent: total ? Math.round((cancelledCount / total) * 100) : 0
      }
    ];
  }, [bookings]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 text-white p-3.5 rounded-xl shadow-xl font-sans text-xs space-y-1.5 min-w-[170px]">
          <p className="font-mono text-amber-400 font-bold uppercase border-b border-slate-800 pb-1.5 mb-1 text-[11px] tracking-wide">
            {label} Performance
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={`item-${index}`} className="flex justify-between items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-mono font-bold text-white">
                {entry.name.toLowerCase().includes('revenue')
                  ? `$${entry.value.toLocaleString()}`
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const PieCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-slate-900 border border-slate-700 text-white p-3 rounded-xl shadow-xl font-sans text-xs space-y-1 min-w-[150px]">
          <p className="font-mono text-amber-400 font-bold uppercase border-b border-slate-800 pb-1 mb-1 text-[11px]">
            {data.name} Status
          </p>
          <div className="flex justify-between items-center gap-3">
            <span className="text-slate-300">Bookings:</span>
            <span className="font-mono font-bold text-white">{data.value}</span>
          </div>
          <div className="flex justify-between items-center gap-3">
            <span className="text-slate-300">Distribution:</span>
            <span className="font-mono font-bold text-amber-400">{data.payload.percent}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Mechanic-specific metrics calculation
  const mechanicAssignedBookings = useMemo(() => {
    if (user?.role !== 'MECHANIC') return [];
    return bookings.filter(
      (b) => b.mechanicId === user?.id || b.mechanic?.id === user?.id || (user?.name && b.mechanic?.name === user.name)
    );
  }, [bookings, user]);

  const myBookings = mechanicAssignedBookings.length > 0 ? mechanicAssignedBookings : bookings;

  const mechanicMetrics = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000);

    const activeInBay = myBookings.filter((b) => b.status === 'REPAIRING');
    const assignedPending = myBookings.filter((b) => b.status === 'ASSIGNED');
    const completedAll = myBookings.filter((b) => b.status === 'COMPLETED');

    const completedToday = completedAll.filter((b) => b.updatedAt && b.updatedAt.startsWith(todayStr)).length;
    const completedThisWeek = completedAll.filter((b) => {
      const d = new Date(b.updatedAt || b.createdAt);
      return d >= sevenDaysAgo;
    }).length;

    const assignedThisWeek = myBookings.filter((b) => {
      const d = new Date(b.createdAt);
      return d >= sevenDaysAgo;
    }).length;

    const ratings = myBookings
      .map((b) => b.feedback?.rating)
      .filter((r): r is number => typeof r === 'number' && r > 0);

    const avgRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
      : '5.0';

    return {
      activeInBayCount: activeInBay.length,
      assignedPendingCount: assignedPending.length,
      completedToday,
      completedThisWeek,
      assignedThisWeek,
      totalCompleted: completedAll.length,
      avgRating,
      reviewCount: ratings.length,
      activeInBayBookings: activeInBay,
      assignedBookings: myBookings.filter((b) => b.status === 'ASSIGNED' || b.status === 'REPAIRING')
    };
  }, [myBookings]);

  const filteredBookings = bookings.filter((b) => {
    const matchesFilter = queueFilter === 'ALL' || b.status === queueFilter;
    const matchesSearch =
      !searchTerm ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehicle?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.vehicle?.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-amber-500/10 text-amber-700 border border-amber-300/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <Clock className="w-3 h-3 text-amber-600 shrink-0" />
            <span>PENDING</span>
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-sky-500/10 text-sky-700 border border-sky-300/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
            <CheckCircle2 className="w-3 h-3 text-sky-600 shrink-0" />
            <span>APPROVED</span>
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-300/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
            <UserCheck className="w-3 h-3 text-indigo-600 shrink-0" />
            <span>ASSIGNED</span>
          </span>
        );
      case 'REPAIRING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-blue-500/15 text-blue-800 border border-blue-400/80 shadow-2xs animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
            <Wrench className="w-3 h-3 text-blue-600 shrink-0" />
            <span>IN PROGRESS</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-300/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
            <span>COMPLETED</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-rose-500/10 text-rose-700 border border-rose-300/80 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <XCircle className="w-3 h-3 text-rose-600 shrink-0" />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
            <span>{status}</span>
          </span>
        );
    }
  };

  if (user?.role === 'MECHANIC') {
    return (
      <div className="space-y-8">
        {/* Mechanic Header */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.15),transparent_50%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-semibold mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span>MECHANIC BAY TELEMETRY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Oswald'] uppercase">
                Welcome back, {user.name}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Technician Station • Service Bay Metrics & Active Job Workorders
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono text-xs font-bold uppercase">
                Senior Technician
              </span>
            </div>
          </div>
        </div>

        {/* Mechanic KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. Active Jobs in Bay */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Active Repairs (In Bay)</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black font-mono text-slate-900">{mechanicMetrics.activeInBayCount}</p>
            <p className="text-[11px] font-mono text-blue-600 font-semibold flex items-center gap-1">
              <span>Status: REPAIRING</span>
            </p>
          </div>

          {/* 2. Assigned Jobs This Week */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Jobs Assigned This Week</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black font-mono text-slate-900">{mechanicMetrics.assignedThisWeek}</p>
            <p className="text-[11px] font-mono text-slate-500">
              {mechanicMetrics.assignedPendingCount} pending start
            </p>
          </div>

          {/* 3. Completed This Week */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Completed Jobs</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-3xl font-black font-mono text-slate-900">{mechanicMetrics.completedThisWeek}</p>
            <p className="text-[11px] font-mono text-emerald-600 font-semibold">
              {mechanicMetrics.completedToday} completed today ({mechanicMetrics.totalCompleted} total)
            </p>
          </div>

          {/* 4. Average Rating */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold text-slate-500 uppercase">Customer Satisfaction</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-black font-mono text-slate-900">{mechanicMetrics.avgRating}</p>
              <span className="text-amber-500 font-bold text-sm">★</span>
            </div>
            <p className="text-[11px] font-mono text-slate-500">
              Based on {mechanicMetrics.reviewCount} customer reviews
            </p>
          </div>
        </div>

        {/* Active Jobs Mid-Repair Highlight */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Oswald'] uppercase flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-500" />
                <span>Currently Active Job(s) In Bay</span>
              </h3>
              <p className="text-xs text-slate-500">Vehicles currently in REPAIRING status assigned to you</p>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-mono font-bold">
              {mechanicMetrics.activeInBayBookings.length} Active
            </span>
          </div>

          {mechanicMetrics.activeInBayBookings.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs font-mono bg-slate-50 rounded-xl border border-slate-100">
              No active jobs currently in REPAIRING status. Select a job from Assigned Tasks to start service.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mechanicMetrics.activeInBayBookings.map((b) => (
                <div key={b.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 font-mono">{b.serviceType}</p>
                      <p className="text-[11px] text-slate-500 font-mono">Order ID: #{b.id}</p>
                    </div>
                    {getStatusBadge(b.status)}
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                    <p className="font-bold text-slate-800">{b.vehicle?.brand} {b.vehicle?.model} ({b.vehicle?.year})</p>
                    <p className="text-[11px] font-mono text-slate-500">REG: {b.vehicle?.registrationNumber} • Mileage: {(b.vehicle?.mileage ?? 45000).toLocaleString()} mi</p>
                    <p className="text-[11px] text-slate-600">Customer: {b.customer?.name} ({b.customer?.phone || 'N/A'})</p>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-[10px] font-mono text-slate-500">Scheduled: {b.preferredDate}</span>
                    <button
                      onClick={() => onSelectBooking(b)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg font-['Oswald'] uppercase tracking-wider transition-all cursor-pointer"
                    >
                      View & Manage Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned Tasks Queue Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-['Oswald'] uppercase">Assigned Workorders Queue</h3>
              <p className="text-xs text-slate-500">All work orders assigned for inspection and repair</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-mono uppercase text-slate-400 bg-slate-50">
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Service Type</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {myBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-mono font-bold text-amber-800">#{b.id}</td>
                    <td className="p-3 font-semibold text-slate-800">
                      {b.vehicle?.brand} {b.vehicle?.model}
                      <span className="block text-[10px] font-mono text-slate-500">{b.vehicle?.registrationNumber}</span>
                    </td>
                    <td className="p-3">{b.serviceType}</td>
                    <td className="p-3">{b.customer?.name}</td>
                    <td className="p-3">{getStatusBadge(b.status)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onSelectBooking(b)}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg font-['Oswald'] uppercase cursor-pointer"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header Banner (STAYS DARK AS DESIGNED) */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.15),transparent_50%)] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-mono font-semibold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>TELEMETRY COMMAND CENTER</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-['Oswald'] uppercase">
              Dashboard Overview
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Live fleet maintenance queue, real-time diagnostic status, and operational metrics.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            {onNavigateToServiceCenters && (
              <button
                type="button"
                id="btn-find-nearby-service-center"
                onClick={onNavigateToServiceCenters}
                className="bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-900/30 font-['Oswald'] uppercase tracking-wider shrink-0 active:scale-98"
              >
                <MapPin className="w-4 h-4 text-white" />
                <span>Find Nearby Service Center</span>
              </button>
            )}
            <button
              onClick={onOpenNewService}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 font-['Oswald'] uppercase tracking-wider shrink-0 active:scale-98"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>New Service Request</span>
            </button>
          </div>
        </div>
      </div>

      {/* Visual Maintenance Alert Notification Banner */}
      {totalAlertsCount > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3.5">
            <div className="relative p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-slate-950 animate-ping" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-rose-500 text-white font-mono font-bold text-[10px] tracking-wider uppercase shadow-xs">
                  MAINTENANCE ALERT BADGE
                </span>
                <span className="text-xs font-mono text-amber-400 font-semibold">
                  {overdueAlerts.length > 0 && `${overdueAlerts.length} OVERDUE`}
                  {overdueAlerts.length > 0 && dueSoonAlerts.length > 0 && ' • '}
                  {dueSoonAlerts.length > 0 && `${dueSoonAlerts.length} DUE SOON`}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 font-['Oswald'] tracking-wide">
                {totalAlertsCount} {totalAlertsCount === 1 ? 'Vehicle Needs' : 'Vehicles Need'} Scheduled Maintenance
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Interval limits reached by mileage odometer or calendar service schedule.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const alertEl = document.getElementById('maintenance-alerts-section');
              if (alertEl) {
                alertEl.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 shrink-0 uppercase tracking-wider font-['Oswald'] cursor-pointer"
          >
            <span>Inspect Alerts ({totalAlertsCount})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Metric Cards (LIGHT BACKGROUND BELOW HERO BANNER) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Active Bookings</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-1.5 font-mono tracking-tight">{activeBookingsCount}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 font-mono flex items-center gap-1">
            <Activity className="w-3 h-3 text-amber-600" /> Pending & in-service queue
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Vehicles in Bay</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-1.5 font-mono tracking-tight">{vehiclesInServiceCount}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 font-mono flex items-center gap-1">
            <Cpu className="w-3 h-3 text-sky-600" /> Active mechanics assigned
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Maintenance Alerts</p>
              <div className="flex items-baseline gap-2 mt-1.5">
                <h3 className="text-3xl font-bold text-rose-600 font-mono tracking-tight">{totalAlertsCount}</h3>
                {overdueAlerts.length > 0 && (
                  <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                    {overdueAlerts.length} Overdue
                  </span>
                )}
              </div>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600 border border-rose-200 relative">
              <AlertTriangle className="w-5 h-5" />
              {totalAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 font-mono flex items-center gap-1">
            <Gauge className="w-3 h-3 text-rose-600" /> Based on mileage & intervals
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Fleet Registered</p>
              <h3 className="text-3xl font-bold text-amber-600 mt-1.5 font-mono tracking-tight">{vehicles.length}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600 border border-emerald-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 font-mono flex items-center gap-1">
            <Activity className="w-3 h-3 text-emerald-600" /> Telemetry enabled
          </p>
        </div>
      </div>

      {/* Data Visualization Section - Recharts Monthly Trend & Pie Chart Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Monthly Trend Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono font-bold mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                <span>PERFORMANCE ANALYTICS</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-['Oswald'] uppercase tracking-tight flex items-center gap-2">
                Service Bookings & Revenue Trend
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Monthly overview tracking service volume alongside generated revenue
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* View Metric Mode Toggle */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setChartMetricView('ALL')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartMetricView === 'ALL'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Both
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetricView('REVENUE')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartMetricView === 'REVENUE'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Revenue
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetricView('BOOKINGS')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    chartMetricView === 'BOOKINGS'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bookings
                </button>
              </div>

              {/* Time Range Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono font-bold">
                <button
                  type="button"
                  onClick={() => setTimeRange('6M')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timeRange === '6M'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  6 Months
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange('12M')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timeRange === '12M'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  12 Months
                </button>
              </div>
            </div>
          </div>

          {/* Analytics Highlights Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase font-bold text-slate-500">Period Paid Revenue</p>
                <p className="text-lg font-mono font-bold text-slate-900">${totalRevenuePeriod.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-600 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase font-bold text-slate-500">Total Service Volume</p>
                <p className="text-lg font-mono font-bold text-slate-900">{totalBookingsPeriod} Service Requests</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-mono uppercase font-bold text-slate-500">Avg. Revenue / Booking</p>
                <p className="text-lg font-mono font-bold text-slate-900">${avgRevenuePerBooking.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Recharts Chart Container */}
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.85} />
                    <stop offset="95%" stopColor="#d97706" stopOpacity={0.25} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'monospace' }}
                />
                {(chartMetricView === 'ALL' || chartMetricView === 'REVENUE') && (
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#d97706', fontSize: 11, fontFamily: 'monospace' }}
                    tickFormatter={(val) => `$${val}`}
                  />
                )}
                {(chartMetricView === 'ALL' || chartMetricView === 'BOOKINGS') && (
                  <YAxis
                    yAxisId="right"
                    orientation={chartMetricView === 'BOOKINGS' ? 'left' : 'right'}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#0284c7', fontSize: 11, fontFamily: 'monospace' }}
                    allowDecimals={false}
                  />
                )}
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontFamily: 'monospace' }}
                />

                {(chartMetricView === 'ALL' || chartMetricView === 'REVENUE') && (
                  <Bar
                    yAxisId="left"
                    dataKey="revenue"
                    name="Paid Revenue ($)"
                    fill="url(#colorRevenue)"
                    radius={[6, 6, 0, 0]}
                    barSize={28}
                  />
                )}

                {(chartMetricView === 'ALL' || chartMetricView === 'BOOKINGS') && (
                  <Line
                    yAxisId={chartMetricView === 'BOOKINGS' ? 'right' : 'right'}
                    type="monotone"
                    dataKey="bookingsCount"
                    name="Service Bookings"
                    stroke="#0284c7"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#0284c7', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#0284c7', strokeWidth: 2, stroke: '#ffffff' }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recharts Booking Status Distribution Pie Chart Card */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono font-bold mb-1">
              <PieChartIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>STATUS DISTRIBUTION</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-['Oswald'] uppercase tracking-tight">
              Booking Statuses
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live breakdown across pending, in progress, completed & cancelled
            </p>
          </div>

          <div className="h-52 w-full relative my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<PieCustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center metric label inside Donut Pie */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-mono font-bold text-slate-900">{bookings.length}</span>
              <span className="text-[10px] font-mono font-bold uppercase text-slate-400">Total</span>
            </div>
          </div>

          {/* Breakdown Legend Badges */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            {statusDistribution.map((item) => (
              <div
                key={item.name}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs font-mono font-bold ${item.badgeBg}`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-slate-800">{item.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-slate-900 font-extrabold">{item.value}</span>
                  <span className="text-[10px] text-slate-500 ml-1">({item.percent}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Predictive Maintenance Date Estimator Widget */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>PREDICTIVE MAINTENANCE ESTIMATOR</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-['Oswald'] uppercase tracking-wide mt-1">
              Estimated Next Service Dates
            </h3>
            <p className="text-xs text-slate-500">
              Projects upcoming maintenance dates based on current vehicle odometer readings and average monthly driving mileage.
            </p>
          </div>

          {/* Preset Usage Selector */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-mono font-bold">
              <span className="text-[10px] text-slate-500 uppercase px-2 font-bold">Fleet Benchmark:</span>
              {[1000, 1500, 2500, 3500].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setGlobalUsageRate(rate)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    globalUsageRate === rate
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {rate.toLocaleString()} mi/mo
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Metric Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase font-bold text-slate-500">Soonest Service Due</p>
              <p className="text-sm font-mono font-bold text-slate-900">
                {predictiveMaintenanceEstimates.length > 0
                  ? [...predictiveMaintenanceEstimates].sort((a, b) => a.daysRemaining - b.daysRemaining)[0]?.formattedDate
                  : 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/10 border border-sky-500/20 text-sky-600 rounded-lg">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase font-bold text-slate-500">Benchmark Monthly Usage</p>
              <p className="text-sm font-mono font-bold text-slate-900">{globalUsageRate.toLocaleString()} miles / month</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase font-bold text-slate-500">Avg Fleet Days to Service</p>
              <p className="text-sm font-mono font-bold text-slate-900">
                {predictiveMaintenanceEstimates.length > 0
                  ? Math.round(
                      predictiveMaintenanceEstimates.reduce((sum, item) => sum + item.daysRemaining, 0) /
                        predictiveMaintenanceEstimates.length
                    )
                  : 0}{' '}
                Days
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle Predictive Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predictiveMaintenanceEstimates.map(({ vehicle, currentMileage, targetMileage, monthlyRate, daysRemaining, formattedDate, urgencyLevel }) => {
            const VehicleTypeIcon = vehicle.vehicleType === 'TRUCK' ? Truck : vehicle.vehicleType === 'BUS' ? Bus : Car;

            return (
              <div
                key={vehicle.id}
                className="bg-slate-50/70 border border-slate-200/90 rounded-2xl p-4 space-y-3 shadow-2xs hover:border-amber-400 transition-all flex flex-col justify-between"
              >
                {/* Card Top: Reg Number & Brand */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-200/80 text-slate-700 shrink-0">
                      <VehicleTypeIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold font-mono text-slate-900 bg-slate-200 px-1.5 py-0.5 rounded uppercase">
                        {vehicle.registrationNumber}
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 mt-1 font-['Oswald']">
                        {vehicle.brand} {vehicle.model} ({vehicle.year})
                      </h4>
                    </div>
                  </div>

                  {/* Urgency Badge */}
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                      urgencyLevel === 'OVERDUE'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : urgencyLevel === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                        : urgencyLevel === 'DUE_SOON'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    }`}
                  >
                    {urgencyLevel === 'OVERDUE'
                      ? 'OVERDUE'
                      : urgencyLevel === 'CRITICAL'
                      ? `Due ${daysRemaining} days`
                      : urgencyLevel === 'DUE_SOON'
                      ? `Due ${daysRemaining} days`
                      : `~${daysRemaining} days left`}
                  </span>
                </div>

                {/* Mileage Gauge Bar & Monthly Rate Input */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2 font-mono">
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span className="flex items-center gap-1 font-bold text-slate-600">
                      <Calculator className="w-3.5 h-3.5 text-amber-600" /> Avg Monthly Usage:
                    </span>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={monthlyRate}
                        onChange={(e) => {
                          const val = Math.max(100, parseInt(e.target.value) || 1000);
                          setCustomMonthlyMileageMap((prev) => ({ ...prev, [vehicle.id]: val }));
                        }}
                        className="w-20 bg-slate-100 border border-slate-300 rounded px-1.5 py-0.5 text-xs text-right font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                      <span className="text-[10px] text-slate-400">mi/mo</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        urgencyLevel === 'OVERDUE' || urgencyLevel === 'CRITICAL'
                          ? 'bg-rose-500'
                          : urgencyLevel === 'DUE_SOON'
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.round((currentMileage / targetMileage) * 100))}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span>Odometer: <strong className="text-slate-800">{currentMileage.toLocaleString()} mi</strong></span>
                    <span>Target: <strong className="text-slate-800">{targetMileage.toLocaleString()} mi</strong></span>
                  </div>
                </div>

                {/* Footer: Estimated Date & Action */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Estimated Next Service</span>
                    <span className="text-xs font-bold font-mono text-amber-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      {formattedDate}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onBookServiceForVehicle) {
                        onBookServiceForVehicle(vehicle);
                      } else {
                        onOpenNewService();
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl transition-all flex items-center gap-1 font-['Oswald'] uppercase tracking-wider cursor-pointer shadow-xs active:scale-95"
                  >
                    <Wrench className="w-3.5 h-3.5 text-amber-400" />
                    <span>Book Service</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scheduled Maintenance Alerts Widget Section */}
      <div id="maintenance-alerts-section" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-mono font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
              <span>VEHICLE MAINTENANCE TELEMETRY</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 font-['Oswald'] uppercase tracking-wide mt-1">
              Scheduled Maintenance Alerts
            </h3>
            <p className="text-xs text-slate-500">
              Visual notification triggers based on mileage interval benchmarks and calendar service schedules.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-mono font-semibold text-slate-600 flex-wrap">
            <button
              onClick={() => setMaintenanceFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                maintenanceFilter === 'ALL' ? 'bg-white text-slate-950 shadow-xs font-bold' : 'hover:text-slate-900'
              }`}
            >
              All Fleet ({vehicleMaintenanceAlerts.length})
            </button>
            <button
              onClick={() => setMaintenanceFilter('OVERDUE')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                maintenanceFilter === 'OVERDUE' ? 'bg-rose-600 text-white shadow-xs font-bold' : 'hover:text-rose-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-300"></span>
              Overdue ({overdueAlerts.length})
            </button>
            <button
              onClick={() => setMaintenanceFilter('DUE_SOON')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                maintenanceFilter === 'DUE_SOON' ? 'bg-amber-500 text-slate-950 shadow-xs font-bold' : 'hover:text-amber-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-slate-950"></span>
              Due Soon ({dueSoonAlerts.length})
            </button>
            <button
              onClick={() => setMaintenanceFilter('UP_TO_DATE')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                maintenanceFilter === 'UP_TO_DATE' ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'hover:text-emerald-600'
              }`}
            >
              Up-to-Date ({vehicleMaintenanceAlerts.filter((a) => a.alertType === 'OK').length})
            </button>
          </div>
        </div>

        {/* Maintenance Alert Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {filteredMaintenanceAlerts.length === 0 ? (
            <div className="col-span-full py-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No vehicles match this filter criteria.</p>
              <p className="text-xs text-slate-400">All registered fleet vehicles are within scheduled maintenance limits.</p>
            </div>
          ) : (
            filteredMaintenanceAlerts.map(({ vehicle, alertType, currentMileage, targetMileage, kmRemaining, urgencyText, badgeStyle, pillBg, progressPercent }) => {
              const VehicleTypeIcon = vehicle.vehicleType === 'TRUCK' ? Truck : vehicle.vehicleType === 'BUS' ? Bus : Car;

              return (
                <div
                  key={vehicle.id}
                  className={`border rounded-2xl p-5 transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md ${
                    alertType === 'OVERDUE'
                      ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
                      : alertType === 'DUE_SOON'
                      ? 'bg-amber-50/30 border-amber-200 hover:border-amber-400'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Card Header: Plate & Status Pill */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl border ${badgeStyle} shrink-0`}>
                        <VehicleTypeIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 font-mono tracking-wide uppercase bg-slate-200/80 px-2 py-0.5 rounded-md">
                            {vehicle.registrationNumber}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                            {vehicle.vehicleType || 'CAR'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 mt-1 font-['Oswald'] tracking-wide">
                          {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </h4>
                      </div>
                    </div>

                    {/* Notification Badge Pill */}
                    <div className="shrink-0">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-white shadow-xs ${pillBg}`}>
                        {alertType === 'OVERDUE' && <AlertTriangle className="w-3.5 h-3.5 text-white animate-bounce" />}
                        {alertType === 'DUE_SOON' && <Clock className="w-3.5 h-3.5 text-slate-950" />}
                        {alertType === 'OK' && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        <span>{urgencyText}</span>
                      </span>
                    </div>
                  </div>

                  {/* Mileage Odometer Gauge Progress Bar */}
                  <div className="space-y-1.5 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className="text-slate-500 font-bold flex items-center gap-1">
                        <Gauge className="w-3.5 h-3.5 text-slate-400" />
                        Current: <strong className="text-slate-900">{currentMileage.toLocaleString()} mi</strong>
                      </span>
                      <span className="text-slate-500 font-bold">
                        Service Limit: <strong className="text-slate-900">{targetMileage.toLocaleString()} mi</strong>
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          alertType === 'OVERDUE'
                            ? 'bg-rose-600'
                            : alertType === 'DUE_SOON'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, progressPercent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-mono text-slate-500 pt-0.5">
                      <span>
                        {alertType === 'OVERDUE' ? (
                          <span className="text-rose-600 font-bold">Exceeded limit by {Math.abs(kmRemaining).toLocaleString()} mi</span>
                        ) : alertType === 'DUE_SOON' ? (
                          <span className="text-amber-700 font-bold">{kmRemaining.toLocaleString()} mi remaining</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">{kmRemaining.toLocaleString()} mi until next service</span>
                        )}
                      </span>
                      {vehicle.nextServiceDueDate && (
                        <span className="flex items-center gap-1 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Due: <strong className="text-slate-900">{vehicle.nextServiceDueDate}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Footer Action Button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Last Service: {vehicle.lastServiceDate || 'N/A'}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (onBookServiceForVehicle) {
                          onBookServiceForVehicle(vehicle);
                        } else {
                          onOpenNewService();
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs font-['Oswald'] uppercase tracking-wider cursor-pointer active:scale-98 ${
                        alertType === 'OVERDUE'
                          ? 'bg-rose-600 hover:bg-rose-500 text-white'
                          : alertType === 'DUE_SOON'
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Schedule Service</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Service Queue Table Card (LIGHT BACKGROUND) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-900 font-['Oswald'] uppercase tracking-tight flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-600" />
              Service Queue & Telemetry
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live service requests and repair tracking for all vehicles
            </p>
          </div>

          {/* Queue Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {['ALL', 'PENDING', 'APPROVED', 'ASSIGNED', 'REPAIRING', 'COMPLETED'].map((filter) => (
              <button
                key={filter}
                onClick={() => setQueueFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  queueFilter === filter
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-mono text-[10px] uppercase tracking-wider">
                <th className="py-3.5 px-6">Booking ID</th>
                <th className="py-3.5 px-6">Vehicle</th>
                <th className="py-3.5 px-6">Service Type</th>
                <th className="py-3.5 px-6">Customer / Mechanic</th>
                <th className="py-3.5 px-6">Date</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans text-slate-800">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No matching service requests found.</p>
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-amber-600">{b.id}</td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">
                        {b.vehicle?.brand} {b.vehicle?.model}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {b.vehicle?.registrationNumber || 'N/A'}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-medium">{b.serviceType}</td>
                    <td className="py-4 px-6">
                      <div className="text-slate-900 font-medium">{b.customer?.name || 'Customer'}</div>
                      <div className="text-[11px] text-amber-700 font-mono">
                        {b.assignedMechanicName ? `Mech: ${b.assignedMechanicName}` : b.mechanic ? `Mech: ${b.mechanic.name}` : 'Unassigned'}
                      </div>
                    </td>
                    <td className="py-4 px-6 font-mono text-slate-600">{b.preferredDate}</td>
                    <td className="py-4 px-6">{getStatusBadge(b.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onSelectBooking(b)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:text-amber-600 hover:border-amber-400 text-xs font-semibold transition-all shadow-xs"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-600" />
                        <span>Inspect</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nearby Recommended Service Centers Section */}
      {recommendedCenters.length > 0 && (
        <div id="nearby-service-centers-section" className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-bold">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>AI-RANKED GARAGE RECOMMENDATIONS</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 font-['Oswald'] uppercase tracking-wide mt-1">
                Nearby Recommended Service Centers
              </h3>
              <p className="text-xs text-slate-500">
                Top rated workshops ranked by 40% rating, 30% distance, 20% volume & 10% experience.
              </p>
            </div>

            {onNavigateToServiceCenters && (
              <button
                type="button"
                onClick={onNavigateToServiceCenters}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold font-['Oswald'] uppercase tracking-wider transition-all shadow-sm"
              >
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Open Full Map View</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recommendedCenters.map((center) => (
              <div
                key={center.id}
                className="bg-slate-50/80 border border-slate-200 hover:border-amber-400 rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 font-['Oswald'] uppercase tracking-wide">
                        {center.name}
                      </h4>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{center.address}, {center.city}</span>
                      </p>
                    </div>
                    {center.isBestChoice && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-slate-950 shadow-xs shrink-0">
                        ★ BEST
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 my-3 text-xs font-mono">
                    <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Distance</div>
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <Navigation className="w-3 h-3 text-blue-500" />
                        <span>{center.distanceText || (center.distanceKm ? `${center.distanceKm.toFixed(1)} km` : 'Near')}</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Rating</div>
                      <div className="font-bold text-slate-800 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                        <span>{center.averageRating.toFixed(1)} / 5</span>
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Repairs</div>
                      <div className="font-bold text-slate-800">{center.totalServicesCompleted}+ Done</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Experience</div>
                      <div className="font-bold text-slate-800">{center.experienceYears}y Techs</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {center.workingStatus || 'Available Now'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-amber-600">
                      {center.recommendationScore}% Match
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={() => setSelectedDetailCenter(center)}
                    className="flex-1 py-2 px-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all text-center"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingModalCenter(center)}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all text-center shadow-xs"
                  >
                    Book Now
                  </button>
                  {onNavigateToServiceCenters && (
                    <button
                      type="button"
                      title="Get Directions on Map"
                      onClick={onNavigateToServiceCenters}
                      className="p-2 rounded-xl border border-slate-300 bg-white hover:text-blue-600 text-slate-600 text-xs font-bold transition-all"
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Details & Booking Modals */}
      <ServiceCenterDetails
        center={selectedDetailCenter}
        isOpen={Boolean(selectedDetailCenter)}
        onClose={() => setSelectedDetailCenter(null)}
        onBookNow={(c) => {
          setSelectedDetailCenter(null);
          setBookingModalCenter(c);
        }}
      />

      <BookServiceAtCenterModal
        center={bookingModalCenter}
        isOpen={Boolean(bookingModalCenter)}
        onClose={() => setBookingModalCenter(null)}
        onSuccess={() => {
          setBookingModalCenter(null);
          onOpenNewService();
        }}
      />
    </div>
  );
};
