import { getSupabaseClient } from './supabase';

/**
 * Sends an email notification via Supabase Edge Function
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email content (HTML)
 */
export async function sendEmailNotification(to, subject, html) {
  const supabase = getSupabaseClient();
  
  // Check if notifications are enabled in app_settings
  const { data: settings } = await supabase.from('app_settings').select('notification_config').single();
  
  // Basic check: if it's a lead assignment and it's disabled, skip
  if (subject.includes('Lead Assigned') && settings?.notification_config?.email_lead_assignment === false) return;
  if (subject.includes('Pipeline') && settings?.notification_config?.email_pipeline_change === false) return;

  try {
    const { data, error } = await supabase.functions.invoke('send-notification', {
      body: { to, subject, html },
    });
    
    if (error) console.error('Error invoking notify function:', error);
    return { data, error };
  } catch (err) {
    console.error('Failed to send email:', err);
  }
}
