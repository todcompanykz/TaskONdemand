param(
  [int[]]$Ports = @(80, 443, 3000, 3001, 5432, 6379, 5672, 15672, 9090, 9100)
)

Write-Host "Checking required tools..."
$tools = @("docker")
foreach ($tool in $tools) {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) {
    throw "Missing required tool: $tool"
  }
}

Write-Host "Checking port conflicts..."
$listeners = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
  Where-Object { $_.LocalPort -in $Ports } |
  Select-Object LocalAddress, LocalPort, OwningProcess -Unique |
  Sort-Object LocalPort

if ($listeners) {
  Write-Warning "Some required ports are already in use:"
  $listeners | Format-Table -AutoSize
} else {
  Write-Host "No conflicts found on required ports."
}
