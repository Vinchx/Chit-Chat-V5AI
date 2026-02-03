# 📡 Dokumentasi API Chit-Chat V5.1 AI (Simple)

**Base URL:** `http://localhost:1630`

---

## 🔐 Authentication

| Endpoint                    | Method | Fungsi                    |
| --------------------------- | ------ | ------------------------- |
| `/api/register`             | POST   | Daftar akun baru          |
| `/api/auth/[...nextauth]`   | -      | Login via NextAuth        |
| `/api/auth/forgot-password` | POST   | Request reset password    |
| `/api/auth/reset-password`  | POST   | Reset password dengan OTP |
| `/api/auth/verify/[token]`  | GET    | Verifikasi email          |
| `/api/auth/send-otp`        | POST   | Kirim kode OTP            |
| `/api/auth/verify/otp`      | POST   | Verifikasi OTP            |

---

## 👥 Friends

| Endpoint                | Method | Fungsi                        |
| ----------------------- | ------ | ----------------------------- |
| `/api/friends`          | GET    | Ambil daftar teman            |
| `/api/friends/add`      | POST   | Kirim permintaan pertemanan   |
| `/api/friends/requests` | GET    | Ambil permintaan masuk        |
| `/api/friends/respond`  | POST   | Terima/tolak/block permintaan |

---

## 💬 Rooms

| Endpoint                      | Method   | Fungsi                            |
| ----------------------------- | -------- | --------------------------------- |
| `/api/rooms`                  | GET      | Ambil semua room user             |
| `/api/rooms/create`           | POST     | Buat room baru (private/group/AI) |
| `/api/rooms/by-slug/[slug]`   | GET      | Ambil room berdasarkan slug       |
| `/api/rooms/[roomId]/info`    | GET      | Detail info room                  |
| `/api/rooms/[roomId]/leave`   | POST     | Keluar dari room                  |
| `/api/rooms/[roomId]/members` | GET/POST | Kelola member grup                |
| `/api/rooms/[roomId]/avatar`  | POST     | Upload avatar grup                |
| `/api/rooms/[roomId]/banner`  | POST     | Upload banner grup                |

---

## 📨 Messages

| Endpoint                            | Method | Fungsi                    |
| ----------------------------------- | ------ | ------------------------- |
| `/api/messages`                     | POST   | Kirim pesan teks          |
| `/api/messages/room/[roomId]`       | GET    | Ambil riwayat chat        |
| `/api/messages/room/[roomId]/media` | POST   | Kirim gambar/file         |
| `/api/messages/read-receipts`       | POST   | Tandai pesan sudah dibaca |

---

## 🤖 AI Chat

| Endpoint       | Method | Fungsi                            |
| -------------- | ------ | --------------------------------- |
| `/api/ai/chat` | POST   | Kirim pesan ke AI (Google Gemini) |

---

## 👤 Profile

| Endpoint                       | Method | Fungsi                    |
| ------------------------------ | ------ | ------------------------- |
| `/api/profile/update`          | PUT    | Update profil (nama, bio) |
| `/api/profile/change-password` | POST   | Ganti password            |
| `/api/profile/upload-avatar`   | POST   | Upload foto profil        |
| `/api/profile/upload-banner`   | POST   | Upload banner profil      |

---

## 👥 Users

| Endpoint                    | Method | Fungsi                         |
| --------------------------- | ------ | ------------------------------ |
| `/api/users/search`         | GET    | Cari user berdasarkan username |
| `/api/users/[userId]`       | GET    | Ambil profil user              |
| `/api/users/[userId]/block` | POST   | Block user                     |
| `/api/users/online`         | GET    | Cek status online user         |

---

## 📁 Upload

| Endpoint                 | Method | Fungsi             |
| ------------------------ | ------ | ------------------ |
| `/api/upload`            | POST   | Upload file umum   |
| `/api/upload/avatar`     | POST   | Upload avatar      |
| `/api/upload/banner`     | POST   | Upload banner      |
| `/api/upload/chat-image` | POST   | Upload gambar chat |

---

## 🚨 Reports

| Endpoint                  | Method | Fungsi             |
| ------------------------- | ------ | ------------------ |
| `/api/reports/create`     | POST   | Laporkan user      |
| `/api/reports/my-reports` | GET    | Lihat laporan saya |

---

## 🔧 Admin

| Endpoint                              | Method | Fungsi                  |
| ------------------------------------- | ------ | ----------------------- |
| `/api/admin/stats`                    | GET    | Dashboard statistik     |
| `/api/admin/users`                    | GET    | Daftar semua user       |
| `/api/admin/users/[userId]/ban`       | POST   | Ban user                |
| `/api/admin/users/[userId]/unban`     | POST   | Unban user              |
| `/api/admin/users/[userId]/suspend`   | POST   | Suspend user            |
| `/api/admin/users/[userId]/unsuspend` | POST   | Unsuspend user          |
| `/api/admin/users/moderated`          | GET    | Daftar user termoderasi |
| `/api/admin/reports/list`             | GET    | Daftar laporan          |
| `/api/admin/reports/[id]`             | GET    | Detail laporan          |
| `/api/admin/reports/[id]/review`      | POST   | Review laporan          |
| `/api/admin/rooms`                    | GET    | Daftar semua room       |
| `/api/admin/rooms/[roomId]/restore`   | POST   | Restore room            |
| `/api/admin/rooms/[roomId]/permanent` | DELETE | Hapus permanen room     |
| `/api/admin/passkey/*`                | -      | Manajemen passkey admin |
| `/api/admin/debug-user`               | GET    | Debug info user         |

---

## 📊 Ringkasan

| Kategori       | Jumlah Endpoint  |
| -------------- | ---------------- |
| Authentication | 7                |
| Friends        | 4                |
| Rooms          | 8                |
| Messages       | 4                |
| AI Chat        | 1                |
| Profile        | 4                |
| Users          | 4                |
| Upload         | 4                |
| Reports        | 2                |
| Admin          | 15+              |
| **Total**      | **67 endpoints** |

---

_Dokumentasi lengkap: [API_REFERENCE.md](./API_REFERENCE.md)_
