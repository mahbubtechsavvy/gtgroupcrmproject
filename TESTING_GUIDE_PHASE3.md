# GT CRM Chat System - Testing Guide (Phase 3)

**Prepared**: May 12, 2026  
**Scope**: Component Integration & End-to-End Verification  
**Status**: Ready for QA

---

## 🎯 Test Objectives

By the end of this testing session, verify:

1. ✅ All 7 modular components render correctly
2. ✅ Real-time message delivery works
3. ✅ File attachment flow is operational
4. ✅ Translation action (when API key added)
5. ✅ Browser notifications function properly
6. ✅ Offline mode detection and UI updates
7. ✅ RLS policies prevent unauthorized access

---

## 🚀 Pre-Testing Setup

### 1. Start Development Server

```bash
cd d:\GT CRM WEB PROJECT\gtgroupcrmproject
npm run dev
```

- Server runs on: `http://localhost:3005`
- Watch console for errors

### 2. Open Browser DevTools

- **F12** or **Right-click → Inspect**
- Monitor:
  - Console tab for errors/warnings
  - Network tab for API requests
  - Application tab for storage/cookies

### 3. Browser Console Commands

```javascript
// Check auth session
const {
  data: { session },
} = await supabase.auth.getSession();
console.log(session);

// Test realtime subscription
const channel = supabase
  .channel("test")
  .on("message", { event: "test" }, (msg) => console.log("Received:", msg))
  .subscribe();
```

### 4. Create Test Users

- Have at least 2 browser windows/profiles with different users
- Or use incognito windows for separate sessions
- **Tip**: Use Chrome profiles for persistent sessions

---

## 📝 Test Cases

### Test Suite 1: Component Rendering

#### T1.1: Chat Page Loads

**Steps**:

1. Navigate to `http://localhost:3005/chat`
2. Observe page layout

**Expected Results**:

- ✅ ChatShell.jsx renders (main container)
- ✅ ChatSidebar.jsx visible (left panel)
- ✅ Chat header visible (top bar)
- ✅ Message list visible (empty state)
- ✅ Message input visible (bottom)
- ✅ Details panel visible on XL screen (desktop)
- ✅ No console errors

**Console Check**:

```javascript
// Verify components mounted
document.querySelector('[class*="sidebar"]'); // ChatSidebar
document.querySelector('[class*="chatHeader"]'); // ChatHeader
document.querySelector('[class*="messageList"]'); // MessageList
document.querySelector('[class*="inputArea"]'); // MessageInput
```

---

#### T1.2: Sidebar Groups Load

**Steps**:

1. Chat page loaded
2. Look at "Channels" section in sidebar
3. Wait for groups to load

**Expected Results**:

- ✅ List of groups/channels displays
- ✅ Each group has:
  - Hash icon (GroupItem.jsx)
  - Group name
  - Group type badge (dept/team/project)
  - General channel indicator (if applicable)
- ✅ Groups are clickable
- ✅ Network tab shows successful request to `/api/chat/groups?userId=...`

---

#### T1.3: Sidebar Direct Messages Load

**Steps**:

1. Look at "Direct Messages" section
2. Wait for conversations to load

**Expected Results**:

- ✅ List of recent DM conversations
- ✅ Each DM shows:
  - User avatar or initial (DMItem.jsx)
  - User name
  - Last message preview
  - Timestamp
- ✅ Conversations are clickable
- ✅ Network tab shows `/api/chat/conversations?userId=...` request

---

#### T1.4: Channel Selection Changes Header

**Steps**:

1. Click on a group channel
2. Observe ChatHeader.jsx update
3. Click on a DM conversation
4. Observe header change

**Expected Results**:

- ✅ Active channel highlights in sidebar
- ✅ Header shows channel name and icon
- ✅ Header shows participant count (groups) or online status (DMs)
- ✅ Action buttons (Search, Call, Info) display correctly
- ✅ Context panel updates with channel info (desktop)

---

### Test Suite 2: Real-Time Messaging

#### T2.1: Send Message in Group (Same User)

**Steps**:

1. Select a group channel
2. Click message input
3. Type: "Test message from single user"
4. Press Enter or click Send
5. Observe console for API calls

**Expected Results**:

- ✅ Input field clears
- ✅ Message appears in message list (MessageBubble.jsx)
- ✅ Message shows correct sender name
- ✅ Timestamp displays correctly
- ✅ Network tab shows POST to `/api/chat/groups/[id]/messages`
- ✅ Read receipt shows single ✓ (own message)
- ✅ No errors in console

**API Response Check**:

```json
{
  "id": "uuid",
  "group_id": "uuid",
  "sender_id": "uuid",
  "content": "Test message from single user",
  "message_type": "text",
  "created_at": "2026-05-12T..."
}
```

---

#### T2.2: Send Message Between Two Users (Real-time)

**Steps**:

1. Open 2 browser tabs/windows with different users
2. In Tab 1: Select same group channel
3. In Tab 2: Select same group channel
4. In Tab 1: Send message "Hello from User 1"
5. Watch Tab 2 for message to appear

**Expected Results**:

- ✅ Message appears in Tab 1 immediately
- ✅ Message appears in Tab 2 within 1-2 seconds (real-time)
- ✅ Message shows correct sender (User 1)
- ✅ MessageBubble properly styles as "not own" message
- ✅ Hover actions appear on message (in Tab 2)
- ✅ Read receipt shows ✓ (single check)
- ✅ No console errors

**Real-time Verification**:

```javascript
// In browser console on Tab 2
// Should see realtime update in logs
supabase.channel("group:GROUP_ID").subscribe();
// Then send message from Tab 1
```

---

#### T2.3: Read Receipts Update

**Steps**:

1. Verify message from User 1 visible to User 2
2. In Tab 2: Hover over message
3. Check read receipt icon

**Expected Results**:

- ✅ Message initially shows ✓ (sent, not read)
- ✅ After User 2 views, should update to ✅ (read)
- ✅ Hover action menu appears (Reply, React, Translate, etc.)
- ✅ Check icon in MessageBubble is visible

---

#### T2.4: Send DM Message

**Steps**:

1. In Tab 1: Select a DM conversation
2. Send message: "Testing DM"
3. In Tab 2: Open same DM conversation
4. Verify message appears

**Expected Results**:

- ✅ Message sends to `/api/chat/conversations/[id]/messages`
- ✅ Message appears in recipient's chat
- ✅ Real-time delivery works for DMs
- ✅ Message type is correctly set (text/file)
- ✅ No mixing of group and DM messages

---

### Test Suite 3: File Attachments

#### T3.1: Upload Single File

**Steps**:

1. Select a group channel
2. Click paperclip icon (MessageInput.jsx)
3. Choose a test file (PDF, image, doc, etc.)
4. Observe file preview appears

**Expected Results**:

- ✅ File picker dialog opens
- ✅ File selected shows preview thumbnail:
  - Image files: actual preview
  - Other files: file icon
- ✅ File name visible
- ✅ File size displayed (e.g., "1.2 MB")
- ✅ Delete button appears on hover
- ✅ No API call yet (upload only on send)

**Preview Check**:

```javascript
// Check attachment state in React
// Should show: { file: File, name: '...', type: '...', size: ... }
```

---

#### T3.2: Upload Multiple Files

**Steps**:

1. Add first file (image)
2. Click paperclip again
3. Add second file (PDF)
4. Observe both in attachment preview area

**Expected Results**:

- ✅ Multiple files display in scrollable row
- ✅ Each has individual preview/icon
- ✅ Can delete individual files
- ✅ File metadata accurate for each

---

#### T3.3: Drag & Drop Files

**Steps**:

1. Drag a file from desktop/file explorer
2. Drop on message input area
3. Observe file is added to attachments

**Expected Results**:

- ✅ Drag over shows visual feedback (border highlight)
- ✅ Drop adds file to attachment list
- ✅ Works with multiple files at once
- ✅ Input area shows "drag active" styling

---

#### T3.4: Send Message with Attachment

**Steps**:

1. Add a file attachment
2. Type message text: "Here's the report"
3. Press Send
4. Monitor network tab
5. Check console for uploads

**Expected Results**:

- ✅ Attachment preview disappears
- ✅ Upload spinner shows (if `uploading=true` state)
- ✅ Network shows POST to `/api/chat/attachments` first
- ✅ Then POST to `/api/chat/groups/[id]/messages`
- ✅ Message appears with attachment link (MessageBubble.jsx)
- ✅ Attachment displays as:
  - File name link
  - File size (e.g., "2.1 MB")
  - Clickable to download
- ✅ Message type set to "file"
- ✅ No errors in console

**API Response Check - Attachments**:

```json
{
  "id": "uuid",
  "uploader_id": "uuid",
  "file_name": "report.pdf",
  "file_size": 2048000,
  "file_type": "application/pdf",
  "storage_path": "userId/1715507700000_report.pdf",
  "file_url": "https://...",
  "meta": { "original_name": "report.pdf" }
}
```

---

#### T3.5: Download Attachment

**Steps**:

1. Find message with attachment
2. Click on attachment link
3. Check for download

**Expected Results**:

- ✅ File downloads to Downloads folder
- ✅ File name matches original
- ✅ File is complete (size matches)
- ✅ No 403/404 errors in network tab
- ✅ Storage policy allows authenticated access

---

#### T3.6: Attachment-Only Message

**Steps**:

1. Add file attachment but no text
2. Press Send

**Expected Results**:

- ✅ Message sends successfully
- ✅ Message content shows "[File attachment]" placeholder
- ✅ Attachment displays normally
- ✅ Message type = "file"
- ✅ No validation error

---

### Test Suite 4: Translation (Phase 2 - Requires API Key)

#### T4.1: Check Translation UI

**Steps**:

1. Send or find a message with text
2. Hover over message to show actions

**Expected Results**:

- ✅ Hover menu shows options:
  - Reply (icon)
  - React (emoji)
  - Translate (languages icon) ← Target button
  - Edit (if own)
  - Delete (if own)
- ✅ Translate button is clickable

---

#### T4.2: Click Translate (Without API Key)

**Steps**:

1. Click Translate button
2. Monitor network tab
3. Check browser console

**Expected Results**:

- ✅ Network shows POST to `/api/chat/translate`
- ✅ Response includes translation (placeholder if no API key)
- ✅ Translation displays in MessageBubble:
  - Sky blue background
  - "Translation" label
  - Translated text
- ✅ Source and target language logged

---

#### T4.3: Click Translate (With API Key - After Phase 2)

**Setup**:

1. Add `GOOGLE_TRANSLATE_API_KEY` to `.env.local`
2. Restart dev server

**Steps**:

1. Translate a message
2. Note the language (browser language)
3. Check translation result

**Expected Results**:

- ✅ Real translation from Google Translate API
- ✅ Translation cached in `chat_message_translations` table
- ✅ Second translation of same message is instant (from cache)
- ✅ Translation result accurate
- ✅ No console errors

---

#### T4.4: Get Supported Languages

**Steps**:

1. Open browser console
2. Fetch language list:

```javascript
fetch("/api/chat/translate/languages")
  .then((r) => r.json())
  .then((d) => console.log(d.languages));
```

**Expected Results**:

- ✅ Returns array of language objects
- ✅ Each has `code` and `name`
- ✅ Includes major languages (en, es, fr, zh, ja, etc.)
- ✅ 10+ languages available

---

### Test Suite 5: Browser Notifications

#### T5.1: Request Permission

**Steps**:

1. Open chat page
2. Check browser address bar for notification permission popup

**Expected Results**:

- ✅ Browser shows permission prompt:
  - "localhost wants to show notifications"
  - Allow / Block buttons
- ✅ No console errors
- ✅ Permission is requested once (tracked by `notificationRequested` ref)

---

#### T5.2: Grant Notification Permission

**Steps**:

1. Click "Allow" on notification prompt
2. Check browser settings confirm permission

**Expected Results**:

- ✅ Permission granted
- ✅ Browser remembers setting
- ✅ Can verify in browser settings → Notifications

---

#### T5.3: Receive Notification (Window Focused)

**Steps**:

1. Browser window is focused
2. In another user's window, send message to shared channel
3. Observe original window

**Expected Results**:

- ✅ Message appears in chat (real-time)
- ✅ Browser notification does NOT show (window focused)
- ✅ Console logs message receipt
- ✅ No notification spam for active user

---

#### T5.4: Receive Notification (Window Not Focused)

**Steps**:

1. Click outside browser window or minimize
2. In another user's window, send message
3. Check for browser notification

**Expected Results**:

- ✅ Browser notification appears
- ✅ Notification shows:
  - Title: "New message from [Sender Name]"
  - Body: Message preview (first 120 chars)
  - Timestamp
- ✅ Clicking notification focuses window
- ✅ Message visible in chat
- ✅ Only shows for messages from other users

---

#### T5.5: Offline Mode Notification

**Steps**:

1. DevTools Network tab → Throttling → Offline
2. Send a message
3. Check UI

**Expected Results**:

- ✅ Offline banner appears at top of input:
  - "Offline mode: messages and uploads will queue once you reconnect."
  - Red/warning styling
- ✅ Send button still works (queues locally)
- ✅ Message appears in chat (optimistic update)
- ✅ Console shows offline event triggered

---

#### T5.6: Return Online Notification

**Steps**:

1. While offline, send a message
2. DevTools Network → Throttling → No throttling (back online)
3. Wait 2-3 seconds

**Expected Results**:

- ✅ Browser notification shows:
  - Title: "GT Chat is back online"
  - Body: "Syncing messages and notifications now."
- ✅ Offline banner disappears
- ✅ Queued message syncs to server
- ✅ Message appears to other users

---

### Test Suite 6: Security & RLS

#### T6.1: Unauthorized Access

**Steps**:

1. Open browser console
2. Try to manually call API without session:

```javascript
fetch("/api/chat/groups")
  .then((r) => r.json())
  .then((d) => console.log(d));
```

**Expected Results**:

- ✅ API returns 401 Unauthorized
- ✅ Error message: "Unauthorized"
- ✅ No user data leaked
- ✅ Server logs attempt

---

#### T6.2: Cross-User Message Access

**Setup**:

- User A in conversation with User B
- User C not in conversation

**Steps**:

1. In User C's session, try to access User A-B conversation:

```javascript
fetch("/api/chat/conversations/CONVERSATION_ID/messages").then((r) => r.json());
```

**Expected Results**:

- ✅ Returns 403 Forbidden or empty result
- ✅ RLS policy blocks unauthorized access
- ✅ User C cannot see User A-B messages
- ✅ No error details leaked

---

#### T6.3: Group Member Verification

**Steps**:

1. User A not member of "Finance" group
2. User A tries to access Finance messages

**Expected Results**:

- ✅ RLS policy blocks access
- ✅ User A sees group in list but cannot fetch messages
- ✅ Error handling graceful (no crash)

---

### Test Suite 7: UI/UX Polish

#### T7.1: Responsive Layout

**Steps**:

1. Open DevTools → Toggle device toolbar
2. Test at different breakpoints:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1200px)
   - XL (1400px+)

**Expected Results**:

- ✅ Mobile: Single column layout, details panel hidden
- ✅ Tablet: Sidebar + main chat, details hidden
- ✅ Desktop: Sidebar + main + compact details
- ✅ XL: Full three-column layout with details panel
- ✅ No horizontal scroll
- ✅ Input field remains accessible

---

#### T7.2: Message Scroll Auto-Scroll

**Steps**:

1. Send 20+ messages
2. Scroll to top to view old messages
3. Send new message
4. Observe scroll position

**Expected Results**:

- ✅ ScrollToBottom works when near bottom
- ✅ Auto-scroll jumps to newest message
- ✅ Manual scroll up keeps position until new message
- ✅ "Scroll to new messages" button appears (if implemented)

---

#### T7.3: Glassormorphism Effects

**Steps**:

1. Observe styling of key elements
2. Check header, sidebar, input area

**Expected Results**:

- ✅ Glassmorphism blur effect visible
- ✅ Semi-transparent backgrounds
- ✅ Smooth color transitions
- ✅ Gold accent colors for actions
- ✅ Dark theme applied consistently

---

#### T7.4: Empty States

**Steps**:

1. Load chat with no active channel
2. Load chat with no messages

**Expected Results**:

- ✅ Empty state shows helpful message
- ✅ "Select a channel from sidebar to start"
- ✅ "No messages yet - Be the first to say hello!"
- ✅ Branded with GT Communications logo/branding

---

## 🐛 Bug Report Template

If you find issues during testing, report with:

```markdown
**Test Case**: T2.2 - Send Message Between Two Users
**Severity**: High/Medium/Low
**Steps to Reproduce**:

1. Open 2 browser tabs
2. Select same group in both
3. Send message from Tab 1
4. [Additional steps...]

**Expected Result**:

- Message appears in Tab 2 within 2 seconds

**Actual Result**:

- Message did not appear; console shows error: "..."

**Console Error**:
[Copy full error stack]

**Environment**:

- Browser: Chrome 125
- OS: Windows 10
- Dev Server: Running locally

**Attachments**:

- Screenshot/screen recording
- Browser console log export
```

---

## ✅ Test Sign-Off Checklist

After completing all tests:

- [ ] All component rendering tests pass (T1.\*)
- [ ] Real-time messaging works (T2.\*)
- [ ] File attachments functional (T3.\*)
- [ ] Translation action available (T4.\*)
- [ ] Browser notifications work (T5.\*)
- [ ] Security policies enforced (T6.\*)
- [ ] UI/UX responsive and polished (T7.\*)
- [ ] No critical bugs
- [ ] Console clean (no errors)
- [ ] Network requests all 200/201
- [ ] Ready for Phase 2/5/7 implementation

---

## 📊 Test Execution Log

| Test Case | Status  | Date | Notes |
| --------- | ------- | ---- | ----- |
| T1.1      | PENDING | -    | -     |
| T1.2      | PENDING | -    | -     |
| T1.3      | PENDING | -    | -     |
| T1.4      | PENDING | -    | -     |
| T2.1      | PENDING | -    | -     |
| T2.2      | PENDING | -    | -     |
| T2.3      | PENDING | -    | -     |
| T2.4      | PENDING | -    | -     |
| T3.1      | PENDING | -    | -     |
| T3.2      | PENDING | -    | -     |
| T3.3      | PENDING | -    | -     |
| T3.4      | PENDING | -    | -     |
| T3.5      | PENDING | -    | -     |
| T3.6      | PENDING | -    | -     |
| T4.1      | PENDING | -    | -     |
| T4.2      | PENDING | -    | -     |
| T4.3      | PENDING | -    | -     |
| T4.4      | PENDING | -    | -     |
| T5.1      | PENDING | -    | -     |
| T5.2      | PENDING | -    | -     |
| T5.3      | PENDING | -    | -     |
| T5.4      | PENDING | -    | -     |
| T5.5      | PENDING | -    | -     |
| T5.6      | PENDING | -    | -     |
| T6.1      | PENDING | -    | -     |
| T6.2      | PENDING | -    | -     |
| T6.3      | PENDING | -    | -     |
| T7.1      | PENDING | -    | -     |
| T7.2      | PENDING | -    | -     |
| T7.3      | PENDING | -    | -     |
| T7.4      | PENDING | -    | -     |

---

**Document Version**: 1.0 - Phase 3 Complete  
**Last Updated**: May 12, 2026  
**Next Update**: After Phase 2/5/7 Testing
