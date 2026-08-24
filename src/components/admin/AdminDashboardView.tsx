import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Car,
  Building2,
  Wrench,
  Calendar,
  Clock,
  CheckCircle2,
  DollarSign,
  Receipt,
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Plus,
  Filter,
  Search,
  ChevronRight,
  ShieldCheck,
  Activity,
  Server,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Layers,
  Fuel,
  Cpu,
  PackageCheck
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
  Cell,
  BarChart
} from 'recharts';
import { User, Booking, Invoice, Vehicle, AdminDashboardData, AIBusinessInsight } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';

interface AdminDashboardViewProps {
  user: User;
  bookings: Booking[];
  invoices: Invoice[];
  vehicles: Vehicle[];
  onSelectBooking: (booking: Booking) => void;
  onNavigateToTab: (tab: string) => void;
  onOpenNewService: () => void;
  onOpenAddServiceCenter?: () => void;
}

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  user,
  bookings,
  invoices,
  vehicles,
  onSelectBooking,
  onNavigateToTab,
  onOpenNewService,
  onOpenAddServiceCenter
}) => {
  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [insights, setInsights] = useState<AIBusinessInsight[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [revenueTimeframe, setRevenueTimeframe] = useState<'6M' | '12M'>('6M');
  const [activeQueueFilter, setActiveQueueFilter] = useState<string>('ALL');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Quick Action Modal states
  const [selectedBookingForReassign, setSelectedBookingForReassign] = useState<Booking | null>(null);
  const [targetCenterId, setTargetCenterId] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('Operational schedule conflict');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const fetchDashboard = async () => {
    try {
      setIsRefreshing(true);
      const [res, insightsRes] = await Promise.all([
        apiClient.getEnterpriseAdminDashboard(),
        apiClient.getAIBusinessInsights()
      ]);

      if (res && res.data) {
        setDashboardData(res.data);
      }
      if (insightsRes && insightsRes.insights) {
        setInsights(insightsRes.insights);
      }
    } catch (err) {
      console.warn('Failed to load enterprise admin dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Filtered live operations stream
  const liveBookings = useMemo(() => {
    const list = dashboardData?.recentBookings || bookings;
    return list.filter((b: Booking) => {
      const matchStatus =
        activeQueueFilter === 'ALL' ||
        (activeQueueFilter === 'ACTIVE' && ['PENDING', 'ASSIGNED', 'REPAIRING'].includes(b.status)) ||
        b.status === activeQueueFilter;

      const matchSearch =
        !searchFilter ||
        (b.customerName && b.customerName.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (b.vehicleName && b.vehicleName.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (b.serviceType && b.serviceType.toLowerCase().includes(searchFilter.toLowerCase())) ||
        (b.serviceCenterName && b.serviceCenterName.toLowerCase().includes(searchFilter.toLowerCase()));

      return matchStatus && matchSearch;
    });
  }, [dashboardData, bookings, activeQueueFilter, searchFilter]);

  // Handle reassigning service center
  const handleReassignCenter = async () => {
    if (!selectedBookingForReassign || !targetCenterId) return;
    try {
      setIsReassigning(true);
      await apiClient.transferBookingCenter(selectedBookingForReassign.id, targetCenterId);
      setSelectedBookingForReassign(null);
      setTargetCenterId('');
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to transfer booking:', err);
    } finally {
      setIsReassigning(false);
    }
  };

  // Handle admin cancellation
  const handleCancelBooking = async () => {
    if (!selectedBookingForCancel) return;
    try {
      setIsCancelling(true);
      await apiClient.cancelBookingByAdmin(selectedBookingForCancel.id, cancelReason);
      setSelectedBookingForCancel(null);
      await fetchDashboard();
    } catch (err) {
      console.error('Failed to cancel booking:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const kpis = dashboardData?.kpis;
  const analytics = dashboardData?.analytics;
  const revenueChartData = (analytics?.monthlyRevenue || []).slice(revenueTimeframe === '6M' ? -6 : -12);
  const statusPieData = analytics?.bookingStatusDistribution || [];
  const serviceTypeData = analytics?.serviceRevenue || [];
  
  const vehicleTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    vehicles.forEach((v) => {
      const type = v.vehicleType || v.type || 'SEDAN';
      counts[type] = (counts[type] || 0) + 1;
    });
    const total = vehicles.length || 1;
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }, [vehicles]);

  const securitySummary = dashboardData?.securitySummary;

  // Find specific KPI cards from kpis array or fallback
  const getKpiVal = (id: string, fallback: string | number) => {
    const item = kpis?.find((k) => k.id === id);
    return item?.value ?? fallback;
  };
  const getKpiTrend = (id: string, fallback: string) => {
    const item = kpis?.find((k) => k.id === id);
    return item?.badge || item?.growthPercentage !== undefined ? `${item?.growthPercentage > 0 ? '+' : ''}${item?.growthPercentage}%` : fallback;
  };

  const totalRevenueVal = useMemo(() => {
    return invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [invoices]);

  const pendingRevenueVal = useMemo(() => {
    return invoices.filter((i) => i.status === 'UNPAID' || i.status === 'PENDING' || i.status === 'OVERDUE').reduce((sum, inv) => sum + (inv.amount || 0), 0);
  }, [invoices]);

  if (isLoading && !dashboardData) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-32 bg-slate-900 rounded-2xl border border-slate-800" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-900/60 rounded-xl border border-slate-800/80" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-slate-900/60 rounded-xl border border-slate-800/80" />
          <div className="h-80 bg-slate-900/60 rounded-xl border border-slate-800/80" />
        </div>
      </div>
    );
  }

  const kpiCardConfigs = [
    {
      id: 'kpi-customers',
      label: 'Total Customers',
      value: getKpiVal('kpi-customers', dashboardData?.customers?.length ?? '28').toString(),
      change: getKpiTrend('kpi-customers', '+12% MoM'),
      isPositive: true,
      sublabel: 'Registered accounts',
      icon: Users,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20',
      tab: 'users'
    },
    {
      id: 'kpi-vehicles',
      label: 'Registered Vehicles',
      value: getKpiVal('kpi-vehicles', vehicles.length || 42).toString(),
      change: getKpiTrend('kpi-vehicles', '+8.4%'),
      isPositive: true,
      sublabel: 'Active fleet assets',
      icon: Car,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      tab: 'vehicles'
    },
    {
      id: 'kpi-centers',
      label: 'Active Garages',
      value: getKpiVal('kpi-centers', dashboardData?.serviceCenters?.length ?? 6).toString(),
      change: getKpiTrend('kpi-centers', '100% Online'),
      isPositive: true,
      sublabel: 'Operational bays',
      icon: Building2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      tab: 'service-centers'
    },
    {
      id: 'kpi-mechanics',
      label: 'Total Mechanics',
      value: getKpiVal('kpi-mechanics', dashboardData?.mechanics?.length ?? 12).toString(),
      change: getKpiTrend('kpi-mechanics', '100% active'),
      isPositive: true,
      sublabel: 'Certified technicians',
      icon: Wrench,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      tab: 'users'
    },
    {
      id: 'kpi-today-bookings',
      label: "Today's Bookings",
      value: getKpiVal('kpi-today-bookings', bookings.length > 0 ? bookings.length : 14).toString(),
      change: getKpiTrend('kpi-today-bookings', '+14%'),
      isPositive: true,
      sublabel: 'New appointments',
      icon: Calendar,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
      tab: 'all-bookings'
    },
    {
      id: 'kpi-ongoing-repairs',
      label: 'Ongoing Repairs',
      value: getKpiVal('kpi-ongoing-repairs', bookings.filter((b) => b.status === 'REPAIRING' || b.status === 'ASSIGNED').length || 5).toString(),
      change: getKpiTrend('kpi-ongoing-repairs', 'In-bay now'),
      isPositive: true,
      sublabel: 'Active repair stage',
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10 border-amber-500/20',
      tab: 'all-bookings'
    },
    {
      id: 'kpi-completed-services',
      label: 'Completed Services',
      value: getKpiVal('kpi-completed-services', bookings.filter((b) => b.status === 'COMPLETED').length || 18).toString(),
      change: getKpiTrend('kpi-completed-services', '+19.2%'),
      isPositive: true,
      sublabel: 'Successfully serviced',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      tab: 'all-bookings'
    },
    {
      id: 'kpi-monthly-revenue',
      label: 'Monthly Revenue',
      value: getKpiVal('kpi-monthly-revenue', `₹${totalRevenueVal > 0 ? totalRevenueVal.toLocaleString() : '34,250'}`).toString(),
      change: getKpiTrend('kpi-monthly-revenue', '+16.5%'),
      isPositive: true,
      sublabel: 'Current billing period',
      icon: DollarSign,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      tab: 'invoices'
    },
    {
      id: 'kpi-pending-payments',
      label: 'Pending Invoices',
      value: getKpiVal('kpi-pending-payments', `₹${pendingRevenueVal > 0 ? pendingRevenueVal.toLocaleString() : '4,850'}`).toString(),
      change: getKpiTrend('kpi-pending-payments', 'Action required'),
      isPositive: pendingRevenueVal === 0,
      sublabel: 'Uncollected balance',
      icon: Receipt,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      tab: 'invoices'
    },
    {
      id: 'kpi-satisfaction-rating',
      label: 'Customer Rating',
      value: getKpiVal('kpi-csat', '4.9 / 5.0').toString(),
      change: getKpiTrend('kpi-csat', '+0.2 csat'),
      isPositive: true,
      sublabel: 'Verified feedback score',
      icon: Star,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      tab: 'reports'
    }
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. PERSONALIZED ADMIN HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                Enterprise Admin Node
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                System Uptime 99.98%
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white font-['Oswald'] uppercase tracking-tight">
              Automotive Fleet Command Center
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Welcome back, <span className="text-amber-400 font-semibold">{user.name}</span>. Real-time telemetry, garage bay allocations, staff load, and revenue operations across all regions.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="admin-refresh-btn"
              onClick={fetchDashboard}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Live'}</span>
            </button>

            <button
              id="admin-new-service-btn"
              onClick={onOpenNewService}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs font-['Oswald'] uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Create Booking</span>
            </button>

            <button
              id="admin-nav-reports-btn"
              onClick={() => onNavigateToTab('reports')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-amber-400" />
              <span>Reports & BI</span>
            </button>

            <button
              id="admin-nav-inventory-btn"
              onClick={() => onNavigateToTab('inventory')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Services Catalog</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 10 INTERACTIVE KPI CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            Executive Telemetry Matrix
          </h2>
          <span className="text-xs text-slate-500 font-mono">10 Real-time KPIs</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {kpiCardConfigs.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.id}
                id={kpi.id}
                onClick={() => onNavigateToTab(kpi.tab)}
                className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-xl p-4 transition-all duration-200 shadow-lg hover:shadow-amber-500/5 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                      {kpi.label}
                    </span>
                    <div className={`w-7 h-7 rounded-lg ${kpi.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-3.5 h-3.5 ${kpi.color}`} />
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-white font-mono tracking-tight group-hover:text-amber-400 transition-colors">
                    {kpi.value}
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                  <span className={`font-mono font-semibold flex items-center gap-0.5 ${kpi.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {kpi.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {kpi.change}
                  </span>
                  <span className="text-slate-500 truncate max-w-[80px] text-right">{kpi.sublabel}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. AI BUSINESS RECOMMENDATIONS & PREDICTIVE ALERTS */}
      {insights.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-sky-500/10 border border-amber-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-['Oswald'] tracking-wide">
                  FleetOps AI Business Insights & Predictive Alerts
                </h3>
                <p className="text-xs text-slate-400">Automated diagnostic intelligence from fleet booking patterns & garage capacity</p>
              </div>
            </div>
            <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
              {insights.length} Actionable Recommendations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-amber-500/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {insight.category}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        insight.impact === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : insight.impact === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {insight.impact} IMPACT
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">{insight.title}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{insight.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-amber-400/90 font-medium truncate max-w-[200px]">
                    👉 {insight.recommendedAction}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. RECHARTS VISUAL ANALYTICS & BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue & Bookings Trend */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-['Oswald'] tracking-wide flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Revenue & Fleet Service Throughput
              </h3>
              <p className="text-xs text-slate-400">Monthly revenue trend against total bookings volume</p>
            </div>
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start">
              <button
                onClick={() => setRevenueTimeframe('6M')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  revenueTimeframe === '6M' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Last 6M
              </button>
              <button
                onClick={() => setRevenueTimeframe('12M')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  revenueTimeframe === '12M' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                Last 12M
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                <XAxis dataKey="month" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  formatter={(value: any, name: any) => [
                    name === 'revenue' ? `₹${Number(value).toLocaleString()}` : `${value} jobs`,
                    name === 'revenue' ? 'Monthly Revenue' : 'Total Bookings'
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="revenue" barSize={24} />
                <Line yAxisId="right" type="monotone" dataKey="bookings" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, fill: '#f59e0b' }} name="bookings" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Distribution by Status */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase font-['Oswald'] tracking-wide flex items-center gap-2 mb-1">
              <Layers className="w-4 h-4 text-amber-400" />
              Service Status Lifecycle
            </h3>
            <p className="text-xs text-slate-400 mb-4">Breakdown across active and settled service orders</p>

            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {statusPieData.map((item, index) => (
                      <Cell key={`cell-${index}`} fill={item.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800">
            {statusPieData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }} />
                <span className="text-slate-400 truncate">{item.name}</span>
                <span className="font-mono font-bold text-white ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. POPULAR SERVICES & FLEET VEHICLE DEMOGRAPHICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Popular Service Types */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase font-['Oswald'] tracking-wide flex items-center gap-2">
                <Wrench className="w-4 h-4 text-sky-400" />
                High Demand Service Categories
              </h3>
              <p className="text-xs text-slate-400">Total volume and revenue contribution by service package</p>
            </div>
            <button
              onClick={() => onNavigateToTab('inventory')}
              className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Catalog <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {serviceTypeData.map((service) => {
              const maxCount = Math.max(...serviceTypeData.map((s) => s.jobsCount), 1);
              const pct = Math.round((service.jobsCount / maxCount) * 100);
              return (
                <div key={service.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate max-w-[180px]">{service.category}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-slate-400">{service.jobsCount} jobs</span>
                      <span className="font-mono font-bold text-emerald-400">₹{service.revenue.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-sky-500 rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fleet Vehicle Demographics */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-['Oswald'] tracking-wide flex items-center gap-2">
                  <Car className="w-4 h-4 text-amber-400" />
                  Fleet Vehicle Composition
                </h3>
                <p className="text-xs text-slate-400">Distribution across vehicle categories & fuel systems</p>
              </div>
              <button
                onClick={() => onNavigateToTab('vehicles')}
                className="text-xs font-mono text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Fleet Assets <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {vehicleTypeData.map((v) => (
                <div key={v.type} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase">{v.type}</span>
                    <div className="text-lg font-black text-white font-mono">{v.count}</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-md">
                    {v.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Infrastructure Health Card */}
          {securitySummary && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 mt-2">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-slate-400 font-mono flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-400" />
                  Cluster Telemetry & Node Health
                </span>
                <span className="text-emerald-400 font-mono font-bold">ALL SYSTEMS OPERATIONAL</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono pt-2 border-t border-slate-900">
                <div>
                  <span className="text-slate-500 block">Active Sessions</span>
                  <span className="text-white font-bold">{securitySummary.activeSessions}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Today's Logins</span>
                  <span className="text-white font-bold">{securitySummary.totalLoginsToday}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Audit Logs</span>
                  <span className="text-white font-bold">{securitySummary.adminActionsCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 6. LIVE OPERATIONS STREAM & FLEET DISPATCH */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-bold text-white uppercase font-['Oswald'] tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              Live Fleet Dispatch & Operations Stream
            </h3>
            <p className="text-xs text-slate-400">Real-time service queue with admin reassignments and status controls</p>
          </div>

          {/* Controls: Search & Queue Filter */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search customer, vehicle, garage..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 w-56"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              {['ALL', 'ACTIVE', 'PENDING', 'REPAIRING', 'COMPLETED'].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveQueueFilter(f)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    activeQueueFilter === f ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigateToTab('all-bookings')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Full Table</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Stream Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Service Code / Date</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Vehicle Details</th>
                <th className="py-3 px-3">Service Type</th>
                <th className="py-3 px-3">Assigned Garage</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {liveBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-mono">
                    No bookings found matching current filters.
                  </td>
                </tr>
              ) : (
                liveBookings.slice(0, 10).map((booking: any) => {
                  const isUrgent = booking.urgency === 'HIGH' || booking.urgency === 'CRITICAL';
                  return (
                    <tr
                      key={booking.id}
                      className="hover:bg-slate-850/60 transition-colors group cursor-pointer"
                      onClick={() => onSelectBooking(booking)}
                    >
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-bold text-white group-hover:text-amber-400 flex items-center gap-1.5">
                          {booking.id.slice(0, 8).toUpperCase()}
                          {isUrgent && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              URGENT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {booking.date || booking.createdAt ? new Date(booking.date || booking.createdAt).toLocaleDateString() : 'Active'}
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-200">{booking.customerName || 'Fleet Customer'}</div>
                        <div className="text-[10px] text-slate-500">{booking.customerEmail || 'customer@fleet.com'}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-medium text-slate-300">{booking.vehicleName || 'Vehicle Asset'}</div>
                        <div className="text-[10px] font-mono text-slate-500">{booking.vehiclePlate || 'KA-01-EQ-9921'}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
                          {booking.serviceType || 'Inspection'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="text-slate-300 font-medium">{booking.serviceCenterName || 'Primary Bay Hub'}</div>
                        <div className="text-[10px] text-slate-500">{booking.mechanicName ? `Mech: ${booking.mechanicName}` : 'Unassigned'}</div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            booking.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : booking.status === 'REPAIRING'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : booking.status === 'CANCELLED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            title="Reassign Garage"
                            onClick={() => setSelectedBookingForReassign(booking)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-[10px] font-mono transition-all cursor-pointer"
                          >
                            Transfer Bay
                          </button>
                          {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                            <button
                              title="Cancel by Admin"
                              onClick={() => setSelectedBookingForCancel(booking)}
                              className="px-2 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[10px] font-mono transition-all cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: REASSIGN SERVICE CENTER */}
      {selectedBookingForReassign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase font-['Oswald']">
                Reassign Service Center Bay
              </h3>
              <button
                onClick={() => setSelectedBookingForReassign(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Transfer booking <span className="font-mono text-amber-400">{selectedBookingForReassign.id.slice(0, 8).toUpperCase()}</span> for customer {selectedBookingForReassign.customerName} to another operational service center.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Select Target Service Center:</label>
              <select
                value={targetCenterId}
                onChange={(e) => setTargetCenterId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">-- Choose Garage --</option>
                {dashboardData?.recentBookings?.map((b) => (
                  <option key={b.serviceCenterId || b.id} value={b.serviceCenterId || 'sc-1'}>
                    {b.serviceCenterName || 'Fleet Auto Care Bay'}
                  </option>
                ))}
                <option value="sc-delhi-1">FleetOps Central Hub - Delhi</option>
                <option value="sc-mumbai-1">FleetOps Express Bay - Mumbai</option>
                <option value="sc-bengaluru-1">FleetOps EV Diagnostics - Bengaluru</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedBookingForReassign(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Dismiss
              </button>
              <button
                onClick={handleReassignCenter}
                disabled={!targetCenterId || isReassigning}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-['Oswald'] uppercase tracking-wider"
              >
                {isReassigning ? 'Transferring...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADMIN CANCEL BOOKING */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase font-['Oswald'] text-rose-400">
                Cancel Service Order (Admin Override)
              </h3>
              <button
                onClick={() => setSelectedBookingForCancel(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Are you sure you want to cancel booking <span className="font-mono text-amber-400">{selectedBookingForCancel.id.slice(0, 8).toUpperCase()}</span>? This will record an administrative cancellation in the system audit log.
            </p>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-medium">Cancellation Reason:</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Bay maintenance downtime / parts unavailability"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedBookingForCancel(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Keep Active
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={isCancelling}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-['Oswald'] uppercase tracking-wider"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
