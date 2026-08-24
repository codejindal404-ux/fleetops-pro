import { Role, BookingStatus } from '../types.ts';

export type Permission =
  // Service Center permissions
  | 'SERVICE_CENTER_CREATE'
  | 'SERVICE_CENTER_UPDATE'
  | 'SERVICE_CENTER_DELETE'
  | 'SERVICE_CENTER_VERIFY'
  | 'SERVICE_CENTER_ANALYTICS'
  | 'SERVICE_CENTER_VIEW'
  | 'SERVICE_CENTER_RECOMMEND'
  | 'SERVICE_CENTER_BOOK'
  | 'SERVICE_CENTER_UPDATE_STATUS'
  // Notification permissions
  | 'notifications:view'
  | 'notifications:manage'
  // Admin permissions
  | 'users:create_mechanic'
  | 'users:manage_all'
  | 'users:update'
  | 'users:delete'
  | 'audit:view'
  | 'vehicles:view_all'
  | 'vehicles:manage'
  | 'services:approve'
  | 'services:assign_mechanic'
  | 'services:update_status'
  | 'invoices:generate'
  | 'marketplace:manage'
  | 'analytics:view'
  | 'reports:manage'
  // Mechanic permissions
  | 'tasks:view_assigned'
  | 'tasks:update_status'
  | 'tasks:add_repair_log'
  | 'tasks:upload_progress'
  | 'vehicles:view_assigned_job_details'
  | 'marketplace:create_verified'
  // Customer permissions
  | 'auth:register'
  | 'auth:login_otp'
  | 'vehicles:add_own'
  | 'vehicles:view_own'
  | 'bookings:create'
  | 'bookings:view_own'
  | 'bookings:track_live'
  | 'invoices:view_own'
  | 'invoices:pay'
  | 'reviews:submit'
  | 'marketplace:browse'
  | 'marketplace:inquire';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    'SERVICE_CENTER_CREATE',
    'SERVICE_CENTER_UPDATE',
    'SERVICE_CENTER_DELETE',
    'SERVICE_CENTER_VERIFY',
    'SERVICE_CENTER_ANALYTICS',
    'SERVICE_CENTER_VIEW',
    'notifications:view',
    'notifications:manage',
    'users:create_mechanic',
    'users:manage_all',
    'users:update',
    'users:delete',
    'audit:view',
    'vehicles:view_all',
    'vehicles:manage',
    'services:approve',
    'services:assign_mechanic',
    'services:update_status',
    'invoices:generate',
    'marketplace:manage',
    'analytics:view',
    'reports:manage'
  ],
  MECHANIC: [
    'SERVICE_CENTER_UPDATE_STATUS',
    'SERVICE_CENTER_VIEW',
    'notifications:view',
    'tasks:view_assigned',
    'tasks:update_status',
    'tasks:add_repair_log',
    'tasks:upload_progress',
    'vehicles:view_assigned_job_details',
    'marketplace:create_verified'
  ],
  CUSTOMER: [
    'SERVICE_CENTER_VIEW',
    'SERVICE_CENTER_RECOMMEND',
    'SERVICE_CENTER_BOOK',
    'notifications:view',
    'auth:register',
    'auth:login_otp',
    'vehicles:add_own',
    'vehicles:view_own',
    'bookings:create',
    'bookings:view_own',
    'bookings:track_live',
    'invoices:view_own',
    'invoices:pay',
    'reviews:submit',
    'marketplace:browse',
    'marketplace:inquire'
  ]
};

export const ROLE_INFO: Record<Role, { title: string; badge: string; icon: string; color: string }> = {
  ADMIN: {
    title: 'System Administrator',
    badge: '👑 ADMIN',
    icon: 'ShieldAlert',
    color: 'border-rose-500/40 bg-rose-500/10 text-rose-400'
  },
  MECHANIC: {
    title: 'Certified Mechanic',
    badge: '🔧 MECHANIC',
    icon: 'Wrench',
    color: 'border-amber-500/40 bg-amber-500/10 text-amber-400'
  },
  CUSTOMER: {
    title: 'Fleet Vehicle Customer',
    badge: '🚗 CUSTOMER',
    icon: 'Car',
    color: 'border-blue-500/40 bg-blue-500/10 text-blue-400'
  }
};

export const hasPermission = (role: Role | undefined | null, permission: Permission): boolean => {
  if (!role) return false;
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

export const hasAnyRole = (currentRole: Role | undefined | null, allowedRoles: Role[]): boolean => {
  if (!currentRole) return false;
  return allowedRoles.includes(currentRole);
};
