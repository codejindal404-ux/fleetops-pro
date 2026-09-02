import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Loader2,
  Trash2,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Car,
  Wrench,
  DollarSign,
  Star,
  Search,
  RefreshCw,
  Building2,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  Layers,
  Edit2
} from 'lucide-react';
import { User, Role } from '../types.ts';
import { apiClient } from '../services/apiClient.ts';

interface UsersViewProps {
  user: User | null;
  onCreateStaff: (name: string, email: string, pass: string, role: Role, phone?: string) => Promise<void> | void;
  searchTerm: string;
}

export const UsersView: React.FC<UsersViewProps> = ({ user, onCreateStaff, searchTerm: externalSearch }) => {
  const [activeSubTab, setActiveSubTab] = useState<'CUSTOMERS' | 'MECHANICS' | 'ALL'>('CUSTOMERS');
  const [customers, setCustomers] = useState<any[]>([]);
  const [mechanics, setMechanics] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [internalSearch, setInternalSearch] = useState<string>('');

  // Modals
  const [showStaffModal, setShowStaffModal] = useState<boolean>(false);
  const [resetPasswordModalUser, setResetPasswordModalUser] = useState<any | null>(null);
  const [tempPassword, setTempPassword] = useState<string>('FleetOps@2026!');
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);

  // Edit User Modal
  const [editUserModalUser, setEditUserModalUser] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'CUSTOMER' as Role,
    newPassword: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [selectedCustomerFleet, setSelectedCustomerFleet] = useState<any | null>(null);

  // Form State for creating staff
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('Password123!');
  const [role, setRole] = useState<Role>('MECHANIC');
  const [phone, setPhone] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [custRes, mechRes, usersRes] = await Promise.all([
        apiClient.getAdminCustomers(),
        apiClient.getAdminMechanics(),
        apiClient.getUsers()
      ]);

      if (custRes && custRes.customers) setCustomers(custRes.customers);
      if (mechRes && mechRes.mechanics) setMechanics(mechRes.mechanics);
      if (usersRes) setAllUsers(usersRes);
    } catch (err) {
      console.error('Failed to load user rosters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const search = externalSearch || internalSearch;

  // Toggle user status (Suspend vs Activate)
  const handleToggleStatus = async (userId: string, currentStatus: string, userName: string) => {
    const nextStatus = currentStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const actionLabel = nextStatus === 'SUSPENDED' ? 'SUSPEND' : 'REACTIVATE';

    if (!window.confirm(`Are you sure you want to ${actionLabel} account access for "${userName}"?`)) return;

    try {
      await apiClient.updateUserStatus(userId, nextStatus);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  // Open Edit User Modal
  const handleOpenEditUser = (targetUser: any) => {
    setEditUserModalUser(targetUser);
    setEditFormData({
      name: targetUser.name || '',
      email: targetUser.email || '',
      phone: targetUser.phone || targetUser.phoneNumber || '',
      role: targetUser.role || 'CUSTOMER',
      newPassword: ''
    });
    setEditError(null);
  };

  // Save Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUserModalUser) return;
    setIsSavingEdit(true);
    setEditError(null);

    try {
      await apiClient.updateAdminUser(editUserModalUser.id, {
        name: editFormData.name,
        email: editFormData.email,
        phone: editFormData.phone,
        role: editFormData.role,
        ...(editFormData.newPassword ? { password: editFormData.newPassword } : {})
      });
      setEditUserModalUser(null);
      await fetchAllData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user profile');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Admin password reset
  const handleConfirmResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordModalUser) return;

    try {
      setIsResetting(true);
      await apiClient.adminResetPassword(resetPasswordModalUser.id, tempPassword);
      setResetSuccessMessage(`Password successfully reset for ${resetPasswordModalUser.name}. Temporary credentials: "${tempPassword}"`);
      setTimeout(() => {
        setResetPasswordModalUser(null);
        setResetSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  // Staff creation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onCreateStaff(name, email, password, role, phone);
      setShowStaffModal(false);
      setName('');
      setEmail('');
      setPhone('');
      await fetchAllData();
    } catch (err) {
      console.error('Failed to create staff:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (targetUser: any) => {
    if (user?.role !== 'ADMIN') return;
    if (targetUser.id === user.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }

    if (!window.confirm(`Permanently delete account for "${targetUser.name}" (${targetUser.email})?`)) return;

    setDeletingId(targetUser.id);
    try {
      await apiClient.deleteUser(targetUser.id);
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user account.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      return (
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        (c.phone && c.phone.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [customers, search]);

  const filteredMechanics = useMemo(() => {
    return mechanics.filter((m) => {
      return (
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase()) ||
        (m.specialization && m.specialization.toLowerCase().includes(search.toLowerCase())) ||
        (m.serviceCenterName && m.serviceCenterName.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [mechanics, search]);

  const filteredAllUsers = useMemo(() => {
    return allUsers.filter((u) => {
      return (
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [allUsers, search]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Fleet Personnel & Identity Matrix
            </span>
          </div>
          <h1 className="text-2xl font-black text-white font-['Oswald'] uppercase tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-400" />
            Enterprise User & Access Management
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Oversee registered customer fleets, manage certified technician assignments, reset credentials, and enforce RBAC account security.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
            <span>Sync</span>
          </button>

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => setShowStaffModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs font-['Oswald'] uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4 text-slate-950" />
              <span>Create Staff Member</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Total Customers</span>
          <div className="text-2xl font-black text-white font-mono">{customers.length}</div>
          <span className="text-[10px] text-slate-500">Registered fleet accounts</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Active Technicians</span>
          <div className="text-2xl font-black text-indigo-400 font-mono">{mechanics.length}</div>
          <span className="text-[10px] text-indigo-400/80">Certified bay mechanics</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Total Fleet Assets</span>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {customers.reduce((acc, c) => acc + (c.vehicleCount || 0), 0)}
          </div>
          <span className="text-[10px] text-amber-400/80">Vehicles managed</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg">
          <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">Customer Revenue</span>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            ₹{customers.reduce((acc, c) => acc + (c.totalSpent || 0), 0).toLocaleString()}
          </div>
          <span className="text-[10px] text-emerald-400/80">Lifetime customer spending</span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 shadow-lg">
        {/* Sub tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('CUSTOMERS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'CUSTOMERS' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Customers ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('MECHANICS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'MECHANICS' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Mechanics ({mechanics.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('ALL')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'ALL' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Personnel ({allUsers.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* 1. CUSTOMERS ROSTER TAB */}
      {activeSubTab === 'CUSTOMERS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Customer Name & Email</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Fleet Size</th>
                  <th className="py-3.5 px-4">Total Spent</th>
                  <th className="py-3.5 px-4">Completed Services</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                      Loading customer fleet roster...
                    </td>
                  </tr>
                ) : filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                      No customer accounts found.
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const isSuspended = cust.status === 'SUSPENDED';
                    return (
                      <tr key={cust.id} className="hover:bg-slate-850/60 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white group-hover:text-amber-400 transition-colors">
                            {cust.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{cust.email}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-300">{cust.phone || cust.phoneNumber || '+91 98110 00000'}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => setSelectedCustomerFleet(cust)}
                            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-amber-400 hover:border-amber-500/40 transition-colors font-mono cursor-pointer"
                          >
                            <Car className="w-3 h-3 text-amber-400" />
                            <span>{cust.vehicleCount ?? (cust.vehicles?.length || 0)} Vehicles</span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-emerald-400">
                            ₹{(cust.totalSpent || 0).toLocaleString()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-300">{cust.completedServicesCount || 0} jobs</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isSuspended
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(cust)}
                              title="Edit User"
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => setResetPasswordModalUser(cust)}
                              title="Reset Password"
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1"
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>Reset PW</span>
                            </button>

                            <button
                              onClick={() => handleToggleStatus(cust.id, cust.status || 'ACTIVE', cust.name)}
                              title={isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                              className={`px-2 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                                isSuspended
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {isSuspended ? 'Activate' : 'Suspend'}
                            </button>

                            {user?.role === 'ADMIN' && cust.id !== user?.id && (
                              <button
                                onClick={() => handleDeleteUser(cust)}
                                disabled={deletingId === cust.id}
                                title="Delete User"
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. MECHANICS ROSTER TAB */}
      {activeSubTab === 'MECHANICS' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Technician Name</th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4">Assigned Service Center</th>
                  <th className="py-3.5 px-4">Active Tasks</th>
                  <th className="py-3.5 px-4">Rating</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                      Loading mechanic personnel roster...
                    </td>
                  </tr>
                ) : filteredMechanics.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                      No mechanics found.
                    </td>
                  </tr>
                ) : (
                  filteredMechanics.map((mech) => {
                    const isSuspended = mech.status === 'SUSPENDED';
                    return (
                      <tr key={mech.id} className="hover:bg-slate-850/60 transition-colors group">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                            <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                            {mech.name}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">{mech.email}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">
                            {mech.specialization || 'General Diagnostics & Repair'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-slate-300 font-medium">{mech.serviceCenterName || 'Central Bay'}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{mech.phone || '+91 98110 88221'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            {mech.activeTasksCount ?? 1} in progress
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-amber-400 font-mono font-bold">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span>{mech.rating ?? '4.9'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              isSuspended
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            }`}
                          >
                            {isSuspended ? 'SUSPENDED' : 'ACTIVE'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(mech)}
                              title="Edit Mechanic"
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => setResetPasswordModalUser(mech)}
                              title="Reset Password"
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1"
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>Reset PW</span>
                            </button>

                            <button
                              onClick={() => handleToggleStatus(mech.id, mech.status || 'ACTIVE', mech.name)}
                              title={isSuspended ? 'Reactivate Account' : 'Suspend Account'}
                              className={`px-2 py-1 rounded text-[10px] font-mono transition-all cursor-pointer ${
                                isSuspended
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {isSuspended ? 'Activate' : 'Suspend'}
                            </button>

                            {user?.role === 'ADMIN' && mech.id !== user?.id && (
                              <button
                                onClick={() => handleDeleteUser(mech)}
                                disabled={deletingId === mech.id}
                                title="Delete Mechanic"
                                className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. ALL PERSONNEL MATRIX TAB */}
      {activeSubTab === 'ALL' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">User ID & Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">System Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAllUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-850/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{u.id}</div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 font-mono">{u.email}</td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : u.role === 'MECHANIC'
                            ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          u.status === 'SUSPENDED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {u.status || 'ACTIVE'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          title="Edit User"
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-[10px] font-mono cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setResetPasswordModalUser(u)}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 text-[10px] font-mono cursor-pointer"
                        >
                          Reset PW
                        </button>
                        {u.id !== user?.id && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={deletingId === u.id}
                            title="Delete User"
                            className="p-1 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {editUserModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase font-['Oswald'] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                Edit Account: {editUserModalUser.name}
              </h3>
              <button onClick={() => setEditUserModalUser(null)} className="text-slate-400 hover:text-white cursor-pointer">
                ✕
              </button>
            </div>

            {editError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1 font-mono">Full Name *</label>
                <input
                  type="text"
                  required
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1 font-mono">Email Address *</label>
                <input
                  type="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1 font-mono">Phone Number</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  placeholder="+91 98110 88221"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1 font-mono">Account Role *</label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as Role })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="MECHANIC">MECHANIC</option>
                  <option value="ADMIN">ADMINISTRATOR</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1 font-mono">
                  New Password (leave blank to keep unchanged)
                </label>
                <input
                  type="password"
                  value={editFormData.newPassword}
                  onChange={(e) => setEditFormData({ ...editFormData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditUserModalUser(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-['Oswald'] uppercase tracking-wider shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {isSavingEdit ? 'Saving...' : 'Update Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetPasswordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase font-['Oswald'] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                Admin Password Reset
              </h3>
              <button onClick={() => setResetPasswordModalUser(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Assign a temporary password for <span className="text-amber-400 font-bold">{resetPasswordModalUser.name}</span> ({resetPasswordModalUser.email}).
            </p>

            {resetSuccessMessage ? (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                {resetSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleConfirmResetPassword} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">New Temporary Password:</label>
                  <input
                    type="text"
                    required
                    value={tempPassword}
                    onChange={(e) => setTempPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setResetPasswordModalUser(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-['Oswald'] uppercase tracking-wider shadow-lg shadow-amber-500/20"
                  >
                    {isResetting ? 'Updating...' : 'Set Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CUSTOMER FLEET ASSETS MODAL */}
      {selectedCustomerFleet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase font-['Oswald'] flex items-center gap-2">
                <Car className="w-4 h-4 text-amber-400" />
                Fleet Registered to {selectedCustomerFleet.name}
              </h3>
              <button onClick={() => setSelectedCustomerFleet(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Customer Email: <span className="text-slate-200 font-mono">{selectedCustomerFleet.email}</span> • Total Spent: <span className="text-emerald-400 font-mono font-bold">₹{(selectedCustomerFleet.totalSpent || 0).toLocaleString()}</span>
            </p>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {(selectedCustomerFleet.vehicles || []).length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-mono bg-slate-950 rounded-xl border border-slate-800">
                  No registered vehicles on file for this customer.
                </div>
              ) : (
                selectedCustomerFleet.vehicles.map((v: any) => (
                  <div key={v.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{v.make} {v.model} ({v.year})</div>
                      <div className="text-[10px] font-mono text-amber-400">Plate: {v.licensePlate} • {v.vehicleType}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-slate-400 block">{v.mileage?.toLocaleString() ?? 45000} km</span>
                      <span className="text-[9px] font-mono text-emerald-400">{v.fuelType || 'Petrol'}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedCustomerFleet(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {showStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white uppercase font-['Oswald']">
                Create Operational Staff Account
              </h3>
              <button onClick={() => setShowStaffModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Master Technician Vikram"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@fleetops.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Initial Password *</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter initial password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Role *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="MECHANIC">MECHANIC</option>
                    <option value="ADMIN">ADMINISTRATOR</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98110 88221"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowStaffModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-['Oswald'] uppercase tracking-wider shadow-lg shadow-amber-500/20"
                >
                  {submitting ? 'Creating...' : 'Register Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
