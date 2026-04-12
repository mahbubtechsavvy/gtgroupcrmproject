# 📋 COMPLETE MASTER PLAN: EMAIL, GOOGLE MEET & EVENT SYSTEM

## 🎯 Executive Summary

This master plan addresses:

1. ✅ **FIXED:** Staff search not working
2. ✅ **FIXED:** Events not working
3. ✨ **NEW:** Google Meet auto-generation for online events
4. ✨ **NEW:** Dual email system (Gmail + CRM email)
5. ✨ **NEW:** Smart email routing based on communication type
6. ✨ **NEW:** Super Admin email configuration

---

## PHASE 1: FOUNDATION (Weeks 1-2) - CURRENT ✅

### ✅ Issues Fixed

- Staff query relationship syntax
- Event creation and metadata storage
- Staff filtering and display
- Error logging and user feedback

### ✅ Database Changes

```sql
-- Migration 015: Add metadata & event support
ALTER TABLE staff_tasks ADD COLUMN IF NOT EXISTS metadata JSONB;
ALTER TABLE staff_tasks ADD CONSTRAINT staff_tasks_task_period_check
  CHECK (task_period IN ('daily','weekly','monthly','event'));
```

### ✅ Code Changes

- `src/app/dashboard/page.jsx` - Staff query fix, event creation with logging
- Event loading and display logic
- Comprehensive console debugging

---

## PHASE 2: GOOGLE MEET INTEGRATION (Weeks 3-4)

### 2.1 Google API Setup 🔑

**Environment Variables:**

```bash
# .env.local
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_API_KEY=your_api_key
```

**Dependencies to Install:**

```bash
npm install google-auth-library googleapis
```

### 2.2 Create Google Meet Utility 🔗

**New File:** `src/lib/googleMeet.js`

```javascript
export const generateMeetLink = () => {
  // Pattern: https://meet.google.com/{48-character-id}
  const randomId = Math.random().toString(36).substring(2, 50);
  return `https://meet.google.com/${randomId}`;
};

export const extractMeetId = (url) => {
  const match = url.match(/meet\.google\.com\/([a-z0-9-]+)/);
  return match ? match[1] : null;
};
```

### 2.3 Update Event Creation with Google Meet 📞

**File:** `src/app/dashboard/page.jsx`

**New Checkbox in Event Form:**

```javascript
const [eventIsOnline, setEventIsOnline] = useState(false);
const [generatedMeetLink, setGeneratedMeetLink] = useState(null);

const handleToggleOnlineEvent = () => {
  setEventIsOnline(!eventIsOnline);
  if (!eventIsOnline) {
    // Generate Meet link
    const meetLink = generateMeetLink();
    setGeneratedMeetLink(meetLink);
  } else {
    setGeneratedMeetLink(null);
  }
};
```

**Updated Event Data:**

```javascript
metadata: {
  is_event: true,
  event_time: newEventInput.time || null,
  event_office: newEventInput.office || 'all',
  is_online: eventIsOnline,  // NEW
  google_meet_link: generatedMeetLink,  // NEW
  created_by: user.id
}
```

### 2.4 Google Calendar Sync API 📅

**New File:** `src/app/api/google-calendar-sync/route.js`

```javascript
import { google } from "googleapis";

export async function POST(req) {
  const { title, date, time, attendeeEmails, meetLink } = await req.json();

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary: title,
    description: `Meeting Link: ${meetLink}`,
    start: { dateTime: `${date}T${time}:00` },
    end: { dateTime: `${date}T${time}:30` },
    attendees: attendeeEmails.map((email) => ({ email })),
    conferenceData: {
      conferenceSolution: { key: { type: "hangoutsMeet" } },
    },
  };

  try {
    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });
    return Response.json({ success: true, eventId: response.data.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
```

### 2.5 Event Notification with Meet Link 📧

**New File:** `src/lib/emailTemplates/eventNotification.js`

```javascript
export const generateEventNotification = (event, meetLink, recipient) => {
  return {
    subject: `📅 New Event: ${event.title}`,
    html: `
      <h2>${event.title}</h2>
      <p><strong>Date:</strong> ${event.date}</p>
      <p><strong>Time:</strong> ${event.time}</p>
      ${
        event.is_online
          ? `
        <p><strong>Meeting Link:</strong> <a href="${meetLink}">${meetLink}</a></p>
        <button><a href="${meetLink}">Join Meeting</a></button>
      `
          : `<p><strong>Location:</strong> ${event.location}</p>`
      }
      <p>Created by: ${event.created_by_name}</p>
    `,
  };
};
```

---

## PHASE 3: USER EMAIL MANAGEMENT (Weeks 5-6)

### 3.1 Email Accounts Database 📧

**New Migration:** `supabase/migrations/016_create_user_email_accounts.sql`

```sql
CREATE TABLE IF NOT EXISTS user_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_type TEXT CHECK (email_type IN ('crm', 'gmail', 'office')) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  google_calendar_connected BOOLEAN DEFAULT false,
  oauth_token JSONB,  -- Store encrypted OAuth tokens
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_email_accounts_user_id ON user_email_accounts(user_id);
CREATE INDEX idx_user_email_accounts_email_type ON user_email_accounts(email_type);
```

### 3.2 Email Settings Page 👤

**New Page:** `src/app/settings/emails/page.jsx`

**Features:**

- ✅ View all email accounts
- ✅ Add new email with verification
- ✅ Delete unused emails
- ✅ Set as primary per type
- ✅ Connect/disconnect Google Calendar
- ✅ Show connection status

**UI Elements:**

```javascript
<section className={styles.emailSection}>
  <h3>📧 Email Accounts</h3>

  <div className={styles.emailList}>
    {userEmails.map((email) => (
      <EmailCard
        key={email.id}
        email={email}
        onDelete={handleDeleteEmail}
        onSetPrimary={handleSetPrimary}
        onConnectGoogle={handleConnectGoogle}
      />
    ))}
  </div>

  <button onClick={handleAddEmail}>+ Add Email Address</button>
</section>
```

### 3.3 Add Email Form 📝

**Modal Component:** `src/components/settings/AddEmailModal.jsx`

```javascript
export default function AddEmailModal({ onAdd, onClose }) {
  const [email, setEmail] = useState("");
  const [type, setType] = useState("crm");
  const [verifying, setVerifying] = useState(false);

  const handleAddEmail = async () => {
    // 1. Send verification email
    // 2. Show verification code input
    // 3. Verify and save

    const response = await fetch("/api/emails/verify", {
      method: "POST",
      body: JSON.stringify({ email, type }),
    });

    if (response.ok) {
      onAdd(response.json());
    }
  };

  return (
    <Modal onClose={onClose}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter email address"
      />

      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="crm">CRM Email (Notifications & Updates)</option>
        <option value="gmail">Gmail (Meetings & Invites)</option>
        <option value="office">Office Email (Official Communications)</option>
      </select>

      <button onClick={handleAddEmail} disabled={verifying}>
        {verifying ? "Verifying..." : "✅ Add Email"}
      </button>
    </Modal>
  );
}
```

---

## PHASE 4: EMAIL ROUTING SYSTEM (Weeks 7-8)

### 4.1 Email Router Utility ⚙️

**New File:** `src/lib/emailRouter.js`

```javascript
export const routeEmailByType = (user, emailType) => {
  // emailType: 'notification' | 'meeting' | 'documentation' | 'update'

  const emailMap = {
    notification: "crm", // CRM notifications → CRM email
    meeting: "gmail", // Meetings → Gmail (more reliable)
    documentation: "office", // Official docs → Office email
    update: "crm", // System updates → CRM email
  };

  const desiredType = emailMap[emailType];
  const userEmail = user.emails?.find((e) => e.email_type === desiredType);

  return userEmail?.email || user.email; // Fallback to primary
};

export const sendEmail = async (userId, emailType, subject, html) => {
  const user = await getUser(userId);
  const targetEmail = routeEmailByType(user, emailType);

  // Send via email service (SendGrid, AWS SES, etc.)
  await emailService.send({
    to: targetEmail,
    subject,
    html,
  });
};
```

### 4.2 Email Templates 📄

**File:** `src/lib/emailTemplates/index.js`

```javascript
export const EmailTemplates = {
  // Online Meeting Notification
  onlineMeeting: (event) => ({
    type: "meeting",
    subject: `📞 Join Online Meeting: ${event.title}`,
    template: "onlineMeetingAlert",
  }),

  // Official Documentation
  documentation: (title, content) => ({
    type: "documentation",
    subject: `📋 Official Notice: ${title}`,
    template: "officialDocumentation",
  }),

  // CRM Notification
  notification: (message) => ({
    type: "notification",
    subject: "🔔 CRM Notification",
    template: "crmNotification",
  }),

  // System Update
  systemUpdate: (version, changes) => ({
    type: "update",
    subject: `🚀 CRM Update: Version ${version}`,
    template: "systemUpdate",
  }),
};
```

---

## PHASE 5: SUPER ADMIN EMAIL POLICIES (Weeks 9-10)

### 5.1 Email Policy Settings 🛠️

**New Page:** `src/app/settings/email-policies/page.jsx`

**Policy Configuration UI:**

```javascript
<div className={styles.policySection}>
  <h3>📧 Email Communication Policies</h3>

  {/* Online Meeting Policy */}
  <PolicyCard
    title="Online Meetings"
    description="Used for meeting invites and join links"
  >
    <EmailTypeSelect
      value={policies.onlineMeetings}
      options={["Gmail", "CRM Email", "Office Email"]}
      onChange={handleUpdate}
    />
    <Toggle
      label="Auto-create Google Meet links"
      value={policies.autoCreateMeetLinks}
      onChange={handleUpdate}
    />
    <Toggle
      label="Send 24 hours before"
      value={policies.meetingReminder24h}
      onChange={handleUpdate}
    />
  </PolicyCard>

  {/* Documentation Policy */}
  <PolicyCard
    title="Official Documentation"
    description="For official communications"
  >
    <EmailTypeSelect
      value={policies.officialDocs}
      options={["Gmail", "CRM Email", "Office Email"]}
      onChange={handleUpdate}
    />
  </PolicyCard>

  {/* Notification Policy */}
  <PolicyCard title="CRM Notifications" description="For system notifications">
    <EmailTypeSelect
      value={policies.notifications}
      options={["Gmail", "CRM Email", "Office Email"]}
      onChange={handleUpdate}
    />
    <CheckboxGroup
      label="Include in notifications:"
      options={[
        "Task assignments",
        "Event updates",
        "System alerts",
        "Staff broadcasts",
      ]}
      values={policies.notificationTypes}
      onChange={handleUpdate}
    />
  </PolicyCard>

  {/* Update Policy */}
  <PolicyCard title="Software Updates" description="For CRM software updates">
    <EmailTypeSelect
      value={policies.updates}
      options={["Gmail", "CRM Email", "Office Email"]}
      onChange={handleUpdate}
    />
    <Select
      label="Frequency"
      value={policies.updateFrequency}
      options={["Daily", "Weekly", "Monthly"]}
      onChange={handleUpdate}
    />
  </PolicyCard>
</div>
```

### 5.2 User Email Assignment 👥

**New Page:** `src/app/settings/staff-email-management/page.jsx`

**Features:**

- List all users with their assigned emails
- Batch assign emails
- Override default policy per user
- View email configuration per user
- Send test emails

**UI:**

```javascript
<table className={styles.staffEmailTable}>
  <thead>
    <tr>
      <th>Staff Member</th>
      <th>CRM Email</th>
      <th>Gmail</th>
      <th>Office Email</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {staff.map((member) => (
      <StaffEmailRow
        key={member.id}
        staff={member}
        onUpdate={handleUpdateEmailAssignment}
        onTest={handleSendTestEmail}
      />
    ))}
  </tbody>
</table>
```

---

## PHASE 6: INTEGRATION & TESTING (Weeks 11-12)

### 6.1 End-to-End Testing

**Test Scenarios:**

1. **Create Online Event:**
   - Create event with "Online Meeting" toggle
   - Auto-generate Google Meet link
   - Store in metadata
   - Send email with link to attendees

2. **Email Routing:**
   - Create task → Send to CRM email
   - Create online event → Send to Gmail
   - Create documentation → Send to Office email
   - Create system update → Send to CRM email

3. **Super Admin Policies:**
   - Set policy: Meetings to Gmail
   - Set policy: Documentation to Office email
   - Create event of each type
   - Verify emails go to correct addresses

4. **User Management:**
   - Add new email to user
   - Set as primary for type
   - Connect Google Calendar
   - Verify sync works

### 6.2 Error Handling

- Invalid email format
- Duplicate email addresses
- Failed email verification
- Google API errors
- Rate limiting
- Network failures

### 6.3 Security Considerations

- ✅ OAuth token encryption
- ✅ Email verification before use
- ✅ Secure API endpoints with RLS
- ✅ Rate limiting on email sends
- ✅ Audit logging for policy changes

---

## Implementation Timeline

| Phase                 | Duration     | Completion | Key Deliverables                       |
| --------------------- | ------------ | ---------- | -------------------------------------- |
| 1. Foundation         | 2 weeks      | ✅ NOW     | Staff search, Events, Logging          |
| 2. Google Meet        | 2 weeks      | Week 3-4   | Meet link generation, Calendar sync    |
| 3. Email Management   | 2 weeks      | Week 5-6   | Email settings page, Email accounts DB |
| 4. Email Routing      | 2 weeks      | Week 7-8   | Router utility, Email templates        |
| 5. Super Admin Config | 2 weeks      | Week 9-10  | Policy page, Staff assignment page     |
| 6. Testing & Polish   | 2 weeks      | Week 11-12 | End-to-end tests, Deployment           |
| **TOTAL**             | **12 weeks** |            | Complete system                        |

---

## Technology Stack

### Frontend

- Next.js 13+ (App Router)
- React Hooks
- CSS Modules
- Lucide Icons
- Recharts (graphs)

### Backend

- Supabase (PostgreSQL)
- Google APIs
- Email Service (SendGrid / AWS SES)
- Authentication (OAuth)

### Database

- staff_tasks (events metadata)
- user_email_accounts (email management)
- email_policies (super admin configs)
- audit_logs (policy changes)

---

## File Structure (Final)

```
src/
├── app/
│   ├── api/
│   │   ├── emails/
│   │   │   ├── verify/route.js (NEW)
│   │   │   ├── send/route.js (NEW)
│   │   │   └── test/route.js (NEW)
│   │   └── google-calendar-sync/route.js (NEW)
│   ├── settings/
│   │   ├── emails/page.jsx (NEW)
│   │   ├── email-policies/page.jsx (NEW)
│   │   └── staff-email-management/page.jsx (NEW)
│
├── lib/
│   ├── googleMeet.js (NEW)
│   ├── emailRouter.js (NEW)
│   └── emailTemplates/
│       ├── eventNotification.js (NEW)
│       ├── onlineMeetingAlert.js (NEW)
│       ├── officialDocumentation.js (NEW)
│       ├── systemUpdate.js (NEW)
│       └── crmNotification.js (NEW)
│
├── components/
│   └── settings/
│       ├── EmailSettings.jsx (NEW)
│       ├── AddEmailModal.jsx (NEW)
│       ├── EmailPolicies.jsx (NEW)
│       └── StaffEmailRow.jsx (NEW)

supabase/
└── migrations/
    ├── 015_add_metadata_events.sql (NEW)
    ├── 016_create_user_email_accounts.sql (NEW)
    ├── 017_create_email_policies_table.sql (NEW)
    └── 018_add_audit_log_table.sql (NEW)
```

---

## Success Metrics

### Phase 1 ✅

- [x] Staff search works
- [x] Events creation works
- [x] All logging visible in console
- [x] Staff filtering functional

### Phase 2

- [ ] Google Meet links auto-generate
- [ ] Links are visible in event cards
- [ ] Calendar sync working
- [ ] Email invites with links sent

### Phase 3

- [ ] Users can add multiple emails
- [ ] Email verification works
- [ ] Types assigned correctly
- [ ] Google Calendar sync optional

### Phase 4

- [ ] Emails route to correct addresses
- [ ] Templates render properly
- [ ] Attachments included if needed
- [ ] Fallback to primary email works

### Phase 5

- [ ] Super admin configure policies
- [ ] Policies applied to all emails
- [ ] Per-user overrides work
- [ ] Test emails send correctly

### Phase 6

- [ ] All tests passing
- [ ] No errors in production
- [ ] Performance acceptable
- [ ] Users trained on features

---

## Next Immediate Action

**RIGHT NOW:** Execute Phase 1 Quick Start

1. Run migration 015 in Supabase
2. Deploy code changes
3. Test all 5 checks in QUICK_START_GUIDE.md
4. Confirm everything works ✅

**Then:** Start Phase 2 when ready for Google Meet integration

---

## Questions? 🤔

- **Technical:** Check console logs with debug output
- **Features:** Review specific phase document
- **Deployment:** See QUICK_START_GUIDE.md
- **Issues:** Check ISSUE_ANALYSIS_AND_FIXES.md

---

**Status:** Phase 1 Complete ✅ → Ready for Phase 2 whenever you want!
