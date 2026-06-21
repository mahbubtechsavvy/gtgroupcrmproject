'use client';

import { useState, useCallback, useRef } from 'react';
import { Search, X, Hash, MessageSquare, Calendar, User, Loader2 } from 'lucide-react';

export default function ChatSearchModal({ onClose, onJumpTo }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = useCallback(async (q) => {
    if (q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/search?q=${encodeURIComponent(q)}&type=all&limit=15`);
      const data = await res.json();
      if (res.ok) setResults(data);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(val), 350);
  };

  const formatDate = (d) => new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  const hasResults = results && (results.groupMessages?.length > 0 || results.dmMessages?.length > 0);
  const isEmpty = results && !hasResults;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 px-4">
      <div className="w-full max-w-2xl bg-surface-1 border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          {loading ? (
            <Loader2 size={18} className="text-gold animate-spin shrink-0" />
          ) : (
            <Search size={18} className="text-text-dim shrink-0" />
          )}
          <input
            autoFocus
            type="text"
            value={query}
            onChange={handleChange}
            placeholder="Search all messages..."
            className="flex-1 bg-transparent text-sm text-text placeholder-text-dim/50 outline-none"
          />
          <button onClick={onClose} className="p-1 hover:bg-surface-3 text-text-dim hover:text-white rounded-lg transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto">
          {!query && (
            <div className="p-8 text-center">
              <Search size={32} className="mx-auto text-text-dim/30 mb-3" />
              <p className="text-sm text-text-dim">Start typing to search across all channels and DMs.</p>
            </div>
          )}

          {isEmpty && (
            <div className="p-8 text-center">
              <p className="text-sm text-text-dim">No results for "<strong className="text-text">{query}</strong>"</p>
            </div>
          )}

          {hasResults && (
            <div className="p-3 space-y-1">
              {/* Group Messages */}
              {results.groupMessages?.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-text-dim/60">
                    Channel Messages ({results.groupMessages.length})
                  </div>
                  {results.groupMessages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => { onJumpTo?.(msg, 'group'); onClose(); }}
                      className="w-full text-left p-3 rounded-xl hover:bg-surface-2 transition-colors group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Hash size={11} className="text-gold shrink-0" />
                        <span className="text-[10px] font-bold text-gold truncate">{msg.group?.name || 'Channel'}</span>
                        <span className="text-[9px] text-text-dim ml-auto flex items-center gap-1 shrink-0">
                          <Calendar size={9} />{formatDate(msg.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-surface-3 flex items-center justify-center overflow-hidden shrink-0">
                          {msg.sender?.avatar_url ? (
                            <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : <User size={8} className="text-text-dim" />}
                        </div>
                        <span className="text-[10px] text-text-dim shrink-0">{msg.sender?.full_name}</span>
                        <p className="text-xs text-text truncate">{msg.content}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}

              {/* DM Messages */}
              {results.dmMessages?.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-[9px] font-bold uppercase tracking-[0.25em] text-text-dim/60 mt-2">
                    Direct Messages ({results.dmMessages.length})
                  </div>
                  {results.dmMessages.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => { onJumpTo?.(msg, 'dm'); onClose(); }}
                      className="w-full text-left p-3 rounded-xl hover:bg-surface-2 transition-colors group"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <MessageSquare size={11} className="text-blue-400 shrink-0" />
                        <span className="text-[10px] font-bold text-blue-400">Direct Message</span>
                        <span className="text-[9px] text-text-dim ml-auto flex items-center gap-1 shrink-0">
                          <Calendar size={9} />{formatDate(msg.created_at)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-surface-3 flex items-center justify-center overflow-hidden shrink-0">
                          {msg.sender?.avatar_url ? (
                            <img src={msg.sender.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : <User size={8} className="text-text-dim" />}
                        </div>
                        <span className="text-[10px] text-text-dim shrink-0">{msg.sender?.full_name}</span>
                        <p className="text-xs text-text truncate">{msg.content}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer tip */}
        {hasResults && (
          <div className="px-4 py-2 border-t border-border flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-surface-3 border border-border rounded text-[9px] font-mono text-text-dim">Enter</kbd>
            <span className="text-[9px] text-text-dim">to jump to message</span>
            <kbd className="px-1.5 py-0.5 bg-surface-3 border border-border rounded text-[9px] font-mono text-text-dim ml-auto">Esc</kbd>
            <span className="text-[9px] text-text-dim">to close</span>
          </div>
        )}
      </div>
    </div>
  );
}
