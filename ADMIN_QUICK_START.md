# 🚀 Admin Quick Start Guide

Quick reference untuk setup dan manage admin ChitChat V5.

---

## 🔧 Initial Setup (First Time)

1. **Copy environment template**:

   ```bash
   cp .env .env.local
   ```

2. **Edit `.env.local`** - Add admin emails:

   ```bash
   ADMIN_EMAILS=youremail@example.com,teammate@example.com
   ```

3. **For localhost**:

   ```bash
   NEXT_PUBLIC_DOMAIN=localhost
   NEXT_PUBLIC_SERVER_URL=http://localhost:1630
   NEXTAUTH_URL=http://localhost:1630
   ```

4. **For ngrok**:

   ```bash
   NEXT_PUBLIC_DOMAIN=your-url.ngrok-free.dev
   NEXT_PUBLIC_SERVER_URL=https://your-url.ngrok-free.dev
   NEXTAUTH_URL=https://your-url.ngrok-free.dev
   ```

5. **Restart server**:
   ```bash
   npm run dev:fast
   ```

---

## 📋 Common Tasks

### ➕ Add New Admin

```bash
# Edit .env.local
ADMIN_EMAILS=existing@email.com,newemail@example.com

# Restart
npm run dev:fast
```

### ❌ Remove Admin

```bash
# Edit .env.local - remove the email
ADMIN_EMAILS=onlykeepthis@email.com

# Restart
npm run dev:fast
```

### 🔄 Switch Between Localhost & Ngrok

**To Localhost**:

```bash
# .env.local
NEXT_PUBLIC_DOMAIN=localhost
NEXT_PUBLIC_SERVER_URL=http://localhost:1630
NEXTAUTH_URL=http://localhost:1630
```

**To Ngrok**:

```bash
# .env.local
NEXT_PUBLIC_DOMAIN=your-new-url.ngrok-free.dev
NEXT_PUBLIC_SERVER_URL=https://your-new-url.ngrok-free.dev
NEXTAUTH_URL=https://your-new-url.ngrok-free.dev
```

Then restart: `npm run dev:fast`

---

## 🔐 First Admin Login

1. Login normal user → `http://localhost:1630/auth`
2. Auto redirect → `/vinchx/auth`
3. Click **"Login with Passkey"**
4. Follow browser prompt (biometric/PIN)
5. Redirected → `/vinchx/dashboard` ✅

---

## 🔑 Manage Passkeys

### Register New Passkey

```
/vinchx/dashboard/passkeys → "Register New Passkey"
→ Choose device → Complete prompt
```

### Delete Passkey

```
/vinchx/dashboard/passkeys → Find passkey → Delete
```

⚠️ **Never delete all passkeys!** Keep at least 1 backup.

---

## 🐛 Quick Fixes

### "RP ID is invalid"

```bash
# Check NEXT_PUBLIC_DOMAIN matches your URL
# For localhost:
NEXT_PUBLIC_DOMAIN=localhost

# For ngrok:
NEXT_PUBLIC_DOMAIN=your-exact-url.ngrok-free.dev

# Restart server
```

### "Forbidden - Admin access required"

```bash
# Add your email to .env.local
ADMIN_EMAILS=youremail@example.com

# Restart server
```

### "Admin token expired"

```
Just login again at /vinchx/auth
New token auto-generated (valid 8 hours)
```

### Locked out (no passkeys)

```js
// MongoDB Shell
db.users.updateOne(
  { email: "youremail@example.com" },
  { $set: { passkeys: [] } },
);
// Then re-register passkey
```

---

## 📂 Important URLs

- Admin Login: `/vinchx/auth`
- Admin Dashboard: `/vinchx/dashboard`
- Passkey Manager: `/vinchx/dashboard/passkeys`
- Normal User: `/dashboard`

---

## ✅ Checklist Before Deploy

- [ ] `.env.local` not committed to git
- [ ] Production admin emails configured
- [ ] `NEXT_PUBLIC_DOMAIN` = production domain
- [ ] At least 2 admin passkeys registered
- [ ] MongoDB Atlas (not local) for production
- [ ] SSL enabled (HTTPS)
- [ ] Tested admin login flow

---

## 📚 Full Documentation

See `ADMIN_SYSTEM.md` for complete documentation.

---

**Quick Help**: Most issues fixed by restarting server after `.env.local` changes!
