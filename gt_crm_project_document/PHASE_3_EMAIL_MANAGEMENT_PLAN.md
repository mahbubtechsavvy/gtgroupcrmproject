# 📧 PHASE 3: Email Management System

## Overview

Enable staff to connect multiple email accounts (Gmail, Office Email, CRM Email) and let Super Admin configure which email gets used for different communication types.

**Timeline:** 2 weeks | **Start Date:** April 9, 2026 | **Target:** April 23, 2026

---

## 🎯 Goals

### Goal 1: User Email Account Management

- Staff can add/remove their email addresses
- Support 3 email types: CRM, Gmail, Office Email
- Email verification before activation
- Primary email designation

### Goal 2: Email Routing System

- Route different communication types to different emails:
  - Meetings → Gmail (for calendar integration)
  - Documentation → Office Email (formal records)
  - Notifications → CRM Email (internal updates)
  - Updates → CRM Email

### Goal 3: Super Admin Control

- Super Admin can view all staff email accounts
- Define global email policies
- Override per-user settings
- View email routing audit log

---

## 🏗️ Architecture

```
┌─────────────────────────────┐
│   Dashboard Events          │
│   (Phase 2 Complete)        │
└──────────┬──────────────────┘
           │
      Create Online Event
      with Meet Link
           │
           ▼
┌─────────────────────────────────────┐
│   Email Router (NEW - Phase 3)      │  Choose email based on:
│                                     │  • Event type (meeting/docs)
│   - Meeting → Gmail                 │  • User settings
│   - Docs → Office Email             │  • Admin policy
│   - Alerts → CRM Email              │
└──────────┬──────────────────────────┘
           │
           ▼
┌────────────────────────────────────┐
│   Email Service Provider            │  Resend API (already configured)
│   (Resend / SendGrid / AWS SES)     │
└────────────┬───────────────────────┘
             │
             ▼
┌──────────────────────────────────┐
│   User Email Account              │  Gmail OAuth or Manual Entry
│   (Gmail, Office, CRM)            │
└──────────────────────────────────┘
```

---

## 📋 Database Schema Changes

### NEW TABLE: `user_email_accounts`

```sql
CREATE TABLE user_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_type VARCHAR(50) NOT NULL, -- 'gmail' | 'office_email' | 'crm_email'
  email_address VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  verification_code VARCHAR(6),
  verification_sent_at TIMESTAMPTZ,
  oauth_token_gmail TEXT, -- Encrypted OAuth token for Gmail
  oauth_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, email_type) -- Only one of each type per user
);
```

### UPDATE TABLE: `app_settings`

**Add email routing policy keys:**

```sql
INSERT INTO app_settings VALUES
  ('email_route_meetings', 'gmail'),      -- Meet invites via Gmail
  ('email_route_documents', 'office_email'), -- Formal docs via Office
  ('email_route_notifications', 'crm_email'), -- Alerts via CRM
  ('email_route_updates', 'crm_email');   -- Updates via CRM
```

---

## 🔄 Implementation Workflow

### Week 1: Email Account Management

#### Day 1-2: Database & Schema

- [ ] Create migration: `016_user_email_accounts.sql`
- [ ] Create indexes on user_id, email_type
- [ ] Add RLS policies for row-level access

#### Day 2-3: Email Settings UI

**File:** `src/app/settings/user-emails/page.jsx`

- Display current email accounts
- Form to add new email
- Email type selector (dropdown)
- Email address input
- "Send Verification Code" button
- "Verify" button with code input
- Delete button for removing emails
- Mark as primary radio buttons

#### Day 3-4: Email Verification

**File:** `src/lib/emailVerification.js`

- Generate 6-digit verification codes
- Send verification email
- Verify code logic
- Mark email as verified
- Auto-resend after 5 minutes

#### Day 5: Gmail OAuth Setup (Optional - Phase 3B)

- OAuth consent screen configuration
- Token generation on user authorization
- Store encrypted tokens in database
- Refresh token logic

### Week 2: Email Routing & Policies

#### Day 6-7: Email Router

**File:** `src/lib/emailRouter.js`

- `routeEmail(userId, emailType, template, data)` function
- Check primary email for type
- Check user preferences
- Check admin policy
- Return chosen email address

#### Day 8: Admin Email Policy Page

**File:** `src/app/settings/email-policies/page.jsx`

- Super Admin sees all email policy options
- Dropdown for each route type:
  - Meetings:
    - [ ] Use Gmail (when available)
    - [ ] Use Office Email
    - [ ] Use CRM Email
  - Documents:
    - [ ] Use Office Email (when available)
    - [ ] Use CRM Email
  - Notifications:
    - [ ] Use CRM Email (primary)
    - [ ] User preference (if set)

#### Day 9: Staff Email Assignment (Optional - Phase 3B)

**File:** `src/app/settings/staff-email-assignment/page.jsx`

- Super Admin bulk view of all staff emails
- Filter by office, email status
- Quick actions: verify, delete, mark primary

#### Day 10: Testing & Documentation

- Integration tests
- Email sending verification
- Documentation
- Go-live checklist

---

## 📁 Files to Create/Modify

### New Files (Phase 3A - Core)

```
src/app/settings/user-emails/page.jsx          (250 lines)
src/lib/emailVerification.js                   (180 lines)
src/lib/emailRouter.js                         (120 lines)
supabase/migrations/016_user_email_accounts.sql (60 lines)
```

### Modified Files (Phase 3A)

```
src/app/dashboard/page.jsx                     (Add email routing to event creation)
src/app/api/send-email/route.js               (NEW - Email sending endpoint)
src/lib/emailTemplates/*.js                    (Already created in Phase 2)
```

### Optional Files (Phase 3B)

```
src/app/settings/email-policies/page.jsx       (200 lines)
src/lib/googleOAuth.js                         (200 lines)
src/app/settings/staff-email-assignment/page.jsx (250 lines)
```

---

## 🔌 Integration Points

### With Phase 2 (Google Meet)

```javascript
// When event is created:
1. Get user's current emails (user_email_accounts)
2. Route based on:
   - Is it online? → Use Gmail
   - Is it docs? → Use Office Email
   - Is it notification? → Use CRM Email
3. Send using appropriate email template
4. Log in audit table
```

### With Integrations (Already Configured)

```
Settings → Integrations
├─ Master Gmail (office.gtbd@gmail.com)
├─ Google Service Account JSON
├─ Resend API Key (for actual sending)
└─ WhatsApp Token
```

---

## 💻 Code Examples

### Example 1: Email Router

```javascript
// src/lib/emailRouter.js
export const routeEmail = async (userId, emailType, metadata = {}) => {
  // emailType: 'meeting' | 'document' | 'notification' | 'update'

  const supabase = getSupabaseClient();

  // Get user's preferred emails
  const { data: emails } = await supabase
    .from("user_email_accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_verified", true);

  // Get admin policy for this email type
  const { data: policy } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", `email_route_${emailType}`);

  // Determine which email address to use
  const routeType = policy?.value || "crm_email";
  const chosenEmail = emails.find((e) => e.email_type === routeType);

  return chosenEmail?.email_address || null;
};
```

### Example 2: Email Settings Page

```javascript
// src/app/settings/user-emails/page.jsx
export default function UserEmailsPage() {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [emailType, setEmailType] = useState("crm_email");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(null);

  const handleAddEmail = async () => {
    // 1. Insert into user_email_accounts with is_verified=false
    // 2. Generate verification code
    // 3. Send verification email
    // 4. Show verification input
  };

  const handleVerifyEmail = async (code) => {
    // 1. Check if code matches
    // 2. Set is_verified=true
    // 3. Show success
  };

  const handleDelete = async (emailId) => {
    // 1. Delete from user_email_accounts
    // 2. Update UI
  };

  return (
    <div>
      <h1>My Email Accounts</h1>

      {/* Current Emails */}
      {emails.map((email) => (
        <div key={email.id} className="card">
          <input
            type="radio"
            name="primary"
            checked={email.is_primary}
            onChange={() => handleSetPrimary(email.id)}
          />
          <span>{email.email_address}</span>
          <span>{email.email_type}</span>
          <button onClick={() => handleDelete(email.id)}>Delete</button>
        </div>
      ))}

      {/* Add New Email */}
      <div className="card">
        <select
          value={emailType}
          onChange={(e) => setEmailType(e.target.value)}
        >
          <option value="crm_email">CRM Email (Internal)</option>
          <option value="gmail">Gmail (Calendar & Meetings)</option>
          <option value="office_email">Office Email (Formal Docs)</option>
        </select>
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          placeholder="email@example.com"
        />
        <button onClick={handleAddEmail}>Send Verification Code</button>
      </div>

      {/* Verification */}
      {pendingVerification && (
        <div className="card">
          <p>Enter the 6-digit code sent to {newEmail}</p>
          <input
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="000000"
            maxLength="6"
          />
          <button onClick={() => handleVerifyEmail(verificationCode)}>
            Verify
          </button>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Send Email Endpoint

```javascript
// src/app/api/send-email/route.js
export async function POST(req) {
  const { userId, emailType, template, data } = await req.json();

  // Route to correct email
  const toEmail = await routeEmail(userId, emailType, data);
  if (!toEmail)
    return Response.json({ error: "No email address" }, { status: 400 });

  // Generate email content based on template
  const { subject, html, text } = generateTemplate(template, data);

  // Send via Resend
  const resend = new Resend(process.env.RESEND_API_KEY);
  const result = await resend.emails.send({
    from: "CRM <notifications@gtbd.com>",
    to: toEmail,
    subject,
    html,
    text,
  });

  // Log to audit table
  await logEmailSent({
    user_id: userId,
    to_email: toEmail,
    email_type: emailType,
    template,
    sent_at: new Date(),
    resend_id: result.id,
  });

  return Response.json({ success: true, id: result.id });
}
```

---

## 🧪 Testing Plan

### Test 1: Email Settings Page

```
1. Go to Settings → My Email Accounts
2. Add Gmail: test@gmail.com
3. See verification code input
4. Enter code from email
5. See "Verified ✓"
6. Add Office Email: test@company.com
7. Mark Gmail as primary
8. Delete Office Email
9. Verify: Only Gmail remains, marked primary
```

### Test 2: Email Routing (Integration)

```
1. Create online event
2. Event sent to user via Gmail (not CRM email)
3. Edit integrations to route meetings → crm_email
4. Create new online event
5. Event now sent to CRM email
6. Verify in database

SELECT * FROM user_email_accounts WHERE user_id='xxx'
```

### Test 3: Admin Policy Update

```
1. Super Admin → Settings → Email Policies
2. Change: Meetings routes to Office Email
3. Create new online event
4. Verify event sent to office email
5. Change back to Gmail
6. Create another event
7. Verify back to Gmail
```

### Test 4: Multiple Emails per Type

```
User tries to add:
- Gmail (OK)
- Gmail again (Error: only one Gmail allowed)
- Office Email (OK)
- CRM Email (OK)
```

---

## 📊 Success Metrics

| Metric                   | Target | Status     |
| ------------------------ | ------ | ---------- |
| Users can add email      | 100%   | 🔄 Phase 3 |
| Email verification works | 100%   | 🔄 Phase 3 |
| Events route correctly   | 100%   | 🔄 Phase 3 |
| No failed email sends    | <1%    | 🔄 Phase 3 |
| Email sent within 5sec   | 95%    | 🔄 Phase 3 |

---

## 🚀 Phase 3 Checklist

### Part A: Core Email Management (This Week)

- [ ] Create database migration (016_user_email_accounts.sql)
- [ ] Build email settings page (user-emails/page.jsx)
- [ ] Implement verification system (emailVerification.js)
- [ ] Create email router (emailRouter.js)
- [ ] Build send-email API route
- [ ] Test email account creation
- [ ] Test email routing
- [ ] Test verification codes
- [ ] Document Phase 3A completion

### Part B: Admin Control (Optional - Next Week)

- [ ] Build email policies page
- [ ] Build staff email assignment page
- [ ] Implement Gmail OAuth (optional)
- [ ] Add audit logging
- [ ] Create admin dashboard for email management
- [ ] Document Phase 3B completion

---

## 🔐 Security Considerations

- [ ] Enable RLS on user_email_accounts table
- [ ] Users can only see/modify their own emails
- [ ] Super Admin can see all emails
- [ ] Encrypt OAuth tokens at rest
- [ ] Don't log full email addresses in audit logs
- [ ] Verify email ownership before sending
- [ ] Rate limit verification code attempts
- [ ] Use secure 6-digit codes (1M combinations)
- [ ] Verification codes expire after 15 minutes

---

## 📞 Phase 3 Summary

### What We're Building

A complete email management system where:

- Staff connect their email accounts (Gmail, Office, CRM)
- Events automatically route to the correct email
- Super Admin controls routing rules globally
- All communication is trackable and auditable

### How It Works

1. Staff adds email in Settings → My Email Accounts
2. System sends verification code
3. Staff enters code to verify ownership
4. Event created → Router checks admin policy
5. Router picks correct email based on event type
6. Email sent via Resend API
7. Audit log records which email received it

### What's Enabled After Phase 3

- Phase 4: Advanced scheduling with email scheduling
- Phase 5: Automated email sequences
- Phase 6: Analytics on email effectiveness

---

## 📅 Timeline

| Week               | Focus                    | Deliverable                      |
| ------------------ | ------------------------ | -------------------------------- |
| Week 1 (Apr 9-15)  | Email account management | User can add/verify emails ✅    |
| Week 2 (Apr 16-23) | Email routing system     | Events route to correct email ✅ |
| Week 3+ (Phase 4)  | Admin policies           | Super Admin controls routing     |

---

## 🎉 Ready to Start?

Ready to begin Phase 3 Email Management System!

**Next Steps:**

1. ✅ Show project workflow (this document)
2. 🔄 Create database migration
3. 🔄 Build email settings UI
4. 🔄 Implement verification system
5. 🔄 Create email router
6. 🔄 Test and document all

Let's make this happen! 🚀
