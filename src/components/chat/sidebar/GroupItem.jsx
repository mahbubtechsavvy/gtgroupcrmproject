'use client';

import { Hash } from 'lucide-react';
import styles from '@/app/chat/chat.module.css';

export default function GroupItem({ group, isActive, unreadCount, onClick }) {
  return (
    <div 
      className={`${styles.channelItem} ${isActive ? styles.active : ''}`}
      onClick={onClick}
    >
      <span className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-gold text-surface-1' : 'bg-surface-2 text-gold'}`}>
          <Hash size={18} />
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{group.name}</span>
            {unreadCount > 0 && (
              <span className="bg-gold text-surface-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="flex items-center gap-2 text-[10px] text-text-dim uppercase tracking-wider">
            {group.group_type}
            {group.is_private && <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-gold">Private</span>}
          </span>
        </div>
      </span>
      <div className="flex items-center gap-2 text-[10px] text-text-dim">
        <span>{group.member_count ?? 0} members</span>
        {group.is_general && (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 px-2 py-1 text-[10px] text-gold">
            General
          </span>
        )}
      </div>
    </div>
  );
}
