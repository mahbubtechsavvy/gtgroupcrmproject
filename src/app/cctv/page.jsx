'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Settings, ShieldCheck, Globe, RefreshCcw, CameraOff, Monitor, AlertCircle } from 'lucide-react';
import CameraPlayer from '@/components/cctv/CameraPlayer';
import DeviceManager from '@/components/cctv/DeviceManager';
import styles from './CctvPage.module.css';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CctvPage() {
  const [user, setUser] = useState(null);
  const [offices, setOffices] = useState([]);
  const [devices, setDevices] = useState([]);
  const [activeOfficeId, setActiveOfficeId] = useState('all');
  const [showManager, setShowManager] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streams, setStreams] = useState({}); // deviceId -> streamUrl
  const [errorStatus, setErrorStatus] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          console.error("Auth Error:", authError);
          window.location.href = '/login';
          return;
        }

        // Fetch user profile with role
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*, offices!users_office_id_fkey(name)')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;
        setUser(profile);

        // Fetch offices
        const { data: officesData, error: officesError } = await supabase
          .from('offices')
          .select('*')
          .order('name');
        
        if (officesError) throw officesError;
        setOffices(officesData || []);

        // Fetch devices
        await fetchDevices();
      } catch (err) {
        console.error("CCTV Init Error:", err);
        setErrorStatus(err.message || 'Failed to initialize CCTV module. Ensure database migration was applied.');
        setIsLoading(false);
      }
    };

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDevices = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cctv/devices');
      if (res.ok) {
        const data = await res.json();
        setDevices(data);
      }
    } catch (err) {
      console.error('Error fetching devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startStream = async (deviceId) => {
    try {
      const res = await fetch('/api/cctv/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      if (res.ok) {
        const data = await res.json();
        setStreams(prev => ({ ...prev, [deviceId]: data.streamUrl }));
      }
    } catch (err) {
      console.error('Error starting stream:', err);
    }
  };

  // Auto-start streams when devices change or office filter changes
  useEffect(() => {
    const filtered = activeOfficeId === 'all' 
      ? devices 
      : devices.filter(d => d.office_id === activeOfficeId);
    
    filtered.forEach(device => {
      if (!streams[device.id]) {
        startStream(device.id);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, activeOfficeId]);

  const isSuperAdmin = ['ceo', 'coo', 'it_manager'].includes(user?.role);

  if (isLoading && !user && !errorStatus) return <div className={styles.loading}>Verifying access...</div>;

  if (errorStatus) {
    return (
      <div className={styles.page}>
        <div className={styles.errorContainer}>
          <AlertCircle size={48} color="#ef4444" />
          <h2>Page Error</h2>
          <p>{errorStatus}</p>
          <button onClick={() => window.location.reload()} className={styles.filterBtn}>Reload Page</button>
        </div>
      </div>
    );
  }

  const filteredDevices = activeOfficeId === 'all' 
    ? devices 
    : devices.filter(d => d.office_id === activeOfficeId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <Monitor className={styles.titleIcon} size={32} />
          <div>
            <h1>Office CCTV Monitoring</h1>
            <p>Live real-time security feeds across all international branches.</p>
          </div>
        </div>
        
        {isSuperAdmin && (
          <button 
            className={`${styles.adminBtn} ${showManager ? styles.active : ''}`}
            onClick={() => setShowManager(!showManager)}
          >
            {showManager ? <Globe size={18} /> : <Settings size={18} />}
            {showManager ? 'Back to Dashboard' : 'Manage Devices'}
          </button>
        )}
      </header>

      {showManager && isSuperAdmin ? (
        <DeviceManager offices={offices} onUpdate={fetchDevices} />
      ) : (
        <>
          <div className={styles.filters}>
            <button 
              className={`${styles.filterBtn} ${activeOfficeId === 'all' ? styles.active : ''}`}
              onClick={() => setActiveOfficeId('all')}
            >
              All Offices
            </button>
            {offices.map(office => (
              <button 
                key={office.id}
                className={`${styles.filterBtn} ${activeOfficeId === office.id ? styles.active : ''}`}
                onClick={() => setActiveOfficeId(office.id)}
              >
                {office.name}
              </button>
            ))}
          </div>

          {filteredDevices.length === 0 ? (
            <div className={styles.emptyState}>
              <CameraOff size={64} className={styles.emptyIcon} />
              <h3>No Cameras Online</h3>
              <p>Select an office or add new cameras in the management panel.</p>
            </div>
          ) : (
            <div className={styles.grid}>
              {filteredDevices.map(device => (
                <CameraPlayer 
                  key={device.id}
                  cameraName={device.name}
                  streamUrl={streams[device.id]}
                  onRetry={() => startStream(device.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {isSuperAdmin && (
        <footer className={styles.footer}>
          <ShieldCheck size={16} />
          <span>Secure Admin Session Active: ENCRYPTED_STREAMING</span>
        </footer>
      )}
    </div>
  );
}
