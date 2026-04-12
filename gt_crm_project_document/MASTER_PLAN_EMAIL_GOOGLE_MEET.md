# Master Plan: Fix Staff Search, Events, & Implement Dual Email + Google Meet System

## Phase 1: Fix Existing Issues ✅

### Issue 1: Search Staff Not Working

**Problem:** Staff search query filtering not functioning
**Root Cause:**

- Search happens on client side but staff data may not be fully loaded
- Office relationships may not be included in staff query

**Solution:**

1. Update staff query to include offices relationship
2. Ensure search happens after data is loaded
3. Add debouncing to search input
4. Implement better error handling

**Files to Modify:**

- `src/app/dashboard/page.jsx` - Update staff query and search logic

### Issue 2: Not Seeing All Office Staff Members

**Problem:** Staff members not displaying in selection list
**Root Cause:**

- Staff may not be loaded completely
- Office filter might be defaulting incorrectly
- Data relationships not properly joined

**Solution:**

1. Ensure `allStaff` state is populated from `loadDashboardData()`
2. Add console logging to debug staff data
3. Verify office filter dropdown shows all offices
4. Add loading state while fetching staff

**Files to Modify:**

- `src/app/dashboard/page.jsx` - Verify staff loading and relationships

### Issue 3: Events Not Working - "Failed to create event"

**Problem:** Event creation fails silently
**Root Cause:**

- `metadata` field may not be supported in staff_tasks table
- Date/time validation might be failing
- Database permissions issue

**Solution:**

1. Update migration to support metadata column properly
2. Add proper error logging in event creation
3. Validate form inputs before submission
4. Test with Supabase directly

**Files to Modify:**

- `supabase/migrations/014_add_task_period.sql` - Add metadata column
- `src/app/dashboard/page.jsx` - Improve error handling and validation

---

## Phase 2: Database Schema Enhancement 🗄️

### Create Events Table (Recommended)

Instead of using staff_tasks for events, create dedicated table:

```sql
CREATE TABLE IF NOT EXISTS office_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  is_online BOOLEAN DEFAULT false,
  google_meet_link TEXT,
  location TEXT,
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Add User Emails Table

For managing multiple email addresses per user:

```sql
CREATE TABLE IF NOT EXISTS user_email_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  email_type TEXT CHECK (email_type IN ('crm','gmail','office')) DEFAULT 'crm',
  is_primary BOOLEAN DEFAULT false,
  google_calendar_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Phase 3: Google Meet Integration 🔗

### 3.1 Setup Google API

**Dependencies to Add:**

```json
{
  "google-auth-library": "latest",
  "googleapis": "latest"
}
```

**Environment Variables:**

```
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/google/callback
GOOGLE_CALENDAR_API_KEY=xxx
```

### 3.2 Create Google Meet Link Generator

**New Utility File:** `src/lib/googleMeet.js`

- Function to generate unique Google Meet links
- Pattern: `https://meet.google.com/{48-char-id}`
- Link format: consistent and shareable

### 3.3 Google Calendar Sync

**New API Route:** `src/app/api/google-calendar-sync/route.js`

- Sync event details to user's Google Calendar
- Send invitations to attendees
- Auto-update on event changes

---

## Phase 4: Dual Email System 📧

### 4.1 User Email Settings Page

**New Page:** `src/app/settings/emails/page.jsx`

- View/add/remove email addresses
- Set email type (CRM, Gmail, Office)
- Mark as primary
- Connect to Google Calendar (OAuth)

**Features:**

- Add new email with verification
- Delete unused emails
- Set default for each communication type
- Google Calendar connection status

### 4.2 Email Routing System

**New Utility:** `src/lib/emailRouter.js`

- Route emails based on type:
  - CRM notifications → CRM email
  - Online meetings → Gmail address
  - Documentation → Office email
  - Updates → CRM email (default)

### 4.3 Email Templates

**New Folder:** `src/lib/emailTemplates/`

- `eventNotification.js` - Event invitation
- `onlineMeetingAlert.js` - Google Meet link
- `crmUpdate.js` - System updates
- `documentationNotice.js` - Official docs

---

## Phase 5: Super Admin Email Configuration 🛠️

### 5.1 Email Policy Settings

**New Page:** `src/app/settings/email-policies/page.jsx`

**Configuration Options:**

```
Online Meeting Notifications
  Default: Gmail address
  Auto-create Google Meet: YES/NO
  Notify 24h before: YES/NO

Official Documentation
  Default: Office email
  Auto-forward to: [select]

CRM Notifications
  Default: CRM email
  Include: [checkboxes for what to include]

Software Updates
  Default: CRM email
  Frequency: [daily/weekly/monthly]
```

### 5.2 User Email Assignment

Let Super Admin assign which email to use for each user:

- View all users
- Set email addresses per user
- Override default policy
- Bulk email assignment

---

## Phase 6: Implementation Schedule 🗓️

### Week 1: Fix Current Issues

- [ ] Fix search staff functionality
- [ ] Fix events creation
- [ ] Update migrations for metadata support
- [ ] Add proper error logging

### Week 2: Database Enhancements

- [ ] Create `office_events` table
- [ ] Create `user_email_accounts` table
- [ ] Add migration files
- [ ] Add RLS policies

### Week 3: Google Meet Integration

- [ ] Setup Google API credentials
- [ ] Create `googleMeet.js` utility
- [ ] Create Google Calendar sync API
- [ ] Test with real Google account

### Week 4: Dual Email System

- [ ] Build email settings page
- [ ] Create email router logic
- [ ] Create email templates
- [ ] Implement email sending

### Week 5: Super Admin Configuration

- [ ] Build email policies page
- [ ] Build user email assignment
- [ ] Create admin controls
- [ ] Test full workflow

### Week 6: Testing & Refinement

- [ ] End-to-end testing
- [ ] Error handling
- [ ] Performance optimization
- [ ] Documentation

---

## Phase 7: File Structure (New Files to Create)

```
src/
├── app/
│   ├── api/
│   │   ├── google-calendar-sync/
│   │   │   └── route.js (NEW)
│   │   └── events/
│   │       └── route.js (NEW)
│   └── settings/
│       ├── emails/
│       │   └── page.jsx (NEW)
│       └── email-policies/
│           └── page.jsx (NEW)
│
├── lib/
│   ├── googleMeet.js (NEW)
│   ├── emailRouter.js (NEW)
│   └── emailTemplates/
│       ├── eventNotification.js (NEW)
│       ├── onlineMeetingAlert.js (NEW)
│       ├── crmUpdate.js (NEW)
│       └── documentationNotice.js (NEW)
│
└── components/
    └── settings/
        ├── EmailSettings.jsx (NEW)
        └── EmailPolicies.jsx (NEW)

supabase/
└── migrations/
    ├── 015_create_office_events.sql (NEW)
    ├── 016_create_user_email_accounts.sql (NEW)
    └── 017_add_event_rls_policies.sql (NEW)
```

---

## Phase 8: Priority Checklist

### CRITICAL (Fix First)

- [ ] Fix staff search functionality
- [ ] Fix events creation
- [ ] Verify staff data loading
- [ ] Add error logging

### HIGH (Week 1-2)

- [ ] Create events table migration
- [ ] Create user emails table migration
- [ ] Update event creation logic
- [ ] Add proper validation

### MEDIUM (Week 3-4)

- [ ] Google Meet integration
- [ ] Email routing system
- [ ] Email templates
- [ ] User email settings page

### LOW (Week 5)

- [ ] Super Admin email policies
- [ ] Bulk operations
- [ ] Advanced configurations

---

## Next Steps

1. **Immediate:** I'll fix staff search and events creation
2. **Then:** Create migrations for new tables
3. **Then:** Build Google Meet integration
4. **Then:** Implement email system
5. **Finally:** Super Admin controls

Should I proceed with:

1. **Option A:** Fix issues first, then build new features
2. **Option B:** Create full migrations first, then implement everything
3. **Option C:** Start with issues + basic Google Meet (simplified version)

**Recommendation:** Option A - Fix critical issues first, then plan Google integration properly
