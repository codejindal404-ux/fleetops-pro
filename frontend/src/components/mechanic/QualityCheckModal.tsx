import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Car,
  ClipboardCheck,
  Clock,
  User,
  Package,
  Wrench,
  Check,
  Layers,
  Sparkles,
  Loader2,
  ArrowRight,
  FileText
} from 'lucide-react';
import { Booking } from '../../types.ts';

export interface QualityCheckData {
  bookingId: string;
  checklist: {
    repairCompleted: boolean;
    partsInstalled: boolean;
    testingCompleted: boolean;
    noUnresolvedIssues: boolean;
    vehicleReady: boolean;
  };
  remarks: string;
  completeNow?: boolean;
}

interface QualityCheckModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitQC: (data: QualityCheckData) => Promise<void>;
  onProceedToCompletion?: (booking: Booking) => void;
}

export const QualityCheckModal: React.FC<QualityCheckModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSubmitQC,
  onProceedToCompletion
}) => {
  const [checklist, setChecklist] = useState({
    repairCompleted: true,
    partsInstalled: true,
    testingCompleted: true,
    noUnresolvedIssues: true,
    vehicleReady: true
  });
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checklist).every(Boolean);

  const handleSubmit = async (completeNow: boolean = false) => {
    if (!remarks.trim()) {
      setError('Please provide Quality Check remarks and final observations.');
      return;
    }

    if (!allChecked && completeNow) {
      setError('All 5 quality check items must be verified before completing service.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmitQC({
        bookingId: booking.id,
        checklist,
        remarks: remarks.trim(),
        completeNow
      });
      if (completeNow && onProceedToCompletion) {
        onProceedToCompletion(booking);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit quality check');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract existing data
  const vehicle = booking.vehicle;
  const inspection = booking.inspection;
  const recentLogs = booking.repairLogs || [];
  const partsRequests = booking.partsRequests || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Glow Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-500 via-amber-500 to-emerald-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white font-['Oswald'] uppercase tracking-wide">
                  Quality Check & Sign-Off
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  WO #{booking.id.slice(-6).toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stage 4 Verification: Multi-point inspection & roadworthiness sign-off
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-slate-200">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Existing Read-Only Context (No fabricated data) */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Work Order Summary
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 block">Vehicle</span>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  {vehicle ? `${vehicle.brand} ${vehicle.model}` : booking.vehicleName || 'Vehicle'}
                  {vehicle?.registrationNumber && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">
                      {vehicle.registrationNumber}
                    </span>
                  )}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 block">Customer</span>
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {booking.customerName || booking.customer?.name || 'Customer'}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-slate-500 block">Service Request</span>
                <span className="font-semibold text-amber-400">
                  {booking.serviceType || 'Standard Mechanical Service'}
                </span>
              </div>

              {booking.issueDescription && (
                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500 block">Issue Description</span>
                  <span className="text-slate-300 text-[11px] line-clamp-2">
                    {booking.issueDescription}
                  </span>
                </div>
              )}
            </div>

            {/* Existing Inspection Summary if present */}
            {inspection && (
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-[11px]">
                <span className="text-slate-400">
                  Initial Inspection: <strong className="text-cyan-400">{inspection.overallResult}</strong>
                </span>
                {inspection.engineHealthScore !== undefined && (
                  <span className="text-slate-400">
                    Engine Score: <strong className="text-emerald-400">{inspection.engineHealthScore}%</strong>
                  </span>
                )}
                {inspection.batteryVoltage && (
                  <span className="text-slate-400">
                    Battery: <strong className="text-amber-400">{inspection.batteryVoltage}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Existing Parts Requests if present */}
            {partsRequests.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400 block mb-1">
                  Requisitioned Parts ({partsRequests.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {partsRequests.map((pr: any, idx: number) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[10px]"
                    >
                      {pr.partName || pr.name} {pr.quantity ? `(x${pr.quantity})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Latest Repair Log Note if present */}
            {recentLogs.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80 text-[11px]">
                <span className="text-slate-400 block mb-0.5">Latest Bay Progress:</span>
                <p className="text-slate-300 italic text-[11px] bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                  "{recentLogs[recentLogs.length - 1].note}"
                </p>
              </div>
            )}
          </div>

          {/* Quality Check Verification Checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-cyan-400" />
                Vehicle / Repair Verification Checklist
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                {Object.values(checklist).filter(Boolean).length} / 5 Verified
              </span>
            </div>

            <div className="space-y-2">
              {[
                {
                  key: 'repairCompleted' as const,
                  title: 'Repair Completed',
                  description: 'All mechanical, electrical, and scheduled service tasks have been completed in bay.'
                },
                {
                  key: 'partsInstalled' as const,
                  title: 'Required Parts Installed',
                  description: 'All required OEM and aftermarket parts are securely fitted and torqued to specification.'
                },
                {
                  key: 'testingCompleted' as const,
                  title: 'Test / Inspection Completed',
                  description: 'System diagnostics, engine idle check, and final road-testing completed.'
                },
                {
                  key: 'noUnresolvedIssues' as const,
                  title: 'No Visible Unresolved Issue',
                  description: 'Zero pending DTC trouble codes; no fluid leaks, warning lights, or abnormal noises.'
                },
                {
                  key: 'vehicleReady' as const,
                  title: 'Vehicle Ready for Customer',
                  description: 'Protective covers removed, fluids topped, vehicle clean and ready for pickup.'
                }
              ].map((item) => {
                const isChecked = checklist[item.key];
                return (
                  <div
                    key={item.key}
                    onClick={() => toggleCheck(item.key)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                      isChecked
                        ? 'bg-cyan-950/20 border-cyan-500/40 hover:border-cyan-400/60'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-all ${
                        isChecked
                          ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-sm'
                          : 'border-slate-600 bg-slate-900'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{item.title}</span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.2 rounded ${
                            isChecked ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-500'
                          }`}
                        >
                          {isChecked ? 'PASS' : 'PENDING'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Final Remarks Textarea */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Quality Check Remarks</span>
              <span className="text-[10px] font-normal text-slate-500">
                Technician Observations & Notes
              </span>
            </label>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Enter final technician observations, road test results, fluid levels, or handover remarks..."
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500/60 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => handleSubmit(false)}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span>Save QC Findings</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isSubmitting || !allChecked}
              className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold font-['Oswald'] uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
                allChecked
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Pass QC & Complete Service</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
