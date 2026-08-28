# Production Wire-up Automation Kit for PowerShell (Windows)
# Usage: .\scripts\wireup-setup.ps1 -Domain "madresehyar.ir" -HostIp "5.22.133.45" -Provider "arvancloud"

param(
    [string]$Domain = "madresehyar.ir",
    [string]$HostIp = "5.22.133.45",
    [string]$Provider = "arvancloud",
    [string]$AdminEmail = "admin@madresehyar.ir"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🚀 Launching Production Wire-up Kit (Order #55)        " -ForegroundColor Green
Write-Host "  Domain: $Domain | IP: $HostIp | Provider: $Provider     " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan

$env:DOMAIN = $Domain
$env:HOST_IP = $HostIp
$env:HOSTING_PROVIDER = $Provider
$env:ADMIN_EMAIL = $AdminEmail

& "C:\Program Files\Qwen\resources\bun\bun.exe" run scripts/wireup-setup.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Wire-up configuration files generated successfully!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Wire-up configuration failed." -ForegroundColor Red
}
