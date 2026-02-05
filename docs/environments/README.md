# Postman Environments

This folder contains Postman environment files for different deployment stages.

## Available Environments

### 1. Local Development (`local.postman_environment.json`)

**Usage:** Testing on your local machine

**Variables:**

- `baseUrl`: `http://localhost:3000`
- `apiBaseUrl`: `http://localhost:3000/api`
- `authToken`: (Auto-filled after login)
- `userEmail`: `test@example.com`
- `userPassword`: `testpassword123`

### 2. Staging (`staging.postman_environment.json`)

**Usage:** Testing on staging server before production deployment

**Variables:**

- `baseUrl`: `https://staging.your-domain.com` _(Update this!)_
- `apiBaseUrl`: `https://staging.your-domain.com/api`
- `authToken`: (Auto-filled after login)
- `userEmail`: Your staging test account
- `userPassword`: (Keep secret!)

### 3. Production (`production.postman_environment.json`)

**Usage:** Testing on live production server (use with caution!)

**Variables:**

- `baseUrl`: `https://your-production-domain.com` _(Update this!)_
- `apiBaseUrl`: `https://your-production-domain.com/api`
- `authToken`: (Auto-filled after login)
- `userEmail`: (Fill when needed)
- `userPassword`: (Keep secret!)

---

## How to Use

### In Postman Desktop App:

1. **Import Environment:**
   - Click **Environments** (left sidebar)
   - Click **Import**
   - Select environment files from this folder

2. **Select Environment:**
   - Top-right dropdown → Select environment (Local/Staging/Production)

3. **Use Variables in Requests:**
   ```
   GET {{apiBaseUrl}}/users
   ```
   Instead of:
   ```
   GET http://localhost:3000/api/users
   ```

### Example Request:

**Before (hardcoded):**

```
GET http://localhost:3000/api/auth/me
Authorization: Bearer abc123token
```

**After (with variables):**

```
GET {{apiBaseUrl}}/auth/me
Authorization: Bearer {{authToken}}
```

---

## Security Notes

⚠️ **Important:**

- **Never commit sensitive data** like real passwords or production API keys to Git
- The `authToken` will be auto-filled by login requests (see collection)
- Add `*.postman_environment.json` to `.gitignore` if storing sensitive data

---

## How authToken Gets Set

In your login request, add a **Test script**:

```javascript
// After successful login, save token
if (pm.response.code === 200) {
  const jsonData = pm.response.json();
  pm.environment.set("authToken", jsonData.token);
}
```

Then in other requests, use:

```
Authorization: Bearer {{authToken}}
```

---

## Updating URLs

**For Production:**

1. Open `production.postman_environment.json`
2. Change `https://your-production-domain.com` to your actual domain
3. Save and re-import to Postman

**For Staging:**

1. Open `staging.postman_environment.json`
2. Update the staging URL
3. Save and re-import to Postman
