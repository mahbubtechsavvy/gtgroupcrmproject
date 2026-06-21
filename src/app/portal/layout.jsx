'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';
import styles from './PortalLayout.module.css';

export default function PortalLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const supabase = getSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user && !window.location.pathname.includes('/login')) {
      router.push('/portal/login');
      return;
    }

    // Verify they are a portal user
    if (user) {
      const { data: portalUser, error } = await supabase
        .from('client_portal_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !portalUser) {
        // Not a portal user, maybe a staff member trying to access?
        // In a real app, we'd handle this better.
      } else {
        setUser(portalUser);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-navy flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gold font-mono text-xs uppercase tracking-[0.3em]">Authenticating Nexus Protocol...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.portalContainer}>
      <nav className={styles.portalNav}>
        <div className={styles.logo}>
          <span className={styles.logoText}>GT GROUP</span>
          <span className={styles.portalLabel}>CLIENT PORTAL</span>
        </div>
        {user && (
          <div className={styles.userMenu}>
            <div className={styles.userName}>{user.full_name}</div>
            <button 
              onClick={async () => {
                const supabase = getSupabaseClient();
                await supabase.auth.signOut();
                router.push('/portal/login');
              }}
              className={styles.logoutBtn}
            >
              Sign Out
            </button>
          </div>
        )}
      </nav>
      <main className={styles.portalMain}>
        {children}
      </main>
    </div>
  );
}
