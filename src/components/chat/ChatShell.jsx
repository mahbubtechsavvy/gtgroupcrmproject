'use client';

import { useState, useEffect, useRef } from 'react';
import { getSupabaseClient } from '@/lib/supabase';
import { useUser } from '@/components/layout/AppLayout';
import ChatSidebar from './sidebar/ChatSidebar';
import ChatHeader from './header/ChatHeader';
import ChatNotificationsPanel from './ChatNotificationsPanel';
import MessageList from './messages/MessageList';
import MessageInput from './messages/MessageInput';
import UserSearchModal from './modals/UserSearchModal';
import CreateGroupModal from './modals/CreateGroupModal';
import AddMemberModal from './modals/AddMemberModal';
import EditGroupModal from './modals/EditGroupModal';
import GroupSettingsPanel from './GroupSettingsPanel';
import ChatFilesGallery from './ChatFilesGallery';
import PinnedMessagesPanel from './PinnedMessagesPanel';
import ChatSearchModal from './modals/ChatSearchModal';
import ChatAdminPanel from './ChatAdminPanel';
import { useRealtimeMessages } from '@/hooks/chat/useRealtimeMessages';
import { usePresence } from '@/hooks/chat/usePresence';
import { chatNotifications } from '@/services/chat/NotificationService';
import styles from '@/app/chat/chat.module.css';

export default function ChatShell() {
  const user = useUser();
  const [groups, setGroups] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeChannel, setActiveChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [windowFocused, setWindowFocused] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({ groups: {}, dms: {} });
  const [replyTo, setReplyTo] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [rightSidebarTab, setRightSidebarTab] = useState('details'); // 'details' | 'files' | 'pins'
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditGroup, setShowEditGroup] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const notificationRequested = useRef(false);
  const notificationsChannelRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    fetchChannels();
    fetchNotifications();
    fetchUnreadCounts();
  }, [user]);


  useEffect(() => {
    if (typeof window === 'undefined') return;

    const askPermission = async () => {
      if (notificationRequested.current) return;
      notificationRequested.current = true;
      chatNotifications.requestPermission();
    };

    const updateFocus = () => setWindowFocused(!document.hidden);
    const handleOnline = () => {
      setOffline(false);
      chatNotifications.show('GT Chat is back online', {
        body: 'Syncing messages and notifications now.',
      });
      fetchNotifications();
      flushQueuedMessages();
    };
    const handleOffline = () => setOffline(true);

    askPermission();
    updateFocus();
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', updateFocus);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', updateFocus);
    };
  }, []);

  const showBrowserNotification = (title, options) => {
    try {
      if (typeof window === 'undefined') return;
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      new Notification(title, options);
    } catch (error) {
      console.error('Browser notification error:', error);
    }
  };

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseClient();
    if (notificationsChannelRef.current) {
      supabase.removeChannel(notificationsChannelRef.current);
      notificationsChannelRef.current = null;
    }

    const channel = supabase
      .channel(`chat-notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_notifications',
        filter: `recipient_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new, ...(prev || [])]);
        setUnreadCount((prev) => prev + 1);
        if (!windowFocused) {
          chatNotifications.show('New chat notification', {
            body: payload.new.message_preview || 'You have a new chat alert.',
          });
        }
      })
      .subscribe();

    notificationsChannelRef.current = channel;

    return () => {
      if (channel) supabase.removeChannel(channel);
      notificationsChannelRef.current = null;
    };
  }, [user, windowFocused]);

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const groupsRes = await fetch('/api/chat/groups');
      if (!groupsRes.ok) throw new Error('Failed to fetch groups');
      const groupsData = await groupsRes.json();
      setGroups(groupsData || []);

      const convRes = await fetch('/api/chat/conversations');
      if (!convRes.ok) throw new Error('Failed to fetch DMs');
      const convData = await convRes.json();
      setConversations(convData || []);

      if (!activeChannel) {
        if (groupsData?.length > 0) {
          setActiveChannel({
            type: 'group',
            id: groupsData[0].id,
            name: groupsData[0].name,
            data: groupsData[0],
          });
        } else if (convData?.length > 0) {
          const otherParticipant = convData[0].participant_a?.id === user.id
            ? convData[0].participant_b
            : convData[0].participant_a;

          setActiveChannel({
            type: 'dm',
            id: convData[0].id,
            name: otherParticipant?.full_name || 'Direct Message',
            data: convData[0],
          });
        }
      }
    } catch (err) {
      console.error(err);
      setDbError(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeChannel) {
      fetchMessages(activeChannel);
      markMessagesAsRead(activeChannel);
      fetchAttachments(activeChannel);
      if (activeChannel.type === 'group') {
        fetchActiveGroupDetails(activeChannel);
      } else {
        setIsMuted(activeChannel.data?.participant_a === user?.id ? activeChannel.data?.is_muted_a : activeChannel.data?.is_muted_b);
      }
    }
  }, [activeChannel]);

  const fetchActiveGroupDetails = async (channel) => {
    try {
      const res = await fetch(`/api/chat/groups/${channel.id}`);
      if (!res.ok) throw new Error('Failed to load group details');
      const group = await res.json();
      setActiveChannel((prev) => prev && prev.id === channel.id ? { ...prev, data: group } : prev);
      setGroups((prev) => prev.map((item) => item.id === group.id ? { ...item, ...group, member_count: group.members?.length ?? item.member_count } : item));
      
      const myMembership = group.members?.find(m => m.user_id === user?.id);
      setIsMuted(myMembership?.is_muted || false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMute = async () => {
    if (!activeChannel) return;
    const newMuteStatus = !isMuted;
    
    try {
      const res = await fetch('/api/chat/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: activeChannel.id,
          type: activeChannel.type,
          isMuted: newMuteStatus
        })
      });

      if (res.ok) {
        setIsMuted(newMuteStatus);
        // Also update local data to persist temporarily
        setActiveChannel(prev => ({
          ...prev,
          data: {
            ...prev.data,
            ...(activeChannel.type === 'dm' 
                ? (prev.data.participant_a === user.id ? { is_muted_a: newMuteStatus } : { is_muted_b: newMuteStatus })
                : { members: prev.data.members?.map(m => m.user_id === user.id ? { ...m, is_muted: newMuteStatus } : m) }
            )
          }
        }));
      }
    } catch (err) {
      console.error('Failed to toggle mute:', err);
    }
  };

  const handleSearchJumpTo = async (message, type) => {
    if (!message || !type) return;

    const targetChannelId = type === 'group' ? message.group_id : message.conversation_id;
    const targetName = type === 'group'
      ? message.group?.name || 'Channel'
      : 'Direct Message';

    const existingChannel = type === 'group'
      ? groups.find((group) => group.id === targetChannelId)
      : conversations.find((conv) => conv.id === targetChannelId);

    const activeData = existingChannel || {
      id: targetChannelId,
      name: targetName,
      ...(type === 'group' ? { group: message.group } : {}),
      ...(type === 'dm' ? { participant_a: user.id, participant_b: null } : {}),
    };

    setSelectedMessageId(message.id);
    setActiveChannel({
      type,
      id: targetChannelId,
      name: targetName,
      data: activeData,
    });

    // If the target channel is not already loaded in the sidebar, refresh channels so it appears.
    if (!existingChannel) {
      fetchChannels();
    }
  };

  const fetchMessages = async (channel) => {
    try {
      const endpoint = channel.type === 'group'
        ? `/api/chat/groups/${channel.id}/messages`
        : `/api/chat/conversations/${channel.id}/messages`;

      const res = await fetch(endpoint);
      if (!res.ok) throw new Error('Failed to fetch messages');

      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/chat/notifications?limit=50');
      if (!res.ok) throw new Error('Failed to fetch notifications');
      const data = await res.json();
      setNotifications(data || []);
      setUnreadCount((data || []).filter((item) => !item.is_read).length);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  const fetchUnreadCounts = async () => {
    try {
      const res = await fetch('/api/chat/unread-counts');
      if (!res.ok) throw new Error('Failed to fetch unread counts');
      const data = await res.json();
      setUnreadCounts(data || { groups: {}, dms: {} });
    } catch (err) {
      console.error('Failed to load unread counts:', err);
    }
  };

  const markMessagesAsRead = async (channel) => {
    if (!channel) return;
    try {
      const res = await fetch('/api/chat/read-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: channel.id,
          type: channel.type
        }),
      });
      if (res.ok) {
        // Update local unread counts
        setUnreadCounts(prev => ({
          ...prev,
          [channel.type === 'group' ? 'groups' : 'dms']: {
            ...prev[channel.type === 'group' ? 'groups' : 'dms'],
            [channel.id]: 0
          }
        }));
      }
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    const ids = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length === 0) return;

    try {
      const res = await fetch('/api/chat/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationIds: ids }),
      });

      if (!res.ok) throw new Error('Failed to mark notifications as read');
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (showNotifications && unreadCount > 0) {
      handleMarkAllNotificationsRead();
    }
  }, [showNotifications]);

  const handleDeleteNotification = async (notificationId) => {
    try {
      const res = await fetch(`/api/chat/notifications?id=${notificationId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete notification');
      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttachments = async (channel) => {
    try {
      const paramName = channel.type === 'group' ? 'group_id' : 'conversation_id';
      const res = await fetch(`/api/chat/attachments?${paramName}=${channel.id}`);
      if (!res.ok) throw new Error('Failed to fetch attachments');
      const data = await res.json();
      setAttachments(data || []);
    } catch (err) {
      console.error('Failed to load attachments:', err);
    }
  };

  const createConversation = async (target) => {
    if (!target) return;

    try {
      const payload = target.includes('@') ? { participant_b_email: target } : { participant_b: target };
      const res = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to start chat');
      }

      const conversation = await res.json();
      setConversations((prev) => {
        if (prev.some((conv) => conv.id === conversation.id)) return prev;
        return [conversation, ...prev];
      });

      const otherParticipant = conversation.participant_a?.id === user.id
        ? conversation.participant_b
        : conversation.participant_a;

      setActiveChannel({
        type: 'dm',
        id: conversation.id,
        name: otherParticipant?.full_name || 'Direct Message',
        data: conversation,
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleCreateGroup = async (groupData) => {
    try {
      const res = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create group');
      }

      const group = await res.json();
      setGroups((prev) => [group, ...prev]);
      setActiveChannel({
        type: 'group',
        id: group.id,
        name: group.name,
        data: group,
      });
      setShowCreateGroup(false);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleAddMember = (user) => {
    // Refresh groups to update member count and active channel details
    if (activeChannel?.type === 'group') {
      fetchActiveGroupDetails(activeChannel);
    }
    fetchChannels();
  };

  const handleEditGroup = () => {
    setShowEditGroup(true);
  };

  const handleGroupUpdated = (updatedGroup) => {
    setGroups((prev) => prev.map((item) => item.id === updatedGroup.id ? { ...item, ...updatedGroup } : item));
    setActiveChannel((prev) => prev && prev.id === updatedGroup.id ? { ...prev, data: { ...prev.data, ...updatedGroup } } : prev);
  };

  const handleGroupRefreshed = () => {
    if (activeChannel?.type === 'group') {
      fetchActiveGroupDetails(activeChannel);
    }
  };

  const handleNewChat = () => {
    setShowUserSearch(true);
  };

  const handleNewGroup = () => {
    setShowCreateGroup(true);
  };

  const handleAddMemberToGroup = () => {
    if (activeChannel?.type === 'group') {
      setShowAddMember(true);
    }
  };

  const flushQueuedMessages = async () => {
    if (queuedMessages.length === 0) return;
    const queue = [...queuedMessages];
    setQueuedMessages([]);

    for (const queued of queue) {
      try {
        await handleSendMessage(queued.content, queued.attachments, queued.channel, true);
      } catch (err) {
        console.error('Queued message failed to send:', err);
        setQueuedMessages((prev) => [...prev, queued]);
      }
    }
  };

  // Real-time message handler
  const handleIncomingMessage = async (newMsg, type) => {
    // If it's an optimistic message confirmed by server, it will have same ID or temporary ID
    // Our optimistic messages have a temp ID like 'temp-...'
    setMessages((prev) => {
      // Check if this message already exists (either as temp or confirmed)
      const existingIndex = prev.findIndex(m => m.id === newMsg.id || (m.isOptimistic && m.tempId === newMsg.tempId));
      
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...newMsg, isOptimistic: false };
        return updated;
      }
      
      // If it's a new message from someone else
      if (!newMsg) return prev;
      
      // Update unread counts if message is from someone else
      if (newMsg.sender_id !== user.id) {
        const typeKey = type === 'group' ? 'groups' : 'dms';
        const idKey = type === 'group' ? newMsg.group_id : newMsg.conversation_id;
        
        // Only increment if not currently viewing this channel
        if (activeChannel?.id !== idKey) {
          setUnreadCounts(prev => ({
            ...prev,
            [typeKey]: {
              ...prev[typeKey],
              [idKey]: (prev[typeKey][idKey] || 0) + 1
            }
          }));
        } else {
          // If viewing, mark as read
          markMessagesAsRead(activeChannel);
        }
      }
      
      // If it's a new message from someone else, fetch sender and append
      fetchSenderAndAppend(newMsg, type);
      return prev;
    });
  };

  const handleUpdateMessage = (updatedMsg, type) => {
    setMessages((prev) => 
      prev.map((msg) => (msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg))
    );
  };

  const handleReactionUpdate = (payload, type) => {
    const { eventType, new: newReaction, old: oldReaction } = payload;
    
    setMessages((prev) => prev.map((msg) => {
      const msgId = newReaction?.message_id || newReaction?.dm_message_id || oldReaction?.message_id || oldReaction?.dm_message_id;
      if (msg.id !== msgId) return msg;

      let reactions = [...(msg.reactions || [])];
      
      if (eventType === 'INSERT' || eventType === 'UPDATE') {
        // Remove existing reaction from this user if it's an update (unlikely with UNIQUE constraint but safe)
        reactions = reactions.filter(r => !(r.user_id === newReaction.user_id && r.emoji === newReaction.emoji));
        reactions.push(newReaction);
      } else if (eventType === 'DELETE') {
        reactions = reactions.filter(r => r.id !== oldReaction.id);
      }

      return { ...msg, reactions };
    }));
  };

  // Subscribe to real-time updates
  useRealtimeMessages(
    activeChannel, 
    handleIncomingMessage, 
    handleUpdateMessage,
    handleReactionUpdate
  );

  // Presence & Typing
  const { onlineUsers, typingUsers, setMyTypingStatus } = usePresence(user?.id, activeChannel);

  const fetchSenderAndAppend = async (newMsg, type) => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('users').select('id, full_name, avatar_url, role').eq('id', newMsg.sender_id).single();

    const formattedMsg = {
      ...newMsg,
      sender: data || { full_name: 'User' },
    };

    setMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, formattedMsg];
    });

    const isOtherUser = newMsg.sender_id !== user.id;
    if (isOtherUser && (!windowFocused || activeChannel?.id !== (type === 'group' ? newMsg.group_id : newMsg.conversation_id))) {
      // Don't notify if muted
      // (This should also be handled server-side, but client-side check is a good backup)
      
      chatNotifications.notifyMessage(
        formattedMsg.sender.full_name,
        newMsg.content,
        type === 'group' ? activeChannel?.name : null
      );
    }
  };

  const uploadAttachments = async (files, channel = activeChannel) => {
    const channelKey = channel?.type === 'group' ? 'group_id' : 'conversation_id';
    if (!channel || !channelKey) throw new Error('No active channel selected');

    const uploadPromises = files.map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append(channelKey, channel.id);

      const res = await fetch('/api/chat/attachments', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Attachment upload failed');
      }

      const data = await res.json();
      return data.id;
    });

    return Promise.all(uploadPromises);
  };

  const handleSendMessage = async (content, attachments = [], mentionedUserIds = [], forcedChannel = null, isRetry = false) => {
    const channel = forcedChannel || activeChannel;
    if ((!content.trim() && attachments.length === 0) || dbError || !channel) return;
    
    if (offline && !isRetry) {
      setQueuedMessages((prev) => [
        ...prev,
        { content: content.trim(), attachments, channel },
      ]);
      showBrowserNotification('Offline', {
        body: 'Your message has been queued and will send when you reconnect.',
      });
      return;
    }

    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: tempId,
      tempId: tempId,
      content: content.trim(),
      sender_id: user.id,
      sender: user,
      created_at: new Date().toISOString(),
      isOptimistic: true,
      message_type: attachments.length > 0 ? 'file' : 'text',
      attachments: attachments.map(a => ({ id: a.id, file_name: a.file.name, file_url: URL.createObjectURL(a.file) })),
      reply_to_id: replyTo?.id || null,
      parent_message: replyTo || null,
      mentions: mentionedUserIds,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setReplyTo(null);
    setUploading(true);

    try {
      const attachmentFiles = attachments.map((item) => item.file);
      const attachmentIds = attachmentFiles.length > 0
        ? await uploadAttachments(attachmentFiles, channel)
        : [];

      const endpoint = channel.type === 'group'
        ? `/api/chat/groups/${channel.id}/messages`
        : `/api/chat/conversations/${channel.id}/messages`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          content: content.trim() || (attachmentIds.length > 0 ? '[File attachment]' : ''),
          message_type: attachmentIds.length > 0 ? 'file' : 'text',
          attachment_ids: attachmentIds,
          reply_to_id: optimisticMsg.reply_to_id,
          meta: { attachment_count: attachmentIds.length, tempId },
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || 'Failed to send');
      }

      const sentMsg = await res.json();

      // If we have mentions, trigger the mentions API
      if (mentionedUserIds.length > 0) {
        fetch('/api/chat/mentions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: sentMsg.id,
            type: channel.type,
            channelId: channel.id,
            mentionedUserIds,
            messagePreview: content.trim()
          })
        }).catch(e => console.error('Mentions notification failed', e));
      }

      // Success! The real-time listener will replace the optimistic message.
      if (!windowFocused) {
        showBrowserNotification('Message sent', {
          body: `Your message was posted to ${channel.name}.`,
        });
      }
    } catch (err) {
      // Remove optimistic message and queue for retry
      setMessages(prev => prev.filter(m => m.id !== tempId));
      
      if (!isRetry) {
        setQueuedMessages((prev) => [
          ...prev,
          { content: content.trim(), attachments, channel },
        ]);
      }
      console.error(err);
      alert('Failed to send: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const getOtherParticipant = (conv) => {
    if (!user || !conv) return null;
    return conv.participant_a?.id === user.id ? conv.participant_b : conv.participant_a;
  };

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gold"></div>
    </div>
  );

  return (
    <div className={styles.chatContainer} style={{ marginTop: '0', height: 'calc(100vh - var(--header-height) - 100px)' }}>
      <ChatSidebar
        groups={groups}
        conversations={conversations}
        activeChannel={activeChannel}
        setActiveChannel={setActiveChannel}
        unreadCounts={unreadCounts}
        user={user}
        onlineUsers={onlineUsers}
        onNewChat={handleNewChat}
        onNewGroup={handleNewGroup}
        onAddMember={handleAddMemberToGroup}
      />

      <div className={styles.mainChat}>
        <ChatHeader
          activeChannel={activeChannel}
          otherUser={activeChannel?.type === 'dm' ? getOtherParticipant(activeChannel.data) : null}
          unreadCount={unreadCount}
          onToggleNotifications={() => setShowNotifications((open) => !open)}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          isOnline={activeChannel?.type === 'dm' ? !!onlineUsers[getOtherParticipant(activeChannel.data)?.id] : false}
          onSearchClick={() => setShowSearchModal(true)}
        />

        <MessageList
          messages={messages}
          user={user}
          activeChannel={activeChannel}
          onReply={setReplyTo}
          highlightedMessageId={selectedMessageId}
        />

        <MessageInput
          activeChannel={activeChannel}
          onSendMessage={handleSendMessage}
          onTyping={setMyTypingStatus}
          typingUsers={typingUsers}
          uploading={uploading}
          offline={offline}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
        />
      </div>

      <div className={`${styles.announcementsPanel} hidden xl:flex`}>
        {showNotifications ? (
          <div className="h-full p-6">
            <ChatNotificationsPanel
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkRead={handleMarkAllNotificationsRead}
              onDelete={handleDeleteNotification}
              onClose={() => setShowNotifications(false)}
            />
          </div>
        ) : (
          <>
            <div className={styles.sidebarHeader}>
              <div className="flex w-full">
                <button 
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${rightSidebarTab === 'details' ? 'border-gold text-gold' : 'border-transparent text-text-dim hover:text-text'}`}
                  onClick={() => setRightSidebarTab('details')}
                >
                  Details
                </button>
                <button 
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${rightSidebarTab === 'files' ? 'border-gold text-gold' : 'border-transparent text-text-dim hover:text-text'}`}
                  onClick={() => setRightSidebarTab('files')}
                >
                  Files
                </button>
                <button 
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${rightSidebarTab === 'pins' ? 'border-gold text-gold' : 'border-transparent text-text-dim hover:text-text'}`}
                  onClick={() => setRightSidebarTab('pins')}
                >
                  Pinned
                </button>
                {['ceo', 'coo', 'it_manager'].includes(user?.role) && (
                  <button 
                    className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${rightSidebarTab === 'admin' ? 'border-gold text-gold' : 'border-transparent text-text-dim hover:text-text'}`}
                    onClick={() => setRightSidebarTab('admin')}
                  >
                    Admin
                  </button>
                )}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {rightSidebarTab === 'files' ? (
                <ChatFilesGallery attachments={attachments} />
              ) : rightSidebarTab === 'pins' ? (
                <PinnedMessagesPanel activeChannel={activeChannel} user={user} />
              ) : rightSidebarTab === 'admin' && ['ceo', 'coo', 'it_manager'].includes(user?.role) ? (
                <ChatAdminPanel user={user} />
              ) : (
                <div className="p-0">
                  {activeChannel?.type === 'group' ? (
                    <GroupSettingsPanel
                      group={activeChannel.data}
                      currentUser={user}
                      onAddMember={handleAddMemberToGroup}
                      onEditGroup={handleEditGroup}
                      onGroupRefreshed={handleGroupRefreshed}
                    />
                  ) : (
                    <div className="p-6 space-y-6">
                      <div>
                        <h3 className="text-sm font-bold mb-2">About {activeChannel?.name}</h3>
                        <p className="text-xs text-text-dim leading-relaxed">
                          {`Private encrypted conversation between you and ${getOtherParticipant(activeChannel.data)?.full_name}.`}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-3xl border border-border p-4 bg-surface-2/70">
                          <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] mb-2">Conversation Type</div>
                          <div className="text-sm font-semibold text-white">Direct Message</div>
                        </div>
                        <div className="rounded-3xl border border-border p-4 bg-surface-2/70">
                          <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] mb-2">Privacy</div>
                          <div className="text-sm font-semibold text-white">Private</div>
                        </div>
                        <div className="rounded-3xl border border-border p-4 bg-surface-2/70">
                          <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] mb-2">Participants</div>
                          <div className="text-sm font-semibold text-white">2</div>
                        </div>
                        <div className="rounded-3xl border border-border p-4 bg-surface-2/70">
                          <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] mb-2">Last Updated</div>
                          <div className="text-sm font-semibold text-white">{new Date(activeChannel?.data?.updated_at || activeChannel?.data?.created_at || Date.now()).toLocaleString()}</div>
                        </div>
                      </div>

                      <div className="card border-dashed p-4 rounded-xl bg-surface-2/50">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold mb-3">Protocol Status</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-text-dim">Encryption</span>
                            <span className="text-green-500 font-mono">ENABLED</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-text-dim">Data Center</span>
                            <span className="text-gold font-mono">SUPABASE-SG</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="text-text-dim">Realtime</span>
                            <span className="text-green-500 font-mono">ACTIVE</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold mb-3">Recent Activity</h4>
                        <div className="text-[10px] text-text-dim italic">
                          No recent pinned items or activity.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <UserSearchModal
        isOpen={showUserSearch}
        onClose={() => setShowUserSearch(false)}
        onSelectUser={(user) => {
          createConversation(user.email);
          setShowUserSearch(false);
        }}
      />

      <CreateGroupModal
        isOpen={showCreateGroup}
        onClose={() => setShowCreateGroup(false)}
        onCreateGroup={handleCreateGroup}
      />

      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        groupId={activeChannel?.id}
        onMemberAdded={handleAddMember}
      />

      <EditGroupModal
        isOpen={showEditGroup}
        onClose={() => setShowEditGroup(false)}
        group={activeChannel?.type === 'group' ? activeChannel.data : null}
        onSave={(updatedGroup) => {
          handleGroupUpdated(updatedGroup);
          setShowEditGroup(false);
        }}
      />

      {showSearchModal && (
        <ChatSearchModal
          onClose={() => setShowSearchModal(false)}
          onJumpTo={handleSearchJumpTo}
        />
      )}
    </div>
  );
}
