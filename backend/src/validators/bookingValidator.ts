import { body } from 'express-validator';

export const createBookingValidator = [
  body('vehicleId').trim().notEmpty().withMessage('Vehicle ID is required'),
  body('serviceType').trim().notEmpty().withMessage('Service type is required'),
  body('preferredDate').notEmpty().withMessage('Preferred date is required')
];

export const updateBookingStatusValidator = [
  body('status')
    .isIn(['PENDING', 'APPROVED', 'ASSIGNED', 'INSPECTION', 'REPAIRING', 'QUALITY_CHECK', 'COMPLETED', 'CANCELLED'])
    .withMessage('Invalid booking status')
];
