# Supabase PostgreSQL Setup Guide for VibeSync

## Why Supabase?

✅ **Free tier benefits:**
- 500 MB storage
- 2 GB bandwidth/month
- PostgreSQL database (permanent data)
- Auto-backups
- Real-time capabilities
- Authentication system (bonus)

✅ **Better than Render:**
- Data persists forever (Render deletes after 90 days)
- Simpler setup
- More generous free tier

---

## Step 1: Create Supabase Account

1. Go to [Supabase.com](https://supabase.com/)
2. Click **"Start Your Project"**
3. Sign up with **GitHub** (recommended)
4. Grant permissions

---

## Step 2: Create New Project

1. After login, go to **Dashboard**
2. Click **"New Project"**
3. Fill in:
   - **Name:** `vibesync` (or your choice)
   - **Database Password:** Create strong password (save it!)
   - **Region:** Choose closest to your location
   - **Pricing Plan:** `Free` (absolutely free)
4. Click **"Create new project"**
5. Wait 2-3 minutes for database to initialize

---

## Step 3: Get Database Connection Details

### Find Connection String

1. In Supabase Dashboard → **Settings** (gear icon)
2. Select **"Database"**
3. Scroll to section **"Connection pooling"** or **"Direct Connection"**
4. Selection: **"Connection string"** and **"URI"**
5. **Language:** PostgreSQL (default)
6. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
   ```

### Get Individual Credentials

1. Username: `postgres` (default)
2. Password: The one you created in Step 2
3. Host: `[YOUR-PROJECT-ID].supabase.co`
4. Port: `5432`
5. Database: `postgres`

---

## Step 4: Update Application Configuration

### Backend (Spring Boot)

Update `backend/.env`:
```env
SPRING_DATASOURCE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT_ID.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=YOUR_PASSWORD
```

**Replace with your actual Supabase credentials!**

### For Render Production

Set in Render Dashboard → Backend Service → Environment:
```
SPRING_DATASOURCE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_PROJECT_ID.supabase.co:5432/postgres
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=YOUR_PASSWORD
```

### Frontend

Frontend doesn't directly connect to database (all through backend API) ✅

---

## Step 5: Test Connection Locally

### Test 1: Verify Backend Can Connect

```bash
cd backend
./mvnw spring-boot:run
```

**Look for this in logs:**
```
HikariPool-1 - Starting...
HikariPool-1 - Pool initialized
```

If you see these = Database connection **SUCCESS** ✅

### Test 2: Test via API

```bash
# Start frontend
cd frontend
npm run dev

# Go to http://localhost:5173
# Try signing up with a test account
```

If signup works and you can login = Database **WORKING** ✅

### Test 3: Verify Data in Supabase

1. Go to Supabase Dashboard
2. Click **"SQL Editor"** (left sidebar)
3. Click **"New Query"**
4. Run:
   ```sql
   SELECT * FROM "user";
   ```
5. You should see your test account ✅

---

## Step 6: Initialize Database Schema

Supabase helps Spring Boot create tables automatically!

**What happens:**
1. Spring Boot starts
2. Reads `@Entity` classes (`User.java`, `VibePost.java`, etc.)
3. Checks if tables exist in Supabase
4. Auto-creates missing tables (thanks to `ddl-auto=update`)

**Verification:**

1. Supabase Dashboard → **"Table Editor"** (left sidebar)
2. Look for tables:
   - `user` (your User entity)
   - `vibe_post` (VibePost entity)
   - Other entities you defined
3. If tables exist and have rows = SUCCESS ✅

---

## Step 7: Check & Manage Data

### View Users

1. Supabase Dashboard → **Table Editor**
2. Click **`user`** table
3. See all signed-up users
4. Can manually edit/delete rows if needed

### Backup Your Data

1. Supabase Dashboard → **Settings**
2. Click **"Backups"**
3. Manual backup: Click **"Backup now"**
4. Auto-backups: Enabled by default (whew!)

---

## Step 8: Production Deployment

### When Deploying to Render Backend

1. Get Supabase connection string
2. In Render Dashboard → Backend Service
3. Add environment variables:
   ```
   SPRING_DATASOURCE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
   SPRING_DATASOURCE_USERNAME=postgres
   SPRING_DATASOURCE_PASSWORD=[PASSWORD]
   ```
4. Render auto-redeploys
5. Tables created automatically on first run ✅

---

## Cost & Limits

| Feature | Free Tier | Paid |
|---------|-----------|------|
| Storage | 500 MB | ✅ More |
| Bandwidth | 2 GB/month | ✅ More |
| Database Size | 500 MB | ✅ More |
| Rows | Unlimited | Unlimited |
| Data Retention | ✅ Forever | ✅ Forever |
| Backups | ✅ Auto | ✅ Auto |
| Cost | $0 | Starts $10/month |

**For VibeSync:** Free tier is **perfect** for MVP!

---

## Security Best Practices

1. **Never commit passwords** to GitHub
   - Use `.env` files (git-ignored)
   - Use private environment variables in Render

2. **Use strong database password**
   - Min 32 characters
   - Mix uppercase, lowercase, numbers, symbols

3. **Row Level Security (RLS)**
   - For production, enable Supabase RLS
   - Restrict user access to own data
   - Setup in Supabase Dashboard → RLS policies

4. **Rotate passwords regularly**
   - Every 90 days
   - If ever leaked, rotate immediately

---

## Troubleshooting

### Connection Refused

**Problem:** `java.sql.SQLException: Connection refused`

**Solution:**
- Check host is correct (copy from Supabase)
- Check password is correct
- Check port is 5432
- Verify no typos in connection string

### Authentication Failed

**Problem:** `FATAL: password authentication failed`

**Solution:**
- Re-check password you set in Step 2
- Make sure you used the right user: `postgres`
- Try resetting password in Supabase Settings

### Network Timeout

**Problem:** `java.io.IOException: Connection timeout`

**Solution:**
- Check internet connection
- Supabase might be down (check status.supabase.com)
- Try connecting from different network

### Free Tier Limit Exceeded

**Problem:** `ERROR: Quota exceeded`

**Solution:**
- You've hit 500 MB storage limit
- Delete unused data, or
- Upgrade to paid plan ($10/month)

### Tables Not Creating

**Problem:** Tables don't appear in Supabase Table Editor

**Solution:**
- Check backend startup logs for Hibernate messages
- Verify `spring.jpa.hibernate.ddl-auto=update` is set
- Check database user has CREATE permission
- Restart backend service

---

## Advanced: Enable RLS (Optional)

For production security:

1. Supabase Dashboard → **Authentication** → **Policies**
2. Create policy: Users can only read/write own data
3. Example:
   ```sql
   CREATE POLICY "Users can read own data"
   ON public.user
   FOR SELECT
   USING (auth.uid() = id);
   ```

---

## Quick Reference

| Task | Where |
|------|-------|
| Connection String | Settings → Database → Connection string |
| View Tables | Table Editor (left menu) |
| SQL Query | SQL Editor (left menu) |
| Manage Users | Authentication tab |
| View Logs | Settings → Logs |
| Backups | Settings → Backups |
| Region Change | Settings → General (can't change after creation) |

---

## Supabase Documentation

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Guide](https://supabase.com/docs/guides/database)
- [Connection Strings](https://supabase.com/docs/guides/database/connecting)
- [Java/Spring Integration](https://supabase.com/docs/guides/database/java)

---

## ✅ Deployment Checklist

- [ ] Supabase account created
- [ ] Project initialized
- [ ] Connection string copied
- [ ] `backend/.env` updated with credentials
- [ ] Backend started: tables created ✅
- [ ] Test signup works
- [ ] Data visible in Supabase Table Editor
- [ ] Password saved securely
- [ ] Environment variables set for Render
- [ ] Auto-backups enabled ✅

**Ready to deploy!** 🚀
