import React from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Star,
  Zap,
  TrendingUp,
  ShieldCheck,
  Flame,
  Target,
  BarChart3
} from 'lucide-react';
import { MechanicPerformanceMetrics, User } from '../../types.ts';

interface MechanicPerformanceCardProps {
  metrics?: MechanicPerformanceMetrics | null;
  user?: User | null;
}

export const MechanicPerformanceCard: React.FC<MechanicPerformanceCardProps> = ({
  metrics,
  user
}) => {
  const completedJobs = metrics?.totalCompletedRepairs || metrics?.completedJobs || 24;
  const avgRepairTime = metrics?.avgRepairTimeHours ? `${metrics.avgRepairTimeHours} hrs` : metrics?.avgRepairTime || '1.8 hrs';
  const customerRating = metrics?.customerRating || 4.9;
  const totalReviews = metrics?.totalReviewsCount || 38;
  const efficiencyScore = metrics?.efficiencyScore ? `${metrics.efficiencyScore}%` : '96%';

  return (
    <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Subtle Glow Backdrop */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-indigo-400">
              <Award className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">
                {user?.name || 'Lead Master Technician'}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                PRO CERTIFIED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automotive Diagnostics & Workshop Performance Scorecard
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <TrendingUp className="w-3.5 h-3.5" /> Top 5% Fleet Technician
          </span>
        </div>
      </div>

      {/* 4 Core Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        {/* 1. Completed Jobs */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Completed Jobs</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-white font-mono">{completedJobs}</div>
            <div className="text-[11px] text-indigo-300 mt-0.5 flex items-center gap-1">
              <span>Target: 30 / mo</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-semibold">80%</span>
            </div>
          </div>
        </div>

        {/* 2. Average Repair Time */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Avg Repair Time</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-white font-mono">{avgRepairTime}</div>
            <div className="text-[11px] text-cyan-300 mt-0.5 flex items-center gap-1">
              <span>Benchmark: 2.2 hrs</span>
              <span className="text-slate-500">•</span>
              <span className="text-emerald-400 font-semibold">+18% faster</span>
            </div>
          </div>
        </div>

        {/* 3. Customer Rating */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Customer Rating</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-white font-mono flex items-baseline gap-1">
              <span>{customerRating}</span>
              <span className="text-xs text-slate-400 font-normal">/ 5.0</span>
            </div>
            <div className="text-[11px] text-amber-300 mt-0.5">
              Based on {totalReviews} customer reviews
            </div>
          </div>
        </div>

        {/* 4. Efficiency Score */}
        <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Efficiency Score</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="text-2xl font-extrabold text-white font-mono">{efficiencyScore}</div>
            <div className="text-[11px] text-emerald-300 mt-0.5 flex items-center gap-1">
              <span>First-time fix rate: 98%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges & Specializations Ribbon */}
      <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-medium">Workshop Masteries:</span>
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700">
            OBD-II Electronics
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700">
            Brembo OEM Brake Systems
          </span>
          <span className="px-2.5 py-0.5 rounded-lg bg-slate-800/80 text-slate-300 border border-slate-700">
            EV Powertrain Inspection
          </span>
        </div>

        <div className="text-slate-400 flex items-center gap-1 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verified FleetOps Pro Workshop Technician</span>
        </div>
      </div>
    </div>
  );
};

export default MechanicPerformanceCard;
