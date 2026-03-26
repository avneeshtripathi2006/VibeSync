# VibeSync - Complete Deployment & Setup Guide

> **One-Stop Guide for Setting Up & Deploying VibeSync** - A Full-Stack Music Social Media Application

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Prerequisites & Accounts](#prerequisites--accounts)
3. [Local Development Setup](#local-development-setup)
4. [Service-Specific Setup](#service-specific-setup)
   - [Supabase (Database)](#supabase-database)
   - [OAuth Setup (Google, GitHub, Spotify)](#oauth-setup)
5. [Production Deployment](#production-deployment)
   - [Backend on Render](#backend-on-render)
   - [Frontend on GitHub Pages](#frontend-on-github-pages)
   - [Vibe-Engine on Railway](#vibe-engine-on-railway)
6. [Environment Variables Reference](#environment-variables-reference)
7. [Troubleshooting](#troubleshooting)

---

## 📱 Project Overview

**VibeSync** is a full-stack music social media application with three services:

| Service | Technology | Deployment | URL |
|---------|-----------|-----------|-----|
| **Backend** | Spring Boot 4.0.3 (Java 21) | Render | `https://vibesync.onrender.com` |
| **Frontend** | React 19.2 + Vite | GitHub Pages | `https://avneeshtripathi2006.github.io/VibeSync` |
| **Vibe-Engine** | FastAPI (Python 3.11) | Railway | `https://vibesync-engine.railway.app` |
| **Database** | PostgreSQL (Supabase) | Supabase | `db.flitvcxgxlfnikkysmkj.supabase.co` |

---

## 🔐 Prerequisites & Accounts

You'll need to create accounts on these platforms:

### Required Accounts

| Platform | Purpose | Free URL |
|----------|---------|----------|
| **GitHub** | Code hosting & frontend deployment | https://github.com |
| **Supabase** | PostgreSQL database | https://supabase.com |
| **Render** | Backend deployment | https://render.com |
| **Railway** | Vibe-Engine deployment | https://railway.app |

### OAuth Providers (Optional but Recommended)

| Provider | For | URL |
|----------|-----|-----|
| **Google Cloud Console** | Google OAuth login | https://console.cloud.google.com/ |
| **GitHub Developer Settings** | GitHub OAuth login | https://github.com/settings/developers |
| **Spotify Developer Dashboard** | Spotify OAuth login | https://developer.spotify.com/dashboard |

---

## 🏗️ Local Development Setup

### Step 1: Prerequisites

**Minimum Requirements:**
- Java 21+
- Node.js 18+
- Python 3.11+
- Git
- PostgreSQL 13+ (for local testing)

### Step 2: Clone Repository

```bash
git clone https://github.com/avneeshtripathi2006/VibeSync.git
cd VibeSync
```

### Step 3: Set Up Backend

```bash
cd backend

# Create .env file
cat > .env << EOF
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/vibesync_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=Avneesh@2006
JWT_SECRET=vibesync-local-secret-at-least-32-characters-minimum
EOF

# Build and run
mvnw spring-boot:run
```

**Verify:** http://localhost:8080/actuator/health → `{"status":"UP"}`

### Step 4: Set Up Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env.local
cat > .env.local << EOF
VITE_API_URL=http://localhost:8080
EOF

# Start dev server
npm run dev
```

**Verify:** http://localhost:5173 → App loads successfully

### Step 5: Set Up Vibe-Engine

```bash
cd vibe-engine

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env
cat > .env << EOF
BACKEND_URL=http://localhost:8080
FLASK_ENV=development
PORT=8000
EOF

# Run
python main.py
```

**Verify:** http://localhost:8000/ping → `{"status":"ok","mode":"engine"}`

---

## 🔧 Service-Specific Setup

### Supabase (Database)

#### Step 1: Create Supabase Account

1. Go to https://supabase.com/
2. Click **"Start Your Project"**
3. Sign in with **GitHub**
4. Grant necessary permissions

#### Step 2: Create New Project

1. Click **"New Project"** in Dashboard
2. Fill in:
   - **Name:** `vibesync`
   - **Database Password:** Create a strong one (Example: `Avneesh@2006`)
   - **Region:** Closest to your location
   - **Pricing:** Free (absolutely free)
3. Click **"Create new project"** and wait 2-3 minutes

#### Step 3: Get Connection Details

1. Go to **Settings** → **Database**
2. Under **Connection string**, select **PostgreSQL (URI)**
3. Copy the connection string:
   ```
   postgresql://postgres:[PASSWORD]@db.flitvcxgxlfnikkysmkj.supabase.co:5432/postgres
   ```

#### Step 4: Verify Credentials

Your Supabase connection details:
- **Host:** `db.flitvcxgxlfnikkysmkj.supabase.co`
- **Port:** `5432`
- **Database:** `postgres`
- **Username:** `postgres`
- **Password:** `Avneesh@2006` (from Step 2)

**For Spring Boot (JDBC format):**
```
SPRING_DATASOURCE_URL=jdbc:postgresql://db.flitvcxgxlfnikkysmkj.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=Avneesh@2006
```

---

### OAuth Setup

#### Google OAuth Setup

**Step 1: Create Google Cloud Project**

1. Go to https://console.cloud.google.com/
2. Create a new project (or use existing)
3. Enable the **Google+ API**

**Step 2: Create OAuth 2.0 Credentials**

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. Choose **Web application**
4. Add **Authorized redirect URIs:**
   - Development: `http://localhost:8080/login/oauth2/code/google`
   - Production: `https://vibesync.onrender.com/login/oauth2/code/google`
5. Click **Create** and copy:
   - **Client ID**
   - **Client Secret**

**Step 3: Update Application**

Set these environment variables:
```env
GOOGLE_CLIENT_ID=your-client-id-here
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_OAUTH_REDIRECT_URI=https://vibesync.onrender.com/login/oauth2/code/google
```

---

#### GitHub OAuth Setup

**Step 1: Create GitHub OAuth App**

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** VibeSync
   - **Homepage URL:** 
     - Dev: `http://localhost:5173`
     - Prod: `https://avneeshtripathi2006.github.io/VibeSync`
   - **Authorization callback URL:**
     - Dev: `http://localhost:8080/login/oauth2/code/github`
     - Prod: `https://vibesync.onrender.com/login/oauth2/code/github`
4. Click **Register application** and copy:
   - **Client ID**
   - **Client Secret**

**Step 2: Update Application**

Set these environment variables:
```env
GITHUB_CLIENT_ID=your-client-id-here
GITHUB_CLIENT_SECRET=your-client-secret-here
GITHUB_OAUTH_REDIRECT_URI=https://vibesync.onrender.com/login/oauth2/code/github
```

---

#### Spotify OAuth Setup

**Step 1: Create Spotify App**

1. Go to https://developer.spotify.com/dashboard
2. Click **Create an App**
3. Accept terms and create
4. Fill in:
   - **App name:** VibeSync
   - **App description:** Social media for music lovers
5. Accept terms and create
6. Go to **Edit Settings**
7. Add **Redirect URIs:**
   - Dev: `http://localhost:8080/login/oauth2/code/spotify`
   - Prod: `https://vibesync.onrender.com/login/oauth2/code/spotify`
8. Click **Save** and copy:
   - **Client ID**
   - **Client Secret**

**Step 2: Update Application**

Set these environment variables:
```env
SPOTIFY_CLIENT_ID=your-client-id-here
SPOTIFY_CLIENT_SECRET=your-client-secret-here
SPOTIFY_OAUTH_REDIRECT_URI=https://vibesync.onrender.com/login/oauth2/code/spotify
```

---

## 🚀 Production Deployment

### Backend on Render

#### Step 1: Create Render Account & Connect GitHub

1. Go to https://render.com/
2. Click **"Get Started"**
3. Sign in with **GitHub**
4. Grant all permissions

#### Step 2: Deploy Backend

1. Click **"New +"** → **"Web Service"**
2. Select your **VibeSync** repository
3. Configure:
   - **Name:** `VibeSync`
   - **Environment:** Docker
   - **Region:** Your closest region
   - **Plan:** Free (limited resources, no auto-sleep is paid)
4. Click **"Create Web Service"**
5. Wait for build to complete (~5 minutes)

#### Step 3: Set Environment Variables ⚠️ CRITICAL

**This is why your backend is failing!** Environment variables MUST be set.

1. Go to your VibeSync service on Render
2. Click **Settings**
3. Scroll to **Environment** section
4. Add these variables (one by one):

**Database (Required):**
```
SPRING_DATASOURCE_URL=jdbc:postgresql://db.flitvcxgxlfnikkysmkj.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=Avneesh@2006
JWT_SECRET=vibesync-render-secret-at-least-32-characters-minimum
```

**Google OAuth (If configured):**
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_OAUTH_REDIRECT_URI=https://vibesync.onrender.com/login/oauth2/code/google
```

**GitHub OAuth (If configured):**
```
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_OAUTH_REDIRECT_URI=https://vibesync.onrender.com/login/oauth2/code/github
```

**Spotify OAuth (If configured):**
```
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret
SPOTIFY_OAUTH_REDIRECT_URI=https://vibesync.onrender.com/login/oauth2/code/spotify
```

5. Click **"Save Changes"**
6. Render auto-redeploys with new environment variables

**Verify:** Check logs for successful database connection and `Started Application` message

---

### Frontend on GitHub Pages

#### Step 1: Verify GitHub Pages Configuration

Check `frontend/package.json`:
```json
{
  "homepage": "https://avneeshtripathi2006.github.io/VibeSync",
  "scripts": {
    "deploy": "npx gh-pages -d dist"
  }
}
```

Check `frontend/vite.config.js`:
```javascript
export default {
  base: '/VibeSync/',
  // ... rest of config
}
```

#### Step 2: Deploy Frontend

```bash
cd frontend

# Push built files to gh-pages branch
npm run deploy
```

#### Step 3: Enable GitHub Pages

1. Go to your GitHub repository
2. Settings → **Pages**
3. Source: Select `gh-pages` branch
4. Click **Save**
5. Wait 1-2 minutes

**Verify:** Visit `https://avneeshtripathi2006.github.io/VibeSync`

---

### Vibe-Engine on Railway

#### Step 1: Create Railway Account

1. Go to https://railway.app/
2. Click **"Start Project"**
3. Sign in with **GitHub**
4. Grant permissions

#### Step 2: Deploy Vibe-Engine

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Select your **VibeSync** repository
4. Railway auto-detects Dockerfile for vibe-engine

#### Step 3: Configure Environment Variables

1. Click your vibe-engine service
2. Go to **Variables** tab
3. Add:

```
BACKEND_URL=https://vibesync.onrender.com
FLASK_ENV=production
PORT=8000
```

#### Step 4: Deploy

Railway auto-deploys when you push to main.

**Verify:** Check Railway logs for successful startup

---

## 📝 Environment Variables Reference

### Local Development `.env`

**Backend** (`backend/.env`):
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/vibesync_db
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=Avneesh@2006
JWT_SECRET=vibesync-local-secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

**Frontend** (`frontend/.env.local`):
```env
VITE_API_URL=http://localhost:8080
```

**Vibe-Engine** (`vibe-engine/.env`):
```env
BACKEND_URL=http://localhost:8080
FLASK_ENV=development
PORT=8000
```

### Production Environment Variables

**Render Backend:**
- All environment variables from "Backend on Render" → "Step 3"

**GitHub Pages:**
- None required (static hosting)
- Update `VITE_API_URL` in frontend build: `https://vibesync.onrender.com`

**Railway Vibe-Engine:**
- `BACKEND_URL=https://vibesync.onrender.com`
- `FLASK_ENV=production`
- `PORT=8000`

---

## 🔍 Troubleshooting

### Issue: Backend "Network is unreachable" Error

**Cause:** Environment variables not set on Render

**Solution:**
1. Go to Render Dashboard → VibeSync service
2. Click **Settings**
3. Scroll to **Environment**
4. Add ALL database environment variables (see "Backend on Render" → "Step 3")
5. Click **Save Changes**
6. Wait for auto-redeploy

---

### Issue: Frontend Shows White Screen

**Cause:** Incorrect `base` path or homepage URL

**Solution:**
1. Verify `frontend/vite.config.js` has: `base: '/VibeSync/'`
2. Verify `frontend/package.json` has: `"homepage": "https://avneeshtripathi2006.github.io/VibeSync"`
3. Redeploy: `npm run deploy`

---

### Issue: OAuth Login Fails

**Cause:** Redirect URIs don't match in OAuth provider settings

**Solution:**
1. Go to OAuth provider (Google/GitHub/Spotify)
2. Update redirect URIs to match exactly:
   - Local: `http://localhost:8080/login/oauth2/code/{provider}`
   - Production: `https://vibesync.onrender.com/login/oauth2/code/{provider}`
3. Copy new Client ID and Secret
4. Update environment variables on Render
5. Trigger redeploy

---

### Issue: Database Connection Timeout

**Cause:** Supabase host is blocked or credentials are wrong

**Solution:**
1. Verify credentials:
   - Host: `db.flitvcxgxlfnikkysmkj.supabase.co`
   - Username: `postgres`
   - Password: `Avneesh@2006`
2. Test locally: `psql postgresql://postgres:Avneesh@2006@db.flitvcxgxlfnikkysmkj.supabase.co:5432/postgres`
3. Check Supabase dashboard for database status
4. Restart Render deployment

---

### Issue: Vibe-Engine Connection Fails

**Cause:** Backend URL not set correctly in Railway

**Solution:**
1. Go to Railway dashboard → vibe-engine service
2. Click **Variables**
3. Verify: `BACKEND_URL=https://vibesync.onrender.com`
4. Wait for auto-redeploy

---

## ✅ Deployment Checklist

- [ ] All three accounts created (Render, Railway, Supabase)
- [ ] Supabase project created with database initialized
- [ ] Backend environment variables set on Render (CRITICAL!)
- [ ] OAuth credentials created (Google, GitHub, Spotify)
- [ ] OAuth redirect URIs updated in each provider
- [ ] Frontend deployed to GitHub Pages
- [ ] Vibe-Engine deployed to Railway
- [ ] Backend logs show successful database connection
- [ ] Frontend loads at GitHub Pages URL
- [ ] OAuth buttons appear and redirect correctly
- [ ] Full end-to-end user registration/login flow works

---

## 🎯 Quick Reference: Actual Service URLs

| Service | URL | Status |
|---------|-----|--------|
| **Backend** | `https://vibesync.onrender.com` | ⏳ Waiting for env vars |
| **Frontend** | `https://avneeshtripathi2006.github.io/VibeSync` | ✅ Deployed |
| **Vibe-Engine** | Railway auto-generated URL | ⏳ Check Railway dashboard |
| **Database** | `db.flitvcxgxlfnikkysmkj.supabase.co` | ✅ Ready |

---

## 📧 Support & Next Steps

1. **Environment Variables MUST Be Set** - If backend still fails, double-check Render environment variables
2. **Test Backend Health** - Visit: `https://vibesync.onrender.com/actuator/health`
3. **Test Frontend** - Visit: `https://avneeshtripathi2006.github.io/VibeSync`
4. **Test OAuth** - Click OAuth buttons to verify redirect URIs work

