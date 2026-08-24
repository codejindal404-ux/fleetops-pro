import { NotificationType } from '../types/index.ts';

export interface NotificationModel {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  data?: string;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  data?: string;
}
