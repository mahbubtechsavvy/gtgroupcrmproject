'use client';

import { MessageSquare } from 'lucide-react';
import styles from '@/app/chat/chat.module.css';

export default function DMItem({ conversation, otherUser, isActive, unreadCount, isOnline, onClick }) {
  if (!otherUser) return null;

  return (
    <div 
      className={`${styles.channelItem} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <span className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isActive ? 'bg-gold text-surface-1' : 'bg-surface-2 text-gold'}`}>
            {otherUser.avatar_url ? (
              <img src={otherUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              otherUser.full_name?.charAt(0) || 'U'
            )}
          </div>
          <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-surface-1 ${isOnline ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-text-dim/50'}`} />
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{otherUser.full_name}</span>
            {unreadCount > 0 && (
              <span className="bg-gold text-surface-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="text-[10px] text-text-dim uppercase tracking-wider">{otherUser.role || 'Staff'}</span>
        </div>
      </span>
    </div>
  );
}
