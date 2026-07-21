$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Start-Process cmd.exe -ArgumentList '/k', ('"' + (Join-Path $PSScriptRoot 'start_backend.bat') + '"')
Start-Sleep -Seconds 2
Start-Process cmd.exe -ArgumentList '/k', ('"' + (Join-Path $PSScriptRoot 'start_frontend.bat') + '"')
Write-Host 'Backend and frontend windows have started.' -ForegroundColor Green
Write-Host 'Open http://127.0.0.1:5173 after both windows report they are ready.'

