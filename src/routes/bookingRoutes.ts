import { Router } from 'express';
import { body } from 'express-validator';
import {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  assignMechanic,
  addRepairLog,
  getRepairLogs,
  getAdminBookings,
  deleteAllBookings,
  deleteBooking
} from '../controllers/bookingController.ts';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';

const router = Router();

router.use(authMiddleware);

// Admin special booking route
router.get('/admin/bookings', restrictTo('ADMIN'), getAdminBookings);

router.post(
  '/',
  restrictTo('CUSTOMER', 'ADMIN'),
  [
    body('vehicleId').trim().notEmpty().withMessage('vehicleId is required'),
    body('serviceType').trim().notEmpty().isLength({ max: 100 }).withMessage('serviceType is required (max 100 chars)'),
    body('preferredDate').trim().notEmpty().isISO8601().withMessage('preferredDate must be a valid ISO date string')
  ],
  createBooking
);

router.get('/', getBookings);

router.get('/:id', getBookingById);

router.patch(
  '/:id/status',
  restrictTo('ADMIN', 'MECHANIC'),
  [body('status').trim().isIn(['PENDING', 'APPROVED', 'ASSIGNED', 'REPAIRING', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status value')],
  updateBookingStatus
);

router.patch(
  '/:id/assign-mechanic',
  restrictTo('ADMIN'),
  [body('mechanicId').trim().notEmpty().withMessage('mechanicId is required')],
  assignMechanic
);

router.post(
  '/:id/repair-logs',
  restrictTo('ADMIN', 'MECHANIC'),
  [body('note').trim().notEmpty().isLength({ max: 1000 }).withMessage('Repair log note is required (max 1000 chars)')],
  addRepairLog
);

router.get('/:id/repair-logs', getRepairLogs);

router.delete('/all', restrictTo('ADMIN'), deleteAllBookings);
router.delete('/:id', deleteBooking);

export default router;
