$ErrorActionPreference = 'Stop'
try {
  $api = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/health' -TimeoutSec 5
  $db = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/v1/health/database' -TimeoutSec 5
  $web = Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -TimeoutSec 5
  Write-Host "API: $($api.status)" -ForegroundColor Green
  Write-Host "Database: $($db.status)" -ForegroundColor Green
  Write-Host "Frontend HTTP: $($web.StatusCode)" -ForegroundColor Green
} catch {
  Write-Host "Health check failed: $($_.Exception.Message)" -ForegroundColor Red
  exit 1
}

