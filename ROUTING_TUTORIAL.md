# 🚀 Tutorial Routing di Next.js App Router

## 📚 Perbedaan Next.js vs React Router DOM

| Aspek | React Router DOM | Next.js App Router |
|-------|------------------|-------------------|
| **Konsep** | Manual routing dengan `<Route>` | File-based routing |
| **Setup** | Install `react-router-dom` | Built-in, tidak perlu install |
| **Definisi Route** | Di dalam code (JSX) | Berdasarkan struktur folder |
| **Navigation** | `<Link>` dari react-router | `<Link>` dari next/link |
| **Dynamic Route** | `/user/:id` di code | Folder `[id]` |
| **Data Loading** | useEffect/loader | Server Components + fetch |

---

## 🗂️ File-Based Routing di Next.js

Next.js menggunakan **struktur folder** sebagai route. Setiap folder di `app/` = route URL.

### Aturan Dasar:
```
app/
├── page.js          → /              (Homepage)
├── about/
│   └── page.js      → /about
├── dashboard/
│   └── page.js      → /dashboard
└── api/
    └── users/
        └── route.js → /api/users     (API endpoint)
```

---

## 📁 Struktur Routing di Project ChitChat Kamu

```
src/app/
├── page.js              → http://localhost:3000/
├── layout.js            → Root layout (wrapper semua page)
├── dashboard/
│   └── page.jsx         → http://localhost:3000/dashboard
├── pages/
│   └── auth/
│       └── page.js      → http://localhost:3000/pages/auth
└── api/
    ├── login/
    │   └── route.js     → POST http://localhost:3000/api/login
    ├── friends/
    │   ├── route.js     → GET http://localhost:3000/api/friends
    │   ├── add/
    │   │   └── route.js → POST http://localhost:3000/api/friends/add
    │   └── respond/
    │       └── route.js → POST http://localhost:3000/api/friends/respond
    └── messages/
        ├── route.js     → POST http://localhost:3000/api/messages
        └── [roomId]/
            └── route.js → GET http://localhost:3000/api/messages/room001
```

---

## 🧩 File Khusus di Next.js

| File | Fungsi | Contoh |
|------|--------|--------|
| `page.js` | Halaman yang bisa diakses | Homepage, Dashboard |
| `layout.js` | Wrapper/template untuk page | Header, Footer |
| `route.js` | API endpoint | REST API |
| `loading.js` | Loading state | Skeleton screen |
| `error.js` | Error boundary | Error page |
| `not-found.js` | 404 page | Custom 404 |

---

## 📝 Contoh Lengkap: Page Routing

### 1. **Simple Page** (`app/about/page.js`)
```javascript
export default function AboutPage() {
  return (
    <div>
      <h1>About Us</h1>
      <p>Welcome to ChitChat!</p>
    </div>
  );
}
```
**URL**: `http://localhost:3000/about`

---

### 2. **Nested Route** (`app/blog/posts/page.js`)
```javascript
export default function BlogPostsPage() {
  return <h1>All Blog Posts</h1>;
}
```
**URL**: `http://localhost:3000/blog/posts`

---

### 3. **Dynamic Route** (`app/users/[userId]/page.js`)
```javascript
// File path: app/users/[userId]/page.js

export default async function UserProfilePage({ params }) {
  // params.userId akan diisi otomatis dari URL
  const { userId } = await params;

  return (
    <div>
      <h1>User Profile</h1>
      <p>User ID: {userId}</p>
    </div>
  );
}
```

**URL Examples**:
- `/users/user001` → userId = "user001"
- `/users/user002` → userId = "user002"
- `/users/john` → userId = "john"

---

### 4. **Nested Dynamic Route** (`app/products/[category]/[productId]/page.js`)
```javascript
export default async function ProductPage({ params }) {
  const { category, productId } = await params;

  return (
    <div>
      <h1>Category: {category}</h1>
      <h2>Product ID: {productId}</h2>
    </div>
  );
}
```

**URL Examples**:
- `/products/electronics/laptop-123`
  - category = "electronics"
  - productId = "laptop-123"

---

## 🔗 Navigation di Next.js

### 1. **Using `<Link>` Component** (Recommended)
```javascript
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/about">About</Link>

      {/* Dynamic link */}
      <Link href={`/users/${userId}`}>Profile</Link>
    </nav>
  );
}
```

**Keuntungan `<Link>`:**
- Client-side navigation (cepat, no reload)
- Prefetching otomatis
- Smooth transition

---

### 2. **Programmatic Navigation** (useRouter)
```javascript
'use client';  // Wajib untuk client component

import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async () => {
    // Login logic...
    const success = await loginUser();

    if (success) {
      router.push('/dashboard');  // Redirect ke dashboard
    }
  };

  return (
    <button onClick={handleLogin}>Login</button>
  );
}
```

**Methods `router`:**
- `router.push('/path')` - Navigate ke path baru
- `router.replace('/path')` - Navigate tanpa history
- `router.back()` - Go back
- `router.refresh()` - Refresh page

---

### 3. **Redirect from Server Component**
```javascript
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getSession();

  if (!session) {
    redirect('/login');  // Server-side redirect
  }

  return <h1>Protected Content</h1>;
}
```

---

## 🎯 Contoh Praktis di ChitChat

### Contoh 1: Auth Page Navigation
```javascript
// File: app/pages/auth/page.js
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();

    const response = await fetch('/api/login', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      localStorage.setItem('token', data.token);
      // Navigate ke dashboard
      router.push('/dashboard');
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Form fields */}
    </form>
  );
}
```

---

### Contoh 2: Dashboard with Protected Route
```javascript
// File: app/dashboard/page.jsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      // Redirect ke auth kalau belum login
      router.push('/pages/auth');
    }
  }, [router]);

  return <div>Dashboard Content</div>;
}
```

---

### Contoh 3: Dynamic Room Messages
```javascript
// File: app/rooms/[roomId]/messages/page.js
'use client';

import { useEffect, useState } from 'react';

export default function RoomMessagesPage({ params }) {
  const [messages, setMessages] = useState([]);
  const { roomId } = params;

  useEffect(() => {
    // Fetch messages untuk room ini
    fetch(`/api/messages/${roomId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.json())
    .then(data => setMessages(data.data.messages));
  }, [roomId]);

  return (
    <div>
      <h1>Room: {roomId}</h1>
      {messages.map(msg => (
        <div key={msg.id}>{msg.message}</div>
      ))}
    </div>
  );
}
```

**URL**: `/rooms/room001/messages`

---

## 🛣️ Route Groups (Organizing Routes)

Gunakan `(folder)` untuk organize tanpa affect URL:

```
app/
├── (marketing)/
│   ├── about/
│   │   └── page.js      → /about (bukan /marketing/about)
│   └── contact/
│       └── page.js      → /contact
└── (shop)/
    ├── products/
    │   └── page.js      → /products
    └── cart/
        └── page.js      → /cart
```

Folder `(marketing)` dan `(shop)` **tidak muncul** di URL.

---

## 📦 Layouts (Shared UI)

### Root Layout (Wajib)
```javascript
// File: app/layout.js
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header>ChitChat App</header>
        {children}
        <footer>© 2024</footer>
      </body>
    </html>
  );
}
```

### Nested Layout
```javascript
// File: app/dashboard/layout.js
export default function DashboardLayout({ children }) {
  return (
    <div>
      <aside>Sidebar</aside>
      <main>{children}</main>
    </div>
  );
}
```

Semua page di `app/dashboard/*` akan wrapped dengan layout ini.

---

## 🎨 Metadata untuk SEO

```javascript
// File: app/dashboard/page.jsx
export const metadata = {
  title: 'Dashboard - ChitChat',
  description: 'Your chat dashboard'
};

export default function Dashboard() {
  return <div>Dashboard</div>;
}
```

**Dynamic Metadata**:
```javascript
// File: app/users/[userId]/page.js
export async function generateMetadata({ params }) {
  const { userId } = await params;

  return {
    title: `User ${userId} Profile`,
    description: `Profile page for ${userId}`
  };
}
```

---

## 🔥 Server vs Client Components

### Server Component (Default)
```javascript
// File: app/posts/page.js
// TIDAK perlu 'use client'

async function getPosts() {
  const res = await fetch('https://api.example.com/posts');
  return res.json();
}

export default async function PostsPage() {
  const posts = await getPosts();

  return (
    <div>
      {posts.map(post => (
        <div key={post.id}>{post.title}</div>
      ))}
    </div>
  );
}
```

**Keuntungan:**
- Faster initial load
- SEO friendly
- Smaller bundle size

---

### Client Component
```javascript
// File: app/counter/page.js
'use client';  // ← Wajib pakai ini!

import { useState } from 'react';

export default function CounterPage() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

**Kapan pakai `'use client'`:**
- Pakai hooks (useState, useEffect, etc.)
- Event handlers (onClick, onChange)
- Browser APIs (localStorage, window)
- Third-party libraries yang butuh DOM

---

## 🚨 Common Mistakes & Fixes

### ❌ Wrong: auth folder tanpa page.js
```
app/auth/  → 404 Error!
```

### ✅ Right: auth dengan page.js
```
app/auth/page.js  → Works! /auth accessible
```

---

### ❌ Wrong: Pakai Link dari react-router
```javascript
import { Link } from 'react-router-dom';  // ❌ SALAH!
```

### ✅ Right: Pakai Link dari next/link
```javascript
import Link from 'next/link';  // ✅ BENAR!
```

---

### ❌ Wrong: useRouter dari next/router
```javascript
import { useRouter } from 'next/router';  // ❌ Pages Router (old)
```

### ✅ Right: useRouter dari next/navigation
```javascript
import { useRouter } from 'next/navigation';  // ✅ App Router (new)
```

---

## 🎯 Perbaikan untuk Project ChitChat

Saat ini kamu punya folder yang tidak konsisten:

```
❌ app/pages/auth/page.js  → /pages/auth (URL jelek)
```

**Recommendation:**
```
✅ app/auth/page.js  → /auth (URL bersih)
```

**Cara fix:**
1. Pindahkan `app/pages/auth/page.js` → `app/auth/page.js`
2. Hapus folder `app/pages/`
3. Update semua redirect dari `/pages/auth` → `/auth`

---

## 📝 Quick Reference

### Creating Routes:
```bash
# Static route
mkdir app/about && touch app/about/page.js

# Dynamic route
mkdir -p app/users/[userId] && touch app/users/[userId]/page.js

# API route
mkdir app/api/products && touch app/api/products/route.js

# Nested layout
touch app/dashboard/layout.js
```

### Navigation Cheat Sheet:
```javascript
// Link component
<Link href="/dashboard">Go to Dashboard</Link>

// Programmatic
const router = useRouter();
router.push('/dashboard');
router.back();
router.replace('/login');

// Server redirect
import { redirect } from 'next/navigation';
redirect('/login');
```

---

## 🎓 Practice Exercise

Buat route baru untuk fitur "Settings":

```
app/settings/
├── page.js                    → /settings (Overview)
├── layout.js                  → Sidebar navigation
├── profile/
│   └── page.js                → /settings/profile
├── privacy/
│   └── page.js                → /settings/privacy
└── notifications/
    └── page.js                → /settings/notifications
```

Silakan coba sendiri! 🚀

---

**Next.js Docs**: https://nextjs.org/docs/app/building-your-application/routing
