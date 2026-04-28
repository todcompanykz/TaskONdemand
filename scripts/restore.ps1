param(
  [Parameter(Mandatory = $true)]
  [string]$DumpFile,
  [switch]$DryRun
)

if (-not (Test-Path $DumpFile)) {
  throw "Dump file not found: $DumpFile"
}

if ($DryRun) {
  Write-Host "Dry run mode enabled. Restore was not executed."
  Write-Host "Dump file exists: $DumpFile"
  Write-Host "To execute restore run without -DryRun."
  exit 0
}

Write-Host "Restoring PostgreSQL dump into tod database..."
Get-Content $DumpFile | docker exec -i tod-postgres psql -U postgres -d tod
Write-Host "Restore completed."
