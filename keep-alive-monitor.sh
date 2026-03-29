#!/bin/bash

# VibeSync Backend Keep-Alive Monitor
# This script continuously pings the backend to keep it awake
# Prevents Render free tier from spinning down after 15 minutes of inactivity

BACKEND_URL="https://vibesync-zc9a.onrender.com"
INTERVAL=600  # 10 minutes (600 seconds)
LOG_FILE="backend-keepalive.log"

echo "Starting VibeSync Backend Keep-Alive Monitor..."
echo "Backend URL: $BACKEND_URL"
echo "Ping interval: $((INTERVAL / 60)) minutes"
echo "Logs saved to: $LOG_FILE"
echo ""

while true; do
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "[$TIMESTAMP] Sending keep-alive ping to $BACKEND_URL/auth/test..." | tee -a "$LOG_FILE"
    
    RESPONSE=$(curl -s -w "\n%{http_code}" "$BACKEND_URL/auth/test")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ [$TIMESTAMP] Success! Response: $BODY" | tee -a "$LOG_FILE"
    else
        echo "⚠️  [$TIMESTAMP] Warning! HTTP Code: $HTTP_CODE" | tee -a "$LOG_FILE"
    fi
    
    echo "" | tee -a "$LOG_FILE"
    
    echo "Sleeping for $(($INTERVAL / 60)) minutes..."
    sleep $INTERVAL
done
