# 📡 ChitChat v5.1 API Documentation

Base URL: `http://localhost:3000`

## 🔐 Authentication

All endpoints (except register & login) require JWT token in header:
```
Authorization: Bearer <your_token_here>
```

---

## 📋 Table of Contents
1. [Authentication](#1-authentication)
2. [Friends](#2-friends)
3. [Rooms](#3-rooms)
4. [Messages](#4-messages)
5. [Users](#5-users)

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

**Notes:**
- All fields required
- Custom ID format: `user001`, `user002`, etc.
- Password auto-hashed with bcrypt (10 rounds)

---

### 1.2. Login
**POST** `/api/login`

**Request Body:**
```json
{
  "login": "testuser",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login berhasil! Selamat datang! 🎉",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user001",
    "username": "testuser",
    "email": "testuser@example.com",
    "displayName": "Test User"
  }
}
```

**Notes:**
- `login` can be username OR email
- Token valid for 7 days
- Save token for subsequent requests

---

## 2. Friends

### 2.1. Get Friends List
**GET** `/api/friends`

**Headers:**
```
Authorization: Bearer <token>
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

**Notes:**
- `friends`: Accepted friendships
- `pendingReceived`: Requests YOU need to respond to
- `pendingSent`: Requests waiting for OTHERS to respond

---

### 2.2. Add Friend
**POST** `/api/friends/add`

**Headers:**
```
Authorization: Bearer <token>
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

---

### 2.3. Respond to Friend Request
**POST** `/api/friends/respond`

**Headers:**
```
Authorization: Bearer <token>
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

**Notes:**
- Only receiver can respond
- Action must be "accept" or "reject"
- Updates status and adds `respondedAt` timestamp

---

## 3. Rooms

### 3.1. Get All Rooms
**GET** `/api/rooms`

**Headers:**
```
Authorization: Bearer <token>
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

**Notes:**
- Only returns rooms where you're a member
- Sorted by lastActivity (newest first)
- Private rooms include `friend` object
- Group rooms include `members` array

---

### 3.2. Create Room
**POST** `/api/rooms/create`

**Headers:**
```
Authorization: Bearer <token>
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

**Headers:**
```
Authorization: Bearer <token>
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

---

### 4.2. Get Messages (Latest)
**GET** `/api/messages/:roomId`

**Headers:**
```
Authorization: Bearer <token>
```

**Example:**
```
GET /api/messages/room001
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

**Query Parameters:**
- `limit` (optional): Number of messages (default 30)
- `before` (optional): ISO timestamp for pagination

**Examples:**
```
GET /api/messages/room001?limit=50
GET /api/messages/room001?limit=30&before=2024-10-02T10:00:00.000Z
```

**Notes:**
- WhatsApp-style pagination
- Returns messages oldest-to-newest
- `hasMore`: true if older messages exist
- `isOwn`: true if message is from current user

---

## 5. Users

### 5.1. Search Users
**GET** `/api/users/search`

**Headers:**
```
Authorization: Bearer <token>
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

## 🔌 Socket.io Events

Connect to: `http://localhost:3000`

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

1. **Import Collection**: Import `ChitChat_API_Collection.postman_collection.json`
2. **Set Variables**:
   - `base_url`: `http://localhost:3000`
   - `token`: Will auto-save after login
3. **Test Flow**:
   1. Register new account
   2. Login (token auto-saved)
   3. Search users
   4. Add friend
   5. Accept friend request (from another account)
   6. Create private room
   7. Send message
   8. Get messages

---

## ⚠️ Common Error Responses

**401 Unauthorized**
```json
{
  "success": false,
  "message": "Login dulu untuk lihat daftar teman"
}
```

**404 Not Found**
```json
{
  "success": false,
  "message": "User nggak ditemukan. Coba cek lagi username/email-nya"
}
```

**403 Forbidden**
```json
{
  "success": false,
  "message": "Kamu tidak punya akses ke room ini"
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

## 🔑 JWT Secret

Current secret: `secretbet` (stored in code)

⚠️ **IMPORTANT**: Move to environment variable in production!

---

## 📊 Database Collections

- `users` - User accounts
- `friendships` - Friend relationships
- `rooms` - Chat rooms
- `messages` - Chat messages

---

## 🎯 Quick Test Script

```bash
# 1. Register
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test1","email":"test1@test.com","password":"123","displayName":"Test One"}'

# 2. Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"login":"test1","password":"123"}'

# Save token from response, then:

# 3. Get rooms
curl -X GET http://localhost:3000/api/rooms \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

**Last Updated**: October 2, 2024
**Version**: 5.1.0
