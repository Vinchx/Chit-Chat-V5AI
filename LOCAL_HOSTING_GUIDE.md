# 🌐 Local Network Hosting Guide - ChitChat

Panduan lengkap untuk host ChitChat di jaringan lokal (WiFi) agar bisa diakses dari device lain.

---

## 📋 Prerequisites

- ✅ Komputer dan device lain harus terhubung ke **WiFi yang sama**
- ✅ Firewall di komputer harus allow port 3000
- ✅ NPM dan Node.js sudah terinstall

---

## 🔍 Step 1: Cari IP Address Lokal

### Windows:
```bash
ipconfig
```
Cari bagian `IPv4 Address`, contoh: `192.168.10.16`

### Mac/Linux:
```bash
ifconfig
# atau
ip addr show
```

**IP Lokal Kamu:** `192.168.10.16`

---

## ⚙️ Step 2: Update Konfigurasi (Sudah Dilakukan)

### File yang sudah diupdate:

#### 1. `server.js` - Socket.io & Server Config
```javascript
// CORS untuk Socket.io
const io = new Server(server, {
    cors: {
        origin: dev ? [
            "http://localhost:3000",
            "http://192.168.10.16:3000"  // ✅ IP lokal kamu
        ] : "https://Chit-Chat-V5AI",
        credentials: true
    }
});

// Listen pada 0.0.0.0 (semua network interfaces)
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server jalan di:`);
    console.log(`   - Local:   http://localhost:${PORT}`);
    console.log(`   - Network: http://192.168.10.16:${PORT}`);  // ✅ IP lokal
});
```

#### 2. `.env.local` - Environment Variable
```bash
MONGODB_URI=mongodb+srv://...

# Server URL untuk Socket.io client
NEXT_PUBLIC_SERVER_URL=http://192.168.10.16:3000
```

#### 3. `src/app/dashboard/page.jsx` - Socket.io Client
```javascript
// Dynamic connection berdasarkan env atau window.location
const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ||
                  `${window.location.protocol}//${window.location.hostname}:${window.location.port}`;
const newSocket = io(serverUrl);
```

---

## 🚀 Step 3: Start Server

### Option 1: Development Mode (Recommended)
```bash
npm run dev
```

### Option 2: Production Mode
```bash
npm run build
npm start
```

**Output yang benar:**
```
🚀 Server jalan di:
   - Local:   http://localhost:3000
   - Network: http://192.168.10.16:3000
```

---

## 🔥 Step 4: Setup Firewall (Windows)

### Method 1: Windows Firewall GUI
1. Buka **Windows Defender Firewall**
2. Klik **Advanced Settings**
3. Klik **Inbound Rules** → **New Rule**
4. Pilih **Port** → Next
5. Pilih **TCP** → Specific local ports: `3000` → Next
6. Pilih **Allow the connection** → Next
7. Checklist all (Domain, Private, Public) → Next
8. Name: `ChitChat Port 3000` → Finish

### Method 2: Command Line (Admin PowerShell)
```powershell
# Allow port 3000 inbound
netsh advfirewall firewall add rule name="ChitChat Port 3000" dir=in action=allow protocol=TCP localport=3000

# Check rule
netsh advfirewall firewall show rule name="ChitChat Port 3000"
```

### Method 3: Temporary Disable (Not Recommended)
```powershell
# Turn off firewall (temporary - for testing only!)
netsh advfirewall set allprofiles state off

# Turn back on
netsh advfirewall set allprofiles state on
```

---

## 📱 Step 5: Akses dari Device Lain

### Dari HP atau Laptop Lain (WiFi yang sama):

1. **Buka browser** (Chrome, Safari, Firefox)
2. **Ketik URL:**
   ```
   http://192.168.10.16:3000
   ```
3. **Seharusnya muncul** halaman Login ChitChat
4. **Register/Login** seperti biasa

---

## 🧪 Testing Checklist

### Test 1: Akses dari Komputer Host
- [ ] Buka `http://localhost:3000` ✅
- [ ] Buka `http://192.168.10.16:3000` ✅
- [ ] Login berhasil ✅
- [ ] Dashboard tampil ✅

### Test 2: Akses dari HP (WiFi sama)
- [ ] HP connect ke WiFi yang sama ✅
- [ ] Buka `http://192.168.10.16:3000` ✅
- [ ] Halaman auth muncul ✅
- [ ] Register account baru ✅
- [ ] Login berhasil ✅
- [ ] Dashboard tampil ✅

### Test 3: Socket.io Real-time
- [ ] Login dari 2 device berbeda ✅
- [ ] Berteman (add friend) ✅
- [ ] Buat private room ✅
- [ ] Kirim pesan dari device 1 ✅
- [ ] Pesan diterima real-time di device 2 ✅
- [ ] Typing indicator muncul ✅

### Test 4: Multi-user Scenario
- [ ] 3+ device online bersamaan ✅
- [ ] Group chat berfungsi ✅
- [ ] Pesan broadcast ke semua member ✅

---

## 🛠️ Troubleshooting

### Problem 1: "Site can't be reached" dari device lain
**Kemungkinan penyebab:**
- Firewall block port 3000
- WiFi berbeda
- IP address salah

**Solution:**
```bash
# 1. Cek IP address lagi
ipconfig

# 2. Ping dari device lain (di CMD/Terminal HP)
ping 192.168.10.16

# 3. Cek firewall rule
netsh advfirewall firewall show rule name=all | findstr "3000"

# 4. Temporary disable firewall untuk test
netsh advfirewall set allprofiles state off
```

---

### Problem 2: Halaman loading tapi Socket.io tidak connect
**Kemungkinan penyebab:**
- CORS settings salah
- Socket.io URL tidak update

**Solution:**
1. Cek browser console (F12)
2. Lihat error Socket.io
3. Pastikan `NEXT_PUBLIC_SERVER_URL` benar di `.env.local`
4. Restart server:
   ```bash
   # Ctrl+C untuk stop
   npm run dev
   ```

---

### Problem 3: Bisa akses tapi tidak bisa login/register
**Kemungkinan penyebab:**
- Database tidak connect
- API endpoint tidak jalan

**Solution:**
```bash
# Cek MongoDB connection
# Lihat terminal server, harusnya ada log connection success

# Test API endpoint
curl http://192.168.10.16:3000/api/test-db
```

---

### Problem 4: IP Address berubah setelah restart
**Kemungkinan penyebab:**
- DHCP assign IP baru

**Solution:**

#### Set Static IP (Recommended untuk development)

**Windows:**
1. Control Panel → Network and Sharing Center
2. Change adapter settings
3. Right-click WiFi → Properties
4. Select **Internet Protocol Version 4 (TCP/IPv4)** → Properties
5. Select **Use the following IP address:**
   - IP address: `192.168.10.16` (IP current kamu)
   - Subnet mask: `255.255.255.0`
   - Default gateway: `192.168.10.1` (router IP kamu)
6. DNS: `8.8.8.8` (Google DNS)
7. OK → OK

**Atau update .env.local dengan IP baru** setiap kali berubah:
```bash
NEXT_PUBLIC_SERVER_URL=http://192.168.10.XX:3000  # Update XX
```

---

## 📊 Network Diagram

```
┌─────────────────────────────────────────────────┐
│           WiFi Router (192.168.10.1)            │
└───────────────────┬─────────────────────────────┘
                    │
        ┌───────────┼───────────┬─────────────┐
        │           │           │             │
        ▼           ▼           ▼             ▼
┌──────────────┐ ┌─────┐   ┌─────┐      ┌─────┐
│   Komputer   │ │ HP1 │   │ HP2 │      │ ... │
│   (Server)   │ └─────┘   └─────┘      └─────┘
│              │
│ 192.168.10.16│ Access via:
│   :3000      │ http://192.168.10.16:3000
└──────────────┘
```

---

## 🌍 Advanced: Access dari Internet (Optional)

Kalau mau akses dari luar jaringan WiFi (internet), butuh:

### Option 1: Ngrok (Simple, Free)
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Output:
# Forwarding: https://xxxx-xx-xx-xx.ngrok.io -> http://localhost:3000
```

Update `.env.local`:
```bash
NEXT_PUBLIC_SERVER_URL=https://xxxx-xx-xx-xx.ngrok.io
```

### Option 2: Port Forwarding (Router)
1. Login ke router (biasanya `192.168.10.1`)
2. Cari menu **Port Forwarding** / **Virtual Server**
3. Add rule:
   - External Port: `3000`
   - Internal IP: `192.168.10.16`
   - Internal Port: `3000`
   - Protocol: `TCP`
4. Save & restart router

**Public URL:** `http://[Your-Public-IP]:3000`

⚠️ **Security Warning:** Tidak aman untuk production! Gunakan HTTPS + authentication yang proper.

---

## 📝 Quick Commands Reference

```bash
# Cek IP address
ipconfig                              # Windows
ifconfig                              # Mac/Linux

# Start server
npm run dev                           # Development
npm start                             # Production (setelah build)

# Firewall (Windows PowerShell - Admin)
netsh advfirewall firewall add rule name="ChitChat" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall delete rule name="ChitChat"
netsh advfirewall firewall show rule name="ChitChat"

# Test connection dari device lain
ping 192.168.10.16
curl http://192.168.10.16:3000

# Kill process di port 3000 (kalau stuck)
netstat -ano | findstr :3000         # Windows
kill -9 [PID]                         # Linux/Mac
```

---

## 🎯 Production Deployment

Untuk deploy ke production (bukan localhost), lihat:
- [Vercel](https://vercel.com) - Recommended untuk Next.js
- [Railway](https://railway.app)
- [Render](https://render.com)
- VPS (Digital Ocean, AWS, dll)

---

## ✅ Summary

**Your Local Network URLs:**
```
Komputer:      http://localhost:3000
               http://192.168.10.16:3000

Device Lain:   http://192.168.10.16:3000
(WiFi sama)
```

**Files Modified:**
- ✅ `server.js` - CORS & listen on 0.0.0.0
- ✅ `.env.local` - NEXT_PUBLIC_SERVER_URL
- ✅ `src/app/dashboard/page.jsx` - Dynamic Socket.io URL

**Next Steps:**
1. Start server: `npm run dev`
2. Allow firewall
3. Test dari HP/device lain
4. Enjoy! 🎉

---

**Last Updated:** October 2, 2024
**Your IP:** 192.168.10.16:3000
