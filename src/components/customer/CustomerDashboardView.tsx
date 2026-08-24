import React, { useState, useEffect } from 'react';
import { User, VehicleHealth, Booking, ServiceCenter } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';
import { VehicleHealthCard } from './VehicleHealthCard.tsx';
import { CustomerChatModal } from './CustomerChatModal.tsx';
import { PaymentModal } from './PaymentModal.tsx';
import {
  Car,
  Clock,
  AlertTriangle,
  CreditCard,
  Award,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Wrench,
  MapPin,
  Calendar,
  MessageSquare,
  XCircle,
  ExternalLink,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

interface CustomerDashboardViewProps {
  user: User;
  onNavigate: (view: string) => void;
  onOpenNewService: (vehicleId?: string, serviceType?: string) => void;
  onOpenAddVehicle: () => void;
}

export const CustomerDashboardView: React.FC<CustomerDashboardViewProps> = ({
  user,
  onNavigate,
  onOpenNewService,
  onOpenAddVehicle
}) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeChatBooking, setActiveChatBooking] = useState<Booking | null>(null);
  const [activePayInvoice, setActivePayInvoice] = useState<any | null>(null);
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
    membershipTier: 'GOLD',
    email: user.email
  };

  const stats = dashboardData?.stats || {
    totalVehicles: 0,
    activeBookings: 0,
    completedServices: 0,
    totalSpending: 0,
    pendingInvoicesAmount: 0,
    rewardPoints: 0
  };

  const vehicleHealthList: VehicleHealth[] = dashboardData?.vehicleHealthList || [];
  const activeBookings: Booking[] = dashboardData?.activeBookings || [];
  const upcomingReminders = dashboardData?.upcomingReminders || [];
  const recommendedGarages: ServiceCenter[] = dashboardData?.recommendedGarages || [];

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Personalized Header */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-amber-300 shrink-0">
              {customer.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full font-black bg-amber-400 text-slate-950 uppercase tracking-wide">
                  {customer.membershipTier} Member
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">• 2FA Active</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Welcome back, {customer.name} 👋
              </h1>
              <p className="text-xs text-slate-400">
                {stats.completedServices} Services Completed • ${stats.totalSpending.toLocaleString()} Lifetime Fleet Care
              </p>
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              id="customer-schedule-service-btn"
              onClick={() => onOpenNewService()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> Book Service Now
            </button>
            <button
              id="customer-find-garages-btn"
              onClick={() => onNavigate('find-service-center')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all active:scale-95"
            >
              <MapPin className="w-4 h-4 text-amber-400" /> Find Garages
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Vehicles */}
        <div
          id="kpi-my-vehicles"
          onClick={() => onNavigate('my-vehicles')}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">My Vehicles</span>
            <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Car className="w-4 h-4 text-slate-700 group-hover:text-white" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.totalVehicles}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Registered fleet</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Active Services */}
        <div
          id="kpi-active-services"
          onClick={() => onNavigate('my-bookings')}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Active Services</span>
            <div className="p-2 rounded-xl bg-amber-50 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4 text-amber-600 group-hover:text-white" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.activeBookings}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>In progress or queued</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div
          id="kpi-upcoming-maintenance"
          onClick={() => onNavigate('reminders')}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Maintenance</span>
            <div className="p-2 rounded-xl bg-rose-50 group-hover:bg-rose-500 group-hover:text-white transition-colors">
              <AlertTriangle className="w-4 h-4 text-rose-600 group-hover:text-white" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{upcomingReminders.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Proactive alerts</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Pending Payments */}
        <div
          id="kpi-pending-payments"
          onClick={() => onNavigate('invoices')}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Pending Dues</span>
            <div className="p-2 rounded-xl bg-emerald-50 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <CreditCard className="w-4 h-4 text-emerald-600 group-hover:text-white" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">${stats.pendingInvoicesAmount.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Outstanding invoices</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Loyalty Reward Points */}
        <div
          id="kpi-reward-points"
          onClick={() => onNavigate('rewards')}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group col-span-2 sm:col-span-1"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold text-slate-600">Fleet Points</span>
            <div className="p-2 rounded-xl bg-amber-50 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <Award className="w-4 h-4 text-amber-600 group-hover:text-white" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.rewardPoints}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Redeem discounts</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </div>
        </div>
      </div>

      {/* 3. Live Active Services Section */}
      {activeBookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-500" /> Active Service Tracking
              </h2>
              <p className="text-xs text-slate-500">Live progress status from certified automotive bay</p>
            </div>
            <button
              onClick={() => onNavigate('my-bookings')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
            >
              View All ({activeBookings.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeBookings.map((b) => {
              const vehicle = b.vehicle;
              const mechanic = b.mechanic;
              const isPending = b.status === 'PENDING';
              const isAssigned = b.status === 'ASSIGNED';
              const isRepairing = b.status === 'REPAIRING';

              return (
                <div
                  key={b.id}
                  id={`active-booking-card-${b.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
                        {vehicle?.brand?.slice(0, 2).toUpperCase() || 'FL'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          {b.serviceType} • {vehicle?.brand} {vehicle?.model}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                          Reg: {vehicle?.registrationNumber || 'N/A'} • Scheduled: {b.preferredDate}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                          isRepairing
                            ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                            : isAssigned
                            ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        ● {b.status}
                      </span>
                    </div>
                  </div>

                  {/* Visual Step Tracker */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div
                      className={`p-2.5 rounded-xl border ${
                        isPending || isAssigned || isRepairing
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider">Step 1</div>
                      <div>Booked & Approved</div>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border ${
                        isAssigned || isRepairing
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider">Step 2</div>
                      <div>Technician Assigned</div>
                    </div>

                    <div
                      className={`p-2.5 rounded-xl border ${
                        isRepairing
                          ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold animate-pulse'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider">Step 3</div>
                      <div>Repairs In Progress</div>
                    </div>
                  </div>

                  {/* Action Bar: Chat / Invoice Pay / Cancel */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      {mechanic ? (
                        <span>
                          Assigned Lead: <strong className="text-slate-900">{mechanic.name}</strong>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Technician assignment in progress...</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {mechanic && (
                        <button
                          id={`chat-btn-${b.id}`}
                          onClick={() => setActiveChatBooking(b)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Chat with Mechanic
                        </button>
                      )}

                      {b.invoice && b.invoice.status === 'UNPAID' && (
                        <button
                          id={`pay-btn-${b.id}`}
                          onClick={() => setActivePayInvoice(b.invoice)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Pay ${b.invoice.amount?.toFixed(2)}
                        </button>
                      )}

                      {isPending && (
                        <button
                          id={`cancel-booking-btn-${b.id}`}
                          onClick={() => handleCancelBooking(b.id)}
                          disabled={cancellingBookingId === b.id}
                          className="px-3 py-1.5 border border-rose-200 hover:bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Live Vehicle Health & AI Predictive Maintenance */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Vehicle Health & AI Predictive Telemetry
            </h2>
            <p className="text-xs text-slate-500">Live multi-point diagnostic sensors for your registered vehicles</p>
          </div>
          <button
            id="add-vehicle-top-btn"
            onClick={onOpenAddVehicle}
            className="text-xs font-bold text-slate-800 hover:text-slate-950 flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Vehicle
          </button>
        </div>

        {vehicleHealthList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Vehicles Registered Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Add your vehicle registration number to begin real-time diagnostic monitoring, AI service predictions, and instant scheduling.
            </p>
            <button
              onClick={onOpenAddVehicle}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 shadow-sm"
            >
              Add First Vehicle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5">
            {vehicleHealthList.map((health) => (
              <VehicleHealthCard
                key={health.vehicleId}
                health={health}
                onBookService={(vId, sType) => onOpenNewService(vId, sType)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. Recommended Top Certified Service Centers Banner */}
      {recommendedGarages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Smart Recommended Service Bays
              </h2>
              <p className="text-xs text-slate-500">AI-ranked certified facilities based on proximity, rating & experience</p>
            </div>
            <button
              onClick={() => onNavigate('find-service-center')}
              className="text-xs font-semibold text-slate-700 hover:text-slate-950 flex items-center gap-1"
            >
              Open Live Map <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedGarages.map((garage) => (
              <div
                key={garage.id}
                id={`rec-garage-${garage.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ★ {garage.averageRating.toFixed(1)} / 5.0
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {(garage as any).distanceText || 'Nearby'}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{garage.name}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{garage.address}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-semibold">{garage.totalServicesCompleted}+ completed</span>
                  <button
                    onClick={() => onOpenNewService(undefined, undefined)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Select Bay
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
