# 🚦 ChitChat Routing Flow (FINAL)

## ✅ Yang Sudah Diperbaiki

1. ✅ Hapus folder `/pages/auth` yang tidak konsisten
2. ✅ Homepage `/` auto-redirect berdasarkan login status
3. ✅ Auth page `/auth` redirect ke dashboard jika sudah login
4. ✅ Dashboard `/dashboard` protected (harus login)

---

## 🗺️ Routing Structure (Final)

```
src/app/
├── page.js                → / (Auto-redirect)
├── auth/
│   └── page.jsx           → /auth (Login/Register)
└── dashboard/
    └── page.jsx           → /dashboard (Protected)
```

---

## 🔄 User Journey Flow

### Scenario 1: User Belum Login
```
1. User buka http://localhost:3000/
   ↓
2. page.js check localStorage.token
   ↓ (token = null)
3. router.push('/auth')
   ↓
4. User melihat halaman Login/Register
```

### Scenario 2: User Sudah Login
```
1. User buka http://localhost:3000/
   ↓
2. page.js check localStorage.token
   ↓ (token = ada)
3. router.push('/dashboard')
   ↓
4. User melihat halaman Dashboard
```

### Scenario 3: User Login di /auth
```
1. User isi form login di /auth
   ↓
2. Klik "Masuk"
   ↓
3. Fetch POST /api/login
   ↓
4. Response success:
   - localStorage.setItem('token')
   - localStorage.setItem('user')
   ↓
5. window.location.href = '/dashboard'
   ↓
6. User redirect ke Dashboard
```

### Scenario 4: User Sudah Login Coba Akses /auth
```
1. User buka http://localhost:3000/auth
   ↓
2. page.jsx check localStorage.token
   ↓ (token = ada)
3. router.push('/dashboard')
   ↓
4. User auto-redirect ke Dashboard
```

### Scenario 5: User Belum Login Coba Akses /dashboard
```
1. User buka http://localhost:3000/dashboard
   ↓
2. page.jsx check localStorage.token
   ↓ (token = null)
3. window.location.href = '/auth'
   ↓
4. User redirect ke Auth page
```

### Scenario 6: User Logout
```
1. User klik tombol Logout di Dashboard
   ↓
2. handleLogout() dipanggil:
   - localStorage.removeItem('token')
   - localStorage.removeItem('user')
   ↓
3. window.location.href = '/auth'
   ↓
4. User redirect ke Auth page
```

---

## 📝 Code Implementation

### 1. Homepage (app/page.js)
```javascript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      router.push('/dashboard');  // Sudah login → Dashboard
    } else {
      router.push('/auth');       // Belum login → Auth
    }
  }, [router]);

  return <div>Loading...</div>;
}
```

**Logic:**
- Cek token di localStorage
- Token ada → redirect `/dashboard`
- Token tidak ada → redirect `/auth`

---

### 2. Auth Page (app/auth/page.jsx)
```javascript
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  // Auto-redirect jika sudah login
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  // ... Login/Register logic
}
```

**Logic:**
- Setiap kali component mount, cek token
- Token ada → redirect `/dashboard`
- Token tidak ada → tampilkan form login/register

---

### 3. Dashboard (app/dashboard/page.jsx)
```javascript
'use client';

import { useState, useEffect } from 'react';

export default function Dashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      // Belum login → redirect auth
      window.location.href = '/auth';
      return;
    }

    setUser(JSON.parse(userData));
    // ... Load rooms, friends, etc
  }, []);

  if (!user) return <div>Loading...</div>;

  return <div>Dashboard Content</div>;
}
```

**Logic:**
- Setiap kali component mount, cek token & user
- Tidak ada token → redirect `/auth`
- Ada token → load data & tampilkan dashboard

---

## 🔐 Protection Summary

| Route | Public/Protected | Redirect Logic |
|-------|-----------------|----------------|
| `/` | Public | Auto-redirect based on login |
| `/auth` | Public | Redirect to `/dashboard` if logged in |
| `/dashboard` | Protected | Redirect to `/auth` if not logged in |

---

## 🧪 Testing Checklist

### Test 1: Fresh User (Belum Login)
- [ ] Buka `http://localhost:3000/`
- [ ] ✅ Auto-redirect ke `/auth`
- [ ] ✅ Tampil form Login/Register

### Test 2: Register Flow
- [ ] Klik "Daftar" di `/auth`
- [ ] Isi form register
- [ ] Klik "Daftar"
- [ ] ✅ Success message muncul
- [ ] ✅ Auto-switch ke form Login

### Test 3: Login Flow
- [ ] Isi form login di `/auth`
- [ ] Klik "Masuk"
- [ ] ✅ Auto-redirect ke `/dashboard`
- [ ] ✅ Dashboard tampil dengan data user

### Test 4: Already Logged In
- [ ] Sudah login (ada token)
- [ ] Buka `http://localhost:3000/`
- [ ] ✅ Auto-redirect ke `/dashboard`

### Test 5: Try Access Auth When Logged In
- [ ] Sudah login (ada token)
- [ ] Buka `http://localhost:3000/auth`
- [ ] ✅ Auto-redirect ke `/dashboard`

### Test 6: Logout Flow
- [ ] Klik tombol Logout di Dashboard
- [ ] ✅ Redirect ke `/auth`
- [ ] ✅ Token & user dihapus dari localStorage

### Test 7: Try Access Dashboard When Logged Out
- [ ] Belum login (no token)
- [ ] Buka `http://localhost:3000/dashboard`
- [ ] ✅ Auto-redirect ke `/auth`

---

## 🎯 URL Patterns

### ✅ Good URLs (After Fix)
```
http://localhost:3000/
http://localhost:3000/auth
http://localhost:3000/dashboard
```

### ❌ Old URLs (Removed)
```
http://localhost:3000/pages/auth  ❌ REMOVED
```

---

## 🔧 Advanced: Middleware Protection (Optional)

Untuk production, lebih baik pakai **middleware** untuk centralize protection:

```javascript
// middleware.js (root level, bukan di app/)
import { NextResponse } from 'next/server';

export function middleware(request) {
  // Get token from cookies (lebih secure dari localStorage)
  const token = request.cookies.get('token')?.value;

  const isAuthPage = request.nextUrl.pathname === '/auth';
  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard');

  // Protect dashboard
  if (!token && isDashboard) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  // Redirect ke dashboard jika sudah login & akses auth
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth']
};
```

**Keuntungan Middleware:**
- Server-side protection (lebih secure)
- Single source of truth
- Tidak perlu useEffect di setiap page

---

## 📊 Current vs Before

### Before
```
Homepage (/)        → Next.js default page ❌
/pages/auth         → Login/Register (bad URL) ❌
/dashboard          → Protected ✅
```

### After (Now)
```
Homepage (/)        → Auto-redirect ✅
/auth               → Login/Register (clean URL) ✅
/dashboard          → Protected ✅
```

---

## 🎓 Key Learnings

1. **File-based Routing**: Folder structure = URL structure
2. **Client Components**: `'use client'` untuk hooks & browser APIs
3. **useRouter**: Import dari `next/navigation` (bukan `next/router`)
4. **Protection Pattern**: Check token di `useEffect` → redirect
5. **localStorage**: Temporary solution, production pakai cookies/session

---

## 🚀 Next Steps

1. ✅ Testing semua flow (gunakan checklist di atas)
2. ⏳ (Optional) Implement middleware protection
3. ⏳ (Optional) Pindah dari localStorage ke HTTP-only cookies
4. ⏳ (Optional) Add loading states & error handling
5. ⏳ (Optional) Implement token refresh logic

---

**Status**: ✅ Routing Flow COMPLETE!
**Last Updated**: October 2, 2024
