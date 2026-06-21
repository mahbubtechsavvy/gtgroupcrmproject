'use client';

import { useState, useEffect } from 'react';
import { Languages, Volume2, VolumeX, Moon, Sun, Loader2, Save, Globe } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '@/app/api/chat/preferences/route';
import styles from '../settings.module.css';

export default function ChatPreferences() {
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetchPrefs();
  }, []);

  const fetchPrefs = async () => {
    try {
      const res = await fetch('/api/chat/preferences');
      if (res.ok) {
        const data = await res.json();
        setPrefs(data);
      }
    } catch (err) {
      console.error('Failed to fetch chat preferences', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (updates) => {
    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);
    setSaving(true);
    setStatus(null);

    try {
      const res = await fetch('/api/chat/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        setStatus({ ok: true, message: 'Preferences updated successfully!' });
      } else {
        setStatus({ ok: false, message: 'Failed to update preferences.' });
      }
    } catch (err) {
      setStatus({ ok: false, message: 'Network error.' });
    } finally {
      setSaving(false);
      setTimeout(() => setStatus(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="p-20 text-center">
        <Loader2 size={24} className="animate-spin text-gold mx-auto mb-3" />
        <p className="text-sm text-text-dim">Loading chat preferences...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Language & Translation */}
        <div className="p-6 rounded-3xl bg-surface-2 border border-border space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gold/10 text-gold">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Language & AI</h3>
              <p className="text-[10px] text-text-dim">Configure multilingual chat settings</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-text-dim mb-2">My Primary Language</label>
              <select 
                value={prefs.preferred_language || 'en'}
                onChange={(e) => handleUpdate({ preferred_language: e.target.value })}
                className="w-full bg-surface-3 border border-border rounded-xl px-4 py-2.5 text-sm text-text outline-none focus:border-gold/50 transition-all cursor-pointer"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-3 border border-border">
              <div>
                <div className="text-xs font-bold text-text">Auto-Translate</div>
                <div className="text-[10px] text-text-dim">Automatically translate incoming messages</div>
              </div>
              <button 
                onClick={() => handleUpdate({ auto_translate: !prefs.auto_translate })}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${prefs.auto_translate ? 'bg-gold' : 'bg-surface-4'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs.auto_translate ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Accessibility & UX */}
        <div className="p-6 rounded-3xl bg-surface-2 border border-border space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gold/10 text-gold">
              <Volume2 size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-widest">Experience</h3>
              <p className="text-[10px] text-text-dim">Customize sounds and visual feedback</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-3 border border-border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${prefs.notification_sound ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {prefs.notification_sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-text">Message Sounds</div>
                  <div className="text-[10px] text-text-dim">Play sound on new notifications</div>
                </div>
              </div>
              <button 
                onClick={() => handleUpdate({ notification_sound: !prefs.notification_sound })}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${prefs.notification_sound ? 'bg-gold' : 'bg-surface-4'}`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs.notification_sound ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-3 border border-border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gold/10 text-gold`}>
                  {prefs.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-text">Chat Layout</div>
                  <div className="text-[10px] text-text-dim">Compact vs Comfortable view</div>
                </div>
              </div>
              <select 
                value={prefs.theme || 'dark'}
                onChange={(e) => handleUpdate({ theme: e.target.value })}
                className="bg-transparent text-xs font-bold text-gold outline-none cursor-pointer"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      {status && (
        <div className={`p-3 rounded-2xl text-xs font-bold uppercase tracking-widest text-center border animate-in zoom-in duration-300 ${status.ok ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
          {status.message}
        </div>
      )}

      <div className="p-8 rounded-[40px] bg-gold/5 border border-gold/10 flex flex-col items-center text-center gap-4">
        <Languages size={32} className="text-gold opacity-50" />
        <div>
          <h4 className="text-sm font-bold text-white mb-1">Production Communication Suite</h4>
          <p className="text-xs text-text-dim max-w-md mx-auto">
            Your preferences are synced across all devices. The AI translation engine supports 12+ languages for seamless international team collaboration.
          </p>
        </div>
      </div>
    </div>
  );
}
