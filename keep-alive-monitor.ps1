# VibeSync Backend Keep-Alive Monitor (PowerShell Version)
# This script continuously pings the backend to keep it awake
# Prevents Render free tier from spinning down after 15 minutes of inactivity

param(
    [string]$BackendUrl = "https://vibesync-zc9a.onrender.com",
    [int]$IntervalMinutes = 10
)

$IntervalSeconds = $IntervalMinutes * 60
$LogFile = "backend-keepalive.log"

Write-Host "Starting VibeSync Backend Keep-Alive Monitor..." -ForegroundColor Green
Write-Host "Backend URL: $BackendUrl" -ForegroundColor Cyan
Write-Host "Ping interval: $IntervalMinutes minutes" -ForegroundColor Cyan
Write-Host "Logs saved to: $LogFile" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    
    $LogMessage = "[$Timestamp] Sending keep-alive ping to $BackendUrl/auth/test..."
    Write-Host $LogMessage -ForegroundColor Yellow
    Add-Content -Path $LogFile -Value $LogMessage
    
    try {
        $Response = Invoke-WebRequest -Uri "$BackendUrl/auth/test" -Method Get -TimeoutSec 10 -ErrorAction Stop
        $StatusCode = $Response.StatusCode
        $Body = $Response.Content
        
        if ($StatusCode -eq 200) {
            $SuccessMessage = "✅ [$Timestamp] Success! Response: $Body"
            Write-Host $SuccessMessage -ForegroundColor Green
            Add-Content -Path $LogFile -Value $SuccessMessage
        } else {
            $WarningMessage = "⚠️ [$Timestamp] Warning! HTTP Code: $StatusCode"
            Write-Host $WarningMessage -ForegroundColor Yellow
            Add-Content -Path $LogFile -Value $WarningMessage
        }
    }
    catch {
        $ErrorMessage = "❌ [$Timestamp] Error: $_"
        Write-Host $ErrorMessage -ForegroundColor Red
        Add-Content -Path $LogFile -Value $ErrorMessage
    }
    
    Write-Host ""
    Write-Host "Sleeping for $IntervalMinutes minutes..." -ForegroundColor Cyan
    Start-Sleep -Seconds $IntervalSeconds
}
