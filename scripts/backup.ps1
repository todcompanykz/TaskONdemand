param(
  [string]$OutputDir = ".\backups",
  [int]$RetentionDays = 14
)

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null

Write-Host "Creating PostgreSQL dump..."
$dumpFile = "$OutputDir\postgres_$timestamp.sql"
docker exec tod-postgres pg_dump -U postgres tod > $dumpFile

Write-Host "Archiving infrastructure configs..."
$zipFile = "$OutputDir\infra_configs_$timestamp.zip"
Compress-Archive -Path ".\infra\*", ".\env\*", ".\scripts\*" -DestinationPath $zipFile -Force

$dumpHash = (Get-FileHash -Algorithm SHA256 -Path $dumpFile).Hash
$zipHash = (Get-FileHash -Algorithm SHA256 -Path $zipFile).Hash
$manifestFile = "$OutputDir\backup_manifest_$timestamp.txt"
@(
  "timestamp=$timestamp"
  "db_dump=$dumpFile"
  "db_dump_sha256=$dumpHash"
  "config_archive=$zipFile"
  "config_archive_sha256=$zipHash"
) | Set-Content -Path $manifestFile -Encoding UTF8

Write-Host "Applying retention policy ($RetentionDays days)..."
$threshold = (Get-Date).AddDays(-1 * $RetentionDays)
Get-ChildItem -Path $OutputDir -File |
  Where-Object { $_.LastWriteTime -lt $threshold } |
  Remove-Item -Force

Write-Host "Backup completed:"
Write-Host " - DB dump: $dumpFile"
Write-Host " - Config archive: $zipFile"
Write-Host " - Manifest: $manifestFile"
