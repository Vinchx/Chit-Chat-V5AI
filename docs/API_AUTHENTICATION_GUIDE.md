# API Authentication Guide

## 🔐 Dua Cara Authentication

### 1. **Browser (NextAuth Session)**

Untuk aplikasi web yang diakses user melalui browser.

**Flow:**

1. User buka `/auth` → Login dengan credentials/Google/GitHub
2. NextAuth membuat session cookie
3. Semua request selanjutnya otomatis authenticated via session

**Endpoints:**

- `GET /api/auth/signin` - Halaman login
- `GET /api/auth/signout` - Logout
- `GET /api/auth/session` - Cek session

### 2. **API Testing (API Key + User ID)**

Untuk testing di Postman/Thunder Client/Insomnia.

**Headers Required:**

```
x-api-key: secretbet
x-user-id: <user_id_from_database>
```

**Cara dapat User ID:**

1. Buka MongoDB Compass/Atlas
2. Collection `users` → Copy field `_id` dari user yang mau dipakai
3. Paste ke Postman environment variable `user_id`

---

## 📮 Setup Authentication di Postman

### Automatic Setup (Recommended)

Collection sudah include **Pre-request Script** yang otomatis add headers ke semua requests.

**Tidak perlu add manual!** Headers `x-api-key` dan `x-user-id` udah otomatis ditambahkan dari environment variables.

### Manual Setup (Alternative)

Kalau mau set manual per request:

1. **Pilih Request** → Tab "Headers"
2. **Add Header:**
   - Key: `x-api-key`
   - Value: `{{api_key}}`
3. **Add Header:**
   - Key: `x-user-id`
   - Value: `{{user_id}}`

---

## 🧪 Testing Flow

### Step 1: Get User ID dari Database

```bash
# Via MongoDB Compass
1. Connect ke database
2. Browse collection "users"
3. Copy _id dari user (contoh: "6789a1b2c3d4e5f678901234")
```

### Step 2: Update Environment Variable

```
user_id = 6789a1b2c3d4e5f678901234
```

### Step 3: Test API

```
GET {{apiBaseUrl}}/friends
```

Headers otomatis include:

```
x-api-key: secretbet
x-user-id: 6789a1b2c3d4e5f678901234
```

---

## ❌ Common Issues

### Issue: "Unauthorized" Error

**Problem:** API butuh authentication tapi headers tidak dikirim.

**Solution:**

1. Check environment sudah selected (top-right dropdown)
2. Check variable `api_key` dan `user_id` sudah filled
3. Check collection pre-request script masih ada

### Issue: "User not found"

**Problem:** `user_id` tidak ada di database.

**Solution:**

1. Verify user_id di MongoDB
2. Atau register user baru via `/api/register`
3. Update environment variable dengan user_id yang valid

### Issue: "Invalid API Key"

**Problem:** `api_key` salah atau tidak match dengan server.

**Solution:**

1. Check file `.env.local` di project
2. Cari variable `API_SECRET_KEY`
3. Update environment variable `api_key` dengan value yang sama

---

## 🔑 Finding Your API Key

**Lokasi di Project:**

```
File: .env.local
Variable: API_SECRET_KEY=your_secret_key_here
```

**Default Value (Development):**

```
secretbet
```

⚠️ **Production:** Ganti dengan random strong key!

---

## 📝 Example Workflow

### 1. Register New User

```http
POST {{apiBaseUrl}}/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response:**

```json
{
  "success": true,
  "userId": "6789a1b2c3d4e5f678901234",
  "message": "User registered"
}
```

### 2. Copy User ID

```
userId = 6789a1b2c3d4e5f678901234
```

### 3. Update Environment

```
Set user_id = 6789a1b2c3d4e5f678901234
```

### 4. Test Protected Endpoints

```http
GET {{apiBaseUrl}}/friends
x-api-key: {{api_key}}
x-user-id: {{user_id}}
```

**Response:**

```json
{
  "success": true,
  "friends": [...]
}
```

---

## 🚀 Pro Tips

1. **Create Multiple Environments** untuk different users:
   - `local-user1.json` (user_id: user001)
   - `local-user2.json` (user_id: user002)
2. **Use Collection Variables** untuk data yang sering berubah:
   - `roomId` - ID room yang lagi ditest
   - `friendId` - ID friend yang lagi ditest

3. **Save Responses** sebagai examples untuk documentation

4. **Use Tests Scripts** untuk auto-set variables:
   ```javascript
   // Setelah create room, save roomId
   const response = pm.response.json();
   pm.environment.set("roomId", response.room._id);
   ```

---

## 🔐 Security Notes

- ⚠️ **API Key** di production harus strong & rahasia!
- ⚠️ **User ID** adalah sensitive data (jangan share!)
- ⚠️ Environment files dengan real production keys **jangan commit ke Git**!
- ✅ Add `*.postman_environment.json` ke `.gitignore` kalau store sensitive data
