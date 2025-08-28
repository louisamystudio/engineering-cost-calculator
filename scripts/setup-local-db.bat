@echo off
REM Setup Local PostgreSQL Database for Engineering Cost Calculator

echo Setting up local PostgreSQL database...

REM Database configuration
set DB_NAME=engineering_cost_calculator
set DB_USER=postgres
set DB_PASSWORD=postgres
set DB_HOST=localhost
set DB_PORT=5432

REM Check if PostgreSQL is installed
psql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo PostgreSQL not found. Please install PostgreSQL first.
    echo Download from: https://www.postgresql.org/download/windows/
    exit /b 1
)

echo PostgreSQL found!

REM Create database
echo Creating database '%DB_NAME%'...
set PGPASSWORD=%DB_PASSWORD%
psql -U %DB_USER% -h %DB_HOST% -p %DB_PORT% -c "CREATE DATABASE %DB_NAME%;" 2>nul

if %errorlevel% equ 0 (
    echo Database created successfully!
) else (
    echo Database might already exist, continuing...
)

REM Set environment variable for current session
set DATABASE_URL=postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo DATABASE_URL set for current session

REM Create .env file if it doesn't exist
if not exist .env (
    echo # Local PostgreSQL Database Configuration > .env
    echo DATABASE_URL=postgresql://%DB_USER%:%DB_PASSWORD%@%DB_HOST%:%DB_PORT%/%DB_NAME% >> .env
    echo. >> .env
    echo # Development Environment >> .env
    echo NODE_ENV=development >> .env
    echo. >> .env
    echo # Server Port >> .env
    echo PORT=5000 >> .env
    echo .env file created
) else (
    echo .env file already exists
)

echo.
echo Database setup complete!
echo Next steps:
echo 1. Run 'npm run db:push' to create database schema
echo 2. Run 'npx tsx scripts/import_cost_index.ts PR_Construction_Cost_Index_2025_filled.csv' to import data
echo 3. Run 'npm run dev' to start the development server
