import React, { useState } from 'react';
import {
  X,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  Flame,
  Zap,
  Activity,
  ShieldAlert,
  HelpCircle,
  Layers
} from 'lucide-react';
import { Booking, OBDDiagnosticRecord, OBDDiagnosticSeverity, OBDSystemCategory } from '../../types.ts';

interface OBDDiagnosticsModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  diagnostics: OBDDiagnosticRecord[];
  onAddDiagnostic: (data: {
    bookingId: string;
    vehicleId: string;
    faultCode: string;
    systemCategory: OBDSystemCategory;
    problemDescription: string;
    severity: OBDDiagnosticSeverity;
    recommendedSolution: string;
  }) => Promise<void>;
  onResolveDiagnostic: (id: string) => Promise<void>;
  onDeleteDiagnostic: (id: string) => Promise<void>;
}

const COMMON_DTC_PRESETS = [
  { code: 'P0300', category: 'POWERTRAIN', severity: 'HIGH', desc: 'Random/Multiple Cylinder Misfire Detected', sol: 'Inspect ignition coils, replace spark plugs & test fuel injector pulse.' },
  { code: 'P0420', category: 'EMISSIONS', severity: 'MEDIUM', desc: 'Catalytic Converter System Efficiency Below Threshold (Bank 1)', sol: 'Check downstream O2 sensor voltages, inspect catalytic core.' },
  { code: 'C0035', category: 'BRAKES', severity: 'HIGH', desc: 'Left Front Wheel Speed Sensor Circuit Malfunction (ABS Fault)', sol: 'Inspect wheel speed sensor wiring harness & clean tone ring.' },
  { code: 'B1325', category: 'ELECTRICAL', severity: 'MEDIUM', desc: 'Device Power 1 Circuit Voltage Below Threshold', sol: 'Test alternator load output and perform battery conductance test.' },
  { code: 'P0700', category: 'TRANSMISSION', severity: 'CRITICAL', desc: 'Transmission Control System (TCM) Malfunction Indicator', sol: 'Scan TCM module for specific slip codes, inspect transmission fluid level.' }
];

export const OBDDiagnosticsModal: React.FC<OBDDiagnosticsModalProps> = ({
  booking,
  isOpen,
  onClose,
  diagnostics,
  onAddDiagnostic,
  onResolveDiagnostic,
  onDeleteDiagnostic
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [faultCode, setFaultCode] = useState('');
  const [systemCategory, setSystemCategory] = useState<OBDSystemCategory>('POWERTRAIN');
  const [severity, setSeverity] = useState<OBDDiagnosticSeverity>('HIGH');
  const [problemDescription, setProblemDescription] = useState('');
  const [recommendedSolution, setRecommendedSolution] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApplyPreset = (p: typeof COMMON_DTC_PRESETS[0]) => {
    setFaultCode(p.code);
    setSystemCategory(p.category as OBDSystemCategory);
    setSeverity(p.severity as OBDDiagnosticSeverity);
    setProblemDescription(p.desc);
    setRecommendedSolution(p.sol);
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faultCode.trim() || !problemDescription.trim() || !recommendedSolution.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddDiagnostic({
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        faultCode: faultCode.trim().toUpperCase(),
        systemCategory,
        severity,
        problemDescription: problemDescription.trim(),
        recommendedSolution: recommendedSolution.trim()
      });
      setFaultCode('');
      setProblemDescription('');
      setRecommendedSolution('');
      setShowAddForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = (sev: OBDDiagnosticSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/40 ring-1 ring-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'LOW':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const activeDTCs = diagnostics.filter((d) => d.status === 'ACTIVE');
  const resolvedDTCs = diagnostics.filter((d) => d.status === 'RESOLVED');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  OBD-II Telemetry Scanner
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Vehicle: {booking.vehicle?.brand} {booking.vehicle?.model} ({booking.vehicle?.registrationNumber})
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Oswald'] uppercase mt-1">
                Diagnostic Trouble Codes (DTC)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Preset DTC Bar */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-mono uppercase text-slate-400 flex items-center gap-1.5 font-bold">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                Quick OBD-II Fault Presets
              </span>
              <span className="text-[11px] font-mono text-slate-500">Click to autofill diagnostic bay</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMON_DTC_PRESETS.map((preset) => (
                <button
                  key={preset.code}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-amber-500/50 hover:bg-amber-500/10 text-xs font-mono text-slate-200 transition flex items-center gap-2 group"
                >
                  <span className="font-bold text-amber-400 group-hover:text-amber-300">{preset.code}</span>
                  <span className="text-slate-400 text-[11px] truncate max-w-[160px]">{preset.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form Toggle or Form */}
          {!showAddForm ? (
            <div className="flex justify-between items-center">
              <div className="text-sm text-slate-300 font-mono">
                <span className="text-amber-400 font-bold">{activeDTCs.length}</span> Active Fault Code(s) Detected
              </div>
              <button
                type="button"
                id="btn-add-dtc-open"
                onClick={() => setShowAddForm(true)}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase transition flex items-center gap-2 shadow-lg shadow-amber-950/50"
              >
                <Plus className="w-4 h-4" />
                Log New OBD-II Fault Code
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold font-mono text-amber-400 uppercase flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" />
                  Record Diagnostic Fault Code
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white font-mono"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    DTC Code <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. P0301, C0035, U0100"
                    value={faultCode}
                    onChange={(e) => setFaultCode(e.target.value.toUpperCase())}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm uppercase focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    System Category
                  </label>
                  <select
                    value={systemCategory}
                    onChange={(e) => setSystemCategory(e.target.value as OBDSystemCategory)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="POWERTRAIN">Powertrain (P0xxx)</option>
                    <option value="EMISSIONS">Emissions & Exhaust</option>
                    <option value="BRAKES">Brake ABS/ESC (C0xxx)</option>
                    <option value="ELECTRICAL">Electrical & Battery (B0xxx)</option>
                    <option value="TRANSMISSION">Transmission & Drivetrain</option>
                    <option value="SUSPENSION">Suspension & Steering</option>
                    <option value="HVAC">Climate & HVAC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                    Severity Level
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as OBDDiagnosticSeverity)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="LOW">Low (Informational)</option>
                    <option value="MEDIUM">Medium (Attention Required)</option>
                    <option value="HIGH">High (Immediate Repair)</option>
                    <option value="CRITICAL">Critical (Safety Hazard / Stop Driving)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Problem Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detailed telemetry symptom or diagnostic machine readout..."
                  value={problemDescription}
                  onChange={(e) => setProblemDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Recommended Technical Solution <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Actionable steps, replacement parts, or pinout tests required..."
                  value={recommendedSolution}
                  onChange={(e) => setRecommendedSolution(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-mono uppercase hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-mono uppercase font-bold shadow-lg shadow-amber-950/50"
                >
                  {isSubmitting ? 'Recording DTC...' : 'Save Diagnostic Code'}
                </button>
              </div>
            </form>
          )}

          {/* Active Diagnostic Fault Codes List */}
          <div className="space-y-3">
            <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
              Active DTC Diagnostics ({activeDTCs.length})
            </h3>

            {activeDTCs.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <div className="text-sm font-semibold text-slate-200">No Active DTC Faults Logged</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  Vehicle ECU telemetry shows no active engine or transmission fault codes for this work order.
                </p>
              </div>
            ) : (
              activeDTCs.map((dtc) => (
                <div
                  key={dtc.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-3 py-1 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-400 font-mono text-base font-bold">
                        {dtc.faultCode}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold uppercase ${getSeverityBadge(dtc.severity)}`}>
                        {dtc.severity}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono">
                        {dtc.systemCategory}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onResolveDiagnostic(dtc.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Resolved
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteDiagnostic(dtc.id)}
                        className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-sm text-slate-200 font-medium">
                    {dtc.problemDescription}
                  </div>

                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-1">
                    <div className="text-slate-400 font-mono uppercase text-[11px] font-bold">
                      Recommended Workshop Action:
                    </div>
                    <div>{dtc.recommendedSolution}</div>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    Logged by {dtc.mechanicName || 'Technician'} • {new Date(dtc.createdAt).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Resolved DTC History */}
          {resolvedDTCs.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
                Resolved Diagnostic Faults ({resolvedDTCs.length})
              </h3>
              <div className="space-y-2">
                {resolvedDTCs.map((dtc) => (
                  <div
                    key={dtc.id}
                    className="p-3 bg-slate-950/50 border border-slate-800/60 rounded-xl flex items-center justify-between text-xs text-slate-400 font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-slate-300">{dtc.faultCode}</span>
                      <span className="truncate max-w-sm text-slate-400">{dtc.problemDescription}</span>
                    </div>
                    <span className="text-emerald-400 text-[11px]">Resolved</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 px-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono uppercase font-bold transition"
          >
            Close Telemetry Bay
          </button>
        </div>
      </div>
    </div>
  );
};
