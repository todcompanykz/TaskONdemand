# PostgreSQL Connection Check Script
# Run: .\check_postgres_connection.ps1

Write-Host "=== PostgreSQL Connection Check ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Checking PostgreSQL container status..." -ForegroundColor Yellow
docker compose ps postgres
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Container is not running!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Checking port 5432..." -ForegroundColor Yellow
docker compose port postgres 5432
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Port is not open!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "3. Checking PostgreSQL version..." -ForegroundColor Yellow
docker compose exec -T postgres psql -U postgres -d tod -c "SELECT version();"

Write-Host ""
Write-Host "4. Checking databases..." -ForegroundColor Yellow
docker compose exec -T postgres psql -U postgres -d postgres -c "\l"

Write-Host ""
Write-Host "5. Checking tables in 'tod' database..." -ForegroundColor Yellow
docker compose exec -T postgres psql -U postgres -d tod -c "\dt"

Write-Host ""
Write-Host "=== Connection Parameters for pgAdmin ===" -ForegroundColor Cyan
Write-Host "Host: localhost"
Write-Host "Port: 5432"
Write-Host "Database: tod"
Write-Host "Username: postgres"
Write-Host "Password: postgres"
Write-Host ""
Write-Host "See PGADMIN_CONNECTION.md for detailed instructions" -ForegroundColor Yellow
