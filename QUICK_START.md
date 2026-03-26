# VibeSync - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Verify PostgreSQL is Running (30 seconds)
```bash
# Windows: Open Services (services.msc) and look for PostgreSQL
# Or run this script:
setup.bat
```

**If PostgreSQL is NOT running:**
- Open Services app (services.msc)
- Find "PostgreSQL15" (or similar)
- Right-click → Start

### Step 2: Create Database (1 minute)
```bash
# Open Command Prompt/PowerShell
psql -U postgres

# In the PostgreSQL prompt:
CREATE DATABASE vibesync_db;
\q
```

### Step 3: Start Backend (2 minutes)
Open Terminal 1:
```bash
cd backend
mvnw spring-boot:run
```

**Wait for:**
```
Tomcat initialized with port(s): 8080 (http)
Started Application in X.XXX seconds
```

### Step 4: Start Frontend (1 minute)
Open Terminal 2:
```bash
cd frontend
npm install
npm run dev
```

**Wait for:**
```
Local:   http://localhost:5173/
```

### Step 5: Test It! (1 minute)
1. Open browser → `http://localhost:5173`
2. Click "Join the Tribe"
3. Register: 
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `password123`
4. Click "Register" → Should see success message
5. Login with same email/password

✅ **All working!**

---

## ❌ Something Not Working?

### Problem: "Backend connection failed!"

**Check 1:** Is backend running?
```bash
# Should return {"status":"UP"}
curl http://localhost:8080/actuator/health
```
If fails → see "Backend won't start" below

---

### Problem: Backend won't start

**Check 1:** PostgreSQL running?
```bash
psql -U postgres -c "SELECT 1"
```
If fails → Start PostgreSQL service (services.msc)

**Check 2:** Database exists?
```bash
psql -U postgres -c "SELECT 1 FROM pg_database WHERE datname='vibesync_db'"
```
If empty → Run: `psql -U postgres -c "CREATE DATABASE vibesync_db;"`

**Check 3:** Connection credentials correct?
File: `backend/src/main/resources/application.properties`
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/vibesync_db
spring.datasource.username=postgres
spring.datasource.password=Avneesh@2006
```

If password is wrong:
```bash
psql -U postgres
ALTER USER postgres WITH PASSWORD 'Avneesh@2006';
\q
```

**Check 4:** Port 8080 in use?
```bash
netstat -ano | findstr :8080
```
If something else is using it → Kill it or use different port

---

### Problem: Frontend shows blank page or 404

**Check 1:** Frontend running?
Should see "Local: http://localhost:5173/" in Terminal 2

**Check 2:** Clear browser cache
- Press `Ctrl+Shift+Delete`
- Clear "All time"
- Refresh

**Check 3:** Check browser console (F12)
Look for errors like:
- "Failed to fetch from localhost:8080..." → Backend not running
- "Module not found" → Need `npm install`

---

### Problem: Signup/Login fails with error

**Check Backend Logs** (Terminal 1):
- Look for red error messages
- Common errors:
  - `PSQLException` → Database issue
  - `Connection refused` → Database not running
  - `Invalid token` → JWT config issue

**Test API directly** (copy-paste into Terminal):
```bash
# Test signup
curl -X POST http://localhost:8080/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"fullName\":\"Test\",\"email\":\"test@example.com\",\"password\":\"password123\"}"

# Test login
curl -X POST http://localhost:8080/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"password123\"}"
```

---

## 📋 Complete Checklist

- [ ] PostgreSQL service is ON
- [ ] Database `vibesync_db` exists
- [ ] `backend/src/main/resources/application.properties` has correct DB credentials
- [ ] Backend running on `http://localhost:8080` (see "Tomcat initialized" message)
- [ ] Frontend running on `http://localhost:5173` (see "Local:" message)
- [ ] Browser can reach `http://localhost:5173` (shows login page)
- [ ] Backend responds to health check: `curl http://localhost:8080/actuator/health`
- [ ] Can signup with new email
- [ ] Can login with created account

---

## 🔐 OAuth Setup (Optional)

For Google/GitHub/Spotify login:

See [OAUTH_SETUP.md](OAUTH_SETUP.md) for detailed steps

Quick summary:
1. Create app on Google/GitHub/Spotify developer console
2. Get Client ID and Client Secret
3. Add to `backend/src/main/resources/application.properties`:
   ```properties
   spring.security.oauth2.client.registration.google.client-id=YOUR_ID
   spring.security.oauth2.client.registration.google.client-secret=YOUR_SECRET
   ```
4. Restart backend

---

## 💾 How Data Flows

```
Frontend UI
    ↓ (sends email/password)
axios.post("http://localhost:8080/auth/login")
    ↓
Backend AuthController
    ↓ (queries user)
PostgreSQL Database
    ↓ (returns JWT token)
Frontend localStorage
    ↓ (stores token)
Redirect to /home page
```

---

## 🆘 Still Stuck?

1. **Check all error messages carefully** - they usually tell you what's wrong
2. **Look at Terminal 1 (backend)** for stack traces
3. **Look at Terminal 2 (frontend)** for build errors
4. **Browser Console (F12)** - Network tab shows failed API calls
5. **Check file paths** - Some systems have issues with OneDrive paths

If all else fails, share the error message from Terminal 1!

---

## Files You Might Need to Edit

- `backend/src/main/resources/application.properties` - Database & OAuth config
- `frontend/src/pages/Auth.jsx` - Login/Signup UI
- `backend/src/main/java/com/vibesync/backend/AuthController.java` - Auth logic

---

**Last Updated:** March 25, 2026
