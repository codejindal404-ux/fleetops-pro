import React, { useState, useEffect } from 'react';
import { X, Clock, Star, UserCheck, Wrench, CheckCircle2 } from 'lucide-react';
import { Booking, User as UserType } from '../types.ts';
import { apiClient } from '../services/apiClient.ts';

interface BookingDetailsModalProps {
  booking: Booking | null;
  onClose: () => void;
  currentUser: UserType | null;
  onUpdateStatus: (bookingId: string, nextStatus: string, mileage?: number) => void;
  onAssignMechanic: (bookingId: string, mechanicId: string) => void;
  onSubmitFeedback: (bookingId: string, rating: number, comment: string) => void;
  onDeleteBooking?: (bookingId: string) => Promise<void>;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  onClose,
  currentUser,
  onUpdateStatus,
  onAssignMechanic,
  onSubmitFeedback,
  onDeleteBooking
}) => {
  const [rating, setRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>('');
  const [showCompletionMileagePrompt, setShowCompletionMileagePrompt] = useState<boolean>(false);
  const [completionMileage, setCompletionMileage] = useState<number>(booking?.vehicle?.mileage ?? 45000);
  const [mechanics, setMechanics] = useState<UserType[]>([]);
  const [selectedMechanicId, setSelectedMechanicId] = useState<string>('');
  const [assigning, setAssigning] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      apiClient.getUsers()
        .then((users) => {
          const mechs = users.filter((u) => u.role === 'MECHANIC');
          setMechanics(mechs);
          if (mechs.length > 0) {
            const currentMechId = booking?.assignedMechanicId || booking?.mechanicId;
            setSelectedMechanicId(currentMechId || mechs[0].id);
          }
        })
        .catch((err) => console.warn('Failed to load mechanics in modal:', err));
    }
  }, [currentUser, booking]);

  if (!booking) return null;

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    onSubmitFeedback(booking.id, rating, feedbackComment);
    setFeedbackComment('');
  };

  const handleAssignMechanicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMechanicId || !booking) return;
    setAssigning(true);
    try {
      await onAssignMechanic(booking.id, selectedMechanicId);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-50 text-slate-900 px-6 py-4 flex justify-between items-center border-b border-slate-200">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-amber-700 tracking-widest">Service Inspection Bay</span>
            <h3 className="text-sm font-bold font-mono text-slate-900 flex items-center gap-2 mt-0.5">
              <span className="text-amber-700">{booking.id}</span>
              <span className="text-xs font-normal text-slate-500">({booking.serviceType})</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {onDeleteBooking && (currentUser?.role === 'ADMIN' || currentUser?.id === booking.customerId) && (
              <button
                onClick={async () => {
                  if (!window.confirm(`Are you sure you want to delete booking '${booking.id}'?`)) return;
                  await onDeleteBooking(booking.id);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1 font-['Oswald'] uppercase tracking-wider"
                title="Delete Booking"
              >
                <span>Delete</span>
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-slate-800">
          {/* Info Bar */}
          <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Current Status</p>
              <p className="font-bold text-amber-700 text-sm mt-0.5">{booking.status}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Vehicle Plate</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">
                {booking.vehicle?.registrationNumber || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase">Scheduled Date</p>
              <p className="text-slate-700 text-sm mt-0.5">
                {new Date(booking.preferredDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Staff Controls */}
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MECHANIC') && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-amber-800 font-['Oswald'] uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>Bay Action & Assignment Controls</span>
                </h4>
                {booking.assignedMechanicName && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    Assigned: {booking.assignedMechanicName}
                  </span>
                )}
              </div>

              {/* Admin Mechanic Assignment Section */}
              {currentUser?.role === 'ADMIN' && (
                <form onSubmit={handleAssignMechanicSubmit} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                  <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase">
                    Assign Certified Technician / Mechanic:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedMechanicId}
                      onChange={(e) => setSelectedMechanicId(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-900 flex-1 focus:outline-none focus:border-amber-500"
                    >
                      {mechanics.length === 0 ? (
                        <option value="">No mechanics found</option>
                      ) : (
                        mechanics.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.email})
                          </option>
                        ))
                      )}
                    </select>
                    <button
                      type="submit"
                      disabled={assigning || !selectedMechanicId}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-1.5 rounded-lg text-xs font-['Oswald'] uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{assigning ? 'Assigning...' : 'Assign Mechanic'}</span>
                    </button>
                  </div>
                </form>
              )}

              <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200">
                {booking.status === 'PENDING' && (
                  <button
                    onClick={() => onUpdateStatus(booking.id, 'APPROVED')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold font-['Oswald'] uppercase tracking-wider transition-colors shadow-xs"
                  >
                    Approve Request
                  </button>
                )}
                {(booking.status === 'APPROVED' || booking.status === 'ASSIGNED') && (
                  <button
                    onClick={() => onUpdateStatus(booking.id, 'REPAIRING')}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold font-['Oswald'] uppercase tracking-wider transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Start Service (REPAIRING)</span>
                  </button>
                )}
                {booking.status === 'REPAIRING' && (
                  <div className="w-full space-y-2 pt-1 border-t border-slate-200">
                    {!showCompletionMileagePrompt ? (
                      <button
                        onClick={() => {
                          setCompletionMileage(booking.vehicle?.mileage ?? 45000);
                          setShowCompletionMileagePrompt(true);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl font-bold font-['Oswald'] uppercase tracking-wider transition-colors shadow-xs"
                      >
                        Mark Service Complete
                      </button>
                    ) : (
                      <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                        <label className="block text-[11px] font-mono font-bold text-slate-700 uppercase">
                          Enter Current Vehicle Mileage (Mi):
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min={booking.vehicle?.mileage ?? 0}
                            value={completionMileage}
                            onChange={(e) => setCompletionMileage(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs font-mono font-bold text-slate-900 w-36 focus:outline-none focus:border-amber-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onUpdateStatus(booking.id, 'COMPLETED', Number(completionMileage));
                              setShowCompletionMileagePrompt(false);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-xs font-bold font-['Oswald'] uppercase"
                          >
                            Sign Off
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowCompletionMileagePrompt(false)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-lg text-xs font-bold"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OBD-II Fault Codes Detected (if any) */}
          {booking.diagnostics && booking.diagnostics.length > 0 && (
            <div className="bg-rose-50/50 p-4 rounded-xl border border-rose-200/80 space-y-2">
              <h4 className="font-bold text-rose-900 font-['Oswald'] uppercase text-xs tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>OBD-II ECU Diagnostic Telemetry ({booking.diagnostics.length} DTCs)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {booking.diagnostics.map((d) => (
                  <div key={d.id} className="bg-white p-2.5 rounded-lg border border-rose-100 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-rose-700">{d.faultCode}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                        {d.severity || 'HIGH'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium">{d.problemDescription}</p>
                    <p className="text-[10px] text-slate-500 italic">Fix: {d.recommendedSolution}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vehicle Health Multi-Point Inspection Summary (if recorded) */}
          {booking.inspection && (
            <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-emerald-900 font-['Oswald'] uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Workshop Multi-Point Inspection Results</span>
                </h4>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Overall: {booking.inspection.overallGrade}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[11px]">
                {booking.inspection.items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <span className="text-slate-700 capitalize">{item.name.replace(/([A-Z])/g, ' $1')}</span>
                    <span className={`font-bold ${
                      item.status === 'PASS' ? 'text-emerald-600' :
                      item.status === 'FAIL' ? 'text-rose-600' : 'text-amber-600'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              {booking.inspection.technicianNotes && (
                <p className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-emerald-100 italic">
                  Note: "{booking.inspection.technicianNotes}"
                </p>
              )}
            </div>
          )}

          {/* Approved Repair Photos (if any) */}
          {booking.images && booking.images.filter(img => img.isApprovedForCustomer || currentUser?.role === 'MECHANIC' || currentUser?.role === 'ADMIN').length > 0 && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 font-['Oswald'] uppercase text-xs tracking-wider flex items-center gap-1.5">
                <span>Service Bay Photo Evidence</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {booking.images
                  .filter(img => img.isApprovedForCustomer || currentUser?.role === 'MECHANIC' || currentUser?.role === 'ADMIN')
                  .map((img) => (
                    <div key={img.id} className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900 group">
                      <img
                        src={img.imageUrl}
                        alt={img.caption}
                        referrerPolicy="no-referrer"
                        className="w-full h-24 object-cover"
                      />
                      <div className="p-1.5 bg-white text-[10px] truncate font-mono text-slate-700 font-medium">
                        [{img.category}] {img.caption}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Repair Logs Timeline */}
          <div>
            <h4 className="font-bold text-slate-900 font-['Oswald'] uppercase text-xs tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Technician Diagnostic & Repair Progress Logs</span>
            </h4>

            {(!booking.repairLogs || booking.repairLogs.length === 0) ? (
              <p className="text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-200">No repair logs recorded for this booking yet.</p>
            ) : (
              <div className="space-y-3 border-l-2 border-amber-500 pl-4">
                {booking.repairLogs.map((log) => (
                  <div key={log.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-semibold text-slate-900">{log.note}</p>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono pt-1">
                      <span>By: {log.updatedByUser?.name || 'Mechanic'}</span>
                      <span>{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback Form */}
          {booking.status === 'COMPLETED' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 font-['Oswald'] uppercase text-xs tracking-wider flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>Customer Quality Audit</span>
              </h4>

              {booking.feedback ? (
                <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-4 h-4 ${
                          s <= booking.feedback!.rating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-slate-700 italic">"{booking.feedback.comment}"</p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 font-mono">Rating:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setRating(s)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              s <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Describe your satisfaction with the repair quality, turn-around time, and service staff..."
                    rows={2}
                    required
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500"
                  />

                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs px-4 py-2 rounded-xl font-['Oswald'] uppercase tracking-wider"
                  >
                    Submit Audit Feedback
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
