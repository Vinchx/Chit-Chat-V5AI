# ChitChat v5.1 - Partykit Integration

Partykit adalah platform real-time WebSocket yang di-host di Cloudflare Edge. **FREE tier: 1 juta connections/bulan!**

---

## Arsitektur

```
┌─────────────────────────────────────┐
│  Next.js App (Vercel)               │
│  - UI Components                    │
│  - REST API (/api/*)                │
│  - MongoDB queries                  │
└─────────────────────────────────────┘
           ↓ WebSocket
┌─────────────────────────────────────┐
│  Partykit Server (Cloudflare Edge) │
│  - Real-time messaging              │
│  - Typing indicators                │
│  - Online presence                  │
└─────────────────────────────────────┘
```

---

## File Structure

```
chit-chat-v5.1-ai/
├── party/
│   └── chatroom.ts          ← Partykit server code
├── src/
│   ├── lib/
│   │   └── partykit-client.js  ← Client helper
│   └── app/
│       └── dashboard/
│           └── chat/
│               └── [roomSlug]/
│                   ├── page.jsx           ← Socket.IO version (OLD)
│                   └── page-partykit.jsx  ← Partykit version (NEW)
├── partykit.json            ← Partykit config
└── .env.local              ← Environment variables
```

---

## Development Setup

### 1. Install Dependencies

Sudah ter-install:
```bash
npm install partykit partysocket
```

### 2. Start Partykit Dev Server

Buka **terminal pertama**:
```bash
npm run dev:partykit
```

Output:
```
🎈 Partykit v0.0.115

▲ Running server on http://127.0.0.1:1999
  - Main party: chatroom
```

### 3. Start Next.js Server

Buka **terminal kedua**:
```bash
npm run dev
```

Output:
```
Server running on http://localhost:1630
```

### 4. Test Partykit

1. Buka browser: `http://localhost:1630`
2. Login
3. Buka chat room
4. Rename file `page-partykit.jsx` → `page.jsx` (backup old `page.jsx` dulu)
5. Test kirim message

---

## Environment Variables

### `.env.local`

```env
# Partykit Configuration
# Development
NEXT_PUBLIC_PARTYKIT_HOST=127.0.0.1:1999

# Production (setelah deploy)
# NEXT_PUBLIC_PARTYKIT_HOST=chitchat-v5.YOUR_USERNAME.partykit.dev
```

---

## Features

### ✅ Implemented

1. **Real-time Messaging**
   - Broadcast message ke semua user di room
   - Instant delivery (< 50ms latency)

2. **Typing Indicators**
   - Lihat siapa yang sedang mengetik
   - Auto-remove setelah 3 detik

3. **Online Presence**
   - Track user yang online di room
   - Broadcast saat user join/leave

4. **Stateful Rooms**
   - Setiap room punya state independent
   - Auto-hibernate saat room kosong

### 🔜 Todo

1. **Read Receipts** (sudah ada fungsi, tinggal implement UI)
2. **Message History** (simpan di Partykit storage)
3. **Reactions** (emoji reactions ke message)

---

## API Reference

### Partykit Server (`party/chatroom.ts`)

#### Events Handled:

| Event | Description | Payload |
|-------|-------------|---------|
| `message` | User kirim message | `{ type, message, messageId }` |
| `typing` | User mulai ketik | `{ type }` |
| `stop-typing` | User berhenti ketik | `{ type }` |
| `read-receipt` | User baca message | `{ type, messageId }` |

#### Events Broadcast:

| Event | Description | Payload |
|-------|-------------|---------|
| `new-message` | Message baru | `{ type, messageId, message, userId, username, timestamp }` |
| `user-joined` | User join room | `{ type, userId, username, totalUsers, timestamp }` |
| `user-left` | User leave room | `{ type, userId, username, totalUsers, timestamp }` |
| `user-typing` | User sedang ketik | `{ type, userId, username }` |
| `user-stop-typing` | User berhenti ketik | `{ type, userId }` |
| `online-users` | List user online | `{ type, users: [{userId, username}] }` |

### Client (`src/lib/partykit-client.js`)

#### `createChatSocket(roomId, user, callbacks)`

```javascript
const socket = createChatSocket(
  "room001",           // Room ID
  {                    // User info
    id: "user001",
    username: "John"
  },
  {                    // Callbacks
    onMessage: (data) => {},
    onUserJoined: (data) => {},
    onUserLeft: (data) => {},
    onTyping: (data) => {},
    onStopTyping: (data) => {},
    onOnlineUsers: (users) => {},
    onConnect: () => {},
    onDisconnect: () => {},
    onError: (error) => {}
  }
)
```

#### Helper Functions

```javascript
// Kirim message
sendMessage(socket, { id: "msg123", text: "Hello" })

// Typing indicator
sendTyping(socket)
sendStopTyping(socket)

// Read receipt
sendReadReceipt(socket, "msg123")
```

---

## Deployment

### Option 1: Deploy ke Partykit Cloud (Recommended)

#### 1. Create Partykit Account

```bash
npx partykit login
```

Browser akan terbuka, login dengan GitHub.

#### 2. Deploy Partykit Server

```bash
npx partykit deploy
```

Output:
```
✓ Deployed to https://chitchat-v5.YOUR_USERNAME.partykit.dev
```

#### 3. Update Environment Variable

Di Vercel dashboard (atau `.env.production`):
```env
NEXT_PUBLIC_PARTYKIT_HOST=chitchat-v5.YOUR_USERNAME.partykit.dev
```

#### 4. Deploy Next.js ke Vercel

```bash
vercel deploy --prod
```

### Option 2: Railway (Next.js + Custom Partykit Host)

Kalau mau host Partykit sendiri (advanced):

1. Deploy Partykit ke Railway/Fly.io
2. Update `NEXT_PUBLIC_PARTYKIT_HOST` ke custom domain

---

## Pricing

### Partykit Free Tier

✅ **1 juta connections/month** (cukup untuk 10,000+ users aktif!)
✅ 10GB bandwidth
✅ 100 concurrent parties (rooms)
✅ Unlimited projects

### Partykit Pro ($20/month)

✅ 10 juta connections
✅ 100GB bandwidth
✅ 1000 concurrent parties
✅ Custom domains
✅ Priority support

**Kesimpulan:** Free tier sangat generous! 🎉

---

## Monitoring

### 1. Partykit Dashboard

Buka: https://www.partykit.io/dashboard

Lihat:
- Total connections
- Active parties (rooms)
- Bandwidth usage
- Error logs

### 2. Browser DevTools

```javascript
// Check connection status
console.log(socket.readyState)
// 0 = CONNECTING
// 1 = OPEN
// 2 = CLOSING
// 3 = CLOSED

// Send test message
socket.send(JSON.stringify({ type: "message", message: "Test" }))
```

### 3. Partykit Server Logs

Di terminal `npm run dev:partykit`:
```
✅ User John (user001) joined room room001
📨 Message from John: { type: 'message', ... }
❌ User John left room room001
```

---

## Debugging

### Issue: Connection Failed

**Check:**
1. Partykit dev server running? (`npm run dev:partykit`)
2. `NEXT_PUBLIC_PARTYKIT_HOST` correct?
3. Firewall blocking port 1999?

**Solution:**
```bash
# Terminal 1
npm run dev:partykit

# Terminal 2
npm run dev

# Browser
http://localhost:1630
```

### Issue: Messages Tidak Sampai

**Check:**
1. Browser console untuk errors
2. Partykit server logs
3. Room ID sama antara sender/receiver?

**Debug:**
```javascript
// Di browser console
socket.addEventListener('message', (e) => {
  console.log('Raw message:', e.data)
})
```

### Issue: Typing Indicator Stuck

**Penyebab:** `stop-typing` tidak terkirim

**Solution:**
Sudah ada auto-timeout 3 detik di `page-partykit.jsx`:
```javascript
onTyping: (data) => {
  setTypingUsers((prev) => new Set(prev).add(data.username))

  // Auto remove setelah 3 detik
  setTimeout(() => {
    setTypingUsers((prev) => {
      const newSet = new Set(prev)
      newSet.delete(data.username)
      return newSet
    })
  }, 3000)
}
```

---

## Migration from Socket.IO

### Before (Socket.IO):

```javascript
// Server
io.on('connection', (socket) => {
  socket.on('message', (data) => {
    io.to(roomId).emit('new-message', data)
  })
})

// Client
socket.on('new-message', (data) => {
  setMessages(prev => [...prev, data])
})
```

### After (Partykit):

```javascript
// Server (party/chatroom.ts)
async onMessage(message: string) {
  const data = JSON.parse(message)
  this.broadcast({ type: 'new-message', ...data })
}

// Client
const socket = createChatSocket(roomId, user, {
  onMessage: (data) => {
    setMessages(prev => [...prev, data])
  }
})
```

**Differences:**
- Partykit: 1 party = 1 room (stateful, auto-managed)
- Socket.IO: Manual room management (`socket.join(roomId)`)

---

## Performance

### Latency Test

```javascript
// Client
const start = Date.now()

socket.send(JSON.stringify({
  type: 'ping',
  timestamp: start
}))

socket.addEventListener('message', (event) => {
  const data = JSON.parse(event.data)
  if (data.type === 'pong') {
    const latency = Date.now() - data.timestamp
    console.log(`Latency: ${latency}ms`)
  }
})
```

**Expected:**
- Development (localhost): 1-5ms
- Production (Cloudflare Edge): 30-100ms

---

## FAQ

### Q: Apakah harus deploy 2 tempat (Vercel + Partykit)?

**A:** Ya. Next.js di Vercel (REST API + UI), Partykit di Cloudflare (WebSocket).

### Q: Bisa pakai Partykit dengan MongoDB?

**A:** Ya! Partykit untuk real-time, MongoDB untuk persistence. Best of both worlds.

### Q: Kenapa tidak Socket.IO + Railway aja?

**A:**
- Partykit free tier lebih generous (1M conn vs $5/month)
- Latency lebih rendah (Cloudflare edge)
- Auto-scaling
- Tapi Socket.IO lebih mature & 1 deployment

### Q: Data di Partykit hilang saat restart?

**A:** Ya, kalau pakai in-memory state. Tapi bisa simpan ke Partykit Storage (persistent):

```typescript
// Save to storage
await this.party.storage.put('messages', messages)

// Load from storage
const messages = await this.party.storage.get('messages')
```

### Q: Bisa pakai custom domain untuk Partykit?

**A:** Ya, di Pro plan ($20/month).

---

## Next Steps

1. ✅ Test Partykit di development
2. ✅ Rename `page-partykit.jsx` → `page.jsx`
3. 🔜 Deploy Partykit ke production
4. 🔜 Deploy Next.js ke Vercel
5. 🔜 Test production deployment

---

## Resources

- Partykit Docs: https://docs.partykit.io
- Partykit Examples: https://github.com/partykit/partykit/tree/main/examples
- Partykit Discord: https://discord.gg/partykit

---

**ChitChat v5.1 with Partykit - Real-time, Scalable, FREE!** 🎉
