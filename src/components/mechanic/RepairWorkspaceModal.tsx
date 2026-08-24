import React, { useState } from 'react';
import {
  X,
  Wrench,
  Clock,
  DollarSign,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Activity,
  UserCheck,
  Package,
  Layers,
  Sparkles
} from 'lucide-react';
import { Booking, RepairLog, ReplacedPartItem } from '../../types.ts';

interface RepairWorkspaceModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onAddLog: (data: {
    bookingId: string;
    action?: string;
    note: string;
    partsReplaced?: ReplacedPartItem[];
    hoursSpent?: number;
    labourRate?: number;
    labourCost?: number;
    partsCost?: number;
    cost?: number;
    progressPercentage?: number;
  }) => Promise<void>;
}

export const RepairWorkspaceModal: React.FC<RepairWorkspaceModalProps> = ({
  booking,
  isOpen,
  onClose,
  onAddLog
}) => {
  const [actionTitle, setActionTitle] = useState('Brake & Fluid Service Operation');
  const [note, setNote] = useState('');
  const [hoursSpent, setHoursSpent] = useState<number>(1.5);
  const [labourRate, setLabourRate] = useState<number>(85);
  const [progressPercentage, setProgressPercentage] = useState<number>(
    booking.progressPercentage || (booking.status === 'COMPLETED' ? 100 : 60)
  );
  const [parts, setParts] = useState<ReplacedPartItem[]>([
    { partName: 'Synthetic 5W-30 Motor Oil', partCode: 'OIL-5W30-SYN', quantity: 5, unitCost: 12 },
    { partName: 'OEM High-Flow Oil Filter', partCode: 'FLT-ENG-08', quantity: 1, unitCost: 18 }
  ]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartCode, setNewPartCode] = useState('');
  const [newPartQty, setNewPartQty] = useState<number>(1);
  const [newPartPrice, setNewPartPrice] = useState<number>(35);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddPart = () => {
    if (!newPartName.trim()) return;
    setParts((prev) => [
      ...prev,
      {
        partName: newPartName.trim(),
        partCode: newPartCode.trim() || 'PART-GEN',
        quantity: Math.max(1, newPartQty),
        unitCost: Math.max(0, newPartPrice)
      }
    ]);
    setNewPartName('');
    setNewPartCode('');
    setNewPartQty(1);
    setNewPartPrice(35);
  };

  const handleRemovePart = (index: number) => {
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const calculatedLabourCost = Number((hoursSpent * labourRate).toFixed(2));
  const calculatedPartsCost = Number(
    parts.reduce((sum, p) => sum + p.quantity * p.unitCost, 0).toFixed(2)
  );
  const calculatedTotalCost = Number((calculatedLabourCost + calculatedPartsCost).toFixed(2));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddLog({
        bookingId: booking.id,
        action: actionTitle.trim() || 'Repair Operation',
        note: note.trim(),
        partsReplaced: parts,
        hoursSpent,
        labourRate,
        labourCost: calculatedLabourCost,
        partsCost: calculatedPartsCost,
        cost: calculatedTotalCost,
        progressPercentage
      });
      setNote('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const existingLogs = booking.repairLogs || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Technician Repair Workspace
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Work Order #{booking.id.slice(-6).toUpperCase()} • {booking.vehicle?.brand} {booking.vehicle?.model}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Oswald'] uppercase mt-1">
                Log Mechanical Work & Billable Costs
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
          {/* Action & Progress */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Operation / Work Category Title
              </label>
              <input
                type="text"
                required
                value={actionTitle}
                onChange={(e) => setActionTitle(e.target.value)}
                placeholder="e.g. Front Brake Pad Replacement & Rotor Machining"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                Job Progress ({progressPercentage}%)
              </label>
              <div className="pt-2">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={progressPercentage}
                  onChange={(e) => setProgressPercentage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Detailed Technical Note */}
          <div>
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
              Technician Diagnosis & Service Execution Notes <span className="text-red-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Detail mechanical adjustments, torque specifications, fluids flushed, test drive results..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Labour Tracking */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Labour Hours & Bay Time
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Labour Subtotal: ${calculatedLabourCost.toFixed(2)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Hours Spent
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="40"
                  value={hoursSpent}
                  onChange={(e) => setHoursSpent(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  Technician Rate ($/Hour)
                </label>
                <input
                  type="number"
                  step="5"
                  min="20"
                  value={labourRate}
                  onChange={(e) => setLabourRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Spare Parts Itemized Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-amber-400" />
                Spare Parts Replaced & Consumables
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Parts Subtotal: ${calculatedPartsCost.toFixed(2)}
              </span>
            </div>

            {/* List of current parts */}
            <div className="space-y-2">
              {parts.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 text-[11px] font-semibold">{p.partCode}</span>
                    <span className="text-white font-bold">{p.partName}</span>
                    <span className="text-slate-400">({p.quantity}x @ ${p.unitCost})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold">${(p.quantity * p.unitCost).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePart(idx)}
                      className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Part Row */}
            <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Part Name (e.g. Brake Pads)"
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Part Code (e.g. BP-01)"
                value={newPartCode}
                onChange={(e) => setNewPartCode(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono"
              />
              <div className="flex gap-1.5">
                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={newPartQty}
                  onChange={(e) => setNewPartQty(Number(e.target.value))}
                  className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Unit $"
                  value={newPartPrice}
                  onChange={(e) => setNewPartPrice(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleAddPart}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-mono font-bold flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Part
              </button>
            </div>
          </div>

          {/* Cost Summary Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-mono text-slate-400 uppercase">Calculated Work Order Billable</div>
                <div className="text-lg font-bold text-white font-mono">
                  Labour: <span className="text-emerald-400">${calculatedLabourCost.toFixed(2)}</span> + Parts: <span className="text-emerald-400">${calculatedPartsCost.toFixed(2)}</span> = <span className="text-amber-400 text-xl font-bold">${calculatedTotalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50"
            >
              <CheckCircle2 className="w-4 h-4" />
              {isSubmitting ? 'Recording Log...' : 'Commit Repair Log'}
            </button>
          </div>

          {/* Existing Chronological Log Feed */}
          {existingLogs.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-slate-800">
              <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
                Chronological Service Logs ({existingLogs.length})
              </h3>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {existingLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className="font-bold text-amber-400">{log.action || 'Repair Log'}</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-200">{log.note}</p>
                    {log.cost && log.cost > 0 ? (
                      <div className="text-[11px] font-mono text-emerald-400">
                        Added Cost: ${log.cost.toFixed(2)} (Labour: ${log.labourCost || 0}, Parts: ${log.partsCost || 0})
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
