'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSupabaseClient } from '@/lib/supabase';

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [appSettings, setAppSettings] = useState(null);

  useEffect(() => {
    // Prevent hydration error by loading cache after initial mount
    const cachedConfig = localStorage.getItem('crm_app_settings');
    if (cachedConfig) {
      try {
        setAppSettings(JSON.parse(cachedConfig));
      } catch (e) {}
    }
    
    const supabase = getSupabaseClient();

    const fetchSettings = async () => {
      const { data: s } = await supabase.from('app_settings').select('*');
      if (s) {
        const sMap = {};
        s.forEach(item => { sMap[item.key] = item.value; });
        setAppSettings(sMap);
        localStorage.setItem('crm_app_settings', JSON.stringify(sMap));
      }
    };

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (pathname !== '/login') {
          router.replace('/login');
        }
        setLoading(false);
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*, offices!users_office_id_fkey(id, name, country, city)')
        .eq('id', session.user.id)
        .single();

      if (!profile?.is_active) {
        await supabase.auth.signOut();
        router.replace('/login');
        setLoading(false);
        return;
      }

      setUser(profile);

      if (pathname === '/login') {
        router.replace('/dashboard');
      }

      setLoading(false);
    };


    fetchSettings();
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          router.replace('/login');
        } else if (event === 'SIGNED_IN' && session) {
          checkAuth();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  if (loading) {
    return (
      <div className="loading-page">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {appSettings === null ? (
            <div style={{ width: '52px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="loading-spinner" style={{ width: '24px', height: '24px', opacity: 0.5 }} />
            </div>
          ) : appSettings.logo_url ? (
            <img 
              src={appSettings.logo_url} 
              alt="Logo" 
              style={{ width: '52px', height: '52px', objectFit: 'contain' }} 
            />
          ) : (
            <div style={{
              width: '52px',
              height: '52px',
              background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: '800',
              color: 'var(--color-dark)',
              boxShadow: '0 0 30px rgba(201, 162, 39, 0.4)',
            }}>
              GT
            </div>
          )}
          {appSettings !== null && (
            <div className="loading-spinner" style={{ width: '28px', height: '28px' }} />
          )}
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            Loading {appSettings ? (appSettings.company_name || 'GT Group CRM') : '...'}
          </p>
        </div>
      </div>
    );
  }

  return children;
}

// Provide user context
export { AuthGuard };
