# 🚀 Dual Email System - Deployment Guide

## ✅ STATUS: IMPLEMENTATION COMPLETE

All code, APIs, migrations, and UI are **ready to deploy**. This guide shows exactly what to do next.

---

## 📋 What Was Implemented

### 1. **Dual Email Architecture**

- **CRM Email** (System-managed by Admin)
  - e.g., `firstname@gtgroup.com`
  - Mandatory for each user
  - Primary by default
  - Used for: Internal notifications, official documents, payments

- **Gmail Account** (User's personal Gmail)
  - e.g., `jiyoung423@gmail.com`
  - Optional - authorized via Google OAuth
  - Used for: Calendar invites, meeting links, external comms

### 2. **Admin Controls (Super Admin in User Management)**

```
When editing a user in /settings/users:

📧 Email Accounts Section:
├── CRM Email: [john@gtgroup.com] ← Admin types this
│   └─ Primary (System email)
├── Gmail: [Not Connected] [Connect Gmail →] ← Optional OAuth
│   └─ Click button to authorize user's Gmail
├── Actions: [Set Primary] [Remove]
└─ Support for multiple emails per user
```

### 3. **Email Routing (Admin Policy Configuration)**

```
In /settings/email-policies:
Admin can set rules like:
├─ Calendar Invites → Use Gmail Account
├─ Meeting Notifications → Use Gmail Account
├─ Official Documents → Use CRM Email
├─ Payment Records → Use CRM Email
└─ Custom rules for any work type
```

### 4. **Backend Infrastructure**

- ✅ Migration 016: `user_email_accounts` table (stores 2 emails per user)
- ✅ Migration 017: `email_logging` table (audit trail)
- ✅ Migration 018: `email_policies` tables (routing rules)
- ✅ API Routes: `/api/admin/users/[id]/emails` (CRUD operations)
- ✅ OAuth Callback: `/api/auth/google-oauth-callback`
- ✅ RLS Policies: Secure row-level access control

---

## 🔧 DEPLOYMENT STEPS

### STEP 1: Set Up Google OAuth Environment Variables

You need Google OAuth credentials. If you don't have them, get them from Google Cloud Console:

**File: `.env.local`** (in project root)

```env
# Google OAuth for Email Account Management
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID_HERE
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/google-oauth-callback
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET_HERE
```

**How to get Google OAuth credentials:**

1. Go to https://console.cloud.google.com/
2. Create new OAuth 2.0 Credentials (OAuth Client ID - Web Application)
3. Authorized Redirect URIs:
   - `http://localhost:3002/api/auth/google-oauth-callback` (dev)
   - `https://yourdomain.com/api/auth/google-oauth-callback` (prod)
4. Copy Client ID and Client Secret to `.env.local`

### STEP 2: Deploy Migrations to Supabase

Run these 3 migrations in order:

**Option A: Using Supabase Dashboard**

1. Go to Supabase Dashboard → Your Project → SQL Editor
2. Run each migration file one by one:
   - `supabase/migrations/016_user_email_accounts.sql`
   - `supabase/migrations/017_email_logging.sql`
   - `supabase/migrations/018_email_policies.sql`

**Option B: Using CLI**

```bash
cd your-project
supabase migration deploy
```

**Verify migrations succeeded:**

- Check Supabase dashboard → Database → Tables
- You should see: `user_email_accounts`, `email_logging`, `email_policies`

### STEP 3: Test on Localhost

1. **Start development server:**

   ```bash
   npm run dev
   ```

   Access: http://localhost:3002

2. **Test User Management (Super Admin only):**
   - Go to `/settings/users`
   - Click "Add User" to create new user
   - Add CRM Email: `john@gtgroup.com`
   - Click "Connect Gmail" → Authorize with your Gmail
   - Verify both emails appear in the user's email accounts section

3. **Test Email Operations:**
   - ✅ Add CRM Email
   - ✅ Connect Gmail via OAuth
   - ✅ Set Primary Email
   - ✅ Remove Gmail (not CRM)
   - ✅ View email verification status

4. **Test Email Policies:**
   - Go to `/settings/email-policies`
   - Create a policy: "Calendar Invites → Use Gmail"
   - Verify policy saves successfully

### STEP 4: Deploy to Production

1. **Update .env.production with:**

   ```env
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_PROD_CLIENT_ID
   NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google-oauth-callback
   GOOGLE_CLIENT_SECRET=YOUR_PROD_SECRET
   ```

2. **Deploy code:**

   ```bash
   npm run build
   # Deploy to your hosting (Vercel, etc.)
   ```

3. **Verify migrations already ran on production Supabase**

---

## 📖 How It Works - User Journey

### For Super Admin:

```
1. Visit /settings/users
2. Edit or Create User "John Doe"
3. Set CRM Email: john@gtgroup.com
4. Click "Connect Gmail" → Opens Google OAuth
5. John authorizes his Gmail (jdoe@gmail.com)
6. Admin sees both emails in user detail:
   ├─ john@gtgroup.com (CRM, Primary)
   └─ jdoe@gmail.com (Gmail, ✓ Connected)
7. Visit /settings/email-policies
8. Set rule: Calendar Invites → jdoe@gmail.com
9. When calendar event created → Email sent from Gmail
10. When notification sent → Email sent from CRM Email
```

### Automatic Behavior:

```
When event created:
├─ Check email_policies table for matching rule
├─ If rule says use Gmail → Send from user's Gmail
├─ If rule says use CRM → Send from user's CRM Email
├─ If no rule → Use primary email (usually CRM)
└─ Log email sent in email_logging table
```

---

## 🔐 Security Features

✅ **Row-Level Security (RLS)** - Users can only see their own emails
✅ **Gmail OAuth** - Tokens are encrypted, only accessing needed scopes

✅ **Email Policies** - Super Admin only, audit logged
✅ **Verification** - CRM emails verified by Admin, Gmail by OAuth

---

## 📊 Database Schema

### user_email_accounts (New Table)

```sql
id                   UUID (Primary Key)
user_id              UUID (FK to auth.users)
staff_id             UUID (FK to users)
email                VARCHAR (The actual email address)
email_type           ENUM ('crm', 'gmail', 'office')
is_primary           BOOLEAN (True = use by default)
is_verified          BOOLEAN
verified_at          TIMESTAMP
oauth_token          TEXT (Google access token)
oauth_refresh_token  TEXT (For token refresh)
oauth_expires_at     TIMESTAMP
created_at, updated_at, last_used_at
```

### email_policies (New Table)

```sql
id                 UUID
policy_name        VARCHAR
policy_type        VARCHAR
rules              JSONB (Flexible JSON rules)
emails             UUID[] (Which emails affected)
created_by         UUID (Super Admin)
is_active          BOOLEAN
```

### email_logging (New Table)

```sql
id                 UUID
user_id            UUID
email_address      VARCHAR (Which email was used)
recipient          VARCHAR
subject, body      TEXT
status             VARCHAR (sent, failed, bounced)
attempts           INT
error_message      TEXT
policy_id          UUID (Which policy triggered)
created_at, updated_at
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] All 3 migrations ran successfully
- [ ] `user_email_accounts` table exists in Supabase
- [ ] `email_policies` table exists in Supabase
- [ ] `email_logging` table exists in Supabase
- [ ] Environment variables set (.env.local and production)
- [ ] Can create user with CRM Email at /settings/users
- [ ] Can authorize Gmail account via OAuth
- [ ] Can see both emails in user's email accounts
- [ ] Can set primary email
- [ ] Can create email policy at /settings/email-policies
- [ ] Email policies are saved to database
- [ ] RLS policies allow Super Admin to read all emails

---

## 🐛 Troubleshooting

**Issue: "Table user_email_accounts does not exist"**

- Solution: Run migrations manually in Supabase SQL editor

**Issue: OAuth redirect fails**

- Solution: Check Google OAuth credentials in .env.local
- Verify redirect URI matches Google Cloud Console exactly

**Issue: Can't set primary email**

- Solution: Check RLS policies in Supabase
- Ensure user has Super Admin role

**Issue: Email not sending from correct address**

- Solution: Verify email_policies are configured
- Check email_logging table to see which email was used

---

## 📝 Next Steps

1. ✅ Deploy migrations to Supabase
2. ✅ Set Google OAuth environment variables
3. ✅ Test on localhost:3002
4. ✅ Deploy to production
5. ✅ Configure email routing policies in /settings/email-policies
6. ✅ Begin using dual email system for events

---

**Everything is ready. Just deploy the migrations and set the env variables. You're good to go! 🎉**
