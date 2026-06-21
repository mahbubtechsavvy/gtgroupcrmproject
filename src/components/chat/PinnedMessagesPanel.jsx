'use client';

import { useState, useEffect } from 'react';
import { Pin, MessageSquare, User, Clock, XCircle } from 'lucide-react';
import styles from '@/app/chat/chat.module.css';

export default function PinnedMessagesPanel({ activeChannel, user }) {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeChannel) {
      fetchPins();
    }
  }, [activeChannel]);

  const fetchPins = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/pins?channelId=${activeChannel.id}&type=${activeChannel.type}`);
      if (!res.ok) throw new Error('Failed to fetch pins');
      const data = await res.json();
      setPins(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (pin) => {
    try {
      const messageId = pin.message_id || pin.dm_message_id;
      const res = await fetch('/api/chat/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          type: activeChannel.type,
          channelId: activeChannel.id,
          isPinned: false
        })
      });

      if (res.ok) {
        setPins(prev => prev.filter(p => p.id !== pin.id));
      }
    } catch (err) {
      console.error('Failed to unpin:', err);
    }
  };

  if (loading) return (
    <div className="p-6 text-center text-text-dim text-xs animate-pulse">
      Loading pins...
    </div>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gold/80 flex items-center gap-2">
          <Pin size={12} className="fill-gold/20" />
          Pinned Messages
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-gold/10 text-[10px] font-bold text-gold">
          {pins.length}
        </span>
      </div>

      {pins.length === 0 ? (
        <div className="py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-surface-3 flex items-center justify-center mx-auto mb-4 text-text-dim/30">
            <Pin size={24} />
          </div>
          <p className="text-xs text-text-dim">No pinned messages yet.</p>
          <p className="text-[10px] text-text-dim/60 mt-1 italic">Pin important updates to keep them handy.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pins.map((pin) => {
            const msg = pin.message || pin.dm_message;
            if (!msg) return null;
            
            return (
              <div key={pin.id} className="group relative p-3 rounded-2xl bg-surface-2 border border-border hover:border-gold/30 transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center overflow-hidden">
                    {msg.sender?.avatar_url ? (
                      <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={10} className="text-gold" />
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-text truncate max-w-[100px]">
                    {msg.sender?.full_name || 'User'}
                  </span>
                  <span className="text-[9px] text-text-dim ml-auto">
                    {new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                
                <p className="text-xs text-text-dim line-clamp-3 leading-relaxed">
                  {msg.content}
                </p>

                <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleUnpin(pin)}
                    className="text-[9px] text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                  >
                    <XCircle size={10} />
                    Unpin
                  </button>
                  <button className="text-[9px] text-gold hover:text-gold/80 flex items-center gap-1 transition-colors">
                    <MessageSquare size={10} />
                    Jump to message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
