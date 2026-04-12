# ✅ MIGRATION VERIFICATION GUIDE

**Verify Each Migration Succeeded**
**April 9, 2026**

---

## 🔍 HOW TO VERIFY MIGRATIONS WORKED

### After Running Migration 016

**In Supabase SQL Editor, run:**

```sql
-- Check table was created
SELECT table_name FROM information_schema.tables
WHERE table_name = 'user_email_accounts';

-- Expected: 1 row with "user_email_accounts"
```

**Check indexes:**

```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'user_email_accounts';

-- Expected: 4 indexes
-- - idx_user_email_accounts_user_id
-- - idx_user_email_accounts_staff_id
-- - idx_user_email_accounts_email
-- - idx_user_email_accounts_oauth
```

**If both return results → ✅ Migration 016 SUCCESS**

---

### After Running Migration 017

**In Supabase SQL Editor, run:**

```sql
-- Check table was created
SELECT table_name FROM information_schema.tables
WHERE table_name = 'email_logs';

-- Expected: 1 row with "email_logs"
```

**Check indexes:**

```sql
SELECT indexname FROM pg_indexes
WHERE tablename = 'email_logs';

-- Expected: 7 indexes
-- - idx_email_logs_user_id
-- - idx_email_logs_status
-- - idx_email_logs_email_type
-- - idx_email_logs_created_at
-- - idx_email_logs_related
-- - idx_email_logs_to_email
-- - idx_email_logs_next_retry
```

**Check column count:**

```sql
SELECT COUNT(*) as column_count FROM information_schema.columns
WHERE table_name = 'email_logs';

-- Expected: 24 columns
```

**If all checks pass → ✅ Migration 017 SUCCESS**

---

### After Running Migration 018

**In Supabase SQL Editor, run:**

```sql
-- Check all 3 tables were created
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('email_policies', 'email_policy_audit', 'policy_email_accounts')
ORDER BY table_name;

-- Expected: 3 rows
-- - email_policies
-- - email_policy_audit
-- - policy_email_accounts
```

**Check indexes:**

```sql
SELECT indexname FROM pg_indexes
WHERE tablename IN ('email_policies', 'email_policy_audit', 'policy_email_accounts');

-- Expected: 6 indexes
-- - idx_email_policies_active
-- - idx_email_policies_default
-- - idx_email_policy_audit_policy
-- - idx_email_policy_audit_user
-- - idx_policy_email_accounts_policy
-- - idx_policy_email_accounts_account
```

**If tables & indexes exist → ✅ Migration 018 SUCCESS**

---

## ✔️ QUICK VERIFICATION SCRIPT

**Run all at once (copy & paste into SQL Editor):**

```sql
-- === MIGRATION 016 VERIFICATION ===
SELECT
  'Migration 016 user_email_accounts' as check_name,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ TABLE EXISTS'
    ELSE '❌ TABLE MISSING'
  END as result
FROM information_schema.tables
WHERE table_name = 'user_email_accounts';

-- === MIGRATION 017 VERIFICATION ===
SELECT
  'Migration 017 email_logs' as check_name,
  CASE
    WHEN COUNT(*) = 1 THEN '✅ TABLE EXISTS'
    ELSE '❌ TABLE MISSING'
  END as result
FROM information_schema.tables
WHERE table_name = 'email_logs';

-- === MIGRATION 018 VERIFICATION ===
SELECT
  'Migration 018 email_policies tables' as check_name,
  CASE
    WHEN COUNT(*) >= 3 THEN '✅ ALL 3 TABLES EXIST'
    ELSE '❌ MISSING TABLES'
  END as result
FROM information_schema.tables
WHERE table_name IN ('email_policies', 'email_policy_audit', 'policy_email_accounts');

-- === INDEXES VERIFICATION ===
SELECT
  'Total Indexes Created' as check_name,
  COUNT(*) as index_count,
  CASE
    WHEN COUNT(*) >= 17 THEN '✅ ALL INDEXES CREATED'
    ELSE '⚠️ CHECK INDEX COUNT'
  END as result
FROM pg_indexes
WHERE tablename IN ('user_email_accounts', 'email_logs', 'email_policies', 'email_policy_audit', 'policy_email_accounts');
```

**Expected Output:**

```
check_name                           | result
=====================================|==========================
Migration 016 user_email_accounts    | ✅ TABLE EXISTS
Migration 017 email_logs             | ✅ TABLE EXISTS
Migration 018 email_policies tables  | ✅ ALL 3 TABLES EXIST
Total Indexes Created                | ✅ ALL INDEXES CREATED
```

**If you see all ✅ → ALL MIGRATIONS SUCCESSFUL!**

---

## 🚀 POST-DEPLOYMENT VERIFICATION

### Test 1: Settings Page Loads

**URL:** http://localhost:3000/settings

**Should Show:**

- ✅ "Email Accounts" section
- ✅ "Email History" tab
- ✅ "Email Routing Policies" tab (if Super Admin)
- ✅ No 404 error
- ✅ No console errors

---

### Test 2: Add Email Account Works

**Steps:**

1. Go to Settings
2. Click "Add Email Account" button
3. Select "Gmail"
4. Follow Google OAuth
5. Email should appear in list

**Success Indicator:**

- ✅ Button clickable
- ✅ OAuth flow works
- ✅ Email in list after
- ✅ No errors in console

---

### Test 3: Email History Loads

**URL:** http://localhost:3000/settings/email-history

**Should Show:**

- ✅ Empty list initially (no emails sent yet)
- ✅ Page loads without errors
- ✅ "No emails" message displays
- ✅ No 404 error

---

### Test 4: Send Test Email

**Steps:**

1. Go to Dashboard
2. Create new event
3. Add email address as attendee
4. Submit

**Check:**

```sql
-- In Supabase, run:
SELECT * FROM email_logs
ORDER BY created_at DESC
LIMIT 1;

-- Should return 1 row with:
-- - to_email: your test email
-- - status: 'pending' or 'sent'
-- - from_email: your email
-- - created_at: recent timestamp
```

**Success:** Row returned from email_logs table ✅

---

### Test 5: Email Appears in History

**Steps:**

1. Go to Settings → Email History
2. Should see the test email from Test 4
3. Click it to see details

**Success Indicators:**

- ✅ Email appears in list
- ✅ Details modal opens
- ✅ All fields populated correctly

---

## 📊 COMPLETE VERIFICATION CHECKLIST

After all 3 migrations + code deployment:

**Database Level:**

- [ ] Migration 016 creates user_email_accounts table
- [ ] Migration 016 creates 4 indexes
- [ ] Migration 017 creates email_logs table
- [ ] Migration 017 creates 7 indexes
- [ ] Migration 018 creates 3 tables (policies, audit, accounts)
- [ ] Migration 018 creates 6 indexes

**Application Level:**

- [ ] Settings page loads without 404
- [ ] Email accounts section visible
- [ ] Email history section visible
- [ ] Email policies section visible (admin only)
- [ ] "Add Email" button clickable
- [ ] No console errors

**Functional Level:**

- [ ] Can add email account
- [ ] Can create event with attendees
- [ ] Email log entry created after event
- [ ] Email appears in history
- [ ] Email history shows correct status
- [ ] Can view email details

**Security Level:**

- [ ] Regular user cannot see admin policies
- [ ] Regular user can only see own emails
- [ ] Super Admin can see all emails
- [ ] OAuth tokens not exposed in console
- [ ] No sensitive data in error messages

---

## 🎯 SUCCESS = ALL CHECKS PASS

When all checkboxes above are checked:

✅ Deployment is successful
✅ System is production-ready
✅ Ready to proceed with testing
✅ Ready to train staff
✅ Ready to go live

---

## 🚨 IF SOMETHING FAILS

### If Migration Doesn't Run

1. Check Supabase error message
2. Verify table dependencies exist
3. Verify no duplicate table names
4. Run verification queries above
5. Check migration file for syntax

### If Settings Page Returns 404

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R)
3. Check server logs for errors
4. Verify code deployed correctly

### If Email Account Add Fails

1. Check browser console for errors
2. Check Network tab for API errors
3. Verify OAuth credentials configured
4. Check auth session valid

### If Email Doesn't Log

1. Check email_logs table exists (Test above)
2. Verify event was created
3. Check server logs for errors
4. Verify user has email account

---

## 📝 DOCUMENTATION TO REFERENCE

- **START_HERE_DEPLOYMENT.md** - Quick overview
- **DEPLOY_NOW_QUICK_GUIDE.md** - 3-step deployment
- **MIGRATION_FIXES_DEPLOYMENT_GUIDE.md** - Detailed migration info
- **PHASE_4_COMPLETE_28_TESTS.md** - All 28 test cases

---

## ✅ WHEN READY FOR PRODUCTION

After all verifications pass:

1. ✅ Run migrations (done)
2. ✅ Deploy code (done)
3. ✅ Run smoke tests (done)
4. ☐ Run 28 test cases (optional)
5. ☐ Fix any issues (if needed)
6. ☐ Train staff
7. ☐ Go live!

---

**GT GROUP CRM**
**VERIFICATION GUIDE**
**Ready to Deploy**
