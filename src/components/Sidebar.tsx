import React from 'react';
import {
  Car,
  Calendar,
  Wrench,
  Users,
  FileText,
  Receipt,
  UserCheck,
  UserCog,
  PlusCircle,
  ShieldCheck,
  Tag,
  ShieldAlert,
  MapPin,
  Building2,
  Award,
  UserCircle,
  PackageCheck,
  FileSpreadsheet
} from 'lucide-react';
import { User } from '../types.ts';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
  onOpenNewService: () => void;
  onLogout: () => void;
  onOpenEditProfile?: () => void;
  onOpenRBACTestSuite?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onOpenNewService,
  onLogout,
  onOpenEditProfile,
  onOpenRBACTestSuite
}) => {
  const navItems = [
    // CUSTOMER NAV
    { id: 'dashboard', label: 'Dashboard Overview', icon: FileText, roles: ['CUSTOMER'] },
    { id: 'service-centers', label: 'Service Center Map', icon: MapPin, roles: ['CUSTOMER'] },
    { id: 'vehicles', label: 'My Vehicles', icon: Car, roles: ['CUSTOMER'] },
    { id: 'bookings', label: 'My Bookings', icon: Calendar, roles: ['CUSTOMER'] },
    { id: 'rewards', label: 'Fleet Rewards & Club', icon: Award, roles: ['CUSTOMER'] },
    { id: 'invoices', label: 'Invoices & Billing', icon: Receipt, roles: ['CUSTOMER'] },
    { id: 'profile', label: 'Customer Profile', icon: UserCircle, roles: ['CUSTOMER'] },
    { id: 'marketplace', label: 'Fleet Marketplace', icon: Tag, roles: ['CUSTOMER'] },

    // MECHANIC NAV
    { id: 'tasks', label: 'Assigned Tasks', icon: Wrench, roles: ['MECHANIC'] },
    { id: 'service-centers', label: 'Service Center Map', icon: MapPin, roles: ['MECHANIC'] },
    { id: 'dashboard', label: 'Mechanic Overview', icon: FileText, roles: ['MECHANIC'] },
    { id: 'marketplace', label: 'Fleet Marketplace', icon: Tag, roles: ['MECHANIC'] },

    // ADMIN NAV
    { id: 'dashboard', label: 'Dashboard Overview', icon: FileText, roles: ['ADMIN'] },
    { id: 'service-centers', label: 'Garage Management', icon: Building2, roles: ['ADMIN'] },
    { id: 'all-bookings', label: 'Service Bookings', icon: Calendar, roles: ['ADMIN'] },
    { id: 'inventory', label: 'Catalog & Parts', icon: PackageCheck, roles: ['ADMIN'] },
    { id: 'vehicles', label: 'Fleet Vehicles', icon: Car, roles: ['ADMIN'] },
    { id: 'invoices', label: 'Invoices & Billing', icon: Receipt, roles: ['ADMIN'] },
    { id: 'reports', label: 'Executive Reports', icon: FileSpreadsheet, roles: ['ADMIN'] },
    { id: 'users', label: 'User Management', icon: Users, roles: ['ADMIN'] },
    { id: 'audit-logs', label: 'System Audit Logs', icon: ShieldAlert, roles: ['ADMIN'] },
    { id: 'marketplace', label: 'Fleet Marketplace', icon: Tag, roles: ['ADMIN'] }
  ];

  const visibleNavItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false
  );

  return (
    <aside className="w-[260px] bg-slate-950 text-slate-100 flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-slate-800/90 shadow-2xl">
      {/* Brand Header */}
      <div className="px-5 py-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black text-sm shadow-md shadow-amber-500/20 font-['Oswald'] border border-amber-400/40 shrink-0">
            FP
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white font-['Oswald'] uppercase flex items-center gap-1.5 leading-none">
              FleetOps <span className="text-amber-500">Pro</span>
            </h1>
            <p className="text-[10px] text-amber-500/80 font-mono tracking-wider uppercase mt-1">
              Automotive Bay Hub
            </p>
          </div>
        </div>
      </div>

      {/* Primary CTA (Customer & Admin only) */}
      {user?.role !== 'MECHANIC' && (
        <div className="p-3.5">
          <button
            onClick={onOpenNewService}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 font-['Oswald'] uppercase tracking-wider active:scale-98 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>New Service Request</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold shadow-xs'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* RBAC Test Suite Trigger */}
      {onOpenRBACTestSuite && (
        <div className="px-3 pb-2">
          <button
            onClick={onOpenRBACTestSuite}
            className="w-full bg-slate-900/80 hover:bg-amber-500/10 border border-slate-800 hover:border-amber-500/40 rounded-xl p-2 text-left flex items-center gap-2.5 transition-all text-slate-300 hover:text-amber-400 text-xs font-mono cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <div className="truncate">
              <span className="font-bold block leading-none">RBAC Test Suite</span>
              <span className="text-[9px] text-slate-500">Live Policy Matrix</span>
            </div>
          </button>
        </div>
      )}

      {/* Footer Profile & Quick Settings */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950">
        <button
          type="button"
          onClick={onOpenEditProfile}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/30 transition-all text-left group cursor-pointer"
          title="Click to edit profile settings"
        >
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 group-hover:border-amber-500/50 flex items-center justify-center font-bold text-xs text-amber-400 shrink-0 font-mono transition-colors">
              {user ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                {user ? user.name : 'Guest'}
              </p>
              <p className="text-[10px] text-amber-500/80 font-mono capitalize">
                {user ? user.role : 'Offline'}
              </p>
            </div>
          </div>
          <UserCog className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors shrink-0 ml-1" />
        </button>
      </div>
    </aside>
  );
};

