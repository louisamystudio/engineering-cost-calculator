# Development server startup script for Windows PowerShell
$env:NODE_ENV = "development"
$env:DATABASE_URL = "postgresql://user:password@localhost:5432/engineering_cost_calculator"

Write-Host "Starting Engineering Cost Calculator Development Server..." -ForegroundColor Green
Write-Host "Environment: $env:NODE_ENV" -ForegroundColor Yellow
Write-Host "Database: $env:DATABASE_URL" -ForegroundColor Yellow

npx tsx server/index.ts
