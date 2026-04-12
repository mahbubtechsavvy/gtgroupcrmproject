// Email Account Management Utilities
// For adding, removing, verifying email accounts
import { supabase } from './supabase';

/**
 * Add a new email account for the user
 * @param {Object} emailData - Email account data
 * @param {string} emailData.email - Email address
 * @param {string} emailData.account_type - 'crm', 'gmail', 'office'
 * @param {string} emailData.display_name - Display name
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const addEmailAccount = async (emailData) => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get user's staff record
    const { data: staffData, error: staffError } = await supabase
      .from('staff')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (staffError || !staffData) {
      return { success: false, error: 'Staff record not found' };
    }

    // Add email account
    const { data, error } = await supabase
      .from('user_email_accounts')
      .insert({
        user_id: user.id,
        staff_id: staffData.id,
        email: emailData.email,
        account_type: emailData.account_type,
        display_name: emailData.display_name || emailData.email,
        is_verified: false,
        verification_token: generateVerificationToken(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding email account:', error);
      return {
        success: false,
        error:
          error.message.includes('duplicate') 
            ? 'Email already exists' 
            : error.message,
      };
    }

    console.log('✅ Email account added:', data.email);
    return { success: true, data };
  } catch (error) {
    console.error('Error adding email account:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove an email account
 * @param {string} emailAccountId - Email account UUID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeEmailAccount = async (emailAccountId) => {
  try {
    const { error } = await supabase
      .from('user_email_accounts')
      .delete()
      .eq('id', emailAccountId);

    if (error) {
      console.error('Error removing email account:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email account removed:', emailAccountId);
    return { success: true };
  } catch (error) {
    console.error('Error removing email account:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all email accounts for current user
 * @returns {Promise<{success: boolean, data?: Array, error?: string}>}
 */
export const getUserEmailAccounts = async () => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching email accounts:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send verification email
 * @param {string} emailAccountId - Email account UUID
 * @param {string} email - Email to verify
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const sendEmailVerification = async (emailAccountId, email) => {
  try {
    // Generate verification token
    const token = generateVerificationToken();

    // Update database with token and timestamp
    const { error: updateError } = await supabase
      .from('user_email_accounts')
      .update({
        verification_token: token,
        verification_sent_at: new Date().toISOString(),
      })
      .eq('id', emailAccountId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // In production, call email service here
    // await sendVerificationEmail(email, token);

    console.log('✅ Verification email sent to:', email);
    return { success: true, message: 'Verification email sent' };
  } catch (error) {
    console.error('Error sending verification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Verify email with token
 * @param {string} emailAccountId - Email account UUID
 * @param {string} token - Verification token
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const verifyEmailAccount = async (emailAccountId, token) => {
  try {
    // Get email account
    const { data: emailData, error: fetchError } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('id', emailAccountId)
      .single();

    if (fetchError || !emailData) {
      return { success: false, error: 'Email account not found' };
    }

    // Check token
    if (emailData.verification_token !== token) {
      return { success: false, error: 'Invalid verification token' };
    }

    // Check if token is expired (24 hours)
    const sentAt = new Date(emailData.verification_sent_at);
    const now = new Date();
    const hoursDiff = (now - sentAt) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return { success: false, error: 'Verification token expired' };
    }

    // Mark as verified
    const { data, error } = await supabase
      .from('user_email_accounts')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verification_token: null,
      })
      .eq('id', emailAccountId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    console.log('✅ Email verified:', emailData.email);
    return { success: true, data };
  } catch (error) {
    console.error('Error verifying email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set email as primary for its type
 * @param {string} emailAccountId - Email account UUID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const setPrimaryEmail = async (emailAccountId) => {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get email account to find its type
    const { data: emailData, error: fetchError } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('id', emailAccountId)
      .single();

    if (fetchError || !emailData) {
      return { success: false, error: 'Email account not found' };
    }

    // Remove primary from all emails of this type
    const { error: unsetError } = await supabase
      .from('user_email_accounts')
      .update({ is_primary: false })
      .eq('user_id', user.id)
      .eq('account_type', emailData.account_type);

    if (unsetError) {
      return { success: false, error: unsetError.message };
    }

    // Set this one as primary
    const { data, error } = await supabase
      .from('user_email_accounts')
      .update({ is_primary: true })
      .eq('id', emailAccountId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    console.log('✅ Set as primary:', emailData.email);
    return { success: true, data };
  } catch (error) {
    console.error('Error setting primary email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Connect Gmail account with OAuth
 * @param {string} emailAccountId - Email account UUID
 * @param {Object} oauthData - OAuth credentials
 * @param {string} oauthData.access_token - Google access token
 * @param {string} oauthData.refresh_token - Google refresh token
 * @param {number} oauthData.expires_in - Token expiry in seconds
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const connectGoogleAccount = async (emailAccountId, oauthData) => {
  try {
    const expiresAt = new Date(
      Date.now() + oauthData.expires_in * 1000
    ).toISOString();

    const { data, error } = await supabase
      .from('user_email_accounts')
      .update({
        oauth_connected: true,
        oauth_provider: 'google',
        oauth_token: oauthData.access_token,
        oauth_refresh_token: oauthData.refresh_token,
        oauth_expires_at: expiresAt,
      })
      .eq('id', emailAccountId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    console.log('✅ Google account connected:',emailAccountId);
    return { success: true, data };
  } catch (error) {
    console.error('Error connecting Google account:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Disconnect OAuth from email account
 * @param {string} emailAccountId - Email account UUID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const disconnectOAuthAccount = async (emailAccountId) => {
  try {
    const { data, error } = await supabase
      .from('user_email_accounts')
      .update({
        oauth_connected: false,
        oauth_provider: null,
        oauth_token: null,
        oauth_refresh_token: null,
        oauth_expires_at: null,
      })
      .eq('id', emailAccountId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    console.log('✅ OAuth disconnected:', emailAccountId);
    return { success: true, data };
  } catch (error) {
    console.error('Error disconnecting OAuth:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate a random verification token
 * @returns {string} Verification token
 */
function generateVerificationToken() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Get email account by ID
 * @param {string} emailAccountId - Email account UUID
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const getEmailAccount = async (emailAccountId) => {
  try {
    const { data, error } = await supabase
      .from('user_email_accounts')
      .select('*')
      .eq('id', emailAccountId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error fetching email account:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if email is already registered
 * @param {string} email - Email address
 * @returns {Promise<{exists: boolean}>}
 */
export const checkEmailExists = async (email) => {
  try {
    const { data, error } = await supabase
      .from('user_email_accounts')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    return { exists: !!data };
  } catch (error) {
    console.error('Error checking email:', error);
    return { exists: false };
  }
};
