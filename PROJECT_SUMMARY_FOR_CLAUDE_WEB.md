# 📋 Ringkasan Proyek ChitChat V5.1 AI untuk Claude Web

## 🎯 Tujuan Dokumen
Dokumen ini memberikan gambaran menyeluruh tentang proyek ChitChat V5.1 AI sebagai konteks awal untuk pengembangan lebih lanjut menggunakan Claude Web, menggantikan Claude Codebase karena keterbatasan langganan.

---

## 🏗️ Arsitektur Keseluruhan

### **Technology Stack**
- **Frontend**: Next.js 15.5.3 + React 19.1.0 + Tailwind CSS 4
- **Backend**: Custom HTTP Server + Socket.IO + PartyKit (dual WebSocket implementation)
- **Database**: MongoDB + Mongoose
- **Authentication**: NextAuth 5 dengan JWT strategy (sliding session)
- **Real-time**: Socket.IO (port 1630) + PartyKit integration

### **Struktur Proyek**
```
Chit-Chat-V5AI/
├── src/
│   ├── app/
│   │   ├── api/           # REST API routes
│   │   ├── auth/          # Authentication pages
│   │   ├── dashboard/     # Main application layout & pages
│   │   └── components/    # Reusable React components
│   ├── lib/               # Helper utilities
│   ├── models/            # Database schemas
│   └── auth.js            # NextAuth configuration
├── party/                 # PartyKit serverless functions
├── server.js              # Custom HTTP server dengan Socket.IO
└── Konfigurasi dasar (Next.js, ESLint, dll.)
```

---

## 🔐 Sistem Autentikasi

### **NextAuth 5.0 Implementation**
- **Adapter**: MongoDB Adapter untuk menyimpan session di database
- **Providers**: Credentials provider dengan dukungan login via username ATAU email
- **Session Strategy**: JWT dengan sliding session
  - **Max Age**: 7 hari
  - **Update Age**: 1 hari (session diperpanjang jika user aktif)
- **Custom User ID**: Format `user001`, `user002`, dsb.

### **Dua Metode Autentikasi**
1. **Browser Session**: Otomatis melalui NextAuth (untuk penggunaan normal)
2. **API Key**: Untuk testing (header `x-api-key: secretbet` + `x-user-id: user001`)

### **Sliding Session**
Konsep session yang diperpanjang secara otomatis ketika user aktif, mencegah logout otomatis untuk user yang masih aktif menggunakan aplikasi.

---

## 🔌 Infrastruktur Real-time

### **Dual WebSocket Implementation**
Proyek ini menggunakan dua sistem WebSocket untuk tujuan berbeda:

#### **1. Socket.IO (server.js)**
- **Port**: 1630
- **Events Support**:
  - `join_room` / `leave_room` - Join/leave chat room
  - `send_message` - Kirim pesan ke room tertentu
  - `typing_start` / `typing_stop` - Indikator mengetik
- **CORS**: Multi-origin support untuk development
- **Network Access**: localhost dan IP address (192.168.1.x)

#### **2. PartyKit Integration**
- **Location**: `party/chatroom.ts`
- **Features**:
  - User presence detection
  - Online users tracking
  - Read receipts
  - Message broadcasting
- **Connection Params**: Mendukung userId dan username via query params

---

## 🌐 Routing & Navigation

### **Base URL**
- **Development**: `http://localhost:1630` (BUKAN 3000!)
- **Port ini digunakan untuk Next.js server dan Socket.IO**

### **Routing Logic**
- Pengguna diarahkan ke `/dashboard` jika sudah login
- Diarahkan ke `/auth` jika belum login
- Support slug-based routing untuk room (misalnya `/dashboard/chat/john`)

---

## 📡 API Endpoints Utama

### **Autentikasi**
- `POST /api/register` - Registrasi akun baru
- `GET|POST /api/auth/[...nextauth]/` - NextAuth handlers (login/logout)

### **Manajemen Teman**
- `GET /api/friends` - Dapatkan daftar teman dan permintaan
- `POST /api/friends/add` - Kirim permintaan pertemanan
- `POST /api/friends/respond` - Terima/tolak permintaan
- `GET /api/friends/requests` - Dapatkan hanya permintaan yang diterima

### **Manajemen Room**
- `GET /api/rooms` - Dapatkan semua room milik user
- `POST /api/rooms/create` - Buat room baru (private/group/ai)
- `GET /api/rooms/by-slug/[slug]` - Dapatkan room berdasarkan slug

### **Manajemen Pesan**
- `POST /api/messages` - Kirim pesan
- `GET /api/messages/[roomId]` - Dapatkan pesan dari room tertentu (dengan pagination)
- Support query params: `limit`, `before` untuk pagination

### **Manajemen User**
- `GET /api/users/search` - Cari user berdasarkan username/displayName

### **Endpoint Tambahan**
- `GET /api/test-db` - Test koneksi database
- `GET /api/socket` - Endpoint dengan issue (belum diperbaiki)

---

## 📱 Fitur Utama Aplikasi

### **Dashboard Layout** (`src/app/dashboard/layout.jsx`)
- **3-tab navigation**: Chats, Friends, Requests
- **State management**: User, rooms, friends, friend requests
- **Real-time updates**: Dengan useEffect dan socket events
- **Modal system**: Untuk operasi seperti add friend, settings

### **Tipe Room**
1. **Private**: Chat 1-on-1 antar user
2. **Group**: Chat multi-user
3. **AI**: Chat dengan AI assistant (implementasi dasar)

### **Fitur Real-time**
- **Message broadcasting**: Pesan langsung muncul di semua device
- **Typing indicators**: Tahu kapan user lain sedang mengetik
- **User presence**: Tahu siapa yang sedang online
- **Read receipts**: Tahu kapan pesan telah dibaca

### **UI Components**
- `MessageBubble.jsx` - Tampilan pesan dengan styling berbeda
- `MessageInput.jsx` & `MessageInput-partykit.jsx` - Input pesan dengan dua backend
- `ChatHeader.jsx` - Header room dengan informasi user
- `TypingIndicator.jsx` - Indikator mengetik real-time
- `AddFriendModal.jsx` - Modal untuk menambah teman

---

## 💾 Database Schema

### **User Model**
- `userId`: String unik (user001, user002, dsb.)
- `username`: String unik
- `email`: String unik
- `password`: String (hash bcrypt)
- `displayName`: String
- `createdAt`: Date

### **Collections Lain**
- `friendships`: Relasi pertemanan (pending/accepted)
- `rooms`: Ruang chat (private/group/ai)
- `messages`: Pesan dengan pagination support

---

## 🧪 Development & Testing

### **Perintah Penting**
- `npm run dev` - Jalankan development server di port 1630
- `npm run dev:partykit` - Jalankan PartyKit dev server
- `npm run build` - Build untuk production

### **Testing dengan Postman**
Setelah NextAuth migrasi, testing API menggunakan header:
```
x-api-key: secretbet
x-user-id: user001
```

### **Endpoint yang Tidak Digunakan Lagi**
- `POST /api/login` - Sudah diganti dengan NextAuth

---

## 🚀 Deployment Considerations

### **Production Setup**
- Ubah CORS origin di server.js
- Gunakan environment variables untuk API key
- Implementasi security headers
- Setup database connection pooling

### **Performance**
- Database connection pooling
- Message pagination
- Efficient WebSocket connection management

---

## 🎯 Petunjuk untuk Claude Web

### **Pola Pengembangan**
1. **Selalu cek autentikasi** - Mayoritas endpoint butuh auth
2. **Ikuti pola yang sudah ada** - Konsisten dengan codebase
3. **Gunakan konvensi penamaan** - PascalCase untuk komponen, kebab-case untuk API
4. **Uji fitur real-time** - Pastikan WebSocket berfungsi
5. **Handle error secara elegan** - Ikuti pola error handling
6. **Update dokumentasi** - Jaga agar tetap sinkron dengan kode

### **Penting untuk Diketahui**
- Base URL adalah port 1630, bukan 3000
- Implementasi ganda WebSocket (Socket.IO dan PartyKit) untuk fleksibilitas
- System session sliding 7 hari dengan refresh 1 hari
- Support slug-based routing untuk kemudahan navigasi
- Semua request API butuh auth (NextAuth session atau API key headers)
- Gunakan MongoDB Adapter untuk persistensi session

---

## 🔧 Catatan Khusus

### **Issue yang Diketahui**
- `/api/socket` endpoint memiliki syntax error
- Harus menjaga konsistensi antara Socket.IO dan PartyKit implementations

### **Best Practices dalam Proyek Ini**
- Gunakan ESLint untuk maintain code quality
- Gunakan Tailwind CSS untuk styling
- Gunakan functional components dengan hooks
- Gunakan async/await untuk operasi asynchronous
- Gunakan destructuring untuk clean code

---

**Dokumen ini disiapkan sebagai titik awal bagi Claude Web untuk memahami dan melanjutkan pengembangan proyek ChitChat V5.1 AI. Semua dokumentasi teknis dan arsitektur utama telah dirangkum untuk memudahkan transisi dari Claude Codebase ke Claude Web.**