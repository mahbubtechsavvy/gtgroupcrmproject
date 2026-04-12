'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/layout/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { getSupabaseClient } from '@/lib/supabase';

const UserContext = createContext(null);
export function useUser() { return useContext(UserContext); }

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isLoginPage = pathname === '/login';

  const loadSettings = useCallback(async () => {
    const supabase = getSupabaseClient();
    // Fetch all key-value settings
    const { data: s } = await supabase.from('app_settings').select('*');
    const sMap = {};
    s?.forEach(item => { sMap[item.key] = item.value; });
    // Add version for cache busting
    sMap._version = Date.now();
    setAppSettings(sMap);
  }, []);

  const loadUser = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from('users')
      .select('*, offices!users_office_id_fkey(id, name, country, city)')
      .eq('id', session.user.id)
      .single();
    setUser(data);
    await loadSettings();
  }, [loadSettings]);

  // Initial load and Auth subscription
  useEffect(() => {
    const supabase = getSupabaseClient();
    
    if (isLoginPage) {
      // Still need settings for login page logo/branding
      loadSettings();
    } else {
      loadUser();
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') loadUser();
      if (event === 'SIGNED_OUT') setUser(null);
    });

    return () => subscription.unsubscribe();
  }, [isLoginPage, loadUser, loadSettings]);

  // Realtime subscription for app_settings
  useEffect(() => {
    const supabase = getSupabaseClient();
    
    const channel = supabase
      .channel('app-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings'
        },
        () => {
          console.log('App settings changed, reloading...');
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadSettings]);

  // Apply brand colors to CSS variables
  useEffect(() => {
    if (appSettings?.brand_color) {
      document.documentElement.style.setProperty('--color-gold', appSettings.brand_color);
      document.documentElement.style.setProperty('--color-gold-glow', `${appSettings.brand_color}26`); // 15% opacity
    }
  }, [appSettings?.brand_color]);

  if (isLoginPage) {
    return (
      <AuthGuard>
        {children}
      </AuthGuard>
    );
  }

  return (
    <UserContext.Provider value={user}>
      <AuthGuard>
        <div className="app-layout">
          <Sidebar
            user={user}
            appSettings={appSettings}
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          <div
            className="main-content"
            style={{ marginLeft: sidebarCollapsed ? '72px' : 'var(--sidebar-width)' }}
          >
            <Header
              user={user}
              sidebarCollapsed={sidebarCollapsed}
            />
            <main className="page-content">
              {children}
            </main>
          </div>
        </div>
      </AuthGuard>
    </UserContext.Provider>
  );
}
