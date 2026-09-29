import React from 'react';
import {
  Calendar,
  CheckCircle,
  Clock,
  Wrench,
  Receipt,
  DollarSign,
  Star,
  ShieldCheck,
  Bell,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { Notification, NotificationType } from '../../types.ts';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate?: (link?: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate
}) => {
  const getIconAndStyle = (type: NotificationType) => {
    switch (type) {
      case 'BOOKING_CREATED':
        return {
          icon: Calendar,
          bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
          badge: 'New Booking'
        };
      case 'BOOKING_APPROVED':
        return {
          icon: CheckCircle,
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          badge: 'Approved'
        };
      case 'MECHANIC_ASSIGNED':
        return {
          icon: Wrench,
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          badge: 'Assigned'
        };
      case 'SERVICE_PROGRESS_UPDATE':
        return {
          icon: Clock,
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          badge: 'In Progress'
        };
      case 'SERVICE_COMPLETED':
        return {
          icon: CheckCircle,
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          badge: 'Completed'
        };
      case 'INVOICE_GENERATED':
        return {
          icon: Receipt,
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          badge: 'Invoice'
        };
      case 'PAYMENT_RECEIVED':
        return {
          icon: DollarSign,
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          badge: 'Payment'
        };
      case 'REVIEW_RECEIVED':
        return {
          icon: Star,
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          badge: 'Review'
        };
      case 'SERVICE_CENTER_VERIFICATION':
        return {
          icon: ShieldCheck,
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          badge: 'Verification'
        };
      default:
        return {
          icon: Bell,
          bg: 'bg-slate-700/30 border-slate-600/30 text-slate-300',
          badge: 'Alert'
        };
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const config = getIconAndStyle(notification.type);
  const Icon = config.icon;

  return (
    <div
      id={`notification-card-${notification.id}`}
      className={`p-3.5 transition-all border-b border-slate-800/80 flex items-start gap-3 group relative ${
        notification.isRead
          ? 'bg-slate-950/40 hover:bg-slate-900/60 opacity-80'
          : 'bg-slate-900/80 hover:bg-slate-850 border-l-2 border-l-amber-500'
      }`}
    >
      {/* Icon Badge */}
      <div className={`p-2 rounded-xl border shrink-0 ${config.bg}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h4
              className={`text-xs font-bold font-['Oswald'] uppercase tracking-wider truncate ${
                notification.isRead ? 'text-slate-300' : 'text-amber-400'
              }`}
            >
              {notification.title}
            </h4>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border bg-slate-800/80 border-slate-700 text-slate-400">
              {config.badge}
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-500 shrink-0">
            {formatRelativeTime(notification.createdAt)}
          </span>
        </div>

        <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">
          {notification.message}
        </p>

        {/* Action Bar */}
        <div className="flex items-center justify-between mt-2 pt-1">
          <div className="flex items-center gap-2">
            {!notification.isRead && (
              <button
                type="button"
                onClick={() => onMarkAsRead(notification.id)}
                className="text-[10px] font-mono font-medium text-amber-500 hover:text-amber-400 hover:underline cursor-pointer"
              >
                Mark as read
              </button>
            )}

            {notification.link && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate(notification.link)}
                className="text-[10px] font-mono font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <span>View</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDelete(notification.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
            title="Delete notification"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
