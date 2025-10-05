# NextAuth Sliding Session - Penjelasan Detail

## Apa itu Sliding Session?

Sliding Session adalah sistem dimana **session token otomatis di-refresh** setiap kali user aktif, sehingga user yang aktif **tidak pernah logout otomatis**.

---

## Konfigurasi di `src/auth.js`

```javascript
session: {
  strategy: "jwt",
  maxAge: 7 * 24 * 60 * 60,    // 7 hari
  updateAge: 24 * 60 * 60,     // 1 hari ← KEY!
}
```

### **Parameter:**

| Parameter | Value | Fungsi |
|-----------|-------|--------|
| `maxAge` | 7 hari | Token **expired** setelah 7 hari **tidak ada aktivitas** |
| `updateAge` | 1 hari | Token **di-refresh** setiap 1 hari **jika user aktif** |

---

## Cara Kerja (Timeline)

### **Scenario 1: User Aktif Setiap Hari**

```
Hari 1 (Login):
  ✅ Token dibuat, expired di Hari 8
  Cookie: { exp: "2025-10-10" }

Hari 2 (User buka app):
  ✅ Token sudah 1 hari (≥ updateAge)
  🔄 NextAuth auto-refresh token
  Cookie: { exp: "2025-10-11" } ← Expired dimundurkan 1 hari!

Hari 3 (User buka app):
  ✅ Token sudah 1 hari
  🔄 NextAuth auto-refresh token
  Cookie: { exp: "2025-10-12" }

Hari 4-365 (User buka app setiap hari):
  🔄 Token terus di-refresh
  ❌ User TIDAK PERNAH logout otomatis!
```

**Kesimpulan:** User yang aktif **tidak pernah logout**.

---

### **Scenario 2: User Idle (Tidak Buka App)**

```
Hari 1 (Login):
  ✅ Token dibuat, expired di Hari 8
  Cookie: { exp: "2025-10-10" }

Hari 2-7 (User tidak buka app):
  ❌ Token tidak di-refresh
  Cookie: { exp: "2025-10-10" } ← Tetap sama

Hari 8 (User buka app):
  ❌ Token sudah expired
  🔴 NextAuth redirect ke /auth (login ulang)
```

**Kesimpulan:** User yang idle 7 hari **akan logout otomatis**.

---

### **Scenario 3: User Aktif Setiap 6 Hari**

```
Hari 1 (Login):
  ✅ Token dibuat, expired di Hari 8

Hari 6 (User buka app):
  ✅ Token sudah 5 hari (≥ updateAge)
  🔄 Token di-refresh, expired di Hari 13

Hari 12 (User buka app):
  ✅ Token sudah 6 hari (≥ updateAge)
  🔄 Token di-refresh, expired di Hari 19

Hari 18 (User buka app):
  ✅ Token sudah 6 hari
  🔄 Token di-refresh, expired di Hari 25

  ...dan seterusnya
```

**Kesimpulan:** Selama user buka app sebelum 7 hari, token terus di-refresh.

---

## Kapan Token Di-Refresh?

NextAuth cek di **setiap request** apakah token perlu di-refresh:

```javascript
// Pseudo-code NextAuth internal
if (tokenAge >= updateAge && tokenAge < maxAge) {
  // Token sudah ≥ 1 hari tapi belum expired
  refreshToken() // Generate token baru
  updateCookie() // Update cookie di browser
}
```

### **Contoh:**

```
Token dibuat: 2025-10-03 10:00:00
updateAge: 1 hari (86400 detik)
maxAge: 7 hari (604800 detik)

Request 1 (2025-10-03 15:00):
  tokenAge = 5 jam (18000 detik)
  18000 < 86400 → TIDAK refresh

Request 2 (2025-10-04 11:00):
  tokenAge = 25 jam (90000 detik)
  90000 ≥ 86400 → REFRESH! ✅

  Token baru dibuat: 2025-10-04 11:00:00
  Expired baru: 2025-10-11 11:00:00

Request 3 (2025-10-04 15:00):
  tokenAge = 4 jam (dari token baru)
  14400 < 86400 → TIDAK refresh

  ...dan seterusnya
```

---

## Visualisasi Timeline

```
DAY 1        DAY 2        DAY 3        DAY 4        DAY 5        DAY 6        DAY 7        DAY 8
│            │            │            │            │            │            │            │
LOGIN        REFRESH      REFRESH      REFRESH      REFRESH      REFRESH      REFRESH      EXPIRED
│            │            │            │            │            │            │            │
▼            ▼            ▼            ▼            ▼            ▼            ▼            ▼
exp: Day 8   exp: Day 9   exp: Day 10  exp: Day 11  exp: Day 12  exp: Day 13  exp: Day 14  LOGOUT
```

**Jika user aktif setiap hari:**
- Token di-refresh setiap 1 hari
- Expired date terus dimundurkan
- User tidak pernah logout

**Jika user idle 7 hari:**
- Token tidak di-refresh
- Expired date tetap di Day 8
- User logout otomatis di Day 8

---

## Testing Sliding Session

### **Test 1: Cek Token Di-Refresh**

1. Login ke app
2. Buka DevTools → Application → Cookies
3. Copy value `next-auth.session-token`
4. Tunggu 1 hari (atau ubah `updateAge` jadi 1 menit untuk testing cepat)
5. Refresh halaman
6. Cek lagi cookie → Value berubah! (token di-refresh)

### **Test 2: Cek Expires Date Dimundurkan**

```javascript
// src/app/dashboard/page.jsx
import { auth } from '@/auth'

export default async function Dashboard() {
  const session = await auth()

  console.log('Session expires:', new Date(session.expires))
  // Setiap hari expires date akan berubah

  return <div>Check console for expires date</div>
}
```

### **Test 3: Fast Testing (1 Menit)**

Edit `src/auth.js` untuk testing cepat:

```javascript
session: {
  strategy: "jwt",
  maxAge: 5 * 60,      // 5 menit (untuk testing)
  updateAge: 1 * 60,   // 1 menit (untuk testing)
}
```

**Timeline:**
- Login → Token expired di menit ke-5
- Menit ke-2 → Refresh halaman → Token di-refresh → Expired di menit ke-7
- Menit ke-4 → Refresh halaman → Token di-refresh → Expired di menit ke-9
- Dst...

---

## Perbandingan dengan Sistem Lain

### **1. Fixed Session (Tanpa Sliding)**

```javascript
session: {
  maxAge: 7 * 24 * 60 * 60,
  // Tidak ada updateAge
}
```

**Hasil:**
- Token expired **tepat 7 hari** dari login
- User aktif atau tidak = tetap logout di hari ke-7
- **Tidak user-friendly**

### **2. Access + Refresh Token**

```
Access Token: expired 15 menit
Refresh Token: expired 30 hari

Setiap 15 menit → Request refresh token → Generate access token baru
```

**Hasil:**
- User aktif tidak logout (mirip sliding)
- Tapi **perlu request tambahan** setiap 15 menit
- Lebih kompleks di frontend

### **3. NextAuth Sliding Session** ✅

```
Session Token: expired 7 hari (idle), refresh setiap 1 hari (aktif)
```

**Hasil:**
- User aktif tidak logout
- **Otomatis**, tidak perlu kode tambahan
- **Simpel**, cuma 2 baris config

---

## Keamanan

### **Apakah Aman?**

✅ **Ya, cukup aman untuk kebanyakan aplikasi:**
- Token tetap di-encrypt dengan `NEXTAUTH_SECRET`
- Disimpan di httpOnly cookie (JavaScript gak bisa akses)
- SameSite: Lax (CSRF protection)

### **Risiko:**

❌ **Jika token dicuri:**
- Valid sampai 7 hari (jika user idle)
- Valid selamanya (jika user aktif terus)

### **Mitigasi:**

1. **Gunakan HTTPS di production** (cookie Secure flag)
2. **Monitor aktivitas mencurigakan** (login dari IP berbeda)
3. **Implement "Logout All Devices"** (butuh database session)
4. **Kurangi maxAge** jadi 1-3 hari untuk app sensitif

---

## Best Practices

### **Chat App (seperti ChitChat):**
```javascript
maxAge: 30 * 24 * 60 * 60,   // 30 hari
updateAge: 24 * 60 * 60,     // 1 hari
```
✅ User jarang logout, experience lebih baik

### **E-Commerce:**
```javascript
maxAge: 7 * 24 * 60 * 60,    // 7 hari
updateAge: 24 * 60 * 60,     // 1 hari
```
✅ Balance antara security dan UX

### **Banking App:**
```javascript
maxAge: 15 * 60,             // 15 menit
updateAge: 5 * 60,           // 5 menit
```
✅ High security, tapi user sering re-login

### **Admin Dashboard:**
```javascript
session: {
  strategy: "database",      // Bukan JWT!
  maxAge: 8 * 60 * 60,       // 8 jam (jam kerja)
}
```
✅ Bisa force logout, lihat active sessions

---

## Monitoring di Production

### **Track Session Refresh:**

```javascript
// src/auth.js
callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      token.id = user.id
      token.username = user.username
      console.log(`[NEW SESSION] User ${user.username} logged in`)
    }

    // Trigger === "update" berarti sliding session refresh
    if (trigger === "update") {
      console.log(`[SESSION REFRESH] User ${token.username} token refreshed`)
    }

    return token
  }
}
```

### **Analytics:**

Kirim event ke analytics setiap token di-refresh:

```javascript
if (trigger === "update") {
  analytics.track('session_refreshed', {
    userId: token.id,
    timestamp: new Date()
  })
}
```

---

## FAQ

### **Q: User harus login ulang setiap 7 hari?**
A: **TIDAK**. Selama user aktif (buka app minimal 1x per hari), token terus di-refresh. User cuma logout jika idle 7 hari penuh.

### **Q: Berapa kali token di-refresh dalam 30 hari?**
A: Maksimal **30x** (setiap hari). Tapi jika user jarang buka app, bisa lebih sedikit.

### **Q: Apakah refresh token bikin request lambat?**
A: **TIDAK**. Refresh dilakukan **in-place** di middleware NextAuth, tidak ada request tambahan ke server.

### **Q: Bisa lihat berapa lama lagi token expired?**
A: **YA**. Check `session.expires`:
```javascript
const session = await auth()
console.log('Expires:', new Date(session.expires))
```

### **Q: Bisa force logout user?**
A: **TIDAK** dengan JWT strategy. Harus pakai database session untuk ini.

---

## Kesimpulan

**NextAuth Sliding Session** adalah kombinasi terbaik antara:
- ✅ **Keamanan** (token tetap expired jika user idle)
- ✅ **User Experience** (user aktif tidak pernah logout)
- ✅ **Simplicity** (cuma 2 baris config)
- ✅ **Performance** (stateless, tidak ada database query)

**Perfect untuk ChitChat app!** 🚀
