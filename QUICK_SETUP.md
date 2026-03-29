# VibeSync Quick Setup Checklist

## Critical Issues Fixed ✅

### Frontend Updates
- [x] Added `.env.production` with proper API URL and 45-second timeout
- [x] Added `.env.development` for local development  
- [x] Updated Auth component with:
  - Loading spinner during submission
  - Error messages for connection/timeout issues
  - 45-second timeout for Render cold start handling

### Backend Configuration
- [x] SecurityConfig already supports CORS with environment variables
- [x] Health check endpoints exist (`/auth/test`, `/auth/test-db`)

---

## Required Action Items ⚠️ DO NOT SKIP

### 1. ✅ Set Environment Variables on Render

**URL**: https://dashboard.render.com → Your Backend → Environment

**Copy & Paste These:**

```
SPRING_DATASOURCE_URL=jdbc:postgresql://db.flitvcxgxlfnikkysmkj.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=Avneesh@2006
JWT_SECRET=your-secure-jwt-secret-change-this-in-production!
GITHUB_USERNAME=avneeshtripathi2006
```

**OAuth Credentials** (get from your OAuth provider dashboards):
```
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
GITHUB_CLIENT_ID=your-id
GITHUB_CLIENT_SECRET=your-secret
SPOTIFY_CLIENT_ID=your-id
SPOTIFY_CLIENT_SECRET=your-secret
```

### 2. ✅ Update OAuth Redirect URIs

**Google OAuth** (console.cloud.google.com):
- Add: `https://vibesync-zc9a.onrender.com/login/oauth2/code/google`

**GitHub OAuth** (github.com/settings/developers):
- Update: `https://vibesync-zc9a.onrender.com/login/oauth2/code/github`

**Spotify OAuth** (developer.spotify.com):
- Update: `https://vibesync-zc9a.onrender.com/login/oauth2/code/spotify`

### 3. ✅ Redeploy Backend

After setting environment variables:
1. Go to Render Dashboard
2. Select your backend service
3. Click "Redeploy" (or push to your repo if auto-deploy enabled)
4. Wait for deployment to complete

### 4. ✅ Deploy Frontend with GitHub Actions

The GitHub Actions workflow has been created (`.github/workflows/deploy-frontend.yml`).

**To enable automatic deployments:**
1. Commit the workflow file: `git add .github/workflows/deploy-frontend.yml`
2. Push to GitHub: `git push origin main`
3. Wait for action to complete (check under GitHub repo → Actions tab)
4. Frontend will be deployed to: `https://avneeshtripathi2006.github.io/VibeSync`

### 5. ✅ Optional: Set Up Keep-Alive (Recommended for Free Tier)

**To prevent Render from sleeping:**

**Option A - Use Uptime Robot (FREE, Recommended)**
1. Go to: https://uptimerobot.com (free account)
2. Create new monitor:
   - URL: `https://vibesync-zc9a.onrender.com/auth/test-db`
   - Interval: 10 minutes
3. This will ping your backend every 10 minutes to keep it awake

**Option B - Run Local Script**
- Linux/Mac: `bash keep-alive-monitor.sh`
- Windows PowerShell: `.\keep-alive-monitor.ps1`

---

## Testing Steps

### Test 1: Backend Health
```bash
# Linux/Mac
curl https://vibesync-zc9a.onrender.com/auth/test

# Windows PowerShell
Invoke-WebRequest -Uri "https://vibesync-zc9a.onrender.com/auth/test"
```

### Test 2: Database Connection
```bash
# Linux/Mac
curl https://vibesync-zc9a.onrender.com/auth/test-db

# Windows PowerShell
Invoke-WebRequest -Uri "https://vibesync-zc9a.onrender.com/auth/test-db"
```

### Test 3: Full Login Flow
1. Go to: `https://avneeshtripathi2006.github.io/VibeSync`
2. Click "Sign in"
3. Expected behavior:
   - ✅ Loading spinner appears
   - ✅ Backend responds (may take 30-60 sec on first request)
   - ✅ You're redirected to home page
   - ❌ If error: see "Troubleshooting" section

### Test 4: Run Diagnostics Script
- Linux/Mac: `bash troubleshoot.sh`
- Windows PowerShell: `.\troubleshoot.ps1`

---

## Troubleshooting

### Problem: Blank White Page After Login/Signup

**Symptom**: Form disappears but nothing happens

**Solution**:
1. Wait 30-60 seconds (backend is waking up on Render)
2. Open DevTools (F12) → Console tab
3. Should see error message or "Signing in..." state
4. If still blank after 60 seconds:
   - Run `troubleshoot.sh` or `troubleshoot.ps1`
   - Check Render logs: dashboard.render.com → Logs tab
   - Verify all environment variables are set

### Problem: "Request timeout" Error Appears

**Symptom**: After 45 seconds, get timeout error

**Reason**: Normal on first request (Render cold start)

**Solution**:
1. Try again - second request will be fast
2. Set up keep-alive monitor to prevent future cold starts
3. Consider upgrading Render plan ($7+/month)

### Problem: "Backend connection failed" Error

**Symptoms**: 
- Error appears immediately
- Network tab shows `CORS error` or `failed to fetch`

**Solution**:
1. Check if backend is really down: run `troubleshoot.sh`
2. Backend might be deploying (check Render dashboard)
3. Check browser console for detailed CORS error
4. Verify `GITHUB_USERNAME` environment variable is set on Render

### Problem: OAuth Login Goes to Blank Page

**Symptom**: Click Google/GitHub/Spotify, page redirects and goes blank

**Solution**:
1. Check if password/token saved to localStorage:
   - Open DevTools (F12)
   - Go to Application tab → LocalStorage
   - Check if `token` key exists
   - If yes: refresh page, you might be logged in
2. If not, verify OAuth credentials:
   - Go to Google/GitHub/Spotify console
   - Confirm Client ID matches in Render environment
   - Confirm redirect URI matches exactly
3. Check backend logs for OAuth errors

### Problem: CORS Error in Console

**Error**: "Access to XMLHttpRequest blocked by CORS policy"

**Solution**:
1. Verify `GITHUB_USERNAME=avneeshtripathi2006` is set on Render
2. After setting, redeploy backend
3. Wait 5-10 minutes (cached responses)
4. Try again

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `.env.production` | Frontend production config (45s timeout) |
| `.env.development` | Frontend dev config (10s timeout) |
| `frontend/src/pages/Auth.jsx` | Updated with timeout & loading UI |
| `.github/workflows/deploy-frontend.yml` | Auto-deploy to GitHub Pages |
| `DEPLOYMENT_GUIDE.md` | Comprehensive deployment guide |
| `keep-alive-monitor.sh` | Keep Render awake (Linux/Mac) |
| `keep-alive-monitor.ps1` | Keep Render awake (Windows) |
| `troubleshoot.sh` | Diagnostic script (Linux/Mac) |
| `troubleshoot.ps1` | Diagnostic script (Windows) |

---

## What to Do Right Now

1. **🔴 URGENT**: Set environment variables on Render Dashboard
2. **🔴 URGENT**: Redeploy backend after updating environment
3. **🟡 IMPORTANT**: Push code to GitHub (includes new files)
4. **🟡 IMPORTANT**: Verify GitHub Pages deployment succeeded
5. **🟢 OPTIONAL**: Set up keep-alive monitor
6. **🟢 OPTIONAL**: Run troubleshoot script to verify

---

## Performance Notes

### Why is the first login slow?
- **Render Free Tier**: Service spins down after 15 min inactivity
- **First Request**: Takes 30-60 seconds to cold start
- **Subsequent Requests**: Fast (< 1 second)
- **Solution**: Keep-alive monitor prevents cold starts

### Expected Response Times
- Local backend: < 100ms
- Remote backend (after warm start): < 500ms
- Remote backend (cold start): 30-60 seconds
- OAuth login: 5-10 seconds

---

## Support

- **Render Issues**: https://render.com/docs or contact support
- **Supabase Issues**: https://supabase.com/docs
- **React/Vite Issues**: check browser console (F12)
- **OAuth Issues**: check provider documentation

---

## Next Steps

1. ✅ Configure Render environment variables
2. ✅ Deploy backend & frontend
3. ✅ Test login flow
4. ✅ Set up keep-alive if using Render free tier
5. ⏭️ **After confirming login works:**
   - Configure vibe matching algorithm
   - Add user profile features
   - Implement WebSocket chat
   - Add music synchronization

---

**Last Updated**: March 30, 2026  
**Status**: Ready for deployment  
**Next Review**: After first successful login

