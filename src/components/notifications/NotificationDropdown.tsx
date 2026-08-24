import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  Filter,
  Inbox,
  Sparkles,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';
import { Notification, NotificationType } from '../../types.ts';
import { NotificationCard } from './NotificationCard.tsx';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onNavigate?: (link?: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  isConnected,
  isOpen,
  onClose,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onNavigate
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'BOOKINGS' | 'PAYMENTS'>('ALL');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.isRead;
    if (filter === 'BOOKINGS') {
      return (
        n.type === 'BOOKING_CREATED' ||
        n.type === 'BOOKING_APPROVED' ||
        n.type === 'MECHANIC_ASSIGNED' ||
        n.type === 'SERVICE_PROGRESS_UPDATE' ||
        n.type === 'SERVICE_COMPLETED'
      );
    }
    if (filter === 'PAYMENTS') {
      return n.type === 'PAYMENT_RECEIVED' || n.type === 'INVOICE_GENERATED';
    }
    return true;
  });

  return (
    <div
      id="notification-dropdown-menu"
      className="absolute right-0 mt-3 w-84 sm:w-[420px] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col"
      style={{ maxHeight: '85vh' }}
    >
      {/* Dropdown Header */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Bell className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white font-['Oswald'] uppercase tracking-wider">
                Real-Time Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-mono font-black rounded-full">
                  {unreadCount} NEW
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isConnected ? (
                <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Socket.IO Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  Polling fallback
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="px-2.5 py-1 text-[10px] font-mono font-semibold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              title="Mark all as read"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center gap-1 text-[11px] font-mono overflow-x-auto">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            filter === 'ALL'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('UNREAD')}
          className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            filter === 'UNREAD'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('BOOKINGS')}
          className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            filter === 'BOOKINGS'
              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold'
              : 'text-slate-400 hover:text-blue-300'
          }`}
        >
          Bookings
        </button>
        <button
          type="button"
          onClick={() => setFilter('PAYMENTS')}
          className={`px-2.5 py-1 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
            filter === 'PAYMENTS'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold'
              : 'text-slate-400 hover:text-emerald-300'
          }`}
        >
          Billing
        </button>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 max-h-[380px]">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 px-6 text-center">
            <Inbox className="w-10 h-10 text-slate-700 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">No Notifications</p>
            <p className="text-[11px] text-slate-500 mt-1">
              You are all caught up! Real-time events will appear here instantly.
            </p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <NotificationCard
              key={notif.id}
              notification={notif}
              onMarkAsRead={onMarkAsRead}
              onDelete={onDelete}
              onNavigate={(link) => {
                onClose();
                if (onNavigate && link) onNavigate(link);
              }}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>FleetOps Enterprise Telemetry</span>
        </span>
        <span>{notifications.length} Total</span>
      </div>
    </div>
  );
};
