param(
  [Parameter(Mandatory = $true)]
  [string]$DumpFile
)

if (-not (Test-Path $DumpFile)) {
  throw "Dump file not found: $DumpFile"
}

Write-Host "Restoring PostgreSQL dump into tod database..."
Get-Content $DumpFile | docker exec -i tod-postgres psql -U postgres -d tod
Write-Host "Restore completed."
