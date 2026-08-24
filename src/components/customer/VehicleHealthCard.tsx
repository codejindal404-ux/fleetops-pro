import React, { useState } from 'react';
import { VehicleHealth } from '../../types.ts';
import { Activity, AlertTriangle, CheckCircle2, ShieldAlert, Cpu, Droplets, Disc, BatteryCharging, Gauge, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

interface VehicleHealthCardProps {
  health: VehicleHealth;
  onBookService?: (vehicleId: string, serviceType: string) => void;
}

export const VehicleHealthCard: React.FC<VehicleHealthCardProps> = ({ health, onBookService }) => {
  const [expanded, setExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 65) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getProgressBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 65) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div id={`vehicle-health-${health.vehicleId}`} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Header Banner */}
      <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {health.vehicleBrand.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-lg">{health.vehicleBrand} {health.vehicleModel}</h3>
              <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-slate-100 text-slate-600 border border-slate-200">
                {health.year}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono tracking-wider">{health.registrationNumber} • {health.currentMileage?.toLocaleString()} km</p>
          </div>
        </div>

        {/* Overall Health Score Badge */}
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 ${getScoreColor(health.overallHealthScore)}`}>
            {health.overallHealthScore >= 80 ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : health.overallHealthScore >= 65 ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            )}
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider">Health Index</div>
              <div className="text-base font-black leading-none">{health.overallHealthScore}/100</div>
            </div>
          </div>

          <button
            id={`toggle-health-details-${health.vehicleId}`}
            onClick={() => setExpanded(!expanded)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title={expanded ? "Hide Diagnostic Telemetry" : "View Diagnostic Telemetry"}
          >
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* AI Diagnostic Alert Strip */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-b border-amber-100 flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-amber-500 text-white shrink-0 shadow-sm mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">AI Predictive Diagnostics</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800 font-semibold">Live Telemetry</span>
          </div>
          <p className="text-xs text-amber-950 mt-0.5 leading-relaxed font-medium">
            {health.aiRecommendation}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-amber-200/50">
            <span className="text-xs text-amber-900">
              Recommended: <strong className="font-semibold">{health.predictedService}</strong> (in ~{health.predictedServiceDays} days)
            </span>
            {onBookService && (
              <button
                id={`ai-book-service-${health.vehicleId}`}
                onClick={() => onBookService(health.vehicleId, health.predictedService)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all"
              >
                Schedule Service
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Core Telemetry Metrics Bar */}
      <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 bg-slate-50/50">
        {/* Engine */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium"><Cpu className="w-3.5 h-3.5 text-slate-700" /> Engine</span>
            <span className="font-bold text-slate-800">{health.metrics.engineHealth.score}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${getProgressBarColor(health.metrics.engineHealth.score)}`} style={{ width: `${health.metrics.engineHealth.score}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">{health.metrics.engineHealth.detail}</p>
        </div>

        {/* Brakes */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium"><Disc className="w-3.5 h-3.5 text-slate-700" /> Brakes</span>
            <span className="font-bold text-slate-800">{health.metrics.brakeCondition.score}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${getProgressBarColor(health.metrics.brakeCondition.score)}`} style={{ width: `${health.metrics.brakeCondition.score}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">{health.metrics.brakeCondition.detail}</p>
        </div>

        {/* Oil Life */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium"><Droplets className="w-3.5 h-3.5 text-slate-700" /> Oil Life</span>
            <span className="font-bold text-slate-800">{health.metrics.oilLife.score}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${getProgressBarColor(health.metrics.oilLife.score)}`} style={{ width: `${health.metrics.oilLife.score}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">{health.metrics.oilLife.detail}</p>
        </div>

        {/* Battery */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium"><BatteryCharging className="w-3.5 h-3.5 text-slate-700" /> Battery</span>
            <span className="font-bold text-slate-800">{health.metrics.batteryStatus.score}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${getProgressBarColor(health.metrics.batteryStatus.score)}`} style={{ width: `${health.metrics.batteryStatus.score}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">{health.metrics.batteryStatus.detail}</p>
        </div>

        {/* Tyres */}
        <div className="p-3 bg-white rounded-xl border border-slate-200/80 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="flex items-center gap-1.5 font-medium"><Gauge className="w-3.5 h-3.5 text-slate-700" /> Tyres</span>
            <span className="font-bold text-slate-800">{health.metrics.tyrePressure.score}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full ${getProgressBarColor(health.metrics.tyrePressure.score)}`} style={{ width: `${health.metrics.tyrePressure.score}%` }} />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 truncate">{health.metrics.tyrePressure.detail}</p>
        </div>
      </div>

      {/* Expanded Telemetry Breakdown */}
      {expanded && (
        <div className="p-5 border-t border-slate-100 bg-white">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-slate-600" /> Comprehensive System Diagnostics Breakdown
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <strong className="text-slate-800">Powertrain & Transmission:</strong>
                <p className="text-slate-600 mt-0.5">Smooth gear transition, clutch slip within 1.2% tolerance. Spark ignition timings calibrated.</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <strong className="text-slate-800">Cooling & Thermal Regulation:</strong>
                <p className="text-slate-600 mt-0.5">Radiator fluid temperature stable at 90°C. Thermostat valve cycling nominally.</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <strong className="text-slate-800">Emission & Exhaust Catalytics:</strong>
                <p className="text-slate-600 mt-0.5">O2 sensor response within range. Particulate filter clean. Next emission check in 6 months.</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/60 flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
              <div>
                <strong className="text-slate-800">Suspension & Steering:</strong>
                <p className="text-slate-600 mt-0.5">Power steering pressure optimal. Strut dampening tested without acoustic resonance.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
