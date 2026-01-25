# 💬 Chit-Chat v5.1 AI

> A modern, real-time chat application with AI integration, built with Next.js and MongoDB

![Version](https://img.shields.io/badge/version-5.1.2-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.0.10-black)
![License](https://img.shields.io/badge/license-Private-red)

## ✨ Features

### 🎨 Modern UI/UX

- **WhatsApp-Style Interface** - Unified modal for creating chats, groups, and adding friends
- **Glassmorphism Design** - Premium glass effects with vibrant gradients
- **Smooth Animations** - GSAP-powered transitions and micro-interactions
- **Dark Mode Support** - Seamless theme switching
- **Responsive Design** - Works perfectly on all devices

### 💬 Chat Features

- **Real-time Messaging** - Powered by PartyKit WebSocket
- **Private Chats** - One-on-one conversations
- **Group Chats** - Create and manage group conversations
- **AI Chat** - Integrated Google Gemini AI assistant
- **Friend System** - Add friends, send/accept requests
- **Message Notifications** - Real-time toast notifications

### 🔐 Authentication & Security

- **NextAuth.js** - Secure authentication system
- **Passkey Support** - WebAuthn/FIDO2 for admin panel
- **MongoDB Adapter** - Persistent session management
- **Password Hashing** - bcrypt encryption
- **JWT Tokens** - Secure token-based auth

### 🤖 AI Integration

- **Google Gemini AI** - Advanced conversational AI
- **Context-Aware** - Maintains conversation history
- **Smart Commands** - `/ai` command for quick access
- **Streaming Responses** - Real-time AI message streaming

## 🚀 Tech Stack

### Frontend

- **Next.js 16** - React framework with App Router
- **React 18** - UI library
- **Tailwind CSS 4** - Utility-first CSS
- **GSAP** - Animation library
- **Motion** - Framer Motion for animations
- **Lucide React** - Icon library
- **Sonner** - Toast notifications

### Backend

- **MongoDB** - Database with Mongoose ODM
- **NextAuth.js** - Authentication
- **PartyKit** - Real-time WebSocket server
- **Socket.io** - Fallback real-time communication
- **Nodemailer** - Email service

### AI & ML

- **Google Gemini AI** - Conversational AI
- **@google/generative-ai** - Gemini SDK

### Security

- **SimpleWebAuthn** - Passkey authentication
- **bcrypt** - Password hashing
- **JWT** - Token management

## 📦 Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/chit-chat-v5.1-ai.git
cd chit-chat-v5.1-ai
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create `.env.local` file:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/chitchat
# or for Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chitchat

# NextAuth
NEXTAUTH_URL=http://localhost:1630
NEXTAUTH_SECRET=your-secret-key-here

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# PartyKit
NEXT_PUBLIC_PARTYKIT_HOST=127.0.0.1:1999

# Email (optional)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

4. **Run development server**

```bash
# Start Next.js dev server
npm run dev:fast

# In another terminal, start PartyKit
npm run dev:partykit
```

5. **Open your browser**

```
http://localhost:1630
```

## 🛠️ Available Scripts

| Script                   | Description                      |
| ------------------------ | -------------------------------- |
| `npm run dev`            | Start production server          |
| `npm run dev:fast`       | Start Next.js dev with Turbopack |
| `npm run dev:partykit`   | Start PartyKit WebSocket server  |
| `npm run dev:with-ngrok` | Start dev + ngrok tunnel         |
| `npm run dev:atlas`      | Start with MongoDB Atlas         |
| `npm run build`          | Build for production             |
| `npm start`              | Start production server          |
| `npm run lint`           | Run ESLint                       |

## 📁 Project Structure

```
chit-chat-v5.1-ai/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── rooms/         # Chat room endpoints
│   │   │   ├── friends/       # Friend system endpoints
│   │   │   └── users/         # User management
│   │   ├── dashboard/         # Main dashboard
│   │   │   ├── chat/          # Chat interface
│   │   │   └── layout.jsx     # Dashboard layout
│   │   ├── auth/              # Auth pages
│   │   ├── profile/           # User profile
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── AddFriendModal.jsx
│   │   ├── FlowingRoomItem.jsx
│   │   ├── FlowingFriendItem.jsx
│   │   └── Dock.jsx
│   ├── contexts/              # React contexts
│   │   └── UserContext.js
│   ├── lib/                   # Utilities
│   │   ├── mongodb.js
│   │   ├── webauthn.js
│   │   └── cookie-utils.js
│   └── models/                # Mongoose models
│       ├── User.js
│       ├── Room.js
│       └── Message.js
├── party/                     # PartyKit server
│   └── index.ts
├── public/                    # Static assets
├── .env.local                 # Environment variables
├── package.json
└── README.md
```

## 🎯 Key Features Explained

### Unified Chat Modal

The WhatsApp-inspired modal combines multiple actions:

- **Search Users** - Find and add new friends
- **Create Group** - Set up group chats with multiple members
- **Start AI Chat** - Begin conversation with AI assistant
- **Quick Chat** - Click any friend to start private chat

### Real-time Communication

- **PartyKit WebSocket** - Primary real-time engine
- **Socket.io Fallback** - Ensures connectivity
- **Optimistic Updates** - Instant UI feedback
- **Message Queue** - Handles offline messages

### AI Assistant

- **Context Retention** - Remembers conversation history
- **Smart Responses** - Powered by Gemini 2.0 Flash
- **Command System** - `/ai` for quick access
- **Streaming** - Real-time response generation

## 🔒 Security Features

- **Passkey Authentication** - WebAuthn for admin panel
- **Password Encryption** - bcrypt with salt rounds
- **Session Management** - Secure JWT tokens
- **CSRF Protection** - Built-in NextAuth protection
- **Input Validation** - Server-side validation
- **XSS Prevention** - Sanitized user inputs

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## 🤝 Contributing

This is a private project. For contributions, please contact the maintainer.

## 📝 License

Private - All rights reserved

## 👨‍💻 Author

**Vinchx**

- GitHub: [@Vinchx](https://github.com/Vinchx)

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting solutions
- Google for Gemini AI
- PartyKit for real-time infrastructure

---

Made with ❤️ using Next.js and MongoDB
