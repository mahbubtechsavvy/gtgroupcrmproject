# 🧪 PHASE 4 TESTING & VALIDATION GUIDE

**Last Updated:** April 9, 2026
**Objective:** Validate Phase 4 Email Routing & Sending System
**Estimated Time:** 4 hours
**Status:** Ready for Testing

---

## 📋 PRE-TESTING CHECKLIST

Before starting tests, verify:

### Database Ready

- [ ] Migration 017 executed (`supabase migration up`)
- [ ] email_logs table created
- [ ] tasks table has `email_invite_sent`, `email_sent_at` columns
- [ ] RLS policies active

### Code Deployed

- [ ] `src/lib/emailRouter.js` deployed
- [ ] `src/lib/emailSending.js` deployed
- [ ] `src/app/api/send-event-emails/route.js` deployed
- [ ] `src/app/api/email-retry/route.js` deployed
- [ ] `src/app/settings/email-history/page.jsx` deployed
- [ ] `src/app/dashboard/page.jsx` updated
- [ ] CSS styling deployed

### Environment Setup

- [ ] `npm run build` successful
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Gmail API key available (for Phase 3)

---

## 🎯 TEST SUITE 1: Email Routing System

### T1.1: Email Account Selection - Online Meeting

**Objective:** Verify routing selects Gmail for online meetings

**Steps:**

1. Open browser console
2. Create test event with:
   - Title: "Test Conference"
   - Date: Tomorrow
   - Check: "Online Meeting"
3. Manually test routing:

```javascript
// In browser console
const emailRouter = await import("@/lib/emailRouter");
const selected = await emailRouter.selectEmailAccount({
  userId: "YOUR_USER_ID",
  emailType: "meeting_alert",
  isOnlineMeeting: true,
});
console.log(selected);
// EXPECT: accountType = 'gmail' (if available)
```

**Expected:** Gmail email selected
**Result:** ✅ PASS / ❌ FAIL

---

### T1.2: Email Account Selection - Event Invite

**Objective:** Verify routing prefers Gmail but allows CRM fallback

**Steps:**

1. Run in console:

```javascript
const selected = await emailRouter.selectEmailAccount({
  userId: "YOUR_USER_ID",
  emailType: "event_invite",
  isOnlineMeeting: false,
});
console.log(selected);
// EXPECT: Gmail if oauth_connected, else CRM
```

**Expected:** Gmail (if OAuth) or CRM email
**Result:** ✅ PASS / ❌ FAIL

---

### T1.3: Email Account Selection - Notification

**Objective:** Verify notifications use CRM email

**Steps:**

1. Run in console:

```javascript
const selected = await emailRouter.selectEmailAccount({
  userId: "YOUR_USER_ID",
  emailType: "notification",
  isOnlineMeeting: false,
});
console.log(selected);
// EXPECT: accountType = 'crm'
```

**Expected:** CRM email
**Result:** ✅ PASS / ❌ FAIL

---

### T1.4: Fallback to First Available Email

**Objective:** Ensure fallback when primary not available

**Steps:**

1. Supabase: Mark primary emails as not_verified
2. Run routing:

```javascript
const selected = await emailRouter.selectEmailAccount({
  userId: "YOUR_USER_ID",
  emailType: "meeting_alert",
  isOnlineMeeting: true,
});
console.log(selected);
// EXPECT: First available email
```

**Expected:** Returns any available email
**Result:** ✅ PASS / ❌ FAIL

---

## 🎯 TEST SUITE 2: Email Logging

### T2.1: Email Logged When Event Created

**Objective:** Verify email_logs entry created on event

**Steps:**

1. Open Dashboard
2. Create new event:
   - Title: "Log Test Event"
   - Date: Tomorrow
   - Time: 14:00
3. Wait for confirmation alert
4. Navigate to: Settings → Email History
5. Search for email subject

**Expected Results:**

- Email logged in database
- Status = "pending" or "sent"
- to_email matches recipients
- subject contains event title
- email_type = "event_invite" or "meeting_alert"

**Result:** ✅ PASS / ❌ FAIL

---

### T2.2: Email Metadata Stored

**Objective:** Verify all field populated correctly

**Steps:**

1. Go to Settings → Email History
2. Find created email
3. Check database directly:

```sql
SELECT * FROM email_logs
WHERE related_type = 'event'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Fields:**

- from_email: [selected email]
- to_email: [recipient]
- subject: Event title
- status: sent|pending|failed
- email_type: event_invite|meeting_alert
- related_type: event
- related_id: [event UUID]
- created_at: [timestamp]

**Result:** ✅ PASS / ❌ FAIL

---

### T2.3: Multiple Recipients Logged

**Objective:** Verify each recipient gets separate log entry

**Steps:**

1. Create event with global recipient setting (all staff)
2. Check email_logs:

```sql
SELECT to_email, COUNT(*)
FROM email_logs
WHERE related_id = '[EVENT_ID]'
GROUP BY to_email;
```

**Expected:** One row per recipient
**Result:** ✅ PASS / ❌ FAIL

---

## 🎯 TEST SUITE 3: Email Sending (Gmail)

### T3.1: Email Sent When OAuth Connected

**Objective:** Verify Gmail API called for OAuth accounts

**Prerequisite:** Gmail account with OAuth connected in Phase 3

**Steps:**

1. Create event (as user with Gmail OAuth)
2. Watch alert for "emails sent"
3. Check email_logs status:

```sql
SELECT status, external_message_id, sent_at
FROM email_logs
WHERE related_id = '[EVENT_ID]'
LIMIT 1;
```

**Expected:**

- Status = "sent"
- external_message_id populated (Gmail message ID)
- sent_at = [current timestamp]

**Result:** ✅ PASS / ❌ FAIL

---

### T3.2: Email Subject Correct

**Objective:** Verify email subject matches event

**Steps:**

1. Create event: "Q3 Planning Meeting"
2. Check Gmail inbox
3. Look for email with subject containing "Q3 Planning Meeting"

**Expected:**

- Email received in Gmail
- Subject matches event title
- From address is user's email

**Result:** ✅ PASS / ❌ FAIL

---

### T3.3: Email Content Contains Event Details

**Objective:** Verify email body includes event info

**Steps:**

1. Create event:
   - Title: "Team Standup"
   - Date: April 10, 2026
   - Time: 10:00 AM
   - Location: Conference Room A
   - Online Meeting: ✓
2. Check email body contains:

**Expected in Email:**

- Event title
- Date and time
- Location (if specified)
- Google Meet link (if online)
- Organizer name
- RSVP option (if supported)

**Result:** ✅ PASS / ❌ FAIL

---

### T3.4: Email Sent Flag Updated

**Objective:** Verify event record updated

**Steps:**

1. Create event
2. Check tasks table:

```sql
SELECT email_invite_sent, email_sent_at, email_sent_to_count
FROM tasks
WHERE id = '[EVENT_ID]';
```

**Expected:**

- email_invite_sent = TRUE
- email_sent_at = [current timestamp]
- email_sent_to_count = [number of recipients]

**Result:** ✅ PASS / ❌ FAIL

---

## 🎯 TEST SUITE 4: Error Handling & Failures

### T4.1: Missing OAuth Gracefully Fails

**Objective:** Email not sent but event still created

**Steps:**

1. Create event as user WITHOUT Gmail OAuth
2. Check alert message

**Expected:**

- Event created successfully
- Alert shows "pending" status
- Email not sent (no error)
- No system crash

**Result:** ✅ PASS / ❌ FAIL

---

### T4.2: Invalid Email Recipient

**Objective:** Handle invalid email gracefully

**Steps:**

1. Manually add invalid email to recipient list
2. Create event
3. Check alert and email_logs

**Expected:**

- Event created
- Invalid email logged as failed
- Valid emails sent normally
- Error message captured in database

**Result:** ✅ PASS / ❌ FAIL

---

### T4.3: API Timeout Handling

**Objective:** Graceful handling of slow Gmail API

**Steps:**

1. Create event
2. If API slow, check behavior:
   - Event still created?
   - Email status = "pending"?
   - Can retry later?

**Expected:**

- Event created
- Email logged as pending
- Can retry from UI later

**Result:** ✅ PASS / ❌ FAIL

---

## 🎯 TEST SUITE 5: Email History Dashboard

### T5.1: View Email History Page

**Objective:** Dashboard loads and displays emails

**Steps:**

1. Go to: Settings → Email History
2. Wait for page load

**Expected:**

- Page loads without errors
- Statistics displayed (total, sent, failed, pending)
- Email list shows created emails
- Timestamps visible

**Result:** ✅ PASS / ❌ FAIL

---

### T5.2: Filter by Email Type

**Objective:** Filter buttons work correctly

**Steps:**

1. Go to Email History
2. Click "Event Invite" filter
3. Observe list

**Expected:**

- Only event_invite emails shown
- Count updated
- List filtered immediately

**Steps for next filter:** 4. Click "Meeting Alert" 5. Only meeting_alert shown

**Result:** ✅ PASS / ❌ FAIL

---

### T5.3: Filter by Status

**Objective:** Status filter works

**Steps:**

1. Go to Email History
2. Click "Status" dropdown
3. Select "Sent"

**Expected:**

- Only sent emails shown
- Count updated
- List filtered

**Result:** ✅ PASS / ❌ FAIL

---

### T5.4: Search Functionality

**Objective:** Search by email/subject works

**Steps:**

1. Go to Email History
2. Type "team" in search box
3. Wait for results

**Expected:**

- Emails with "team" in subject shown
- Results instant

**Result:** ✅ PASS / ❌ FAIL

---

### T5.5: Statistics Accurate

**Objective:** Dashboard stats match database

**Steps:**

1. Go to Email History
2. Note "Total: X, Sent: Y, Failed: Z, Pending: W"
3. Query database:

```sql
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN status='sent' THEN 1 END) as sent,
  COUNT(CASE WHEN status='failed' THEN 1 END) as failed,
  COUNT(CASE WHEN status='pending' THEN 1 END) as pending
FROM email_logs
WHERE user_id = '[YOUR_USER_ID]';
```

**Expected:** Dashboard stats match query results

**Result:** ✅ PASS / ❌ FAIL

---

## 🎯 TEST SUITE 6: Retry Mechanism

### T6.1: Retry Button Available

**Objective:** Failed emails can be retried

**Steps:**

1. Manually mark email as failed:

```sql
UPDATE email_logs
SET status='failed', error_message='Test failure', retry_count=0
WHERE id='[EMAIL_LOG_ID]';
```

2. Refresh Email History
3. Find failed email

**Expected:**

- Failed email shown with red badge
- "Retry" button visible
- Error message displayed

**Result:** ✅ PASS / ❌ FAIL

---

### T6.2: Click Retry Button

**Objective:** Retry endpoint works

**Steps:**

1. Click "Retry" on failed email
2. Observe loading state

**Expected:**

- Button shows loading
- "Scheduled for retry" message
- Page updates
- Status shows "pending" or "sending"

**Result:** ✅ PASS / ❌ FAIL

---

### T6.3: Retry Count Incremented

**Objective:** Retry count tracked

**Steps:**

1. Retry failed email twice
2. Check database:

```sql
SELECT retry_count, max_retries
FROM email_logs
WHERE id='[EMAIL_LOG_ID]';
```

**Expected:**

- retry_count incremented (0 → 1 → 2)
- Stays under max_retries

**Result:** ✅ PASS / ❌ FAIL

---

### T6.4: Max Retries Enforced

**Objective:** Can't retry after limit

**Steps:**

1. Mark email retry_count = 3:

```sql
UPDATE email_logs
SET retry_count=3, max_retries=3
WHERE id='[EMAIL_LOG_ID]';
```

2. Refresh and find email

**Expected:**

- "Retry" button disabled
- Message: "Max retries reached"

**Result:** ✅ PASS / ❌ FAIL

---

## 🎯 TEST SUITE 7: User Isolation (Security)

### T7.1: User Can't See Other's Emails

**Objective:** RLS prevents viewing other users' emails

**Steps:**

1. User 1: Create event, get email_log_id
2. User 2: Try to load that email_log_id
3. Check database:

```sql
SELECT * FROM email_logs
WHERE id='[OTHER_USER_EMAIL_LOG_ID]';
```

**Expected:**

- Returns 0 rows (RLS blocks it)
- User 2 can't view User 1's email

**Result:** ✅ PASS / ❌ FAIL

---

### T7.2: Super Admin Can See All Emails

**Objective:** Super admin bypass works

**Steps:**

1. Super Admin: Query all emails

```sql
-- As super admin
SELECT COUNT(*) FROM email_logs;
```

**Expected:**

- Returns all emails (not filtered by user_id)
- Audit access working

**Result:** ✅ PASS / ❌ FAIL

---

## 🎯 TEST SUITE 8: Performance

### T8.1: Event Creation Performance

**Objective:** Email sending doesn't block UI

**Steps:**

1. Create event
2. Measure time from form submit to alert shown
3. Alert should appear in < 5 seconds

**Expected:** Alert within 5 seconds
**Result:** ✅ PASS / ❌ FAIL

---

### T8.2: Email History Load Performance

**Objective:** Dashboard loads quickly with many emails

**Steps:**

1. Create 100+ test emails in database
2. Go to Email History
3. Measure load time

**Expected:** Page loads in < 3 seconds
**Result:** ✅ PASS / ❌ FAIL

---

### T8.3: Search Performance

**Objective:** Search fast even with many emails

**Steps:**

1. Have 100+ emails in database
2. Type in search box
3. Measure result time

**Expected:** Results appear in < 1 second
**Result:** ✅ PASS / ❌ FAIL

---

## 📊 TEST SUMMARY FORM

**Date:** ****\_\_\_****
**Tester:** ****\_\_\_****
**Environment:** ☐ Development ☐ Staging ☐ Production

### Results:

- Test Suite 1 (Routing): \_\_\_/4
- Test Suite 2 (Logging): \_\_\_/3
- Test Suite 3 (Gmail): \_\_\_/4
- Test Suite 4 (Errors): \_\_\_/3
- Test Suite 5 (Dashboard): \_\_\_/5
- Test Suite 6 (Retry): \_\_\_/4
- Test Suite 7 (Security): \_\_\_/2
- Test Suite 8 (Performance): \_\_\_/3

**Total:** \_\_\_/28

**Issues Found:**

1. ***
2. ***
3. ***

**Blockers:** ☐ None ☐ Minor ☐ Major ☐ Critical

**Approval:** ✅ PASS / ❌ FAIL

---

## 🚀 DEPLOYMENT CHECKLIST (Post-Testing)

After all tests pass:

- [ ] All 28 tests passing
- [ ] No critical issues
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Database backups created
- [ ] Rollback plan documented
- [ ] Team trained
- [ ] Documentation complete

---

**Phase 4 Testing Guide**
**Status: Ready for Use**
**Last Updated: April 9, 2026**
