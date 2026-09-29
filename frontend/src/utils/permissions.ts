import { Role, BookingStatus } from '../types.ts';

export type Permission =
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
    'tasks:view_assigned',
    'tasks:update_status',
    'tasks:add_repair_log',
    'tasks:upload_progress',
    'vehicles:view_assigned_job_details',
    'marketplace:create_verified'
  ],
  CUSTOMER: [
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

// Mechanic allowed status values
export const MECHANIC_ALLOWED_STATUSES: BookingStatus[] = [
  'PENDING',
  'APPROVED',
  'ASSIGNED',
  'INSPECTION',
  'REPAIRING',
  'TESTING',
  'QUALITY_CHECK',
  'COMPLETED'
];

export const hasPermission = (role: Role, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

export const canMechanicUpdateStatus = (targetStatus: BookingStatus): boolean => {
  return MECHANIC_ALLOWED_STATUSES.includes(targetStatus);
};
