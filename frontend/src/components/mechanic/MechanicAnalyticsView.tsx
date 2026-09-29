import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Zap,
  Star,
  Award,
  ShieldCheck,
  Activity,
  Cpu,
  DollarSign
} from 'lucide-react';
import { MechanicPerformanceMetrics } from '../../types.ts';
import { MechanicPerformanceCard } from './MechanicPerformanceCard.tsx';

interface MechanicAnalyticsViewProps {
  metrics: MechanicPerformanceMetrics | null;
}

const MONTHLY_TREND_DATA = [
  { month: 'Jan', completed: 18, target: 20, revenue: 4200 },
  { month: 'Feb', completed: 22, target: 20, revenue: 5100 },
  { month: 'Mar', completed: 25, target: 22, revenue: 6300 },
  { month: 'Apr', completed: 28, target: 25, revenue: 7100 },
  { month: 'May', completed: 24, target: 25, revenue: 5900 },
  { month: 'Jun', completed: 31, target: 28, revenue: 8400 }
];

const CATEGORY_DISTRIBUTION = [
  { name: 'Brakes & ABS', value: 35, color: '#f59e0b' },
  { name: 'Engine & Diagnostics', value: 28, color: '#ef4444' },
  { name: 'Electrical & Battery', value: 18, color: '#06b6d4' },
  { name: 'Suspension & Tires', value: 12, color: '#10b981' },
  { name: 'Fluids & Transmission', value: 7, color: '#8b5cf6' }
];

const EFFICIENCY_TIMELINE = [
  { week: 'W1', efficiency: 92, firstTimeFix: 95 },
  { week: 'W2', efficiency: 94, firstTimeFix: 96 },
  { week: 'W3', efficiency: 91, firstTimeFix: 94 },
  { week: 'W4', efficiency: 97, firstTimeFix: 98 },
  { week: 'W5', efficiency: 96, firstTimeFix: 99 }
];

export const MechanicAnalyticsView: React.FC<MechanicAnalyticsViewProps> = ({ metrics }) => {
  const completedJobs = metrics?.totalCompletedRepairs || 12;
  const activeJobs = metrics?.activeJobs || 2;
  const avgTime = metrics?.averageRepairTimeHours || 1.8;
  const csat = metrics?.customerRating || 4.9;
  const efficiency = metrics?.efficiencyScore || 95;
  const firstTimeFix = metrics?.firstTimeFixRate || 98.2;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Mechanic Performance Scorecard */}
      <MechanicPerformanceCard metrics={metrics} />
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold uppercase">
              Workshop Analytics Intelligence
            </span>
          </div>
          <h2 className="text-2xl font-bold text-white font-['Oswald'] uppercase mt-1">
            Mechanic Operational & Productivity Metrics
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Real-time repair efficiency, diagnostic accuracy, and turnaround telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-right font-mono">
            <div className="text-[10px] text-slate-500 uppercase">First-Time Fix Rate</div>
            <div className="text-xl font-bold text-emerald-400">{firstTimeFix}%</div>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-right font-mono">
            <div className="text-[10px] text-slate-500 uppercase">Workshop Rating</div>
            <div className="text-xl font-bold text-amber-400">{csat.toFixed(1)} ★</div>
          </div>
        </div>
      </div>

      {/* Primary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Monthly Completed Repairs vs Target */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                Work Orders Completed vs Target
              </h3>
              <p className="text-xs text-slate-400 font-mono">Monthly technician volume & quotas</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MONTHLY_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Bar dataKey="completed" name="Completed Repairs" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                <Bar dataKey="target" name="Target Goal" fill="#334155" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Efficiency & First-Time Fix Rate Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                Efficiency & Accuracy Index
              </h3>
              <p className="text-xs text-slate-400 font-mono">Weekly performance trajectory (%)</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EFFICIENCY_TIMELINE} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="week" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis domain={[80, 100]} stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#f8fafc', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
                <Line
                  type="monotone"
                  dataKey="efficiency"
                  name="Efficiency Score (%)"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ fill: '#06b6d4', r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="firstTimeFix"
                  name="First-Time Fix (%)"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Repair Volume by System Category (Donut) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                Repair Work by System Category
              </h3>
              <p className="text-xs text-slate-400 font-mono">Specialized repair breakdown</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Cpu className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_DISTRIBUTION}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CATEGORY_DISTRIBUTION.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Service Revenue Produced (Area Chart) */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase">
                Service Billables Generated ($)
              </h3>
              <p className="text-xs text-slate-400 font-mono">Total labour & parts billings</p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MONTHLY_TREND_DATA} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(value: any) => [`$${value}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
