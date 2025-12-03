# Gym Tracker - Auto Deployment Script
# This script updates the cache version and deploys to GitHub Pages

Write-Host "Starting deployment..." -ForegroundColor Cyan

# Step 1: Update BUILD_DATE in both service-worker.js and index.html to today's date
$today = Get-Date -Format 'yyyyMMdd'
Write-Host "Updating cache version to: $today" -ForegroundColor Yellow

# Update service-worker.js
$serviceWorkerPath = "service-worker.js"
$swContent = Get-Content $serviceWorkerPath -Raw -Encoding UTF8
$swContent = $swContent -replace "const BUILD_DATE = '[0-9]{8}';", "const BUILD_DATE = '$today';"
Set-Content -Path $serviceWorkerPath -Value $swContent -NoNewline -Encoding UTF8

# Update index.html
$indexPath = "index.html"
$indexContent = Get-Content $indexPath -Raw -Encoding UTF8
$indexContent = $indexContent -replace "const BUILD_DATE = '[0-9]{8}';", "const BUILD_DATE = '$today';"
Set-Content -Path $indexPath -Value $indexContent -NoNewline -Encoding UTF8

Write-Host "[OK] Cache version updated in both files" -ForegroundColor Green

# Step 2: Check git status
Write-Host "`nChecking git status..." -ForegroundColor Cyan
$status = git status --porcelain

if (-not $status) {
    Write-Host "[WARNING] No changes to commit!" -ForegroundColor Yellow
    exit 0
}

# Step 3: Stage all changes
Write-Host "Staging changes..." -ForegroundColor Cyan
git add .

# Step 4: Commit
$commitMessage = "Deploy: Update cache version to $today"
Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m $commitMessage

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Commit failed! You may need to configure git:" -ForegroundColor Red
    Write-Host "   git config --global user.email `"your-email@example.com`"" -ForegroundColor Yellow
    Write-Host "   git config --global user.name `"Your Name`"" -ForegroundColor Yellow
    exit 1
}

# Step 5: Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] Deployment complete!" -ForegroundColor Green
    Write-Host "Your site will update on GitHub Pages in a few minutes" -ForegroundColor Cyan
    Write-Host "Users will get the update automatically" -ForegroundColor Cyan
} else {
    Write-Host "`n[ERROR] Push failed! Check your git remote and permissions." -ForegroundColor Red
    exit 1
}

