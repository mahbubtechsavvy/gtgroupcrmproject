'use client';

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ compact = false }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('gt-crm-theme');
    let isDark = true;
    
    if (saved) {
      isDark = saved === 'dark';
    } else {
      // If no saved preference, check system settings
      isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    setDark(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    
    // Listen for system theme changes if no saved preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('gt-crm-theme')) {
        setDark(e.matches);
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      }
    };
    
    // Modern way to add event listener for media queries
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('gt-crm-theme', next ? 'dark' : 'light');
  };

  if (compact) {
    return (
      <button
        onClick={toggle}
        className="btn btn-ghost btn-icon"
        title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        style={{ borderRadius: '50%' }}
      >
        {dark
          ? <Sun size={18} style={{ color: 'var(--gold-light)' }} />
          : <Moon size={18} style={{ color: 'var(--text-muted)' }} />
        }
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={`theme-toggle ${!dark ? 'active' : ''}`}
      title={dark ? 'Light Mode' : 'Dark Mode'}
    >
      <span className="theme-toggle-knob">
        {dark
          ? <Moon size={11} style={{ color: '#080B14' }} />
          : <Sun size={11} style={{ color: '#080B14' }} />
        }
      </span>
    </button>
  );
}
