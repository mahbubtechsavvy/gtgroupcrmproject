# 🔐 Google OAuth Setup - Complete Troubleshooting Guide

## ❌ ERROR: "Error 401: invalid_client"

This error means **Google doesn't recognize your OAuth credentials**. Here's how to fix it:

---

## ✅ FIX #1: Verify Your Google Cloud Console Setup

### Step 1: Go to Google Cloud Console

Visit: https://console.cloud.google.com/

### Step 2: Check Your Project

1. Click **Project Name** (top left)
2. You should see your "GT Group CRM" project
3. If you don't see it, you may be in the wrong project - switch to it

### Step 3: Verify APIs are Enabled

1. Go to **APIs & Services** → **Enabled APIs & services**
2. You should see:
   - ✅ Gmail API (enabled)
   - ✅ Google Calendar API (enabled)
   - ✅ People API (enabled)

   If **NOT enabled**, enable them now:
   - Search for each API
   - Click ENABLE

### Step 4: Check OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Look for "OAuth 2.0 Client IDs"
3. You should see one named "GT Group CRM Email"
4. **Click it to view details**

### Step 5: Verify Redirect URIs Match

Your **Authorized redirect URIs** in Google Console **MUST** match EXACTLY:

```
http://localhost:3002/api/auth/google-oauth-callback
http://localhost:3000/api/auth/google-oauth-callback
http://localhost:3003/api/auth/google-oauth-callback
```

⚠️ **IMPORTANT:** Add ALL three (your dev server might be on any of these ports)

If they don't match:

1. Click **Edit** on your OAuth credential
2. Scroll to "Authorized redirect URIs"
3. Add the missing URIs
4. Click **SAVE**

---

## ✅ FIX #2: Get Fresh Credentials

If the above didn't work, **delete and recreate** your OAuth credential:

### Delete Old Credential:

1. Go to **APIs & Services** → **Credentials**
2. Find your "GT Group CRM Email" credential
3. Click the **Trash icon** to delete it
4. Confirm deletion

### Create New Credential:

1. Click **+ CREATE CREDENTIALS**
2. Choose **OAuth client ID**
3. Application type: **Web application**
4. Name: "GT Group CRM Email"
5. Authorized JavaScript origins:
   - `http://localhost`
   - `http://localhost:3000`
   - `http://localhost:3003`
6. Authorized redirect URIs: Add these exactly:
   ```
   http://localhost:3002/api/auth/google-oauth-callback
   http://localhost:3000/api/auth/google-oauth-callback
   http://localhost:3003/api/auth/google-oauth-callback
   ```
7. Click **CREATE**

### Copy Your New Credentials:

- **Client ID**: `xxxx.apps.googleusercontent.com`
- **Client Secret**: `xxxx-xxxxxxxxxxxxxxxx`

---

## ✅ FIX #3: Enter Credentials in CRM

1. **Open:** http://localhost:3003/settings/integrations

2. **Scroll to:** "🔐 Google OAuth - Email Management"

3. **Enter:**
   - Google Client ID: `[Your NEW Client ID]`
   - Google Client Secret: `[Your NEW Client Secret]`

4. **Click:** "Save Changes"

5. **Verify:** Green success message appears

---

## ✅ FIX #4: Verify in Supabase

Go to Supabase → SQL Editor and run:

```sql
SELECT key, value FROM app_settings
WHERE key IN ('google_client_id', 'google_client_secret')
LIMIT 10;
```

You should see:

```
google_client_id    | 123456789-abcdefghijklmnop.apps.googleusercontent.com
google_client_secret| GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

---

## ✅ FIX #5: Test the OAuth Flow

1. **Restart dev server** (if any changes were made):

   ```bash
   Ctrl+C to stop
   npm run dev
   ```

2. **Go to User Management:** http://localhost:3003/settings/users

3. **Edit a user** and click "🔗 Connect Gmail"

4. **Expected Flow:**
   - ✅ Redirects to Google login page
   - ✅ Ask to authorize "GT Group CRM"
   - ✅ Returns to user edit page with Gmail email added
   - ✅ Shows `email_type: 'gmail'`
   - ✅ No error messages

---

## 🔍 DEBUGGING: Check Browser Console

If still getting errors:

1. Open **Developer Tools** (F12 in browser)
2. Click **Console** tab
3. Look for error messages
4. Common errors:

### Error: "redirect_uri_mismatch"

**Means:** Redirect URI doesn't match Google Console
**Fix:** Check step 5 above - URIs must match EXACTLY

### Error: "invalid_client"

**Means:** Client ID or Secret is wrong
**Fix:** Copy the EXACT values from Google Console

### Error: "invalid_scope"

**Means:** Requesting wrong permissions
**Fix:** Check `/src/lib/googleOAuth.js` for scope setup

---

## 📋 VERIFICATION CHECKLIST

Before trying OAuth again, verify:

- [ ] Google Cloud project exists
- [ ] Gmail API is ENABLED
- [ ] Google Calendar API is ENABLED
- [ ] People API is ENABLED
- [ ] OAuth credential exists ("Web application")
- [ ] Redirect URIs include `http://localhost:3003/api/auth/google-oauth-callback`
- [ ] Client ID is copied correctly to Integrations page
- [ ] Client Secret is copied correctly to Integrations page
- [ ] Both credentials are saved in Supabase
- [ ] Dev server restarted after saving

---

## ✅ IF ALL ELSE FAILS

### Option A: Delete Everything & Start Fresh

1. In Google Console, delete the OAuth credential
2. Create a NEW OAuth credential from scratch
3. Copy NEW credentials to Integrations page
4. Restart dev server
5. Test again

### Option B: Check Project Permissions

1. Go to **Google Cloud Console**
2. Check that you have permission to create OAuth credentials
3. If not, ask your Google Workspace admin to grant permission

### Option C: Use Service Account Instead

If personal Google account OAuth doesn't work, use a **Service Account**:

1. Go to **APIs & Services** → **Service Accounts**
2. Create new Service Account
3. Generate JSON key
4. Use in Integrations page under "Google Service Account JSON"

This is more reliable for production.

---

## 🎯 NEXT STEPS

Once OAuth is working:

1. ✅ Add CRM Email to user
2. ✅ Click "Connect Gmail"
3. ✅ Complete Google authorization
4. ✅ Gmail email appears in user profile
5. ✅ Test email routing policies
6. ✅ System ready for production

---

**Follow this guide step-by-step. Most issues are resolved by matching redirect URIs exactly.** 🚀
