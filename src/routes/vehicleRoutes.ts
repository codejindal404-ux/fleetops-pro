import { Router } from 'express';
import { body } from 'express-validator';
import {
  addVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
  updateVehicleMileageOnly,
  updateReminderConfig,
  getVehicleReminders,
  evaluateAndTriggerReminder,
  checkAllRemindersAdmin
} from '../controllers/vehicleController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const router = Router();

router.use(authMiddleware);

// Base Vehicle CRUD
router.post(
  '/',
  [
    body('registrationNumber').trim().notEmpty().isLength({ max: 20 }).withMessage('Registration number is required (max 20 chars)'),
    body('brand').trim().notEmpty().isLength({ max: 50 }).withMessage('Brand is required (max 50 chars)'),
    body('model').trim().notEmpty().isLength({ max: 50 }).withMessage('Model is required (max 50 chars)'),
    body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage(`Valid year between 1900 and ${new Date().getFullYear() + 1} is required`),
    body('vehicleType').optional().trim().isLength({ max: 30 }).withMessage('Vehicle type must be under 30 characters')
  ],
  addVehicle
);

router.get('/', getVehicles);

// Fleet-wide reminder check (admin)
router.post('/reminders/check-all', checkAllRemindersAdmin);

// Single Vehicle details & reminders
router.get('/:id', getVehicleById);
router.get('/:id/reminders', getVehicleReminders);
router.post('/:id/reminders/evaluate', evaluateAndTriggerReminder);
router.put('/:id/reminders/config', updateReminderConfig);
router.patch('/:id/mileage', updateVehicleMileageOnly);

router.put(
  '/:id',
  [
    body('registrationNumber').optional().trim().notEmpty().isLength({ max: 20 }).withMessage('Registration number cannot be empty (max 20 chars)'),
    body('brand').optional().trim().notEmpty().isLength({ max: 50 }).withMessage('Brand cannot be empty (max 50 chars)'),
    body('model').optional().trim().notEmpty().isLength({ max: 50 }).withMessage('Model cannot be empty (max 50 chars)'),
    body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage(`Valid year between 1900 and ${new Date().getFullYear() + 1} is required`),
    body('mileage').optional().isFloat({ min: 0 }).withMessage('Mileage must be a non-negative number')
  ],
  updateVehicle
);

router.delete('/:id', deleteVehicle);

export default router;

