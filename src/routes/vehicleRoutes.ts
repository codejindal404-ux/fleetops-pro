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
  checkAllRemindersAdmin,
  getVehicleCatalog,
  getVehicleCategoriesEndpoint,
  addCatalogCompany,
  addCatalogModel,
  getVehicleStats
} from '../controllers/vehicleController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';

const router = Router();

router.use(authMiddleware);

// Catalog & Fleet Analytics Endpoints (must come before /:id)
router.get('/catalog', getVehicleCatalog);
router.get('/catalog/categories', getVehicleCategoriesEndpoint);
router.post('/catalog/company', [
  body('company').trim().notEmpty().withMessage('Company name is required')
], addCatalogCompany);
router.post('/catalog/model', [
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('model').trim().notEmpty().withMessage('Model is required')
], addCatalogModel);
router.get('/stats', getVehicleStats);

// Fleet-wide reminder check (admin)
router.post('/reminders/check-all', checkAllRemindersAdmin);

// Base Vehicle CRUD
router.post(
  '/',
  [
    body('registrationNumber').trim().notEmpty().isLength({ max: 30 }).withMessage('Registration number is required (max 30 chars)'),
    body('company').optional().trim().notEmpty().isLength({ max: 50 }).withMessage('Company cannot be empty'),
    body('brand').optional().trim().notEmpty().isLength({ max: 50 }).withMessage('Brand cannot be empty'),
    body('model').trim().notEmpty().isLength({ max: 50 }).withMessage('Model is required (max 50 chars)'),
    body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage(`Valid year between 1900 and ${new Date().getFullYear() + 1} is required`),
    body('manufacturingYear').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage(`Valid year between 1900 and ${new Date().getFullYear() + 1} is required`),
    body('vehicleType').optional().trim().isLength({ max: 50 }).withMessage('Vehicle type must be under 50 characters')
  ],
  addVehicle
);

router.get('/', getVehicles);

// Single Vehicle details & reminders
router.get('/:id', getVehicleById);
router.get('/:id/reminders', getVehicleReminders);
router.post('/:id/reminders/evaluate', evaluateAndTriggerReminder);
router.put('/:id/reminders/config', updateReminderConfig);
router.patch('/:id/mileage', updateVehicleMileageOnly);

router.put(
  '/:id',
  [
    body('registrationNumber').optional().trim().notEmpty().isLength({ max: 30 }).withMessage('Registration number cannot be empty'),
    body('company').optional().trim().notEmpty().isLength({ max: 50 }).withMessage('Company cannot be empty'),
    body('brand').optional().trim().notEmpty().isLength({ max: 50 }).withMessage('Brand cannot be empty'),
    body('model').optional().trim().notEmpty().isLength({ max: 50 }).withMessage('Model cannot be empty'),
    body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage(`Valid year between 1900 and ${new Date().getFullYear() + 1} is required`),
    body('mileage').optional().isFloat({ min: 0 }).withMessage('Mileage must be a non-negative number')
  ],
  updateVehicle
);

router.delete('/:id', deleteVehicle);

export default router;
