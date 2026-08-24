import { dbStore, NotificationRecord, NotificationType } from './dbStore.ts';
import { sendToUser, sendToRole } from './socketService.ts';
import { Role } from '../types.ts';

export class NotificationService {
  /**
   * Create notification, store in database, and dispatch real-time Socket.IO event
   */
  public async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    link?: string;
    data?: any;
    targetRole?: Role;
  }): Promise<NotificationRecord> {
    const record = dbStore.createNotification({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link,
      data: data.data,
      isRead: false
    });

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
  }): Promise<NotificationRecord[]> {
    const users = dbStore.getUsers().filter((u) => u.role === role);
    const created: NotificationRecord[] = [];

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
  public getUserNotifications(userId: string) {
    const list = dbStore.getUserNotifications(userId);
    const unreadCount = list.filter((n) => !n.isRead).length;
    return {
      notifications: list,
      unreadCount
    };
  }

  /**
   * Mark a single notification as read
   */
  public markAsRead(id: string, userId: string): NotificationRecord | null {
    return dbStore.markNotificationAsRead(id, userId);
  }

  /**
   * Mark all notifications as read for a user
   */
  public markAllAsRead(userId: string): number {
    return dbStore.markAllNotificationsAsRead(userId);
  }

  /**
   * Delete a notification
   */
  public deleteNotification(id: string, userId: string): boolean {
    return dbStore.deleteNotification(id, userId);
  }
}

export const notificationService = new NotificationService();
