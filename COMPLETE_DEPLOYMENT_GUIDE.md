# 🚀 VibeSync Complete Deployment Guide

## 📊 Quick Overview

Your VibeSync app will be deployed on:

| Component | Platform | Cost | Status |
|-----------|----------|------|--------|
| **Backend (Java)** | Render | Free ($0) | 📋 Ready |
| **Frontend (React)** | GitHub Pages | Free ($0) | 📋 Ready |
| **Vibe-Engine (Python)** | Railway | ~$5/month | ✅ Recommended |
| **Database (PostgreSQL)** | Supabase | Free ($0) | ✅ Recommended |
| **OAuth** | Google/GitHub/Spotify | Free ($0) | ⚠️ Requires Setup |

**Total Monthly Cost: ~$5** 💰

---

## 🔴 CRITICAL: Placeholders BEFORE Deployment

### Complete List of What to Change

**1. Code - OAuth Credentials (REQUIRED)**
- [ ] Google Client ID → Get from Google Cloud Console
- [ ] Google Client Secret → Get from Google Cloud Console
- [ ] GitHub Client ID → Get from GitHub Settings
- [ ] GitHub Client Secret → Get from GitHub Settings
- [ ] Spotify Client ID → Get from Spotify Developer Dashboard
- [ ] Spotify Client Secret → Get from Spotify Developer Dashboard

**Where to put them:**
```env
backend/.env  (for local development)
Render Dashboard → Environment Variables (for production)
```

**2. Code - URLs and Domains (REQUIRED FOR PRODUCTION)**
- [ ] `FRONTEND_URL` → `https://your-github-username.github.io/VibeSync_Project`
- [ ] `GITHUB_USERNAME` → Your actual GitHub username
- [ ] `RENDER_BACKEND_DOMAIN` → `vibesync-backend.onrender.com` (or your backend name)
- [ ] `WEBSOCKET_ORIGINS` → Same as FRONTEND_URL
- [ ] Backend OAuth redirect URIs → Update in each OAuth provider dashboard
- [ ] `VITE_API_URL` (frontend .env) → `https://your-backend-name.onrender.com`

**3. Files Already Updated** ✅
- [x] `backend/.env` - Now supports environment variables
- [x] `backend/.env.example` - Shows all variables needed
- [x] `OAuth2AuthenticationSuccessHandler.java` - Now reads FRONTEND_URL
- [x] `WebSocketConfig.java` - Now reads WEBSOCKET_ORIGINS
- [x] `SecurityConfig.java` - Now reads CORS from environment

---

## 📋 Step-by-Step Deployment Process

### PHASE 1: Setup OAuth Providers (Do First!)

⏱️ **Time: 30 minutes**

Follow: [BEFORE_DEPLOYMENT_CHECKLIST.md](BEFORE_DEPLOYMENT_CHECKLIST.md)

1. **Google OAuth**
   - [ ] Create Google Cloud Project
   - [ ] Enable Google+ API
   - [ ] Create OAuth credentials
   - [ ] Get Client ID + Secret
   - [ ] Add redirect URIs

2. **GitHub OAuth**
   - [ ] Create GitHub OAuth App
   - [ ] Get Client ID + Secret
   - [ ] Add callback URLs

3. **Spotify OAuth**
   - [ ] Create Spotify App
   - [ ] Get Client ID + Secret
   - [ ] Add redirect URIs

**Files to update:**
```
backend/.env
backend/.env.example
Render environment variables (later)
```

---

### PHASE 2: Setup Database (Do Second!)

⏱️ **Time: 15 minutes**

Follow: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

1. **Create Supabase Account**
   - [ ] Sign up at Supabase.com
   - [ ] Create new project
   - [ ] Wait for initialization

2. **Get Connection Details**
   - [ ] Copy connection string
   - [ ] Save username/password
   - [ ] Note the host

3. **Test Connection Locally**
   - [ ] Update `backend/.env` with Supabase URL
   - [ ] Run `./mvnw spring-boot:run`
   - [ ] Verify tables auto-create
   - [ ] Test signup/login locally

**Files to update:**
```
backend/.env
```

---

### PHASE 3: Deploy Backend to Render (Do Third!)

⏱️ **Time: 20 minutes**

Follow: None yet - I'll guide you through this:

1. **Prepare backend**
   - [ ] Commit all changes to GitHub
   - [ ] `git add . && git commit -m "Ready for production deployment"`
   - [ ] `git push origin main`

2. **Create Render Service**
   - [ ] Go to https://dashboard.render.com/
   - [ ] New → Web Service
   - [ ] Connect GitHub repo
   - [ ] Select backend directory
   - [ ] Name: `vibesync-backend`
   - [ ] Build command: `./mvnw clean package -DskipTests`
   - [ ] Start command: `java -Xmx512M -Xms256M -jar target/backend-0.0.1-SNAPSHOT.jar`

3. **Add Environment Variables to Render**
   - [ ] SPRING_DATASOURCE_URL (from Supabase)
   - [ ] SPRING_DATASOURCE_USERNAME (postgres)
   - [ ] SPRING_DATASOURCE_PASSWORD (from Supabase)
   - [ ] JWT_SECRET (generate random 32+ char string)
   - [ ] FRONTEND_URL (your GitHub Pages URL)
   - [ ] WEBSOCKET_ORIGINS (same as FRONTEND_URL)
   - [ ] GITHUB_USERNAME (your GitHub username)
   - [ ] GOOGLE_CLIENT_ID
   - [ ] GOOGLE_CLIENT_SECRET
   - [ ] GITHUB_CLIENT_ID
   - [ ] GITHUB_CLIENT_SECRET
   - [ ] SPOTIFY_CLIENT_ID
   - [ ] SPOTIFY_CLIENT_SECRET

4. **Deploy**
   - [ ] Click "Create Web Service"
   - [ ] Wait for build (5-10 min)
   - [ ] Check logs for errors
   - [ ] Get the `.onrender.com` URL

---

### PHASE 4: Deploy Vibe-Engine to Railway (Do Fourth!)

⏱️ **Time: 15 minutes**

Follow: [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)

1. **Create Railway Project**
   - [ ] Go to https://railway.app/
   - [ ] New Project → Deploy from GitHub
   - [ ] Select VibeSync repo
   - [ ] Select vibe-engine directory

2. **Add Environment Variables**
   - [ ] BACKEND_URL = `https://your-backend-name.onrender.com`
   - [ ] FLASK_ENV = production

3. **Deploy**
   - [ ] Railway auto-deploys from GitHub
   - [ ] Check logs (should show "Uvicorn running")
   - [ ] Get public URL

---

### PHASE 5: Deploy Frontend to GitHub Pages (Do Fifth!)

⏱️ **Time: 15 minutes**

Follow: [GITHUB_PAGES_DEPLOYMENT.md](GITHUB_PAGES_DEPLOYMENT.md)

1. **Update Vite Config**
   - [ ] Edit `frontend/vite.config.js`
   - [ ] Set `base: '/VibeSync_Project/'` (match your repo name!)

2. **Create GitHub Actions Workflow**
   - [ ] Create `frontend/.github/workflows/deploy.yml`
   - [ ] Use the workflow from GITHUB_PAGES_DEPLOYMENT.md

3. **Enable GitHub Pages**
   - [ ] Repo Settings → Pages
   - [ ] Source: Deploy from branch
   - [ ] Branch: `gh-pages`

4. **Deploy**
   - [ ] Commit and push: `git add . && git commit -m "Deploy to GitHub Pages"`
   - [ ] `git push origin main`
   - [ ] GitHub Actions auto-builds and deploys
   - [ ] Wait 2 minutes
   - [ ] Visit: `https://YOUR_USERNAME.github.io/VibeSync_Project`

---

### PHASE 6: Update OAuth Provider Redirect URIs (Final!)

⏱️ **Time: 10 minutes**

Each OAuth provider needs your FINAL URLs:

**For Google Cloud Console:**
```
Authorized Redirect URIs:
- https://vibesync-backend.onrender.com/login/oauth2/code/google
```

**For GitHub Settings:**
```
Authorization Callback URL:
- https://vibesync-backend.onrender.com/login/oauth2/code/github
```

**For Spotify Developer Dashboard:**
```
Redirect URIs:
- https://vibesync-backend.onrender.com/login/oauth2/code/spotify
```

---

## ✅ Deployment Order Summary

```
1️⃣  Setup OAuth Providers (Google, GitHub, Spotify)
    ↓
2️⃣  Setup Supabase Database
    ↓
3️⃣  Deploy Backend to Render
    ↓
4️⃣  Deploy Vibe-Engine to Railway
    ↓
5️⃣  Deploy Frontend to GitHub Pages
    ↓
6️⃣  Update OAuth Redirect URIs with Final URLs
    ↓
7️⃣  TEST: Go to https://YOUR_USERNAME.github.io/VibeSync_Project
```

---

## 🧪 Testing Checklist After Deployment

- [ ] Frontend loads at `https://YOUR_USERNAME.github.io/VibeSync_Project`
- [ ] Backend API is reachable from frontend
- [ ] Sign up with email/password works
- [ ] Sign in with email/password works
- [ ] JWT token stored in localStorage
- [ ] Redirect to /home page works
- [ ] Sign in with Google works
- [ ] Sign in with GitHub works
- [ ] Sign in with Spotify works
- [ ] WebSocket connection works (real-time features)
- [ ] Can create posts
- [ ] Can see other users' profiles
- [ ] Database persist - logout and login again, data still there

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [BEFORE_DEPLOYMENT_CHECKLIST.md](BEFORE_DEPLOYMENT_CHECKLIST.md) | All placeholders + OAuth setup guide |
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | Database setup and configuration |
| [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) | Vibe-Engine deployment guide |
| [GITHUB_PAGES_DEPLOYMENT.md](GITHUB_PAGES_DEPLOYMENT.md) | Frontend GitHub Pages guide |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Cost comparison and architecture |
| [OAUTH_SETUP.md](OAUTH_SETUP.md) | OAuth provider setup (updated) |
| [QUICK_START.md](QUICK_START.md) | Quick reference for local development |

---

## 🆘 Common Issues & Solutions

### "Backend connection failed"
```
✅ Solution: Verify FRONTEND_URL env var is set in Render
✅ Solution: Check backend is running (check Render logs)
✅ Solution: Verify CORS includes your GitHub Pages URL
```

### OAuth redirect URI mismatch
```
✅ Solution: Exactly match the URI in OAuth provider settings
✅ Solution: No trailing slash differences allowed
✅ Solution: Protocol must be https:// in production
```

### Database connection refused
```
✅ Solution: Verify Supabase connection string is correct
✅ Solution: Check PASSWORD doesn't have special chars (URL encode if needed)
✅ Solution: Verify firewall isn't blocking port 5432
```

### Frontend shows blank page
```
✅ Solution: Check browser console (F12) for errors
✅ Solution: Verify VITE_API_URL is set to correct backend
✅ Solution: Check vite.config.js base matches repo name
```

### No CORS errors but still can't connect
```
✅ Solution: Check backend logs for actual error
✅ Solution: Verify all environment variables are set in Render
✅ Solution: Restart backend service in Render
```

---

## 💰 Cost Breakdown

```
Render Backend (Free)
  - 0.5 GB RAM
  - 0.5 CPU
  - Unlimited bandwidth (fair usage)
  
GitHub Pages Frontend (Free)
  - Unlimited bandwidth
  - Automatic deployments

Railway Vibe-Engine (~$5/month)
  - Python environment
  - 100 hours/month runtime ($0.0005/hour overage)
  
Supabase Database (Free)
  - 500 MB storage
  - 2 GB bandwidth/month
  
TOTAL: ~$5/month vs $0 if you skip Vibe-Engine
```

---

## 🔐 Security Checklist

- [ ] Never commit `.env` to GitHub
- [ ] OAuth secrets stored in Render environment only
- [ ] Use strong JWT secret (32+ chars, random)
- [ ] Database password is strong and random
- [ ] GitHub Pages repo is public (ok for frontend)
- [ ] Backend source code in private repo (if sensitive)
- [ ] HTTPS enabled everywhere (Render/GitHub Pages auto)
- [ ] CORS only allows your frontend domains
- [ ] Remove test/debug endpoints in production
- [ ] Enable database backups (Supabase auto)

---

## 📞 Need Help?

If you get stuck, check in order:
1. **Browser Console** (F12) - Frontend errors
2. **Render Logs** - Backend errors
3. **Railway Logs** - Vibe-Engine errors
4. **Supabase Dashboard** - Database connection test
5. **GitHub Actions** - Frontend build errors
6. Specific documentation file above

---

## ✅ You're Ready!

All the code changes have been made. Now it's just configuration and deployment. Start with PHASE 1 and follow the order above. Good luck! 🚀
