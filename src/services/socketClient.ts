import { io, Socket } from 'socket.io-client';
import { Notification } from '../types.ts';

type NotificationCallback = (notification: Notification) => void;
type StatusCallback = (connected: boolean) => void;

class SocketClientManager {
  private socket: Socket | null = null;
  private token: string | null = null;
  private notificationListeners: Set<NotificationCallback> = new Set();
  private statusListeners: Set<StatusCallback> = new Set();
  private isConnected: boolean = false;

  public init(token?: string) {
    const activeToken = token || localStorage.getItem('token');
    if (!activeToken) {
      this.disconnect();
      return;
    }

    if (this.socket && this.token === activeToken && this.socket.connected) {
      return;
    }

    this.token = activeToken;
    if (this.socket) {
      this.socket.disconnect();
    }

    // Connect to same origin
    this.socket = io({
      auth: { token: activeToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      console.log('⚡ Socket.IO client connected:', this.socket?.id);
      this.isConnected = true;
      this.notifyStatus(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO client disconnected:', reason);
      this.isConnected = false;
      this.notifyStatus(false);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('Socket connection error (fallback polling):', err.message);
      this.isConnected = false;
      this.notifyStatus(false);
    });

    // Handle universal notification event
    this.socket.on('NOTIFICATION_RECEIVED', (data: Notification) => {
      this.triggerNotification(data);
    });

    // Handle domain-specific notification events
    const eventTypes = [
      'BOOKING_CREATED',
      'BOOKING_APPROVED',
      'MECHANIC_ASSIGNED',
      'SERVICE_PROGRESS_UPDATE',
      'SERVICE_COMPLETED',
      'PAYMENT_RECEIVED',
      'INVOICE_GENERATED',
      'REVIEW_RECEIVED',
      'SERVICE_CENTER_VERIFICATION'
    ];

    eventTypes.forEach((evt) => {
      this.socket?.on(evt, (data: any) => {
        if (data && data.title && data.message) {
          this.triggerNotification(data);
        }
      });
    });
  }

  private triggerNotification(notification: Notification) {
    this.notificationListeners.forEach((cb) => {
      try {
        cb(notification);
      } catch (err) {
        console.error('Error in notification listener callback:', err);
      }
    });
  }

  private notifyStatus(status: boolean) {
    this.statusListeners.forEach((cb) => cb(status));
  }

  public subscribeNotifications(cb: NotificationCallback): () => void {
    this.notificationListeners.add(cb);
    return () => {
      this.notificationListeners.delete(cb);
    };
  }

  public subscribeStatus(cb: StatusCallback): () => void {
    this.statusListeners.add(cb);
    cb(this.isConnected);
    return () => {
      this.statusListeners.delete(cb);
    };
  }

  public getSocket(): Socket | null {
    return this.socket;
  }

  public getConnected(): boolean {
    return this.isConnected;
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.token = null;
    this.isConnected = false;
    this.notifyStatus(false);
  }
}

export const socketClient = new SocketClientManager();
export const getSocket = () => socketClient.getSocket();

