import { BookingStatus } from '../types/index.ts';

export function validateBookingStatusTransition(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus
): { valid: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  if (currentStatus === 'CANCELLED') {
    return { valid: false, reason: 'Cannot change status of a cancelled booking.' };
  }

  if (currentStatus === 'COMPLETED') {
    return { valid: false, reason: 'Cannot change status of a completed booking.' };
  }

  const allowedTransitions: Record<BookingStatus, BookingStatus[]> = {
    PENDING: ['APPROVED', 'CANCELLED', 'ASSIGNED', 'INSPECTION'],
    APPROVED: ['ASSIGNED', 'INSPECTION', 'REPAIRING', 'CANCELLED'],
    ASSIGNED: ['INSPECTION', 'REPAIRING', 'CANCELLED'],
    INSPECTION: ['REPAIRING', 'QUALITY_CHECK', 'CANCELLED'],
    REPAIRING: ['QUALITY_CHECK', 'COMPLETED', 'INSPECTION', 'CANCELLED'],
    QUALITY_CHECK: ['COMPLETED', 'REPAIRING'],
    COMPLETED: [],
    CANCELLED: []
  };

  const allowed = allowedTransitions[currentStatus] || [];
  if (allowed.includes(targetStatus)) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Invalid status transition from ${currentStatus} to ${targetStatus}. Allowed transition from ${currentStatus} is: [${allowed.join(', ')}]`
  };
}
