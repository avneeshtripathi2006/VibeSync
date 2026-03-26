# ✅ Before Deployment Checklist - All Placeholders & OAuth Setup

## 🔴 CRITICAL: Placeholders That MUST Be Changed

### **1. Backend Configuration Files**

#### **File: `backend/src/main/resources/application.properties`**

| Placeholder | Current Value | What to Replace With | Where to Get |
|------------|--------------|---------------------|--------------|
| `${GOOGLE_CLIENT_ID:your-google-client-id}` | `your-google-client-id` | Real Google Client ID | Google Cloud Console |
| `${GOOGLE_CLIENT_SECRET:your-google-client-secret}` | `your-google-client-secret` | Real Google Client Secret | Google Cloud Console |
| `${GITHUB_CLIENT_ID:your-github-client-id}` | `your-github-client-id` | Real GitHub Client ID | GitHub Settings > OAuth Apps |
| `${GITHUB_CLIENT_SECRET:your-github-client-secret}` | `your-github-client-secret` | Real GitHub Client Secret | GitHub Settings > OAuth Apps |
| `${SPOTIFY_CLIENT_ID:your-spotify-client-id}` | `your-spotify-client-id` | Real Spotify Client ID | Spotify Developer Dashboard |
| `${SPOTIFY_CLIENT_SECRET:your-spotify-client-secret}` | `your-spotify-client-secret` | Real Spotify Client Secret | Spotify Developer Dashboard |

#### **File: `backend/.env` (Local Development)**
```env
GOOGLE_CLIENT_ID=your-google-client-id      ← Change this
GOOGLE_CLIENT_SECRET=your-google-client-secret  ← Change this
GITHUB_CLIENT_ID=your-github-client-id      ← Change this
GITHUB_CLIENT_SECRET=your-github-client-secret  ← Change this
SPOTIFY_CLIENT_ID=your-spotify-client-id    ← Change this
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret  ← Change this
```

---

### **2. Frontend Configuration Files**

#### **File: `frontend/src/pages/Auth.jsx` (Line 34)**
```javascript
const REMOTE_API_URL = import.meta.env.VITE_API_URL || "https://your-backend-service.onrender.com";
                                                        ↑ CHANGE THIS for Render deployment
```

**How to set it:**
- **For Production Render:** Set in `.env` or `.env.production`:
  ```
  VITE_API_URL=https://your-actual-backend-name.onrender.com
  ```
- **For GitHub Pages:** Same as above, but will auto-detect local backend first

#### **File: `frontend/.env.production.local` (Create if doesn't exist)**
```
# Production Frontend Environment
VITE_API_URL=https://your-backend-name.onrender.com
```

---

### **3. Backend Hardcoded URLs (Must Update for Production)**

#### **File: `backend/src/main/java/com/vibesync/backend/OAuth2AuthenticationSuccessHandler.java` (Line 57)**

**Current:**
```java
String redirectUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/auth/oauth2/success")
                .queryParam("token", token)
                .build().toUriString();
```

**Problem:** Hardcoded `localhost:5173` - won't work in production!

**Solution:** Create environment variable. Change to:
```java
String frontendUrl = System.getenv("FRONTEND_URL") != null ? 
                    System.getenv("FRONTEND_URL") : 
                    "http://localhost:5173";
String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl + "/auth/oauth2/success")
                .queryParam("token", token)
                .build().toUriString();

// Also fix error redirect
getRedirectStrategy().sendRedirect(request, response, frontendUrl + "/?error=oauth_failed");
```

**Environment Variables to Add:**
- **Local Development:** Already works with default `localhost:5173`
- **Production (Render):** Set `FRONTEND_URL=https://your-github-username.github.io/VibeSync_Project`

---

### **4. Backend WebSocket Configuration (Must Update for Production)**

#### **File: `backend/src/main/java/com/vibesync/backend/WebSocketConfig.java` (Line 26)**

**Current:**
```java
registry.addEndpoint("/ws-vibe")
        .setAllowedOrigins("http://localhost:5173")
        .withSockJS();
```

**Problem:** Only allows localhost - production will fail!

**Solution:**
```java
String[] allowedOrigins = System.getenv("WEBSOCKET_ORIGINS") != null ?
        System.getenv("WEBSOCKET_ORIGINS").split(",") :
        new String[]{"http://localhost:5173"};

registry.addEndpoint("/ws-vibe")
        .setAllowedOrigins(allowedOrigins)
        .withSockJS();
```

**Environment Variables to Add:**
- **Local:** Already works (default `http://localhost:5173`)
- **Production:** Set `WEBSOCKET_ORIGINS=https://your-github-username.github.io/VibeSync_Project`

---

### **5. Backend CORS Configuration (Must Update for Production)**

#### **File: `backend/src/main/java/com/vibesync/backend/SecurityConfig.java` (Line 88)**

**Current:**
```java
configuration.setAllowedOriginPatterns(Arrays.asList(
    "http://localhost:5173",
    "https://<username>.github.io",
    "https://<your-frontend>.onrender.com"
));
```

**Problem:** Generic pattern `<username>` and `<your-frontend>` - needs real values for production

**Solution:**
```java
List<String> allowedOrigins = Arrays.asList(
    "http://localhost:5173",  // Local dev
    "https://your-github-username.github.io",  // ← YOUR GITHUB USERNAME HERE
    "https://your-backend-name.onrender.com"  // ← SAME AS RENDER BACKEND NAME
);
configuration.setAllowedOriginPatterns(allowedOrigins);
```

---

### **6. Python Vibe-Engine**

#### **File: `vibe-engine/main.py` (Line 11)**

**Current:**
```python
DEFAULT_REMOTE_BACKEND = os.getenv("BACKEND_URL", "https://vibesync-zc9a.onrender.com")
```

**Fix:** Replace `vibesync-zc9a` with your actual Render backend URL

**For Render Deployment:** Set environment variable
- `BACKEND_URL=https://your-backend-name.onrender.com`

---

## 📊 Summary: All Placeholders at a Glance

| Location | Placeholder | Status | Action |
|----------|-----------|--------|--------|
| Backend Props | `GOOGLE_CLIENT_*` | 🔴 **REQUIRED** | Add real OAuth credentials |
| Backend Props | `GITHUB_CLIENT_*` | 🔴 **REQUIRED** | Add real OAuth credentials |
| Backend Props | `SPOTIFY_CLIENT_*` | 🔴 **REQUIRED** | Add real OAuth credentials |
| Frontend Env | `VITE_API_URL` | 🟡 **Optional** | Set for production |
| Backend Java | `OAuth2AuthenticationSuccessHandler` | 🔴 **For Prod** | Add `FRONTEND_URL` env var |
| Backend Java | `WebSocketConfig` | 🔴 **For Prod** | Add `WEBSOCKET_ORIGINS` env var |
| Backend Java | `SecurityConfig` | 🟡 **For Prod** | Update CORS origins with real values |
| Vibe-Engine | `BACKEND_URL` | 🟡 **For Prod** | Set real backend URL |

---

## 🔐 OAuth Setup Complete Guide

### **STEP 1️⃣: Google OAuth Setup**

#### Step 1.1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click dropdown at top → "New Project"
3. **Project Name:** `VibeSync`
4. Click "CREATE"
5. Wait for project to be created

#### Step 1.2: Enable Google+ API
1. Search for "Google+ API" in the search bar
2. Click on it → Click "ENABLE"
3. Wait for it to enable

#### Step 1.3: Create OAuth 2.0 Credentials
1. Go to **"APIs & Services"** → **"Credentials"** (left sidebar)
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, configure OAuth consent screen first:
   - Click **"CONFIGURE CONSENT SCREEN"**
   - Select **"External"** → Click **"CREATE"**
   - Fill in:
     - **App name:** VibeSync
     - **User support email:** Your email
     - **Developer contact:** Your email
   - Click **"SAVE AND CONTINUE"**
   - Skip scopes → Click **"SAVE AND CONTINUE"**
   - Add test users (optional) → Click **"SAVE AND CONTINUE"**
   - Click **"BACK TO DASHBOARD"**

4. Go back to **Credentials** → Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. **Application type:** Select **"Web application"**
6. **Name:** `VibeSync Web Client`
7. **Authorized JavaScript origins** → Click **"+ ADD URI"**
   - Add: `http://localhost:8080`
   - Add: `https://your-backend-name.onrender.com`
8. **Authorized redirect URIs** → Click **"+ ADD URI"**
   - Add: `http://localhost:8080/login/oauth2/code/google`
   - Add: `https://your-backend-name.onrender.com/login/oauth2/code/google`
9. Click **"CREATE"**
10. Copy **Client ID** and **Client Secret** ✅

---

### **STEP 2️⃣: GitHub OAuth Setup**

#### Step 2.1: Create GitHub OAuth App
1. Go to [GitHub Settings](https://github.com/settings/profile)
2. Click **"Developer settings"** (left sidebar) → **"OAuth Apps"**
3. Click **"New OAuth App"**
4. Fill in:
   - **Application name:** `VibeSync`
   - **Homepage URL:** 
     - For local: `http://localhost:5173`
     - For prod: `https://your-username.github.io/VibeSync_Project`
   - **Authorization callback URL:**
     - For local: `http://localhost:8080/login/oauth2/code/github`
     - For prod: `https://your-backend-name.onrender.com/login/oauth2/code/github`
5. Click **"Register application"**
6. You'll see **Client ID** ✅
7. Click **"Generate a new client secret"** → Copy it ✅

**⚠️ IMPORTANT:** You can add multiple callback URLs by separating with spaces, but GitHub only shows one at a time. You'll need to update it when switching environments.

**Better Solution for Production:**
- During dev: Use `http://localhost:8080/login/oauth2/code/github`
- Before deploying: Update to `https://your-backend-name.onrender.com/login/oauth2/code/github`
- OR: Set up a new OAuth app for production

---

### **STEP 3️⃣: Spotify OAuth Setup**

#### Step 3.1: Create Spotify Developer Account
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in or create account
3. Accept terms → Click "AGREE"

#### Step 3.2: Create Spotify App
1. Click **"Create an App"**
2. **App name:** `VibeSync`
3. **App description:** `Social media app for music lovers`
4. Accept terms → Click **"CREATE"**
5. You'll see **Client ID** ✅
6. Click **"Show Client Secret"** → Copy it ✅

#### Step 3.3: Add Redirect URIs
1. In your Spotify app → Go to **"Settings"**
2. Scroll down to **"Redirect URIs"**
3. Click **"Add URI"**
   - Add: `http://localhost:8080/login/oauth2/code/spotify`
   - Click **"Add"**
4. Add another for production:
   - Add: `https://your-backend-name.onrender.com/login/oauth2/code/spotify`
   - Click **"Add"**
5. Click **"SAVE"**

---

## 🎯 Where to Put OAuth Credentials

### **For Local Development:**

#### **Option A: In `.env` file (Recommended)**
Create/Edit `backend/.env`:
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
```

#### **Option B: Directly in `application.properties`** (NOT RECOMMENDED - SECURITY RISK)
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_REAL_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_REAL_CLIENT_SECRET
```

---

### **For Production Deployment (Render):**

1. Go to your backend service on [Render Dashboard](https://dashboard.render.com/)
2. Click your backend service → **"Environment"**
3. Click **"Add Environment Variable"**
4. Add each variable:
   ```
   GOOGLE_CLIENT_ID = your-google-client-id
   GOOGLE_CLIENT_SECRET = your-google-client-secret
   GITHUB_CLIENT_ID = your-github-client-id
   GITHUB_CLIENT_SECRET = your-github-client-secret
   SPOTIFY_CLIENT_ID = your-spotify-client-id
   SPOTIFY_CLIENT_SECRET = your-spotify-client-secret
   FRONTEND_URL = https://your-username.github.io/VibeSync_Project
   WEBSOCKET_ORIGINS = https://your-username.github.io/VibeSync_Project
   ```
5. Click **"Save"** → Service auto-redeploys

---

## 🧪 How to Test OAuth Locally

### **Quick Test:**

1. Start your backend:
```bash
cd backend
./mvnw spring-boot:run
```

2. Start your frontend:
```bash
cd frontend
npm run dev
```

3. Go to `http://localhost:5173`

4. Try **"Sign in with Google"** button

5. **If it works:** You'll be redirected to Google login, then back to your app logged in ✅

6. **If it fails:** Check the error in browser console and backend logs

### **Debugging:**
- **Browser Console:** `F12` → Check for errors
- **Backend Logs:** Look for line with `[c.v.b.OAuth2AuthenticationSuccessHandler]`
- **Common errors:**
  - `redirect_uri_mismatch` → URI doesn't match what's in OAuth app
  - `invalid_client` → Client ID/Secret is wrong
  - `CORS error` → Check SecurityConfig allowed origins

---

## 📋 Pre-Deployment Verification Checklist

Before deploying to Render + GitHub Pages:

### **Backend (Java/Spring Boot)**
- [ ] ✅ Google OAuth Client ID added to `.env` or properties
- [ ] ✅ Google OAuth Client Secret added
- [ ] ✅ GitHub OAuth Client ID added
- [ ] ✅ GitHub OAuth Client Secret added
- [ ] ✅ Spotify OAuth Client ID added
- [ ] ✅ Spotify OAuth Client Secret added
- [ ] ✅ Updated `OAuth2AuthenticationSuccessHandler.java` with `FRONTEND_URL` logic
- [ ] ✅ Updated `WebSocketConfig.java` with `WEBSOCKET_ORIGINS` logic
- [ ] ✅ Updated `SecurityConfig.java` CORS origins with real GitHub username
- [ ] ✅ Tested locally - OAuth login works
- [ ] ✅ Build successful: `./mvnw clean package`

### **Frontend (React)**
- [ ] ✅ Created `.env.production.local` with `VITE_API_URL`
- [ ] ✅ Frontend reads `VITE_API_URL` correctly
- [ ] ✅ Tested locally - backend communication works
- [ ] ✅ Build successful: `npm run build`

### **Database (Supabase or ElephantSQL)**
- [ ] ✅ Created PostgreSQL database
- [ ] ✅ Got connection string: `postgresql://user:password@host:5432/vibesync_db`
- [ ] ✅ Tested connection locally

### **OAuth Apps Configuration**
- [ ] ✅ Google Cloud Console has correct redirect URIs
- [ ] ✅ GitHub OAuth App has correct callback URLs
- [ ] ✅ Spotify Developer Dashboard has correct redirect URIs
- [ ] ✅ All three have BOTH local (localhost:8080) AND production (your backend) URLs

### **Render Backend**
- [ ] ✅ GitHub repo has `backend/` folder committed
- [ ] ✅ All `.env` secrets added to Render environment variables
- [ ] ✅ `FRONTEND_URL` environment variable set
- [ ] ✅ `WEBSOCKET_ORIGINS` environment variable set
- [ ] ✅ Database connection string in environment variables
- [ ] ✅ Service deployed and running (check logs)

### **GitHub Pages Frontend**
- [ ] ✅ Frontend GitHub repo is public
- [ ] ✅ `vite.config.js` base is set correctly
- [ ] ✅ GitHub Actions workflow created for auto-deploy
- [ ] ✅ GitHub Pages is enabled in repo settings
- [ ] ✅ Pages published from `gh-pages` branch

---

## 🔗 Quick Reference Links

| Task | Link |
|------|------|
| Google Cloud Console | https://console.cloud.google.com/ |
| GitHub OAuth Settings | https://github.com/settings/developers |
| Spotify Developer Dashboard | https://developer.spotify.com/dashboard |
| Render Dashboard | https://dashboard.render.com/ |
| Supabase Dashboard | https://app.supabase.com/ |

---

## ⚠️ Security Reminders

1. **NEVER commit `.env` files to GitHub** - They contain secrets!
2. **NEVER paste OAuth secrets in code** - Always use environment variables
3. **Use environment variables** - Even in development
4. **Rotate secrets regularly** if they leak
5. **Use different secrets** for local vs production if possible
6. **Always use HTTPS** in production - Render provides it automatically
7. **Update redirect URIs** when moving between environments

---

## 🆘 Troubleshooting

### **"redirect_uri_mismatch" error**
- Check the exact redirect URI in OAuth app settings
- Make sure it matches EXACTLY in `application.properties`
- Common issue: trailing slash `/` mismatch

### **"invalid_client" error**
- Double-check Client ID and Client Secret
- Make sure they're for the right OAuth provider
- Regenerate if in doubt

### **OAuth button does nothing**
- Check browser console for errors (F12)
- Verify backend is running on `http://localhost:8080`
- Check that CORS is configured correctly

### **"Failed to fetch" on login**
- Backend might not be running
- Check CORS in `SecurityConfig.java`
- Frontend might be trying to connect to wrong URL

### **Token not stored/redirect not working**
- Check `OAuth2AuthenticationSuccessHandler.java` logic
- Verify `localStorage` isn't blocked
- Check frontend token handling in `Auth.jsx`

---

## ✅ Done!

Once all items are checked, your VibeSync app is ready for production deployment! 🚀
