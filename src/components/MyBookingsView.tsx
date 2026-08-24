import React, { useState } from 'react';
import { Calendar, CreditCard, CheckCircle2, Eye, Plus, Trash2, Loader2 } from 'lucide-react';
import { Booking, Invoice, User } from '../types.ts';

interface MyBookingsViewProps {
  bookings: Booking[];
  invoices: Invoice[];
  user: User | null;
  onSelectBooking: (booking: Booking) => void;
  onPayInvoice: (invoiceId: string) => void;
  onOpenNewService: () => void;
  onDeleteBooking?: (bookingId: string) => Promise<void>;
  onDeleteAllBookings?: () => Promise<void>;
  searchTerm: string;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  invoices,
  user,
  onSelectBooking,
  onPayInvoice,
  onOpenNewService,
  onDeleteBooking,
  onDeleteAllBookings,
  searchTerm
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState<boolean>(false);
  const unpaidInvoices = invoices.filter((inv) => inv.status === 'UNPAID');

  const filteredBookings = bookings.filter((b) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      b.id.toLowerCase().includes(q) ||
      b.serviceType.toLowerCase().includes(q) ||
      b.vehicle?.brand.toLowerCase().includes(q) ||
      b.vehicle?.registrationNumber.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-300">PENDING</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-300">APPROVED</span>;
      case 'ASSIGNED':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-300">ASSIGNED</span>;
      case 'REPAIRING':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 animate-pulse">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-300">COMPLETED</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-300">CANCELLED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-['Oswald'] uppercase">Bookings & Invoices</h2>
          <p className="text-xs text-slate-500 mt-0.5">Manage service request pipeline and settle outstanding bay invoices.</p>
        </div>
        <button
          onClick={onOpenNewService}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-sm font-['Oswald'] uppercase tracking-wider active:scale-98"
        >
          <Calendar className="w-4 h-4 text-slate-950" />
          <span>Book New Service</span>
        </button>
      </div>

      {/* Grid: Bookings Table + Unpaid Invoices */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Bookings Table (8 Cols) */}
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-['Oswald'] uppercase tracking-wide">Service Bookings Pipeline</h3>
              <span className="text-xs font-mono text-amber-600 font-bold">{filteredBookings.length} total</span>
            </div>
            {onDeleteAllBookings && (user?.role === 'ADMIN' || bookings.length > 0) && (
              <button
                onClick={async () => {
                  if (!window.confirm('Are you sure you want to delete ALL bookings? This action cannot be undone.')) return;
                  setClearingAll(true);
                  try {
                    await onDeleteAllBookings();
                  } finally {
                    setClearingAll(false);
                  }
                }}
                disabled={clearingAll || bookings.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold font-['Oswald'] uppercase tracking-wider transition-all disabled:opacity-50"
                title="Delete all bookings"
              >
                {clearingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete All Bookings</span>
              </button>
            )}
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-5">ID</th>
                  <th className="py-3.5 px-5">Vehicle</th>
                  <th className="py-3.5 px-5">Service Type</th>
                  <th className="py-3.5 px-5">Preferred Date</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-200">
                          <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">No service bookings found</p>
                          <p className="text-[11px] text-slate-500 mt-1">You currently have no service bookings associated with your account.</p>
                        </div>
                        <button
                          onClick={onOpenNewService}
                          className="mt-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-3.5 py-1.5 rounded-xl border border-amber-200 transition-colors inline-flex items-center gap-1.5 font-['Oswald'] uppercase tracking-wider"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Request New Service</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5 font-mono font-bold text-amber-600">{b.id}</td>
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900">{b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Vehicle'}</div>
                        <div className="text-[10px] font-mono text-slate-500">{b.vehicle?.registrationNumber}</div>
                      </td>
                      <td className="py-3.5 px-5 font-medium text-slate-700">
                        <div>{b.serviceType}</div>
                        {(b.assignedMechanicName || b.mechanic?.name) && (
                          <div className="text-[10px] text-indigo-600 font-mono font-bold">
                            Mechanic: {b.assignedMechanicName || b.mechanic?.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 font-mono text-slate-600">
                        {new Date(b.preferredDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5">{getStatusBadge(b.status)}</td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onSelectBooking(b)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {onDeleteBooking && (
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Delete booking '${b.id}'?`)) return;
                                setDeletingId(b.id);
                                try {
                                  await onDeleteBooking(b.id);
                                } finally {
                                  setDeletingId(null);
                                }
                              }}
                              disabled={deletingId === b.id}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete Booking"
                            >
                              {deletingId === b.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Unpaid Invoices Widget (4 Cols) */}
        <div className="xl:col-span-4 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
          <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-rose-700 font-['Oswald'] uppercase tracking-wide">Unpaid Invoices</h3>
            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold">
              {unpaidInvoices.length} PENDING
            </span>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {unpaidInvoices.length === 0 ? (
              <div className="text-center py-10 text-slate-500 my-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">All invoices settled!</p>
                <p className="text-[11px] text-slate-500 mt-1">No pending payments found in your account history.</p>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                {unpaidInvoices.map((inv) => (
                  <div key={inv.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="text-[10px] font-mono text-amber-600 font-bold block">{inv.id}</span>
                        <span className="text-xs font-semibold text-slate-900">
                          {inv.booking ? `${inv.booking.vehicle?.brand} ${inv.booking.vehicle?.model}` : 'Service Charge'}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-rose-600 font-mono">
                        ${inv.amount.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 font-mono mb-3 space-y-0.5">
                      <div className="flex justify-between">
                        <span>Labor:</span>
                        <span>${inv.serviceCharges.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Parts:</span>
                        <span>${inv.partsCost.toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => onPayInvoice(inv.id)}
                      className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs font-['Oswald'] uppercase tracking-wider"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Settle Invoice Now</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
