import { Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.ts';
import { notificationService } from '../services/notificationService.ts';

export class NotificationController {
  /**
   * GET /api/notifications
   * Get logged-in user's notifications + unread count
   */
  public async getNotifications(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const result = notificationService.getUserNotifications(req.user.userId);
      return res.json({
        success: true,
        data: result.notifications,
        unreadCount: result.unreadCount
      });
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to fetch notifications' });
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   * Mark notification as read
   */
  public async markAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { id } = req.params;
      const updated = notificationService.markAsRead(id, req.user.userId);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      return res.json({
        success: true,
        message: 'Notification marked as read',
        data: updated
      });
    } catch (err: any) {
      console.error('Error marking notification read:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to update notification' });
    }
  }

  /**
   * PATCH /api/notifications/read-all
   * Mark all notifications as read
   */
  public async markAllAsRead(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const updatedCount = notificationService.markAllAsRead(req.user.userId);
      return res.json({
        success: true,
        message: `${updatedCount} notifications marked as read`,
        updatedCount
      });
    } catch (err: any) {
      console.error('Error marking all notifications read:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to mark all as read' });
    }
  }

  /**
   * DELETE /api/notifications/:id
   * Delete notification
   */
  public async deleteNotification(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { id } = req.params;
      const deleted = notificationService.deleteNotification(id, req.user.userId);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
      }

      return res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (err: any) {
      console.error('Error deleting notification:', err);
      return res.status(500).json({ success: false, message: err.message || 'Failed to delete notification' });
    }
  }
}

export const notificationController = new NotificationController();
