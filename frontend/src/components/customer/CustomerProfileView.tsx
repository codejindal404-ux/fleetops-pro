import React, { useState, useEffect } from 'react';
import { User } from '../../types.ts';
import { apiClient } from '../../services/apiClient.ts';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Bell,
  Check,
  Sparkles,
  Award,
  Wallet,
  Calendar,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  Save,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

interface CustomerProfileViewProps {
  user: User;
  onProfileUpdated?: (updatedUser: User) => void;
  onLogout?: () => void;
}

export const CustomerProfileView: React.FC<CustomerProfileViewProps> = ({
  user,
  onProfileUpdated,
  onLogout
}) => {
  // Navigation Subtab inside Profile Settings
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'preferences' | 'security'>('profile');

  // Profile Form States
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // Notification Preferences States
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
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const [prefRes, dashRes] = await Promise.all([
          apiClient.getCustomerPreferences().catch(() => null),
          apiClient.getCustomerDashboard().catch(() => null)
        ]);
        if (prefRes?.preferences) setPreferences(prefRes.preferences);
        if (dashRes) setDashboardData(dashRes);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      }
    };
    load();
  }, []);

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg(null);
    setProfileSuccessMsg(null);

    if (!name.trim()) {
      setProfileErrorMsg('Full name cannot be empty.');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setProfileErrorMsg('Please provide a valid email address.');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        setProfileErrorMsg('New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileErrorMsg('New passwords do not match. Please verify.');
        return;
      }
    }

    setIsSavingProfile(true);

    try {
      const res = await apiClient.updateProfile({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        ...(newPassword ? { newPassword: newPassword.trim() } : {})
      });

      setProfileSuccessMsg(res.message || 'Profile and settings updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      if (onProfileUpdated && res.user) {
        onProfileUpdated(res.user);
      }
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Toggle Notification Preference
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
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Profile Banner Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-3xl shadow-lg shadow-amber-500/20 font-['Oswald'] border-2 border-amber-400/40 shrink-0">
            {user.name.slice(0, 2).toUpperCase()}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
              <h1 className="text-2xl font-black text-white font-['Oswald'] uppercase tracking-tight">{user.name}</h1>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-wide flex items-center gap-1 font-mono">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {membership} Member
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                🚗 {user.role}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400 pt-1 font-mono">
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-slate-500" /> {user.email}</span>
              {user.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-500" /> {user.phone}</span>}
              <span className="flex items-center gap-1.5 text-emerald-400"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 2FA Verified</span>
            </div>
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-center sm:self-start"
              title="Sign Out of Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

        {/* Customer Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono"><Award className="w-3.5 h-3.5 text-amber-500" /> Completed Services</div>
            <div className="text-lg font-bold text-slate-100 mt-1 font-mono">{completedCount} Services</div>
          </div>
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono"><Wallet className="w-3.5 h-3.5 text-emerald-400" /> Lifetime Spend</div>
            <div className="text-lg font-bold text-slate-100 mt-1 font-mono">${totalSpend.toLocaleString()}</div>
          </div>
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono"><Sparkles className="w-3.5 h-3.5 text-amber-400" /> Reward Points</div>
            <div className="text-lg font-bold text-amber-400 mt-1 font-mono">{dashboardData?.stats?.rewardPoints || 0} pts</div>
          </div>
          <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800">
            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono"><Calendar className="w-3.5 h-3.5 text-indigo-400" /> Active Fleet</div>
            <div className="text-lg font-bold text-slate-100 mt-1 font-mono">{vehiclesCount} Vehicles</div>
          </div>
        </div>
      </div>

      {/* 2. Unified Settings Navigation Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900/60 rounded-2xl p-1.5 gap-1.5 text-xs font-mono">
        <button
          type="button"
          onClick={() => setActiveSubTab('profile')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Account & Profile Settings</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('preferences')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'preferences'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Alerts & Notifications</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('security')}
          className={`flex-1 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'security'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Security & Session</span>
        </button>
      </div>

      {/* 3. Tab Contents */}

      {/* TAB 1: Edit Account Details & Credentials */}
      {activeSubTab === 'profile' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white font-['Oswald'] uppercase flex items-center gap-2">
              <Sliders className="w-5 h-5 text-amber-500" />
              Personal Credentials & Password
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Update your contact details and account login password in one unified place.
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div role="alert" className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase font-mono">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Change Password Sub-section */}
            <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-mono">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Change Password (Leave blank to keep current)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 font-mono">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full pl-3.5 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 p-1 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1 font-mono">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-3.5 pr-10 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 p-1 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 font-['Oswald'] uppercase tracking-wider cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Saving Changes...' : 'Save Profile Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: Notification & Alert Preferences */}
      {activeSubTab === 'preferences' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white font-['Oswald'] uppercase flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                Notification & Telemetry Preferences
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure how FleetOps Pro delivers repair progress and maintenance interval alerts.
              </p>
            </div>
            {savedSuccess && (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 font-mono">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Email Status & Invoices</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Receive official invoices, repair approvals, and service completion receipts via email.</p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('emailAlerts')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${preferences.emailAlerts ? 'bg-amber-500' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform absolute top-1 ${preferences.emailAlerts ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-200">AI Predictive Health & Maintenance Alerts</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Real-time alerts when vehicle oil viscosity, brake pad wear, or battery voltage require attention.</p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('pushAlerts')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${preferences.pushAlerts ? 'bg-amber-500' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform absolute top-1 ${preferences.pushAlerts ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-200">SMS / WhatsApp Real-Time Dispatch</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Get instant text alerts when technician starts repair work or updates diagnostic status.</p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('smsAlerts')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${preferences.smsAlerts ? 'bg-amber-500' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform absolute top-1 ${preferences.smsAlerts ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Loyalty Vouchers & Seasonal Promotions</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Exclusive discounts for monsoon checkups, tyre replacements, and VIP events.</p>
              </div>
              <button
                type="button"
                onClick={() => handleTogglePref('marketingAlerts')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${preferences.marketingAlerts ? 'bg-amber-500' : 'bg-slate-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform absolute top-1 ${preferences.marketingAlerts ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Security & Session */}
      {activeSubTab === 'security' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white font-['Oswald'] uppercase flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-500" />
              Security & Active Session Management
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review your account security posture and active authentication status.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Two-Factor Authentication (2FA OTP)</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Enforced via email verification code on every new device login.</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full uppercase">
                ACTIVE
              </span>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">Role Clearance</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Account ID: <span className="font-mono text-slate-300">{user.id}</span></p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full uppercase">
                {user.role}
              </span>
            </div>

            {/* Logout Action Card */}
            {onLogout && (
              <div className="p-5 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
                <div>
                  <h4 className="text-xs font-bold text-rose-300">Sign Out of Current Session</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Terminate this active browser session and return to the secure sign-in portal.</p>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold font-['Oswald'] uppercase tracking-wider rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
