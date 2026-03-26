# Railway.app Deployment Guide for VibeSync Vibe-Engine

## Why Railway for Vibe-Engine?

- **Cost:** $5/month free credit covers everything
- **Python Support:** Excellent FastAPI support
- **No Harsh Limits:** Unlike Render's 30-day/month constraint
- **Auto-Deploy:** Deploys from GitHub automatically
- **Dashboard:** Nice UI for managing services

---

## Step 1: Create Railway Account

1. Go to [Railway.app](https://railway.app/)
2. Click **"Start Project"**
3. Sign in with **GitHub** (easiest)
4. Grant permissions

---

## Step 2: Update Vibe-Engine for Production

### File: `vibe-engine/main.py`

**Current:**
```python
DEFAULT_REMOTE_BACKEND = os.getenv("BACKEND_URL", "https://vibesync-zc9a.onrender.com")
```

**Update to:**
```python
DEFAULT_REMOTE_BACKEND = os.getenv("BACKEND_URL", "https://vibesync-backend.onrender.com")
```

---

## Step 3: Create Environment Configuration

### File: `vibe-engine/.env.production`

```env
# Production environment for vibe-engine
BACKEND_URL=https://vibesync-backend.onrender.com
FLASK_ENV=production
PORT=8000
```

---

## Step 4: Create Dockerfile (Already needed for Railway)

### File: `vibe-engine/Dockerfile`

Already exists in your project (good!)

**Check it has:**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

---

## Step 5: Update requirements.txt

### File: `vibe-engine/requirements.txt`

Should include:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
sentence-transformers==2.2.2
httpx==0.25.1
requests==2.31.0
```

---

## Step 6: Create railway.toml

### File: `vibe-engine/railway.toml`

```toml
[build]
builder = "dockerfile"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "python main.py"
healthcheckPath = "/ping"
healthcheckTimeout = 200
```

---

## Step 7: Deploy to Railway

### Option A: Via Web Dashboard (Recommended)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your VibeSync repo
5. Select **`vibe-engine`** directory
6. Click **"Deploy"**

### Option B: Via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy from vibe-engine folder
cd vibe-engine
railway up
```

---

## Step 8: Configure Environment Variables

After deployment:

1. Go to Railway Dashboard
2. Click your **vibe-engine** service
3. Go to **"Variables"** tab
4. Add:
   ```
   BACKEND_URL = https://vibesync-backend.onrender.com
   FLASK_ENV = production
   PORT = 8000
   ```
5. Click **"Save"** → Auto-redeploys ✅

---

## Step 9: Get Your Service URL

1. In Railway Dashboard → vibe-engine service
2. Look for **"PUBLIC URL"** (e.g., `https://vibesync-vibe-engine-production.railway.app`)
3. This is your vibe-engine endpoint

### Update Backend to Use It

Add to Render backend environment variables:
```
VIBE_ENGINE_URL=https://vibesync-vibe-engine-production.railway.app
```

---

## Step 10: Verify Deployment

```bash
# Test the endpoint
curl https://vibesync-vibe-engine-production.railway.app/ping

# Expected response:
# {"status":"ok"}
```

---

## Logs & Debugging

### View Logs in Railway Dashboard

1. Go to vibe-engine service
2. Click **"Logs"** tab
3. Watch real-time logs

### Common Issues

| Issue | Solution |
|-------|----------|
| Pod won't start | Check logs, verify Dockerfile correct |
| 502 Bad Gateway | Backend not responding, check `BACKEND_URL` |
| Out of memory | Railway free tier has limit, optimize code |
| Deployment fails | Verify `requirements.txt` has all dependencies |

---

## Cost Breakdown

**Railway Free Tier:**
- $5/month credit
- Unlimited project count
- Generous compute time

**What $5 covers:**
- 1 vibe-engine service (always running) = ~$3-4/month
- 1 PostgreSQL database (small) = ~$1-2/month
- Total: ~$5/month exactly

---

## What NOT to Deploy on Railway

❌ **DON'T put these on Railway:**
- Backend (use Render instead - better for Java)
- Frontend (use GitHub Pages - free)
- PostgreSQL (use Supabase or Railway's managed DB only if needed)

✅ **DO put on Railway:**
- Vibe-Engine (Python/FastAPI)
- WebSocket services
- Scheduled tasks/Cron jobs
- ML inference services

---

## Next Steps

1. Verify vibe-engine deployed successfully
2. Test API endpoints are accessible
3. Update backend to call vibe-engine endpoints
4. Monitor usage in Railway Dashboard
5. Scale if needed (paid tier available)

---

## Railway Documentation

- [Railway.app Docs](https://docs.railway.app/)
- [Python Deployment](https://docs.railway.app/guides/python)
- [Docker Deployment](https://docs.railway.app/guides/dockerfiles)
- [Environment Variables](https://docs.railway.app/develop/variables)

---

## Quick Troubleshooting Checklist

- [ ] GitHub repo connected to Railway
- [ ] `vibe-engine` directory selected
- [ ] Dockerfile exists and is correct
- [ ] `requirements.txt` has all dependencies
- [ ] Environment variables set (`BACKEND_URL`, etc.)
- [ ] Service deployed and logs show no errors
- [ ] Public URL is accessible
- [ ] `/ping` endpoint returns `{"status":"ok"}`
- [ ] Backend can reach vibe-engine endpoint
