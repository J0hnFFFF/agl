# Reset AGL Monolith Database
# This script will delete the existing database and let the service recreate it with default data

$dbPath = "services\monolith\agl.db"
$dbShmPath = "services\monolith\agl.db-shm"
$dbWalPath = "services\monolith\agl.db-wal"

Write-Host "🗑️  Resetting AGL Monolith Database..." -ForegroundColor Yellow
Write-Host ""

# Check if database exists
if (Test-Path $dbPath) {
    Write-Host "📦 Removing old database files..." -ForegroundColor Blue

    # Remove database files
    Remove-Item -Path $dbPath -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $dbShmPath -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $dbWalPath -Force -ErrorAction SilentlyContinue

    Write-Host "✅ Old database removed" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No existing database found" -ForegroundColor Gray
}

Write-Host ""
Write-Host "✨ Database reset complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Start the service: npm run dev:monolith"
Write-Host "  2. The database will be recreated automatically with default test client"
Write-Host "  3. Run tests: .\scripts\test-monolith.ps1"
Write-Host ""
