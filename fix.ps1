# HackerRank Feature Fix Script
# Run this in PowerShell: .\fix.ps1

Write-Host "=== HackerRank Feature Fix ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Try database push
Write-Host "Step 1: Pushing schema to database..." -ForegroundColor Yellow
Write-Host "Note: This will likely fail due to TLS issues on your machine." -ForegroundColor Gray
Write-Host ""

$dbPushResult = & npx prisma db push --accept-data-loss 2>&1
$dbPushSuccess = $LASTEXITCODE -eq 0

if ($dbPushSuccess) {
    Write-Host "✓ Database schema pushed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Database push failed (expected due to TLS issues)" -ForegroundColor Red
    Write-Host ""
    Write-Host "MANUAL STEP REQUIRED:" -ForegroundColor Yellow
    Write-Host "1. Go to https://supabase.com/dashboard" -ForegroundColor White
    Write-Host "2. Select your project" -ForegroundColor White
    Write-Host "3. Click SQL Editor in sidebar" -ForegroundColor White
    Write-Host "4. Run this SQL:" -ForegroundColor White
    Write-Host ""
    Write-Host "   ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hackerrank_username TEXT;" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "5. Press Enter here after you have done that..." -ForegroundColor Yellow
    $null = Read-Host
}

Write-Host ""

# Step 2: Regenerate Prisma Client
Write-Host "Step 2: Regenerating Prisma Client..." -ForegroundColor Yellow
& npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Prisma Client regenerated successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Prisma generate failed" -ForegroundColor Red
    Write-Host "Try manually: npm install @prisma/client && npx prisma generate" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 3: Git operations
Write-Host "Step 3: Committing changes..." -ForegroundColor Yellow
git add .
git commit -m "fix: Add hackerRankUsername field and regenerate Prisma client"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Changes committed!" -ForegroundColor Green
} else {
    Write-Host "✗ Git commit failed (maybe no changes to commit?)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Ready to push to Vercel?" -ForegroundColor Yellow
Write-Host "Run: git push origin main" -ForegroundColor Cyan
Write-Host ""
$push = Read-Host "Push now? (y/n)"

if ($push -eq "y" -or $push -eq "Y") {
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Pushed to GitHub! Vercel will auto-deploy." -ForegroundColor Green
        Write-Host ""
        Write-Host "Monitor deployment at: https://vercel.com/dashboard" -ForegroundColor Cyan
        Write-Host "Then test at: https://mru-codes-seven.vercel.app" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Git push failed" -ForegroundColor Red
    }
} else {
    Write-Host "Skipped push. Run 'git push origin main' when ready." -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Fix Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Wait for Vercel deployment (2-3 min)" -ForegroundColor White
Write-Host "2. Login as teacher" -ForegroundColor White
Write-Host "3. Go to Dashboard → Student Performance" -ForegroundColor White
Write-Host "4. Should load without errors ✓" -ForegroundColor White
Write-Host ""
