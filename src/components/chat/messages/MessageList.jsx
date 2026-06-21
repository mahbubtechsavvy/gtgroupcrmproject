'use client';

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import styles from '@/app/chat/chat.module.css';

export default function MessageList({ messages, user, activeChannel, onReply, highlightedMessageId }) {
  const messagesEndRef = useRef(null);
  const messageRefs = useRef({});

  const scrollToBottom = (instant = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: instant ? 'auto' : 'smooth' });
  };

  const scrollToMessage = (messageId) => {
    const node = messageRefs.current[messageId];
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  useEffect(() => {
    scrollToBottom(messages.length <= 1);
  }, [messages]);

  useEffect(() => {
    if (highlightedMessageId) {
      scrollToMessage(highlightedMessageId);
    }
  }, [highlightedMessageId, messages]);

  if (!activeChannel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 rounded-full bg-gold/10 flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center animate-pulse">
            <svg className="w-8 h-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2 text-white">Select a Discussion</h3>
        <p className="text-text-dim text-xs max-w-xs mx-auto leading-relaxed uppercase tracking-[0.2em]">
          GT Group CRM Global Communications
        </p>
      </div>
    );
  }

  const formatMessageDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className={styles.messageList}>
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-50">
          <div className="text-xs uppercase tracking-[0.3em] font-bold mb-2 text-gold">Channel Established</div>
          <p className="text-[10px] uppercase tracking-widest text-text-dim">No transmission data found</p>
        </div>
      ) : (
        messages.map((msg, index) => {
          const isOwn = msg.sender_id === user?.id;
          const isHighlighted = highlightedMessageId && msg.id === highlightedMessageId;
          const msgDate = new Date(msg.created_at).toDateString();
          const prevMsgDate = index > 0 ? new Date(messages[index - 1].created_at).toDateString() : null;
          const showDateHeader = msgDate !== prevMsgDate;

          return (
            <div
              key={msg.id || index}
              ref={(el) => { if (msg.id) messageRefs.current[msg.id] = el; }}
              className={`flex flex-col w-full ${isHighlighted ? 'bg-surface-2/60 ring-2 ring-gold/40 rounded-3xl p-2' : ''}`}
            >
              {showDateHeader && (
                <div className="flex items-center justify-center my-6">
                  <div className="h-[1px] flex-1 bg-border/30" />
                  <span className="mx-4 text-[10px] font-bold uppercase tracking-[0.3em] text-text-dim bg-surface-1 px-3 py-1 rounded-full border border-border/50">
                    {formatMessageDate(msg.created_at)}
                  </span>
                  <div className="h-[1px] flex-1 bg-border/30" />
                </div>
              )}
              <MessageBubble 
                message={msg}
                isOwn={isOwn}
                sender={msg.sender}
                user={user}
                onReply={() => onReply(msg)}
              />
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
}

