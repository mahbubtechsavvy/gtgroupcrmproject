/**
 * Event Notification Email Template
 * Sent when an event is created or updated
 */

export const generateEventNotificationEmail = (event, recipient) => {
  const { title, date, time, office, createdByName } = event;

  return {
    subject: `📅 New Event: ${title}`,
    
    text: `
Event: ${title}
Date: ${date}
Time: ${time || 'TBD'}
Office: ${office || 'All Offices'}
Created by: ${createdByName}

Check your calendar for more details.
    `.trim(),

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 20px; border-radius: 8px;">
        <div style="background: linear-gradient(135deg, #C9A227 0%, #D4AF37 100%); padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h2 style="color: white; margin: 0; font-size: 24px;">📅 ${title}</h2>
        </div>
        
        <div style="background: white; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="margin-bottom: 20px;">
            <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px;">
              <strong>Event Details:</strong>
            </p>
          </div>

          <div style="background: #f3f4f6; padding: 16px; border-radius: 6px; margin-bottom: 20px;">
            <div style="display: flex; margin-bottom: 12px;">
              <span style="width: 100px; color: #6b7280; font-weight: 600;">📅 Date:</span>
              <span style="color: #374151; flex: 1;">${date}</span>
            </div>
            ${time ? `
            <div style="display: flex; margin-bottom: 12px;">
              <span style="width: 100px; color: #6b7280; font-weight: 600;">🕐 Time:</span>
              <span style="color: #374151; flex: 1;">${time}</span>
            </div>
            ` : ''}
            <div style="display: flex; margin-bottom: 12px;">
              <span style="width: 100px; color: #6b7280; font-weight: 600;">🏢 Office:</span>
              <span style="color: #374151; flex: 1;">${office || 'All Offices'}</span>
            </div>
            <div style="display: flex;">
              <span style="width: 100px; color: #6b7280; font-weight: 600;">👤 By:</span>
              <span style="color: #374151; flex: 1;">${createdByName}</span>
            </div>
          </div>

          <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
            <a href="#" style="display: inline-block; padding: 12px 24px; background: #C9A227; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; transition: background 0.3s;">
              View in Calendar
            </a>
          </div>

          <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 12px; text-align: center;">
            This is an automated notification from GT CRM. Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };
};

export default generateEventNotificationEmail;
