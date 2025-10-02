# 🔧 Perbaikan Struktur Routing ChitChat

## 📊 Struktur Routing Saat Ini (Before)

```
src/app/
├── page.js              → http://localhost:3000/
├── pages/
│   └── auth/
│       └── page.js      → http://localhost:3000/pages/auth ❌ URL jelek!
└── dashboard/
    └── page.jsx         → http://localhost:3000/dashboard ✅
```

**Masalah:**
- URL `/pages/auth` terlihat tidak profesional
- Folder `pages` bukan best practice di App Router
- Inconsistent dengan route lain

---

## ✅ Struktur Routing yang Benar (After)

```
src/app/
├── page.js              → http://localhost:3000/
├── auth/
│   └── page.js          → http://localhost:3000/auth ✅ Bersih!
└── dashboard/
    └── page.jsx         → http://localhost:3000/dashboard ✅
```

---

## 🚀 Langkah Perbaikan

### Step 1: Buat folder auth yang benar
```bash
mkdir c:\Users\nzxtv\Downloads\code\chit-chat-v5.1-ai\src\app\auth
```

### Step 2: Pindahkan file page.js
```bash
# Copy file ke lokasi baru
cp c:\Users\nzxtv\Downloads\code\chit-chat-v5.1-ai\src\app\pages\auth\page.js \
   c:\Users\nzxtv\Downloads\code\chit-chat-v5.1-ai\src\app\auth\page.js

# Hapus folder lama setelah yakin tidak ada masalah
# rm -rf c:\Users\nzxtv\Downloads\code\chit-chat-v5.1-ai\src\app\pages
```
 
### Step 3: Update semua redirect di code

**File yang perlu diupdate:**
1. `src/app/dashboard/page.jsx` - line 47
2. Semua file yang redirect ke auth

**Before:**
```javascript
window.location.href = "/pages/auth";
// atau
router.push('/pages/auth');
```

**After:**
```javascript
window.location.href = "/auth";
// atau
router.push('/auth');
```

---

## 📝 Visual Routing Flow ChitChat

```
┌─────────────────────────────────────────────────────┐
│                    User Journey                      │
└─────────────────────────────────────────────────────┘

    Browser Request
         │
         ▼
┌─────────────────┐
│   / (root)      │  ← app/page.js
│   Landing Page  │
└────────┬────────┘
         │
         ▼
    User clicks "Login"
         │
         ▼
┌─────────────────┐
│   /auth         │  ← app/auth/page.js
│   Login/Register│
└────────┬────────┘
         │
         ├─ Register Success
         │      │
         │      ▼
         │  Redirect to /auth (login)
         │
         ├─ Login Success
         │      │
         │      ▼
         │  localStorage.setItem('token')
         │      │
         │      ▼
┌────────┴────────┐
│   /dashboard    │  ← app/dashboard/page.jsx
│   Main Chat UI  │
└────────┬────────┘
         │
         ├─ No token? → Redirect to /auth
         │
         ├─ Select room → Load messages
         │      │
         │      ▼
         │  Socket.io connects
         │  fetch /api/messages/:roomId
         │
         └─ Logout → localStorage.clear() → Redirect to /auth
```

---

## 🔐 Protected Route Pattern

### Cara 1: Client-Side Protection (Current)
```javascript
// app/dashboard/page.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth');  // ✅ Update dari /pages/auth
    }
  }, [router]);

  return <div>Protected Content</div>;
}
```

### Cara 2: Middleware Protection (Recommended)
```javascript
// middleware.js (root level)
import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token');
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  // Kalau belum login dan mau akses dashboard
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Kalau udah login dan mau ke auth page
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth']
};
```

---

## 🎨 Recommended Final Structure

```
src/app/
├── layout.js                      → Root layout
├── page.js                        → Homepage (/)
│
├── auth/
│   ├── page.js                    → Login/Register (/auth)
│   └── layout.js (optional)       → Auth layout
│
├── dashboard/
│   ├── page.jsx                   → Main chat (/dashboard)
│   └── layout.js (optional)       → Dashboard layout
│
├── profile/
│   └── page.js                    → User profile (/profile)
│
├── settings/
│   ├── page.js                    → Settings overview
│   ├── profile/page.js            → Profile settings
│   └── privacy/page.js            → Privacy settings
│
├── rooms/
│   └── [roomId]/
│       └── page.js                → Room detail (/rooms/room001)
│
├── components/                    → Shared components
│   ├── MessageBubble.jsx
│   ├── MessageInput.jsx
│   └── ...
│
└── api/                           → API routes
    ├── auth/
    │   ├── login/route.js         → POST /api/auth/login
    │   └── register/route.js      → POST /api/auth/register
    ├── friends/
    │   ├── route.js               → GET /api/friends
    │   ├── add/route.js           → POST /api/friends/add
    │   └── respond/route.js       → POST /api/friends/respond
    ├── rooms/
    │   ├── route.js               → GET /api/rooms
    │   ├── create/route.js        → POST /api/rooms/create
    │   └── [roomId]/route.js      → GET /api/rooms/:roomId
    └── messages/
        ├── route.js               → POST /api/messages
        └── [roomId]/route.js      → GET /api/messages/:roomId
```

---

## 🎯 Latihan: Buat Route Baru

### Challenge: Buat halaman Profile

**Step 1: Create folder**
```bash
mkdir src/app/profile
```

**Step 2: Create page.js**
```javascript
// src/app/profile/page.js
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      router.push('/auth');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">My Profile</h1>
      <div className="mt-4">
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Display Name:</strong> {user.displayName}</p>
      </div>
    </div>
  );
}
```

**Step 3: Add navigation**
```javascript
// Di dashboard/page.jsx, tambah link
import Link from 'next/link';

<Link href="/profile">
  <button>My Profile</button>
</Link>
```

**Result:** Accessible at `http://localhost:3000/profile`

---

## 📚 Next Steps

1. ✅ Fix folder `pages/auth` → `auth`
2. ✅ Update semua redirect
3. ✅ Test semua navigation
4. ✅ (Optional) Implement middleware protection
5. ✅ (Optional) Add layout untuk dashboard

**Happy Routing! 🚀**
