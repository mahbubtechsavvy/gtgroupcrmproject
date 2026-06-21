'use client';

import { useEffect } from 'react';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Hook to handle real-time message updates for groups or DMs.
 * @param {Object} activeChannel - The currently active channel (group or dm).
 * @param {Function} onNewMessage - Callback when a new message is received.
 * @param {Function} onUpdateMessage - Callback when a message is updated (edited, deleted).
 * @param {Function} onReactionUpdate - Callback when a reaction is added or removed.
 */
export function useRealtimeMessages(activeChannel, onNewMessage, onUpdateMessage, onReactionUpdate) {
  useEffect(() => {
    if (!activeChannel) return;
    
    const supabase = getSupabaseClient();
    const channelId = activeChannel.id;
    const isGroup = activeChannel.type === 'group';
    
    const channelName = isGroup ? `group:${channelId}` : `dm:${channelId}`;
    const tableName = isGroup ? 'chat_messages' : 'chat_direct_messages';
    const filter = isGroup ? `group_id=eq.${channelId}` : `conversation_id=eq.${channelId}`;

    const channel = supabase.channel(channelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: tableName,
        filter,
      }, (payload) => {
        if (onNewMessage) onNewMessage(payload.new, activeChannel.type);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: tableName,
        filter,
      }, (payload) => {
        if (onUpdateMessage) onUpdateMessage(payload.new, activeChannel.type);
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: tableName,
        filter,
      }, (payload) => {
        if (onUpdateMessage) onUpdateMessage({ id: payload.old.id, is_deleted: true }, activeChannel.type);
      })
      .subscribe();

    const reactionEvents = ['INSERT', 'UPDATE', 'DELETE'];
    reactionEvents.forEach((event) => {
      channel.on('postgres_changes', {
        event,
        schema: 'public',
        table: 'chat_reactions',
        filter: isGroup ? `group_id=eq.${channelId}` : `conversation_id=eq.${channelId}`,
      }, (payload) => {
        if (onReactionUpdate) onReactionUpdate(payload, activeChannel.type);
      });
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChannel, onNewMessage, onUpdateMessage, onReactionUpdate]);
}
