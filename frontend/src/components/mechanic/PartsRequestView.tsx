import React, { useState } from 'react';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  Search,
  Send,
  XCircle
} from 'lucide-react';
import { SparePartsRequest, SparePartCatalogItem, Booking } from '../../types.ts';

interface PartsRequestViewProps {
  catalog?: SparePartCatalogItem[];
  requests?: SparePartsRequest[];
  selectedBooking?: Booking | null;
  onSubmitRequest?: (data: {
    bookingId: string;
    partName: string;
    partCode?: string;
    quantityRequired: number;
    unitCost?: number;
    urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
    notes?: string;
  }) => Promise<void> | void;
  onApproveRequest?: (requestId: string, status: 'APPROVED' | 'REJECTED') => Promise<void> | void;
}

const DEFAULT_CATALOG: SparePartCatalogItem[] = [
  { id: 'part-1', name: 'Ceramic Front Brake Pads', code: 'BP-CER-01', partNumber: 'BP-CER-01', category: 'Brakes', price: 65, unitPrice: 65, costPrice: 48, stockQuantity: 14, inStock: 14, reorderLevel: 5, unit: 'set', status: 'IN_STOCK' },
  { id: 'part-2', name: 'Synthetic Engine Oil 5W-30 (5L)', code: 'OIL-SYN-5W30', partNumber: 'OIL-SYN-5W30', category: 'Fluids', price: 45, unitPrice: 45, costPrice: 30, stockQuantity: 3, inStock: 3, reorderLevel: 6, unit: 'litre', status: 'LOW_STOCK' },
  { id: 'part-3', name: 'High Performance Air Filter', code: 'FLT-AIR-99', partNumber: 'FLT-AIR-99', category: 'Filters', price: 28, unitPrice: 28, costPrice: 18, stockQuantity: 18, inStock: 18, reorderLevel: 4, unit: 'unit', status: 'IN_STOCK' },
  { id: 'part-4', name: '12V AGM Starter Battery 70Ah', code: 'BAT-AGM-70', partNumber: 'BAT-AGM-70', category: 'Electrical', price: 160, unitPrice: 160, costPrice: 110, stockQuantity: 2, inStock: 2, reorderLevel: 3, unit: 'unit', status: 'LOW_STOCK' },
  { id: 'part-5', name: 'Platinum Spark Plugs (Set of 4)', code: 'SPK-PLT-04', partNumber: 'SPK-PLT-04', category: 'Ignition', price: 48, unitPrice: 48, costPrice: 32, stockQuantity: 9, inStock: 9, reorderLevel: 4, unit: 'set', status: 'IN_STOCK' },
  { id: 'part-6', name: 'Ventilated Front Brake Rotor (Pair)', code: 'ROT-VENT-02', partNumber: 'ROT-VENT-02', category: 'Brakes', price: 140, unitPrice: 140, costPrice: 95, stockQuantity: 1, inStock: 1, reorderLevel: 3, unit: 'pair', status: 'LOW_STOCK' },
  { id: 'part-7', name: 'Engine Coolant Premix (4L)', code: 'CLN-PRE-04', partNumber: 'CLN-PRE-04', category: 'Fluids', price: 32, unitPrice: 32, costPrice: 22, stockQuantity: 12, inStock: 12, reorderLevel: 4, unit: 'litre', status: 'IN_STOCK' }
];

export const PartsRequestView: React.FC<PartsRequestViewProps> = ({
  catalog = DEFAULT_CATALOG,
  requests = [],
  selectedBooking,
  onSubmitRequest,
  onApproveRequest
}) => {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'MY_REQUESTS'>('CATALOG');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // New Request Form State
  const [selectedPart, setSelectedPart] = useState<SparePartCatalogItem | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [urgency, setUrgency] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'>('NORMAL');
  const [notes, setNotes] = useState<string>('');
  const [customPartName, setCustomPartName] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<number>(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Filter Catalog
  const categories = ['ALL', 'Brakes', 'Fluids', 'Filters', 'Electrical', 'Ignition'];
  const filteredCatalog = catalog.filter((item) => {
    const catMatch = selectedCategory === 'ALL' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const searchMatch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.code || '').toLowerCase().includes(q) ||
      (item.partNumber || '').toLowerCase().includes(q);
    return catMatch && searchMatch;
  });

  // Low stock alerts using reorderLevel and stockQuantity
  const lowStockAlerts = catalog.filter((item) => {
    const stock = item.stockQuantity ?? item.inStock ?? 0;
    const threshold = item.reorderLevel ?? 3;
    return stock <= threshold;
  });

  const getItemPrice = (part: SparePartCatalogItem) => part.price ?? part.unitPrice ?? part.costPrice ?? 0;
  const getItemStock = (part: SparePartCatalogItem) => part.stockQuantity ?? part.inStock ?? 0;
  const getItemThreshold = (part: SparePartCatalogItem) => part.reorderLevel ?? 3;

  const handleSelectPart = (part: SparePartCatalogItem) => {
    setSelectedPart(part);
    setCustomPartName(part.name);
    setCustomPrice(getItemPrice(part));
    setQuantity(1);
  };

  const handleSubmitRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    const partName = selectedPart ? selectedPart.name : customPartName.trim();
    if (!partName) return;

    try {
      setIsSubmitting(true);
      if (onSubmitRequest) {
        await onSubmitRequest({
          bookingId: selectedBooking ? selectedBooking.id : 'bk-general-workshop',
          partName,
          partCode: selectedPart ? (selectedPart.code || selectedPart.partNumber || 'OEM') : 'CUSTOM-REQ',
          quantityRequired: quantity,
          unitCost: selectedPart ? getItemPrice(selectedPart) : customPrice,
          urgency,
          notes: notes.trim()
        });
      }
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      setSelectedPart(null);
      setCustomPartName('');
      setNotes('');
      setQuantity(1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Overview */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-purple-400" />
            Spare Parts Management
          </h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Workshop parts requisitions, live inventory thresholds &amp; dispatch approvals
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('CATALOG')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'CATALOG'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Inventory Catalog ({catalog.length})
          </button>
          <button
            onClick={() => setActiveTab('MY_REQUESTS')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'MY_REQUESTS'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Requisition Logs ({requests.length})
          </button>
        </div>
      </div>

      {/* Stock Alert Warning Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-amber-200">
                Low Inventory Stock Alert ({lowStockAlerts.length} items below minimum threshold)
              </h4>
              <span className="text-xs text-amber-400/80 font-medium">Re-order Recommended</span>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {lowStockAlerts.map((item) => (
                <span
                  key={item.id}
                  className="px-2.5 py-1 rounded-lg bg-amber-900/40 border border-amber-700/50 text-amber-300 text-xs font-medium flex items-center gap-1.5"
                >
                  <span>{item.name}</span>
                  <span className="font-mono text-amber-400 font-bold">({getItemStock(item)} left)</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CATALOG' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Catalog & Search (2 Columns) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Category Pills */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search parts by name or OEM code..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Parts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredCatalog.map((part) => {
                const stock = getItemStock(part);
                const threshold = getItemThreshold(part);
                const isLowStock = stock > 0 && stock <= threshold;
                const isOutOfStock = stock === 0 || part.status === 'OUT_OF_STOCK';
                const isSelected = selectedPart?.id === part.id;

                return (
                  <div
                    key={part.id}
                    onClick={() => handleSelectPart(part)}
                    className={`cursor-pointer p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-purple-950/40 border-purple-500 ring-1 ring-purple-500/50'
                        : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                          {part.code || part.partNumber}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5 leading-snug">
                          {part.name}
                        </h4>
                      </div>
                      <span className="text-sm font-extrabold text-emerald-400 font-mono">
                        ${getItemPrice(part)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3 text-xs">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {part.category}
                      </span>

                      {isOutOfStock ? (
                        <span className="text-rose-400 font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Out of stock
                        </span>
                      ) : isLowStock ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Low stock ({stock})
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> In stock ({stock})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Requisition Action Panel (1 Column) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 h-fit shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-purple-400" />
                Request Spare Part
              </h3>
              {selectedBooking && (
                <span className="text-xs font-mono text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                  #{selectedBooking.id.slice(-6)}
                </span>
              )}
            </div>

            {showSuccessToast && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Requisition submitted to inventory manager!</span>
              </div>
            )}

            <form onSubmit={handleSubmitRequisition} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Selected / Custom Part</label>
                <input
                  type="text"
                  placeholder="Click part above or type custom part..."
                  value={customPartName}
                  onChange={(e) => setCustomPartName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    required
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Unit Cost ($)</label>
                  <input
                    type="number"
                    min="1"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Math.max(1, parseFloat(e.target.value) || 0))}
                    required
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Requisition Urgency</label>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value as 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL')}
                  aria-label="Requisition Urgency"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="LOW">Low (Routine maintenance)</option>
                  <option value="NORMAL">Normal (Standard repair)</option>
                  <option value="HIGH">High (Customer waiting in bay)</option>
                  <option value="CRITICAL">Critical (Vehicle disabled)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Notes / Reason</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Brake pads worn down to 2mm, immediate replacement required."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Total Estimated Cost */}
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Total Estimated Cost:</span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  ${(quantity * customPrice).toFixed(2)}
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !customPartName.trim()}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Parts Request</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'MY_REQUESTS' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
          {requests.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">No parts requisitions logged yet</h4>
              <p className="text-xs text-slate-500 mt-1">
                Select parts from the inventory catalog to submit a requisition for approval.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">Part Details</th>
                    <th className="px-5 py-3.5">Qty</th>
                    <th className="px-5 py-3.5">Estimated Cost</th>
                    <th className="px-5 py-3.5">Urgency</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white">{req.partName}</div>
                        <div className="text-slate-400 font-mono text-[11px]">{req.partCode || 'OEM'}</div>
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-slate-200">
                        {req.quantityRequired}x
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-emerald-400">
                        ${req.totalCost || (req.quantityRequired * req.unitCost)}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          req.urgency === 'URGENT' ? 'bg-rose-500/20 text-rose-400' :
                          req.urgency === 'HIGH' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {req.urgency}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${
                          req.status === 'APPROVED' || req.status === 'DISPATCHED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : req.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          {req.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {req.status === 'PENDING' && onApproveRequest && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onApproveRequest(req.id, 'APPROVED')}
                              className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded border border-emerald-500/40 text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onApproveRequest(req.id, 'REJECTED')}
                              className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 rounded border border-rose-500/40 text-[11px] font-semibold"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PartsRequestView;
