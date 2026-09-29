import React, { useState, useEffect } from 'react';
import {
  X,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  BatteryCharging,
  Gauge,
  Disc,
  Layers,
  Save,
  Check,
  ShieldCheck
} from 'lucide-react';
import { Booking, RepairInspectionReport, InspectionChecklistItem } from '../../types.ts';

interface VehicleInspectionModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  existingInspection?: RepairInspectionReport | null;
  onSaveInspection: (data: {
    bookingId: string;
    vehicleId: string;
    engineHealthScore: number;
    batteryVoltage: string;
    batteryHealthPercent: number;
    brakeWearPercent: number;
    tireCondition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'REPLACE_SOON';
    tireTreadDepthMm: number;
    overallResult: 'PASS' | 'ATTENTION' | 'CRITICAL_FAIL';
    items: InspectionChecklistItem[];
    summaryNotes: string;
  }) => Promise<void>;
}

const INITIAL_CHECKLIST_ITEMS: InspectionChecklistItem[] = [
  { id: '1', name: 'Engine Oil & Filter Integrity', category: 'ENGINE', status: 'PASS', note: 'Nominal viscosity and level' },
  { id: '2', name: 'Coolant Level & Radiator Pressure Test', category: 'FLUIDS', status: 'PASS', note: 'Holding 16 PSI pressure test' },
  { id: '3', name: 'Brake Fluid Moisture Level & Lines', category: 'BRAKES', status: 'PASS', note: '<1% moisture detected, lines dry' },
  { id: '4', name: 'Front & Rear Brake Pads / Rotors', category: 'BRAKES', status: 'PASS', note: 'Front pads 7.5mm, rear 6.8mm' },
  { id: '5', name: 'Tire Pressure & Outer/Inner Tread Wear', category: 'TIRES', status: 'PASS', note: 'Even wear pattern, 34 PSI' },
  { id: '6', name: '12V Lead-Acid / AGM Battery Output', category: 'ELECTRICAL', status: 'PASS', note: '14.1V alternator charging under load' },
  { id: '7', name: 'Starter Motor & Ignition Coils', category: 'ELECTRICAL', status: 'PASS', note: 'Cranking RPM nominal' },
  { id: '8', name: 'Suspension Struts, Bushings & Ball Joints', category: 'SUSPENSION', status: 'PASS', note: 'No fluid leaks or abnormal play' },
  { id: '9', name: 'Exhaust System & Catalytic Shielding', category: 'EXHAUST', status: 'PASS', note: 'No exhaust leaks or hanger wear' }
];

export const VehicleInspectionModal: React.FC<VehicleInspectionModalProps> = ({
  booking,
  isOpen,
  onClose,
  existingInspection,
  onSaveInspection
}) => {
  const [engineHealthScore, setEngineHealthScore] = useState<number>(92);
  const [batteryVoltage, setBatteryVoltage] = useState<string>('12.6V');
  const [batteryHealthPercent, setBatteryHealthPercent] = useState<number>(94);
  const [brakeWearPercent, setBrakeWearPercent] = useState<number>(20);
  const [tireCondition, setTireCondition] = useState<'EXCELLENT' | 'GOOD' | 'FAIR' | 'REPLACE_SOON'>('GOOD');
  const [tireTreadDepthMm, setTireTreadDepthMm] = useState<number>(6.0);
  const [items, setItems] = useState<InspectionChecklistItem[]>(INITIAL_CHECKLIST_ITEMS);
  const [summaryNotes, setSummaryNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (existingInspection) {
      setEngineHealthScore(existingInspection.engineHealthScore || 92);
      setBatteryVoltage(existingInspection.batteryVoltage || '12.6V');
      setBatteryHealthPercent(existingInspection.batteryHealthPercent || 94);
      setBrakeWearPercent(existingInspection.brakeWearPercent || 20);
      setTireCondition(existingInspection.tireCondition || 'GOOD');
      setTireTreadDepthMm(existingInspection.tireTreadDepthMm || 6.0);
      if (existingInspection.items && existingInspection.items.length > 0) {
        setItems(existingInspection.items);
      }
      setSummaryNotes(existingInspection.summaryNotes || '');
    }
  }, [existingInspection]);

  if (!isOpen) return null;

  const handleItemStatus = (id: string, status: 'PASS' | 'ATTENTION' | 'FAIL') => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const handleItemNote = (id: string, note: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, note } : item))
    );
  };

  // Overall result computation
  const failCount = items.filter((i) => i.status === 'FAIL').length;
  const attentionCount = items.filter((i) => i.status === 'ATTENTION').length;

  let overallResult: 'PASS' | 'ATTENTION' | 'CRITICAL_FAIL' = 'PASS';
  if (failCount > 0 || engineHealthScore < 60 || brakeWearPercent > 80) {
    overallResult = 'CRITICAL_FAIL';
  } else if (attentionCount > 0 || engineHealthScore < 80 || brakeWearPercent > 60) {
    overallResult = 'ATTENTION';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveInspection({
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        engineHealthScore,
        batteryVoltage,
        batteryHealthPercent,
        brakeWearPercent,
        tireCondition,
        tireTreadDepthMm,
        overallResult,
        items,
        summaryNotes: summaryNotes.trim() || 'Comprehensive multi-point vehicle inspection completed and signed by master technician.'
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Multi-Point Vehicle Inspection
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {booking.vehicle?.brand} {booking.vehicle?.model} ({booking.vehicle?.registrationNumber})
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Oswald'] uppercase mt-1">
                Vehicle Health & Safety Sign-Off
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

        {/* Content Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Telemetry Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Engine Health Score */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Engine Health</span>
                <Activity className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono">{engineHealthScore}%</div>
              <input
                type="range"
                min="30"
                max="100"
                value={engineHealthScore}
                onChange={(e) => setEngineHealthScore(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>

            {/* Battery Voltage & Health */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Battery Voltage</span>
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-emerald-300 font-mono">{batteryVoltage}</div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={batteryVoltage}
                  onChange={(e) => setBatteryVoltage(e.target.value)}
                  placeholder="e.g. 12.6V"
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Brake Wear % */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Brake Pad Wear</span>
                <Disc className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xl font-bold text-rose-300 font-mono">{brakeWearPercent}% <span className="text-xs text-slate-500 font-normal">worn</span></div>
              <input
                type="range"
                min="0"
                max="100"
                value={brakeWearPercent}
                onChange={(e) => setBrakeWearPercent(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
            </div>

            {/* Tire Tread Depth */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Tire Tread Depth</span>
                <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold text-cyan-300 font-mono">{tireTreadDepthMm} <span className="text-xs text-slate-500 font-normal">mm</span></div>
              <select
                value={tireCondition}
                onChange={(e) => setTireCondition(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-[11px] text-white font-mono"
              >
                <option value="EXCELLENT">Condition: EXCELLENT</option>
                <option value="GOOD">Condition: GOOD</option>
                <option value="FAIR">Condition: FAIR</option>
                <option value="REPLACE_SOON">REPLACE SOON</option>
              </select>
            </div>
          </div>

          {/* Checklist Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
                Multi-Point Inspection Checklist ({items.length} Points)
              </h3>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-emerald-400 font-bold">{items.filter((i) => i.status === 'PASS').length} Pass</span>
                <span className="text-amber-400 font-bold">{attentionCount} Attention</span>
                <span className="text-rose-400 font-bold">{failCount} Fail</span>
              </div>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300">
                        {item.category}
                      </span>
                      <span className="text-sm font-semibold text-white">{item.name}</span>
                    </div>
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => handleItemNote(item.id, e.target.value)}
                      placeholder="Technician observation..."
                      className="w-full bg-slate-900/80 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  {/* 3 Status Switchers */}
                  <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleItemStatus(item.id, 'PASS')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono uppercase font-bold transition flex items-center justify-center gap-1 ${
                        item.status === 'PASS'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      Pass
                    </button>

                    <button
                      type="button"
                      onClick={() => handleItemStatus(item.id, 'ATTENTION')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono uppercase font-bold transition flex items-center justify-center gap-1 ${
                        item.status === 'ATTENTION'
                          ? 'bg-amber-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <AlertTriangle className="w-3 h-3" />
                      Caution
                    </button>

                    <button
                      type="button"
                      onClick={() => handleItemStatus(item.id, 'FAIL')}
                      className={`px-3 py-1 rounded-lg text-xs font-mono uppercase font-bold transition flex items-center justify-center gap-1 ${
                        item.status === 'FAIL'
                          ? 'bg-rose-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <X className="w-3 h-3" />
                      Fail
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Master Summary Notes */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Master Diagnostic & Safety Summary Notes
            </label>
            <textarea
              rows={3}
              placeholder="Overall technician assessment, recommendations, safety sign-off..."
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-white text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Overall Rating Banner */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase">Calculated Overall Result</div>
                <div className="text-sm font-bold text-white uppercase font-mono">
                  {overallResult === 'PASS' && <span className="text-emerald-400">All Safety Systems Passed</span>}
                  {overallResult === 'ATTENTION' && <span className="text-amber-400">Advisory Items Requiring Attention</span>}
                  {overallResult === 'CRITICAL_FAIL' && <span className="text-rose-400">Critical Mechanical / Safety Defect</span>}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold uppercase transition flex items-center gap-2 shadow-lg shadow-emerald-950/50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Saving Report...' : 'Sign & Submit Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
