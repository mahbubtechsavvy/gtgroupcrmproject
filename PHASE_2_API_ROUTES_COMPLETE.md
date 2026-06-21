# Phase 2: API Routes Layer — Implementation Complete ✅

**Status:** All 9 API routes built and ready for testing  
**Date:** May 11, 2026  
**Previous Phase:** Phase 1 (Database Foundation) ✓  
**Next Phase:** Phase 3 (Group Chat Upgrade UI)

---

## 📋 Overview

Phase 2 implements all backend logic as Next.js API routes with the following architecture:

- **Authentication:** All routes use `createServerSupabaseClient()` for server-side auth
- **Authorization:** Role-based access control (CEO, COO, IT Manager for admin ops)
- **Database:** Full RLS integration via Supabase policies
- **Logging:** All actions logged to `interactions` table
- **Error Handling:** Standardized NextResponse JSON with proper HTTP status codes

---

## 🛣️ API Routes Reference

### 1. **Groups Management**

#### GET `/api/chat/groups`

Fetch all chat groups with member counts.

**Query Parameters:**

- `type` (optional): Filter by group type ('office', 'department', 'country', 'general')
- `office_id` (optional): Filter by specific office

**Response:**

```json
[
  {
    "id": "uuid",
    "name": "GT Global General",
    "description": "Company-wide channel",
    "group_type": "general",
    "is_general": true,
    "office_id": null,
    "created_at": "2026-05-11T10:00:00Z",
    "created_by": "uuid",
    "members": [{ "count": 45 }]
  }
]
```

#### POST `/api/chat/groups`

Create a new group (admin-gated: CEO/COO/IT Manager).

**Request Body:**

```json
{
  "name": "Engineering Team",
  "description": "Internal tech discussions",
  "group_type": "department",
  "office_id": null,
  "is_general": false
}
```

**Validation:**

- `name` and `group_type` required
- Only 3 roles can create groups
- Auto-logs creation activity

---

#### GET `/api/chat/groups/[id]`

Fetch specific group with member details.

**Response Includes:**

- Group metadata
- Full member list with user info and roles
- Joined timestamps

#### PUT `/api/chat/groups/[id]`

Update group (admin-gated).

**Allowed Updates:** `name`, `description`, `group_type`

#### DELETE `/api/chat/groups/[id]`

Delete group (admin-gated).

---

### 2. **Group Members Management**

#### GET `/api/chat/groups/[id]/members`

List all members of a group with roles and join dates.

#### POST `/api/chat/groups/[id]/members`

Add member to group (admin-gated).

**Request Body:**

```json
{
  "user_id": "uuid",
  "role": "member" // or "admin"
}
```

**Validation:**

- Prevents duplicate membership
- Checks user exists
- Admin-only

#### DELETE `/api/chat/groups/[id]/members?user_id=UUID`

Remove member from group (admin-gated).

---

### 3. **Direct Messaging**

#### GET `/api/chat/conversations`

Fetch all DM conversations for current user (1-to-1 private messaging).

**Response Includes:**

- Both participants' info
- Last message preview
- Conversation timestamps
- Ordered by most recent

#### POST `/api/chat/conversations`

Start or get existing conversation with another user.

**Request Body:**

```json
{
  "participant_id": "uuid"
}
```

**Logic:**

- Returns existing conversation if found
- Creates new if not exists
- Returns 200 for existing, 201 for new

---

#### GET `/api/chat/conversations/[id]/messages?limit=50&offset=0`

Fetch messages with cursor-based pagination.

**Features:**

- Pagination support (default 50 messages)
- Includes sender info
- Includes attachments per message
- Includes read receipts
- Reverse-ordered (oldest first in response)

#### POST `/api/chat/conversations/[id]/messages`

Send a DM.

**Request Body:**

```json
{
  "content": "Hey, how are you?",
  "attachment_ids": [] // optional
}
```

**Auto Actions:**

- Creates read receipt for sender
- Creates notification for recipient
- Updates conversation `updated_at`
- Links attachments if provided
- Logs activity

---

### 4. **File Attachments**

#### POST `/api/chat/attachments`

Upload file to Supabase Storage with validation.

**Request Body (FormData):**

- `file`: File object
- `conversation_id`: UUID (for DMs)
- `group_id`: UUID (for groups)
- Either conversation_id or group_id required

**Validation:**

- Max 50MB file size
- Whitelist of MIME types:
  - Documents: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
  - Images: PNG, JPG, GIF, WEBP
  - Media: MP4, MP3
  - Data: CSV, JSON, TXT, ZIP, RAR

**Storage Path:** `chat-attachments/{year-month}/{timestamp-uuid}.{ext}`

**Auto Actions:**

- Creates attachment record in DB
- Generates public URL
- Logs upload activity

#### GET `/api/chat/attachments?conversation_id=UUID` or `?group_id=UUID`

Fetch all attachments for conversation or group.

---

### 5. **Translation**

#### POST `/api/chat/translate`

Translate a message using Google Translate API (with caching).

**Request Body:**

```json
{
  "message_id": "uuid", // optional for caching
  "text": "Hello, how are you?",
  "target_language": "bn"
}
```

**Supported Languages:**

- `en` English
- `bn` Bangla
- `ko` Korean
- `vi` Vietnamese
- `si` Sinhala
- `hi` Hindi
- `ar` Arabic
- `zh-CN` Chinese (Simplified)
- `ja` Japanese
- `th` Thai
- `ms` Malay
- `fr` French
- `es` Spanish

**Caching:**

- Checks `chat_message_translations` table first
- Caches on first translation
- Returns `from_cache: true/false` in response

**Response:**

```json
{
  "translated_text": "আপনি কেমন আছেন?",
  "from_cache": false,
  "target_language": "bn"
}
```

#### GET `/api/chat/translate/languages`

Get list of all supported languages and codes.

**Requires:** `GOOGLE_TRANSLATE_API_KEY` in `.env.local`

---

### 6. **Presence (Online Status)**

#### GET `/api/chat/presence?group_id=UUID` or `?conversation_id=UUID`

Get online status of all users in a group or conversation.

**Response:**

```json
[
  {
    "user_id": "uuid",
    "status": "online", // 'online', 'away', 'offline'
    "last_seen": "2026-05-11T15:30:00Z",
    "user": {
      "id": "uuid",
      "full_name": "John Doe",
      "avatar_url": "..."
    }
  }
]
```

#### POST `/api/chat/presence`

Update user presence status.

**Request Body:**

```json
{
  "status": "online",
  "group_id": "uuid",
  "conversation_id": null
}
```

**Features:**

- Auto-creates or updates presence record
- Updates `last_seen` timestamp
- Works for both groups and conversations

#### DELETE `/api/chat/presence?group_id=UUID` or `?conversation_id=UUID`

Mark user as offline (remove presence record).

---

### 7. **Notifications**

#### GET `/api/chat/notifications?limit=20&offset=0&unread_only=false`

Fetch notifications for current user.

**Response:**

```json
{
  "notifications": [
    {
      "id": "uuid",
      "recipient_id": "uuid",
      "notification_type": "direct_message",
      "content": "New message from John",
      "related_user_id": "uuid",
      "related_entity_id": "uuid",
      "related_entity_type": "conversation",
      "is_read": false,
      "created_at": "2026-05-11T15:30:00Z",
      "related_user": { "id": "uuid", "full_name": "John", "avatar_url": "..." }
    }
  ],
  "unread_count": 5
}
```

#### PUT `/api/chat/notifications?id=UUID&read=true`

Mark notification as read.

#### DELETE `/api/chat/notifications?id=UUID` or `?clear_all=true`

Delete single notification or clear all for current user.

---

### 8. **Search**

#### GET `/api/chat/search?q=search_term&type=all&limit=20`

Full-text search across messages, groups, and users.

**Query Parameters:**

- `q`: Search term (minimum 2 characters)
- `type`: 'group', 'dm', 'user', or 'all' (default: 'all')
- `limit`: Results per category (default: 20)

**Response:**

```json
{
  "groups": [
    {
      "id": "uuid",
      "name": "GT Bangladesh Office",
      "description": "Dhaka office team",
      "group_type": "office"
    }
  ],
  "messages": [
    {
      "id": "uuid",
      "content": "Let's discuss this tomorrow",
      "created_at": "2026-05-11T10:00:00Z",
      "sender_id": "uuid",
      "sender": { "id": "uuid", "full_name": "Alice", "avatar_url": "..." }
    }
  ],
  "users": [
    {
      "id": "uuid",
      "full_name": "Alice Smith",
      "email": "alice@gtgroup.com",
      "avatar_url": "...",
      "role": "counselor"
    }
  ]
}
```

---

## 🔐 Security Implementation

### Authentication

- All routes check `auth.getSession()` first
- Unauthorized requests return 401

### Authorization

- Admin operations (group create/delete, member management) check user role
- Only 3 roles: `ceo`, `coo`, `it_manager`
- Other operations check ownership (user_id, sender_id)

### Row Level Security (RLS)

- Server-side auth means RLS policies automatically apply
- Users can only access conversations they're in
- Users can only see their own notifications
- Group access controlled via `chat_group_members` table

### Data Validation

- File upload: MIME type whitelist + size limit
- Translation: Language code validation
- Presence: Status enum validation
- All inputs trimmed and validated

### Logging

- Every significant action logged to `interactions` table
- Includes user, action type, entity type, and metadata
- Enables audit trail for compliance

---

## 📦 Environment Variables Required

```bash
# .env.local (add to existing)
GOOGLE_TRANSLATE_API_KEY=your_google_cloud_api_key_here

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## 🧪 Testing Checklist

### Manual Testing

- [ ] GET groups → lists all groups
- [ ] POST group → creates new group (admin only)
- [ ] DELETE group → removes group (admin only)
- [ ] GET conversations → lists DMs for user
- [ ] POST conversation → creates/gets existing DM
- [ ] POST message → sends DM with notification
- [ ] POST file → uploads to Storage (test size/type validation)
- [ ] POST translate → translates and caches
- [ ] POST presence → updates online status
- [ ] GET notifications → lists with unread count
- [ ] GET search → finds groups/messages/users

### Integration Testing

- [ ] RLS policies enforce access control
- [ ] Non-admins cannot create groups
- [ ] Users cannot see others' private conversations
- [ ] File uploads reject invalid types/sizes
- [ ] Translations cache on second request
- [ ] Activity logging works for all actions

### Load Testing

- [ ] Handle 100+ concurrent presence updates
- [ ] Paginate through 1000+ messages efficiently
- [ ] Search returns results in < 500ms

---

## 📊 API Statistics

| Route                                 | Method | Auth | Admin | Purpose             |
| ------------------------------------- | ------ | ---- | ----- | ------------------- |
| /api/chat/groups                      | GET    | ✓    | -     | List all groups     |
| /api/chat/groups                      | POST   | ✓    | ✓     | Create group        |
| /api/chat/groups/[id]                 | GET    | ✓    | -     | Get group details   |
| /api/chat/groups/[id]                 | PUT    | ✓    | ✓     | Update group        |
| /api/chat/groups/[id]                 | DELETE | ✓    | ✓     | Delete group        |
| /api/chat/groups/[id]/members         | GET    | ✓    | -     | List members        |
| /api/chat/groups/[id]/members         | POST   | ✓    | ✓     | Add member          |
| /api/chat/groups/[id]/members         | DELETE | ✓    | ✓     | Remove member       |
| /api/chat/conversations               | GET    | ✓    | -     | List DMs            |
| /api/chat/conversations               | POST   | ✓    | -     | Create/get DM       |
| /api/chat/conversations/[id]/messages | GET    | ✓    | -     | List messages       |
| /api/chat/conversations/[id]/messages | POST   | ✓    | -     | Send message        |
| /api/chat/attachments                 | POST   | ✓    | -     | Upload file         |
| /api/chat/attachments                 | GET    | ✓    | -     | List files          |
| /api/chat/translate                   | POST   | ✓    | -     | Translate text      |
| /api/chat/translate                   | GET    | -    | -     | List languages      |
| /api/chat/presence                    | GET    | ✓    | -     | Get online status   |
| /api/chat/presence                    | POST   | ✓    | -     | Update status       |
| /api/chat/presence                    | DELETE | ✓    | -     | Mark offline        |
| /api/chat/notifications               | GET    | ✓    | -     | List notifications  |
| /api/chat/notifications               | PUT    | ✓    | -     | Mark as read        |
| /api/chat/notifications               | DELETE | ✓    | -     | Delete notification |
| /api/chat/search                      | GET    | ✓    | -     | Full-text search    |

**Total: 23 API endpoints**

---

## 🚀 Next Steps (Phase 3)

After Phase 2 is deployed and tested, move to Phase 3: **Group Chat Upgrade**

### Phase 3 Tasks:

1. Redesign chat.module.css for 3-panel layout
2. Build ChatSidebar component with groups + unread counts
3. Build MessageList with cursor-based pagination
4. Upgrade MessageBubble with reactions, read receipts, edit/delete
5. Build MessageInput with emoji picker + file attach + drag-drop
6. Build TypingIndicator via Supabase Presence
7. Build FileAttachment and ImageAttachment components
8. Build ChatHeader with member list sidebar
9. Build PinnedMessages banner
10. Admin group management modal

**Phase 3 Estimated Time:** 5–7 days

---

## 📝 Implementation Notes

### Database Dependencies

All routes assume the following tables exist (created in Phase 1):

- ✓ `chat_groups`
- ✓ `chat_group_members`
- ✓ `chat_conversations`
- ✓ `chat_direct_messages`
- ✓ `chat_attachments`
- ✓ `chat_presence`
- ✓ `chat_notifications`
- ✓ `chat_message_translations`
- ✓ `chat_message_reads`
- ✓ `interactions` (existing)
- ✓ `chat-attachments` Storage bucket

### Performance Considerations

1. **Pagination:** Messages use cursor-based pagination (limit/offset)
2. **Caching:** Translations cached in DB to avoid API calls
3. **Real-time:** Presence and notifications ready for Supabase Realtime subscriptions (Phase 3)
4. **Lazy Loading:** Only fetch necessary data per request

### Error Codes

- **400:** Bad request (validation failed)
- **401:** Unauthorized (no session)
- **403:** Forbidden (insufficient permissions)
- **404:** Not found (entity doesn't exist)
- **500:** Server error (unexpected exception)
- **503:** Service unavailable (translation API issue)

---

## ✅ Completion Summary

**Phase 2 Status:** ✅ COMPLETE

- [x] 9 API route files created
- [x] All CRUD operations implemented
- [x] Authentication & authorization
- [x] RLS compatibility
- [x] Activity logging
- [x] Error handling
- [x] File upload with validation
- [x] Translation API integration
- [x] Real-time presence ready
- [x] Notification system ready

**Ready for:** Testing, Phase 1 deployment verification, Phase 3 development
