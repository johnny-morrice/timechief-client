$ErrorActionPreference = "Stop"
$WORK_DIR = $args[0]
$LOG_FILE = $args[1]

if (-not($WORK_DIR) -or -not($LOG_FILE)) {
  Write-Host "Usage: timechief-client.ps1 <work-dir> <log-file>"
  exit 1
}

Set-Location $WORK_DIR
./timechief.exe . 2>&1 >> $LOG_FILE