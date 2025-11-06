# 📡 ChitChat v5.1 API Documentation (UPDATED)

Base URL: `http://localhost:1630` (NOT 3000!)

## 🔐 Authentication

**IMPORTANT:** This project has migrated to NextAuth 5.0 with dual authentication methods:

### Method 1: NextAuth Session (Browser)
- Automatic session management in browser
- Sliding session with 7-day expiry, 1-day refresh
- Used by frontend React components

### Method 2: API Key + User ID (Postman/Testing)
For API testing, use these headers:
```
x-api-key: secretbet
x-user-id: user001
```

---

## 📋 Table of Contents
1. [Authentication](#1-authentication)
2. [Friends](#2-friends)
3. [Rooms](#3-rooms)
4. [Messages](#4-messages)
5. [Users](#5-users)
6. [Additional Endpoints](#6-additional-endpoints)

---

## ⚠️ **MAJOR CHANGES & DEPRECATIONS**

### ❌ DEPRECATED ENDPOINTS:
- `POST /api/login` - **DEPRECATED** (returns 410 Gone)
  - Use NextAuth session or API key method instead

### 🆕 NEW ENDPOINTS:
- `GET /api/friends/requests` - Get only pending received requests
- `GET /api/rooms/by-slug/[slug]` - Get room by slug (username/room-name)
- `GET /api/test-db` - Database connection test

### 🔧 CHANGED BEHAVIOR:
- **Base URL**: Changed from `:3000` to `:1630`
- **Authentication**: All endpoints now support both NextAuth session OR API key + User ID
- **Room slugs**: New slug-based routing for URLs

---

## 1. Authentication

### 1.1. Register
**POST** `/api/register`

**Request Body:**
```json
{
  "username": "testuser",
  "email": "testuser@example.com",
  "password": "password123",
  "displayName": "Test User"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Akun berhasil dibuat! Selamat bergabung! 🎉",
  "userId": "user001"
}
```

**Validation:**
- All fields required
- Password minimum 8 characters
- Custom ID format: `user001`, `user002`, etc.
- Password auto-hashed with bcrypt (10 rounds)

### 1.2. Login (DEPRECATED)
**POST** `/api/login` - **DEPRECATED**

**Response:**
```json
{
  "success": false,
  "message": "Endpoint /api/login sudah tidak dipakai. Gunakan NextAuth untuk login di browser, atau API key untuk testing Postman.",
  "info": {
    "browser": "Login otomatis via NextAuth session di /auth",
    "postman": "Gunakan header x-api-key dan x-user-id untuk testing"
  }
}
```

**Alternative Methods:**
- **Browser**: Use NextAuth at `/auth` page
- **API Testing**: Use headers `x-api-key: secretbet` and `x-user-id: user001`

---

## 2. Friends

### 2.1. Get Friends List (COMPREHENSIVE)
**GET** `/api/friends`

**Headers (API Testing):**
```
x-api-key: secretbet
x-user-id: user001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "friendshipId": "friend001",
        "userId": "user002",
        "username": "john",
        "displayName": "John Doe",
        "avatar": null,
        "isOnline": true,
        "createdAt": "2024-10-01T10:00:00.000Z"
      }
    ],
    "pendingReceived": [
      {
        "friendshipId": "friend003",
        "userId": "user005",
        "username": "alice",
        "displayName": "Alice Cooper",
        "avatar": null,
        "isOnline": false,
        "createdAt": "2024-10-02T08:00:00.000Z"
      }
    ],
    "pendingSent": [
      {
        "friendshipId": "friend004",
        "userId": "user006",
        "username": "bob",
        "displayName": "Bob Smith",
        "avatar": null,
        "isOnline": true,
        "createdAt": "2024-10-02T09:00:00.000Z"
      }
    ]
  },
  "counts": {
    "totalFriends": 1,
    "pendingReceived": 1,
    "pendingSent": 1
  }
}
```

### 2.2. Get Pending Requests Only (NEW)
**GET** `/api/friends/requests`

**Headers (API Testing):**
```
x-api-key: secretbet
x-user-id: user001
```

**Response:**
```json
{
  "success": true,
  "message": "Ditemukan 2 permintaan pertemanan",
  "data": {
    "requests": [
      {
        "id": "friend001",
        "sender": {
          "id": "user002",
          "username": "john",
          "displayName": "John Doe",
          "email": "john@example.com"
        },
        "createdAt": "2024-10-01T10:00:00.000Z",
        "status": "pending"
      }
    ]
  }
}
```

**Notes:**
- Only returns requests where current user is the receiver
- Includes full sender information (without password)
- Status always "pending" (filtered in query)

### 2.3. Add Friend
**POST** `/api/friends/add`

**Headers (API Testing):**
```
x-api-key: secretbet
x-user-id: user001
Content-Type: application/json
```

**Request Body:**
```json
{
  "identifier": "john"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permintaan pertemanan dikirim ke John Doe!",
  "friendship": {
    "id": "friend001",
    "targetUser": {
      "id": "user002",
      "username": "john",
      "displayName": "John Doe"
    }
  }
}
```

**Notes:**
- `identifier` can be username OR email
- Cannot add yourself
- Checks for existing friendship (accepted/pending)

### 2.4. Respond to Friend Request
**POST** `/api/friends/respond`

**Headers (API Testing):**
```
x-api-key: secretbet
x-user-id: user001
Content-Type: application/json
```

**Request Body (Accept):**
```json
{
  "friendshipId": "friend001",
  "action": "accept"
}
```

**Request Body (Reject):**
```json
{
  "friendshipId": "friend001",
  "action": "reject"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Permintaan pertemanan diterima! Kalian sekarang berteman",
  "friendship": {
    "id": "friend001",
    "status": "accepted"
  }
}
```

---

## 3. Rooms

### 3.1. Get All Rooms
**GET** `/api/rooms`

**Headers (API Testing):**
```
x-api-key: secretbet
x-user-id: user001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "rooms": [
      {
        "id": "room001",
        "name": "Chat dengan John Doe",
        "type": "private",
        "memberCount": 2,
        "lastMessage": "Hello!",
        "lastActivity": "2024-10-02T10:30:00.000Z",
        "createdAt": "2024-10-01T08:00:00.000Z",
        "slug": "john",
        "friend": {
          "userId": "user002",
          "username": "john",
          "displayName": "John Doe",
          "avatar": null,
          "isOnline": true
        }
      },
      {
        "id": "room002",
        "name": "Dev Team",
        "type": "group",
        "memberCount": 5,
        "lastMessage": "Meeting at 3pm",
        "lastActivity": "2024-10-02T11:00:00.000Z",
        "createdAt": "2024-10-01T09:00:00.000Z",
        "slug": "dev-team",
        "members": [
          {
            "userId": "user001",
            "username": "testuser",
            "displayName": "Test User",
            "avatar": null,
            "isOnline": true
          }
        ]
      }
    ],
    "grouped": {
      "private": [...],
      "group": [...],
      "ai": [...]
    },
    "counts": {
      "total": 3,
      "private": 2,
      "group": 1,
      "ai": 0
    }
  }
}
```

**NEW FEATURES:**
- Added `slug` field for URL routing
- Grouped rooms by type
- Counts per room type

### 3.2. Get Room by Slug (NEW)
**GET** `/api/rooms/by-slug/[slug]`

**Examples:**
- `GET /api/rooms/by-slug/john` - Private room with user "john"
- `GET /api/rooms/by-slug/dev-team` - Group room "Dev Team"
- `GET /api/rooms/by-slug/ai-assistant` - AI room

**Headers (API Testing):**
```
x-api-key: secretbet
x-user-id: user001
```

**Response:**
```json
{
  "success": true,
  "data": {
    "room": {
      "id": "room001",
      "name": "Chat dengan John Doe",
      "type": "private",
      "memberCount": 2,
      "lastMessage": "Hello!",
      "lastActivity": "2024-10-02T10:30:00.000Z",
      "createdAt": "2024-10-01T08:00:00.000Z",
      "slug": "john",
      "friend": {
        "userId": "user002",
        "username": "john",
        "displayName": "John Doe",
        "avatar": null,
        "isOnline": true
      }
    }
  }
}
```

**Slug Resolution Strategy:**
1. **AI Room**: `ai-assistant` → type: "ai"
2. **Private Room**: `username` → find user, then private room
3. **Group Room**: `slugified-name` → match slugified room name

### 3.3. Create Room
**POST** `/api/rooms/create`

**Headers (API Testing):**
```
x-api-key: secretbet
x-user-id: user001
Content-Type: application/json
```

**Private Room:**
```json
{
  "type": "private",
  "memberIds": ["user002"]
}
```

**Group Room:**
```json
{
  "type": "group",
  "name": "Dev Team Chat",
  "memberIds": ["user002", "user003", "user004"]
}
```

**AI Room:**
```json
{
  "type": "ai"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Room private berhasil dibuat!",
  "room": {
    "id": "room001",
    "name": "Chat dengan John Doe",
    "type": "private",
    "memberCount": 2
  }
}
```

**Rules:**
- **Private**: Must be friends first, exactly 1 memberIds, name auto-generated
- **Group**: Must have name, at least 1 memberIds (+ creator)
- **AI**: No members needed, name auto-generated
- Cannot create duplicate private room with same person

---

## 4. Messages

### 4.1. Send Message
**POST** `/api/messages`

**Headers (API Testing):**
```
x-api-key: secretbet
x-user-id: user001
Content-Type: application/json
```

**Request Body:**
```json
{
  "roomId": "room001",
  "message": "Hello, this is a test message!",
  "messageType": "text"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Pesan berhasil dikirim!",
  "data": {
    "messageId": "msg001",
    "roomId": "room001",
    "message": "Hello, this is a test message!",
    "timestamp": "2024-10-02T10:30:00.000Z"
  }
}
```

**Notes:**
- `messageType` defaults to "text"
- Must be member of the room
- Updates room's `lastMessage` and `lastActivity`
- Also broadcasts via Socket.io to room members

### 4.2. Get Messages by Room ID (PAGINATED)
**GET** `/api/messages/[roomId]`

**Headers (API Testing):**
```
x-api-key: secretbet
x-user-id: user001
```

**Query Parameters:**
- `limit` (optional): Number of messages (default 30)
- `before` (optional): ISO timestamp for pagination

**Examples:**
```
GET /api/messages/room001
GET /api/messages/room001?limit=50
GET /api/messages/room001?limit=30&before=2024-10-02T10:00:00.000Z
```

**Response:**
```json
{
  "success": true,
  "data": {
    "roomId": "room001",
    "messages": [
      {
        "id": "msg001",
        "message": "Hello!",
        "messageType": "text",
        "timestamp": "2024-10-02T10:00:00.000Z",
        "isAI": false,
        "sender": {
          "userId": "user002",
          "username": "john",
          "displayName": "John Doe",
          "avatar": null
        },
        "isOwn": false
      },
      {
        "id": "msg002",
        "message": "Hi John!",
        "messageType": "text",
        "timestamp": "2024-10-02T10:01:00.000Z",
        "isAI": false,
        "sender": {
          "userId": "user001",
          "username": "testuser",
          "displayName": "Test User",
          "avatar": null
        },
        "isOwn": true
      }
    ],
    "hasMore": false,
    "oldestTimestamp": "2024-10-02T10:00:00.000Z"
  }
}
```

**Notes:**
- WhatsApp-style pagination (load older messages)
- Returns messages oldest-to-newest
- `hasMore`: true if older messages exist
- `isOwn`: true if message is from current user

---

## 5. Users

### 5.1. Search Users
**GET** `/api/users/search`

**Headers (API Testing):**
```
x-api-key: secretbet
x-user-id: user001
```

**Query Parameters:**
- `q` (required): Search query

**Example:**
```
GET /api/users/search?q=john
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "userId": "user002",
        "username": "john",
        "displayName": "John Doe",
        "avatar": null
      },
      {
        "userId": "user005",
        "username": "johnny",
        "displayName": "Johnny Cash",
        "avatar": null
      }
    ],
    "count": 2
  }
}
```

**Notes:**
- Case-insensitive search
- Searches username AND displayName
- Max 10 results
- Excludes yourself from results

---

## 6. Additional Endpoints

### 6.1. Database Test (NEW)
**GET** `/api/test-db`

**Response:**
```json
{
  "success": true,
  "message": "MongoDB connection successful!",
  "timestamp": "2024-10-02T12:00:00.000Z"
}
```

**Purpose:** Test database connectivity

### 6.2. Socket.io Test (BROKEN)
**GET** `/api/socket`

**Note:** This endpoint has syntax errors and is non-functional

**Response (Error):**
```json
{
  "success": false,
  "message": "Socket.io endpoint has implementation issues"
}
```

---

## 🔌 Socket.io Events

**Server Location:** `server.js` (NOT in API routes)

**Connection:** `http://localhost:1630`

### Client → Server Events

**join_room**
```javascript
socket.emit("join_room", "room001");
```

**leave_room**
```javascript
socket.emit("leave_room", "room001");
```

**send_message**
```javascript
socket.emit("send_message", {
  roomId: "room001",
  text: "Hello!",
  sender: "Test User",
  time: "10:30"
});
```

**typing_start**
```javascript
socket.emit("typing_start", {
  roomId: "room001",
  userName: "Test User"
});
```

**typing_stop**
```javascript
socket.emit("typing_stop", {
  roomId: "room001",
  userName: "Test User"
});
```

### Server → Client Events

**receive_message**
```javascript
socket.on("receive_message", (data) => {
  console.log(data); // {roomId, text, sender, time}
});
```

**typing_start**
```javascript
socket.on("typing_start", (data) => {
  console.log(data); // {roomId, userName}
});
```

**typing_stop**
```javascript
socket.on("typing_stop", (data) => {
  console.log(data); // {roomId, userName}
});
```

---

## 🧪 Testing with Postman

### Updated Collection Variables:
- `base_url`: `http://localhost:1630` (CHANGED from 3000)
- `api_key`: `secretbet`
- `user_id`: `user001` (or your test user ID)

### Updated Headers:
Instead of JWT token, use:
```
x-api-key: {{api_key}}
x-user-id: {{user_id}}
```

### Test Flow:
1. **Register** new account
2. **Test endpoints** with API key headers (no login needed)
3. **Search users**
4. **Add friend**
5. **Create room**
6. **Send message**
7. **Get messages**

---

## ⚠️ Common Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Login dulu untuk lihat daftar teman"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Kamu bukan member room ini"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "Room tidak ditemukan"
}
```

**410 Gone (Deprecated Endpoint)**
```json
{
  "success": false,
  "message": "Endpoint /api/login sudah tidak dipakai. Gunakan NextAuth untuk login di browser, atau API key untuk testing Postman."
}
```

**500 Internal Server Error**
```json
{
  "success": false,
  "message": "Ada error waktu ambil daftar teman",
  "error": "Error details here"
}
```

---

## 🔑 Authentication & Security

### API Key Configuration:
- **Key**: `secretbet` (stored in code)
- **User ID**: Your user ID (e.g., `user001`)

⚠️ **IMPORTANT**: Move API key to environment variable in production!

### Session Management:
- **NextAuth**: 7-day expiry, 1-day sliding refresh
- **API Key**: Stateless, no expiry (development only)

---

## 📊 Database Collections

- `users` - User accounts with custom IDs
- `friendships` - Friend relationships (pending/accepted)
- `rooms` - Chat rooms (private/group/ai)
- `messages` - Chat messages with pagination

---

## 🎯 Quick Test Script (Updated)

```bash
# Set base URL
BASE_URL="http://localhost:1630"

# 1. Register
curl -X POST $BASE_URL/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","email":"test1@test.com","password":"12345678","displayName":"Test One"}'

# 2. Test with API key (no login needed)
curl -X GET $BASE_URL/api/rooms \
  -H "x-api-key: secretbet" \
  -H "x-user-id: user001"

# 3. Send message
curl -X POST $BASE_URL/api/messages \
  -H "x-api-key: secretbet" \
  -H "x-user-id: user001" \
  -H "Content-Type: application/json" \
  -d '{"roomId":"room001","message":"Hello from API!"}'
```

---

## 🔧 Migration Notes

### From Old Documentation:
1. **Port Change**: 3000 → 1630
2. **Auth Method**: JWT token → API key + User ID (for testing)
3. **Deprecated**: `/api/login` endpoint
4. **New**: Slug-based room routing
5. **Enhanced**: Friend request management

### Breaking Changes:
- ❌ `POST /api/login` - Returns 410 Gone
- 🔄 All endpoints require different auth headers
- 🆕 Base URL port change

---

**Last Updated**: November 6, 2024
**Version**: 5.1.0 (Updated)
**Status**: Production Ready with API Key Testing Support