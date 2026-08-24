import { body } from 'express-validator';

export const createVehicleValidator = [
  body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1900, max: 2100 }).withMessage('Valid vehicle year is required'),
  body('vehicleType').trim().notEmpty().withMessage('Vehicle type is required')
];
