import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware.ts';
import { restrictTo, requirePermission } from '../middlewares/roleMiddleware.ts';
import { serviceCenterController } from '../controllers/serviceCenterController.ts';

const router = Router();

/**
 * CUSTOMER / PUBLIC ROUTES
 */

// GET /api/service-centers/nearby - Find nearby service centers sorted by score
router.get('/nearby', serviceCenterController.getNearby);

// GET /api/service-centers/recommended - Get AI recommended service centers
router.get('/recommended', serviceCenterController.getRecommended);
router.get('/recommendations', serviceCenterController.getRecommended);

// GET /api/service-centers - List service centers with search & filters
router.get('/', serviceCenterController.getAll);

// GET /api/service-centers/:id - Get complete service center details
router.get('/:id', serviceCenterController.getById);

// POST /api/service-centers/:id/book - Customer books service directly at center
router.post(
  '/:id/book',
  authMiddleware,
  requirePermission('SERVICE_CENTER_BOOK'),
  serviceCenterController.bookAtCenter
);

/**
 * MECHANIC / ADMIN ROUTES
 */

// PUT & PATCH /api/service-centers/:id/status - Update real-time operational status
router.put(
  '/:id/status',
  authMiddleware,
  requirePermission('SERVICE_CENTER_UPDATE_STATUS'),
  serviceCenterController.updateStatus
);
router.patch(
  '/:id/status',
  authMiddleware,
  requirePermission('SERVICE_CENTER_UPDATE_STATUS'),
  serviceCenterController.updateStatus
);

/**
 * ADMIN ONLY ROUTES
 */

// POST /api/service-centers - Register new service center
router.post(
  '/',
  authMiddleware,
  requirePermission('SERVICE_CENTER_CREATE'),
  serviceCenterController.create
);

// PUT & PATCH /api/service-centers/:id - Update service center details
router.put(
  '/:id',
  authMiddleware,
  requirePermission('SERVICE_CENTER_UPDATE'),
  serviceCenterController.update
);
router.patch(
  '/:id',
  authMiddleware,
  requirePermission('SERVICE_CENTER_UPDATE'),
  serviceCenterController.update
);

// PUT & PATCH /api/service-centers/:id/verify - Verify service center
router.put(
  '/:id/verify',
  authMiddleware,
  requirePermission('SERVICE_CENTER_VERIFY'),
  serviceCenterController.verify
);
router.patch(
  '/:id/verify',
  authMiddleware,
  requirePermission('SERVICE_CENTER_VERIFY'),
  serviceCenterController.verify
);

// DELETE /api/service-centers/:id - Delete service center
router.delete(
  '/:id',
  authMiddleware,
  restrictTo('ADMIN'),
  serviceCenterController.delete
);

export default router;
