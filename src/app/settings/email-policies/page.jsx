'use client';

import React, { useState, useEffect } from 'react';
import styles from './email-policies.module.css';
import {
  getActivePolicies,
  createEmailPolicy,
  updatePolicyRules,
  deactivatePolicy,
  getPolicyAuditLog,
} from '@/lib/emailPolicies';
import { useAuth } from '@/lib/auth';

/**
 * Super Admin Email Policies Management Page
 * Phase 5 - April 9, 2026
 *
 * Allows Super Admin to:
 * - Create email routing policies
 * - Assign policies to users/departments
 * - View policy audit log
 * - Activate/deactivate policies
 */

export default function EmailPoliciesPage() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [auditLog, setAuditLog] = useState([]);
  const [editingPolicy, setEditingPolicy] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    policy_name: '',
    description: '',
    policy_type: 'custom',
    rules: {
      event_invites: { account_type: 'primary' },
      meeting_alerts: { account_type: 'primary' },
      notifications: { account_type: 'primary' },
      reminders: { account_type: 'primary' },
    },
  });

  useEffect(() => {
    if (user?.id) {
      loadPolicies();
    }
  }, [user]);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const data = await getActivePolicies(user.id);
      setPolicies(data || []);
    } catch (error) {
      console.error('Error loading policies:', error);
      alert('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const loadAuditLog = async (policyId) => {
    try {
      const log = await getPolicyAuditLog(policyId);
      setAuditLog(log || []);
    } catch (error) {
      console.error('Error loading audit log:', error);
    }
  };

  const handleCreatePolicy = async (e) => {
    e.preventDefault();

    if (!formData.policy_name.trim()) {
      alert('Policy name is required');
      return;
    }

    try {
      const result = await createEmailPolicy(formData, user.id);

      if (result.success) {
        alert('Policy created successfully!');
        setFormData({
          policy_name: '',
          description: '',
          policy_type: 'custom',
          rules: {
            event_invites: { account_type: 'primary' },
            meeting_alerts: { account_type: 'primary' },
            notifications: { account_type: 'primary' },
            reminders: { account_type: 'primary' },
          },
        });
        setShowCreateForm(false);
        await loadPolicies();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      alert('Failed to create policy');
    }
  };

  const handleUpdateRules = async () => {
    if (!editingPolicy) return;

    try {
      const result = await updatePolicyRules(
        editingPolicy.id,
        editingPolicy.rules,
        user.id
      );

      if (result.success) {
        alert('Policy updated successfully!');
        setEditingPolicy(null);
        await loadPolicies();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      alert('Failed to update policy');
    }
  };

  const handleDeactivatePolicy = async (policyId) => {
    if (!window.confirm('Are you sure you want to deactivate this policy?')) {
      return;
    }

    try {
      const result = await deactivatePolicy(policyId, user.id);

      if (result.success) {
        alert('Policy deactivated');
        await loadPolicies();
        setSelectedPolicy(null);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deactivating policy:', error);
      alert('Failed to deactivate policy');
    }
  };

  const handleSelectPolicy = (policy) => {
    setSelectedPolicy(policy);
    if (editingPolicy?.id === policy.id) {
      setEditingPolicy(null);
    } else {
      loadAuditLog(policy.id);
    }
  };

  const handleRuleChange = (emailType, accountType) => {
    if (!editingPolicy) return;

    setEditingPolicy({
      ...editingPolicy,
      rules: {
        ...editingPolicy.rules,
        [emailType]: { account_type: accountType },
      },
    });
  };

  if (!user) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>⚙️ Email Routing Policies</h1>
          <p>Configure email routing rules for your CRM</p>
        </div>
        <button
          className={styles.createBtn}
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? '❌ Cancel' : '➕ Create Policy'}
        </button>
      </div>

      {/* Create Policy Form */}
      {showCreateForm && (
        <div className={styles.formCard}>
          <h2>Create New Policy</h2>
          <form onSubmit={handleCreatePolicy}>
            <div className={styles.formGroup}>
              <label>Policy Name *</label>
              <input
                type="text"
                value={formData.policy_name}
                onChange={(e) =>
                  setFormData({ ...formData, policy_name: e.target.value })
                }
                placeholder="e.g., Gmail Priority"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Policy description..."
                rows="3"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Policy Type</label>
              <select
                value={formData.policy_type}
                onChange={(e) =>
                  setFormData({ ...formData, policy_type: e.target.value })
                }
              >
                <option value="custom">Custom</option>
                <option value="default">Default</option>
                <option value="department">Department-Based</option>
                <option value="role_based">Role-Based</option>
              </select>
            </div>

            <div className={styles.rulesSection}>
              <h3>Email Routing Rules</h3>

              {['event_invites', 'meeting_alerts', 'notifications', 'reminders'].map(
                (emailType) => (
                  <div key={emailType} className={styles.ruleGroup}>
                    <label>{emailType.replace('_', ' ').toUpperCase()}</label>
                    <div className={styles.ruleOptions}>
                      {['primary', 'gmail', 'crm'].map((accountType) => (
                        <label key={accountType} className={styles.radioLabel}>
                          <input
                            type="radio"
                            name={emailType}
                            value={accountType}
                            checked={
                              formData.rules[emailType]?.account_type === accountType
                            }
                            onChange={(e) => {
                              setFormData({
                                ...formData,
                                rules: {
                                  ...formData.rules,
                                  [emailType]: { account_type: e.target.value },
                                },
                              });
                            }}
                          />
                          Use {accountType.charAt(0).toUpperCase() + accountType.slice(1)}
                        </label>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>

            <div className={styles.formActions}>
              <button type="submit" className={styles.submitBtn}>
                ✅ Create Policy
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowCreateForm(false)}
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Policies List */}
      <div className={styles.policiesSection}>
        <h2>Active Policies ({policies.length})</h2>

        {loading ? (
          <div className={styles.loading}>Loading policies...</div>
        ) : policies.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No policies yet. Create one to get started!</p>
          </div>
        ) : (
          <div className={styles.policiesList}>
            {policies.map((policy) => (
              <div
                key={policy.id}
                className={`${styles.policyCard} ${
                  selectedPolicy?.id === policy.id ? styles.selected : ''
                }`}
                onClick={() => handleSelectPolicy(policy)}
              >
                <div className={styles.policyHeader}>
                  <div>
                    <h3>{policy.policy_name}</h3>
                    <p className={styles.policyType}>{policy.policy_type}</p>
                  </div>
                  <div className={styles.policyBadges}>
                    {policy.is_default && <span className={styles.badge}>Default</span>}
                    <span className={styles.badge}>
                      {policy.is_active ? '✅ Active' : '❌ Inactive'}
                    </span>
                  </div>
                </div>

                {policy.description && (
                  <p className={styles.description}>{policy.description}</p>
                )}

                {selectedPolicy?.id === policy.id && (
                  <div className={styles.policyDetails}>
                    {!editingPolicy ? (
                      <>
                        <div className={styles.rulesDisplay}>
                          <h4>Current Rules:</h4>
                          {Object.entries(policy.rules).map(([key, value]) => (
                            <div key={key} className={styles.ruleItem}>
                              <span className={styles.ruleType}>{key}:</span>
                              <span className={styles.ruleValue}>
                                {value.account_type}
                              </span>
                            </div>
                          ))}
                        </div>

                        {auditLog.length > 0 && (
                          <div className={styles.auditLog}>
                            <h4>Change History:</h4>
                            <ul>
                              {auditLog.slice(0, 3).map((entry, idx) => (
                                <li key={idx}>
                                  <strong>{entry.action}</strong> - {entry.reason}
                                  <span className={styles.timestamp}>
                                    {new Date(entry.created_at).toLocaleDateString()}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className={styles.detailActions}>
                          <button
                            className={styles.editBtn}
                            onClick={() => setEditingPolicy(policy)}
                          >
                            ✏️ Edit Rules
                          </button>
                          {!policy.is_default && (
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDeactivatePolicy(policy.id)}
                            >
                              🗑️ Deactivate
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className={styles.editRulesForm}>
                          <h4>Edit Routing Rules</h4>
                          {['event_invites', 'meeting_alerts', 'notifications', 'reminders'].map(
                            (emailType) => (
                              <div key={emailType} className={styles.ruleGroup}>
                                <label>{emailType.replace('_', ' ').toUpperCase()}</label>
                                <select
                                  value={
                                    editingPolicy.rules[emailType]?.account_type || 'primary'
                                  }
                                  onChange={(e) =>
                                    handleRuleChange(emailType, e.target.value)
                                  }
                                >
                                  <option value="primary">Primary Email</option>
                                  <option value="gmail">Gmail</option>
                                  <option value="crm">CRM Email</option>
                                </select>
                              </div>
                            )
                          )}
                        </div>

                        <div className={styles.editActions}>
                          <button
                            className={styles.saveBtn}
                            onClick={handleUpdateRules}
                          >
                            💾 Save Changes
                          </button>
                          <button
                            className={styles.cancelBtn}
                            onClick={() => setEditingPolicy(null)}
                          >
                            ❌ Cancel
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className={styles.infoSection}>
        <h3>About Email Policies</h3>
        <div className={styles.infoContent}>
          <p>
            <strong>Email Policies</strong> define how emails are routed for different
            communication types:
          </p>
          <ul>
            <li><strong>Event Invites:</strong> Emails sent when events are created</li>
            <li><strong>Meeting Alerts:</strong> Reminders and notifications for meetings</li>
            <li><strong>Notifications:</strong> System notifications and updates</li>
            <li><strong>Reminders:</strong> Scheduled reminders</li>
          </ul>
          <p>
            For each type, you can specify which email account to use:
            <br />
            • <strong>Primary:</strong> User's primary email account
            <br />
            • <strong>Gmail:</strong> Gmail account with OAuth
            <br />
            • <strong>CRM:</strong> CRM system email
          </p>
        </div>
      </div>
    </div>
  );
}
