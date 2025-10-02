# 🎨 ChitChat Routing - Visual Guide

## 📍 URL Structure

```
┌─────────────────────────────────────────────┐
│         http://localhost:3000               │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
┌───────────────┐      ┌───────────────┐
│   /           │      │   /auth       │
│  Homepage     │      │  Login/Reg    │
│  (redirect)   │      │               │
└───────────────┘      └───────────────┘
                              │
                              ▼
                    ┌───────────────┐
                    │  /dashboard   │
                    │  Main Chat    │
                    └───────────────┘
```

---

## 🔄 Complete User Journey Map

```
┌──────────────────────────────────────────────────────────────┐
│                    NEW USER JOURNEY                          │
└──────────────────────────────────────────────────────────────┘

    Browser: http://localhost:3000/
              │
              ▼
    ┌─────────────────────┐
    │   app/page.js       │
    │   (Root)            │
    │                     │
    │  Check localStorage │
    │  token = null? ✅   │
    └──────────┬──────────┘
               │
               ▼
       router.push('/auth')
               │
               ▼
    ┌─────────────────────┐
    │   /auth             │
    │  app/auth/page.jsx  │
    │                     │
    │  [Login Form] 📝    │
    │  [Register Form] 📝 │
    └──────────┬──────────┘
               │
               │ User registers
               ├──────────────────┐
               │                  │
               ▼                  ▼
       POST /api/register    Success!
               │                  │
               ▼                  │
       "Account created!"         │
               │                  │
               └──────┬───────────┘
                      │
                      ▼ User logs in
              POST /api/login
                      │
                      ▼
       ┌──────────────────────┐
       │  Response:           │
       │  - token             │
       │  - user data         │
       └──────────┬───────────┘
                  │
                  ▼
       localStorage.setItem('token')
       localStorage.setItem('user')
                  │
                  ▼
       window.location.href = '/dashboard'
                  │
                  ▼
       ┌─────────────────────┐
       │   /dashboard        │
       │  Main Chat UI       │
       │                     │
       │  ✅ Protected       │
       │  ✅ Socket.io On    │
       │  ✅ Load Rooms      │
       └─────────────────────┘
```

---

## 🔐 Protection Flow Diagram

```
┌──────────────────────────────────────────────────────────────┐
│              PROTECTION MECHANISM                            │
└──────────────────────────────────────────────────────────────┘

User tries to access any route
        │
        ▼
┌───────────────────────────────────────────────────────┐
│               Check Current Route                      │
└───────────┬───────────────────────────────────────────┘
            │
            ├─────────────┬─────────────┬─────────────┐
            │             │             │             │
            ▼             ▼             ▼             ▼
       ┌────────┐    ┌────────┐   ┌──────────┐  ┌────────┐
       │   /    │    │ /auth  │   │/dashboard│  │ Other  │
       └────┬───┘    └────┬───┘   └─────┬────┘  └────────┘
            │             │              │
            ▼             ▼              ▼
    Check token?    Check token?   Check token?
            │             │              │
      ┌─────┴─────┐ ┌─────┴─────┐ ┌─────┴─────┐
      │           │ │           │ │           │
    Yes         No  Yes       No  Yes        No
      │           │ │           │ │           │
      ▼           ▼ ▼           ▼ ▼           ▼
  /dashboard  /auth /dashboard /auth Show    /auth
                                    Page
```

---

## 🎯 State Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│            localStorage State Management                     │
└──────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────┐
    │      localStorage               │
    │  ┌────────────────────────┐     │
    │  │ token: "eyJhbGc..."    │     │
    │  │ user: {                │     │
    │  │   id: "user001",       │     │
    │  │   username: "test",    │     │
    │  │   email: "test@..."    │     │
    │  │   displayName: "Test"  │     │
    │  │ }                      │     │
    │  └────────────────────────┘     │
    └──────────┬──────────────────────┘
               │
               │ Used by:
               ├──────────────────┐
               │                  │
               ▼                  ▼
    ┌──────────────────┐  ┌──────────────────┐
    │  app/page.js     │  │ app/auth/page.jsx│
    │  (redirect logic)│  │ (prevent access) │
    └──────────────────┘  └──────────────────┘
               │
               ▼
    ┌──────────────────┐
    │ app/dashboard/   │
    │     page.jsx     │
    │ (load user data) │
    └──────────────────┘
```

---

## 🚀 Navigation Methods

```
┌──────────────────────────────────────────────────────────────┐
│              Navigation Comparison                           │
└──────────────────────────────────────────────────────────────┘

1️⃣  CLIENT-SIDE (React Router style)
    ────────────────────────────────
    import { useRouter } from 'next/navigation';

    const router = useRouter();
    router.push('/dashboard');

    ✅ Smooth transition
    ✅ No page reload
    ✅ Preserves client state

2️⃣  FULL PAGE RELOAD (Traditional)
    ────────────────────────────────
    window.location.href = '/dashboard';

    ⚠️  Full page reload
    ⚠️  Loses client state
    ✅ Forces fresh data

3️⃣  LINK COMPONENT (Recommended)
    ────────────────────────────────
    import Link from 'next/link';

    <Link href="/dashboard">Go to Dashboard</Link>

    ✅ Prefetching
    ✅ Smooth transition
    ✅ SEO friendly
```

---

## 📊 Route File Structure

```
src/app/
│
├── 📄 page.js                    → URL: /
│   ├─ 'use client'
│   ├─ useEffect: check token
│   └─ router.push() based on token
│
├── 📄 layout.js                  → Root layout (wraps all pages)
│   ├─ <html>, <body>
│   └─ {children}
│
├── 📁 auth/
│   └── 📄 page.jsx               → URL: /auth
│       ├─ 'use client'
│       ├─ useState: form data
│       ├─ handleLogin()
│       ├─ handleRegister()
│       └─ useEffect: redirect if logged in
│
├── 📁 dashboard/
│   └── 📄 page.jsx               → URL: /dashboard
│       ├─ 'use client'
│       ├─ useState: user, rooms, messages
│       ├─ useEffect: check auth & load data
│       ├─ Socket.io setup
│       └─ Chat UI components
│
├── 📁 components/
│   ├── 📄 MessageBubble.jsx
│   ├── 📄 MessageInput.jsx
│   └── 📄 ChatHeader.jsx
│
└── 📁 api/
    ├── 📁 login/
    │   └── 📄 route.js           → POST /api/login
    ├── 📁 register/
    │   └── 📄 route.js           → POST /api/register
    ├── 📁 rooms/
    │   └── 📄 route.js           → GET /api/rooms
    └── 📁 messages/
        ├── 📄 route.js           → POST /api/messages
        └── 📁 [roomId]/
            └── 📄 route.js       → GET /api/messages/:roomId
```

---

## 🔄 Login/Logout Cycle

```
┌──────────────────────────────────────────────────────────────┐
│                    FULL CYCLE                                │
└──────────────────────────────────────────────────────────────┘

START: User opens browser
         │
         ▼
    [Clear State]
    localStorage empty
         │
         ▼
    Access: /
         │
         ▼
    Redirect: /auth
         │
         ▼
    ┌──────────────┐
    │  LOGIN FORM  │
    └──────┬───────┘
           │
           ▼ User enters credentials
    POST /api/login
           │
           ├── ❌ Error → Show error message
           │
           └── ✅ Success
                │
                ▼
           [Store Data]
           localStorage.setItem('token')
           localStorage.setItem('user')
                │
                ▼
           Redirect: /dashboard
                │
                ▼
           ┌───────────────────┐
           │  DASHBOARD ACTIVE │
           │  - Load rooms     │
           │  - Socket.io on   │
           │  - Show messages  │
           └────────┬──────────┘
                    │
                    │ User clicks Logout
                    ▼
           [Clear Data]
           localStorage.removeItem('token')
           localStorage.removeItem('user')
                    │
                    ▼
           Redirect: /auth
                    │
                    ▼
           CYCLE REPEATS ↺
```

---

## 🎯 Decision Tree

```
                    User opens app
                          │
                          ▼
                 ╔════════════════╗
                 ║ Has token?     ║
                 ╚════════════════╝
                    │           │
              YES ──┘           └── NO
                │                   │
                ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │ Go to        │    │ Go to        │
        │ /dashboard   │    │ /auth        │
        └──────────────┘    └──────────────┘
                │                   │
                ▼                   ▼
        ┌──────────────┐    ┌──────────────┐
        │ Load user    │    │ Show login/  │
        │ data & rooms │    │ register form│
        └──────────────┘    └──────────────┘
                │                   │
                │                   │ Login success
                │                   │
                │                   ▼
                │           Save token & user
                │                   │
                └───────────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Dashboard   │
                     │  Main UI     │
                     └──────────────┘
```

---

## 🧪 Testing Scenarios Visualized

```
┌──────────────────────────────────────────────────────────────┐
│                  TEST SCENARIOS                              │
└──────────────────────────────────────────────────────────────┘

Test 1: First Time User
─────────────────────
Browser (empty) → / → /auth
Expected: ✅ Login form visible

Test 2: Login Flow
─────────────────────
/auth → Enter credentials → Submit
→ POST /api/login → Success
→ Save token → Redirect /dashboard
Expected: ✅ Dashboard loads with user data

Test 3: Already Logged In
─────────────────────
Browser (has token) → / → /dashboard
Expected: ✅ Direct to dashboard, skip auth

Test 4: Manual Auth Access
─────────────────────
Browser (has token) → /auth → /dashboard
Expected: ✅ Can't access auth, redirect to dashboard

Test 5: Manual Dashboard Access
─────────────────────
Browser (no token) → /dashboard → /auth
Expected: ✅ Can't access dashboard, redirect to auth

Test 6: Logout Flow
─────────────────────
/dashboard → Click Logout → Clear storage → /auth
Expected: ✅ Redirected to auth, can't go back to dashboard
```

---

## 💡 Pro Tips

### 1. Debug Routing Issues
```javascript
// Add to any page for debugging
useEffect(() => {
  console.log('Current path:', window.location.pathname);
  console.log('Has token:', !!localStorage.getItem('token'));
  console.log('User data:', localStorage.getItem('user'));
}, []);
```

### 2. Prevent Flash of Wrong Content
```javascript
// Show loading while checking auth
const [isLoading, setIsLoading] = useState(true);

useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) router.push('/auth');
  setIsLoading(false);
}, []);

if (isLoading) return <LoadingSpinner />;
```

### 3. Handle Token Expiry
```javascript
// Check token validity
const isTokenValid = () => {
  const token = localStorage.getItem('token');
  if (!token) return false;

  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};
```

---

**Happy Routing! 🚀**
