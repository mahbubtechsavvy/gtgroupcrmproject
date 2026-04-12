# ✅ PHASE 4 TESTING GUIDE - 28 TEST CASES

**GT GROUP CRM Email System**
**Date:** April 9, 2026
**Status:** Ready to Execute

---

## 🎯 TESTING OVERVIEW

**Total Test Cases:** 28
**Estimated Duration:** 2-3 hours
**Prerequisites:**

- ✅ Migrations 016, 017, 018 deployed successfully
- ✅ Code deployed to server
- ✅ Test user accounts ready
- ✅ Supabase connected

---

## 📋 TEST CATEGORIES

### Category 1: Email Account Management (5 tests)

### Category 2: Email Sending & Routing (8 tests)

### Category 3: Email Logging & History (6 tests)

### Category 4: Email Policies (5 tests)

### Category 5: Security & RLS (4 tests)

---

## CATEGORY 1: EMAIL ACCOUNT MANAGEMENT (5 Tests)

### Test 1.1: Add Email Account via OAuth

**Status:** ⏳ Ready to test
**Prerequisites:** OAuth credentials configured
**Steps:**

1. Login as regular user
2. Go to Settings
3. Click "Add Email Account"
4. Select "Gmail"
5. Complete Google authorization
6. Verify email appears in list

**Expected Result:**

- ✅ Email account added to list
- ✅ OAuth token stored securely
- ✅ Account shows as verified

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 1.2: Remove Email Account

**Status:** ⏳ Ready to test
**Prerequisites:** At least one email account added (from Test 1.1)
**Steps:**

1. Go to Settings → Email Accounts
2. Find the account from Test 1.1
3. Click "Remove" button
4. Confirm removal

**Expected Result:**

- ✅ Account removed from list
- ✅ User receives confirmation message
- ✅ Account no longer available for sending

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 1.3: Set Primary Email Account

**Status:** ⏳ Ready to test
**Prerequisites:** At least 2 email accounts added
**Steps:**

1. Go to Settings → Email Accounts
2. Click "Set Primary" on one account
3. Verify UI updates

**Expected Result:**

- ✅ Account marked as primary
- ✅ Special badge appears
- ✅ Other accounts lose primary badge
- ✅ Database updated correctly

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 1.4: Verify Email Ownership

**Status:** ⏳ Ready to test
**Prerequisites:** Email account with OAuth connected
**Steps:**

1. Add email account
2. Check database: SELECT is_verified FROM user_email_accounts
3. Verify flag matches UI

**Expected Result:**

- ✅ OAuth setup marks email as verified
- ✅ is_verified TRUE in database
- ✅ User can send emails with this account

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 1.5: User Cannot See Other Users' Email Accounts

**Status:** ⏳ Ready to test
**Prerequisites:** Two users with accounts
**Steps:**

1. User A adds email account
2. Logout User A
3. Login User B
4. Go to Settings → Email Accounts
5. Check that User B cannot see User A's accounts

**Expected Result:**

- ✅ User B sees only their own accounts
- ✅ RLS prevents cross-user access
- ✅ No errors in console

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

## CATEGORY 2: EMAIL SENDING & ROUTING (8 Tests)

### Test 2.1: Email Sent Automatically on Event Creation

**Status:** ⏳ Ready to test
**Prerequisites:** Email account added and verified
**Steps:**

1. Create new event with:
   - Title: "Test Event"
   - Date: Today + 1 day
   - Attendees: Add test email
   - Click "Create"
2. Check email_logs table: SELECT \* FROM email_logs WHERE email_type = 'event_invite'

**Expected Result:**

- ✅ Email log entry created immediately
- ✅ Status shows "pending" or "sent"
- ✅ from_email correct
- ✅ to_email correct
- ✅ created_at recent timestamp

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 2.2: Email Routing - Meetings to Gmail

**Status:** ⏳ Ready to test
**Prerequisites:** Gmail account added as primary
**Steps:**

1. Create event with "Online Meeting" toggle ON
2. Create event
3. Check email_logs: SELECT email_service FROM email_logs WHERE related_id = {event_id}

**Expected Result:**

- ✅ Email routed to Gmail account
- ✅ email_service shows "gmail"
- ✅ from_email is Gmail address

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 2.3: Email Routing - Notifications to CRM

**Status:** ⏳ Ready to test
**Prerequisites:** CRM email account available
**Steps:**

1. Create event with "Notification" type
2. Check email_logs for routing decision
3. Verify email_service selection

**Expected Result:**

- ✅ Notification email sent via CRM account
- ✅ Correct account selected by routing logic
- ✅ User can identify which account used

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 2.4: Retry Mechanism on Email Failure

**Status:** ⏳ Ready to test
**Prerequisites:** Email account configured
**Steps:**

1. Create event that triggers email
2. Manually update email_logs: UPDATE email_logs SET status = 'failed', error_message = 'Test error' WHERE id = {id}
3. Wait for retry (system should retry)
4. Check next_retry_at column

**Expected Result:**

- ✅ Failed email marked with retry_count > 0
- ✅ next_retry_at set to future time
- ✅ retry_count increments (max 3)
- ✅ Email retried automatically

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 2.5: Email Contains Required Information

**Status:** ⏳ Ready to test
**Prerequisites:** Email sent (from Test 2.1)
**Steps:**

1. Check email_logs entry
2. Verify columns:
   - subject: Not empty
   - html_content: Contains event info
   - text_content: Contains event info
   - metadata: Contains event_id

**Expected Result:**

- ✅ All required fields populated
- ✅ Subject contains event name
- ✅ Email body readable
- ✅ HTML version available

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 2.6: Delivery Timestamp Recorded

**Status:** ⏳ Ready to test
**Prerequisites:** Email sent successfully
**Steps:**

1. Create event
2. Check email_logs immediately
3. Verify sent_at timestamp

**Expected Result:**

- ✅ sent_at recorded when email sent
- ✅ Timestamp is recent
- ✅ failed_at is NULL if successful
- ✅ External service ID recorded

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 2.7: Multiple Attendees Get Emails

**Status:** ⏳ Ready to test
**Prerequisites:** Event with 3+ attendees
**Steps:**

1. Create event with 5 attendees
2. Check email_logs for count:
   SELECT COUNT(\*) FROM email_logs WHERE related_id = {event_id}

**Expected Result:**

- ✅ 5 email log entries created
- ✅ Each attendee gets separate entry
- ✅ to_email varies for each
- ✅ All timestamps similar

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 2.8: Meeting Link Included in Email

**Status:** ⏳ Ready to test
**Prerequisites:** Event with online meeting enabled
**Steps:**

1. Create event with "Online Meeting" ON
2. Check email_logs.html_content
3. Search for "meet.google.com" or meet link

**Expected Result:**

- ✅ Google Meet link in email
- ✅ Link is clickable
- ✅ Link format matches pattern
- ✅ Same link for all attendees

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

## CATEGORY 3: EMAIL LOGGING & HISTORY (6 Tests)

### Test 3.1: Email History Dashboard Displays Emails

**Status:** ⏳ Ready to test
**Prerequisites:** Multiple emails sent
**Steps:**

1. Send 3+ emails via creating events
2. Go to Settings → Email History
3. Verify list displays

**Expected Result:**

- ✅ Email history page loads
- ✅ List shows recent emails
- ✅ Newest first (DESC)
- ✅ Shows count of emails

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 3.2: Email History Shows Status

**Status:** ⏳ Ready to test
**Prerequisites:** Emails with different statuses
**Steps:**

1. View email history
2. Check status column
3. Verify colors/badges match status

**Expected Result:**

- ✅ Pending emails show "pending" badge
- ✅ Sent emails show "sent" badge
- ✅ Failed emails show "failed" badge (with color coding)
- ✅ Status updates reflect database

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 3.3: Email Details Modal Opens

**Status:** ⏳ Ready to test
**Prerequisites:** Email in history
**Steps:**

1. Go to Email History
2. Click on an email row
3. Verify modal/details appear

**Expected Result:**

- ✅ Modal opens with email details
- ✅ All fields visible:
  - From, To, Subject
  - Status, Timestamp
  - Error message (if failed)
- ✅ Can close modal

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 3.4: Email History Pagination Works

**Status:** ⏳ Ready to test
**Prerequisites:** 20+ emails
**Steps:**

1. Go to Email History
2. Verify pagination controls appear
3. Click next page
4. Verify different emails shown

**Expected Result:**

- ✅ Pagination controls visible (10-50 per page)
- ✅ Next page shows different emails
- ✅ Previous/Next buttons work correctly
- ✅ Page numbers accurate

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 3.5: Search Email History by Recipient

**Status:** ⏳ Ready to test
**Prerequisites:** Multiple emails with different recipients
**Steps:**

1. Go to Email History
2. Use search/filter: Search for email address
3. Verify results filter correctly

**Expected Result:**

- ✅ Search filters emails by recipient
- ✅ Only matching emails shown
- ✅ Case insensitive search works
- ✅ Partial search works

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 3.6: Filter Emails by Status

**Status:** ⏳ Ready to test
**Prerequisites:** Emails with mixed statuses
**Steps:**

1. Go to Email History
2. Use filter: Show only "Failed" emails
3. Verify only failed emails shown

**Expected Result:**

- ✅ Filter dropdown available
- ✅ Can filter by: All, Pending, Sent, Failed
- ✅ Only selected status shown
- ✅ Count updates correctly

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

## CATEGORY 4: EMAIL POLICIES (5 Tests)

### Test 4.1: Super Admin Can Create Policy

**Status:** ⏳ Ready to test
**Prerequisites:** Logged in as Super Admin user
**Steps:**

1. Go to Settings → Email Routing Policies
2. Click "Create New Policy"
3. Fill form:
   - Name: "Test Gmail Policy"
   - Type: "custom"
   - Rules: Gmail for all
4. Click Submit

**Expected Result:**

- ✅ Policy form appears for Super Admin
- ✅ Can submit without errors
- ✅ Policy created in database
- ✅ Appears in policies list

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 4.2: Regular User Cannot Access Policies

**Status:** ⏳ Ready to test
**Prerequisites:** Regular (non-admin) user logged in
**Steps:**

1. Try to navigate to: /settings/email-policies
2. Check for access denied

**Expected Result:**

- ✅ RLS prevents regular user access
- ✅ Cannot view policy list
- ✅ Cannot edit policies
- ✅ Error message or redirect shown

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 4.3: Policy Applied to Email Routing

**Status:** ⏳ Ready to test
**Prerequisites:** Custom policy created (from Test 4.1)
**Steps:**

1. Assign policy to test user
2. As test user, create event
3. Check: Which email account was used?
4. Verify it matches policy rules

**Expected Result:**

- ✅ Policy routing respected
- ✅ Email sent via policy-specified account
- ✅ Audit log records policy usage
- ✅ Fallback works if no policy

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 4.4: Policy Change Audit Logged

**Status:** ⏳ Ready to test
**Prerequisites:** Policy modified
**Steps:**

1. Edit a policy's rules
2. Change one rule setting
3. Click Save
4. Check email_policy_audit table

**Expected Result:**

- ✅ Audit entry created
- ✅ action: "updated"
- ✅ old_rules stored
- ✅ new_rules stored
- ✅ Timestamp recorded
- ✅ changed_by recorded

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 4.5: Policy Deactivation Works

**Status:** ⏳ Ready to test
**Prerequisites:** Active policy exists
**Steps:**

1. Go to policy in admin panel
2. Click "Deactivate"
3. Verify is_active = FALSE in database
4. Create new email - verify policy not applied

**Expected Result:**

- ✅ Policy marked inactive
- ✅ No longer applied to emails
- ✅ Audit log records deactivation
- ✅ Can be reactivated

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

## CATEGORY 5: SECURITY & RLS (4 Tests)

### Test 5.1: User Cannot View Other Users' Email Logs

**Status:** ⏳ Ready to test
**Prerequisites:** Two users, one with sent emails
**Steps:**

1. User A creates event (generates email logs)
2. User B tries to: SELECT \* FROM email_logs WHERE user_id != auth.uid()
3. Should get 0 rows (RLS blocks)

**Expected Result:**

- ✅ User B cannot see User A's logs
- ✅ RLS policy enforces row isolation
- ✅ No error, just empty result
- ✅ Super Admin CAN see all

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 5.2: Super Admin Can View All Emails

**Status:** ⏳ Ready to test
**Prerequisites:** Super Admin logged in, multiple users' emails
**Steps:**

1. Super Admin goes to Settings
2. Try to access email history (if available)
3. Verify can see other users' emails (or special admin view)

**Expected Result:**

- ✅ Super Admin RLS allows all access
- ✅ Can see all email_logs
- ✅ Can see all user_email_accounts
- ✅ For support/audit purposes

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 5.3: OAuth Tokens Not Exposed

**Status:** ⏳ Ready to test
**Prerequisites:** Email account with OAuth token
**Steps:**

1. Check console logs - no tokens
2. Check API responses - no tokens exposed
3. Check email_logs - no tokens in metadata
4. View page source - no tokens in HTML

**Expected Result:**

- ✅ OAuth tokens never sent to frontend
- ✅ No tokens in console
- ✅ No tokens in network requests (except encrypted)
- ✅ Safe to view publicly

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

### Test 5.4: Error Messages Don't Leak Information

**Status:** ⏳ Ready to test
**Prerequisites:** Trigger an error (invalid email, failed send, etc)
**Steps:**

1. Try to cause various errors
2. Check error messages
3. Verify no sensitive data exposed

**Expected Result:**

- ✅ Error messages generic/"user-friendly"
- ✅ No database details in errors
- ✅ No auth token details in errors
- ✅ Internal errors logged (not shown to user)

**Status After Test:** ☐ PASS / ☐ FAIL
**Notes:** ******\_\_\_******

---

## 📊 TEST SUMMARY FORM

**Tester Name:** ********\_********
**Date:** April 9, 2026
**Time Started:** ****\_****
**Time Completed:** ****\_****

### Results Summary

| Category          | Tests  | Passed | Failed | Notes |
| ----------------- | ------ | ------ | ------ | ----- |
| 1. Email Accounts | 5      | ☐      | ☐      |       |
| 2. Email Sending  | 8      | ☐      | ☐      |       |
| 3. Email History  | 6      | ☐      | ☐      |       |
| 4. Email Policies | 5      | ☐      | ☐      |       |
| 5. Security       | 4      | ☐      | ☐      |       |
| **TOTAL**         | **28** | **☐**  | **☐**  |       |

### Overall Status

- [ ] ✅ ALL TESTS PASS - READY FOR PRODUCTION
- [ ] ⚠️ MINOR ISSUES - Can fix and retry
- [ ] ❌ BLOCKING ISSUES - Need investigation

---

## 🐛 ISSUES FOUND

| Issue # | Category | Description | Severity        | Resolution |
| ------- | -------- | ----------- | --------------- | ---------- |
| 1       |          |             | HIGH/MEDIUM/LOW |            |
| 2       |          |             | HIGH/MEDIUM/LOW |            |
| 3       |          |             | HIGH/MEDIUM/LOW |            |

---

## ✅ SIGN-OFF

**Tested By:** ********\_********
**Date:** April 9, 2026
**Result:** ☐ PASS / ☐ FAIL

**Recommendation:**

- ☐ Approve for production
- ☐ Fix issues then re-test
- ☐ Needs code review

**Comments:** ******\_\_\_******

---

**GT GROUP CRM**
**Phase 4 Testing Complete**
