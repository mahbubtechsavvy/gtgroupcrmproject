// Email Router Utility
// Routes emails to appropriate account based on event type and policies (Phase 5)
import { supabase } from './supabase';
import { selectEmailAccountUsingPolicy } from './emailPolicies';

/**
 * Determine which email account to use for sending
 * Checks email policies first (Phase 5), then falls back to default routing
 * @param {Object} context - Routing context
 * @param {string} context.userId - User ID
 * @param {string} context.emailType - Type of email ('event_invite', 'meeting_alert', 'notification', 'reminder')
 * @param {boolean} context.isOnlineMeeting - Whether event is online meeting
 * @param {string} context.priority - Priority level ('high', 'normal', 'low')
 * @returns {Promise<{success: boolean, emailAccountId?: string, email?: string, accountType?: string, error?: string}>}
 */
export const selectEmailAccount = async (context) => {
  try {
    const { userId, emailType, isOnlineMeeting, priority } = context;

    // PHASE 5: Try to get account from email policy first
    const policyAccount = await selectEmailAccountUsingPolicy(context);
    if (policyAccount) {
      return {
        success: true,
        emailAccountId: policyAccount.id,
        email: policyAccount.email,
        accountType: policyAccount.account_type,
        source: 'policy'
      };
    }

    // Get all email accounts for user
    const { data: accounts, error: fetchError } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_verified', true)
      .order('is_primary', { ascending: false });

    if (fetchError || !accounts || accounts.length === 0) {
      return { success: false, error: 'No verified email accounts found' };
    }

    // Fallback: Determine routing based on email type and event type
    let selectedAccount = null;

    if (isOnlineMeeting || emailType === 'meeting_alert') {
      // For meetings: prefer Gmail (for calendar integration)
      selectedAccount = accounts.find((a) => a.account_type === 'gmail' && a.is_primary);
      if (!selectedAccount) {
        selectedAccount = accounts.find((a) => a.account_type === 'gmail');
      }
    }

    if (!selectedAccount && emailType === 'event_invite') {
      // For event invites: prefer Gmail (for calendar), then CRM
      selectedAccount = accounts.find((a) => a.account_type === 'gmail' && a.oauth_connected);
      if (!selectedAccount) {
        selectedAccount = accounts.find((a) => a.account_type === 'crm' && a.is_primary);
      }
    }

    if (!selectedAccount && emailType === 'notification') {
      // For notifications: prefer CRM email
      selectedAccount = accounts.find((a) => a.account_type === 'crm' && a.is_primary);
      if (!selectedAccount) {
        selectedAccount = accounts.find((a) => a.account_type === 'crm');
      }
    }

    if (!selectedAccount && emailType === 'reminder') {
      // For reminders: prefer CRM email
      selectedAccount = accounts.find((a) => a.account_type === 'crm' && a.is_primary);
      if (!selectedAccount) {
        selectedAccount = accounts.find((a) => a.account_type === 'crm');
      }
    }

    // Fallback to any primary or first available
    if (!selectedAccount) {
      selectedAccount = accounts.find((a) => a.is_primary) || accounts[0];
    }

    if (!selectedAccount) {
      return { success: false, error: 'No suitable email account found' };
    }

    console.log('✅ Selected email account:', {
      email: selectedAccount.email,
      type: selectedAccount.account_type,
      reason: `${emailType} - ${isOnlineMeeting ? 'online' : 'in-person'}`,
    });

    return {
      success: true,
      emailAccountId: selectedAccount.id,
      email: selectedAccount.email,
      accountType: selectedAccount.account_type,
      oauthConnected: selectedAccount.oauth_connected,
    };
  } catch (error) {
    console.error('Error selecting email account:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get email routing policy for user (Phase 5 - NOW ACTIVE)
 * Fetches policy from email_policies table
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>}
 */
export const getEmailRoutingPolicy = async (userId) => {
  try {
    // Get user's department
    const { data: userProfile } = await supabase
      .from('staff')
      .select('department')
      .eq('user_id', userId)
      .single();

    // Get all active policies
    const { data: policies } = await supabase
      .from('email_policies')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (!policies?.length) {
      // Fallback to default policy
      return {
        policy_name: 'Default Policy',
        rules: {
          event_invites: { account_type: 'gmail', priority: 'oauth_connected' },
          meeting_alerts: { account_type: 'gmail', priority: 'primary' },
          notifications: { account_type: 'crm', priority: 'primary' },
          reminders: { account_type: 'crm', priority: 'any' }
        }
      };
    }

    // Find first applicable policy
    for (const policy of policies) {
      const appliesToUser = !policy.applies_to_users?.length ||
        policy.applies_to_users.includes(userId);

      const appliesToDept = !policy.applies_to_departments?.length ||
        (userProfile?.department && policy.applies_to_departments.includes(userProfile.department));

      if (appliesToUser && appliesToDept) {
        return policy;
      }
    }

    // Fallback to first active policy
    return policies[0];
  } catch (error) {
    console.error('Error getting routing policy:', error);
    return null;
  }
};



/**
 * Log email sending attempt
 * @param {Object} emailData - Email details
 * @param {string} emailData.userId - User ID
 * @param {string} emailData.fromEmail - From address
 * @param {string} emailData.fromEmailAccountId - Email account ID
 * @param {string} emailData.toEmail - To address
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.emailType - Type of email
 * @param {string} emailData.htmlContent - HTML content
 * @param {string} emailData.textContent - Text content
 * @param {string} emailData.relatedType - Related entity type
 * @param {string} emailData.relatedId - Related entity ID
 * @param {string} emailData.status - Email status (default: 'pending')
 * @returns {Promise<{success: boolean, logId?: string, error?: string}>}
 */
export const logEmailSending = async (emailData) => {
  try {
    const {
      userId,
      fromEmail,
      fromEmailAccountId,
      toEmail,
      subject,
      emailType,
      htmlContent,
      textContent,
      relatedType,
      relatedId,
      status = 'pending',
      emailService = 'pending',
    } = emailData;

    const { data, error } = await supabase
      .from('email_logs')
      .insert({
        user_id: userId,
        from_email: fromEmail,
        from_email_account_id: fromEmailAccountId,
        to_email: toEmail,
        subject,
        email_type: emailType,
        html_content: htmlContent,
        text_content: textContent,
        related_type: relatedType,
        related_id: relatedId,
        status,
        email_service: emailService,
      })
      .select()
      .single();

    if (error) {
      console.error('Error logging email:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email logged:', data.id);
    return { success: true, logId: data.id };
  } catch (error) {
    console.error('Error logging email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update email log status
 * @param {string} logId - Email log ID
 * @param {string} status - New status ('sent', 'failed', etc)
 * @param {Object} metadata - Additional data
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const updateEmailLogStatus = async (logId, status, metadata = {}) => {
  try {
    const updateData = { status };

    if (status === 'sent') {
      updateData.sent_at = new Date().toISOString();
    } else if (status === 'failed') {
      updateData.failed_at = new Date().toISOString();
      if (metadata.error) {
        updateData.error_message = metadata.error;
      }
      if (metadata.code) {
        updateData.error_code = metadata.code;
      }
    }

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { error } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('id', logId);

    if (error) {
      console.error('Error updating email log:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email log updated:', logId, status);
    return { success: true };
  } catch (error) {
    console.error('Error updating email log:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get email log history for user
 * @param {string} userId - User ID
 * @param {Object} filters - Optional filters
 * @param {string} filters.emailType - Filter by email type
 * @param {string} filters.status - Filter by status
 * @param {number} filters.limit - Limit results (default: 50)
 * @returns {Promise<{success: boolean, logs?: Array, error?: string}>}
 */
export const getEmailLogs = async (userId, filters = {}) => {
  try {
    const { emailType, status, limit = 50 } = filters;

    let query = supabase
      .from('email_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (emailType) {
      query = query.eq('email_type', emailType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching email logs:', error);
      return { success: false, error: error.message };
    }

    return { success: true, logs: data || [] };
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Retry failed emails
 * @param {string} logId - Email log ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const retryFailedEmail = async (logId) => {
  try {
    const { data: log, error: fetchError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (fetchError || !log) {
      return { success: false, error: 'Email log not found' };
    }

    if (log.retry_count >= log.max_retries) {
      return {
        success: false,
        error: `Max retries (${log.max_retries}) exceeded`,
      };
    }

    // Update to retry
    const { error } = await supabase
      .from('email_logs')
      .update({
        status: 'pending',
        retry_count: log.retry_count + 1,
        next_retry_at: new Date(Date.now() + 5 * 60000).toISOString(), // 5 minutes
      })
      .eq('id', logId);

    if (error) {
      return { success: false, error: error.message };
    }

    console.log('✅ Email retry scheduled:', logId);
    return { success: true };
  } catch (error) {
    console.error('Error retrying email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get email statistics for dashboard
 * @param {string} userId - User ID
 * @param {number} daysBack - Days to look back (default: 30)
 * @returns {Promise<{success: boolean, stats?: Object, error?: string}>}
 */
export const getEmailStats = async (userId, daysBack = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const { data, error } = await supabase
      .from('email_logs')
      .select('status, email_type')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString());

    if (error) {
      return { success: false, error: error.message };
    }

    // Calculate statistics
    const stats = {
      total: data.length,
      sent: data.filter((e) => e.status === 'sent').length,
      failed: data.filter((e) => e.status === 'failed').length,
      pending: data.filter((e) => e.status === 'pending').length,
      byType: {},
      byStatus: {},
    };

    // Count by type
    for (const email of data) {
      stats.byType[email.email_type] = (stats.byType[email.email_type] || 0) + 1;
      stats.byStatus[email.status] = (stats.byStatus[email.status] || 0) + 1;
    }

    return { success: true, stats };
  } catch (error) {
    console.error('Error getting email stats:', error);
    return { success: false, error: error.message };
  }
};
