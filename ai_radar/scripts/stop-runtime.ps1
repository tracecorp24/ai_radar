$ErrorActionPreference = 'Stop'
$root = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$dataDir = Join-Path $root '.data'
$runtimeFile = Join-Path $dataDir 'runtime.json'
$schedulerLock = Join-Path $dataDir 'scheduler.lock'
$processIds = @()
if (Test-Path -LiteralPath $runtimeFile) {
  $state = Get-Content -LiteralPath $runtimeFile -Raw | ConvertFrom-Json
  $processIds += @($state.schedulerPid, $state.nextPid, $state.supervisorPid)
}
if (Test-Path -LiteralPath $schedulerLock) { $processIds += [int](Get-Content -LiteralPath $schedulerLock -Raw) }
$ownedProcesses = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue | Where-Object {
  $_.CommandLine -like ('*' + $root + '*') -and (
    $_.CommandLine -like '*scripts/runtime-supervisor.mjs*' -or
    $_.CommandLine -like '*scripts/local-scheduler.mjs*' -or
    ($_.CommandLine -like '*node_modules*next*' -and $_.CommandLine -like '* start *')
  )
}
$processIds += @($ownedProcesses.ProcessId)
foreach ($processId in ($processIds | Where-Object { $_ } | Select-Object -Unique)) {
  $process = Get-CimInstance Win32_Process -Filter ('ProcessId=' + [int]$processId) -ErrorAction SilentlyContinue
  if ($process) {
    $isOwnedRuntime = $process.CommandLine -like ('*' + $root + '*')
    if ($process.Name -ne 'node.exe' -or -not $isOwnedRuntime) { throw "Beklenmeyen process; durdurulmadı: $processId" }
    Stop-Process -Id ([int]$processId) -ErrorAction Stop
  }
}
foreach ($file in @($runtimeFile, $schedulerLock)) { if (Test-Path -LiteralPath $file) { Remove-Item -LiteralPath $file -Force -ErrorAction Stop } }
Write-Host 'Savvy runtime ve scheduler durduruldu.'
