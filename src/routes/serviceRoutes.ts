import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo } from '../middlewares/roleMiddleware.ts';
import { updateBookingStatus, addRepairLog, getRepairLogs } from '../controllers/bookingController.ts';

const router = Router();

router.use(authMiddleware);

// PATCH /api/service/:id/status
router.patch('/:id/status', restrictTo('ADMIN', 'MECHANIC'), updateBookingStatus);

// POST /api/service/:id/logs
router.post('/:id/logs', restrictTo('ADMIN', 'MECHANIC'), addRepairLog);

// GET /api/service/:id/logs
router.get('/:id/logs', getRepairLogs);

export default router;
