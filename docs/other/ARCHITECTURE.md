# 🏗️ Architecture Guide - ChitChat V5.1 AI

Complete technical overview of the ChitChat codebase.

---

## 📊 Technology Stack

| Layer              | Technology                                |
| ------------------ | ----------------------------------------- |
| **Frontend**       | Next.js 16 + React 18 + Tailwind CSS 4    |
| **Backend**        | Custom HTTP Server + Socket.IO + PartyKit |
| **Database**       | MongoDB + Mongoose                        |
| **Authentication** | NextAuth 5 (JWT with sliding session)     |
| **Real-time**      | Socket.IO (port 1630) + PartyKit          |
| **AI**             | Google Gemini API                         |

---

## 📁 Project Structure

```
chit-chat-v5.1-ai/
├── src/
│   ├── app/
│   │   ├── api/              # REST API routes
│   │   ├── auth/             # Authentication pages
│   │   ├── dashboard/        # Main app layout & pages
│   │   │   └── chat/[roomSlug]/ # Chat room pages
│   │   └── components/       # Shared React components
│   ├── components/           # UI components (GlassSurface, etc.)
│   ├── lib/                  # Helper utilities
│   │   ├── mongodb.js        # Database connection
│   │   └── partykit-client.js # PartyKit client helper
│   ├── models/               # Mongoose schemas
│   └── auth.js               # NextAuth configuration
├── party/
│   └── chatroom.ts           # PartyKit server code
├── server.js                 # Custom HTTP server with Socket.IO
├── docs/                     # Documentation
└── public/                   # Static assets
```

---

## 🔄 Routing Flow

### URL Structure

```
/                    → Auto-redirect based on auth status
/auth                → Login/Register page
/dashboard           → Main chat interface
/dashboard/chat/[roomSlug] → Chat room (by username or room name)
```

### Authentication Flow

```
┌─────────────────────────────────────────────────────────┐
│                    User Journey                          │
└─────────────────────────────────────────────────────────┘

    User opens app
          │
          ▼
    ╔════════════════╗
    ║ Has session?   ║
    ╚════════════════╝
       │         │
   YES ─┘         └── NO
     │                │
     ▼                ▼
┌──────────────┐  ┌──────────────┐
│ /dashboard   │  │ /auth        │
│ (Main UI)    │  │ (Login form) │
└──────────────┘  └──────────────┘
                        │
                        │ Login success
                        ▼
                  Save session
                        │
                        ▼
                  /dashboard
```

### Route Protection

| Route          | Protection | Behavior                              |
| -------------- | ---------- | ------------------------------------- |
| `/`            | Public     | Auto-redirect based on login          |
| `/auth`        | Public     | Redirect to `/dashboard` if logged in |
| `/dashboard/*` | Protected  | Redirect to `/auth` if not logged in  |

---

## 🔐 Authentication System

### NextAuth 5 Configuration

```javascript
// src/auth.js
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
  providers: [Credentials({...})],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,    // 7 days
    updateAge: 24 * 60 * 60,     // 1 day (sliding session)
  }
});
```

### Sliding Session

**Concept:** Token auto-refreshes when user is active.

| Parameter   | Value  | Meaning                                    |
| ----------- | ------ | ------------------------------------------ |
| `maxAge`    | 7 days | Token expires if idle for 7 days           |
| `updateAge` | 1 day  | Token refreshes if user active after 1 day |

**Behavior:**

- Active user: Token refreshes daily, never logs out
- Idle user (7+ days): Token expires, must re-login

### Dual Authentication Methods

1. **Browser Session** - Automatic via NextAuth
2. **API Key** - For testing with headers:
   ```
   x-api-key: secretbet
   x-user-id: user001
   ```

---

## 💾 Database Schema (ERD)

```
┌────────────────┐       ┌────────────────┐       ┌────────────────┐
│     USERS      │       │     ROOMS      │       │   MESSAGES     │
├────────────────┤       ├────────────────┤       ├────────────────┤
│ _id (PK)       │──┐    │ _id (PK)       │──┐    │ _id (PK)       │
│ username (UK)  │  │    │ name           │  │    │ roomId (FK)   ←┤──────┘
│ email (UK)     │  │    │ type           │  │    │ senderId (FK) ←┤──────┐
│ password       │  │ ┌─→│ members[]     ←┤──┤    │ message        │      │
│ displayName    │  │ │  │ createdBy (FK)←┤──┘    │ messageType    │      │
│ avatar         │  └─┤  │ lastMessage    │       │ attachment{}   │      │
│ isOnline       │    │  │ lastActivity   │       │ replyTo{}      │      │
│ isVerified     │    │  │ settings{}     │       │ timestamp      │      │
│ createdAt      │    │  └────────────────┘       └────────────────┘      │
└────────────────┘    │                                                    │
        │             └────────────────────────────────────────────────────┤
        │                                                                  │
        │  ┌────────────────┐                                              │
        │  │  FRIENDSHIPS   │                                              │
        │  ├────────────────┤                                              │
        └──┤ senderId (FK)  │                                              │
           │ receiverId (FK)├──────────────────────────────────────────────┘
           │ status         │
           │ createdAt      │
           └────────────────┘
```

### Collections

| Collection    | Description          | ID Pattern                    |
| ------------- | -------------------- | ----------------------------- |
| `users`       | User accounts        | `user001`, `user002`, ...     |
| `rooms`       | Chat rooms           | `room001`, `room002`, ...     |
| `messages`    | Chat messages        | `msg000001`, `msg000002`, ... |
| `friendships` | Friend relationships | `friend001`, `friend002`, ... |

### Room Types

| Type      | Description                   |
| --------- | ----------------------------- |
| `private` | 1-on-1 chat between 2 friends |
| `group`   | Multi-user chat room          |
| `ai`      | Chat with AI assistant        |

---

## 🔌 Real-time Infrastructure

### Dual WebSocket Implementation

```
┌─────────────────────────────────┐
│  Next.js App (localhost:1630)  │
│  - UI Components               │
│  - REST API (/api/*)           │
│  - MongoDB queries             │
└─────────────────────────────────┘
           ↓ WebSocket
┌─────────────────────────────────┐
│  Socket.IO (same port 1630)    │
│  - Message broadcasting        │
│  - Typing indicators           │
│  - Room join/leave             │
└─────────────────────────────────┘
           +
┌─────────────────────────────────┐
│  PartyKit (localhost:1999)     │
│  - Online presence             │
│  - Advanced features           │
│  - Cloudflare Edge (production)│
└─────────────────────────────────┘
```

### Socket.IO Events

**Client → Server:**
| Event | Description |
|-------|-------------|
| `join_room` | Join a chat room |
| `leave_room` | Leave a chat room |
| `send_message` | Send message to room |
| `typing_start` | Start typing indicator |
| `typing_stop` | Stop typing indicator |

**Server → Client:**
| Event | Description |
|-------|-------------|
| `receive_message` | New message received |
| `typing_start` | Someone started typing |
| `typing_stop` | Someone stopped typing |

---

## 🎨 Key Components

### Frontend Components

| Component         | Location              | Purpose                        |
| ----------------- | --------------------- | ------------------------------ |
| `MessageBubble`   | `src/app/components/` | Display chat messages          |
| `MessageInput`    | `src/app/components/` | Message input with attachments |
| `ChatHeader`      | `src/app/components/` | Room header with user info     |
| `TypingIndicator` | `src/app/components/` | Real-time typing status        |
| `GlassSurface`    | `src/components/`     | Glassmorphism UI wrapper       |

### API Routes

| Endpoint                  | Method   | Purpose                 |
| ------------------------- | -------- | ----------------------- |
| `/api/register`           | POST     | User registration       |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers       |
| `/api/friends`            | GET      | List friends & requests |
| `/api/friends/add`        | POST     | Send friend request     |
| `/api/rooms`              | GET      | List user's rooms       |
| `/api/rooms/create`       | POST     | Create new room         |
| `/api/messages`           | POST     | Send message            |
| `/api/messages/[roomId]`  | GET      | Get room messages       |
| `/api/ai/chat`            | POST     | AI chat endpoint        |

---

## 🚀 Development Guidelines

### Code Conventions

| Type       | Convention         | Example                  |
| ---------- | ------------------ | ------------------------ |
| Components | PascalCase         | `MessageBubble.jsx`      |
| API routes | kebab-case folders | `/api/friends/add/`      |
| Utilities  | kebab-case         | `auth-helpers.js`        |
| Pages      | lowercase          | `page.jsx`, `layout.jsx` |

### Adding New Features

1. **New API Endpoint:**
   - Create route in `src/app/api/[endpoint]/route.js`
   - Add auth check with `getAuthSessionOrApiKey`
   - Use Mongoose for database operations

2. **New Component:**
   - Add to `src/app/components/` or `src/components/`
   - Use Tailwind CSS for styling
   - Support dark mode

3. **New Real-time Feature:**
   - Add Socket.IO event handlers in `server.js`
   - Create client-side event listeners
   - Add PartyKit handlers if needed

---

## 📚 Related Documentation

- [Getting Started](./GETTING_STARTED.md)
- [API Reference](./API_REFERENCE.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
