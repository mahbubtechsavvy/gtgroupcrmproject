'use client';

import { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/layout/AuthGuard';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { getAuthSession, getSupabaseClient } from '@/lib/supabase';

const UserContext = createContext(null);
export function useUser() { return useContext(UserContext); }
const OfficeContext = createContext([]);
export function useNetworkOffices() { return useContext(OfficeContext); }

export default function AppLayout({ children }) {
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [appSettings, setAppSettings] = useState(null);
  const [networkOffices, setNetworkOffices] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoginPage = pathname === '/login';

  // Close mobile sidebar on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Responsive: auto-collapse on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1280px)');
    const handle = (e) => { if (e.matches) setSidebarCollapsed(true); };
    mq.addEventListener('change', handle);
    if (mq.matches) setSidebarCollapsed(true);
    return () => mq.removeEventListener('change', handle);
  }, []);

  const loadSettings = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { data: s } = await supabase.from('app_settings').select('*');
    const { data: officeRows } = await supabase.from('offices').select('*').order('name');
    const sMap = {};
    s?.forEach(item => { sMap[item.key] = item.value; });
    sMap._version = Date.now();
    setAppSettings(sMap);
    setNetworkOffices(officeRows || []);
  }, []);

  const loadUserRef = useRef(false);

  const loadUser = useCallback(async () => {
    if (loadUserRef.current) return;
    loadUserRef.current = true;

    try {
      const supabase = getSupabaseClient();
      const { data: { session } } = await getAuthSession();
      if (!session) return;
      const { data } = await supabase
        .from('users')
        .select('*, offices!users_office_id_fkey(id, name, country, city)')
        .eq('id', session.user.id)
        .single();
      setUser(data);
      await loadSettings();
    } finally {
      loadUserRef.current = false;
    }
  }, [loadSettings]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (isLoginPage) { loadSettings(); } else { loadUser(); }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') loadUser();
      if (event === 'SIGNED_OUT') setUser(null);
    });
    return () => subscription.unsubscribe();
  }, [isLoginPage, loadUser, loadSettings]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const channel = supabase
      .channel('app-settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_settings' }, () => loadSettings())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [loadSettings]);

  // Apply brand color
  useEffect(() => {
    if (appSettings?.brand_color) {
      document.documentElement.style.setProperty('--gold', appSettings.brand_color);
      document.documentElement.style.setProperty('--gold-glow', `${appSettings.brand_color}1F`);
      document.documentElement.style.setProperty('--gold-border', `${appSettings.brand_color}3D`);
    }
  }, [appSettings?.brand_color]);

  if (isLoginPage) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  const mainMargin = sidebarCollapsed ? 'var(--sidebar-collapsed)' : 'var(--sidebar-width)';

  return (
    <OfficeContext.Provider value={networkOffices}>
      <UserContext.Provider value={user}>
        <AuthGuard>
          <div className="app-layout">
            {/* Mobile overlay */}
            {mobileOpen && (
              <div
                onClick={() => setMobileOpen(false)}
                style={{
                  position: 'fixed', inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 599,
                }}
              />
            )}

            <Sidebar
              user={user}
              appSettings={appSettings}
              collapsed={sidebarCollapsed}
              mobileOpen={mobileOpen}
              onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            <div
              className="main-content"
              style={{ marginLeft: mainMargin }}
            >
              <Header
                user={user}
                offices={networkOffices}
                sidebarCollapsed={sidebarCollapsed}
                onMobileMenuOpen={() => setMobileOpen(true)}
              />
              <main className="page-content">
                {children}
              </main>
            </div>
          </div>
        </AuthGuard>
      </UserContext.Provider>
    </OfficeContext.Provider>
  );
}

