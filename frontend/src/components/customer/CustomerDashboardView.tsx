import React, { useState, useEffect } from 'react';
import { User, VehicleHealth, Booking, ServiceCenter, Vehicle, Invoice } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';
import { CustomerChatModal } from './CustomerChatModal.tsx';
import { PaymentModal } from './PaymentModal.tsx';
import { getVehicleIllustration } from '../../utils/vehicleImageHelper.ts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Car,
  Clock,
  AlertTriangle,
  CreditCard,
  Plus,
  ArrowRight,
  Wrench,
  MapPin,
  Calendar,
  MessageSquare,
  XCircle,
  ChevronRight,
  CheckCircle2,
  FileText,
  Activity,
  History,
  ShieldCheck,
  Eye,
  Edit,
  Trash2,
  Bell
} from 'lucide-react';

interface CustomerDashboardViewProps {
  user: User;
  vehicles?: Vehicle[];
  bookings?: Booking[];
  invoices?: Invoice[];
  onNavigate: (view: string) => void;
  onOpenNewService: (vehicleId?: string, serviceType?: string) => void;
  onOpenAddVehicle: () => void;
}

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  user,
  vehicles = [],
  bookings = [],
  invoices = [],
  onNavigate,
  onOpenNewService,
  onOpenAddVehicle
}) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(null);
  const [activePayInvoice, setActivePayInvoice] = useState<Invoice | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getCustomerDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load customer dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this service appointment?')) return;
    try {
      setCancellingBookingId(bookingId);
      const res = await apiClient.cancelCustomerBooking(bookingId);
      alert(res.message);
      fetchDashboard();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingBookingId(null);
    }
  };

  const customer = dashboardData?.customer || {
    name: user.name,
    membershipTier: 'STANDARD',
    email: user.email
  };

  // KPIs
  const totalVehicles = vehicles.length;
  const activeServicesList = bookings.filter(b => b.status !== 'COMPLETED' && b.status !== 'CANCELLED');
  const completedServicesList = bookings.filter(b => b.status === 'COMPLETED');
  const upcomingReminders = dashboardData?.upcomingReminders || [];
  const pendingInvoices = invoices.filter(i => i.status === 'UNPAID');
  
  const recommendedGarages: ServiceCenter[] = dashboardData?.recommendedGarages || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* 1. DASHBOARD HEADER */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-8 shadow-2xl border border-slate-800">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 translate-y-1/2" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-3xl shadow-lg shadow-amber-500/20 shrink-0 border-2 border-amber-300">
                {customer.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-md font-bold bg-amber-500 text-slate-950 uppercase tracking-wider shadow-sm">
                    {customer.membershipTier} Member
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-['Oswald'] uppercase">
                  Welcome back, {customer.name}
                </h1>
                <p className="text-sm text-slate-400 font-medium">
                  Manage your vehicles, services, maintenance and repairs from one place.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenNewService()}
                className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" /> Book Service
              </button>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* 2. KEY OVERVIEW CARDS */}
      <FadeIn delay={0.1}>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Vehicles', value: totalVehicles, icon: Car, bg: 'bg-slate-100', color: 'text-slate-600', route: 'my-vehicles' },
            { label: 'Active Services', value: activeServicesList.length, icon: Activity, bg: 'bg-amber-100', color: 'text-amber-600', route: 'my-bookings' },
            { label: 'Upcoming Services', value: upcomingReminders.length, icon: Calendar, bg: 'bg-blue-100', color: 'text-blue-600', route: 'reminders' },
            { label: 'Completed', value: completedServicesList.length, icon: CheckCircle2, bg: 'bg-emerald-100', color: 'text-emerald-600', route: 'my-bookings' },
            { label: 'Pending Invoices', value: pendingInvoices.length, icon: FileText, bg: 'bg-rose-100', color: 'text-rose-600', route: 'invoices' },
          ].map((stat, i) => (
            <div
              key={i}
              onClick={() => onNavigate(stat.route)}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group flex flex-col justify-between h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.value}</div>
                <div className="text-xs font-semibold text-slate-500 mt-1 group-hover:text-amber-600 transition-colors uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </FadeIn>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* 3. VEHICLE SECTION */}
          <FadeIn delay={0.2}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900 font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
                    <Car className="w-5 h-5 text-amber-500" /> My Vehicles
                  </h2>
                  <p className="text-sm text-slate-500 font-medium">Manage your registered fleet</p>
                </div>
                <button
                  onClick={onOpenAddVehicle}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Vehicle
                </button>
              </div>

              {vehicles.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                  <Car className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm text-slate-500 font-semibold mb-4">No vehicles registered yet.</p>
                  <button onClick={onOpenAddVehicle} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold">Register a Vehicle</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vehicles.map(v => {
                    const visual = getVehicleIllustration(v.vehicleType, v.model, v.brand);
                    return (
                      <div key={v.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                        <div className="h-32 w-full bg-slate-100 relative overflow-hidden">
                          <img src={visual.img} alt={visual.alt} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                          <div className="absolute bottom-3 left-4 text-white">
                            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500 text-slate-900">{v.registrationNumber}</span>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div>
                            <h3 className="font-bold text-slate-900 text-lg leading-tight">{v.brand} {v.model}</h3>
                            <p className="text-xs text-slate-500">{v.year} • {v.vehicleType} • {(v as any).fuelType || 'Unknown'} • {v.lastServiceMileage?.toLocaleString() || 0} km</p>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                            <button onClick={() => onNavigate('my-vehicles')} className="flex-1 py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded-lg text-xs font-bold transition-colors border border-slate-200 hover:border-amber-200 flex items-center justify-center gap-1.5">
                              <Eye className="w-3.5 h-3.5" /> View
                            </button>
                            <button onClick={() => onNavigate('my-vehicles')} className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-colors border border-slate-200 flex items-center justify-center gap-1.5">
                              <Edit className="w-3.5 h-3.5" /> Edit
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </FadeIn>

          {/* 4 & 5. ACTIVE SERVICE SECTION & LIVE SERVICE TRACKING */}
          <FadeIn delay={0.3}>
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-amber-500" /> Active Service Tracking
                </h2>
                <p className="text-sm text-slate-500 font-medium">Real-time progress for ongoing maintenance</p>
              </div>

              {activeServicesList.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-sm text-slate-500 font-semibold">No active services.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeServicesList.map(booking => {
                    const v = booking.vehicle;
                    const visual = getVehicleIllustration(v?.vehicleType, v?.model, v?.brand);
                    
                    const stages = [
                      { id: 'PENDING', label: 'Booking' },
                      { id: 'APPROVED', label: 'Approved' },
                      { id: 'ASSIGNED', label: 'Assigned' },
                      { id: 'INSPECTION', label: 'Inspection' },
                      { id: 'REPAIRING', label: 'Repairing' },
                      { id: 'QUALITY_CHECK', label: 'Quality Check' },
                      { id: 'COMPLETED', label: 'Completed' }
                    ];
                    
                    let currentIndex = stages.findIndex(s => s.id === booking.status);
                    if (currentIndex === -1) currentIndex = 0; // fallback

                    return (
                      <div key={booking.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                              <img src={visual.img} alt={visual.alt} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider">{booking.id}</span>
                                <span className="text-xs text-slate-500 font-semibold">{booking.preferredDate}</span>
                              </div>
                              <h3 className="font-bold text-slate-900 text-lg">{booking.serviceType}</h3>
                              <p className="text-sm text-slate-500">{v?.brand} {v?.model} ({v?.registrationNumber})</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {booking.mechanic && (
                              <button onClick={() => setActiveChatBooking(booking)} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 border border-slate-200">
                                <MessageSquare className="w-3.5 h-3.5" /> Chat
                              </button>
                            )}
                            {booking.status === 'PENDING' && (
                              <button onClick={() => handleCancelBooking(booking.id)} disabled={cancellingBookingId === booking.id} className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5">
                                <XCircle className="w-3.5 h-3.5" /> Cancel
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Visual Flow Progress */}
                        <div className="relative">
                          <div className="absolute top-3 left-4 right-4 h-1 bg-slate-100 rounded-full"></div>
                          <div className="absolute top-3 left-4 h-1 bg-amber-500 rounded-full transition-all duration-1000" style={{ width: `${(currentIndex / (stages.length - 1)) * 100}%` }}></div>
                          <div className="relative flex justify-between">
                            {stages.map((stage, idx) => {
                              const isPast = idx < currentIndex;
                              const isCurrent = idx === currentIndex;
                              return (
                                <div key={stage.id} className="flex flex-col items-center gap-2 w-12">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold z-10 border-2 transition-all ${isPast ? 'bg-amber-500 border-amber-500 text-white' : isCurrent ? 'bg-white border-amber-500 text-amber-600 ring-4 ring-amber-100' : 'bg-white border-slate-200 text-slate-400'}`}>
                                    {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                  </div>
                                  <span className={`text-[9px] font-bold uppercase tracking-wider text-center hidden md:block ${isCurrent ? 'text-amber-600' : isPast ? 'text-slate-700' : 'text-slate-400'}`}>{stage.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </FadeIn>
        </div>

        <div className="space-y-8">
          {/* 6. QUICK ACTIONS */}
          <FadeIn delay={0.4}>
            <div className="bg-slate-900 rounded-2xl p-6 text-white border border-slate-800 shadow-lg">
              <h3 className="font-black text-white font-['Oswald'] uppercase tracking-wide mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => onOpenNewService()} className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors gap-2 text-center group">
                  <Wrench className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">Book Service</span>
                </button>
                <button onClick={() => onNavigate('my-vehicles')} className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors gap-2 text-center group">
                  <Car className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">My Vehicles</span>
                </button>
                <button onClick={() => onNavigate('my-bookings')} className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors gap-2 text-center group">
                  <History className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">History</span>
                </button>
                <button onClick={() => onNavigate('invoices')} className="flex flex-col items-center justify-center p-4 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors gap-2 text-center group">
                  <FileText className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold">Invoices</span>
                </button>
              </div>
            </div>
          </FadeIn>

          {/* 7. UPCOMING MAINTENANCE */}
          <FadeIn delay={0.5}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-500" /> Upcoming
                </h2>
                <button onClick={() => onNavigate('reminders')} className="text-xs font-bold text-amber-600 hover:text-amber-700">View All</button>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {upcomingReminders.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500 font-medium">No upcoming maintenance due.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {upcomingReminders.slice(0, 3).map((r: any) => (
                      <div key={r.id} className="p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-700 uppercase">{r.data?.reason || 'DUE SOON'}</span>
                          <span className="text-xs text-slate-500 font-semibold">{r.data?.nextServiceDueDate}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">{r.data?.recommendedService || 'Scheduled Maintenance'}</p>
                        <p className="text-xs text-slate-500">{r.data?.vehicleLabel || r.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </FadeIn>

          {/* 9. INVOICES */}
          <FadeIn delay={0.6}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-900 font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Recent Invoices
                </h2>
                <button onClick={() => onNavigate('invoices')} className="text-xs font-bold text-amber-600 hover:text-amber-700">View All</button>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                {invoices.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-500 font-medium">No invoices available.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {invoices.slice(0, 4).map(inv => (
                      <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div>
                          <p className="text-xs font-mono text-slate-500">{inv.id}</p>
                          <p className="text-sm font-bold text-slate-900">${(inv.amount || (inv.serviceCharges + inv.partsCost + inv.tax)).toFixed(2)}</p>
                        </div>
                        {inv.status === 'UNPAID' ? (
                          <button onClick={() => setActivePayInvoice(inv)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
                            Pay Now
                          </button>
                        ) : (
                          <span className="px-3 py-1 rounded bg-slate-100 text-slate-500 text-xs font-bold uppercase">Paid</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </FadeIn>

        </div>
      </div>

      {/* 8. SERVICE HISTORY (COMPLETED) */}
      <FadeIn delay={0.7}>
        <div className="space-y-4 mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900 font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" /> Recent Service History
            </h2>
            <button onClick={() => onNavigate('my-bookings')} className="text-sm font-bold text-amber-600 hover:text-amber-700">View All History</button>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {completedServicesList.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-medium">No completed services in history.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                      <th className="p-4 whitespace-nowrap">Date</th>
                      <th className="p-4 whitespace-nowrap">Vehicle</th>
                      <th className="p-4 whitespace-nowrap">Service Type</th>
                      <th className="p-4 whitespace-nowrap">Center/Mechanic</th>
                      <th className="p-4 whitespace-nowrap">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {completedServicesList.slice(0, 5).map(b => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-500 font-semibold whitespace-nowrap">{b.preferredDate}</td>
                        <td className="p-4 font-bold text-slate-900 whitespace-nowrap">{b.vehicle?.brand} {b.vehicle?.model}</td>
                        <td className="p-4 text-slate-700 whitespace-nowrap">{b.serviceType}</td>
                        <td className="p-4 text-slate-500 whitespace-nowrap">{b.mechanic?.name || 'Standard Bay'}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </FadeIn>

      {/* 10. RECOMMENDED SERVICE CENTERS */}
      {recommendedGarages.length > 0 && (
        <FadeIn delay={0.8}>
          <div className="space-y-4 mt-8 pt-8 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-slate-900 font-['Oswald'] uppercase tracking-wide flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> Recommended Service Centers
                </h2>
                <p className="text-sm text-slate-500 font-medium">Top certified facilities near you</p>
              </div>
              <button onClick={() => onNavigate('find-service-center')} className="text-sm font-bold text-emerald-600 hover:text-emerald-700">Open Map</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recommendedGarages.map((garage) => (
                <div key={garage.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 bg-slate-900 text-amber-400 text-xs font-bold rounded-lg flex items-center gap-1">
                      ★ {garage.averageRating.toFixed(1)}
                    </span>
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">{(garage as any).distanceText || 'Nearby'}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{garage.name}</h3>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-1">{garage.address}</p>
                  <button onClick={() => onOpenNewService()} className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors">
                    Book Here
                  </button>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      )}

      {/* Modal Dialogs */}
      {activeChatBooking && (
        <CustomerChatModal
          booking={activeChatBooking}
          isOpen={!!activeChatBooking}
          onClose={() => setActiveChatBooking(null)}
        />
      )}

      {activePayInvoice && (
        <PaymentModal
          invoice={activePayInvoice}
          isOpen={!!activePayInvoice}
          onClose={() => setActivePayInvoice(null)}
          onPaymentSuccess={() => {
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
};
