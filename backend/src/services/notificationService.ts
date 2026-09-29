import { Notification, NotificationType, Role, User } from '../types.ts';
import { firebaseService } from './firebaseService.ts';
import { sendToUser, sendToRole } from './socketService.ts';

export class NotificationService {
  /**
   * Create notification, store in Firestore, and dispatch real-time Socket.IO event
   */
  public async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    data?: any;
    targetRole?: Role;
  }): Promise<Notification> {
    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const record = await firebaseService.createDocument<Notification>(
      'notifications',
      {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        link: data.link || '',
        data: data.data || null,
        isRead: false
      },
      notifId
    );

    // Real-time notification dispatched directly to user's personal socket room
    sendToUser(data.userId, 'NOTIFICATION_RECEIVED', record);
    sendToUser(data.userId, data.type, record);

    // If target role is specified, broadcast event to role channel as well
    if (data.targetRole) {
      sendToRole(data.targetRole, data.type, record);
    }

    return record;
  }

  /**
   * Dispatch notification to all users of a specific role (e.g. all ADMINs or all MECHANICs)
   */
  public async notifyRole(role: Role, notification: {
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    data?: any;
  }): Promise<Notification[]> {
    const users = await firebaseService.getCollection<User>('users', [{ field: 'role', op: '==', value: role }]);
    const created: Notification[] = [];

    for (const u of users) {
      const record = await this.createNotification({
        userId: u.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        link: notification.link,
        data: notification.data,
        targetRole: role
      });
      created.push(record);
    }

    // Also broadcast on the role room
    sendToRole(role, notification.type, {
      title: notification.title,
      message: notification.message,
      type: notification.type,
      data: notification.data
    });

    return created;
  }

  /**
   * Fetch all notifications for a specific user
   */
  public async getUserNotifications(userId: string) {
    const list = await firebaseService.getNotificationsByUser(userId);
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const unreadCount = list.filter((n) => !n.isRead).length;
    return {
      notifications: list,
      unreadCount
    };
  }

  /**
   * Mark a single notification as read
   */
  public async markAsRead(id: string, userId: string): Promise<Notification | null> {
    const notif = await firebaseService.getDocument<Notification>('notifications', id);
    if (!notif || notif.userId !== userId) return null;
    return firebaseService.updateDocument<Notification>('notifications', id, { isRead: true });
  }

  /**
   * Mark all notifications as read for a user
   */
  public async markAllAsRead(userId: string): Promise<number> {
    const list = await firebaseService.getNotificationsByUser(userId);
    const unread = list.filter((n) => !n.isRead);
    for (const n of unread) {
      await firebaseService.updateDocument('notifications', n.id, { isRead: true });
    }
    return unread.length;
  }

  /**
   * Delete a notification
   */
  public async deleteNotification(id: string, userId: string): Promise<boolean> {
    const notif = await firebaseService.getDocument<Notification>('notifications', id);
    if (!notif || notif.userId !== userId) return false;
    return firebaseService.deleteDocument('notifications', id);
  }
}

export const notificationService = new NotificationService();
export default notificationService;
