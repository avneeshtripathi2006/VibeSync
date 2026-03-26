# GitHub Pages Deployment Guide for VibeSync Frontend

## BEFORE Deployment:

### Step 1: Update Vite Configuration for GitHub Pages

Edit `frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/VibeSync_Project/',  // ← IMPORTANT: Match your repo name
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
  }
})
```

### Step 2: Update Backend API URL for Production

Create `frontend/.env.production.local`:

```
VITE_API_URL=https://vibesync-backend.onrender.com
```

Alternative: If using GitHub Environment Variables, set in Settings > Actions > Variables

### Step 3: Build and Test Locally

```bash
cd frontend
npm run build
npm run preview
```

Visit `http://localhost:4173` and test the app


## GitHub Actions Setup for Auto-Deploy:

### Step 1: Enable GitHub Pages

1. Go to your GitHub repo
2. Settings → Pages
3. Source: Deploy from a branch
4. Branch: `gh-pages`
5. Folder: `/(root)`
6. Save

### Step 2: Create GitHub Actions Workflow

Create `frontend/.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main
      - master
  pull_request:
    branches:
      - main
      - master

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: 'frontend/package-lock.json'
      
      - name: Install Dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Build Project
        working-directory: ./frontend
        env:
          VITE_API_URL: https://vibesync-backend.onrender.com
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./frontend/dist
```

### Step 3: Push to GitHub

```bash
git add .
git commit -m "Add GitHub Pages deployment config"
git push origin main
```

GitHub Actions will automatically:
1. Build your frontend
2. Deploy to `gh-pages` branch
3. Make it live at `https://YOUR_USERNAME.github.io/VibeSync_Project`


## Manual Deployment (If GitHub Actions fails):

```bash
cd frontend

# Build
npm run build

# Deploy to gh-pages manually
npm install -g gh-pages
gh-pages -d dist
```

Then go to: `https://YOUR_USERNAME.github.io/VibeSync_Project`


## Troubleshooting

### Assets show 404
- Check `base` in `vite.config.js` matches repo name exactly
- Rebuild: `npm run build`

### App shows blank page
- Check `VITE_API_URL` environment variable
- Verify backend is running and accessible
- Open browser console for errors (F12)

### GitHub Pages not updating
- Check GitHub Actions tab in repo
- Verify `gh-pages` branch exists
- Re-run workflow if it failed

### API calls failing with CORS error
- Verify backend CORS includes GitHub Pages URL
- Check backend env variable `FRONTEND_URL` is set correctly
- Restart backend service


## Production URLs

Your app will be available at:
```
https://YOUR_USERNAME.github.io/VibeSync_Project
```

Update backend OAuth redirect URIs to match this URL!
