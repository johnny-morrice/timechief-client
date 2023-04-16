$ErrorActionPreference = "Stop"
$WORK_DIR = $args[0]
$LOG_FILE = $args[1]
$CLIENT_VERSION = $args[2]

if ((-not($WORK_DIR) -or -not($LOG_FILE)) -or -not($CLIENT_VERSION)) {
  Write-Host "Usage: timechief-client.ps1 <work-dir> <log-file> <client-version>"
  exit 1
}

Set-Location $WORK_DIR
Set-Location win-unpacked
# Set client version environment variable
$env:clientVersion = $CLIENT_VERSION
./timechief.exe .