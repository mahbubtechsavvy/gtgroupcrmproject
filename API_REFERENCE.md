# GT CRM Chat API Reference - Phase 3

**Generated**: May 12, 2026  
**Status**: ✅ Production Ready (Phase 3 Complete)

---

## Base URL

```
http://localhost:3005/api/chat/
```

---

## Endpoints

### 1. Groups Management

#### GET /groups

**Description**: List all groups for authenticated user  
**Authentication**: Required (Session)  
**Query Parameters**:

- `userId`: User ID (required)

**Response**:

```json
[
  {
    "id": "uuid",
    "name": "Engineering",
    "description": "Engineering team discussions",
    "group_type": "department",
    "is_general": false,
    "is_private": false,
    "created_by": "uuid",
    "created_at": "2026-05-12T10:00:00Z",
    "member_count": 12
  }
]
```

#### POST /groups

**Description**: Create a new group channel  
**Authentication**: Required  
**Body**:

```json
{
  "name": "Product Team",
  "description": "Product strategy and planning",
  "group_type": "team|department|project",
  "is_private": false
}
```

#### GET /groups/[id]

**Description**: Get group details  
**Authentication**: Required  
**Response**: Single group object

#### GET /groups/[id]/members

**Description**: List group members  
**Authentication**: Required  
**Response**:

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "group_id": "uuid",
    "role": "member|admin|moderator",
    "user": {
      "id": "uuid",
      "full_name": "John Doe",
      "avatar_url": "https://...",
      "email": "john@gtgroup.com"
    }
  }
]
```

#### POST /groups/[id]/members

**Description**: Add member to group  
**Authentication**: Required (Admin only via RLS)  
**Body**:

```json
{
  "user_id": "uuid",
  "role": "member|admin"
}
```

#### GET /groups/[id]/messages

**Description**: Fetch group messages  
**Authentication**: Required  
**Query Parameters**:

- `limit`: Results per page (default 50)
- `offset`: Pagination offset (default 0)

**Response**:

```json
[
  {
    "id": "uuid",
    "group_id": "uuid",
    "sender_id": "uuid",
    "content": "Hello team!",
    "message_type": "text|file|reaction",
    "created_at": "2026-05-12T10:00:00Z",
    "updated_at": "2026-05-12T10:00:00Z",
    "read_by": [{ "user_id": "uuid", "read_at": "2026-05-12T10:01:00Z" }],
    "attachments": [
      {
        "id": "uuid",
        "file_name": "report.pdf",
        "file_size": 2048000,
        "file_url": "https://..."
      }
    ],
    "sender": {
      "id": "uuid",
      "full_name": "John Doe",
      "avatar_url": "https://..."
    }
  }
]
```

#### POST /groups/[id]/messages

**Description**: Send message to group  
**Authentication**: Required  
**Body**:

```json
{
  "content": "Here's my update",
  "attachment_ids": ["uuid", "uuid"],
  "parent_message_id": "uuid|null",
  "message_type": "text|file"
}
```

**Response**: Created message object

---

### 2. Conversations (Direct Messages)

#### GET /conversations

**Description**: List user's DM conversations  
**Authentication**: Required  
**Query Parameters**:

- `userId`: User ID (required)

**Response**:

```json
[
  {
    "id": "uuid",
    "participant_a": { "id": "uuid", "full_name": "Alice" },
    "participant_b": { "id": "uuid", "full_name": "Bob" },
    "last_message": "See you tomorrow",
    "last_message_at": "2026-05-12T10:00:00Z",
    "created_at": "2026-05-12T08:00:00Z"
  }
]
```

#### POST /conversations

**Description**: Create or get existing DM conversation  
**Authentication**: Required  
**Body**:

```json
{
  "participant_id": "uuid"
}
```

**Response**: Conversation object (created or existing)

#### GET /conversations/[id]/messages

**Description**: Fetch DM messages  
**Authentication**: Required  
**Query Parameters**: Same as group messages

**Response**: Message array (same format as group messages)

#### POST /conversations/[id]/messages

**Description**: Send DM message  
**Authentication**: Required  
**Body**: Same as group message

**Response**: Created message object

---

### 3. Attachments

#### POST /attachments

**Description**: Upload file attachment  
**Authentication**: Required  
**Content-Type**: multipart/form-data  
**Body**:

```
file: <binary file data>
group_id: "uuid" (optional, for context)
conversation_id: "uuid" (optional, for context)
```

**Response**:

```json
{
  "id": "uuid",
  "uploader_id": "uuid",
  "file_name": "document.pdf",
  "file_size": 2048000,
  "file_type": "application/pdf",
  "storage_path": "userId/1715507700000_document.pdf",
  "file_url": "https://bucket.supabase.co/object/public/chat-attachments/...",
  "meta": {
    "original_name": "document.pdf",
    "uploaded_at": "2026-05-12T10:00:00Z"
  },
  "created_at": "2026-05-12T10:00:00Z"
}
```

#### GET /attachments/[id]

**Description**: Get attachment metadata  
**Authentication**: Required  
**Response**: Attachment object

---

### 4. Translation

#### POST /translate

**Description**: Translate message text with caching  
**Authentication**: Required  
**Body**:

```json
{
  "text": "Hello, how are you?",
  "targetLang": "es",
  "messageId": "uuid|null",
  "dmMessageId": "uuid|null"
}
```

**Response**:

```json
{
  "translation": "¡Hola, cómo estás?",
  "cached": false,
  "sourceLang": "en",
  "targetLang": "es"
}
```

**Note**:

- If `GOOGLE_TRANSLATE_API_KEY` not set, falls back to placeholder
- Translation cached in `chat_message_translations` for future use
- Returns cached translation if available

#### GET /translate/languages

**Description**: Get supported languages for translation  
**Authentication**: Required

**Response**:

```json
{
  "languages": [
    { "code": "en", "name": "English" },
    { "code": "es", "name": "Spanish" },
    { "code": "fr", "name": "French" },
    { "code": "de", "name": "German" },
    { "code": "zh", "name": "Chinese" },
    { "code": "ja", "name": "Japanese" },
    { "code": "ar", "name": "Arabic" },
    { "code": "pt", "name": "Portuguese" },
    { "code": "ru", "name": "Russian" },
    { "code": "hi", "name": "Hindi" }
  ]
}
```

---

### 5. Notifications

#### GET /notifications

**Description**: Get notifications for authenticated user  
**Authentication**: Required  
**Query Parameters**:

- `unread_only`: Filter unread (default: false)
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset (default: 0)

**Response**:

```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "notification_type": "message|mention|reaction|status_change",
    "title": "New message from Alice",
    "body": "Did you see my last message?",
    "related_message_id": "uuid|null",
    "related_group_id": "uuid|null",
    "related_user_id": "uuid|null",
    "is_read": false,
    "read_at": null,
    "created_at": "2026-05-12T10:00:00Z"
  }
]
```

#### PATCH /notifications/[id]

**Description**: Mark notification as read  
**Authentication**: Required  
**Body**:

```json
{
  "is_read": true
}
```

**Response**: Updated notification object

#### DELETE /notifications/[id]

**Description**: Delete notification  
**Authentication**: Required  
**Response**: `{ "success": true }`

#### POST /notifications/batch

**Description**: Mark multiple notifications as read  
**Authentication**: Required  
**Body**:

```json
{
  "notification_ids": ["uuid", "uuid", "uuid"]
}
```

**Response**: `{ "updated": 3 }`

---

### 6. Presence

#### POST /presence

**Description**: Update user presence status  
**Authentication**: Required  
**Body**:

```json
{
  "status": "online|away|offline",
  "group_id": "uuid|null"
}
```

**Response**:

```json
{
  "user_id": "uuid",
  "status": "online",
  "updated_at": "2026-05-12T10:00:00Z"
}
```

---

### 7. Search

#### GET /search

**Description**: Search messages across groups and DMs  
**Authentication**: Required  
**Query Parameters**:

- `q`: Search query (required)
- `type`: "all|groups|conversations" (default: "all")
- `limit`: Results per page (default: 20)

**Response**:

```json
{
  "results": [
    {
      "id": "uuid",
      "type": "message",
      "content": "...",
      "group_id": "uuid|null",
      "conversation_id": "uuid|null",
      "sender": { "id": "uuid", "full_name": "John" },
      "created_at": "2026-05-12T10:00:00Z"
    }
  ]
}
```

---

## Error Responses

All endpoints return consistent error responses:

### 400 Bad Request

```json
{
  "error": "Invalid request parameters"
}
```

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden

```json
{
  "error": "Access denied"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error",
  "details": "..."
}
```

---

## Authentication

All endpoints require a valid Supabase session. The session is automatically provided via:

- **Browser**: Cookies from Supabase auth
- **API**: `Authorization: Bearer <session_token>`

Session obtained via:

- Google OAuth login
- Email/password auth
- Magic link auth

---

## Rate Limiting

**Current**: No rate limiting (configure in production)

**Recommended**:

- 100 requests/min per user for read operations
- 50 requests/min per user for write operations
- 10 requests/min for attachments

---

## WebSocket Realtime

Chat system uses Supabase Realtime for live updates:

```javascript
// Example subscription in ChatShell.jsx
supabase
  .channel(`group:${groupId}`)
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "chat_messages",
      filter: `group_id=eq.${groupId}`,
    },
    (payload) => {
      // New message received
      console.log(payload.new);
    },
  )
  .subscribe();
```

---

## Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Google Translate (Phase 2)
GOOGLE_TRANSLATE_API_KEY=AIzaS... # CURRENTLY MISSING

# Optional: Custom API settings
NEXT_PUBLIC_API_BASE=http://localhost:3005
```

---

## Testing with cURL

### Send a message

```bash
curl -X POST http://localhost:3005/api/chat/groups/GROUP_ID/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SESSION_TOKEN" \
  -d '{
    "content": "Hello team!",
    "attachment_ids": [],
    "message_type": "text"
  }'
```

### Upload attachment

```bash
curl -X POST http://localhost:3005/api/chat/attachments \
  -F "file=@document.pdf" \
  -F "group_id=GROUP_ID" \
  -H "Authorization: Bearer SESSION_TOKEN"
```

### Translate text

```bash
curl -X POST http://localhost:3005/api/chat/translate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SESSION_TOKEN" \
  -d '{
    "text": "Hello, how are you?",
    "targetLang": "es"
  }'
```

---

## Related Documentation

- [Phase 3 Deployment Guide](./PHASE_3_DEPLOYMENT_GUIDE.md)
- [Database Schema](./supabase/migrations/041_chat_system_upgrade.sql)
- [Storage Setup](./supabase/migrations/042_chat_storage_setup.sql)
- [Component Architecture](./src/components/chat/)

**Last Updated**: May 12, 2026  
**Maintainer**: GT CRM Development Team
