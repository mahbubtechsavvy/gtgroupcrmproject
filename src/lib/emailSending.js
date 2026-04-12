// Email Sending Service
// Handles email delivery through various providers
import { supabase } from './supabase';
import { sendGmailEmail } from '../app/api/gmail-send/client';
import { logEmailSending, updateEmailLogStatus } from './emailRouter';

/**
 * Send email through appropriate provider
 * @param {Object} emailData - Email to send
 * @param {string} emailData.toEmail - Recipient email
 * @param {string} emailData.subject - Subject line
 * @param {string} emailData.htmlContent - HTML body
 * @param {string} emailData.textContent - Plain text body
 * @param {string} emailData.emailType - Type ('event_invite', 'meeting_alert', etc)
 * @param {string} emailData.fromEmail - From address
 * @param {string} emailData.fromEmailAccountId - Email account to send from
 * @param {string} emailData.userId - User ID
 * @param {string} emailData.relatedType - Related entity type
 * @param {string} emailData.relatedId - Related entity ID
 * @returns {Promise<{success: boolean, messageId?: string, logId?: string, error?: string}>}
 */
export const sendEmail = async (emailData) => {
  try {
    const {
      toEmail,
      subject,
      htmlContent,
      textContent,
      emailType,
      fromEmail,
      fromEmailAccountId,
      userId,
      relatedType,
      relatedId,
    } = emailData;

    // Validate required fields
    if (!toEmail || !subject || !userId) {
      return {
        success: false,
        error: 'Missing required fields: toEmail, subject, userId',
      };
    }

    // Log email sending attempt
    const logResult = await logEmailSending({
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
      status: 'sending',
      emailService: 'pending',
    });

    if (!logResult.success) {
      console.error('Failed to log email:', logResult.error);
    }

    const logId = logResult.logId;

    try {
      // Option 1: Send via Gmail (if account connected)
      if (fromEmailAccountId) {
        return await sendViaGmail({
          to: toEmail,
          subject,
          html: htmlContent,
          text: textContent,
          emailAccountId: fromEmailAccountId,
          logId,
        });
      }

      // Option 2: Send via SendGrid (TODO: implement)
      return await sendViaSendGrid({
        to: toEmail,
        subject,
        html: htmlContent,
        text: textContent,
        from: fromEmail,
        logId,
      });

      // Option 3: Send via AWS SES (TODO: implement)
    } catch (error) {
      console.error('Error sending email:', error);

      // Update log with failure
      if (logId) {
        await updateEmailLogStatus(logId, 'failed', {
          error: error.message,
        });
      }

      return {
        success: false,
        logId,
        error: error.message,
      };
    }
  } catch (error) {
    console.error('Error in sendEmail:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send email via Gmail API
 * @private
 */
async function sendViaGmail({ to, subject, html, text, emailAccountId, logId }) {
  try {
    const result = await sendGmailEmail(
      {
        to,
        subject,
        html,
        text,
      },
      emailAccountId
    );

    if (result.success) {
      // Update log to sent
      if (logId) {
        await updateEmailLogStatus(logId, 'sent', {
          externalMessageId: result.messageId,
          provider: 'gmail',
        });
      }

      console.log('✅ Email sent via Gmail:', result.messageId);
      return {
        success: true,
        messageId: result.messageId,
        logId,
        provider: 'gmail',
      };
    } else {
      throw new Error(result.error);
    }
  } catch (error) {
    console.error('Gmail send error:', error);
    throw error;
  }
}

/**
 * Send email via SendGrid (TODO: implement with API)
 * @private
 */
async function sendViaSendGrid({ to, subject, html, text, from, logId }) {
  try {
    // TODO: Implement SendGrid integration
    // const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     personalizations: [{ to: [{ email: to }] }],
    //     from: { email: from },
    //     subject,
    //     content: [
    //       { type: 'text/html', value: html },
    //       { type: 'text/plain', value: text },
    //     ],
    //   }),
    // });

    console.warn(
      '[TODO] SendGrid integration not yet implemented. Using Gmail instead.'
    );
    return {
      success: false,
      error: 'SendGrid not yet implemented',
    };
  } catch (error) {
    console.error('SendGrid send error:', error);
    throw error;
  }
}

/**
 * Send email via AWS SES (TODO: implement)
 * @private
 */
async function sendViaAWSSES({ to, subject, html, text, from, logId }) {
  try {
    // TODO: Implement AWS SES integration
    console.warn('[TODO] AWS SES integration not yet implemented');
    return {
      success: false,
      error: 'AWS SES not yet implemented',
    };
  } catch (error) {
    console.error('AWS SES send error:', error);
    throw error;
  }
}

/**
 * Send bulk emails (for multiple recipients)
 * @param {Object} emailData - Email data (without toEmail)
 * @param {Array<string>} recipients - Email addresses
 * @returns {Promise<{success: boolean, sent: number, failed: number, results: Array}>}
 */
export const sendBulkEmail = async (emailData, recipients) => {
  try {
    const results = [];
    let sent = 0;
    let failed = 0;

    for (const toEmail of recipients) {
      try {
        const result = await sendEmail({
          ...emailData,
          toEmail,
        });

        if (result.success) {
          sent++;
          results.push({ email: toEmail, success: true });
        } else {
          failed++;
          results.push({ email: toEmail, success: false, error: result.error });
        }
      } catch (error) {
        failed++;
        results.push({ email: toEmail, success: false, error: error.message });
      }
    }

    console.log(`✅ Bulk send complete: ${sent}/${recipients.length} sent`);

    return {
      success: failed === 0,
      sent,
      failed,
      results,
    };
  } catch (error) {
    console.error('Error in sendBulkEmail:', error);
    return {
      success: false,
      sent: 0,
      failed: recipients.length,
      error: error.message,
      results: [],
    };
  }
};

/**
 * Schedule email to send later
 * @param {Object} emailData - Email data
 * @param {Date} sendAt - When to send
 * @returns {Promise<{success: boolean, scheduledId?: string, error?: string}>}
 */
export const scheduleEmail = async (emailData, sendAt) => {
  try {
    // TODO: Implement scheduled email system
    // Store in database with scheduled time
    // Use background job to send at scheduled time

    const scheduledTime = new Date(sendAt);
    const now = new Date();

    if (scheduledTime <= now) {
      return { success: false, error: 'Scheduled time must be in the future' };
    }

    console.log('[TODO] Email scheduling not yet implemented');
    return {
      success: false,
      error: 'Email scheduling coming in Phase 4',
    };
  } catch (error) {
    console.error('Error scheduling email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Resend email from log
 * @param {string} logId - Email log ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export const resendEmail = async (logId) => {
  try {
    // Get original email from log
    const { data: log, error: fetchError } = await supabase
      .from('email_logs')
      .select('*')
      .eq('id', logId)
      .single();

    if (fetchError || !log) {
      return { success: false, error: 'Email log not found' };
    }

    // Resend
    const result = await sendEmail({
      toEmail: log.to_email,
      subject: log.subject,
      htmlContent: log.html_content,
      textContent: log.text_content,
      emailType: log.email_type,
      fromEmail: log.from_email,
      fromEmailAccountId: log.from_email_account_id,
      userId: log.user_id,
      relatedType: log.related_type,
      relatedId: log.related_id,
    });

    return result;
  } catch (error) {
    console.error('Error resending email:', error);
    return { success: false, error: error.message };
  }
};
