'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function EditGroupModal({ isOpen, onClose, group, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    group_type: 'custom',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!group) return;
    setFormData({
      name: group.name || '',
      description: group.description || '',
      group_type: group.group_type || 'custom',
    });
  }, [group]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/chat/groups/${group.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim(),
          group_type: formData.group_type,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to update group');
      }

      const updated = await res.json();
      onSave(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-surface-1 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface-2">
          <div>
            <h3 className="text-lg font-bold text-white">Edit Group Settings</h3>
            <p className="text-xs text-text-dim">Update channel name, description, and type.</p>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-white">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-text-dim mb-2">Group Name</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-text-dim mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-white outline-none focus:border-gold/50 resize-none"
              rows="4"
              placeholder="Add a short description for the channel"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-text-dim mb-2">Group Type</label>
            <select
              value={formData.group_type}
              onChange={(e) => setFormData({ ...formData, group_type: e.target.value })}
              className="w-full rounded-2xl border border-border bg-surface-2 px-4 py-3 text-sm text-white outline-none focus:border-gold/50"
            >
              <option value="office">Office</option>
              <option value="department">Department</option>
              <option value="country">Country</option>
              <option value="agency">Agency</option>
              <option value="general">General</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-border bg-surface-2 px-5 py-3 text-sm font-semibold text-white hover:bg-surface-3 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-gold px-5 py-3 text-sm font-semibold text-black hover:bg-gold/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
