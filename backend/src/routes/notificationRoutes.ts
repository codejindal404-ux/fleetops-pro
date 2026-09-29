import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware.ts';
import { notificationController } from '../controllers/notificationController.ts';

const router = Router();

// All notification endpoints require JWT authentication
router.use(authenticateToken);

// GET /api/notifications - Get current logged-in user notifications
router.get('/', (req, res) => notificationController.getNotifications(req, res));

// PATCH /api/notifications/read-all - Mark all as read
router.patch('/read-all', (req, res) => notificationController.markAllAsRead(req, res));

// PATCH /api/notifications/:id/read - Mark single notification as read
router.patch('/:id/read', (req, res) => notificationController.markAsRead(req, res));

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', (req, res) => notificationController.deleteNotification(req, res));

export default router;
