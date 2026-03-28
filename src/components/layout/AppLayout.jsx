'use client';

import { useState, useEffect, createContext, useContext } from 'react';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (isLoginPage) return;

    const supabase = getSupabaseClient();
    const loadUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('users')
        .select('*, offices(id, name, country, city)')
        .eq('id', session.user.id)
        .single();
      setUser(data);
    };

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') loadUser();
      if (event === 'SIGNED_OUT') setUser(null);
    });

    return () => subscription.unsubscribe();
  }, [isLoginPage]);

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
