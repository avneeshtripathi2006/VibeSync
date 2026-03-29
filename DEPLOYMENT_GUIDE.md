# VibeSync Deployment & Troubleshooting Guide

## Current Issues & Status

### ❌ Problems You're Experiencing
1. **Blank white page after login/signup** - Backend taking too long to respond
2. **Backend endpoint keeps loading** - Render's free tier cold start issue
3. **CORS errors** - Frontend origin not whitelisted

### ✅ Root Cause
**Render Free Tier Cold Start**: Your backend on Render's free plan spins down after 15 minutes of inactivity. When you try to login/signup:
- The first request wakes up the backend
- Takes 30-60+ seconds to start
- Frontend shows blank page (no loading indicator)
- Sometimes times out before backend wakes up

---

## Quick Fixes Applied ✨

### 1. **Frontend Updates** 
✅ Added `.env.production` with 45-second timeout for production
✅ Added `.env.development` for local development  
✅ Updated Auth page with:
   - Loading spinner while submitting
   - Error messages for timeout/connection issues
   - 45-second timeout for Render cold start

### 2. **Backend Configuration**
✅ SecurityConfig already configured with environment variables for CORS
✅ Ready to accept GitHub Pages origin (needs GITHUB_USERNAME env var)

---

## Required Actions - Render Dashboard Setup

**Go to: https://dashboard.render.com > Your Backend Service > Environment**

### Step 1: Add Required Environment Variables

```
DATABASE CONNECTION:
├── SPRING_DATASOURCE_URL = jdbc:postgresql://db.flitvcxgxlfnikkysmkj.supabase.co:5432/postgres
├── SPRING_DATASOURCE_USERNAME = postgres
└── SPRING_DATASOURCE_PASSWORD = Avneesh@2006

JWT & SECURITY:
├── JWT_SECRET = your-secure-jwt-secret-here (change this!)
└── GITHUB_USERNAME = avneeshtripathi2006

OAUTH (Copy from your OAuth app credentials):
├── GOOGLE_CLIENT_ID = your-google-oauth-client-id
├── GOOGLE_CLIENT_SECRET = your-google-oauth-client-secret
├── GITHUB_CLIENT_ID = your-github-oauth-client-id
├── GITHUB_CLIENT_SECRET = your-github-oauth-client-secret
├── SPOTIFY_CLIENT_ID = your-spotify-oauth-client-id
└── SPOTIFY_CLIENT_SECRET = your-spotify-oauth-client-secret
```

### Step 2: Verify Redirect URIs in OAuth Apps

**Google OAuth** (console.cloud.google.com):
- Add authorized redirect URI: `https://vibesync-zc9a.onrender.com/login/oauth2/code/google`

**GitHub OAuth** (github.com/settings/developers):
- Authorization callback URL: `https://vibesync-zc9a.onrender.com/login/oauth2/code/github`

**Spotify OAuth** (developer.spotify.com):
- Redirect URI: `https://vibesync-zc9a.onrender.com/login/oauth2/code/spotify`

---

## GitHub Pages Frontend Deployment

### Option A: Using GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd frontend && npm ci
      
      - name: Build
        run: cd frontend && npm run build
        env:
          VITE_API_URL: https://vibesync-zc9a.onrender.com
          VITE_API_TIMEOUT: 45000
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

### Option B: Manual Deployment

```bash
cd frontend
echo "VITE_API_URL=https://vibesync-zc9a.onrender.com" > .env.production
echo "VITE_API_TIMEOUT=45000" >> .env.production
npm run build
npm run deploy
```

---

## How to Keep Render Awake (Prevent Cold Starts)

### Option 1: Add Keep-Alive Endpoint (Recommended for Free Tier)

Backend: Add a scheduled task in `Application.java`:

```java
@Scheduled(fixedRate = 900000) // Every 15 minutes (900000 ms)
public void keepAlive() {
    // This prevents Render from spinning down
    System.out.println("Keep-alive ping: " + LocalDateTime.now());
}
```

Or add to `TestController.java`:
```java
@GetMapping("/keep-alive")
public String keepAlive() {
    return "Backend is alive ✅";
}
```

Then use an external service like **Uptime Robot** (free, uptimerobot.com):
- Set up a monitor for: `https://vibesync-zc9a.onrender.com/
api/test-db`
- Check every 10 minutes
- This will ping your backend and keep it awake

### Option 2: Upgrade Render Plan

- **Free Tier**: Spins down after 15 min inactivity ❌
- **Standard Plan ($7/month)**: Always running ✅
- **Pro Plan ($12+/month)**: With more features

---

## Testing Checklist

### 1. Test Backend Connection
```bash
# Check if backend is working
curl https://vibesync-zc9a.onrender.com/auth/test

# Expected response: "Backend is working! ✅"
```

### 2. Test Database Connection  
```bash
curl https://vibesync-zc9a.onrender.com/auth/test-db

# Expected response: "Database connected! ✅ Total users: N"
```

### 3. Test Login Flow (Manual)
1. Go to: https://avneeshtripathi2006.github.io/VibeSync
2. Click "Sign in"
3. You should see:
   - ✅ Loading spinner while submitting
   - ✅ Response within 45 seconds (or error message)
   - ✅ Redirect to home if successful

### 4. Check Browser Console for Errors
- Open DevTools (F12)
- Go to Console tab
- Try login again
- Look for CORS errors, timeout errors, or connection issues

---

## Common Issues & Solutions

### Issue: "Backend connection failed" Error
**Solution**: 
1. Check if backend URL is correct: `https://vibesync-zc9a.onrender.com`
2. Test with curl command above
3. Backend might be waking up - try again in 30 seconds

### Issue: "Request timeout" Error
**Solution**:
1. Render is cold starting - this is normal on first request
2. Try again in 30-60 seconds
3. Consider upgrading Render plan or setting up keep-alive

### Issue: CORS Error in Console
**Solution**:
1. Verify `GITHUB_USERNAME=avneeshtripathi2006` is set on Render
2. Verify frontend URL matches: `https://avneeshtripathi2006.github.io`
3. Wait 5-10 minutes after environment variable change

### Issue: OAuth Login Redirects to Blank Page
**Solution**:
1. Check if redirect URI is correct in OAuth app settings
2. Verify OAuth credentials are set on Render Dashboard
3. Check backend logs for OAuth errors

---

## Monitoring & Debugging

### View Render Logs
1. Go to: https://dashboard.render.com > Select Backend > Logs
2. Look for:
   - Cold start messages
   - Database connection errors
   - OAuth failures

### View Railway Logs (Vibe Engine)
1. Go to: https://railway.app > Select project > Vibe Engine
2. Check for Python errors

### Test Database Directly
Use Supabase dashboard: https://app.supabase.com
- Query test data
- Verify tables exist
- Check user records after signup

---

## Next Steps

1. **✅ Add all environment variables** to Render Dashboard
2. **✅ Redeploy** backend after adding env vars
3. **✅ Set up GitHub Actions** for automated frontend deployment
4. **✅ Configure OAuth** redirect URIs in provider dashboards
5. **✅ Set up Uptime Robot** keep-alive (free tier)
6. **Test login flow** and verify everything works

---

## Support Resources

- **Render Docs**: https://render.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Spring Security OAuth2**: https://spring.io/projects/spring-security-oauth2
- **GitHub Pages Docs**: https://pages.github.com

