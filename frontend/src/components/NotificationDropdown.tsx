import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Bell, CheckCircle2, XCircle, Info, CheckCheck, Trash2, Volume2 } from 'lucide-react';
import { API_BASE } from '../config';
import { useAuthStore } from '../store/useAuthStore';

interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'approved' | 'rejected' | 'deleted' | 'info';
  track_id?: number;
  is_read: number;
  created_at: string;
}

interface NotificationDropdownProps {
  onNavigate?: (view: 'all' | 'mine' | 'pending' | 'admin' | 'profile') => void;
}

// Play notification sound chime using Web Audio API synthesizer
export const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    // Pleasant double chime: C5 -> G5, E5 -> C6
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);

    osc2.frequency.setValueAtTime(659.25, now + 0.08);
    osc2.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
  } catch (err) {
    console.warn('Audio chime error:', err);
  }
};

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isFirstFetch = useRef<boolean>(true);
  const prevUnreadCount = useRef<number>(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(`${API_BASE}/notifications`);
      if (data.success) {
        const newCount = data.data.unreadCount || 0;
        const list = data.data.notifications || [];

        // Play chime sound if new unread notification arrived after initial load
        if (!isFirstFetch.current && newCount > prevUnreadCount.current) {
          playNotificationChime();
        }

        isFirstFetch.current = false;
        prevUnreadCount.current = newCount;
        setNotifications(list);
        setUnreadCount(newCount);
      }
    } catch (err) {
      console.warn('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s

    const handleTrackAddedEvent = () => {
      fetchNotifications();
    };
    window.addEventListener('track_added', handleTrackAddedEvent);

    return () => {
      clearInterval(interval);
      window.removeEventListener('track_added', handleTrackAddedEvent);
    };
  }, [user]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: number, isRead: number) => {
    if (isRead) return;
    try {
      await axios.put(`${API_BASE}/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (prevUnreadCount.current > 0) {
        prevUnreadCount.current = Math.max(0, prevUnreadCount.current - 1);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    handleMarkAsRead(item.id, item.is_read);
    setIsOpen(false);

    if (!onNavigate) return;

    const title = (item.title || '').toLowerCase();
    const type = item.type;

    if (title.includes('phê duyệt') || title.includes('duyệt bài hát') || type === 'info') {
      if (user?.role === 'admin') {
        onNavigate('pending');
      } else {
        onNavigate('mine');
      }
    } else if (type === 'approved' || type === 'rejected' || type === 'deleted') {
      onNavigate('mine');
    } else {
      onNavigate('all');
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      setLoading(true);
      await axios.put(`${API_BASE}/notifications/read-all`);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      prevUnreadCount.current = 0;
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays === 1) return 'Hôm qua';
      if (diffDays < 14) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(v => !v);
          if (!isOpen) fetchNotifications();
        }}
        title="Thông báo"
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-900/80 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/50 animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Mobile backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-3 top-14 z-50 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-md bg-zinc-900/98 border border-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-zinc-950/40">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-100">{t('notification.title')}</span>
              {unreadCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 font-medium border border-purple-500/30">
                  {unreadCount} {t('notification.unread')}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Test chime sound button */}
              <button
                onClick={playNotificationChime}
                title={t('notification.title')}
                className="p-1 rounded-lg text-zinc-400 hover:text-purple-400 hover:bg-white/5 transition-all"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading}
                  className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{t('notification.markAllRead')}</span>
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-zinc-500 text-xs flex flex-col items-center gap-2">
                <Bell className="w-8 h-8 opacity-30 text-zinc-400" />
                <span>{t('notification.noNotifications')}</span>
              </div>
            ) : (
              notifications.map(item => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 transition-all flex gap-3 cursor-pointer ${
                    !item.is_read
                      ? 'bg-purple-500/5 hover:bg-purple-500/10 border-l-2 border-purple-500'
                      : 'hover:bg-white/5 opacity-80 hover:opacity-100'
                  }`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {item.type === 'approved' && (
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                    {item.type === 'rejected' && (
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <XCircle className="w-4 h-4" />
                      </div>
                    )}
                    {item.type === 'deleted' && (
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </div>
                    )}
                    {item.type === 'info' && (
                      <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                        <Info className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <h4 className={`text-xs font-semibold truncate ${!item.is_read ? 'text-zinc-100' : 'text-zinc-300'}`}>
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-zinc-500 flex-shrink-0">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer note */}
          <div className="px-4 py-2 bg-zinc-950/60 border-t border-white/5 text-[10px] text-zinc-500 text-center flex items-center justify-between">
            <span>Thông báo tự động xóa sau 14 ngày</span>
            <span className="text-[9px] text-purple-400/80">Bấm vào để xem chi tiết</span>
          </div>
        </div>
      </>
    )}
    </div>
  );
};

