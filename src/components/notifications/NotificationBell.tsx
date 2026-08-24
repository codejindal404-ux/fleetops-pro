import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Notification } from '../../types.ts';
import { NotificationDropdown } from './NotificationDropdown.tsx';
import { socketClient } from '../../services/socketClient.ts';

interface NotificationBellProps {
  token: string | null;
  onNavigate?: (tabOrLink: string) => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ token, onNavigate }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
        setUnreadCount(json.unreadCount ?? json.data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    if (token) {
      socketClient.init(token);
    }

    const unsubStatus = socketClient.subscribeStatus((connected) => {
      setIsConnected(connected);
    });

    const unsubNotif = socketClient.subscribeNotifications((notif: Notification) => {
      setNotifications((prev) => {
        // Prevent duplicate
        if (prev.some((n) => n.id === notif.id)) return prev;
        return [notif, ...prev];
      });
      setUnreadCount((prev) => prev + 1);

      // Play soft audio chime
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } catch {
        // AudioContext not allowed or not supported in frame
      }
    });

    // Periodic polling fallback every 20 seconds
    const interval = setInterval(fetchNotifications, 20000);

    return () => {
      unsubStatus();
      unsubNotif();
      clearInterval(interval);
    };
  }, [token]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all notifications read:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        const target = notifications.find((n) => n.id === id);
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        if (target && !target.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef} id="realtime-notification-bell-wrapper">
      <button
        id="notification-bell-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
          unreadCount > 0
            ? 'bg-amber-500/10 text-amber-400 border-amber-500/50 hover:bg-amber-500/20 shadow-md shadow-amber-500/10'
            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-amber-400 hover:border-amber-500/30'
        }`}
        title="Real-Time Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span
            id="notification-unread-badge"
            className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-amber-500 text-slate-950 text-[10px] font-mono font-black rounded-full flex items-center justify-center ring-2 ring-slate-950 shadow-md animate-pulse"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationDropdown
        notifications={notifications}
        unreadCount={unreadCount}
        isConnected={isConnected}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
        onNavigate={onNavigate}
      />
    </div>
  );
};
