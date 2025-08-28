# Quick setup for testing without PostgreSQL
# This sets up environment variables to bypass database for testing

Write-Host "Setting up mock environment for testing..." -ForegroundColor Green

# Set environment variables for current session
$env:DATABASE_URL = "postgresql://mock:mock@localhost:5432/mock"
$env:NODE_ENV = "development"
$env:MOCK_DATA = "true"

Write-Host "Environment variables set for current session" -ForegroundColor Green

# Update the development server to start with the corrected command
Write-Host "`nStarting development server with mock data..." -ForegroundColor Yellow

# Use the corrected command for Windows
$env:NODE_ENV="development"; $env:DATABASE_URL="postgresql://mock:mock@localhost:5432/mock"; npx tsx server/index.ts
