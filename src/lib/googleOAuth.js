// Google OAuth & Calendar Integration
// Handles OAuth flow and Google Calendar API interactions

/**
 * Initialize Google OAuth flow
 * Stores state for security verification
 * @param {string} emailAccountId - Email account UUID
 * @returns {string} URL to redirect to for Google authorization
 */
export const initiateGoogleOAuth = (emailAccountId) => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${window.location.origin}/api/google-oauth-callback`;
  const scope = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/gmail.send',
  ].join(' ');

  // Store state and emailAccountId in sessionStorage for verification
  const state = generateRandomState();
  sessionStorage.setItem('oauth_state', state);
  sessionStorage.setItem('oauth_email_account_id', emailAccountId);

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    access_type: 'offline',
    prompt: 'consent', // Force consent to get refresh token
    state: state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Handle OAuth callback from Google
 * Exchanges authorization code for tokens
 * @param {string} code - Authorization code from Google
 * @param {string} state - State parameter for verification
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export const handleGoogleOAuthCallback = async (code, state) => {
  try {
    // Verify state
    const savedState = sessionStorage.getItem('oauth_state');
    if (state !== savedState) {
      return { success: false, error: 'State verification failed - possible CSRF attack' };
    }

    const emailAccountId = sessionStorage.getItem('oauth_email_account_id');
    if (!emailAccountId) {
      return { success: false, error: 'Email account ID not found in session' };
    }

    // Exchange code for tokens
    const response = await fetch('/api/google-oauth-exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        emailAccountId,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'OAuth exchange failed' };
    }

    // Clear session storage
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_email_account_id');

    console.log('✅ Google OAuth connected:', data.email);
    return { success: true, data };
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Create an event in Google Calendar
 * @param {Object} eventData - Event details
 * @param {string} eventData.title - Event title
 * @param {string} eventData.date - Event date (YYYY-MM-DD)
 * @param {string} eventData.time - Start time (HH:MM)
 * @param {string} eventData.duration - Duration in minutes
 * @param {string} eventData.googleMeetLink - Google Meet link (optional)
 * @param {string} emailAccountId - Email account UUID with OAuth
 * @returns {Promise<{success: boolean, calendarEventId?: string, error?: string}>}
 */
export const createGoogleCalendarEvent = async (eventData, emailAccountId) => {
  try {
    // Get OAuth tokens for this email account
    const response = await fetch('/api/google-calendar-create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailAccountId,
        eventData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Calendar event creation failed' };
    }

    console.log('✅ Google Calendar event created:', data.calendarEventId);
    return { success: true, calendarEventId: data.calendarEventId };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email via Gmail
 * @param {Object} emailData - Email details
 * @param {string} emailData.to - Recipient email
 * @param {string} emailData.subject - Email subject
 * @param {string} emailData.html - HTML content
 * @param {string} emailData.text - Plain text content
 * @param {string} emailAccountId - Email account UUID with Gmail OAuth
 * @returns {Promise<{success: boolean, messageId?: string, error?: string}>}
 */
export const sendGmailEmail = async (emailData, emailAccountId) => {
  try {
    const response = await fetch('/api/gmail-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailAccountId,
        emailData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Email sending failed' };
    }

    console.log('✅ Gmail sent:', data.messageId);
    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Generate random state for OAuth
 * @returns {string} Random state string
 */
function generateRandomState() {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Refresh Google OAuth token if expired
 * @param {string} emailAccountId - Email account UUID
 * @returns {Promise<{success: boolean, newToken?: string, error?: string}>}
 */
export const refreshGoogleToken = async (emailAccountId) => {
  try {
    const response = await fetch('/api/google-refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailAccountId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Token refresh failed' };
    }

    return { success: true, newToken: data.access_token };
  } catch (error) {
    console.error('Error refreshing token:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get list of calendars from Google
 * @param {string} emailAccountId - Email account UUID with OAuth
 * @returns {Promise<{success: boolean, calendars?: Array, error?: string}>}
 */
export const getGoogleCalendars = async (emailAccountId) => {
  try {
    const response = await fetch('/api/google-calendars-list', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailAccountId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch calendars' };
    }

    return { success: true, calendars: data.items };
  } catch (error) {
    console.error('Error fetching calendars:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Validate OAuth token is still valid
 * @param {string} emailAccountId - Email account UUID
 * @returns {Promise<{valid: boolean}>}
 */
export const validateGoogleOAuthToken = async (emailAccountId) => {
  try {
    const response = await fetch('/api/google-validate-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailAccountId }),
    });

    const data = await response.json();
    return { valid: data.valid };
  } catch (error) {
    console.error('Error validating token:', error);
    return { valid: false };
  }
};

/**
 * ============================================
 * EMAIL ACCOUNT MANAGEMENT FUNCTIONS
 * ============================================
 */

/**
 * Initiate Gmail OAuth for email account management
 * First step of the dual-email system setup
 * @param {string} userId - User ID who is adding the email
 * @returns {string} URL to redirect to Google OAuth
 */
export const initiateGmailOAuthForEmailAccount = (userId) => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/auth/google-callback`;

  const scope = [
    'openid',
    'email',
    'profile',
    'https://www.googleapis.com/auth/gmail.send',
  ].join(' ');

  // Create state with userId
  const state = Buffer.from(
    JSON.stringify({
      userId,
      purpose: 'email_account',
      timestamp: Date.now(),
    })
  ).toString('base64');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scope,
    access_type: 'offline',
    prompt: 'consent',
    state: state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Add Gmail account to a user
 * Called after OAuth completes
 * @param {string} userId - User ID
 * @param {string} email - Gmail email address
 * @param {string} oauthToken - Access token
 * @param {string} oauthRefreshToken - Refresh token
 * @param {number} expiresIn - Token expiration in seconds
 * @returns {Promise<{success: boolean, accountId?: string, error?: string}>}
 */
export const addGmailAccount = async (
  userId,
  email,
  oauthToken,
  oauthRefreshToken,
  expiresIn
) => {
  try {
    const response = await fetch('/api/admin/users/emails/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email,
        emailType: 'gmail',
        oauthToken,
        oauthRefreshToken,
        oauthExpiresAt: new Date(Date.now() + expiresIn * 1000),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to add Gmail account' };
    }

    console.log('✅ Gmail account added:', email);
    return { success: true, accountId: data.accountId };
  } catch (error) {
    console.error('Error adding Gmail account:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Remove Gmail account from user
 * @param {string} userId - User ID
 * @param {string} accountId - Email account ID to remove
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const removeGmailAccount = async (userId, accountId) => {
  try {
    const response = await fetch(`/api/admin/users/emails/${accountId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to remove Gmail account' };
    }

    console.log('✅ Gmail account removed');
    return { success: true };
  } catch (error) {
    console.error('Error removing Gmail account:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Add CRM Email account to a user
 * CRM Email is system-managed email (e.g., firstname@gtgroup.com)
 * @param {string} userId - User ID
 * @param {string} email - CRM email address
 * @returns {Promise<{success: boolean, accountId?: string, error?: string}>}
 */
export const addCrmEmail = async (userId, email) => {
  try {
    const response = await fetch('/api/admin/users/emails/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        email,
        emailType: 'crm',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to add CRM email' };
    }

    console.log('✅ CRM email added:', email);
    return { success: true, accountId: data.accountId };
  } catch (error) {
    console.error('Error adding CRM email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Set primary email account
 * @param {string} userId - User ID
 * @param {string} accountId - Email account ID to set as primary
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const setPrimaryEmailAccount = async (userId, accountId) => {
  try {
    const response = await fetch(`/api/admin/users/emails/${accountId}/primary`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to set primary email' };
    }

    console.log('✅ Primary email updated');
    return { success: true };
  } catch (error) {
    console.error('Error setting primary email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all email accounts for a user
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean, accounts?: Array, error?: string}>}
 */
export const getUserEmailAccounts = async (userId) => {
  try {
    const response = await fetch(`/api/admin/users/${userId}/emails`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to fetch email accounts' };
    }

    return { success: true, accounts: data.accounts };
  } catch (error) {
    console.error('Error fetching email accounts:', error);
    return { success: false, error: error.message };
  }
};
