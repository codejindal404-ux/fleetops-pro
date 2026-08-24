import React, { useState, useEffect } from 'react';
import {
  Bell,
  Calendar,
  Gauge,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Zap,
  Wrench,
  X,
  RefreshCw,
  Sliders,
  Send,
  Info
} from 'lucide-react';
import { Vehicle, ServiceReminderEvaluation } from '../types.ts';
import { apiClient } from '../services/apiClient.ts';

interface ServiceReminderModalProps {
  vehicle: Vehicle | null;
  isOpen: boolean;
  onClose: () => void;
  onBookService: (vehicle: Vehicle) => void;
  onVehicleUpdated?: (updatedVehicle: Vehicle) => void;
}

export const ServiceReminderModal: React.FC<ServiceReminderModalProps> = ({
  vehicle,
  isOpen,
  onClose,
  onBookService,
  onVehicleUpdated
}) => {
  if (!isOpen || !vehicle) return null;

  const [evaluation, setEvaluation] = useState<ServiceReminderEvaluation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [triggerSuccessMsg, setTriggerSuccessMsg] = useState<string | null>(null);

  // Form states for config
  const [serviceIntervalMonths, setServiceIntervalMonths] = useState<number>(vehicle.serviceIntervalMonths || 6);
  const [serviceIntervalMileage, setServiceIntervalMileage] = useState<number>(vehicle.serviceIntervalMileage || 5000);
  const [avgMonthlyMileage, setAvgMonthlyMileage] = useState<number>(vehicle.avgMonthlyMileage || 1000);
  const [recurringReminderEnabled, setRecurringReminderEnabled] = useState<boolean>(vehicle.recurringReminderEnabled !== false);
  const [currentMileage, setCurrentMileage] = useState<number>(vehicle.mileage || 0);
  const [lastServiceDate, setLastServiceDate] = useState<string>(vehicle.lastServiceDate || '');
  const [serviceNotes, setServiceNotes] = useState<string>(vehicle.serviceReminderNotes || 'Periodic Maintenance & Multi-Point Inspection');
  const [activeTab, setActiveTab] = useState<'STATUS' | 'SETTINGS'>('STATUS');

  const loadEvaluation = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getVehicleReminders(vehicle.id);
      if (res && res.reminder) {
        setEvaluation(res.reminder);
      }
    } catch (err) {
      console.error('Failed to load vehicle reminders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (vehicle && isOpen) {
      setServiceIntervalMonths(vehicle.serviceIntervalMonths || 6);
      setServiceIntervalMileage(vehicle.serviceIntervalMileage || 5000);
      setAvgMonthlyMileage(vehicle.avgMonthlyMileage || 1000);
      setRecurringReminderEnabled(vehicle.recurringReminderEnabled !== false);
      setCurrentMileage(vehicle.mileage || 0);
      setLastServiceDate(vehicle.lastServiceDate || '');
      setServiceNotes(vehicle.serviceReminderNotes || 'Periodic Maintenance & Multi-Point Inspection');
      setTriggerSuccessMsg(null);
      loadEvaluation();
    }
  }, [vehicle, isOpen]);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiClient.updateVehicleReminderConfig(vehicle.id, {
        serviceIntervalMonths: Number(serviceIntervalMonths),
        serviceIntervalMileage: Number(serviceIntervalMileage),
        avgMonthlyMileage: Number(avgMonthlyMileage),
        recurringReminderEnabled,
        lastServiceDate: lastServiceDate || undefined,
        serviceReminderNotes: serviceNotes
      });

      if (res && res.vehicle) {
        if (onVehicleUpdated) onVehicleUpdated(res.vehicle);
        setEvaluation(res.reminderEvaluation || null);
        setTriggerSuccessMsg('Service reminder rules successfully saved!');
        setTimeout(() => setTriggerSuccessMsg(null), 4000);
        setActiveTab('STATUS');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update reminder settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateMileage = async () => {
    if (currentMileage < 0) return;
    setIsSaving(true);
    try {
      const res = await apiClient.updateVehicleMileage(vehicle.id, currentMileage);
      if (res && res.vehicle) {
        if (onVehicleUpdated) onVehicleUpdated(res.vehicle);
        setEvaluation(res.reminderEvaluation || null);
        setTriggerSuccessMsg(`Odometer updated to ${currentMileage.toLocaleString()} mi. Recalculated intervals.`);
        setTimeout(() => setTriggerSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update mileage.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerManualAlert = async () => {
    setIsTriggering(true);
    try {
      const res = await apiClient.evaluateVehicleReminder(vehicle.id, true);
      setTriggerSuccessMsg(res.message || 'Real-time service reminder dispatched to notification tray!');
      loadEvaluation();
      setTimeout(() => setTriggerSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to trigger reminder notification.');
    } finally {
      setIsTriggering(false);
    }
  };

  // Progress bar percentages
  const daysProgress = evaluation
    ? Math.max(0, Math.min(100, Math.round(((serviceIntervalMonths * 30 - evaluation.daysRemaining) / (serviceIntervalMonths * 30)) * 100)))
    : 0;

  const mileageProgress = evaluation && evaluation.nextMaintenanceMileage
    ? Math.max(0, Math.min(100, Math.round(((currentMileage - (evaluation.lastServiceMileage || 0)) / serviceIntervalMileage) * 100)))
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl space-y-0 text-slate-900 relative">
        
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-6 border-b border-slate-800 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 border border-amber-500/30 rounded-2xl text-amber-400">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                  30-Day Reminder Engine
                </span>
                <span className="text-xs font-mono text-slate-400">{vehicle.registrationNumber}</span>
              </div>
              <h2 className="text-2xl font-bold font-['Oswald'] uppercase tracking-wide text-white mt-1">
                {vehicle.brand} {vehicle.model}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('STATUS')}
            className={`pb-3 px-4 font-['Oswald'] uppercase text-sm font-bold tracking-wider flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'STATUS'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-xl border-t border-x border-slate-200 shadow-2xs -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Maintenance Schedule & Diagnostics</span>
          </button>
          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`pb-3 px-4 font-['Oswald'] uppercase text-sm font-bold tracking-wider flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'SETTINGS'
                ? 'border-amber-600 text-amber-900 bg-white rounded-t-xl border-t border-x border-slate-200 shadow-2xs -mb-[1px]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4 text-amber-600" />
            <span>Reminder Rules & Intervals</span>
          </button>
        </div>

        {/* Success feedback toast */}
        {triggerSuccessMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{triggerSuccessMsg}</span>
          </div>
        )}

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center gap-3 animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
              <span>Analyzing telemetry and scheduled maintenance intervals...</span>
            </div>
          ) : activeTab === 'STATUS' ? (
            <div className="space-y-6">
              {/* Primary Status Banner */}
              {evaluation && (
                <div
                  className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    evaluation.status === 'OVERDUE'
                      ? 'bg-rose-50 border-rose-200 text-rose-950'
                      : evaluation.status === 'DUE_SOON'
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-3 rounded-xl flex-shrink-0 ${
                        evaluation.status === 'OVERDUE'
                          ? 'bg-rose-500 text-white'
                          : evaluation.status === 'DUE_SOON'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {evaluation.status === 'OVERDUE' ? (
                        <AlertTriangle className="w-6 h-6" />
                      ) : evaluation.status === 'DUE_SOON' ? (
                        <Clock className="w-6 h-6" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                            evaluation.status === 'OVERDUE'
                              ? 'bg-rose-200 text-rose-800'
                              : evaluation.status === 'DUE_SOON'
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-emerald-200 text-emerald-900'
                          }`}
                        >
                          {evaluation.status === 'OVERDUE'
                            ? 'Action Required - Overdue'
                            : evaluation.status === 'DUE_SOON'
                            ? '30-Day Reminder Active'
                            : 'Service Up-To-Date'}
                        </span>
                        {evaluation.reason === 'TIME_30_DAYS' && (
                          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                            30-Day Time Horizon
                          </span>
                        )}
                        {evaluation.reason === 'MILEAGE_THRESHOLD' && (
                          <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded">
                            Mileage Milestone Approaching
                          </span>
                        )}
                      </div>
                      <h3 className="font-['Oswald'] uppercase font-bold text-lg mt-1 tracking-wide">
                        {evaluation.title}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        {evaluation.message}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onClose();
                      onBookService(vehicle);
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-amber-400 rounded-xl font-['Oswald'] uppercase tracking-wider text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    <Wrench className="w-4 h-4 text-amber-400" />
                    <span>Book Service Now</span>
                  </button>
                </div>
              )}

              {/* 2-Column Telemetry Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Time Interval Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-bold font-['Oswald'] uppercase text-xs tracking-wider">
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>Time-Based Service Horizon</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Every {serviceIntervalMonths} Mos
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500">Target Due Date</span>
                      <span className="font-bold text-slate-900">{evaluation?.nextServiceDueDate || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500">Countdown</span>
                      <span className={`font-bold ${
                        (evaluation?.daysRemaining ?? 0) <= 0
                          ? 'text-rose-600'
                          : (evaluation?.daysRemaining ?? 0) <= 30
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}>
                        {evaluation ? (
                          evaluation.daysRemaining < 0
                            ? `${Math.abs(evaluation.daysRemaining)} days overdue`
                            : `${evaluation.daysRemaining} days remaining`
                        ) : 'Calculating...'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          daysProgress >= 100 || (evaluation?.daysRemaining ?? 0) < 0
                            ? 'bg-rose-500'
                            : daysProgress >= 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, daysProgress))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Last Service: {vehicle.lastServiceDate || 'Factory Setup'}</span>
                      <span>30-Day Trigger Window</span>
                    </div>
                  </div>
                </div>

                {/* Mileage Interval Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-bold font-['Oswald'] uppercase text-xs tracking-wider">
                      <Gauge className="w-4 h-4 text-amber-600" />
                      <span>Mileage Milestone Horizon</span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      Every {serviceIntervalMileage.toLocaleString()} Mi
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500">Milestone Target</span>
                      <span className="font-bold text-slate-900">{evaluation?.nextMaintenanceMileage?.toLocaleString()} mi</span>
                    </div>
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-slate-500">Miles Remaining</span>
                      <span className={`font-bold ${
                        (evaluation?.milesRemaining ?? 0) <= 0
                          ? 'text-rose-600'
                          : (evaluation?.milesRemaining ?? 0) <= 500
                          ? 'text-amber-600'
                          : 'text-emerald-600'
                      }`}>
                        {evaluation ? (
                          evaluation.milesRemaining < 0
                            ? `${Math.abs(evaluation.milesRemaining).toLocaleString()} mi exceeded`
                            : `${evaluation.milesRemaining.toLocaleString()} mi to go`
                        ) : 'Calculating...'}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          mileageProgress >= 100 || (evaluation?.milesRemaining ?? 0) < 0
                            ? 'bg-rose-500'
                            : mileageProgress >= 85
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, mileageProgress))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Current: {currentMileage.toLocaleString()} mi</span>
                      <span>~{evaluation?.projectedDaysToMileage ?? 30} days at pace</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Odometer Update Bar */}
              <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <Gauge className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 font-['Oswald'] uppercase tracking-wider">Update Current Odometer</p>
                    <p className="text-[11px] text-slate-500">Record updated mileage to re-check scheduled thresholds</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-36">
                    <input
                      type="number"
                      value={currentMileage}
                      onChange={(e) => setCurrentMileage(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 pr-8"
                      min={0}
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] font-mono font-bold text-slate-400">mi</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpdateMileage}
                    disabled={isSaving}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-['Oswald'] uppercase text-xs font-bold transition-all disabled:opacity-50"
                  >
                    Update
                  </button>
                </div>
              </div>

              {/* Real-Time Test Alert Trigger */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Info className="w-4 h-4 text-slate-400" />
                  <span>Automated notifications dispatch 30 days before next maintenance date or milestone.</span>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerManualAlert}
                  disabled={isTriggering}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 font-['Oswald'] uppercase tracking-wider"
                >
                  <Send className={`w-3.5 h-3.5 ${isTriggering ? 'animate-spin' : 'text-amber-400'}`} />
                  <span>{isTriggering ? 'Sending Alert...' : 'Dispatch Live Reminder Test'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Tab 2: Settings & Configuration */
            <form onSubmit={handleSaveConfig} className="space-y-5">
              <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                <Sliders className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Recurring Maintenance Interval Policy</p>
                  <p className="text-amber-800 leading-relaxed">
                    FleetOps Pro calculates reminders automatically based on which threshold occurs first: the specified month cycle (e.g. 6 months) or mileage milestone (e.g. 5,000 miles).
                  </p>
                </div>
              </div>

              {/* Recurring Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900 font-['Oswald'] uppercase tracking-wider">Enable Automated 30-Day Notifications</p>
                  <p className="text-[11px] text-slate-500">Dispatches in-app bell updates and web alerts 30 days before scheduled service.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recurringReminderEnabled}
                    onChange={(e) => setRecurringReminderEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono uppercase mb-1">
                    Time Interval (Months)
                  </label>
                  <select
                    value={serviceIntervalMonths}
                    onChange={(e) => setServiceIntervalMonths(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value={3}>3 Months (Heavy Commercial / Fleet)</option>
                    <option value={6}>6 Months (Recommended Standard)</option>
                    <option value={9}>9 Months</option>
                    <option value={12}>12 Months (Annual Inspection)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono uppercase mb-1">
                    Mileage Interval (Miles)
                  </label>
                  <select
                    value={serviceIntervalMileage}
                    onChange={(e) => setServiceIntervalMileage(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  >
                    <option value={3000}>3,000 Miles (Severe duty / Conventional)</option>
                    <option value={5000}>5,000 Miles (Standard Synthetic Blend)</option>
                    <option value={7500}>7,500 Miles (Full Synthetic)</option>
                    <option value={10000}>10,000 Miles (Extended Interval)</option>
                    <option value={15000}>15,000 Miles (Heavy Commercial Truck)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono uppercase mb-1">
                    Estimated Monthly Driving (Miles)
                  </label>
                  <input
                    type="number"
                    value={avgMonthlyMileage}
                    onChange={(e) => setAvgMonthlyMileage(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                    min={100}
                    step={100}
                  />
                  <span className="text-[10px] text-slate-400 font-mono">Used to project upcoming mileage milestones accurately.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 font-mono uppercase mb-1">
                    Last Service Recorded Date
                  </label>
                  <input
                    type="date"
                    value={lastServiceDate}
                    onChange={(e) => setLastServiceDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 font-mono uppercase mb-1">
                  Default Maintenance Scope / Service Notes
                </label>
                <textarea
                  value={serviceNotes}
                  onChange={(e) => setServiceNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. Engine Oil & Filter, Brake Fluid, Tire Rotation & Multi-point Inspection"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('STATUS')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl font-['Oswald'] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
                  <span>{isSaving ? 'Saving Rules...' : 'Save & Recalculate Reminders'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>FleetOps Automated Maintenance Intelligence</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-bold"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
