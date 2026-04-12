/**
 * Google Meet Utilities
 * Generates unique Meet links and extracts IDs from URLs
 */

/**
 * Generate a unique Google Meet link
 * Format: https://meet.google.com/{unique-id}
 * The unique ID is a 42-48 character string
 * @returns {string} - Full Google Meet URL
 */
export const generateMeetLink = () => {
  // Google Meet IDs are typically 42-48 characters
  // Format: abc-defg-hij-klmn (4 segments separated by hyphens)
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const generateSegment = (length) => {
    return Array.from({ length }, () => alphabet[Math.floor(Math.random() * 26)]).join('');
  };

  // Generate format: xxx-xxxx-xxx-xxxx
  const segment1 = generateSegment(3);
  const segment2 = generateSegment(4);
  const segment3 = generateSegment(3);
  const segment4 = generateSegment(4);

  const meetId = `${segment1}-${segment2}-${segment3}-${segment4}`;
  return `https://meet.google.com/${meetId}`;
};

/**
 * Extract Meet ID from a Google Meet URL
 * @param {string} url - The Google Meet URL
 * @returns {string|null} - The extracted Meet ID or null if invalid
 */
export const extractMeetId = (url) => {
  if (!url) return null;
  
  const patterns = [
    /meet\.google\.com\/([a-z]{3}-[a-z]{4}-[a-z]{3}-[a-z]{4})/,
    /meet\.google\.com\/([a-z-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

/**
 * Validate Google Meet URL
 * @param {string} url - The URL to validate
 * @returns {boolean} - True if valid Google Meet URL
 */
export const isValidMeetUrl = (url) => {
  if (!url) return false;
  return /^https:\/\/meet\.google\.com\/([a-z-]{11,})$/.test(url);
};

/**
 * Create a shareable Google Meet link object
 * @param {string} title - Event title
 * @param {string} date - Event date (YYYY-MM-DD)
 * @param {string} time - Event time (HH:MM)
 * @returns {object} - Meet link object with link and metadata
 */
export const createMeetLink = (title, date, time) => {
  const link = generateMeetLink();
  const joinUrl = `${link}?authuser=0`;

  return {
    link,
    joinUrl,
    meetId: extractMeetId(link),
    generatedAt: new Date().toISOString(),
    metadata: {
      title,
      date,
      time,
      isActive: true,
    }
  };
};

/**
 * Format Meet link for easy sharing
 * @param {string} link - The Meet link
 * @param {string} title - Event title (optional)
 * @returns {string} - Formatted text for email/message
 */
export const formatMeetLinkForShare = (link, title = 'Meeting') => {
  return `Join ${title}: ${link}`;
};

/**
 * Generate Google Meet HTML embed
 * (Note: Google Meet doesn't support direct embedding in most contexts)
 * @param {string} meetId - The Meet ID
 * @returns {string} - HTML link
 */
export const generateMeetEmbed = (meetId) => {
  const link = `https://meet.google.com/${meetId}`;
  return `<a href="${link}" target="_blank" rel="noopener noreferrer">Join Meeting</a>`;
};

/**
 * Create meeting invitation object for email
 * @param {object} params - Parameters object
 * @returns {object} - Invitation object
 */
export const createMeetingInvite = ({
  title,
  date,
  time,
  meetLink,
  organizer,
  attendees = [],
  description = '',
}) => {
  const meetId = extractMeetId(meetLink);

  return {
    title,
    date,
    time,
    meetLink,
    meetId,
    organizer,
    attendees,
    description,
    subject: `Meeting Invite: ${title}`,
    body: `
You are invited to: ${title}

Date: ${date}
Time: ${time}
Link: ${meetLink}

${description ? `Description: ${description}` : ''}

Organized by: ${organizer}
    `.trim(),
    html: `
      <h2>${title}</h2>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Link:</strong> <a href="${meetLink}">${meetLink}</a></p>
      ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
      <p><a href="${meetLink}" style="background: #1f2937; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">Join Meeting</a></p>
      <p><small>Organized by: ${organizer}</small></p>
    `,
    createdAt: new Date().toISOString(),
  };
};

/**
 * Generate Google Calendar event object
 * @param {object} params - Event parameters
 * @returns {object} - Google Calendar event format
 */
export const generateCalendarEvent = ({
  title,
  date,
  time,
  duration = 30, // minutes
  meetLink,
  description = '',
  attendees = [],
  timezone = 'UTC',
}) => {
  // Parse date and time
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);

  const startDateTime = new Date(year, month - 1, day, hours, minutes);
  const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

  return {
    summary: title,
    description: `${description}\n\nMeeting Link: ${meetLink}`,
    start: {
      dateTime: startDateTime.toISOString(),
      timeZone: timezone,
    },
    end: {
      dateTime: endDateTime.toISOString(),
      timeZone: timezone,
    },
    attendees: attendees.map(email => ({
      email,
      responseStatus: 'needsAction',
    })),
    conferenceData: {
      conferenceSolution: {
        key: {
          type: 'hangoutsMeet',
        },
      },
      conferenceLinkUri: meetLink,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 15 }, // 15 minutes before
      ],
    },
  };
};

/**
 * Validate event data for meeting creation
 * @param {object} eventData - Event data to validate
 * @returns {object} - { valid: boolean, errors: array }
 */
export const validateMeetingEvent = (eventData) => {
  const errors = [];

  if (!eventData.title || !eventData.title.trim()) {
    errors.push('Event title is required');
  }

  if (!eventData.date) {
    errors.push('Event date is required');
  }

  if (!eventData.time) {
    errors.push('Event time is required');
  }

  // Validate date format (YYYY-MM-DD)
  if (eventData.date && !/^\d{4}-\d{2}-\d{2}$/.test(eventData.date)) {
    errors.push('Invalid date format. Use YYYY-MM-DD');
  }

  // Validate time format (HH:MM)
  if (eventData.time && !/^\d{2}:\d{2}$/.test(eventData.time)) {
    errors.push('Invalid time format. Use HH:MM');
  }

  // Check if date is in the future
  if (eventData.date) {
    const eventDate = new Date(eventData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eventDate < today) {
      errors.push('Event date must be in the future');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export default {
  generateMeetLink,
  extractMeetId,
  isValidMeetUrl,
  createMeetLink,
  formatMeetLinkForShare,
  generateMeetEmbed,
  createMeetingInvite,
  generateCalendarEvent,
  validateMeetingEvent,
};
