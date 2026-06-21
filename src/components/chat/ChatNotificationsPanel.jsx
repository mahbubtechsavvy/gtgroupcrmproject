'use client';

import { X, Bell, Check, Trash2 } from 'lucide-react';

export default function ChatNotificationsPanel({
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onDelete,
  onClose,
}) {
  return (
    <div className="flex flex-col h-full bg-surface-1 border border-border rounded-3xl overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-2">
        <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-gold">
          <Bell size={18} />
          Notifications
        </div>
        <button onClick={onClose} className="text-text-dim hover:text-white transition-colors" title="Close notifications">
          <X size={18} />
        </button>
      </div>

      <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs text-text-dim uppercase tracking-[0.2em]">Unread</span>
          <span className="inline-flex items-center justify-center rounded-full bg-gold px-3 py-1 text-[11px] font-semibold text-black">
            {unreadCount}
          </span>
        </div>
        <button
          type="button"
          onClick={onMarkRead}
          className="text-[11px] uppercase tracking-[0.2em] font-semibold text-white bg-blue-600/90 px-3 py-2 rounded-full hover:bg-blue-500 transition-colors"
        >
          Mark all read
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center text-sm text-text-dim py-12">
            No chat notifications yet. New messages will appear here.
          </div>
        ) : (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-3xl border ${notification.is_read ? 'border-surface-4 bg-surface-2/70' : 'border-gold/25 bg-gold/5'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-[0.25em] text-text-dim mb-2">{notification.type.replace('_', ' ')}</div>
                  <div className="text-sm font-semibold text-white leading-snug">{notification.message_preview || notification.content || 'New chat update'}</div>
                  <div className="mt-2 text-[11px] text-text-dim">{new Date(notification.created_at).toLocaleString()}</div>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(notification.id)}
                  className="text-text-dim hover:text-red-400 transition-colors"
                  title="Dismiss notification"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-border bg-surface-2 text-[11px] text-text-dim">
        Chat notifications are stored securely and visible only to your account.
      </div>
    </div>
  );
}
