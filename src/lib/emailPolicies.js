/**
 * Email Policy Management Utility
 * Handles creation, retrieval, and enforcement of email routing policies
 * Phase 5 - April 9, 2026
 */

import { supabase } from './supabase';

/**
 * Create a new email policy
 */
export const createEmailPolicy = async (policyData, userId) => {
  try {
    // Validate Super Admin
    const { data: staffData } = await supabase
      .from('staff')
      .select('role')
      .eq('id', userId)
      .single();

    if (staffData?.role !== 'super_admin') {
      return { success: false, error: 'Only Super Admin can create policies' };
    }

    // Create policy
    const { data, error } = await supabase
      .from('email_policies')
      .insert({
        policy_name: policyData.policy_name,
        policy_type: policyData.policy_type || 'custom',
        rules: policyData.rules || {},
        description: policyData.description || '',
        applies_to_users: policyData.applies_to_users || [],
        applies_to_departments: policyData.applies_to_departments || [],
        created_by: userId,
        is_active: true
      })
      .select('id')
      .single();

    if (error) throw error;

    // Log to audit
    await supabase.from('email_policy_audit').insert({
      policy_id: data.id,
      user_id: userId,
      action: 'created',
      new_rules: policyData.rules,
      reason: 'Policy creation'
    });

    return { success: true, policyId: data.id };
  } catch (error) {
    console.error('Error creating policy:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all active policies
 */
export const getActivePolicies = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('email_policies')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching policies:', error);
    return [];
  }
};

/**
 * Get policy by ID
 */
export const getPolicyById = async (policyId) => {
  try {
    const { data, error } = await supabase
      .from('email_policies')
      .select('*')
      .eq('id', policyId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching policy:', error);
    return null;
  }
};

/**
 * Update policy rules
 */
export const updatePolicyRules = async (policyId, newRules, userId) => {
  try {
    // Get old rules for audit
    const policy = await getPolicyById(policyId);
    if (!policy) return { success: false, error: 'Policy not found' };

    // Update
    const { error } = await supabase
      .from('email_policies')
      .update({
        rules: newRules,
        updated_by: userId,
        version: (policy.version || 0) + 1
      })
      .eq('id', policyId);

    if (error) throw error;

    // Audit
    await supabase.from('email_policy_audit').insert({
      policy_id: policyId,
      user_id: userId,
      action: 'updated',
      old_rules: policy.rules,
      new_rules: newRules,
      reason: 'Policy rules updated'
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating policy:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get applicable policy for user and email type
 */
export const getApplicablePolicyForUser = async (userId, emailType) => {
  try {
    // Get user's department
    const { data: userProfile } = await supabase
      .from('staff')
      .select('department_id')
      .eq('id', userId)
      .single();

    // Get all active policies
    const policies = await getActivePolicies(userId);

    // Find first applicable policy
    for (const policy of policies) {
      const appliesToUser = !policy.applies_to_users?.length ||
        policy.applies_to_users.includes(userId);

      const appliesToDept = !policy.applies_to_departments?.length ||
        (userProfile?.department_id && policy.applies_to_departments.includes(userProfile.department_id));

      if (appliesToUser && appliesToDept) {
        return policy;
      }
    }

    // Fallback to default
    const defaultPolicy = policies.find(p => p.is_default);
    return defaultPolicy || null;
  } catch (error) {
    console.error('Error getting applicable policy:', error);
    return null;
  }
};

/**
 * Select email account using policy rules
 */
export const selectEmailAccountUsingPolicy = async (context) => {
  try {
    const { userId, emailType } = context;

    // Get applicable policy
    const policy = await getApplicablePolicyForUser(userId, emailType);
    if (!policy) return null;

    // Get user's email accounts
    const { data: accounts } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_verified', true)
      .order('is_primary', { ascending: false });

    if (!accounts?.length) return null;

    // Apply policy rules
    const rules = policy.rules[emailType] || {};
    let selectedAccount = null;

    if (rules.account_type === 'gmail') {
      selectedAccount = accounts.find(a => a.account_type === 'gmail' && a.oauth_connected) ||
                       accounts.find(a => a.account_type === 'gmail');
    } else if (rules.account_type === 'crm') {
      selectedAccount = accounts.find(a => a.account_type === 'crm');
    } else {
      selectedAccount = accounts.find(a => a.is_primary) || accounts[0];
    }

    return selectedAccount || null;
  } catch (error) {
    console.error('Error selecting email with policy:', error);
    return null;
  }
};

/**
 * Deactivate policy
 */
export const deactivatePolicy = async (policyId, userId) => {
  try {
    const policy = await getPolicyById(policyId);
    if (!policy) return { success: false, error: 'Policy not found' };

    const { error } = await supabase
      .from('email_policies')
      .update({ is_active: false, updated_by: userId })
      .eq('id', policyId);

    if (error) throw error;

    // Audit
    await supabase.from('email_policy_audit').insert({
      policy_id: policyId,
      user_id: userId,
      action: 'deactivated',
      old_rules: policy.rules,
      reason: 'Policy deactivated'
    });

    return { success: true };
  } catch (error) {
    console.error('Error deactivating policy:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get policy audit log
 */
export const getPolicyAuditLog = async (policyId) => {
  try {
    const { data, error } = await supabase
      .from('email_policy_audit')
      .select('*')
      .eq('policy_id', policyId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching audit log:', error);
    return [];
  }
};

/**
 * Create policy from template
 */
export const createPolicyFromTemplate = async (templateType, userId) => {
  const templates = {
    default: {
      policy_name: 'Default - Primary Email',
      policy_type: 'default',
      rules: {
        event_invites: { account_type: 'primary' },
        meeting_alerts: { account_type: 'primary' },
        notifications: { account_type: 'primary' },
        reminders: { account_type: 'primary' }
      },
      description: 'Default policy: Use primary email for all communications',
      is_default: true
    },
    gmail_first: {
      policy_name: 'Gmail Priority - Meetings',
      policy_type: 'custom',
      rules: {
        event_invites: { account_type: 'gmail' },
        meeting_alerts: { account_type: 'gmail' },
        notifications: { account_type: 'crm' },
        reminders: { account_type: 'crm' }
      },
      description: 'Priority policy: Gmail for emails and meetings, CRM for notifications'
    },
    strict: {
      policy_name: 'Strict - Primary Only',
      policy_type: 'custom',
      rules: {
        event_invites: { account_type: 'primary' },
        meeting_alerts: { account_type: 'primary' },
        notifications: { account_type: 'primary' },
        reminders: { account_type: 'primary' }
      },
      description: 'Strict policy: Use only primary account'
    }
  };

  const template = templates[templateType] || templates.default;
  return createEmailPolicy(template, userId);
};

/**
 * Validate policy rules
 */
export const validatePolicyRules = (rules) => {
  const errors = [];
  const validAccountTypes = ['gmail', 'crm', 'primary', 'custom'];

  for (const [key, value] of Object.entries(rules)) {
    if (!value.account_type || !validAccountTypes.includes(value.account_type)) {
      errors.push(`Invalid account_type for ${key}`);
    }
  }

  return errors;
};
