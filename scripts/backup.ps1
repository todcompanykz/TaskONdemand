param(
  [string]$OutputDir = ".\backups"
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Write-Host "Creating PostgreSQL dump..."
docker exec tod-postgres pg_dump -U postgres tod > "$OutputDir\postgres_$timestamp.sql"

Write-Host "Archiving infrastructure configs..."
$zipFile = "$OutputDir\infra_configs_$timestamp.zip"
Compress-Archive -Path ".\infra\*", ".\env\*", ".\scripts\*" -DestinationPath $zipFile -Force

Write-Host "Backup completed:"
Write-Host " - DB dump: $OutputDir\postgres_$timestamp.sql"
Write-Host " - Config archive: $zipFile"
