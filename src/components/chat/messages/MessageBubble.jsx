'use client';

import { useState } from 'react';
import { Reply, Smile, Languages, Trash2, Edit2, Check, CheckCheck, X, Pin } from 'lucide-react';
import styles from '@/app/chat/chat.module.css';

export default function MessageBubble({ message, isOwn, sender, user, onReply }) {
  const [showActions, setShowActions] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTranslateOptions, setShowTranslateOptions] = useState(false);
  const [usedEngine, setUsedEngine] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const commonEmojis = ['👍', '❤️', '😂', '😮', '😢', '🔥', '🙏', '✅'];

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const targetLang = typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'en';
  const hasAttachment = message.attachments?.length > 0;

  const handleEdit = async () => {
    if (!editContent.trim() || editContent === message.content) {
      setIsEditing(false);
      return;
    }

    try {
      const res = await fetch('/api/chat/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          type: message.conversation_id ? 'dm' : 'group',
          content: editContent.trim()
        })
      });

      if (!res.ok) throw new Error('Edit failed');
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to edit message:', err);
      alert('Failed to edit message');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/chat/messages?messageId=${message.id}&type=${message.conversation_id ? 'dm' : 'group'}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Delete failed');
    } catch (err) {
      console.error('Failed to delete message:', err);
      alert('Failed to delete message');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTranslate = async (engine = null) => {
    if (translating || !message.content || message.is_deleted) return;

    setTranslating(true);
    setUsedEngine(engine);
    try {
      const body = {
        text: message.content,
        targetLanguage: targetLang,
        messageId: message.id,
        type: message.conversation_id ? 'dm' : 'group',
        engine: engine
      };

      const res = await fetch('/api/chat/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setTranslation(data.translatedText);
      } else {
        console.error('Translate failed', data);
      }
    } catch (error) {
      console.error('Translate API error', error);
    } finally {
      setTranslating(false);
      setShowTranslateOptions(false);
    }
  };

  const handleToggleReaction = async (emoji) => {
    if (message.is_deleted) return;
    const existing = message.reactions?.find(r => r.user_id === user.id && r.emoji === emoji);
    const method = existing ? 'DELETE' : 'POST';
    const channelId = message.conversation_id || message.group_id;

    try {
      if (method === 'POST') {
        await fetch('/api/chat/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: message.id,
            emoji,
            type: message.conversation_id ? 'dm' : 'group',
            channelId
          })
        });
      } else {
        await fetch(`/api/chat/reactions?messageId=${message.id}&emoji=${encodeURIComponent(emoji)}&type=${message.conversation_id ? 'dm' : 'group'}`, {
          method: 'DELETE'
        });
      }
    } catch (err) {
      console.error('Reaction toggle failed', err);
    } finally {
      setShowEmojiPicker(false);
    }
  };

  const handleTogglePin = async () => {
    if (message.is_deleted) return;
    try {
      const res = await fetch('/api/chat/pins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          type: message.conversation_id ? 'dm' : 'group',
          channelId: message.conversation_id || message.group_id,
          isPinned: !message.is_pinned
        })
      });

      if (!res.ok) throw new Error('Pinning failed');
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  const groupedReactions = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const myReactions = (message.reactions || []).filter(r => r.user_id === user.id).map(r => r.emoji);

  return (
    <div
      className={`${styles.message} ${isOwn ? styles.own : ''} ${message.isOptimistic ? 'opacity-50 grayscale-[0.5]' : ''} ${message.is_deleted ? 'opacity-40 italic' : ''} group relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwn && (
        <div className={styles.avatar}>
          {sender?.avatar_url ? (
            <img src={sender.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            sender?.full_name?.charAt(0) || 'U'
          )}
        </div>
      )}

      <div className="flex flex-col max-w-[80%]" style={{ alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        <div className={styles.messageHeader}>
          {!isOwn && <span className={styles.senderName}>{sender?.full_name || 'System'}</span>}
          <span className={styles.messageTime}>{formatTime(message.created_at)}</span>
        </div>

        <div className={`${styles.messageContent} ${message.is_deleted ? 'border-red-500/20 bg-red-500/5' : ''}`}>
          {message.parent_message && !message.is_deleted && (
            <div className="mb-2 p-2 rounded-lg bg-surface-3/50 border-l-2 border-gold/30 text-[10px] text-text-dim italic cursor-pointer hover:bg-surface-3 transition-colors">
              <div className="font-bold text-gold/60 not-italic mb-0.5">
                {message.parent_message.sender?.full_name || 'User'}
              </div>
              <div className="truncate">"{message.parent_message.content}"</div>
            </div>
          )}

          {isEditing ? (
            <div className="space-y-2 min-w-[200px]">
              <textarea
                autoFocus
                className="w-full bg-surface-3 border border-gold/30 rounded-lg p-2 text-sm text-white outline-none focus:border-gold transition-colors resize-none"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEdit(); }
                  if (e.key === 'Escape') { setIsEditing(false); setEditContent(message.content); }
                }}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => { setIsEditing(false); setEditContent(message.content); }} className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-text-dim hover:text-white transition-colors">Cancel</button>
                <button onClick={handleEdit} className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gold hover:text-white transition-colors">Save</button>
              </div>
            </div>
          ) : (
            <div className={styles.messageText}>
              {message.content?.split(/(@[\w\s]+?)(?=\s|$)/).map((part, i) => {
                if (part.startsWith('@') && message.mentions?.length > 0) {
                  return <span key={i} className="text-gold font-bold underline decoration-gold/30 underline-offset-2">{part}</span>;
                }
                return part;
              })}
              {message.is_edited && !message.is_deleted && (
                <span className="ml-2 text-[8px] text-text-dim uppercase tracking-tighter">(edited)</span>
              )}
            </div>
          )}

          {hasAttachment && !message.is_deleted && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((file) => {
                const isImage = file.file_type?.startsWith('image/') || file.file_name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                
                if (isImage) {
                  return (
                    <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer" className="block max-w-[240px] rounded-lg overflow-hidden border border-border hover:border-gold/50 transition-colors">
                      <img src={file.file_url} alt={file.file_name} className="w-full h-auto object-cover" />
                    </a>
                  );
                }

                return (
                  <a key={file.id} href={file.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-surface-3 border border-border text-sm text-text-dim hover:bg-surface-2 transition-colors">
                    <span className="font-medium text-text truncate max-w-[150px]">{file.file_name}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-text-dim whitespace-nowrap">{(file.file_size / 1024).toFixed(0)} KB</span>
                  </a>
                );
              })}
            </div>
          )}

          {translation && !message.is_deleted && (
            <div className="mt-3 p-3 rounded-xl bg-gold/5 border border-gold/20 text-sm text-text relative group/trans overflow-hidden backdrop-blur-sm animate-in fade-in slide-in-from-top-1 duration-300">
              <div className="absolute top-0 left-0 w-1 h-full bg-gold/30" />
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <strong className="text-[9px] uppercase tracking-[0.25em] text-gold/80 font-bold">AI Translation</strong>
                  <span className="px-1.5 py-0.5 rounded-md bg-gold/10 text-[8px] font-bold text-gold uppercase">{targetLang}</span>
                  {usedEngine && <span className="text-[8px] text-text-dim lowercase italic">via {usedEngine}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {translating && <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />}
                  <button 
                    onClick={() => setTranslation(null)}
                    className="opacity-0 group-hover/trans:opacity-100 text-text-dim hover:text-white transition-all"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="leading-relaxed opacity-90 flex-1">
                  {showTranslation ? translation : message.content}
                </span>
                <button
                  type="button"
                  onClick={() => setShowTranslation((prev) => !prev)}
                  className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold hover:text-white transition-colors"
                >
                  {showTranslation ? 'Show original' : 'Show translation'}
                </button>
              </div>
            </div>
          )}

          {Object.keys(groupedReactions).length > 0 && !message.is_deleted && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(groupedReactions).map(([emoji, count]) => (
                <button
                  key={emoji}
                  onClick={() => handleToggleReaction(emoji)}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] border transition-all ${
                    myReactions.includes(emoji) 
                      ? 'bg-gold/20 border-gold/40 text-gold shadow-sm' 
                      : 'bg-surface-3 border-border text-text-dim hover:bg-surface-2'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="font-bold">{count}</span>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-end gap-1 mt-1">
            {message.is_pinned && !message.is_deleted && (
              <div className="text-gold/80 bg-gold/10 p-0.5 rounded-full" title="Pinned message">
                <Pin size={10} />
              </div>
            )}
            {isOwn && !message.is_deleted && (
              <div className="text-gold/60">
                {message.read_by?.length > 0 ? <CheckCheck size={12} /> : <Check size={12} />}
              </div>
            )}
          </div>
        </div>

        {showActions && !message.is_deleted && !message.isOptimistic && !isEditing && (
          <div className={`absolute top-0 ${isOwn ? '-left-12' : '-right-12'} flex flex-col gap-1 bg-surface-2 border border-border p-1 rounded-lg shadow-xl z-10 animate-in fade-in zoom-in duration-150`}>
            <button 
              className="p-1 hover:bg-surface-3 text-text-dim hover:text-gold transition-colors" 
              title="Reply"
              onClick={onReply}
            >
              <Reply size={14} />
            </button>
            <div className="relative group/emoji">
              <button 
                className="p-1 hover:bg-surface-3 text-text-dim hover:text-gold transition-colors" 
                title="React"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile size={14} />
              </button>
              
              {showEmojiPicker && (
                <div className={`absolute ${isOwn ? 'right-full' : 'left-full'} top-0 flex items-center gap-1 bg-surface-1 border border-border p-1.5 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in duration-200 mx-2`}>
                  {commonEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => handleToggleReaction(emoji)}
                      className="w-7 h-7 flex items-center justify-center hover:bg-surface-3 rounded-lg transition-colors text-base"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {message.content && (
              <div className="relative group/translate">
                <button
                  type="button"
                  onClick={() => setShowTranslateOptions(!showTranslateOptions)}
                  className={`p-1 hover:bg-surface-3 transition-colors ${showTranslateOptions ? 'bg-surface-3 text-gold' : 'text-text-dim hover:text-gold'}`}
                  title="Translate Options"
                >
                  <Languages size={14} />
                </button>

                {showTranslateOptions && (
                  <div className={`absolute ${isOwn ? 'right-full' : 'left-full'} top-0 flex flex-col gap-1 bg-surface-1 border border-border p-1 rounded-lg shadow-2xl z-50 animate-in fade-in slide-in-from-${isOwn ? 'right' : 'left'}-2 duration-200 mx-2 min-w-[110px]`}>
                    <button 
                      onClick={() => handleTranslate('google')}
                      className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-left hover:bg-surface-3 rounded transition-colors text-text-dim hover:text-white"
                    >
                      <span className="w-4 h-4 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded text-[8px] font-bold">G</span>
                      Google Translate
                    </button>
                    <button 
                      onClick={() => handleTranslate('deepl')}
                      className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-left hover:bg-surface-3 rounded transition-colors text-text-dim hover:text-white"
                    >
                      <span className="w-4 h-4 flex items-center justify-center bg-surface-3 text-white rounded text-[8px] font-bold">D</span>
                      DeepL Pro
                    </button>
                    <button 
                      onClick={() => handleTranslate('libre')}
                      className="flex items-center gap-2 px-2 py-1.5 text-[10px] text-left hover:bg-surface-3 rounded transition-colors text-text-dim hover:text-white"
                    >
                      <span className="w-4 h-4 flex items-center justify-center bg-green-500/20 text-green-400 rounded text-[8px] font-bold">L</span>
                      LibreTranslate
                    </button>
                  </div>
                )}
              </div>
            )}
            <button 
              className={`p-1 hover:bg-surface-3 transition-colors ${message.is_pinned ? 'text-gold' : 'text-text-dim hover:text-gold'}`} 
              title={message.is_pinned ? 'Unpin message' : 'Pin message'}
              onClick={() => handleTogglePin()}
            >
              <Pin size={14} className={message.is_pinned ? 'fill-gold/20' : ''} />
            </button>
            {(isOwn || ['ceo', 'coo', 'it_manager'].includes(user?.role)) && (
              <>
                {isOwn && (
                  <button 
                    className="p-1 hover:bg-surface-3 text-text-dim hover:text-blue-400 transition-colors" 
                    title="Edit"
                    onClick={() => { setIsEditing(true); setEditContent(message.content); }}
                  >
                    <Edit2 size={14} />
                  </button>
                )}
                <button 
                  className="p-1 hover:bg-surface-3 text-text-dim hover:text-red-400 transition-colors" 
                  title="Delete"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
