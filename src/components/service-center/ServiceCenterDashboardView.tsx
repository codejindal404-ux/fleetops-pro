import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  Clock,
  DollarSign,
  MapPin,
  Phone,
  ShieldCheck,
  Star,
  Users,
  Wrench,
  TrendingUp,
  Activity,
  AlertTriangle,
  RefreshCw,
  Award
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { ServiceCenter } from '../../types.ts';

interface ServiceCenterDashboardViewProps {
  centerId: string;
  onBack: () => void;
  token?: string | null;
}

interface AnalyticsData {
  serviceCenter: ServiceCenter;
  summary: {
    totalBookings: number;
    completedBookings: number;
    activeBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    paidRevenue: number;
    pendingRevenue: number;
    averageRating: number;
    totalReviews: number;
    capacity: number;
    bayUtilizationRate: number;
    activeMechanicsCount: number;
  };
  monthlyRevenue: Array<{ month: string; revenue: number; bookings: number }>;
  statusDistribution: Array<{ name: string; value: number }>;
  recentBookings: Array<{
    id: string;
    status: string;
    serviceType: string;
    preferredDate: string;
    createdAt: string;
    vehicle?: { registrationNumber: string; brand: string; model: string };
    customer?: { name: string; email: string };
    mechanic?: { name: string };
  }>;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#f59e0b',
  APPROVED: '#3b82f6',
  IN_PROGRESS: '#06b6d4',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444'
};

export const ServiceCenterDashboardView: React.FC<ServiceCenterDashboardViewProps> = ({
  centerId,
  onBack,
  token
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const activeToken = token || localStorage.getItem('fleetops_token') || localStorage.getItem('token');
      const res = await fetch(`/api/admin/service-centers/${centerId}/analytics`, {
        headers: {
          Authorization: `Bearer ${activeToken}`
        }
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to fetch analytics');
      }
      setData(json.analytics || json.data);
    } catch (err: any) {
      setError(err.message || 'Error loading telemetry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [centerId]);

  if (loading) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-200 font-['Oswald'] uppercase tracking-wider">
          Aggregating Service Bay Telemetry...
        </h3>
        <p className="text-xs text-slate-500 font-mono mt-1">
          Crunching real-time revenue, booking flow, and diagnostic metrics
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 className="text-base font-bold text-slate-200">Unable to load analytics</h3>
        <p className="text-xs text-slate-400 mt-1">{error}</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl font-mono"
        >
          Return to Service Centers
        </button>
      </div>
    );
  }

  const { serviceCenter, summary, monthlyRevenue, statusDistribution, recentBookings } = data;

  return (
    <div className="space-y-6" id="service-center-analytics-dashboard">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700"
            title="Back to Service Centers"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white font-['Oswald'] uppercase tracking-wide">
                {serviceCenter.name}
              </h2>
              {serviceCenter.isVerified ? (
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  VERIFIED GARAGE
                </span>
              ) : (
                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-mono font-bold rounded-full">
                  PENDING VERIFICATION
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                {serviceCenter.address}, {serviceCenter.city}, {serviceCenter.state}
              </span>
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                {serviceCenter.phone}
              </span>
              <span className="text-amber-400 font-bold">
                ${serviceCenter.pricePerHour}/hr base labor
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchAnalytics}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Gross Revenue
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-['Oswald'] tracking-tight">
              ${summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>${summary.paidRevenue.toFixed(0)} Collected (${summary.pendingRevenue.toFixed(0)} Pending)</span>
            </div>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Completed Services
            </span>
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-['Oswald'] tracking-tight">
              {summary.completedBookings} / {summary.totalBookings}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-blue-400 mt-1">
              <Activity className="w-3 h-3" />
              <span>{summary.activeBookings} Active In-Bay</span>
            </div>
          </div>
        </div>

        {/* Bay Utilization */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Bay Capacity Utilization
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400 font-['Oswald'] tracking-tight">
              {summary.bayUtilizationRate}%
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mt-1">
              <span>{summary.capacity} Hydraulic Lift Bays</span>
            </div>
          </div>
        </div>

        {/* Rating & Reviews */}
        <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
              Satisfaction Index
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Star className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-white font-['Oswald'] tracking-tight flex items-center gap-1.5">
              <span>{summary.averageRating}</span>
              <div className="flex text-amber-400 text-sm">
                {'★'.repeat(Math.round(summary.averageRating))}
              </div>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mt-1">
              <span>Based on {summary.totalReviews} Verified Audits</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue & Growth Chart */}
        <div className="lg:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-wider">
                6-Month Revenue & Booking Volume
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Financial performance trends and monthly service demand
              </p>
            </div>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold">
              USD ($)
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} tickFormatter={(val) => `$${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                  name="Revenue ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Breakdown Pie Chart */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-wider">
              Booking Status Distribution
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Operational flow across work orders
            </p>
          </div>

          <div className="h-56 w-full my-auto">
            {statusDistribution.every((d) => d.value === 0) ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                No active bookings recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={STATUS_COLORS[entry.name] || '#94a3b8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontFamily: 'monospace'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60">
              <span className="text-slate-400">Total Work Orders</span>
              <span className="font-bold text-white">{summary.totalBookings}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60">
              <span className="text-slate-400">Mechanics On Duty</span>
              <span className="font-bold text-amber-400">{summary.activeMechanicsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Capabilities & Recent Work Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Garage Details & Services */}
        <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            Garage Profile & Capabilities
          </h3>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Operating Status</span>
              <span
                className={`font-bold uppercase ${
                  serviceCenter.status === 'ACTIVE'
                    ? 'text-emerald-400'
                    : serviceCenter.status === 'BUSY'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}
              >
                {serviceCenter.status}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Operating Hours</span>
              <span className="text-slate-200">{serviceCenter.operatingHours || 'Mon-Sat: 8:00 AM - 6:00 PM'}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">GPS Coordinates</span>
              <span className="text-slate-300">
                {serviceCenter.latitude.toFixed(4)}, {serviceCenter.longitude.toFixed(4)}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Contact Email</span>
              <span className="text-slate-300">{serviceCenter.email || 'dispatch@garage.com'}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider mb-2">
              Certified Services Offered
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {serviceCenter.services.map((srv, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
                >
                  {srv}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Work Orders */}
        <div className="lg:col-span-2 p-6 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white font-['Oswald'] uppercase tracking-wider">
              Recent Service Center Bookings
            </h3>
            <span className="text-xs font-mono text-slate-400">
              {recentBookings.length} Logged
            </span>
          </div>

          <div className="overflow-x-auto">
            {recentBookings.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-500 font-mono">
                No recent bookings for this service center
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Customer</th>
                    <th className="pb-2">Vehicle</th>
                    <th className="pb-2">Service</th>
                    <th className="pb-2">Mechanic</th>
                    <th className="pb-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-850/40">
                      <td className="py-2.5 text-amber-500 font-bold">#{b.id.slice(-6)}</td>
                      <td className="py-2.5 text-slate-200">{b.customer?.name || 'Customer'}</td>
                      <td className="py-2.5 text-slate-300">
                        {b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Vehicle'}
                      </td>
                      <td className="py-2.5 text-slate-400">{b.serviceType}</td>
                      <td className="py-2.5 text-slate-400">{b.mechanic?.name || 'Unassigned'}</td>
                      <td className="py-2.5 text-right">
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            b.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : b.status === 'IN_PROGRESS'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                              : b.status === 'APPROVED'
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
