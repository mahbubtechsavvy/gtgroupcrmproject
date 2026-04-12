'use client';

import { useState, useEffect } from 'react';
import { 
  Share2, RefreshCw, Settings, History, Monitor, 
  Search, ShieldCheck, Globe, Info
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';
import { isSuperAdmin } from '@/lib/permissions';
import AppLayout, { useUser } from '@/components/layout/AppLayout';
import PlatformCard from '@/components/social-media/PlatformCard';
import WhatsAppPanel from '@/components/social-media/WhatsAppPanel';
import AccountManager from '@/components/social-media/AccountManager';
import ContentLog from '@/components/social-media/ContentLog';
import styles from './social-media.module.css';

export default function SocialMediaPage() {
  const user = useUser();
  const [offices, setOffices] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('center'); // center, manage, log
  const [selectedOffice, setSelectedOffice] = useState('all');
  const [wsAccount, setWsAccount] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchInitialData();
    }
  }, [user]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();
    
    try {
      // 1. Fetch offices
      const { data: officesData } = await supabase
        .from('offices')
        .select('*')
        .order('name');
      setOffices(officesData || []);

      // 2. Fetch accounts and logs
      await Promise.all([fetchAccounts(), fetchLogs()]);

    } catch (err) {
      console.error('Initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/social-media/accounts');
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch accounts failed:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/social-media/content-log');
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch logs failed:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchAccounts(), fetchLogs()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const isAdmin = user && isSuperAdmin(user.role);
  
  // Filter logic
  const filteredOffices = selectedOffice === 'all' 
    ? offices 
    : offices.filter(o => o.id === selectedOffice);

  const getOfficeAccounts = (officeId) => {
    return accounts.filter(a => a.office_id === officeId);
  };

  const getLatestPost = (officeId, platform) => {
    return logs.find(l => l.office_id === officeId && l.platform === platform);
  };

  if (isLoading || !user) {
    return (
      <AppLayout>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Initializing Command Center...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.titleIcon}>
              <Share2 size={32} />
            </div>
            <div>
              <h1>Social Media Hub</h1>
              <p>Centralized command for office social channels and engagement trackers.</p>
            </div>
          </div>
          <div className={styles.headerActions}>
            {isAdmin && (
              <div className={styles.adminBadge}>
                <ShieldCheck size={16} />
                Management Mode Active
              </div>
            )}
            <button 
              className={styles.refreshBtn} 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={18} className={refreshing ? styles.spin : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        {/* Control Panel */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <div className={styles.tabs}>
              <button 
                className={`${styles.tab} ${activeTab === 'center' ? styles.activeTab : ''}`}
                onClick={() => setActiveTab('center')}
              >
                <Monitor size={16} />
                Command Center
              </button>
              {isAdmin && (
                <>
                  <button 
                    className={`${styles.tab} ${activeTab === 'manage' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('manage')}
                  >
                    <Settings size={16} />
                    Manage Accounts
                  </button>
                  <button 
                    className={`${styles.tab} ${activeTab === 'log' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('log')}
                  >
                    <History size={16} />
                    Content Log
                  </button>
                </>
              )}
            </div>

            {activeTab === 'center' && isAdmin && (
              <div className={styles.filters}>
                <button 
                  className={`${styles.filterBtn} ${selectedOffice === 'all' ? styles.filterBtnActive : ''}`}
                  onClick={() => setSelectedOffice('all')}
                >
                  All Offices
                </button>
                {offices.map(o => (
                  <button 
                    key={o.id}
                    className={`${styles.filterBtn} ${selectedOffice === o.id ? styles.filterBtnActive : ''}`}
                    onClick={() => setSelectedOffice(o.id)}
                  >
                    {o.name.split(' ').pop()}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.panelContent}>
            {activeTab === 'center' && (
              <div className={styles.centerContainer}>
                {filteredOffices.map(office => {
                  const officeAccounts = getOfficeAccounts(office.id);
                  if (selectedOffice === 'all' && officeAccounts.length === 0) return null;

                  return (
                    <div key={office.id} className={styles.officeGroup}>
                      <div className={styles.officeHeader}>
                        <div className={styles.officeDot} />
                        <h2>{office.name}</h2>
                      </div>
                      <div className={styles.grid}>
                        {officeAccounts.map(acc => (
                          <PlatformCard 
                            key={acc.id}
                            account={acc}
                            isAdmin={isAdmin}
                            onWhatsAppOpen={setWsAccount}
                            lastPost={getLatestPost(office.id, acc.platform)}
                          />
                        ))}
                      </div>
                      {officeAccounts.length === 0 && (
                        <div className={styles.emptyState}>
                          <p>No social media accounts configured for this office.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'manage' && isAdmin && (
              <AccountManager offices={offices} />
            )}

            {activeTab === 'log' && isAdmin && (
              <ContentLog offices={offices} />
            )}
          </div>
        </div>

        {/* WhatsApp Panel Overlay */}
        {wsAccount && (
          <WhatsAppPanel 
            account={wsAccount} 
            onClose={() => setWsAccount(null)} 
          />
        )}
      </div>
    </AppLayout>
  );
}
