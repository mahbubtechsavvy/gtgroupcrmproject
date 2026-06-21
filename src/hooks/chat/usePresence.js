'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Hook to handle real-time presence (online status and typing indicators).
 * @param {string} userId - The current user's ID.
 * @param {Object} activeChannel - The currently active channel.
 */
export function usePresence(userId, activeChannel) {
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const channelRef = useRef(null);
  const heartbeatRef = useRef(null);
  const isTypingRef = useRef(false);

  useEffect(() => {
    if (!userId || !activeChannel) return;

    const supabase = getSupabaseClient();
    const channelId = activeChannel.id;
    const channelName = `presence:${channelId}`;

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channelRef.current = channel;

    const updatePresenceState = () => {
      const state = channel.presenceState();
      const users = {};
      const typing = {};
      Object.keys(state).forEach((key) => {
        const presence = state[key][0];
        users[key] = presence;
        if (presence.is_typing && key !== userId) {
          typing[key] = true;
        }
      });
      setOnlineUsers(users);
      setTypingUsers(typing);
    };

    channel
      .on('presence', { event: 'sync' }, updatePresenceState)
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presence = newPresences[0];
        setOnlineUsers((prev) => ({ ...prev, [key]: presence }));
        if (presence.is_typing && key !== userId) {
          setTypingUsers((prev) => ({ ...prev, [key]: true }));
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineUsers((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        setTypingUsers((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: userId,
            online_at: new Date().toISOString(),
            is_typing: false,
          });

          heartbeatRef.current = window.setInterval(() => {
            if (!channelRef.current) return;
            channelRef.current.track({
              user_id: userId,
              online_at: new Date().toISOString(),
              is_typing: isTypingRef.current,
            }).catch((err) => console.error('Presence heartbeat failed', err));
          }, 30000);
        }
      });

    return () => {
      if (heartbeatRef.current) {
        window.clearInterval(heartbeatRef.current);
        heartbeatRef.current = null;
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, activeChannel]);

  /**
   * Update typing status for the current user.
   * @param {boolean} isTyping 
   */
  const setMyTypingStatus = useCallback(async (isTyping) => {
    isTypingRef.current = isTyping;
    if (!channelRef.current || !userId) return;

    try {
      await channelRef.current.track({
        user_id: userId,
        online_at: new Date().toISOString(),
        is_typing: isTyping,
      });
    } catch (err) {
      console.error('Typing status update failed', err);
    }
  }, [userId]);

  return { onlineUsers, typingUsers, setMyTypingStatus };
}
