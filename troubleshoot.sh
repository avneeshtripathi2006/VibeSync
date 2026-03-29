#!/bin/bash

# VibeSync Deployment Troubleshooting Script
# Tests all components: Frontend, Backend, Database, OAuth

BACKEND_URL="https://vibesync-zc9a.onrender.com"
FRONTEND_URL="https://avneeshtripathi2006.github.io/VibeSync"
DB_TYPE="Supabase PostgreSQL"

echo "================================"
echo "VibeSync Troubleshooting Script"
echo "================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}
    
    echo -e "${CYAN}Testing: $name${NC}"
    echo "URL: $url"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" -m 10 "$url")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "$expected_code" ]; then
        echo -e "${GREEN}✅ PASS${NC} - HTTP $HTTP_CODE"
        echo "Response: $BODY"
    else
        echo -e "${RED}❌ FAIL${NC} - Expected $expected_code, got $HTTP_CODE"
        echo "Response: $BODY"
    fi
    echo ""
}

# Test Backend
echo -e "${CYAN}========== BACKEND TESTS ==========${NC}"
echo ""

test_endpoint "Backend Health Check" "$BACKEND_URL/auth/test"
test_endpoint "Database Connection" "$BACKEND_URL/auth/test-db"

# Test Database (via curl to backend)
echo -e "${CYAN}========== DATABASE TESTS ==========${NC}"
echo ""

echo -e "${YELLOW}Note: These tests require backend to be running${NC}"
echo "Database Type: $DB_TYPE"
echo ""

# Test Frontend
echo -e "${CYAN}========== FRONTEND TESTS ==========${NC}"
echo ""

test_endpoint "Frontend URL" "$FRONTEND_URL" "200"

# Check for common issues
echo -e "${CYAN}========== DIAGNOSTICS ==========${NC}"
echo ""

echo "1. Backend Status:"
if curl -s -m 5 "$BACKEND_URL/auth/test" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is reachable${NC}"
else
    echo -e "${RED}❌ Backend is NOT reachable${NC}"
    echo "   Possible causes:"
    echo "   - Render backend is spinning down (takes 30-60 seconds to wake)"
    echo "   - Network connectivity issue"
    echo "   - Render service crashed"
fi
echo ""

echo "2. Frontend Status:"
if curl -s -m 5 -L "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is reachable${NC}"
else
    echo -e "${RED}❌ Frontend is NOT reachable${NC}"
    echo "   Possible causes:"
    echo "   - GitHub Pages is down (unlikely)"
    echo "   - Network connectivity issue"
    echo "   - Repository is private"
fi
echo ""

echo "3. Environment Variables Check:"
echo "   Please verify on Render Dashboard that these are set:"
echo "   - SPRING_DATASOURCE_URL"
echo "   - SPRING_DATASOURCE_USERNAME"
echo "   - SPRING_DATASOURCE_PASSWORD"
echo "   - JWT_SECRET"
echo "   - GITHUB_USERNAME"
echo "   - All OAuth credentials (GOOGLE, GITHUB, SPOTIFY)"
echo ""

echo "4. Common Issues:"
echo "   a) Blank white page after login:"
echo "      └─ Frontend is waiting for backend response (check timeout)"
echo ""
echo "   b) 'Backend connection failed':"
echo "      └─ Check if backend is running at: $BACKEND_URL"
echo ""
echo "   c) CORS error in browser console:"
echo "      └─ Frontend origin not whitelisted (check CORS config)"
echo ""
echo "   d) OAuth login redirects to blank page:"
echo "      └─ Verify redirect URIs in OAuth provider settings"
echo ""

echo "5. Next Steps:"
echo "   1. If backend is not reachable, wait 30-60 seconds and try again"
echo "   2. Run this script again to confirm all services are up"
echo "   3. Check browser DevTools (F12) for detailed error messages"
echo "   4. View Render logs: dashboard.render.com"
echo ""

echo "================================"
echo "Tests Complete!"
echo "================================"
