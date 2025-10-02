# ⚡ Quick Start - Host Locally

## 🚀 Start Server (Restart Kalau Sudah Jalan)

```bash
# Stop server kalau sudah jalan (Ctrl+C)
# Lalu start lagi:

npm run dev
```

**Expected Output:**
```
🚀 Server jalan di:
   - Local:   http://localhost:3000
   - Network: http://192.168.10.16:3000
```

---

## 📱 Akses dari Device Lain

### 1. **Pastikan WiFi sama** ✅
   - Komputer & HP connect ke WiFi yang sama

### 2. **Allow Firewall** (Windows)

**Quick Command (PowerShell - Admin):**
```powershell
netsh advfirewall firewall add rule name="ChitChat Port 3000" dir=in action=allow protocol=TCP localport=3000
```

**Atau Manual:**
- Windows Defender Firewall → Advanced Settings
- Inbound Rules → New Rule → Port → TCP 3000 → Allow

### 3. **Buka di HP/Device Lain**

Buka browser, ketik:
```
http://192.168.10.16:3000
```

---

## ✅ Test Checklist

### Dari Komputer (Server):
- [ ] Buka `http://localhost:3000` → Muncul halaman auth ✅
- [ ] Buka `http://192.168.10.16:3000` → Muncul halaman auth ✅

### Dari HP/Device Lain (WiFi sama):
- [ ] Buka `http://192.168.10.16:3000` → Muncul halaman auth ✅
- [ ] Register account baru → Berhasil ✅
- [ ] Login → Redirect ke dashboard ✅
- [ ] Kirim pesan antar device → Real-time works ✅

---

## 🔥 Troubleshooting Cepat

### ❌ "Site can't be reached" dari HP
**Fix:**
```bash
# 1. Cek IP address (di komputer)
ipconfig

# 2. Ping dari HP (buka terminal app atau CMD)
ping 192.168.10.16

# 3. Kalau failed, cek firewall
# Temporary disable untuk test:
netsh advfirewall set allprofiles state off

# Test lagi dari HP, kalau works → firewall issue
# Enable lagi:
netsh advfirewall set allprofiles state on

# Lalu allow port 3000
netsh advfirewall firewall add rule name="ChitChat" dir=in action=allow protocol=TCP localport=3000
```

### ❌ Socket.io tidak connect
**Fix:**
```bash
# 1. Stop server (Ctrl+C)
# 2. Restart server
npm run dev

# 3. Cek browser console (F12)
# Harusnya ada log: "📞 Dashboard connect ke server!"
```

### ❌ IP berubah setelah restart komputer
**Fix:**
```bash
# 1. Cek IP baru
ipconfig

# 2. Update .env.local
# Ganti IP di baris ini:
NEXT_PUBLIC_SERVER_URL=http://192.168.10.XX:3000

# 3. Update server.js juga (line 16)
origin: ["http://localhost:3000", "http://192.168.10.XX:3000"]

# 4. Restart server
npm run dev
```

---

## 📋 URLs Penting

| Akses Dari | URL |
|------------|-----|
| Komputer (localhost) | `http://localhost:3000` |
| Komputer (network) | `http://192.168.10.16:3000` |
| HP/Device Lain | `http://192.168.10.16:3000` |

---

## 🎯 Next Steps

Setelah berhasil host locally:
1. ✅ Test multi-user chat (login dari 2 device)
2. ✅ Test typing indicator
3. ✅ Test group chat
4. 📚 Baca [LOCAL_HOSTING_GUIDE.md](LOCAL_HOSTING_GUIDE.md) untuk detail lengkap

---

**Current IP:** `192.168.10.16`
**Port:** `3000`
