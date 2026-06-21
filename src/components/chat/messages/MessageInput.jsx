'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, Image as ImageIcon, File as FileIcon, X } from 'lucide-react';
import MentionDropdown from './MentionDropdown';
import styles from '@/app/chat/chat.module.css';

export default function MessageInput({ onSendMessage, activeChannel, onTyping, typingUsers, uploading, offline, replyTo, onCancelReply }) {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [showMentions, setShowMentions] = useState(false);
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Extract members from activeChannel data
  const members = activeChannel?.type === 'group' 
    ? activeChannel.data?.members?.map(m => m.user) || []
    : [activeChannel.data?.participant_a, activeChannel.data?.participant_b].filter(Boolean);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() && attachments.length === 0) return;

    onSendMessage(text, attachments, mentionedUsers.map(u => u.id));
    setText('');
    setAttachments([]);
    setMentionedUsers([]);
    
    // Clear typing status on send
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      onTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (showMentions) {
      // MentionDropdown internal handling logic is handled via props and index
      // but we need to prevent default enter if mentions are open
      if (e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Escape' || e.key === 'Tab') {
        // Let the dropdown handle it or if we had a ref
        // For simplicity, we'll let the onChange detect the query
      }
    }

    if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
      handleSubmit(e);
    }
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    setText(value);

    // Mention trigger logic
    const lastAt = value.lastIndexOf('@', cursorPosition - 1);
    if (lastAt !== -1) {
      const query = value.slice(lastAt + 1, cursorPosition);
      // Check if there's a space or newline before @ or if it's at the start
      const charBeforeAt = lastAt === 0 ? ' ' : value[lastAt - 1];
      
      if (/[\s\n]/.test(charBeforeAt) && !/[\s\n]/.test(query)) {
        setMentionQuery(query);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
    
    // Handle typing indicator
    if (!typingTimeoutRef.current) {
      onTyping(true);
    } else {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
      typingTimeoutRef.current = null;
    }, 3000);
  };

  const handleSelectMention = (user) => {
    const cursorPosition = textareaRef.current.selectionStart;
    const lastAt = text.lastIndexOf('@', cursorPosition - 1);
    
    const before = text.slice(0, lastAt);
    const after = text.slice(cursorPosition);
    const mentionText = `@${user.full_name} `;
    
    setText(before + mentionText + after);
    setMentionedUsers(prev => [...prev, user]);
    setShowMentions(false);
    
    // Focus back to textarea and move cursor
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = lastAt + mentionText.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const addFiles = (files) => {
    const fileList = Array.from(files || []);
    setAttachments((current) => [
      ...current,
      ...fileList.map((f) => ({
        file: f,
        name: f.name,
        type: f.type,
        size: f.size,
        preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      })),
    ]);
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const removeAttachment = (index) => {
    setAttachments((current) => current.filter((_, i) => i !== index));
  };

  if (!activeChannel) return null;

  return (
    <div className={`${styles.inputArea} ${dragActive ? 'border-gold border-2 rounded-xl' : ''}`} onDragOver={handleDragOver} onDrop={handleDrop} onDragLeave={handleDragLeave}>
      {offline && (
        <div className="mb-2 p-2 rounded-xl bg-rose-500/10 text-rose-600 text-xs">Offline mode: messages and uploads will queue once you reconnect.</div>
      )}

      {replyTo && (
        <div className="mb-2 p-3 rounded-xl bg-gold/5 border-l-4 border-gold flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-bold text-gold uppercase tracking-widest mb-0.5">Replying to {replyTo.sender?.full_name}</div>
            <div className="text-xs text-text-dim truncate italic">"{replyTo.content}"</div>
          </div>
          <button 
            type="button"
            onClick={onCancelReply}
            className="p-1 hover:bg-gold/10 rounded-full text-gold transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex gap-2 mb-2 p-2 bg-surface-2 rounded-xl overflow-x-auto">
          {attachments.map((file, i) => (
            <div key={i} className="relative group min-w-[60px] h-[60px]">
              {file.preview ? (
                <img src={file.preview} alt="" className="w-full h-full object-cover rounded-lg border border-border" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-surface-3 rounded-lg border border-border">
                  <FileIcon size={20} className="text-gold" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(i)}
                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-lg"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.inputForm}>
        {uploading && (
          <div className="absolute inset-0 bg-surface-1/80 backdrop-blur-[2px] flex items-center justify-center gap-3 z-10 rounded-xl">
            <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-gold">Uploading Attachments...</span>
          </div>
        )}
        <button
          type="button"
          disabled={uploading}
          className={`${styles.iconButton} ${uploading ? 'opacity-30' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip size={20} />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            className="hidden"
          />
        </button>

        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            placeholder={uploading ? "Uploading..." : `Message ${activeChannel.name}...`}
            disabled={uploading}
            className={`${styles.textarea} ${uploading ? 'opacity-30' : ''}`}
            rows={1}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyPress}
          />
          <MentionDropdown 
            visible={showMentions}
            query={mentionQuery}
            members={members}
            onSelect={handleSelectMention}
            onClose={() => setShowMentions(false)}
          />
          {Object.keys(typingUsers).length > 0 && !uploading && (
            <div className="absolute -top-6 left-0 text-[10px] text-gold/80 italic flex items-center gap-1">
              <div className="flex gap-0.5">
                <span className="w-1 h-1 bg-gold/50 rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-gold/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1 h-1 bg-gold/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              Someone is typing...
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button type="button" disabled={uploading} className={`${styles.iconButton} ${uploading ? 'opacity-30' : ''}`}>
            <Smile size={20} />
          </button>
          <button type="button" disabled={uploading} className={`${styles.iconButton} ${uploading ? 'opacity-30' : ''}`}>
            <Mic size={20} />
          </button>
          <button
            type="submit"
            className={`${styles.sendButton} ${(!text.trim() && attachments.length === 0) || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={(!text.trim() && attachments.length === 0) || uploading}
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
