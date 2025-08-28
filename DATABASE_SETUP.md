# Database Setup Guide

## Overview

The Engineering Cost Calculator requires PostgreSQL for data storage. This guide covers multiple setup options.

## Option 1: Docker (Recommended for Local Development)

### Prerequisites
- Docker Desktop installed ([Download](https://www.docker.com/products/docker-desktop))

### Steps

1. **Start PostgreSQL using Docker Compose:**
   ```bash
   docker-compose up -d
   ```

2. **Set environment variables:**
   Create a `.env` file in the project root:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/engineering_cost_calculator
   NODE_ENV=development
   PORT=5000
   ```

3. **Push database schema:**
   ```bash
   npm run db:push
   ```

4. **Import cost data from CSV:**
   ```bash
   npx tsx scripts/import_cost_index.ts PR_Construction_Cost_Index_2025_filled.csv
   ```

## Option 2: Local PostgreSQL Installation

### Prerequisites
- PostgreSQL 14+ installed locally
- psql command available in PATH

### Steps

1. **Create database:**
   ```bash
   psql -U postgres -c "CREATE DATABASE engineering_cost_calculator;"
   ```

2. **Run setup script:**
   
   For PowerShell:
   ```powershell
   .\scripts\setup-local-db.ps1
   ```
   
   For Command Prompt:
   ```cmd
   scripts\setup-local-db.bat
   ```

3. **Push schema and import data:**
   ```bash
   npm run db:push
   npx tsx scripts/import_cost_index.ts PR_Construction_Cost_Index_2025_filled.csv
   ```

## Option 3: Cloud Database (Neon)

### Steps

1. **Create Neon account:**
   - Visit [neon.tech](https://neon.tech)
   - Sign up for free account

2. **Create new project:**
   - Click "New Project"
   - Choose region closest to you
   - Note the connection string

3. **Update .env:**
   ```env
   DATABASE_URL=postgresql://[user]:[password]@[host].neon.tech/[database]?sslmode=require
   ```

4. **Push schema and import data:**
   ```bash
   npm run db:push
   npx tsx scripts/import_cost_index.ts PR_Construction_Cost_Index_2025_filled.csv
   ```

## Verifying Setup

After setup, verify everything works:

```bash
# Start the development server
npm run dev
```

Visit http://localhost:5000 - you should see the application running.

## Troubleshooting

### "DATABASE_URL must be set" error
- Ensure `.env` file exists with proper DATABASE_URL
- On Windows, restart your terminal after creating .env

### "Connection refused" error
- Check PostgreSQL is running (`docker ps` for Docker)
- Verify port 5432 is not in use by another service
- Check firewall settings

### Import errors
- Ensure CSV file path is correct
- Check CSV encoding (should be UTF-8)
- Verify database connection before importing

## For Replit Deployment

When deploying to Replit:

1. Use Replit's PostgreSQL database
2. Set DATABASE_URL in Replit secrets
3. Run migrations on first deploy:
   ```bash
   npm run db:push
   npx tsx scripts/import_cost_index.ts PR_Construction_Cost_Index_2025_filled.csv
   ```
