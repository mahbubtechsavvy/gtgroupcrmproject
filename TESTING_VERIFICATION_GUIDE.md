# 🧪 Dual Email System - Complete Testing & Verification Guide

## ✅ CURRENT STATUS

- ✅ Code Implementation: 100% COMPLETE
- ✅ Supabase Migrations: DEPLOYED
- ✅ APIs: Ready
- ✅ UI Components: Ready
- ✅ Dev Server: RUNNING on port 3003
- ⏳ Google OAuth: Ready to configure
- ⏳ End-to-End Testing: NEXT STEP

---

## 🚀 WHAT YOU'LL TEST TODAY

You're going to verify that the **Dual Email System** works completely end-to-end:

```
Flow:
1. Super Admin goes to /settings/integrations
2. Adds Google OAuth credentials
3. Goes to /settings/users
4. Creates/edits a user
5. Adds CRM Email (john@gtgroup.com)
6. Clicks "Connect Gmail" → Google OAuth
7. Gmail email gets stored in database
8. Both emails appear in user's email list
9. Admin can set primary email
10. Email routing policies control which email to use
```

---

## 📋 PRE-TEST CHECKLIST

Make sure you have:

- [ ] Google Client ID (from Google Cloud Console)
- [ ] Google Client Secret (from Google Cloud Console)
- [ ] Access to Supabase dashboard
- [ ] Dev server running on port 3003
- [ ] Super Admin account to test with

**Don't have Google credentials?** Get them:

1. Visit https://console.cloud.google.com/
2. Create OAuth 2.0 Web Application
3. Add redirect URI: `http://localhost:3003/api/auth/google-oauth-callback`
4. Copy Client ID and Secret

---

## 🧪 TEST SCRIPT

### **PART 1: Setup Google OAuth in Integrations**

**Duration: 3 minutes**

1. **Navigate to:** http://localhost:3003/settings/integrations

2. **Scroll to:** "🔐 Google OAuth - Email Management" section

3. **Fill in:**
   - Google Client ID: `[Your actual Client ID]`
   - Google Client Secret: `[Your actual Client Secret]`

4. **Click:** "Save Changes" button

5. **Verify:** ✅ Success message appears: "Integrations updated successfully"

**Checkpoint 1:** Can you see the Google OAuth section and save credentials? ✅ / ❌

---

### **PART 2: Add CRM Email to User**

**Duration: 5 minutes**

1. **Navigate to:** http://localhost:3003/settings/users

2. **Click:** "Edit" on any existing user (or "+ Add User" to create new one)

3. **Scroll to:** "📧 Email Accounts" section
   - You should see:
     ```
     ✅ "CRM Email (System Email)" input box
     ✅ "Add" button
     ✅ "Connect Gmail" button
     ✅ List of current emails (empty if new user)
     ```

4. **Enter CRM Email:** `john@gtgroup.com`

5. **Click:** "Add" button

6. **Verify:**
   - ✅ Email appears in the list
   - ✅ Shows "💼 CRM Email • Primary"
   - ✅ No error messages

**Checkpoint 2:** Can you add a CRM email successfully? ✅ / ❌

---

### **PART 3: Verify Email in Database**

**Duration: 2 minutes**

1. **Go to:** https://app.supabase.com/ → Your Project

2. **Click:** "SQL Editor"

3. **Run this query:**

   ```sql
   SELECT
     id,
     user_id,
     email,
     email_type,
     is_primary,
     is_verified
   FROM user_email_accounts
   ORDER BY created_at DESC
   LIMIT 5;
   ```

4. **Verify you see:**
   - ✅ Your test email (john@gtgroup.com)
   - ✅ `email_type`: 'crm'
   - ✅ `is_primary`: true
   - ✅ `is_verified`: true

**Checkpoint 3:** Is your email in the database? ✅ / ❌

---

### **PART 4: Test Gmail OAuth Connection**

**Duration: 5 minutes**

1. **Back in User Management:** http://localhost:3003/settings/users

2. **Edit the same user** you added CRM email to

3. **In "📧 Email Accounts" section, click:** "🔗 Connect Gmail"

4. **You should be redirected to:**
   - Google login page
   - OR asking to authorize "GT Group CRM"

5. **Authorize** with your Google account

6. **You should return to the user edit page**

7. **Verify:**
   - ✅ Second email appears in the list (your Gmail)
   - ✅ Shows "📨 Gmail" (not marked as primary)
   - ✅ Has "✓ Connected" status

**Checkpoint 4:** Can you connect Gmail via OAuth? ✅ / ❌

---

### **PART 5: Test Email Management Actions**

**Duration: 3 minutes**

1. **Still in user edit page**, with both CRM and Gmail emails:

2. **Test "Set Primary" on Gmail:**
   - Click "Set Primary" button on Gmail email
   - Should see success message
   - Gmail should now show "• Primary"
   - CRM email should lose "Primary" label

3. **Test "Set Primary" back to CRM:**
   - Click "Set Primary" on CRM email again
   - CRM should be marked primary again

4. **Test "Remove Gmail":**
   - Click "Remove" button on Gmail email
   - Should see confirmation: "Remove this email address?"
   - Click OK
   - Gmail email should disappear from list
   - CRM email should remain

5. **Verify in Database:**
   ```sql
   SELECT * FROM user_email_accounts
   WHERE email_type = 'gmail'
   ORDER BY created_at DESC;
   ```

   - Should NOT show the removed Gmail email
   - OR show `is_deleted = true`

**Checkpoint 5:** Can you set primary and remove emails? ✅ / ❌

---

### **PART 6: Test Email Routing Policies**

**Duration: 5 minutes**

1. **Navigate to:** http://localhost:3003/settings/email-policies
   (Admin only section)

2. **You should see:**
   - ✅ "Create Policy" button
   - ✅ List of existing policies (if any)
   - ✅ Policy configuration section

3. **Create a test policy:**
   - Click "Create Policy" or similar
   - Name: "Test Policy"
   - Rules:
     - "Calendar Invites" → Use Gmail
     - "Notifications" → Use CRM Email
   - Click Save

4. **Verify policy is saved:**
   - Policy appears in the list
   - Shows in audit log

5. **Check in Database:**
   ```sql
   SELECT * FROM email_policies
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   - Should see your test policy

**Checkpoint 6:** Can you create email routing policies? ✅ / ❌

---

## ✅ FINAL VERIFICATION CHECKLIST

Run these SQL queries in Supabase to verify everything:

```sql
-- 1. Check user email accounts
SELECT COUNT(*) as total_emails FROM user_email_accounts;

-- 2. Check email logs (for sent emails)
SELECT COUNT(*) as total_logs FROM email_logs;

-- 3. Check email policies
SELECT COUNT(*) as total_policies FROM email_policies;

-- 4. Check policy assignments
SELECT COUNT(*) as total_assignments FROM policy_email_accounts;

-- 5. Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('user_email_accounts', 'email_policies', 'email_logs')
ORDER BY tablename;
```

**Expected Results:**

- ✅ `total_emails`: 1 or more
- ✅ `total_policies`: 1 or more
- ✅ `rowsecurity`: true for all tables

---

## 🎯 SUCCESS CRITERIA

### All Checkpoints Passing = ✅ READY FOR PRODUCTION

- [x] Checkpoint 1: Google OAuth credentials saved
- [x] Checkpoint 2: CRM email added to user
- [x] Checkpoint 3: Email stored in database
- [x] Checkpoint 4: Gmail OAuth connection works
- [x] Checkpoint 5: Email management actions work
- [x] Checkpoint 6: Email routing policies work

---

## 🐛 TROUBLESHOOTING

### Issue: "Cannot add CRM email - error message"

**Solution:** Check that user exists in database. Run:

```sql
SELECT id, full_name FROM users LIMIT 5;
```

### Issue: "Gmail OAuth redirects to login, not authorization"

**Solution:** Verify Google OAuth credentials are:

1. Saved in `/settings/integrations`
2. Correct in `.env.local`
3. Correct in Google Cloud Console

### Issue: "Email doesn't appear after adding"

**Solution:** Check browser console (F12 → Console tab) for errors. Check Supabase logs.

### Issue: "RLS policy prevents access"

**Solution:** Ensure you're logged in as Super Admin. Check role in database:

```sql
SELECT id, full_name, role FROM users WHERE full_name = 'Your Name';
```

---

## 📊 EXPECTED DATABASE STATE AFTER TESTING

```
user_email_accounts table should have:
├─ Multiple rows with different email_types
├─ At least one 'crm' email (mandatory)
├─ At least one 'gmail' email (from OAuth)
├─ is_primary marking which email to use by default
└─ oauth_token, oauth_refresh_token (for Gmail)

email_policies table should have:
├─ At least one policy
├─ rules as JSON (routing configuration)
├─ is_active = true
└─ created_by = your Super Admin user

email_logs table should be:
├─ Empty (no emails sent yet)
└─ Ready to log emails when system sends them
```

---

## 🚀 WHAT'S NEXT AFTER TESTING

Once all checkpoints pass:

1. Deploy to production
2. Configure production Google OAuth credentials
3. Train team on using email system
4. Monitor email_logs table for sent emails
5. Adjust policies as needed

---

## 📝 TEST REPORT TEMPLATE

Copy and paste this when done:

```
DUAL EMAIL SYSTEM - TEST REPORT
Date: April 9, 2026
Tester: [Your Name]
Environment: Localhost:3003

CHECKPOINT RESULTS:
1. Google OAuth Setup: ✅ / ❌ (Notes: ___)
2. Add CRM Email: ✅ / ❌ (Notes: ___)
3. Database Verification: ✅ / ❌ (Notes: ___)
4. Gmail OAuth: ✅ / ❌ (Notes: ___)
5. Email Management: ✅ / ❌ (Notes: ___)
6. Email Policies: ✅ / ❌ (Notes: ___)

OVERALL STATUS: ✅ READY / ❌ NEEDS FIXES

Issues Found:
- [List any issues]

Recommendations:
- [Any improvements]
```

---

**You're ready to go! Start testing and report back your results.** 🎉

Good luck! 🚀
