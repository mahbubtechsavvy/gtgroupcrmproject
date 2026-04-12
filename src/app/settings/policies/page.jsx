'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/lib/supabase';
import styles from './policies.module.css';

/**
 * Email Policies Admin Page (Phase 5)
 * Super Admin manages email routing policies for entire organization
 */

export default function EmailPoliciesPage() {
  const { supabase, user } = useSupabase();
  const [policies, setPolicies] = useState([]);
  const [emailAccounts, setEmailAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [alert, setAlert] = useState(null);

  const [formData, setFormData] = useState({
    policyName: '',
    policyType: 'default',
    description: '',
    rules: {
      event_invites: { account_type: 'gmail', priority: 'oauth_connected' },
      meeting_alerts: { account_type: 'gmail', priority: 'primary' },
      notifications: { account_type: 'crm', priority: 'primary' },
      reminders: { account_type: 'crm', priority: 'any' }
    }
  });

  // Load data
  useEffect(() => {
    if (!user) return;
    loadPoliciesAndAccounts();
  }, [user]);

  const loadPoliciesAndAccounts = async () => {
    try {
      setLoading(true);

      // Load policies
      const { data: policiesData } = await supabase
        .from('email_policies')
        .select('*')
        .order('created_at', { ascending: false });

      setPolicies(policiesData || []);

      // Load email accounts
      const { data: accountsData } = await supabase
        .from('user_email_accounts')
        .select('*')
        .eq('is_verified', true);

      setEmailAccounts(accountsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      setAlert({ type: 'error', message: 'Failed to load policies' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async () => {
    if (!formData.policyName.trim()) {
      setAlert({ type: 'error', message: 'Policy name required' });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('email_policies')
        .insert({
          policy_name: formData.policyName,
          policy_type: formData.policyType,
          description: formData.description,
          rules: formData.rules,
          created_by: user.id,
          is_active: true
        })
        .select('*')
        .single();

      if (error) throw error;

      // Audit log
      await supabase.from('email_policy_audit').insert({
        policy_id: data.id,
        user_id: user.id,
        action: 'created',
        new_rules: formData.rules,
        reason: 'Policy created by Super Admin'
      });

      setPolicies([data, ...policies]);
      setFormData({
        policyName: '',
        policyType: 'default',
        description: '',
        rules: {
          event_invites: { account_type: 'gmail', priority: 'oauth_connected' },
          meeting_alerts: { account_type: 'gmail', priority: 'primary' },
          notifications: { account_type: 'crm', priority: 'primary' },
          reminders: { account_type: 'crm', priority: 'any' }
        }
      });
      setIsCreating(false);
      setAlert({ type: 'success', message: '✅ Policy created successfully' });
    } catch (error) {
      console.error('Error creating policy:', error);
      setAlert({ type: 'error', message: `Error: ${error.message}` });
    }
  };

  const handleTogglePolicyStatus = async (policyId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('email_policies')
        .update({ is_active: !currentStatus, updated_by: user.id })
        .eq('id', policyId);

      if (error) throw error;

      setPolicies(
        policies.map((p) =>
          p.id === policyId ? { ...p, is_active: !currentStatus } : p
        )
      );

      setAlert({
        type: 'success',
        message: `Policy ${!currentStatus ? 'activated' : 'deactivated'}`
      });
    } catch (error) {
      console.error('Error updating policy:', error);
      setAlert({ type: 'error', message: 'Failed to update policy' });
    }
  };

  const handleDeletePolicy = async (policyId) => {
    if (!confirm('Delete this policy? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('email_policies')
        .delete()
        .eq('id', policyId);

      if (error) throw error;

      setPolicies(policies.filter((p) => p.id !== policyId));
      setSelectedPolicy(null);
      setAlert({ type: 'success', message: 'Policy deleted' });
    } catch (error) {
      console.error('Error deleting policy:', error);
      setAlert({ type: 'error', message: 'Failed to delete policy' });
    }
  };

  const handleUpdateRules = async (policyId) => {
    if (!selectedPolicy) return;

    try {
      const { error } = await supabase
        .from('email_policies')
        .update({
          rules: selectedPolicy.rules,
          updated_by: user.id
        })
        .eq('id', policyId);

      if (error) throw error;

      // Audit log
      const originalPolicy = policies.find((p) => p.id === policyId);
      await supabase.from('email_policy_audit').insert({
        policy_id: policyId,
        user_id: user.id,
        action: 'updated',
        old_rules: originalPolicy.rules,
        new_rules: selectedPolicy.rules,
        reason: 'Rules updated by Super Admin'
      });

      setPolicies(
        policies.map((p) => (p.id === policyId ? selectedPolicy : p))
      );
      setAlert({ type: 'success', message: 'Rules updated successfully' });
    } catch (error) {
      console.error('Error updating rules:', error);
      setAlert({ type: 'error', message: 'Failed to update rules' });
    }
  };

  const handleUseTemplate = async (templateName) => {
    const templates = {
      default: {
        policyName: 'Default Email Routing',
        policyType: 'default',
        rules: {
          event_invites: { account_type: 'gmail', priority: 'oauth_connected' },
          meeting_alerts: { account_type: 'gmail', priority: 'primary' },
          notifications: { account_type: 'crm', priority: 'primary' },
          reminders: { account_type: 'crm', priority: 'any' }
        },
        description: 'Uses Gmail for meetings and CRM for notifications'
      },
      strict: {
        policyName: 'Strict Primary-Only Policy',
        policyType: 'custom',
        rules: {
          event_invites: { account_type: 'gmail', priority: 'primary' },
          meeting_alerts: { account_type: 'gmail', priority: 'primary' },
          notifications: { account_type: 'crm', priority: 'primary' },
          reminders: { account_type: 'crm', priority: 'primary' }
        },
        description: 'Uses only primary accounts, no fallback'
      },
      gmailOnly: {
        policyName: 'Gmail-Only Policy',
        policyType: 'custom',
        rules: {
          event_invites: { account_type: 'gmail', priority: 'any' },
          meeting_alerts: { account_type: 'gmail', priority: 'any' },
          notifications: { account_type: 'gmail', priority: 'any' },
          reminders: { account_type: 'gmail', priority: 'any' }
        },
        description: 'Routes all emails through Gmail accounts'
      }
    };

    const template = templates[templateName];
    if (!template) return;

    setFormData(template);
    setIsCreating(true);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading policies...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>✉️ Email Routing Policies</h1>
      <p className={styles.subtitle}>
        Manage how emails are routed across your organization
      </p>

      {alert && (
        <div className={`${styles.alert} ${styles[alert.type]}`}>
          {alert.message}
          <button
            className={styles.closeBtn}
            onClick={() => setAlert(null)}
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* Left: Policy List */}
        <div className={styles.policyList}>
          <div className={styles.listHeader}>
            <h2>Policies</h2>
            <button
              className={styles.createBtn}
              onClick={() => setIsCreating(!isCreating)}
            >
              + New Policy
            </button>
          </div>

          {isCreating && (
            <div className={styles.createForm}>
              <h3>Create New Policy</h3>

              <input
                type="text"
                placeholder="Policy name (e.g., Sales Department)"
                value={formData.policyName}
                onChange={(e) =>
                  setFormData({ ...formData, policyName: e.target.value })
                }
                className={styles.input}
              />

              <select
                value={formData.policyType}
                onChange={(e) =>
                  setFormData({ ...formData, policyType: e.target.value })
                }
                className={styles.select}
              >
                <option value="default">Default</option>
                <option value="department">Department-Based</option>
                <option value="custom">Custom</option>
                <option value="role_based">Role-Based</option>
              </select>

              <textarea
                placeholder="Description (optional)"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className={styles.textarea}
              />

              <div className={styles.templateButtons}>
                <button
                  className={styles.templateBtn}
                  onClick={() => handleUseTemplate('default')}
                >
                  📋 Default Template
                </button>
                <button
                  className={styles.templateBtn}
                  onClick={() => handleUseTemplate('strict')}
                >
                  🔒 Strict Template
                </button>
                <button
                  className={styles.templateBtn}
                  onClick={() => handleUseTemplate('gmailOnly')}
                >
                  📧 Gmail-Only
                </button>
              </div>

              <div className={styles.formActions}>
                <button
                  className={styles.saveBtn}
                  onClick={handleCreatePolicy}
                >
                  Create Policy
                </button>
                <button
                  className={styles.cancelBtn}
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className={styles.policiesContainer}>
            {policies.length === 0 ? (
              <p className={styles.empty}>No policies yet. Create your first policy!</p>
            ) : (
              policies.map((policy) => (
                <div
                  key={policy.id}
                  className={`${styles.policyCard} ${selectedPolicy?.id === policy.id ? styles.selected : ''}`}
                  onClick={() => setSelectedPolicy(policy)}
                >
                  <div className={styles.policyHeader}>
                    <div>
                      <h4>{policy.policy_name}</h4>
                      <p className={styles.type}>{policy.policy_type}</p>
                    </div>
                    <span
                      className={`${styles.badge} ${policy.is_active ? styles.active : styles.inactive}`}
                    >
                      {policy.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {policy.description && (
                    <p className={styles.description}>{policy.description}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Policy Details */}
        <div className={styles.policyDetails}>
          {selectedPolicy ? (
            <>
              <div className={styles.detailsHeader}>
                <h2>{selectedPolicy.policy_name}</h2>
                <div className={styles.detailsActions}>
                  <button
                    className={styles.statusBtn}
                    onClick={() =>
                      handleTogglePolicyStatus(
                        selectedPolicy.id,
                        selectedPolicy.is_active
                      )
                    }
                  >
                    {selectedPolicy.is_active ? '⏸ Deactivate' : '▶ Activate'}
                  </button>
                  <button
                    className={styles.deleteBtn}
                    onClick={() => handleDeletePolicy(selectedPolicy.id)}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>

              <div className={styles.rulesSection}>
                <h3>Routing Rules</h3>
                <p className={styles.rulesInfo}>
                  Configure how emails are routed for each type
                </p>

                {selectedPolicy.rules && (
                  <div className={styles.rulesGrid}>
                    {Object.entries(selectedPolicy.rules).map(
                      ([emailType, rule]) => (
                        emailType !== 'department_overrides' &&
                        emailType !== 'custom_rules' && (
                          <div
                            key={emailType}
                            className={styles.ruleCard}
                          >
                            <h4>{emailType.replace(/_/g, ' ')}</h4>

                            <div className={styles.ruleControl}>
                              <label>Account Type:</label>
                              <select
                                value={rule.account_type || 'gmail'}
                                onChange={(e) => {
                                  const updated = {
                                    ...selectedPolicy,
                                    rules: {
                                      ...selectedPolicy.rules,
                                      [emailType]: {
                                        ...rule,
                                        account_type: e.target.value
                                      }
                                    }
                                  };
                                  setSelectedPolicy(updated);
                                }}
                                className={styles.select}
                              >
                                <option value="gmail">Gmail</option>
                                <option value="crm">CRM Email</option>
                                <option value="sendgrid">SendGrid</option>
                                <option value="aws_ses">AWS SES</option>
                              </select>
                            </div>

                            <div className={styles.ruleControl}>
                              <label>Priority:</label>
                              <select
                                value={rule.priority || 'any'}
                                onChange={(e) => {
                                  const updated = {
                                    ...selectedPolicy,
                                    rules: {
                                      ...selectedPolicy.rules,
                                      [emailType]: {
                                        ...rule,
                                        priority: e.target.value
                                      }
                                    }
                                  };
                                  setSelectedPolicy(updated);
                                }}
                                className={styles.select}
                              >
                                <option value="primary">Primary Account</option>
                                <option value="oauth_connected">
                                  OAuth Connected
                                </option>
                                <option value="any">Any Account</option>
                              </select>
                            </div>
                          </div>
                        )
                      )
                    )}
                  </div>
                )}

                <button
                  className={styles.updateBtn}
                  onClick={() => handleUpdateRules(selectedPolicy.id)}
                >
                  💾 Save Rules
                </button>
              </div>

              <div className={styles.metaInfo}>
                <h4>Policy Info</h4>
                <p>
                  <strong>Type:</strong> {selectedPolicy.policy_type}
                </p>
                <p>
                  <strong>Status:</strong>{' '}
                  {selectedPolicy.is_active ? '✅ Active' : '⏸ Inactive'}
                </p>
                <p>
                  <strong>Created:</strong>{' '}
                  {new Date(selectedPolicy.created_at).toLocaleDateString()}
                </p>
                <p>
                  <strong>Version:</strong> {selectedPolicy.version || 1}
                </p>
              </div>
            </>
          ) : (
            <div className={styles.emptyDetails}>
              <p>Select a policy to view and edit details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
