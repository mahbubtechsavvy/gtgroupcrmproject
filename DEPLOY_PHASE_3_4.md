# 🚀 DEPLOY PHASE 3 & 4 - DEPLOYMENT INSTRUCTIONS

**Date:** April 9, 2026
**Status:** Ready for Deployment
**Target:** Staging Environment

---

## ⚠️ IMPORTANT: Migration Execution Order

**Phase 3 & 4 require migrations to be run IN ORDER:**

1. ✅ Migration 016: `user_email_accounts` (Phase 3)
2. ✅ Migration 017: `email_logs` (Phase 4)

Migration 017 references tables created in Migration 016, so 016 MUST run first.

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before deploying, verify:

- [ ] Database backup created
- [ ] Git branch saved/committed
- [ ] `.env` file has Supabase credentials
- [ ] Node.js 18+ installed
- [ ] No active users on staging

---

## 🚀 DEPLOYMENT STEPS

### Step 1: Verify Database Connection

```bash
# Navigate to project
cd "d:\GT CRM WEB PROJECT\gtgroupcrmproject"

# Test connection (optional, Supabase CLI)
npx supabase projects list
```

### Step 2: Execute Migration 016 (Phase 3 - Email Accounts Table)

**Option A: Using Supabase Dashboard (RECOMMENDED)**

1. Go to: https://app.supabase.com → Select project
2. Navigate to: SQL Editor
3. Copy contents of `supabase/migrations/016_user_email_accounts.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Wait for success message

**Option B: Using CLI**

```bash
npx supabase migration up --ref <project-ref>
```

**Expected Result:**

- ✅ Table `user_email_accounts` created
- ✅ Email type enum created
- ✅ Indexes created (4 indexes)
- ✅ RLS policies applied
- ✅ Trigger created

### Step 3: Verify Migration 016 Success

In Supabase Dashboard SQL Editor:

```sql
-- Verify table created
SELECT * FROM information_schema.tables
WHERE table_name = 'user_email_accounts';

-- Should return 1 row
```

### Step 4: Execute Migration 017 (Phase 4 - Email Logging Table)

**Option A: Using Supabase Dashboard (RECOMMENDED)**

1. Go to: SQL Editor
2. Copy contents of `supabase/migrations/017_email_logging.sql`
3. Paste into SQL Editor
4. Click "Run"
5. Wait for success message

**Option B: Using CLI**

```bash
npx supabase migration up --ref <project-ref>
```

**Expected Result:**

- ✅ Table `email_logs` created
- ✅ Indexes created (7 indexes)
- ✅ RLS policies applied
- ✅ Trigger created
- ✅ Columns added to `tasks` table (email_invite_sent, email_sent_at, email_sent_to_count)

### Step 5: Verify Migration 017 Success

In Supabase Dashboard SQL Editor:

```sql
-- Verify email_logs table created
SELECT * FROM information_schema.tables
WHERE table_name = 'email_logs';

-- Should return 1 row

-- Verify tasks table has new columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tasks'
AND column_name IN ('email_invite_sent', 'email_sent_at', 'email_sent_to_count');

-- Should return 3 rows
```

---

## 💻 DEPLOY CODE TO STAGING

### Step 6: Build & Deploy

```bash
# Install dependencies (if not already done)
npm install

# Build project
npm run build

# If build successful, deploy to Staging
# Option 1: Vercel deployment
vercel deploy --prod

# Option 2: Manual deployment
npm start
```

### Step 7: Verify Code Deployment

Test the following endpoints:

**Email Account Management (Phase 3):**

```bash
# Test email account API
curl -X POST http://localhost:3000/api/email-account/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"email":"test@gmail.com","accountType":"gmail"}'

# Expected: 200 OK
```

**Email Sending (Phase 4):**

```bash
# Test email sending API
curl -X POST http://localhost:3000/api/send-event-emails \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId":"test-id",
    "eventData":{"title":"Test","date":"2026-04-10","time":"14:00"},
    "recipientEmails":["user@example.com"],
    "userId":"test-user-id"
  }'

# Expected: 200 OK with email_logs entries
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Verify Settings Page Loads (Phase 3)

1. Go to: `http://localhost:3000/settings`
2. Should see: "Email Accounts" section
3. Should see: "Add Email Account" button
4. Should see: OAuth connection option for Gmail

### Verify Email History Page Loads (Phase 4)

1. Go to: `http://localhost:3000/settings/email-history`
2. Should see: Statistics cards (Total, Sent, Failed, Pending)
3. Should see: Filter controls
4. Should see: Email list (empty is OK for new setup)

### Test Event Email Creation (Integration Test)

1. Go to: Dashboard → Events tab
2. Create new event:
   - Title: "Deployment Test Event"
   - Date: Tomorrow
   - Recipients: Select staff
3. Click "Create Event"
4. Check email alert message
5. Go to: Settings → Email History
6. Verify email logged in list

---

## 🔍 TROUBLESHOOTING

### Migration 016 Error: "relation "staff" does not exist"

**Solution:** Migration 001-015 must be executed first. Check if base schema exists.

### Migration 017 Error: "relation "user_email_accounts" does not exist"

**Solution:** Migration 016 didn't run successfully. Execute it first, then 017.

### Code Build Error: "Cannot find module"

**Solution:** Run `npm install` to install dependencies

### Settings Page Shows 404

**Solution:** Code not deployed yet. Run `npm run build && npm start`

### Email History Page Blank

**Solution:** Normal if no events created yet. Create an event to populate.

---

## 📊 MIGRATION VERIFICATION QUERIES

Run in Supabase SQL Editor:

```sql
-- Check Migration 016 tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'user_email_accounts';

-- Check Migration 016 indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'user_email_accounts';

-- Check Migration 017 tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'email_logs';

-- Check Migration 017 indexes
SELECT indexname FROM pg_indexes
WHERE tablename = 'email_logs';

-- Check tasks table new columns
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'tasks'
ORDER BY ordinal_position;
```

---

## 🚀 ROLLBACK PLAN

If deployment fails and needs to rollback:

```sql
-- Drop Migration 017
DROP TABLE IF EXISTS email_logs CASCADE;

-- Drop Migration 016
DROP TABLE IF EXISTS user_email_accounts CASCADE;
DROP TYPE IF EXISTS email_account_type CASCADE;
```

**Note:** Rollback will lose any logged emails. Consider backup first.

---

## ✨ SUCCESS INDICATORS

Phase 3 & 4 deployment is successful when:

✅ Both migrations execute without errors
✅ Settings page shows email account section
✅ Email History page displays
✅ Create event triggers email log entry
✅ Email history shows created emails
✅ No console errors in browser
✅ No server errors in logs

---

## 📞 NEXT STEPS AFTER DEPLOYMENT

After Phase 3 & 4 deployed successfully:

1. **Run Testing Suite:** Execute 28 tests from PHASE_4_TESTING_GUIDE.md
2. **Train Team:** Show staff how to manage email accounts
3. **Monitor Logs:** Watch for email sending errors
4. **Start Phase 5:** Implement admin email policies

---

## 📝 DEPLOYMENT LOG

**Deployment Date:** ****\_\_\_****
**Deployed By:** ****\_\_\_****
**Environment:** ☐ Development ☐ Staging ☐ Production

**Migration 016 Status:** ☐ Success ☐ Failed
**Migration 017 Status:** ☐ Success ☐ Failed
**Code Deployment:** ☐ Success ☐ Failed

**Issues Found:**

1. ***
2. ***

**Approval:** ✅ Ready to proceed / ❌ Blocked

---

**PHASE 3 & 4 DEPLOYMENT GUIDE**
**Status: Ready for Use**
**Last Updated: April 9, 2026**
