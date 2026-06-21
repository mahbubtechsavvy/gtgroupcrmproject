'use client';

import { useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';

const themes = [
  { id: 'enterprise-blue', label: 'Enterprise Blue', preview: '#FFFFFF', accent: '#2196F3', text: '#111827' },
  { id: 'sage-harmony', label: 'Sage Harmony', preview: '#F9FBF8', accent: '#4CAF50', text: '#2D3A2E' },
  { id: 'modern-teal', label: 'Modern Teal', preview: '#FFFFFF', accent: '#009688', text: '#111827' },
  { id: 'creative-amber', label: 'Creative Amber', preview: '#FFF8E1', accent: '#FFC107', text: '#3E2723' },
  { id: 'minimal-grey', label: 'Minimalist Grey', preview: '#FAFAFA', accent: '#424242', text: '#212121' },
  { id: 'clean-cloud', label: 'Clean Cloud', preview: '#F7F9FB', accent: '#386FA4', text: '#133C55' },
  { id: 'oceanic-dark', label: 'Oceanic Dark', preview: '#263238', accent: '#80CBC4', text: '#EEFFFF' },
  { id: 'midnight-carbon', label: 'Midnight Carbon', preview: '#121212', accent: '#BDBDBD', text: '#EEEEEE' },
  { id: 'palenight', label: 'Palenight', preview: '#292D3E', accent: '#C792EA', text: '#A6ACCD' },
  { id: 'solarized-dark', label: 'Solarized Dark', preview: '#002B36', accent: '#B58900', text: '#839496' },
  { id: 'deep-espresso', label: 'Deep Espresso', preview: '#1B1411', accent: '#D7C2AE', text: '#FBF6F0' },
];

export default function ThemeSwitcher() {
  const { theme, autoMode, setTheme, toggleAutoMode } = useTheme();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSelect = (id) => {
    setTheme(id);
  };

  const handleHover = (id) => {
    document.documentElement.setAttribute('data-theme', id);
  };

  const handleMouseLeave = () => {
    document.documentElement.setAttribute('data-theme', theme);
  };

  return (
    <div className="theme-panel">
      <div className="theme-panel-header">
        <div>
          <h3>Interface Theme</h3>
          <p>Select a workspace style for your shift.</p>
        </div>
        <div className="theme-auto-toggle">
          <label className={`switch-control ${autoMode ? 'active' : ''}`}>
            <span />
            <input
              type="checkbox"
              checked={autoMode}
              onChange={(event) => toggleAutoMode(event.target.checked)}
              className="switch-input"
              aria-label="Automatic night shift"
            />
          </label>
          <span className="switch-copy">
            {autoMode ? 'Automatic Night Shift' : 'Manual Theme Selection'}
          </span>
        </div>
      </div>

      <div className="theme-grid" onMouseLeave={handleMouseLeave}>
        {themes.map(({ id, label, preview, accent, text }) => (
          <button
            key={id}
            type="button"
            className={`theme-card ${theme === id ? 'active' : ''}`}
            onClick={() => handleSelect(id)}
            onMouseEnter={() => handleHover(id)}
          >
            <div className="theme-swatch" style={{ background: preview, color: text }}>
              <span className="theme-swatch-dot" style={{ background: accent }} />
            </div>
            <span className="theme-swatch-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
