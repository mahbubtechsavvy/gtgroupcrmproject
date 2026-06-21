'use client';

import { Hash, Info, MoreVertical, Star, Shield, Bell, BellOff, Search } from 'lucide-react';
import styles from '@/app/chat/chat.module.css';

export default function ChatHeader({ activeChannel, otherUser, unreadCount, onToggleNotifications, isMuted, onToggleMute, isOnline, onSearchClick }) {
  if (!activeChannel) return null;

  return (
    <div className={styles.chatHeader}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
          {activeChannel.type === 'group' ? (
            <Hash size={20} />
          ) : (
            otherUser?.avatar_url ? (
              <img src={otherUser.avatar_url} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              <span className="font-bold">{activeChannel.name.charAt(0)}</span>
            )
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold">{activeChannel.name}</h3>
            {activeChannel.type === 'group' && (
              <span className="rounded-full bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-gold">
                {activeChannel.data?.group_type || 'Channel'}
              </span>
            )}
            {activeChannel.type === 'group' && activeChannel.data?.is_private && (
              <span className="rounded-full bg-red-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-red-300">
                Private
              </span>
            )}
            <Star size={14} className="text-text-dim cursor-pointer hover:text-gold transition-colors" />
          </div>
          <span className="text-[10px] text-text-dim flex flex-wrap items-center gap-2">
            {activeChannel.type === 'group' ? (
              <>
                <span className="inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {activeChannel.data?.member_count ?? 0} members
                </span>
                <span className="text-text-dim">{activeChannel.data?.country ? activeChannel.data.country : activeChannel.data?.office_id ? `Office ${activeChannel.data.office_id}` : ''}</span>
              </>
            ) : (
              isOnline ? (
                <><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" /> Active Now</>
              ) : (
                <span className="text-text-dim/60 italic lowercase">away</span>
              )
            )}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button className={styles.iconButton} title="Search Messages" onClick={onSearchClick}>
          <Search size={18} />
        </button>
        <button 
          className={`${styles.iconButton} ${isMuted ? 'text-gold' : ''}`} 
          title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
          onClick={onToggleMute}
        >
          {isMuted ? <BellOff size={18} /> : <Bell size={18} />}
        </button>
        <button className={styles.iconButton} title="Channel Info">
          <Info size={18} />
        </button>
        <button className={`${styles.iconButton} relative`} title="Notifications" onClick={onToggleNotifications}>
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-black">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button className={styles.iconButton}>
          <MoreVertical size={18} />
        </button>
      </div>
    </div>
  );
}
