# Setup Local PostgreSQL Database for Engineering Cost Calculator
# Run this script in PowerShell as Administrator

Write-Host "Setting up local PostgreSQL database..." -ForegroundColor Green

# Database configuration
$dbName = "engineering_cost_calculator"
$dbUser = "postgres"
$dbPassword = "postgres"
$dbHost = "localhost"
$dbPort = "5432"

# Check if PostgreSQL is installed
try {
    $pgVersion = psql --version
    Write-Host "PostgreSQL found: $pgVersion" -ForegroundColor Yellow
} catch {
    Write-Host "PostgreSQL not found. Please install PostgreSQL first." -ForegroundColor Red
    Write-Host "Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    exit 1
}

# Create database
Write-Host "Creating database '$dbName'..." -ForegroundColor Yellow
$env:PGPASSWORD = $dbPassword
psql -U $dbUser -h $dbHost -p $dbPort -c "CREATE DATABASE $dbName;" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "Database created successfully!" -ForegroundColor Green
} else {
    Write-Host "Database might already exist, continuing..." -ForegroundColor Yellow
}

# Set environment variable for the current session
$env:DATABASE_URL = "postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}"
Write-Host "DATABASE_URL set for current session" -ForegroundColor Green

# Create .env file if it doesn't exist
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    @"
# Local PostgreSQL Database Configuration
DATABASE_URL=postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}

# Development Environment
NODE_ENV=development

# Server Port
PORT=5000
"@ | Out-File -FilePath $envFile -Encoding UTF8
    Write-Host ".env file created" -ForegroundColor Green
} else {
    Write-Host ".env file already exists" -ForegroundColor Yellow
}

Write-Host "`nDatabase setup complete!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Run 'npm run db:push' to create database schema" -ForegroundColor White
Write-Host "2. Run 'npx tsx scripts/import_cost_index.ts PR_Construction_Cost_Index_2025_filled.csv' to import data" -ForegroundColor White
Write-Host "3. Run 'npm run dev' to start the development server" -ForegroundColor White
