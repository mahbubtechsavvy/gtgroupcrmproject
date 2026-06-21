'use client';

import { useState } from 'react';
import { Shield, UserPlus, Settings2, Trash2, RefreshCw } from 'lucide-react';

export default function GroupSettingsPanel({
  group,
  currentUser,
  onAddMember,
  onEditGroup,
  onGroupRefreshed,
}) {
  const [removingMember, setRemovingMember] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!group) {
    return (
      <div className="p-6 text-sm text-text-dim">
        Group settings are not available yet.
      </div>
    );
  }

  const isAdminUser = ['ceo', 'coo', 'it_manager'].includes(currentUser?.role);
  const myMembership = group.members?.find((member) => member.user_id === currentUser?.id);
  const isGroupAdmin = isAdminUser || myMembership?.role === 'admin';

  const handleRemoveMember = async (member) => {
    if (!group.id || !member?.user_id) return;
    if (!confirm(`Remove ${member.user.full_name} from ${group.name}?`)) return;

    setRemovingMember(member.user_id);
    setError('');

    try {
      const res = await fetch(`/api/chat/groups/${group.id}/members?user_id=${member.user_id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to remove member');
      }
      await onGroupRefreshed();
    } catch (err) {
      setError(err.message);
    } finally {
      setRemovingMember(null);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3 text-[11px] uppercase tracking-[0.25em] text-text-dim">
            <Shield size={14} />
            Group Settings
          </div>
          <h3 className="text-lg font-bold text-white">{group.name}</h3>
          <p className="mt-2 text-xs text-text-dim leading-relaxed">
            {group.description || 'No description provided for this channel.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAddMember}
            className="inline-flex items-center gap-2 rounded-full bg-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold hover:bg-gold/20 transition-colors"
          >
            <UserPlus size={14} /> Add Member
          </button>
          {isGroupAdmin && (
            <button
              type="button"
              onClick={onEditGroup}
              className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-surface-3 transition-colors"
            >
              <Settings2 size={14} /> Edit Group
            </button>
          )}
          <button
            type="button"
            onClick={onGroupRefreshed}
            className="inline-flex items-center gap-2 rounded-full bg-surface-2 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-dim hover:bg-surface-3 transition-colors"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-border p-4 bg-surface-2/70">
          <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] mb-2">Channel Type</div>
          <div className="text-sm font-semibold text-white">{group.group_type || 'Group'}</div>
        </div>
        <div className="rounded-3xl border border-border p-4 bg-surface-2/70">
          <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] mb-2">Privacy</div>
          <div className="text-sm font-semibold text-white">{group.is_private ? 'Private' : 'Open'}</div>
        </div>
        <div className="rounded-3xl border border-border p-4 bg-surface-2/70">
          <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] mb-2">Members</div>
          <div className="text-sm font-semibold text-white">{group.members?.length ?? 0}</div>
        </div>
        <div className="rounded-3xl border border-border p-4 bg-surface-2/70">
          <div className="text-[10px] text-text-dim uppercase tracking-[0.2em] mb-2">Last Updated</div>
          <div className="text-sm font-semibold text-white">{new Date(group.updated_at || group.created_at || Date.now()).toLocaleString()}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-3xl border border-border bg-surface-2/70 p-4">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">Group Members</h4>
            <p className="text-[10px] text-text-dim">Manage members and roles for this channel.</p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-text-dim">{group.members?.length ?? 0} total</span>
        </div>

        <div className="space-y-3">
          {group.members?.map((member) => (
            <div key={member.user_id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface-1 p-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-xs font-bold text-gold">
                  {member.user?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{member.user?.full_name || 'Unknown'}</div>
                  <div className="text-[10px] text-text-dim">{member.role || 'member'} · Joined {new Date(member.joined_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isGroupAdmin && member.user_id !== currentUser?.id && (
                  <button
                    type="button"
                    disabled={removingMember === member.user_id}
                    onClick={() => handleRemoveMember(member)}
                    className="rounded-full bg-red-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {removingMember === member.user_id ? 'Removing...' : 'Remove'}
                  </button>
                )}
                {member.user_id === currentUser?.id && (
                  <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-text-dim">You</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface-2/50 p-4 text-sm text-text-dim">
        <div className="font-semibold text-white mb-2">Group management notes</div>
        <p className="leading-relaxed">
          Only channel members can add new members. Users with admin permissions can remove members and update group details.
        </p>
      </div>
    </div>
  );
}
