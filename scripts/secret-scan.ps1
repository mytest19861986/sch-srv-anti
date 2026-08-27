# Secret & Security Scanner for Windows PowerShell
Write-Host "🔍 Running Automated Secret and Security Scanner..." -ForegroundColor Cyan

$patterns = @(
    "BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY",
    "ghp_[A-Za-z0-9_]{36}",
    "aws_secret_access_key\s*=",
    "stripe_secret_key\s*="
)

$found = 0
foreach ($p in $patterns) {
    $matches = git grep -EI "$p" -- ':!*.env.example' ':!tests/**' ':!scripts/**' 2>$null
    if ($matches) {
        Write-Host "❌ High Risk Secret Pattern Detected: $p" -ForegroundColor Red
        Write-Host $matches -ForegroundColor Yellow
        $found = 1
    }
}

if ($found -eq 0) {
    Write-Host "✅ Zero secrets or credentials found in repository source code." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Secret scan failed! Remove leaked credentials before commit." -ForegroundColor Red
    exit 1
}
