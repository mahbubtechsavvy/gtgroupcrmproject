// API Route: Send Event Emails
// POST /api/send-event-emails
// Triggered when event is created/updated to send emails to attendees

import { supabase } from '@/lib/supabase-server';
import {
  selectEmailAccount,
  logEmailSending,
  updateEmailLogStatus,
} from '@/lib/emailRouter';
import { generateEventNotificationEmail } from '@/lib/emailTemplates/eventNotification';
import { generateOnlineMeetingAlertEmail } from '@/lib/emailTemplates/onlineMeetingAlert';

export async function POST(request) {
  try {
    const {
      eventId,
      eventData,
      recipientEmails,
      createdBy,
      userId,
    } = await request.json();

    if (!eventId || !eventData || !recipientEmails || !userId) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('📧 Sending event emails for:', eventData.title);

    // Get sending email account
    const emailAccountResult = await selectEmailAccount({
      userId,
      emailType: eventData.metadata?.is_online ? 'meeting_alert' : 'event_invite',
      isOnlineMeeting: eventData.metadata?.is_online || false,
      priority: 'normal',
    });

    if (!emailAccountResult.success) {
      return Response.json(
        { error: 'No verified email account found' },
        { status: 400 }
      );
    }

    const {
      emailAccountId,
      email: fromEmail,
      oauthConnected,
    } = emailAccountResult;

    // Select appropriate email template
    let emailTemplate;
    if (eventData.metadata?.is_online) {
      // Online event - use meeting alert template
      emailTemplate = (recipient) =>
        generateOnlineMeetingAlertEmail(eventData, recipient);
    } else {
      // In-person event - use standard notification template
      emailTemplate = (recipient) =>
        generateEventNotificationEmail(eventData, recipient);
    }

    // Send emails to all recipients
    const results = {
      success: 0,
      failed: 0,
      details: [],
    };

    for (const recipientEmail of recipientEmails) {
      try {
        // Generate email content
        const emailContent = emailTemplate(recipientEmail);

        // Log email
        const logResult = await logEmailSending({
          userId,
          fromEmail,
          fromEmailAccountId: emailAccountId,
          toEmail: recipientEmail,
          subject: emailContent.subject,
          emailType: eventData.metadata?.is_online ? 'meeting_alert' : 'event_invite',
          htmlContent: emailContent.html,
          textContent: emailContent.text,
          relatedType: 'event',
          relatedId: eventId,
          status: 'pending',
        });

        if (!logResult.success) {
          results.failed++;
          results.details.push({
            email: recipientEmail,
            success: false,
            error: 'Failed to log email',
          });
          continue;
        }

        // Send via Gmail if connected
        if (oauthConnected) {
          const sendResult = await sendViaGmail({
            toEmail: recipientEmail,
            subject: emailContent.subject,
            htmlContent: emailContent.html,
            textContent: emailContent.text,
            emailAccountId,
            logId: logResult.logId,
          });

          if (sendResult.success) {
            results.success++;
            results.details.push({
              email: recipientEmail,
              success: true,
              messageId: sendResult.messageId,
            });
          } else {
            results.failed++;
            results.details.push({
              email: recipientEmail,
              success: false,
              error: sendResult.error,
            });
          }
        } else {
          // Account not OAuth connected - just log as pending
          results.success++;
          results.details.push({
            email: recipientEmail,
            success: true,
            status: 'logged_pending_send',
          });
        }
      } catch (error) {
        console.error(`Error sending to ${recipientEmail}:`, error);
        results.failed++;
        results.details.push({
          email: recipientEmail,
          success: false,
          error: error.message,
        });
      }
    }

    // Update event to mark emails sent
    if (results.success > 0) {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          email_invite_sent: true,
          email_sent_at: new Date().toISOString(),
          email_sent_to_count: results.success,
        })
        .eq('id', eventId);

      if (updateError) {
        console.error('Error updating event email status:', updateError);
      }
    }

    console.log('✅ Event emails sent:', {
      event: eventData.title,
      success: results.success,
      failed: results.failed,
    });

    return Response.json({
      success: results.failed === 0,
      sent: results.success,
      failed: results.failed,
      details: results.details,
    });
  } catch (error) {
    console.error('Event email error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Send email via Gmail
 * @private
 */
async function sendViaGmail({
  toEmail,
  subject,
  htmlContent,
  textContent,
  emailAccountId,
  logId,
}) {
  try {
    const response = await fetch('/api/gmail-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailAccountId,
        emailData: {
          to: toEmail,
          subject,
          html: htmlContent,
          text: textContent,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error };
    }

    // Update log to sent
    if (logId) {
      const { updateEmailLogStatus } = await import('@/lib/emailRouter');
      await updateEmailLogStatus(logId, 'sent', {
        externalMessageId: data.messageId,
      });
    }

    return { success: true, messageId: data.messageId };
  } catch (error) {
    console.error('Gmail send error:', error);
    return { success: false, error: error.message };
  }
}
