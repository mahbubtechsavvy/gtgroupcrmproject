# Phase 2 API Routes — Developer Quick Reference

This document provides code examples for using the Phase 2 API routes from React components.

---

## 📌 Common Patterns

### Authentication

All routes handle auth server-side. No token management needed from frontend.

### Error Handling Pattern

```javascript
try {
  const response = await fetch("/api/chat/...", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error("API error:", error);
  // Show error to user
}
```

---

## 🎯 API Usage Examples

### Groups API

#### Get all groups

```javascript
async function fetchGroups(type = null) {
  const params = new URLSearchParams();
  if (type) params.append("type", type);

  const response = await fetch(`/api/chat/groups?${params}`);
  return response.json();
}

// Usage
const groups = await fetchGroups("department");
```

#### Create a group (admin)

```javascript
async function createGroup(name, description, groupType, officeId = null) {
  const response = await fetch("/api/chat/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      description,
      group_type: groupType,
      office_id: officeId,
    }),
  });

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}

// Usage
const group = await createGroup(
  "Bangladesh Team",
  "Dhaka office",
  "office",
  "office-bd-id",
);
```

#### Get group with members

```javascript
async function fetchGroupDetails(groupId) {
  const response = await fetch(`/api/chat/groups/${groupId}`);
  return response.json();
}

// Usage
const group = await fetchGroupDetails(groupId);
console.log(group.members); // Array of members with user info
```

#### Update group

```javascript
async function updateGroup(groupId, updates) {
  const response = await fetch(`/api/chat/groups/${groupId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}

// Usage
const updated = await updateGroup(groupId, {
  name: "New Group Name",
  description: "Updated description",
});
```

#### Delete group (admin)

```javascript
async function deleteGroup(groupId) {
  const response = await fetch(`/api/chat/groups/${groupId}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}
```

---

### Group Members API

#### Get group members

```javascript
async function fetchGroupMembers(groupId) {
  const response = await fetch(`/api/chat/groups/${groupId}/members`);
  return response.json();
}

// Usage
const members = await fetchGroupMembers(groupId);
// Each member has: user_id, role, joined_at, user { id, full_name, avatar_url }
```

#### Add member to group (admin)

```javascript
async function addGroupMember(groupId, userId, role = "member") {
  const response = await fetch(`/api/chat/groups/${groupId}/members`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, role }),
  });

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}

// Usage
await addGroupMember(groupId, userId, "member");
```

#### Remove member (admin)

```javascript
async function removeGroupMember(groupId, userId) {
  const response = await fetch(
    `/api/chat/groups/${groupId}/members?user_id=${userId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}
```

---

### Conversations (DM) API

#### Get all conversations

```javascript
async function fetchConversations() {
  const response = await fetch("/api/chat/conversations");
  return response.json();
}

// Usage
const convs = await fetchConversations();
// Each conversation includes: id, participants, last_message preview, timestamps
```

#### Start or get DM

```javascript
async function startConversation(participantId) {
  const response = await fetch("/api/chat/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participant_id: participantId }),
  });

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}

// Usage
const conv = await startConversation(userId);
const isNew = response.status === 201;
```

---

### DM Messages API

#### Get messages (with pagination)

```javascript
async function fetchMessages(conversationId, limit = 50, offset = 0) {
  const params = new URLSearchParams({ limit, offset });
  const response = await fetch(
    `/api/chat/conversations/${conversationId}/messages?${params}`
  );
  return response.json();
}

// Usage - Load more pattern
const messages = await fetchMessages(convId, 50, 0);
// For next batch: fetchMessages(convId, 50, 50)

// Infinite scroll pattern
function handleLoadMore() {
  const nextOffset = messages.length;
  const moreMessages = await fetchMessages(convId, 50, nextOffset);
  setMessages([...moreMessages, ...messages]); // Prepend
}
```

#### Send DM

```javascript
async function sendMessage(conversationId, content, attachmentIds = []) {
  const response = await fetch(
    `/api/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, attachment_ids: attachmentIds }),
    },
  );

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}

// Usage
const message = await sendMessage(convId, "Hello there!", []);
```

---

### File Upload API

#### Upload file

```javascript
async function uploadFile(file, conversationId = null, groupId = null) {
  if (!conversationId && !groupId) {
    throw new Error("Either conversationId or groupId required");
  }

  const formData = new FormData();
  formData.append("file", file);
  if (conversationId) formData.append("conversation_id", conversationId);
  if (groupId) formData.append("group_id", groupId);

  const response = await fetch("/api/chat/attachments", {
    method: "POST",
    body: formData, // Don't set Content-Type header!
  });

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}

// Usage - with React
function FileUploadButton() {
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    try {
      const attachment = await uploadFile(file, conversationId);
      console.log("File uploaded:", attachment);
      // Link to message when sending
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  return <input type="file" onChange={handleFileChange} />;
}

// Usage - with drag & drop
function ChatArea() {
  const handleDrop = async (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    for (const file of files) {
      await uploadFile(file, conversationId);
    }
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      style={{ border: "2px dashed #ccc", padding: "20px" }}
    >
      Drop files here
    </div>
  );
}
```

#### Get attachments

```javascript
async function fetchAttachments(conversationId = null, groupId = null) {
  const params = new URLSearchParams();
  if (conversationId) params.append("conversation_id", conversationId);
  if (groupId) params.append("group_id", groupId);

  const response = await fetch(`/api/chat/attachments?${params}`);
  return response.json();
}

// Usage
const files = await fetchAttachments(conversationId);
```

---

### Translation API

#### Translate text

```javascript
async function translateText(text, targetLanguage, messageId = null) {
  const response = await fetch("/api/chat/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      target_language: targetLanguage,
      message_id: messageId,
    }),
  });

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}

// Usage
const result = await translateText("Hello", "bn", messageId);
console.log(result.translated_text); // "হ্যালো"
console.log(result.from_cache); // true/false - helpful for UX
```

#### Get supported languages

```javascript
async function fetchLanguages() {
  const response = await fetch("/api/chat/translate");
  return response.json();
}

// Usage
const langs = await fetchLanguages();
// { en: 'English', bn: 'Bangla', ko: 'Korean', ... }
```

---

### Presence API

#### Get online status

```javascript
async function fetchPresence(groupId = null, conversationId = null) {
  const params = new URLSearchParams();
  if (groupId) params.append("group_id", groupId);
  if (conversationId) params.append("conversation_id", conversationId);

  const response = await fetch(`/api/chat/presence?${params}`);
  return response.json();
}

// Usage
const onlineUsers = await fetchPresence(groupId);
// Each item: { user_id, status ('online'|'away'|'offline'), last_seen, user {...} }
```

#### Update presence

```javascript
async function updatePresence(status, groupId = null, conversationId = null) {
  const response = await fetch("/api/chat/presence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      status,
      group_id: groupId,
      conversation_id: conversationId,
    }),
  });

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}

// Usage - when user enters chat
const presence = await updatePresence("online", groupId);

// Usage - when user goes away (browser blur)
window.addEventListener("blur", () => {
  updatePresence("away", groupId);
});

// Usage - when user leaves
window.addEventListener("beforeunload", () => {
  updatePresence("offline", groupId);
});
```

#### Mark offline

```javascript
async function markOffline(groupId = null, conversationId = null) {
  const params = new URLSearchParams();
  if (groupId) params.append("group_id", groupId);
  if (conversationId) params.append("conversation_id", conversationId);

  const response = await fetch(`/api/chat/presence?${params}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}
```

---

### Notifications API

#### Get notifications

```javascript
async function fetchNotifications(limit = 20, offset = 0, unreadOnly = false) {
  const params = new URLSearchParams({
    limit,
    offset,
    unread_only: unreadOnly,
  });
  const response = await fetch(`/api/chat/notifications?${params}`);
  return response.json();
}

// Usage
const result = await fetchNotifications();
console.log(result.notifications); // Array
console.log(result.unread_count); // Number

// Usage - unread only
const unread = await fetchNotifications(20, 0, true);
```

#### Mark as read

```javascript
async function markNotificationRead(notificationId, read = true) {
  const params = new URLSearchParams({ id: notificationId, read });
  const response = await fetch(`/api/chat/notifications?${params}`, {
    method: "PUT",
  });

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}

// Usage
await markNotificationRead(notifId, true);
```

#### Delete notification

```javascript
async function deleteNotification(notificationId) {
  const params = new URLSearchParams({ id: notificationId });
  const response = await fetch(`/api/chat/notifications?${params}`, {
    method: "DELETE",
  });

  if (!response.ok) throw new Error((await response.json()).error);
  return response.json();
}

// Usage - clear all
async function clearAllNotifications() {
  const response = await fetch("/api/chat/notifications?clear_all=true", {
    method: "DELETE",
  });
  if (!response.ok) throw new Error((await response.json()).error);
}
```

---

### Search API

#### Search

```javascript
async function searchChat(query, type = "all", limit = 20) {
  const params = new URLSearchParams({ q: query, type, limit });
  const response = await fetch(`/api/chat/search?${params}`);
  return response.json();
}

// Usage
const results = await searchChat("meeting", "all", 20);
// Results: { groups: [...], messages: [...], users: [...] }

// Usage - search only users
const users = await searchChat("alice", "user", 10);
```

---

## 🔧 React Hooks for Common Operations

### useChat Hook

```javascript
import { useState, useEffect } from "react";

export function useChat(conversationId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetch(
          `/api/chat/conversations/${conversationId}/messages`,
        ).then((r) => r.json());
        setMessages(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [conversationId]);

  const sendMessage = async (content) => {
    const msg = await fetch(
      `/api/chat/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      },
    ).then((r) => r.json());

    setMessages([...messages, msg]);
    return msg;
  };

  return { messages, loading, error, sendMessage };
}

// Usage
function ChatScreen({ conversationId }) {
  const { messages, sendMessage } = useChat(conversationId);

  return (
    <div>
      {messages.map((m) => (
        <Message key={m.id} message={m} />
      ))}
      <MessageInput onSend={sendMessage} />
    </div>
  );
}
```

### useNotifications Hook

```javascript
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadNotifs() {
      const res = await fetch("/api/chat/notifications").then((r) => r.json());
      setNotifications(res.notifications);
      setUnreadCount(res.unread_count);
    }
    loadNotifs();

    // Poll every 10 seconds (or use Realtime subscription)
    const interval = setInterval(loadNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id) => {
    await fetch(`/api/chat/notifications?id=${id}&read=true`, {
      method: "PUT",
    });
    setUnreadCount(Math.max(0, unreadCount - 1));
  };

  return { notifications, unreadCount, markRead };
}
```

---

## 📊 Performance Tips

1. **Pagination:** Always use limit/offset for messages
2. **Caching:** Store fetched data in component state, invalidate on new messages
3. **Real-time:** Use Supabase Realtime subscriptions (Phase 3) instead of polling
4. **Search:** Debounce search input to avoid hammering API
5. **Uploads:** Show progress and allow cancellation with AbortController

---

## 🐛 Debugging Tips

1. Check browser network tab for request/response
2. Enable verbose logging in API routes
3. Use Supabase Dashboard to inspect table data
4. Test Realtime subscriptions separately from REST calls
5. Verify RLS policies don't block valid operations

---

## 📚 Related Documentation

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [File Upload Best Practices](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file)
