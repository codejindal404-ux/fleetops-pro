import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  Truck,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Booking, SparePartCatalogItem, SparePartsRequest, SparePartsUrgency } from '../../types.ts';

interface SparePartsModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  partsCatalog: SparePartCatalogItem[];
  partsRequests: SparePartsRequest[];
  onRequestPart: (data: {
    bookingId: string;
    vehicleId: string;
    partId: string;
    partName: string;
    partCode: string;
    quantityRequired: number;
    unitCost: number;
    urgency: SparePartsUrgency;
    notes: string;
  }) => Promise<void>;
}

export const SparePartsModal: React.FC<SparePartsModalProps> = ({
  booking,
  isOpen,
  onClose,
  partsCatalog,
  partsRequests,
  onRequestPart
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatalogPart, setSelectedCatalogPart] = useState<SparePartCatalogItem | null>(null);
  const [customPartName, setCustomPartName] = useState('');
  const [customPartCode, setCustomPartCode] = useState('');
  const [quantityRequired, setQuantityRequired] = useState<number>(1);
  const [unitCost, setUnitCost] = useState<number>(45);
  const [urgency, setUrgency] = useState<SparePartsUrgency>('NORMAL');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSelectFromCatalog = (part: SparePartCatalogItem) => {
    setSelectedCatalogPart(part);
    setCustomPartName(part.name);
    setCustomPartCode(part.partNumber);
    setUnitCost(part.unitPrice);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPartName = selectedCatalogPart ? selectedCatalogPart.name : customPartName.trim();
    if (!finalPartName) return;

    setIsSubmitting(true);
    try {
      await onRequestPart({
        bookingId: booking.id,
        vehicleId: booking.vehicleId,
        partId: selectedCatalogPart ? selectedCatalogPart.id : `part-custom-${Date.now()}`,
        partName: finalPartName,
        partCode: selectedCatalogPart ? selectedCatalogPart.partNumber : customPartCode.trim() || 'PART-CUSTOM',
        quantityRequired: Math.max(1, quantityRequired),
        unitCost: Math.max(0, unitCost),
        urgency,
        notes: notes.trim() || 'Requisition for vehicle bay service'
      });
      setSelectedCatalogPart(null);
      setCustomPartName('');
      setCustomPartCode('');
      setQuantityRequired(1);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredCatalog = partsCatalog.filter((p) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.partNumber.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );
  });

  const getUrgencyBadge = (u: SparePartsUrgency) => {
    switch (u) {
      case 'URGENT':
        return 'bg-red-500/20 text-red-400 border-red-500/40 ring-1 ring-red-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'NORMAL':
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'INSTALLED':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'DISPATCHED':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'APPROVED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'PENDING':
      default:
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Parts Requisition & Inventory Bay
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {booking.vehicle?.brand} {booking.vehicle?.model} ({booking.vehicle?.registrationNumber})
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-['Oswald'] uppercase mt-1">
                Workshop Spare Parts Management
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

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Two-Column Grid: Catalog Search on Left, Requisition Form on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Searchable Catalog */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-amber-400" />
                  Live Warehouse Catalog ({filteredCatalog.length} Parts)
                </h3>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search brake pads, filters, spark plugs, sensors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Catalog Items Scrollable List */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredCatalog.map((part) => (
                  <div
                    key={part.id}
                    onClick={() => handleSelectFromCatalog(part)}
                    className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                      selectedCatalogPart?.id === part.id
                        ? 'bg-amber-500/10 border-amber-500/50 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{part.name}</span>
                        <span className="px-2 py-0.2 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400">
                          {part.partNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                        <span>Category: {part.category}</span>
                        <span>•</span>
                        <span className={part.inStock > 5 ? 'text-emerald-400' : 'text-amber-400'}>
                          {part.inStock} in stock
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400 font-mono">${part.unitPrice}</div>
                      <span className="text-[10px] text-slate-500 font-mono uppercase">Select Part</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 5 cols: Request Form */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-mono uppercase text-amber-400 font-bold flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                  Requisition Order Form
                </h3>
                {selectedCatalogPart && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCatalogPart(null);
                      setCustomPartName('');
                      setCustomPartCode('');
                    }}
                    className="text-[11px] font-mono text-slate-400 hover:text-white"
                  >
                    Clear Selection
                  </button>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                    Part Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ceramic Front Brake Pads"
                    value={selectedCatalogPart ? selectedCatalogPart.name : customPartName}
                    onChange={(e) => setCustomPartName(e.target.value)}
                    disabled={!!selectedCatalogPart}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono disabled:opacity-75"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Part Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BP-CER-04"
                      value={selectedCatalogPart ? selectedCatalogPart.partNumber : customPartCode}
                      onChange={(e) => setCustomPartCode(e.target.value.toUpperCase())}
                      disabled={!!selectedCatalogPart}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono uppercase disabled:opacity-75"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Urgency
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(e.target.value as SparePartsUrgency)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent (Line Down)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Qty Required
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantityRequired}
                      onChange={(e) => setQuantityRequired(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                      Unit Cost ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-300 uppercase mb-1">
                    Technician Requisition Reason
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Reason for replacement or special fitment instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-xs"
                  />
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">Total Request Value</span>
                  <span className="text-base font-bold text-amber-400 font-mono">
                    ${(quantityRequired * unitCost).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold uppercase transition flex items-center justify-center gap-2 shadow-lg shadow-amber-950/50"
                >
                  <Truck className="w-4 h-4" />
                  {isSubmitting ? 'Requesting...' : 'Dispatch Requisition Order'}
                </button>
              </form>
            </div>
          </div>

          {/* Active Requisition Queue */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider">
              Requisition History & Parts Dispatch Queue ({partsRequests.length})
            </h3>

            {partsRequests.length === 0 ? (
              <div className="p-6 text-center bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-slate-400 text-xs font-mono">
                No spare parts requisitions submitted for this job yet.
              </div>
            ) : (
              <div className="space-y-2">
                {partsRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white">{req.partName}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300">
                          {req.partCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase ${getUrgencyBadge(req.urgency)}`}>
                          {req.urgency}
                        </span>
                      </div>
                      <div className="text-slate-400 text-[11px] font-mono">
                        Qty: {req.quantityRequired} • Total: ${req.totalCost} • Requested by {req.mechanicName || 'Technician'} • {new Date(req.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-xl border font-mono text-xs font-bold uppercase ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-4 px-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono uppercase font-bold transition"
          >
            Close Parts Hub
          </button>
        </div>
      </div>
    </div>
  );
};
