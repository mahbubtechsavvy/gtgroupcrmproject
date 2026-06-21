'use client';

import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function CreateGroupModal({ isOpen, onClose, onCreateGroup }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_type: 'department',
    is_private: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create group');
      }

      const group = await res.json();
      onCreateGroup(group);
      setFormData({ name: '', description: '', group_type: 'department', is_private: false });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface-1 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2">
          <h3 className="text-lg font-bold text-white">Create New Group</h3>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-white transition-colors"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex gap-2 p-3 rounded-2xl bg-red-500/10 border border-red-500/20">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-text-dim mb-2">
              Group Name
            </label>
            <input
              autoFocus
              type="text"
              placeholder="Enter group name..."
              className="w-full px-4 py-2 rounded-2xl bg-surface-2 border border-border text-white placeholder-text-dim focus:border-gold/50 focus:outline-none transition-colors"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-text-dim mb-2">
              Description
            </label>
            <textarea
              placeholder="What is this group about?"
              className="w-full px-4 py-2 rounded-2xl bg-surface-2 border border-border text-white placeholder-text-dim focus:border-gold/50 focus:outline-none transition-colors resize-none"
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-[0.2em] text-text-dim mb-2">
              Group Type
            </label>
            <select
              className="w-full px-4 py-2 rounded-2xl bg-surface-2 border border-border text-white focus:border-gold/50 focus:outline-none transition-colors"
              value={formData.group_type}
              onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
            >
              <option value="department">Department</option>
              <option value="project">Project</option>
              <option value="team">Team</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_private"
              checked={formData.is_private}
              onChange={(e) => setFormData({ ...formData, is_private: e.target.checked })}
              className="w-4 h-4 rounded border-border bg-surface-2 cursor-pointer"
            />
            <label htmlFor="is_private" className="text-xs font-semibold text-white cursor-pointer">
              Make this group private
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-2xl bg-surface-2 border border-border text-white font-semibold hover:bg-surface-3 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-2xl bg-gold text-black font-semibold hover:bg-gold/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
