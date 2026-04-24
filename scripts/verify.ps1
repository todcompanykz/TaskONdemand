Write-Host "Docker compose status:"
docker compose ps

Write-Host "`nChecking backend health..."
try {
  $status = (Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 20).StatusCode
  Write-Host "Backend /health: $status"
} catch {
  Write-Warning "Backend health check failed: $($_.Exception.Message)"
}

Write-Host "`nChecking frontend..."
try {
  $status = (Invoke-WebRequest -Uri "http://localhost:3002" -UseBasicParsing -TimeoutSec 20).StatusCode
  Write-Host "Frontend: $status"
} catch {
  Write-Warning "Frontend check failed: $($_.Exception.Message)"
}
