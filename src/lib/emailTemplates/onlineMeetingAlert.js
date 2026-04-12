/**
 * Online Meeting Alert Email Template
 * Sent when an online event with Google Meet link is created
 */

export const generateOnlineMeetingAlertEmail = (event, recipient) => {
  const { title, date, time, office, createdByName, meetLink } = event;

  return {
    subject: `📞 Join Online Meeting: ${title}`,
    
    text: `
Online Meeting: ${title}
Date: ${date}
Time: ${time || 'TBD'}
Office: ${office || 'All Offices'}
Meet Link: ${meetLink}
Created by: ${createdByName}

Click the link above to join the meeting.
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 24px;">📞 ${title}</h2>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">Online Meeting</p>
        </div>
        
        <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="margin-bottom: 24px; text-align: center;">
            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">Meeting Details</p>
          </div>

          <div style="background: #f0fdf4; padding: 16px; border-radius: 6px; margin-bottom: 24px; border: 2px solid #dcfce7;">
            <div style="display: flex; margin-bottom: 12px;">
              <span style="width: 100px; color: #059669; font-weight: 600;">📅 Date:</span>
              <span style="color: #374151; flex: 1;">${date}</span>
            </div>
            ${time ? `
            <div style="display: flex; margin-bottom: 12px;">
              <span style="width: 100px; color: #059669; font-weight: 600;">🕐 Time:</span>
              <span style="color: #374151; flex: 1;">${time}</span>
            </div>
            ` : ''}
            <div style="display: flex; margin-bottom: 12px;">
              <span style="width: 100px; color: #059669; font-weight: 600;">🏢 Office:</span>
              <span style="color: #374151; flex: 1;">${office || 'All Offices'}</span>
            </div>
            <div style="display: flex;">
              <span style="width: 100px; color: #059669; font-weight: 600;">👤 By:</span>
              <span style="color: #374151; flex: 1;">${createdByName}</span>
            </div>
          </div>

          {/* Google Meet Link Section */}
          <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin-bottom: 24px; border-left: 4px solid #10B981;">
            <p style="margin: 0 0 12px 0; color: #374151; font-weight: 600; font-size: 14px;">🔗 Google Meet Link</p>
            <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 12px;">Click the button below to join the meeting:</p>
            <code style="display: block; background: white; padding: 12px; border-radius: 4px; margin-bottom: 12px; font-size: 12px; color: #10B981; word-break: break-all; line-height: 1.5;">${meetLink}</code>
          </div>

          <div style="text-align: center; padding: 20px 0;">
            <a href="${meetLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; transition: transform 0.2s, box-shadow 0.2s; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.25);">
              📞 Join Meeting Now
            </a>
          </div>

          <div style="background: #fff3cd; padding: 12px; border-radius: 6px; margin-top: 24px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #664d03; font-size: 12px;">
              ⏰ <strong>Tip:</strong> Join a few minutes early to test your audio and video.
            </p>
          </div>

          <p style="margin: 24px 0 0 0; color: #6b7280; font-size: 12px; text-align: center;">
            This is an automated notification from GT CRM. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };
};

export default generateOnlineMeetingAlertEmail;
