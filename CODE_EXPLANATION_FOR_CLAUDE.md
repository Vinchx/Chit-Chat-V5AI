# 📖 Kode Penjelasan ChitChat V5.1 AI untuk Claude Web/App

## 🎯 **Tujuan Dokumen**
Dokumen ini berisi penjelasan lengkap tentang kode project ChitChat V5.1 AI yang dapat digunakan sebagai konteks untuk Claude Web/App dalam melakukan development, debugging, atau penambahan fitur.

---

## 🏗️ **Arsitektur Project Overview**

### **Technology Stack**
- **Frontend**: Next.js 15.5.3 + React 19.1.0 + Tailwind CSS 4
- **Backend**: Custom HTTP Server + Socket.IO + PartyKit
- **Database**: MongoDB + Mongoose
- **Authentication**: NextAuth 5 dengan JWT strategy
- **Real-time**: Socket.IO (port 1630) + PartyKit integration

### **Project Structure**
```
Chit-Chat-V5AI/
├── src/
│   ├── app/
│   │   ├── api/           # REST API routes
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Main application layout & pages
│   │   └── components/    # Reusable React components
│   ├── lib/               # Helper utilities
│   ├── models/            # Database schemas
│   └── auth.js            # NextAuth configuration
├── party/                 # PartyKit serverless functions
├── server.js              # Custom HTTP server with Socket.IO
└── Configuration files
```

---

## 🔐 **Authentication System (`src/auth.js`)**

### **NextAuth Configuration**
```javascript
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),  // MongoDB integration
  providers: [
    Credentials({
      // Custom credentials provider
      // Support login via username OR email
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,    // 7 hari timeout
    updateAge: 24 * 60 * 60,     // 1 hari sliding session
  }
});
```

### **Sliding Session Implementation**
- **Concept**: Token auto-refresh untuk user aktif
- **Behavior**: User yang aktif tidak akan logout otomatis
- **Configuration**: `maxAge: 7 hari`, `updateAge: 1 hari`

---

## 🌐 **Server Configuration (`server.js`)**

### **Custom HTTP Server dengan Socket.IO**
```javascript
const server = createServer((req, res) => {
    handle(req, res);  // Next.js request handler
});

const io = new Server(server, {
    cors: {
        origin: dev ? ["http://localhost:1630", "http://192.168.10.16:1630"] : "https://Chit-Chat-V5AI",
        credentials: true
    }
});
```

### **Socket.IO Events**
- `join_room` - User joins chat room
- `leave_room` - User leaves chat room
- `send_message` - Real-time message broadcasting
- `typing_start/typing_stop` - Typing indicators
- `disconnect` - User leaves application

### **Port Configuration**
- **Development**: Port 1630
- **Network Access**: Support localhost & IP addresses
- **CORS**: Multi-origin support untuk development

---

## 📱 **Frontend Architecture**

### **Main Application Layout (`src/app/dashboard/layout.jsx`)**
```javascript
export default function DashboardLayout({ children }) {
  // State management:
  const [user, setUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeTab, setActiveTab] = useState("chats");

  // Tabs: Chats, Friends, Requests
  // Real-time data loading with useEffect
  // Authentication check with useSession hook
}
```

### **Key Features in Layout:**
- **3-tab navigation system**
- **Friend request management**
- **Room listing with last messages**
- **User profile display**
- **Modal management system**

### **Routing Logic (`src/app/page.jsx`)**
```javascript
export default function Home() {
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      router.push('/dashboard');  // Authenticated users
    } else {
      router.push('/auth');       // Unauthenticated users
    }
  }, [router]);
}
```

---

## 🔌 **API Routes Structure**

### **Authentication API (`src/app/api/auth/[...nextauth]/route.js`)**
```javascript
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

### **Room Management API (`src/app/api/rooms/`)**
- `POST /api/rooms/create` - Create new room
- `GET /api/rooms` - List user rooms
- `GET /api/rooms/[roomId]` - Get room details
- `GET /api/rooms/by-slug/[slug]` - Room by slug

### **Room Types Supported**
- **private** - 1-on-1 chat
- **group** - Multi-user chat
- **ai** - AI-powered chat

### **Friends API (`src/app/api/friends/`)**
- `POST /api/friends/add` - Send friend request
- `GET /api/friends` - List friends & requests
- `POST /api/friends/respond` - Accept/decline requests

---

## 🎨 **Component Architecture**

### **Core Components (`src/app/components/`)**

#### **MessageBubble.jsx**
- Display chat messages with styling
- Support different message types (user vs other)
- Timestamp formatting
- Read receipts indicators

#### **MessageInput.jsx & MessageInput-partykit.jsx**
- Dual implementation for Socket.IO vs PartyKit
- Real-time message sending
- Typing indicator triggers
- File attachment support (future feature)

#### **AddFriendModal.jsx**
- Friend search functionality
- Request sending
- Validation and error handling

#### **ChatHeader.jsx**
- Room information display
- User avatars
- Room settings access

#### **TypingIndicator.jsx**
- Real-time typing status
- Multiple users support
- Auto-hide timeout

---

## 🔧 **Real-time Infrastructure**

### **Dual WebSocket Implementation**

#### **1. Socket.IO Server (`server.js`)**
```javascript
io.on("connection", (socket) => {
    socket.on("send_message", (data) => {
        socket.to(data.roomId).emit("receive_message", data);
    });
});
```

#### **2. PartyKit Integration (`party/chatroom.ts`)**
```typescript
export default class ChatRoom implements Party.Server {
  connections = new Map<string, { userId: string; username: string }>();

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    // User join logic
    this.broadcast({ type: "user-joined", userId, username });
  }
}
```

### **Real-time Features**
- **Message broadcasting** to room members
- **Typing indicators** across all platforms
- **User presence** tracking
- **Connection management** with graceful disconnections

---

## 💾 **Database Schema**

### **User Model (`src/models/User.js`)**
```javascript
const userSchema = new mongoose.Schema({
  userId: { type: String, unique: true },  // Custom ID: user001, user002
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },  // bcrypt hashed
  displayName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
```

### **Database Connection (`src/lib/mongodb.js`)**
- MongoDB connection with pooling
- Error handling and reconnection logic
- Environment-based configuration

---

## 🎯 **State Management Patterns**

### **Client-side State**
- **useState** for local component state
- **useEffect** for data fetching and lifecycle
- **useSession** for authentication state
- **localStorage** for client persistence

### **Real-time State Synchronization**
- **Socket events** for instant updates
- **API polling** as fallback
- **Optimistic updates** for better UX

---

## 🚀 **Development & Deployment**

### **Development Setup**
```bash
npm run dev          # Start development server on port 1630
npm run dev:partykit # Start PartyKit dev server
npm run build        # Build for production
```

### **Environment Variables Required**
```
NEXTAUTH_SECRET=your_secret_key
MONGODB_URI=mongodb://connection_string
```

### **Production Considerations**
- **CORS configuration** for production domains
- **Database connection pooling**
- **Security headers** implementation
- **Performance monitoring** with Vercel Speed Insights

---

## 🔍 **Key Implementation Details**

### **Authentication Flow**
1. User visits `/` → redirected based on auth status
2. Unauthenticated → `/auth` page
3. Login via credentials (username/email + password)
4. JWT token issued with sliding session
5. Redirect to `/dashboard` with session

### **Room Creation Flow**
1. User selects room type (private/group/ai)
2. API call to `/api/rooms/create`
3. Room created with unique slug
4. User redirected to `/dashboard/chat/[roomSlug]`
5. WebSocket connection established

### **Real-time Messaging Flow**
1. User types message → typing indicator sent
2. Message sent via WebSocket or API
3. Server broadcasts to room members
4. Recipients update UI in real-time
5. Message saved to database

---

## 🛠️ **Common Development Tasks**

### **Adding New API Endpoint**
1. Create route file in `src/app/api/[endpoint]/route.js`
2. Implement authentication check with `getAuthSessionOrApiKey`
3. Add database operations with Mongoose
4. Return standardized response format

### **Creating New Component**
1. Add component to `src/app/components/`
2. Follow existing naming convention (PascalCase)
3. Use Tailwind CSS for styling
4. Implement proper error boundaries

### **Adding Real-time Feature**
1. Add Socket.IO event handlers in `server.js`
2. Create corresponding client-side event listeners
3. Implement PartyKit handlers if needed
4. Add UI components for feature

---

## 🐛 **Debugging & Troubleshooting**

### **Common Issues**
- **Authentication failures** → Check NextAuth configuration
- **WebSocket connection issues** → Verify CORS settings
- **Database connection problems** → Check MongoDB URI
- **Real-time updates not working** → Check event listeners

### **Debugging Tools**
- **Browser DevTools** for network requests
- **MongoDB logs** for database operations
- **Socket.IO debugging** with console logs
- **Next.js debug mode** with `npm run dev:debug`

---

## 📚 **Documentation Files Available**
- `API_DOCUMENTATION.md` - Complete API reference
- `ROUTING_TUTORIAL.md` - Navigation flow explanation
- `PARTYKIT_SETUP.md` - PartyKit configuration guide
- `SLIDING_SESSION_EXPLAINED.md` - Authentication session details
- `LOCAL_HOSTING_GUIDE.md` - Local development setup

---

## 🎯 **Development Guidelines for Claude**

When working with this codebase:

1. **Always check authentication** - Most routes require auth
2. **Use existing patterns** - Follow established code patterns
3. **Maintain consistency** - Use existing naming conventions
4. **Test real-time features** - Verify WebSocket functionality
5. **Handle errors gracefully** - Follow error handling patterns
6. **Update documentation** - Keep docs synchronized with code

### **File Naming Conventions**
- Components: `PascalCase.jsx` (e.g., `MessageBubble.jsx`)
- API routes: `kebab-case` directory structure (e.g., `/api/friends/add/`)
- Utilities: `kebab-case.js` (e.g., `auth-helpers.js`)
- Pages: `kebab-case` (e.g., `page.jsx`, `layout.jsx`)

### **Code Style**
- **ESLint** configuration enforced
- **Tailwind CSS** for all styling
- **React functional components** with hooks
- **async/await** for asynchronous operations
- **Destructuring** for cleaner code

---

**Dokumen ini mencakup semua aspek penting dari kode ChitChat V5.1 AI dan dapat digunakan sebagai referensi komprehensif untuk development dengan Claude Web/App.**