# Test pgAdmin connection parameters
Write-Host "Testing PostgreSQL connection with pgAdmin parameters..." -ForegroundColor Cyan
Write-Host ""

$env:PGPASSWORD = "postgres"
$result = & docker run --rm --network todmvp_tod-network postgres:18 psql -h tod-postgres -U postgres -d postgres -c "SELECT 'SUCCESS' as status;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "SUCCESS: Connection works!" -ForegroundColor Green
    Write-Host $result
} else {
    Write-Host "ERROR: Connection failed!" -ForegroundColor Red
    Write-Host $result
}

Write-Host ""
Write-Host "If connection works, try in pgAdmin:" -ForegroundColor Yellow
Write-Host "  Host: 127.0.0.1"
Write-Host "  Port: 5432"
Write-Host "  Database: postgres"
Write-Host "  Username: postgres"
Write-Host "  Password: postgres"
Write-Host "  SSL mode: disable"
