'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Settings, ShieldCheck, Globe, RefreshCcw, CameraOff, Monitor, AlertCircle, Target, Play, Square } from 'lucide-react';
import { ExecutiveHero } from '@/components/crm/ExecutivePage';
import FlagIcon from '@/components/ui/FlagIcon';
import CameraPlayer from '@/components/cctv/CameraPlayer';
import DeviceManager from '@/components/cctv/DeviceManager';
import AiTracker from '@/components/cctv/AiTracker';
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
  const [showAiTracker, setShowAiTracker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [streams, setStreams] = useState({}); // deviceId -> streamUrl
  const [errorStatus, setErrorStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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

  // Auto-start streams with staggered delay to prevent network flooding
  useEffect(() => {
    const filtered = activeOfficeId === 'all' 
      ? devices 
      : devices.filter(d => d.office_id === activeOfficeId);
    
    // Find cameras that need streams started
    const toStart = filtered.filter(d => !streams[d.id]);
    if (toStart.length === 0) return;

    let cancelled = false;

    const startStaggered = async () => {
      for (let i = 0; i < toStart.length; i++) {
        if (cancelled) break;
        startStream(toStart[i].id);
        // Wait 1 second between each camera to avoid flooding the network
        if (i < toStart.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    };

    startStaggered();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, activeOfficeId, refreshKey]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setStreams({}); // Clear streams to force restart
    setRefreshKey(prev => prev + 1); // Trigger the useEffect to restart streams
    await fetchDevices();
    setIsRefreshing(false);
  };

  const filteredDevices = activeOfficeId === 'all' 
    ? devices 
    : devices.filter(d => d.office_id === activeOfficeId);

  const allPlaying = filteredDevices.length > 0 && filteredDevices.every(d => !!streams[d.id]);

  const handlePlayAllToggle = () => {
    if (allPlaying) {
      const newStreams = { ...streams };
      filteredDevices.forEach(d => {
        delete newStreams[d.id];
      });
      setStreams(newStreams);
    } else {
      filteredDevices.forEach(d => {
        if (!streams[d.id]) {
          startStream(d.id);
        }
      });
    }
  };

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

  // Group devices by office
  const groupedDevices = offices.map(office => ({
    ...office,
    devices: filteredDevices.filter(d => d.office_id === office.id)
  })).filter(o => o.devices.length > 0);

  return (
    <div className={styles.page}>
      <ExecutiveHero
        eyebrow="Realtime Security"
        title="Office CCTV Monitoring"
        subtitle="Elegant premium monitoring for all branches with faster office switching, cleaner background treatment, and brand-matched camera surfaces."
        actions={
          <div className={styles.headerActions}>
            {!showManager && !showAiTracker && (
              <button 
                className={styles.refreshBtn}
                onClick={handlePlayAllToggle}
              >
                {allPlaying ? <Square size={18} /> : <Play size={18} />}
                <span>{allPlaying ? 'Stop All' : 'Play All'}</span>
              </button>
            )}

            <button 
              className={`${styles.refreshBtn} ${isRefreshing ? styles.refreshing : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCcw size={18} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            
            {isSuperAdmin && (
              <>
                <button 
                  className={`${styles.adminBtn} ${showAiTracker ? styles.active : ''}`}
                  onClick={() => {
                    setShowAiTracker(!showAiTracker);
                    setShowManager(false);
                  }}
                >
                  <Target size={18} />
                  {showAiTracker ? 'Back to Dashboard' : 'AI Workstation Tracker'}
                </button>

                <button 
                  className={`${styles.adminBtn} ${showManager ? styles.active : ''}`}
                  onClick={() => {
                    setShowManager(!showManager);
                    setShowAiTracker(false);
                  }}
                >
                  {showManager ? <Globe size={18} /> : <Settings size={18} />}
                  {showManager ? 'Back to Dashboard' : 'Manage Devices'}
                </button>
              </>
            )}
          </div>
        }
      />

      {showManager && isSuperAdmin ? (
        <DeviceManager offices={offices} onUpdate={fetchDevices} />
      ) : showAiTracker && isSuperAdmin ? (
        <AiTracker devices={devices} offices={offices} streams={streams} startStream={startStream} />
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

          {groupedDevices.length === 0 ? (
            <div className={styles.emptyState}>
              <CameraOff size={64} className={styles.emptyIcon} />
              <h3>No Cameras Online</h3>
              <p>Select an office or add new cameras in the management panel.</p>
            </div>
          ) : (
            groupedDevices.map(officeGroup => (
              <div key={officeGroup.id} className={styles.officeSection}>
                <div className={styles.officeHeader}>
                  <FlagIcon countryName={officeGroup.country} size="sm" />
                  <div className={styles.officeDot} />
                  <h2>{officeGroup.name}</h2>
                </div>
                <div className={styles.grid}>
                  {officeGroup.devices.map(device => (
                    <CameraPlayer 
                      key={device.id}
                      cameraName={device.name}
                      streamUrl={streams[device.id]}
                      onRetry={() => startStream(device.id)}
                      onToggle={() => {
                        if (streams[device.id]) {
                          const newStreams = { ...streams };
                          delete newStreams[device.id];
                          setStreams(newStreams);
                        } else {
                          startStream(device.id);
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            ))
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
