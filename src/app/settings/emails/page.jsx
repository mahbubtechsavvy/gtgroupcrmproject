'use client';

import { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Check, X, Loader, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';
import {
  getUserEmailAccounts,
  addEmailAccount,
  removeEmailAccount,
  setPrimaryEmail,
  sendEmailVerification,
  checkEmailExists,
} from '@/lib/emailAccountManager';
import { initiateGoogleOAuth } from '@/lib/googleOAuth';
import styles from './emails.module.css';

export default function EmailSettingsPage() {
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    account_type: 'crm',
    display_name: '',
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);

  // OAuth state
  const [oauthLoading, setOauthLoading] = useState(null); // email_account_id being authorized

  // Load email accounts
  useEffect(() => {
    loadEmailAccounts();
  }, []);

  // Show success message temporarily
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadEmailAccounts = async () => {
    try {
      setLoading(true);
      const result = await getUserEmailAccounts();
      if (result.success) {
        setEmailAccounts(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load email accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmail = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      // Validate
      if (!formData.email) {
        setFormError('Email is required');
        setFormLoading(false);
        return;
      }

      // Check if already exists
      const exists = await checkEmailExists(formData.email);
      if (exists.exists) {
        setFormError('This email is already registered');
        setFormLoading(false);
        return;
      }

      // Add email
      const result = await addEmailAccount(formData);
      if (result.success) {
        setSuccessMessage(`✅ Email added: ${formData.email}`);
        setFormData({ email: '', account_type: 'crm', display_name: '' });
        setShowForm(false);
        await loadEmailAccounts();
      } else {
        setFormError(result.error);
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleRemoveEmail = async (emailId) => {
    if (!confirm('Remove this email account?')) return;

    try {
      const result = await removeEmailAccount(emailId);
      if (result.success) {
        setSuccessMessage('✅ Email removed');
        await loadEmailAccounts();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetPrimary = async (emailId) => {
    try {
      const result = await setPrimaryEmail(emailId);
      if (result.success) {
        setSuccessMessage('✅ Set as primary');
        await loadEmailAccounts();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleConnectGoogle = (emailId) => {
    try {
      setOauthLoading(emailId);
      const oauthUrl = initiateGoogleOAuth(emailId);
      window.location.href = oauthUrl;
    } catch (err) {
      setOauthLoading(null);
      setError(err.message);
    }
  };

  const handleSendVerification = async (emailId, email) => {
    try {
      const result = await sendEmailVerification(emailId, email);
      if (result.success) {
        setSuccessMessage(`✅ Verification email sent to ${email}`);
        // Optionally reload to show updated status
        await loadEmailAccounts();
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const getEmailTypeLabel = (type) => {
    const labels = {
      crm: '📨 CRM Email',
      gmail: '🔵 Gmail',
      office: '📧 Office Email',
    };
    return labels[type] || type;
  };

  const getEmailTypeColor = (type) => {
    const colors = {
      crm: '#C9A227', // Gold
      gmail: '#EA4335', // Google red
      office: '#0078D4', // Microsoft blue
    };
    return colors[type] || '#999';
  };

  return (
    <div className={styles.emailSettingsContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <Mail size={24} />
          <div>
            <h1>Email Accounts</h1>
            <p>Manage your email addresses for different communication types</p>
          </div>
        </div>
        {!showForm && (
          <button
            className={styles.addButton}
            onClick={() => setShowForm(true)}
          >
            <Plus size={20} /> Add Email
          </button>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className={styles.errorMessage}>
          <X size={16} /> {error}
        </div>
      )}
      {successMessage && (
        <div className={styles.successMessage}>
          <Check size={16} /> {successMessage}
        </div>
      )}

      {/* Add Email Form */}
      {showForm && (
        <div className={styles.formContainer}>
          <h2>Add New Email Account</h2>
          <form onSubmit={handleAddEmail}>
            <div className={styles.formGroup}>
              <label>Email Address *</label>
              <input
                type="email"
                placeholder="your.email@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={formLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email Type *</label>
              <select
                value={formData.account_type}
                onChange={(e) =>
                  setFormData({ ...formData, account_type: e.target.value })
                }
                disabled={formLoading}
              >
                <option value="crm">CRM Email</option>
                <option value="gmail">Gmail</option>
                <option value="office">Office Email</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Display Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g., My Gmail"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({ ...formData, display_name: e.target.value })
                }
                disabled={formLoading}
              />
            </div>

            {formError && (
              <div className={styles.formError}>
                <X size={16} /> {formError}
              </div>
            )}

            <div className={styles.formActions}>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <Loader size={16} className={styles.spinner} /> Adding...
                  </>
                ) : (
                  <>
                    <Check size={16} /> Add Email
                  </>
                )}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  setShowForm(false);
                  setFormError(null);
                }}
                disabled={formLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className={styles.loadingState}>
          <Loader className={styles.spinner} size={40} />
          <p>Loading email accounts...</p>
        </div>
      )}

      {/* Email Accounts List */}
      {!loading && (
        <div>
          {emailAccounts.length === 0 ? (
            <div className={styles.emptyState}>
              <Mail size={48} />
              <h3>No email accounts yet</h3>
              <p>Add your first email account to get started</p>
              <button
                className={styles.emptyAddButton}
                onClick={() => setShowForm(true)}
              >
                <Plus size={16} /> Add Email Account
              </button>
            </div>
          ) : (
            <div className={styles.emailList}>
              {emailAccounts.map((account) => (
                <div
                  key={account.id}
                  className={styles.emailCard}
                  style={
                    account.is_primary
                      ? {
                          borderLeft: `4px solid ${getEmailTypeColor(
                            account.account_type
                          )}`,
                        }
                      : {}
                  }
                >
                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.emailInfo}>
                      <div
                        className={styles.typeIcon}
                        style={{
                          backgroundColor: getEmailTypeColor(
                            account.account_type
                          ),
                        }}
                      >
                        {account.account_type === 'gmail'
                          ? '📧'
                          : account.account_type === 'office'
                          ? '💼'
                          : '📨'}
                      </div>
                      <div>
                        <div className={styles.emailAddress}>
                          {account.email}
                        </div>
                        <div className={styles.emailType}>
                          {getEmailTypeLabel(account.account_type)}
                        </div>
                      </div>
                    </div>

                    {/* Primary Badge */}
                    {account.is_primary && (
                      <div className={styles.primaryBadge}>
                        ⭐ Primary
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className={styles.cardBody}>
                    {/* Verification Status */}
                    <div className={styles.statusRow}>
                      <span className={styles.label}>Verification:</span>
                      {account.is_verified ? (
                        <span className={styles.statusVerified}>
                          <Check size={14} /> Verified
                        </span>
                      ) : (
                        <span className={styles.statusUnverified}>
                          <X size={14} /> Not Verified
                        </span>
                      )}
                    </div>

                    {/* OAuth Status */}
                    {account.account_type === 'gmail' && (
                      <div className={styles.statusRow}>
                        <span className={styles.label}>Google Connect:</span>
                        {account.oauth_connected ? (
                          <span className={styles.statusConnected}>
                            <Check size={14} /> Connected
                          </span>
                        ) : (
                          <span className={styles.statusDisconnected}>
                            <X size={14} /> Not Connected
                          </span>
                        )}
                      </div>
                    )}

                    {/* Added Date */}
                    <div className={styles.statusRow}>
                      <span className={styles.label}>Added:</span>
                      <span className={styles.date}>
                        {new Date(account.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer - Actions */}
                  <div className={styles.cardActions}>
                    {/* Set Primary Button */}
                    {!account.is_primary && (
                      <button
                        className={styles.actionButton}
                        onClick={() => handleSetPrimary(account.id)}
                        title="Set as primary email for this type"
                      >
                        ⭐ Set as Primary
                      </button>
                    )}

                    {/* Verification Button */}
                    {!account.is_verified && (
                      <button
                        className={styles.actionButton}
                        onClick={() =>
                          handleSendVerification(account.id, account.email)
                        }
                        title="Send verification email"
                      >
                        ✉️ Verify Email
                      </button>
                    )}

                    {/* Google OAuth Button */}
                    {account.account_type === 'gmail' &&
                      !account.oauth_connected && (
                        <button
                          className={styles.actionButton}
                          onClick={() => handleConnectGoogle(account.id)}
                          disabled={oauthLoading === account.id}
                          title="Connect with Google to enable calendar sync and email sending"
                        >
                          {oauthLoading === account.id ? (
                            <>
                              <Loader size={14} className={styles.spinner} />{' '}
                              Connecting...
                            </>
                          ) : (
                            <>
                              <LinkIcon size={14} /> Connect Google
                            </>
                          )}
                        </button>
                      )}

                    {/* Disconnect Google Button */}
                    {account.account_type === 'gmail' &&
                      account.oauth_connected && (
                        <button
                          className={styles.actionButtonDanger}
                          onClick={() => {
                            // TODO: Implement disconnect
                          }}
                          title="Disconnect Google account"
                        >
                          🔗 Disconnect
                        </button>
                      )}

                    {/* Delete Button */}
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleRemoveEmail(account.id)}
                      title="Remove this email account"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className={styles.infoSection}>
        <h3>📖 Email Types Explained</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <div
              className={styles.infoColor}
              style={{ backgroundColor: '#C9A227' }}
            ></div>
            <div>
              <strong>CRM Email</strong>
              <p>Primary email for system notifications and documentation</p>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div
              className={styles.infoColor}
              style={{ backgroundColor: '#EA4335' }}
            ></div>
            <div>
              <strong>Gmail</strong>
              <p>For Google Meet integration and calendar sync</p>
            </div>
          </div>
          <div className={styles.infoCard}>
            <div
              className={styles.infoColor}
              style={{ backgroundColor: '#0078D4' }}
            ></div>
            <div>
              <strong>Office Email</strong>
              <p>For official documentation and formal communications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
