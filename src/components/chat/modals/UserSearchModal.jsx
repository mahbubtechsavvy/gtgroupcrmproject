'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, User } from 'lucide-react';

export default function UserSearchModal({ isOpen, onClose, onSelectUser }) {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/chat/users?q=${encodeURIComponent(query)}`);
        if (!res.ok) throw new Error('Failed to search users');
        const data = await res.json();
        setUsers(data || []);
        setError('');
      } catch (err) {
        setError(err.message);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-96 rounded-3xl border border-border bg-surface-1 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2">
          <h3 className="text-lg font-bold text-white">Start a Conversation</h3>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-white transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 border-b border-border flex gap-2">
          <Search size={18} className="text-text-dim flex-shrink-0 mt-1" />
          <input
            autoFocus
            type="text"
            placeholder="Search by name or email..."
            className="flex-1 bg-transparent text-white placeholder-text-dim outline-none text-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20">
              {error}
            </div>
          )}

          {loading && (
            <div className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-gold border-t-transparent animate-spin" />
              <p className="text-xs text-text-dim mt-2">Searching...</p>
            </div>
          )}

          {!loading && users.length === 0 && query && (
            <div className="p-8 text-center">
              <User size={32} className="mx-auto text-text-dim mb-2" />
              <p className="text-sm text-text-dim">No users found</p>
            </div>
          )}

          {!loading && query === '' && (
            <div className="p-8 text-center">
              <Search size={32} className="mx-auto text-text-dim mb-2" />
              <p className="text-sm text-text-dim">Start typing to search for users</p>
            </div>
          )}

          {users.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelectUser(user);
                setQuery('');
              }}
              className="w-full px-6 py-3 border-b border-border hover:bg-surface-2 transition-colors flex items-center gap-3 text-left"
            >
              <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-xs font-bold text-gold">{user.full_name?.charAt(0) || 'U'}</span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{user.full_name}</p>
                <p className="text-xs text-text-dim">{user.email}</p>
              </div>
              <Plus size={16} className="text-text-dim" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
