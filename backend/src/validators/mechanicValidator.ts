import { body } from 'express-validator';

export const repairLogValidator = [
  body('bookingId').trim().notEmpty().withMessage('bookingId is required'),
  body('note').trim().notEmpty().withMessage('Log note is required')
];

export const assignMechanicValidator = [
  body('mechanicId').trim().notEmpty().withMessage('mechanicId is required')
];
