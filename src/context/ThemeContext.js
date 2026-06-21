'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'enterprise-blue',
  autoMode: false,
  setTheme: () => {},
  toggleAutoMode: () => {},
});

const THEME_STORAGE_KEY = 'gt-crm-theme';
const computeAutoTheme = () => {
  const hour = new Date().getHours();
  return hour >= 18 || hour < 6 ? 'oceanic-dark' : 'enterprise-blue';
};

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('enterprise-blue');
  const [autoMode, setAutoMode] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === 'auto') {
      setAutoMode(true);
      const autoTheme = computeAutoTheme();
      setThemeState(autoTheme);
      document.documentElement.setAttribute('data-theme', autoTheme);
      return;
    }

    const initialTheme = savedTheme || 'enterprise-blue';
    setThemeState(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
  }, []);

  const applyTheme = (themeName) => {
    const nextTheme = themeName === 'auto' ? computeAutoTheme() : themeName;
    setThemeState(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);

    if (themeName === 'auto') {
      setAutoMode(true);
      window.localStorage.setItem(THEME_STORAGE_KEY, 'auto');
      return;
    }

    setAutoMode(false);
    window.localStorage.setItem(THEME_STORAGE_KEY, themeName);
  };

  const toggleAutoMode = (enabled) => {
    if (enabled) {
      applyTheme('auto');
      return;
    }

    setAutoMode(false);
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const fallbackTheme = savedTheme && savedTheme !== 'auto' ? savedTheme : 'enterprise-blue';
    setThemeState(fallbackTheme);
    document.documentElement.setAttribute('data-theme', fallbackTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, fallbackTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, autoMode, setTheme: applyTheme, toggleAutoMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
