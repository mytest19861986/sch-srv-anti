# Production Wire-up Final Check Runner for PowerShell (Windows)
# Usage: .\scripts\wireup-final-check.ps1

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🔍 Running Wire-up Final Quality Gate Verification     " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

& "C:\Program Files\Qwen\resources\bun\bun.exe" run scripts/wireup-final-check.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ All Wire-up pre-flight checks passed: 100% Ready for Live Traffic." -ForegroundColor Green
} else {
    Write-Host "`n❌ Final check encountered errors." -ForegroundColor Red
}
