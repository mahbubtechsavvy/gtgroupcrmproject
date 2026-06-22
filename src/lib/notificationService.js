import { supabase } from './supabase';
import { sendSystemEmail } from './emailSending'; // Existing Resend wrapper

export async function sendNotification({ userId, officeId, type, title, body, data = {}, channels = ['in_app'] }) {
  try {
    // 1. Insert into Supabase notifications table
    const { data: dbNotification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        office_id: officeId,
        type,
        title,
        body,
        data,
        channels,
        sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Dispatch other channels asynchronously
    if (channels.includes('email')) {
      // Get user email
      const { data: userProfile } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userProfile?.email) {
        await sendSystemEmail({
          to: userProfile.email,
          subject: title,
          html: `<div style="font-family: sans-serif; padding: 20px; background: #080B14; color: #F0EDE6; border-radius: 8px;">
            <h2 style="color: #EFB748;">GT Group System Notification</h2>
            <p style="font-size: 16px;"><strong>${title}</strong></p>
            <p>${body}</p>
            <hr style="border-color: rgba(255,255,255,0.1);" />
            <p style="font-size: 12px; color: #9A9EA8;">This email was sent automatically by GT Group CRM. Please log in to view details.</p>
          </div>`
        }).catch(err => console.warn('Email dispatch failed:', err));
      }
    }

    if (channels.includes('sms')) {
      console.log(`[MOCK SMS] Sending to user ${userId}: ${title} - ${body}`);
    }

    if (channels.includes('whatsapp')) {
      console.log(`[MOCK WHATSAPP] Sending to user ${userId}: ${title} - ${body}`);
    }

    return dbNotification;

  } catch (err) {
    console.error('[NotificationService Error]', err);
    return null;
  }
}
