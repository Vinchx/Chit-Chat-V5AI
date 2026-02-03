# 🚀 Getting Started - ChitChat V5.1 AI

Quick guide to get ChitChat running locally.

---

## 📋 Prerequisites

- **Node.js** 18+ installed
- **MongoDB** database (local or MongoDB Atlas)
- Same **WiFi network** for multi-device testing

---

## ⚡ Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```env
MONGODB_URI=mongodb+srv://your-connection-string
NEXTAUTH_SECRET=your-secret-key
GEMINI_API_KEY=your-gemini-api-key

# For local network access
NEXT_PUBLIC_SERVER_URL=http://YOUR_IP:1630
NEXT_PUBLIC_PARTYKIT_HOST=127.0.0.1:1999
```

### 3. Start Development Servers

**Terminal 1 - Next.js Server:**

```bash
npm run dev:fast
```

Server runs at: `http://localhost:1630`

**Terminal 2 - PartyKit Server (Real-time):**

```bash
npm run dev:partykit
```

PartyKit runs at: `http://127.0.0.1:1999`

### 4. Open in Browser

```
http://localhost:1630
```

---

## 📱 Access from Other Devices (Local Network)

### Find Your IP Address

**Windows:**

```bash
ipconfig
```

Look for `IPv4 Address`, e.g., `192.168.10.16`

### Update Configuration

1. Update `.env.local`:

   ```env
   NEXT_PUBLIC_SERVER_URL=http://192.168.10.16:1630
   ```

2. Restart server

### Allow Firewall (Windows)

```powershell
# Run as Administrator
netsh advfirewall firewall add rule name="ChitChat Port 1630" dir=in action=allow protocol=TCP localport=1630
```

### Access from Phone/Other Device

Open browser and go to:

```
http://192.168.10.16:1630
```

---

## 🔌 PartyKit Setup

PartyKit provides real-time WebSocket functionality (typing indicators, presence, instant messages).

### Development

PartyKit dev server runs locally:

```bash
npm run dev:partykit
```

### Production Deployment

1. **Login to PartyKit:**

   ```bash
   npx partykit login
   ```

2. **Deploy:**

   ```bash
   npx partykit deploy
   ```

3. **Update environment variable:**
   ```env
   NEXT_PUBLIC_PARTYKIT_HOST=chitchat-v5.YOUR_USERNAME.partykit.dev
   ```

### PartyKit Features

| Feature             | Description                      |
| ------------------- | -------------------------------- |
| Real-time Messaging | Instant message delivery (<50ms) |
| Typing Indicators   | See who's typing                 |
| Online Presence     | Track online users               |
| Stateful Rooms      | Each room has independent state  |

---

## 🧪 Testing Checklist

### Local Testing

- [ ] Open `http://localhost:1630`
- [ ] Register new account
- [ ] Login successfully
- [ ] Dashboard loads

### Multi-Device Testing

- [ ] Connect devices to same WiFi
- [ ] Access via IP address
- [ ] Login from 2 devices
- [ ] Send message from Device 1
- [ ] Receive message real-time on Device 2
- [ ] Typing indicator works

---

## 🛠️ Troubleshooting

### "Site can't be reached" from phone

1. Check if devices on same WiFi
2. Verify IP address is correct
3. Check firewall settings

### Socket.io not connecting

1. Check browser console for errors
2. Verify `NEXT_PUBLIC_SERVER_URL` in `.env.local`
3. Restart both servers

### PartyKit connection failed

1. Ensure PartyKit server is running (`npm run dev:partykit`)
2. Check `NEXT_PUBLIC_PARTYKIT_HOST` value
3. Check if port 1999 is not blocked

---

## 📚 Next Steps

- [Architecture Guide](./ARCHITECTURE.md) - Understand the codebase
- [API Reference](./API_REFERENCE.md) - API endpoints documentation
- [Troubleshooting](./TROUBLESHOOTING.md) - Common issues and fixes

---

## 📋 Available Scripts

| Script                 | Description                     |
| ---------------------- | ------------------------------- |
| `npm run dev`          | Start custom server (Socket.io) |
| `npm run dev:fast`     | Start Next.js with Turbopack    |
| `npm run dev:partykit` | Start PartyKit dev server       |
| `npm run build`        | Build for production            |
| `npm start`            | Start production server         |

---

**Port:** `1630` (NOT 3000!)
