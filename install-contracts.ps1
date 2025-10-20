# Install and build shared contracts package
# Run this script from the project root

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Installing Shared Contracts" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Step 1: Build contracts package
Write-Host "`n[1/3] Building contracts package..." -ForegroundColor Yellow
Set-Location contracts
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to install contracts dependencies" -ForegroundColor Red
    exit 1
}

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to build contracts" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 2: Install in backend
Write-Host "`n[2/3] Linking contracts to backend..." -ForegroundColor Yellow
Set-Location backend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to link contracts to backend" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Step 3: Install in frontend
Write-Host "`n[3/3] Linking contracts to frontend..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to link contracts to frontend" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "`n================================" -ForegroundColor Green
Write-Host "Contracts installed successfully!" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Backend and frontend can now import from @brainassistant/contracts" -ForegroundColor White
Write-Host "2. Run tests to verify everything works" -ForegroundColor White


