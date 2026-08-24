// Status transition validator for bookings and work orders

export const ALLOWED_STATUS_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['APPROVED', 'ASSIGNED', 'CANCELLED'],
  APPROVED: ['ASSIGNED', 'INSPECTION', 'REPAIRING', 'CANCELLED'],
  ASSIGNED: ['INSPECTION', 'REPAIRING', 'CANCELLED'],
  INSPECTION: ['REPAIRING', 'QUALITY_CHECK', 'CANCELLED'],
  REPAIRING: ['QUALITY_CHECK', 'COMPLETED', 'INSPECTION', 'CANCELLED'],
  QUALITY_CHECK: ['COMPLETED', 'REPAIRING', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: []
};

export function isValidStatusTransition(currentStatus: string, nextStatus: string): boolean {
  if (currentStatus === nextStatus) return true;
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(nextStatus);
}

export function validateBookingStatusTransition(
  currentStatus: string,
  nextStatus: string
): { valid: boolean; reason?: string } {
  if (currentStatus === nextStatus) {
    return { valid: true };
  }
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (allowed.includes(nextStatus)) {
    return { valid: true };
  }
  return {
    valid: false,
    reason: `Invalid status transition from ${currentStatus} to ${nextStatus}. Allowed: ${allowed.join(', ') || 'None'}`
  };
}

