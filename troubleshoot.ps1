# VibeSync Deployment Troubleshooting Script (PowerShell)
# Tests all components: Frontend, Backend, Database, OAuth

$BackendUrl = "https://vibesync-zc9a.onrender.com"
$FrontendUrl = "https://avneeshtripathi2006.github.io/VibeSync"
$DbType = "Supabase PostgreSQL"

Write-Host "================================" -ForegroundColor Cyan
Write-Host "VibeSync Troubleshooting Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test function
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedCode = 200
    )
    
    Write-Host "Testing: $Name" -ForegroundColor Cyan
    Write-Host "URL: $Url"
    
    try {
        $Response = Invoke-WebRequest -Uri $Url -Method Get -TimeoutSec 10 -ErrorAction Stop
        $HttpCode = $Response.StatusCode
        $Body = $Response.Content
        
        if ($HttpCode -eq $ExpectedCode) {
            Write-Host "✅ PASS - HTTP $HttpCode" -ForegroundColor Green
            Write-Host "Response: $Body"
        } else {
            Write-Host "⚠️  HTTP Code: $HttpCode (Expected $ExpectedCode)" -ForegroundColor Yellow
            Write-Host "Response: $Body"
        }
    }
    catch {
        Write-Host "❌ FAIL - Error: $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Backend Tests
Write-Host "========== BACKEND TESTS ==========" -ForegroundColor Cyan
Write-Host ""
Test-Endpoint "Backend Health Check" "$BackendUrl/auth/test"
Test-Endpoint "Database Connection" "$BackendUrl/auth/test-db"

# Database Tests
Write-Host "========== DATABASE TESTS ==========" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: These tests require backend to be running" -ForegroundColor Yellow
Write-Host "Database Type: $DbType"
Write-Host ""

# Frontend Tests
Write-Host "========== FRONTEND TESTS ==========" -ForegroundColor Cyan
Write-Host ""
Test-Endpoint "Frontend URL" $FrontendUrl 200

# Diagnostics
Write-Host "========== DIAGNOSTICS ==========" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Backend Status:" -ForegroundColor Cyan
try {
    $null = Invoke-WebRequest -Uri "$BackendUrl/auth/test" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Backend is reachable" -ForegroundColor Green
}
catch {
    Write-Host "❌ Backend is NOT reachable" -ForegroundColor Red
    Write-Host "   Possible causes:" -ForegroundColor Yellow
    Write-Host "   - Render backend is spinning down (takes 30-60 seconds to wake)" -ForegroundColor Yellow
    Write-Host "   - Network connectivity issue" -ForegroundColor Yellow
    Write-Host "   - Render service crashed" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "2. Frontend Status:" -ForegroundColor Cyan
try {
    $null = Invoke-WebRequest -Uri $FrontendUrl -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Frontend is reachable" -ForegroundColor Green
}
catch {
    Write-Host "❌ Frontend is NOT reachable" -ForegroundColor Red
    Write-Host "   Possible causes:" -ForegroundColor Yellow
    Write-Host "   - GitHub Pages is down (unlikely)" -ForegroundColor Yellow
    Write-Host "   - Network connectivity issue" -ForegroundColor Yellow
    Write-Host "   - Repository is private" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "3. Environment Variables Check:" -ForegroundColor Cyan
Write-Host "   Please verify on Render Dashboard that these are set:" -ForegroundColor Yellow
Write-Host "   - SPRING_DATASOURCE_URL" -ForegroundColor Yellow
Write-Host "   - SPRING_DATASOURCE_USERNAME" -ForegroundColor Yellow
Write-Host "   - SPRING_DATASOURCE_PASSWORD" -ForegroundColor Yellow
Write-Host "   - JWT_SECRET" -ForegroundColor Yellow
Write-Host "   - GITHUB_USERNAME" -ForegroundColor Yellow
Write-Host "   - All OAuth credentials (GOOGLE, GITHUB, SPOTIFY)" -ForegroundColor Yellow
Write-Host ""

Write-Host "4. Common Issues:" -ForegroundColor Cyan
Write-Host "   a) Blank white page after login:" -ForegroundColor Yellow
Write-Host "      └─ Frontend is waiting for backend response (check timeout)" -ForegroundColor Gray
Write-Host ""
Write-Host "   b) 'Backend connection failed':" -ForegroundColor Yellow
Write-Host "      └─ Check if backend is running at: $BackendUrl" -ForegroundColor Gray
Write-Host ""
Write-Host "   c) CORS error in browser console:" -ForegroundColor Yellow
Write-Host "      └─ Frontend origin not whitelisted (check CORS config)" -ForegroundColor Gray
Write-Host ""
Write-Host "   d) OAuth login redirects to blank page:" -ForegroundColor Yellow
Write-Host "      └─ Verify redirect URIs in OAuth provider settings" -ForegroundColor Gray
Write-Host ""

Write-Host "5. Next Steps:" -ForegroundColor Cyan
Write-Host "   1. If backend is not reachable, wait 30-60 seconds and try again" -ForegroundColor Yellow
Write-Host "   2. Run this script again to confirm all services are up" -ForegroundColor Yellow
Write-Host "   3. Check browser DevTools (F12) for detailed error messages" -ForegroundColor Yellow
Write-Host "   4. View Render logs: dashboard.render.com" -ForegroundColor Yellow
Write-Host ""

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Tests Complete!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
