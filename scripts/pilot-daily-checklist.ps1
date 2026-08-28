# Pilot Day Daily Checklist Runner for PowerShell (Windows)
# Run: .\scripts\pilot-daily-checklist.ps1

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🚀 Launching Pilot Day Automated Daily Checklist Engine  " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

& "C:\Program Files\Qwen\resources\bun\bun.exe" run scripts/pilot-daily-checklist.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Pre-Flight Verification Succeeded: All Systems Operational." -ForegroundColor Green
} else {
    Write-Host "`n❌ Diagnostic Warning: One or more checks require review." -ForegroundColor Red
}
