import React, { useState, useEffect } from 'react';
import { User } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';
import { User as UserIcon, Mail, Phone, Shield, Bell, Check, Sparkles, Award, Wallet, Calendar, AlertCircle } from 'lucide-react';

interface CustomerProfileViewProps {
  user: User;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({ user }) => {
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    pushAlerts: true,
    smsAlerts: false,
    marketingAlerts: false
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [savingPref, setSavingPref] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [prefRes, dashRes] = await Promise.all([
          apiClient.getCustomerPreferences(),
          apiClient.getCustomerDashboard()
        ]);
        if (prefRes?.preferences) setPreferences(prefRes.preferences);
        if (dashRes) setDashboardData(dashRes);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      }
    };
    load();
  }, []);

  const handleTogglePref = async (key: keyof typeof preferences) => {
    const updated = { ...preferences, [key]: !preferences[key] };
    setPreferences(updated);
    try {
      setSavingPref(true);
      await apiClient.updateCustomerPreferences(updated);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to update preferences:', err);
    } finally {
      setSavingPref(false);
    }
  };

  const membership = dashboardData?.customer?.membershipTier || 'GOLD';
  const totalSpend = dashboardData?.stats?.totalSpending || 0;
  const completedCount = dashboardData?.stats?.completedServices || 0;
  const vehiclesCount = dashboardData?.stats?.totalVehicles || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-3xl shadow-md border-4 border-slate-100 shrink-0">
            {user.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl font-black text-slate-900">{user.name}</h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wide flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" /> {membership} Member
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
              {user.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {user.phone}</span>}
              <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-600" /> 2FA Verified</span>
            </div>
          </div>
        </div>

        {/* Customer Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Award className="w-3.5 h-3.5 text-amber-600" /> Total Completed</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{completedCount} Services</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Wallet className="w-3.5 h-3.5 text-emerald-600" /> Lifetime Spend</div>
            <div className="text-xl font-bold text-slate-900 mt-1">${totalSpend.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-amber-500" /> Reward Points</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{dashboardData?.stats?.rewardPoints || 0} pts</div>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-indigo-600" /> Active Fleet</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{vehiclesCount} Vehicles</div>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-700" /> Notification & Telemetry Alert Preferences
            </h2>
            <p className="text-xs text-slate-500">Configure how FleetOps Pro delivers urgent vehicle health reminders and status updates.</p>
          </div>
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Email Status & Invoices</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Receive official invoices, repair approvals, and service completion receipts via email.</p>
            </div>
            <button
              onClick={() => handleTogglePref('emailAlerts')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.emailAlerts ? 'bg-slate-900' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${preferences.emailAlerts ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <h4 className="text-xs font-bold text-slate-800">AI Predictive Health & Maintenance Alerts</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Real-time alerts when vehicle oil viscosity, brake pad wear, or battery voltage require attention.</p>
            </div>
            <button
              onClick={() => handleTogglePref('pushAlerts')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.pushAlerts ? 'bg-slate-900' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${preferences.pushAlerts ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <h4 className="text-xs font-bold text-slate-800">SMS / WhatsApp Real-Time Dispatch</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Get instant text alerts when technician starts repair work or updates status.</p>
            </div>
            <button
              onClick={() => handleTogglePref('smsAlerts')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.smsAlerts ? 'bg-slate-900' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${preferences.smsAlerts ? 'left-7' : 'left-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <div>
              <h4 className="text-xs font-bold text-slate-800">Loyalty Vouchers & Seasonal Promotions</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Exclusive discounts for monsoon checkups, tyre replacements, and VIP events.</p>
            </div>
            <button
              onClick={() => handleTogglePref('marketingAlerts')}
              className={`w-12 h-6 rounded-full transition-colors relative ${preferences.marketingAlerts ? 'bg-slate-900' : 'bg-slate-300'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${preferences.marketingAlerts ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
