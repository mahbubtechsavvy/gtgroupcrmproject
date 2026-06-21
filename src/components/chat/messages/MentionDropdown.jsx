'use client';

import { useState, useEffect, useRef } from 'react';
import { AtSign } from 'lucide-react';

/**
 * MentionDropdown — Appears when user types '@' in the message input.
 * Shows a filtered list of group/conversation members for @mention selection.
 * 
 * @param {string} query - The text after '@' to filter members
 * @param {Array} members - Array of { id, full_name, avatar_url, role } objects
 * @param {Function} onSelect - Called with the selected member object
 * @param {Function} onClose - Called to dismiss the dropdown
 * @param {boolean} visible - Whether the dropdown is visible
 */
export default function MentionDropdown({ query, members, onSelect, onClose, visible }) {
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef(null);

  useEffect(() => {
    if (!visible || !members) {
      setFilteredMembers([]);
      return;
    }

    const q = (query || '').toLowerCase().trim();
    const filtered = members.filter((m) =>
      m.full_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q)
    ).slice(0, 8); // Max 8 suggestions

    setFilteredMembers(filtered);
    setSelectedIndex(0);
  }, [query, members, visible]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current && filteredMembers.length > 0) {
      const items = listRef.current.querySelectorAll('[data-mention-item]');
      if (items[selectedIndex]) {
        items[selectedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e) => {
    if (!visible || filteredMembers.length === 0) return false;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, filteredMembers.length - 1));
      return true;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (filteredMembers[selectedIndex]) {
        onSelect(filteredMembers[selectedIndex]);
      }
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return true;
    }
    return false;
  };

  if (!visible || filteredMembers.length === 0) return null;

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ceo': return 'bg-amber-500/20 text-amber-400';
      case 'coo': return 'bg-purple-500/20 text-purple-400';
      case 'it_manager': return 'bg-blue-500/20 text-blue-400';
      case 'branch_manager': return 'bg-green-500/20 text-green-400';
      default: return 'bg-surface-3 text-text-dim';
    }
  };

  const formatRole = (role) => {
    if (!role) return '';
    return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="absolute bottom-full left-0 right-0 mb-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="bg-surface-1 border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[240px]">
        {/* Header */}
        <div className="px-3 py-2 border-b border-border flex items-center gap-2">
          <AtSign size={12} className="text-gold" />
          <span className="text-[9px] font-bold uppercase tracking-[0.25em] text-gold">
            Mention a user
          </span>
          <span className="ml-auto text-[8px] text-text-dim">
            ↑↓ navigate · Enter select · Esc close
          </span>
        </div>

        {/* Member list */}
        <div ref={listRef} className="overflow-y-auto max-h-[200px]">
          {filteredMembers.map((member, index) => (
            <button
              key={member.id}
              data-mention-item
              onClick={() => onSelect(member)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                index === selectedIndex
                  ? 'bg-gold/10 border-l-2 border-gold'
                  : 'border-l-2 border-transparent hover:bg-surface-2'
              }`}
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-surface-3 flex items-center justify-center text-xs font-bold text-gold shrink-0 overflow-hidden">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  member.full_name?.charAt(0) || '?'
                )}
              </div>

              {/* Name + Role */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-text truncate">
                  {member.full_name || 'Unknown User'}
                </div>
                {member.role && (
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider mt-0.5 ${getRoleBadgeColor(member.role)}`}>
                    {formatRole(member.role)}
                  </span>
                )}
              </div>

              {/* @ indicator */}
              <span className="text-[10px] text-text-dim font-mono">
                @{member.full_name?.split(' ')[0]?.toLowerCase() || 'user'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Export the keydown handler for external use
MentionDropdown.handleKeyDown = null;
