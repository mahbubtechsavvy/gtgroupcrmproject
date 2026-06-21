'use client';

import { useState } from 'react';
import { Search, Plus, MessageSquare, Hash, Users } from 'lucide-react';
import GroupItem from './GroupItem';
import DMItem from './DMItem';
import styles from '@/app/chat/chat.module.css';

export default function ChatSidebar({ 
  groups, 
  conversations, 
  activeChannel, 
  setActiveChannel, 
  unreadCounts,
  user,
  onlineUsers = {},
  onNewChat,
  onNewGroup,
  onAddMember 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dms');

  const getOtherParticipant = (conv) => {
    if (!user) return null;
    return conv.participant_a?.id === user.id ? conv.participant_b : conv.participant_a;
  };

  const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredDMs = conversations.filter(c => {
    const otherUser = getOtherParticipant(c);
    return otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <MessageSquare size={20} className="text-gold" />
            Communications
          </h2>
          <div className="flex gap-2">
            <button 
              className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
              onClick={onNewChat}
              title="New Chat"
            >
              <Plus size={18} />
            </button>
            <button 
              className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
              onClick={onNewGroup}
              title="Create Group"
            >
              <Users size={18} />
            </button>
            {activeChannel?.type === 'group' && (
              <button 
                className="p-1.5 rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
                onClick={onAddMember}
                title="Add Member"
              >
                <Plus size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-gold transition-colors" size={14} />
          <input 
            type="text" 
            placeholder="Search messages or people..."
            className="w-full bg-surface-2 border border-border rounded-xl py-2 pl-9 pr-4 text-xs focus:border-gold/50 focus:outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex border-b border-border mb-2 px-4">
        <button 
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'dms' ? 'border-gold text-gold' : 'border-transparent text-text-dim hover:text-text'}`}
          onClick={() => setActiveTab('dms')}
        >
          Direct Messages
        </button>
        <button 
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'groups' ? 'border-gold text-gold' : 'border-transparent text-text-dim hover:text-text'}`}
          onClick={() => setActiveTab('groups')}
        >
          Channels
        </button>
      </div>

      <div className={styles.channelList}>
        {activeTab === 'dms' ? (
          <div className="space-y-0.5">
            {filteredDMs.length > 0 ? (
              filteredDMs.map(conv => (
                <DMItem 
                  key={conv.id}
                  conversation={conv}
                  otherUser={getOtherParticipant(conv)}
                  isActive={activeChannel?.type === 'dm' && activeChannel.id === conv.id}
                  unreadCount={unreadCounts.dms?.[conv.id] || 0}
                  isOnline={!!onlineUsers[getOtherParticipant(conv)?.id]}
                  onClick={() => setActiveChannel({ 
                    type: 'dm', 
                    id: conv.id, 
                    name: getOtherParticipant(conv)?.full_name,
                    data: conv
                  })}
                />
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-4 opacity-50">
                  <Users size={20} className="text-text-dim" />
                </div>
                <div className="text-[10px] text-text-dim uppercase tracking-widest italic">
                  No direct messages found
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredGroups.length > 0 ? (
              filteredGroups.map(group => (
                <GroupItem 
                  key={group.id}
                  group={group}
                  isActive={activeChannel?.type === 'group' && activeChannel.id === group.id}
                  unreadCount={unreadCounts.groups?.[group.id] || 0}
                  onClick={() => setActiveChannel({ 
                    type: 'group', 
                    id: group.id, 
                    name: group.name,
                    data: group
                  })}
                />
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mx-auto mb-4 opacity-50">
                  <Hash size={20} className="text-text-dim" />
                </div>
                <div className="text-[10px] text-text-dim uppercase tracking-widest italic">
                  No groups found
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-auto p-4 border-t border-border bg-surface-1/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center">
            <span className="text-xs font-bold text-gold">{user?.full_name?.charAt(0)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold">{user?.full_name}</span>
            <span className="text-[10px] text-text-dim uppercase">{user?.role}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
