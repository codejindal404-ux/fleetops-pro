import React, { useState } from 'react';
import { Receipt, CreditCard, Plus, CheckCircle2 } from 'lucide-react';
import { Invoice, Booking, User } from '../types.ts';

interface InvoicesViewProps {
  invoices: Invoice[];
  bookings: Booking[];
  user: User | null;
  onPayInvoice: (id: string) => void;
  onCreateInvoice: (bookingId: string, serviceCharges: number, partsCost: number, tax: number) => void;
  searchTerm: string;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  bookings,
  user,
  onPayInvoice,
  onCreateInvoice,
  searchTerm
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [serviceCharges, setServiceCharges] = useState<number>(150);
  const [partsCost, setPartsCost] = useState<number>(50);
  const [tax, setTax] = useState<number>(15);

  const completedBookingsWithoutInvoice = bookings.filter(
    (b) => b.status === 'COMPLETED' && !invoices.some((inv) => inv.bookingId === b.id)
  );

  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = filterStatus === 'ALL' || inv.status === filterStatus;
    const matchesSearch =
      !searchTerm ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.customer?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId) return;
    onCreateInvoice(selectedBookingId, serviceCharges, partsCost, tax);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-['Oswald'] uppercase">Invoices & Bay Billing</h2>
          <p className="text-xs text-slate-500 mt-0.5">Billing management, parts ledger, and digital payment receipts.</p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm font-['Oswald'] uppercase tracking-wider active:scale-98"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Generate Invoice</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          {['ALL', 'UNPAID', 'PAID'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                filterStatus === st
                  ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {st} INVOICES
            </button>
          ))}
        </div>
        <span className="text-xs font-mono text-slate-500">{filteredInvoices.length} records</span>
      </div>

      {/* Invoices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInvoices.length === 0 ? (
          <div className="col-span-full bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500 shadow-sm">
            <div className="w-14 h-14 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 mx-auto mb-4">
              <Receipt className="w-7 h-7" />
            </div>
            <p className="text-sm font-bold text-slate-800">No invoices found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">There are no billing records or receipts matching your current selection.</p>
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <div key={inv.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm space-y-4 hover:border-slate-300 transition-all">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono font-bold text-xs text-amber-600">{inv.id}</span>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">Booking: {inv.bookingId}</p>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase ${
                    inv.status === 'PAID'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                      : 'bg-rose-50 text-rose-700 border border-rose-300'
                  }`}
                >
                  {inv.status}
                </span>
              </div>

              <div className="space-y-1.5 border-t border-b border-slate-200 py-3 text-xs font-mono">
                <div className="flex justify-between text-slate-500">
                  <span>Labor Charges:</span>
                  <span className="font-semibold text-slate-800">${inv.serviceCharges.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Spare Parts:</span>
                  <span className="font-semibold text-slate-800">${inv.partsCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax & Fees:</span>
                  <span className="font-semibold text-slate-800">${inv.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200 text-sm">
                  <span>Total Settlement:</span>
                  <span className="text-amber-600 font-extrabold">${inv.amount.toFixed(2)}</span>
                </div>
              </div>

              {inv.status === 'UNPAID' ? (
                <button
                  onClick={() => onPayInvoice(inv.id)}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 font-['Oswald'] uppercase tracking-wider"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Settle Invoice</span>
                </button>
              ) : (
                <div className="text-center text-xs font-mono font-bold text-emerald-700 bg-emerald-50 py-2 rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>PAID ON {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : 'TODAY'}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Admin Create Invoice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 font-['Oswald'] uppercase">Generate Service Invoice</h3>
            <p className="text-xs text-slate-500">Select a completed service booking and calculate labor & parts billing.</p>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-mono font-bold mb-1">Completed Booking</label>
                <select
                  value={selectedBookingId}
                  onChange={(e) => setSelectedBookingId(e.target.value)}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="">-- Select Completed Job --</option>
                  {completedBookingsWithoutInvoice.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.id} - {b.serviceType} ({b.vehicle?.brand} {b.vehicle?.model})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase mb-1">Labor ($)</label>
                  <input
                    type="number"
                    value={serviceCharges}
                    onChange={(e) => setServiceCharges(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase mb-1">Parts ($)</label>
                  <input
                    type="number"
                    value={partsCost}
                    onChange={(e) => setPartsCost(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-mono text-[10px] uppercase mb-1">Tax ($)</label>
                  <input
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between font-mono font-bold text-slate-900 text-xs">
                <span>Calculated Total:</span>
                <span className="text-amber-600">${(serviceCharges + partsCost + tax).toFixed(2)}</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 border border-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl font-['Oswald'] uppercase tracking-wider"
                >
                  Issue Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
