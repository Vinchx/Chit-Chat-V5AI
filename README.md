# 💬 ChitChat V5.1 AI

A real-time chat application with AI integration, built with Next.js 16, PartyKit, and MongoDB.

![Version](https://img.shields.io/badge/version-5.1.1-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **Real-time Messaging** - Instant message delivery via Socket.IO & PartyKit
- **AI Chat** - Integrated Google Gemini AI for smart conversations
- **Image Generation** - Generate images with Nano Banana models
- **Typing Indicators** - See when others are typing
- **Online Presence** - Know who's online
- **Friend System** - Add friends and manage requests
- **Group Chats** - Create multi-user chat rooms
- **Dark Mode** - Full theme support
- **Glassmorphism UI** - Modern, premium design

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development servers
npm run dev:fast      # Next.js (port 1630)
npm run dev:partykit  # PartyKit (port 1999)

# Open in browser
http://localhost:1630
```

📖 See [Getting Started Guide](./docs/GETTING_STARTED.md) for full setup instructions.

---

## 📁 Project Structure

```
├── src/
│   ├── app/              # Next.js app router
│   │   ├── api/          # REST API endpoints
│   │   ├── dashboard/    # Main app pages
│   │   └── components/   # React components
│   ├── models/           # MongoDB schemas
│   └── auth.js           # NextAuth configuration
├── party/                # PartyKit server
├── docs/                 # Documentation
└── server.js             # Custom server with Socket.IO
```

---

## 📚 Documentation

| Document                                     | Description              |
| -------------------------------------------- | ------------------------ |
| [Getting Started](./docs/GETTING_STARTED.md) | Setup and installation   |
| [Architecture](./docs/ARCHITECTURE.md)       | Technical overview & ERD |
| [API Reference](./docs/API_REFERENCE.md)     | API endpoints            |
| [Troubleshooting](./docs/TROUBLESHOOTING.md) | Common issues & fixes    |

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 18, Tailwind CSS 4
- **Backend**: Node.js, Socket.IO, PartyKit
- **Database**: MongoDB, Mongoose
- **Auth**: NextAuth 5 (JWT)
- **AI**: Google Gemini API

---

## 📋 Available Scripts

| Script                 | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev:fast`     | Start Next.js with Turbopack |
| `npm run dev:partykit` | Start PartyKit dev server    |
| `npm run dev`          | Start custom server          |
| `npm run build`        | Build for production         |
| `npm start`            | Start production server      |

---

## 🌐 Deployment

### Vercel (Next.js)

```bash
vercel deploy --prod
```

### PartyKit

```bash
npx partykit login
npx partykit deploy
```

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Made with ❤️ using Next.js, PartyKit, and Google Gemini**
