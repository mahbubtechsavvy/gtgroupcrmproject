'use client';

import { useState, useEffect } from 'react';
import { Mail, Filter, RotateCcw, Eye, EyeOff, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import styles from './email-history.module.css';

export default function EmailHistoryPage() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    emailType: 'all',
    status: 'all',
    search: '',
  });

  useEffect(() => {
    loadEmails();
  }, [filters]);

  const loadEmails = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('email_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filters.emailType !== 'all') {
        query = query.eq('email_type', filters.emailType);
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;

      let filtered = data || [];
      if (filters.search) {
        filtered = filtered.filter(
          (e) =>
            e.to_email.includes(filters.search) ||
            e.subject.includes(filters.search)
        );
      }

      setEmails(filtered);

      // Calculate stats
      const stats = {
        total: filtered.length,
        sent: filtered.filter((e) => e.status === 'sent').length,
        failed: filtered.filter((e) => e.status === 'failed').length,
        pending: filtered.filter((e) => e.status === 'pending').length,
      };
      setStats(stats);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (emailId) => {
    try {
      const response = await fetch('/api/email-retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logId: emailId }),
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Email scheduled for retry');
        await loadEmails();
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error) {
      alert('Error retrying email: ' + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      sent: '#10B981',
      failed: '#DC2626',
      pending: '#F59E0B',
      sending: '#3B82F6',
    };
    return colors[status] || '#6B7280';
  };

  const getEmailTypeLabel = (type) => {
    const labels = {
      event_invite: '📅 Event Invite',
      meeting_alert: '📞 Meeting Alert',
      notification: '📬 Notification',
      reminder: '⏰ Reminder',
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status) => {
    const badges = {
      sent: '✅ Sent',
      failed: '❌ Failed',
      pending: '⏳ Pending',
      sending: '📤 Sending',
    };
    return badges[status] || status;
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Mail size={24} />
          <div>
            <h1>Email History</h1>
            <p>Track all emails sent from your account</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statNumber}>{stats.total}</div>
            <div className={styles.statLabel}>Total Emails</div>
          </div>
          <div className={styles.statCard} style={{ borderColor: '#10B981' }}>
            <div className={styles.statNumber} style={{ color: '#10B981' }}>
              {stats.sent}
            </div>
            <div className={styles.statLabel}>Sent</div>
          </div>
          <div className={styles.statCard} style={{ borderColor: '#F59E0B' }}>
            <div className={styles.statNumber} style={{ color: '#F59E0B' }}>
              {stats.pending}
            </div>
            <div className={styles.statLabel}>Pending</div>
          </div>
          <div className={styles.statCard} style={{ borderColor: '#DC2626' }}>
            <div className={styles.statNumber} style={{ color: '#DC2626' }}>
              {stats.failed}
            </div>
            <div className={styles.statLabel}>Failed</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label>Email Type</label>
          <select
            value={filters.emailType}
            onChange={(e) =>
              setFilters({ ...filters, emailType: e.target.value })
            }
          >
            <option value="all">All Types</option>
            <option value="event_invite">Event Invite</option>
            <option value="meeting_alert">Meeting Alert</option>
            <option value="notification">Notification</option>
            <option value="reminder">Reminder</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All Status</option>
            <option value="sent">✅ Sent</option>
            <option value="failed">❌ Failed</option>
            <option value="pending">⏳ Pending</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Search</label>
          <input
            type="text"
            placeholder="Search email or subject..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Email List */}
      {loading ? (
        <div className={styles.loading}>Loading emails...</div>
      ) : emails.length === 0 ? (
        <div className={styles.emptyState}>
          <Mail size={48} />
          <h3>No emails found</h3>
          <p>Emails will appear here as they are sent</p>
        </div>
      ) : (
        <div className={styles.emailList}>
          {emails.map((email) => (
            <div
              key={email.id}
              className={styles.emailCard}
              style={{ borderLeftColor: getStatusColor(email.status) }}
            >
              <div className={styles.emailHeader}>
                <div className={styles.emailBasic}>
                  <div className={styles.emailTo}>{email.to_email}</div>
                  <div className={styles.emailSubject}>{email.subject}</div>
                </div>

                <div className={styles.emailMeta}>
                  <span
                    className={styles.emailType}
                    style={{ backgroundColor: '#f3f4f6' }}
                  >
                    {getEmailTypeLabel(email.email_type)}
                  </span>
                  <span
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(email.status) }}
                  >
                    {getStatusBadge(email.status)}
                  </span>
                </div>
              </div>

              <div className={styles.emailDetails}>
                <div className={styles.detail}>
                  <span className={styles.label}>From:</span>
                  <span className={styles.value}>{email.from_email}</span>
                </div>

                <div className={styles.detail}>
                  <span className={styles.label}>Date:</span>
                  <span className={styles.value}>
                    {new Date(email.created_at).toLocaleString()}
                  </span>
                </div>

                {email.sent_at && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Sent:</span>
                    <span className={styles.value}>
                      {new Date(email.sent_at).toLocaleString()}
                    </span>
                  </div>
                )}

                {email.error_message && (
                  <div className={styles.detail}>
                    <span className={styles.label}>Error:</span>
                    <span className={styles.error}>{email.error_message}</span>
                  </div>
                )}
              </div>

              <div className={styles.emailActions}>
                {email.status === 'failed' && email.retry_count < email.max_retries && (
                  <button
                    className={styles.retryButton}
                    onClick={() => handleRetry(email.id)}
                  >
                    <RotateCcw size={14} /> Retry
                  </button>
                )}

                {email.html_content && (
                  <button
                    className={styles.previewButton}
                    title="Preview email"
                  >
                    <Eye size={14} /> Preview
                  </button>
                )}

                <button className={styles.detailsButton} title="View details">
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
