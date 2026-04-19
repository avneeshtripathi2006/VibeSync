# Local Dev Setup (Frontend + Backend + Vibe Engine + Supabase)

## 1) Backend env
Create backend/.env from backend/.env.example and fill at least:

DB_SUPABASE_JDBC_URL=jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
DB_SUPABASE_USERNAME=postgres
DB_SUPABASE_PASSWORD=YOUR_SUPABASE_DB_PASSWORD
JWT_SECRET=REPLACE_WITH_32_PLUS_CHAR_SECRET
FRONTEND_URL=http://localhost:5173
BACKEND_PUBLIC_URL=http://localhost:8080
WEBSOCKET_ORIGINS=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000

Notes:
- If DB_LOCAL_* is set and reachable, backend will prefer local Postgres first.
- Remove DB_LOCAL_* to force Supabase-only usage.

## 2) Vibe engine env
Create vibe-engine/.env from vibe-engine/.env.example and set:

PORT=8000
LOCAL_BACKEND_URL=http://localhost:8080
BACKEND_URL=

## 3) Frontend env
Create frontend/.env.local from frontend/.env.example.

Recommended values:

VITE_LOCAL_API_URL=http://localhost:8080
VITE_API_TIMEOUT=45000

## 4) Install dependencies
Terminal A:

cd backend
./mvnw -q -DskipTests compile

Terminal B:

cd frontend
npm install

Terminal C:

cd vibe-engine
python -m venv .venv
# Windows PowerShell: .\.venv\Scripts\Activate.ps1
# Git Bash: source .venv/Scripts/activate
pip install -r requirements.txt

## 5) Run all services
Terminal A (backend):

cd backend
./mvnw spring-boot:run

Terminal B (vibe-engine):

cd vibe-engine
# activate the venv first, then run the app
# Git Bash:
#   source .venv/Scripts/activate
# PowerShell:
#   .\.venv\Scripts\Activate.ps1
python main.py

If you prefer not to activate the venv in Git Bash, you can run:

./.venv/Scripts/python.exe main.py

Terminal C (frontend):

cd frontend
npm run dev

## 6) Quick health checks
- Backend: http://localhost:8080/actuator/health
- Vibe engine: http://localhost:8000/ping
- Frontend: http://localhost:5173

## 6.1) If backend fails with "password authentication failed for user postgres"

This means backend started correctly but DB credentials are wrong for the selected DB target.

Do this checklist in order:

1. Ensure backend/.env exists (not backend/.env.example).
2. If you want Supabase only, remove or comment all DB_LOCAL_* lines in backend/.env.
3. Set correct Supabase values in backend/.env:

DB_SUPABASE_JDBC_URL=jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require
DB_SUPABASE_USERNAME=postgres
DB_SUPABASE_PASSWORD=YOUR_REAL_SUPABASE_DB_PASSWORD

4. Make sure DB_SUPABASE_PASSWORD is the actual database password from Supabase project settings (not anon key/service role key/JWT secret).
5. If you recently changed DB password in Supabase, update backend/.env with the new one.
6. Restart backend after edits:

cd backend
./mvnw spring-boot:run

Optional quick isolation (run with env vars inline, bypassing .env file lookup in this shell):

DB_SUPABASE_JDBC_URL='jdbc:postgresql://db.YOUR_PROJECT_REF.supabase.co:5432/postgres?sslmode=require' DB_SUPABASE_USERNAME='postgres' DB_SUPABASE_PASSWORD='YOUR_REAL_SUPABASE_DB_PASSWORD' ./mvnw spring-boot:run

## 7) Expected behavior after recent fixes
- Identity/name/profile photo unlock only after accepted connection + 50 messages.
- Before unlock: anonymous name + system avatar, but public profile fields (bio/tags/hobbies/interests) are visible in profile modal.
- After unlock: real name and uploaded profile picture are shown across feed/chat/tribe where available.
- Match percentages use improved distance math and should no longer cluster near 90% for everyone.
