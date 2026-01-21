# 🔧 Troubleshooting Guide - ChitChat V5.1 AI

Common issues and solutions.

---

## 🌐 Connection Issues

### "Site can't be reached" from phone/other device

**Causes:**

- Devices not on same WiFi
- Firewall blocking port
- Wrong IP address

**Solutions:**

1. Verify devices on same WiFi network

2. Check your IP address:

   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

3. Allow firewall (Windows PowerShell as Admin):

   ```powershell
   netsh advfirewall firewall add rule name="ChitChat" dir=in action=allow protocol=TCP localport=1630
   ```

4. Temporary disable firewall for testing:
   ```powershell
   netsh advfirewall set allprofiles state off
   # Test, then enable again:
   netsh advfirewall set allprofiles state on
   ```

---

### Socket.IO not connecting

**Symptoms:**

- Messages don't appear real-time
- No typing indicators
- Console errors about WebSocket

**Solutions:**

1. Check browser console (F12) for errors

2. Verify `NEXT_PUBLIC_SERVER_URL` in `.env.local`:

   ```env
   NEXT_PUBLIC_SERVER_URL=http://localhost:1630
   ```

3. Restart server:

   ```bash
   # Ctrl+C to stop
   npm run dev:fast
   ```

4. Check if port 1630 is in use:
   ```bash
   netstat -ano | findstr :1630
   ```

---

### PartyKit connection failed

**Symptoms:**

- Online presence not working
- Advanced real-time features broken

**Solutions:**

1. Ensure PartyKit server is running:

   ```bash
   npm run dev:partykit
   ```

2. Check `NEXT_PUBLIC_PARTYKIT_HOST`:

   ```env
   # Development
   NEXT_PUBLIC_PARTYKIT_HOST=127.0.0.1:1999

   # Production
   NEXT_PUBLIC_PARTYKIT_HOST=chitchat-v5.username.partykit.dev
   ```

3. Check if port 1999 is available

---

## 🔐 Authentication Issues

### Cannot login

**Causes:**

- Wrong credentials
- Database connection issue
- Session configuration problem

**Solutions:**

1. Test database connection:

   ```
   GET http://localhost:1630/api/test-db
   ```

2. Check MongoDB connection string in `.env.local`

3. Clear browser cookies and try again

4. Check server logs for errors

---

### Session keeps expiring

**Normal behavior:** Session expires after 7 days of inactivity.

**If expiring too soon:**

1. Check `auth.js` configuration:

   ```javascript
   session: {
     strategy: "jwt",
     maxAge: 7 * 24 * 60 * 60,    // 7 days
     updateAge: 24 * 60 * 60,     // 1 day
   }
   ```

2. Ensure `NEXTAUTH_SECRET` is set in `.env.local`

---

## 🤖 AI Features Issues

### Nano Banana Image Generation - Quota Exceeded

**Error:**

```
Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests
```

**Causes:**

- Gemini API free tier has limited quota (15 requests/day for image models)

**Solutions:**

1. **Wait for quota reset** - Resets every 24 hours
   - Check status: https://ai.dev/rate-limit

2. **Upgrade to paid plan** - Higher quota
   - Info: https://ai.google.dev/pricing

3. **Automatic fallback** - System falls back to text description when quota exceeded

---

### AI not responding

**Causes:**

- Invalid API key
- Model not available
- Rate limiting

**Solutions:**

1. Check `GEMINI_API_KEY` in `.env.local`:

   ```env
   GEMINI_API_KEY=AIza...  # Must start with AIza
   ```

2. Check API key validity at [Google AI Studio](https://aistudio.google.com/)

3. Review server logs for specific error messages

---

## 💬 Chat Issues

### Messages not sending

**Solutions:**

1. Check if you're a member of the room

2. Verify WebSocket connection (check console)

3. Check API response:
   ```javascript
   // In browser console
   fetch("/api/messages", {
     method: "POST",
     body: JSON.stringify({
       roomId: "room001",
       message: "test",
     }),
   })
     .then((r) => r.json())
     .then(console.log);
   ```

---

### Typing indicator stuck

**Cause:** `stop-typing` event not sent

**Solution:** Implemented auto-timeout (3 seconds) - should resolve automatically

---

### Messages not real-time

**Causes:**

- WebSocket disconnected
- Server not running

**Solutions:**

1. Check Socket.IO connection in console

2. Verify both servers running:
   - Next.js: `npm run dev:fast`
   - PartyKit: `npm run dev:partykit`

3. Reload the page

---

## 💾 Database Issues

### MongoDB connection failed

**Solutions:**

1. Check `MONGODB_URI` in `.env.local`

2. Verify MongoDB Atlas IP whitelist (add your IP or 0.0.0.0/0 for development)

3. Test connection:
   ```bash
   node test-mongo-connection.js
   ```

---

### Data not saving

**Solutions:**

1. Check server logs for Mongoose errors

2. Verify model schemas in `src/models/`

3. Check if database has write permissions

---

## 🐛 Debugging Tips

### Enable verbose logging

Add to your code:

```javascript
useEffect(() => {
  console.log("Current path:", window.location.pathname);
  console.log("Has session:", !!session);
  console.log("Socket connected:", socket?.connected);
}, []);
```

### Check API responses

Use browser DevTools Network tab to inspect:

- Request headers
- Response body
- Status codes

### PartyKit debugging

Check terminal running `npm run dev:partykit` for:

```
✅ User John (user001) joined room room001
📨 Message from John: {...}
❌ User John left room room001
```

---

## 📞 Getting Help

- **Check existing docs:** [Architecture](./ARCHITECTURE.md), [API Reference](./API_REFERENCE.md)
- **Gemini API:** https://ai.google.dev/gemini-api/docs
- **PartyKit:** https://docs.partykit.io
- **NextAuth:** https://authjs.dev/
