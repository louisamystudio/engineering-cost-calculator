/**
 * Setup SQLite database for local development
 * This creates a local SQLite database with the same schema as PostgreSQL
 */
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create database
const dbPath = path.join(__dirname, '..', 'dev.db');
const db = new Database(dbPath);

console.log('Creating SQLite database for development...');

// Create the building_cost_data_v6 table
const createTableSQL = `
CREATE TABLE IF NOT EXISTS building_cost_data_v6 (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    building_use TEXT NOT NULL,
    building_type TEXT NOT NULL,
    category INTEGER NOT NULL,
    building_tier TEXT NOT NULL,
    
    -- Shell costs ($/ft²) - All-in
    shell_new_min DECIMAL(8,2) NOT NULL,
    shell_remodel_min DECIMAL(8,2) NOT NULL,
    shell_new_target DECIMAL(8,2) NOT NULL,
    shell_remodel_target DECIMAL(8,2) NOT NULL,
    shell_new_max DECIMAL(8,2) NOT NULL,
    shell_remodel_max DECIMAL(8,2) NOT NULL,
    
    -- Interior costs ($/ft²) - All-in
    interior_new_min DECIMAL(8,2) NOT NULL,
    interior_remodel_min DECIMAL(8,2) NOT NULL,
    interior_new_target DECIMAL(8,2) NOT NULL,
    interior_remodel_target DECIMAL(8,2) NOT NULL,
    interior_new_max DECIMAL(8,2) NOT NULL,
    interior_remodel_max DECIMAL(8,2) NOT NULL,
    
    -- Outdoor & Landscape costs ($/ft²) - All-in
    outdoor_new_min DECIMAL(8,2) NOT NULL,
    outdoor_remodel_min DECIMAL(8,2) NOT NULL,
    outdoor_new_target DECIMAL(8,2) NOT NULL,
    outdoor_remodel_target DECIMAL(8,2) NOT NULL,
    outdoor_new_max DECIMAL(8,2) NOT NULL,
    outdoor_remodel_max DECIMAL(8,2) NOT NULL,
    
    -- Swimming Pool costs ($/ft²) - All-in
    pool_new_min DECIMAL(8,2) NOT NULL,
    pool_remodel_min DECIMAL(8,2) NOT NULL,
    pool_new_target DECIMAL(8,2) NOT NULL,
    pool_remodel_target DECIMAL(8,2) NOT NULL,
    pool_new_max DECIMAL(8,2) NOT NULL,
    pool_remodel_max DECIMAL(8,2) NOT NULL,
    
    -- Project Shares (%)
    project_shell_share DECIMAL(5,2) NOT NULL,
    project_interior_share DECIMAL(5,2) NOT NULL,
    project_landscape_share DECIMAL(5,2) NOT NULL,
    
    -- Design Shares (%)
    architectural_design_share DECIMAL(5,2) NOT NULL,
    interior_design_share DECIMAL(5,2) NOT NULL,
    landscape_design_share DECIMAL(5,2) NOT NULL,
    structural_design_share DECIMAL(5,2) NOT NULL,
    civil_design_share DECIMAL(5,2) NOT NULL,
    mechanical_design_share DECIMAL(5,2) NOT NULL,
    electrical_design_share DECIMAL(5,2) NOT NULL,
    plumbing_design_share DECIMAL(5,2) NOT NULL,
    telecommunication_design_share DECIMAL(5,2) NOT NULL,
    
    UNIQUE(building_use, building_type, category, building_tier)
);
`;

db.exec(createTableSQL);

// Create other required tables
const otherTables = `
-- Category multipliers
CREATE TABLE IF NOT EXISTS category_multipliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category INTEGER NOT NULL UNIQUE,
    multiplier DECIMAL(3,2) NOT NULL,
    description TEXT
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    project_name TEXT NOT NULL,
    building_use TEXT NOT NULL,
    building_type TEXT NOT NULL,
    building_tier TEXT NOT NULL,
    design_level INTEGER NOT NULL,
    category INTEGER NOT NULL,
    new_building_area DECIMAL(10,2) NOT NULL,
    existing_building_area DECIMAL(10,2) NOT NULL,
    site_area DECIMAL(10,2) NOT NULL,
    historic_multiplier DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    remodel_multiplier DECIMAL(3,2) NOT NULL DEFAULT 0.5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_demo BOOLEAN DEFAULT 0
);

-- Insert default category multipliers
INSERT OR IGNORE INTO category_multipliers (category, multiplier, description) VALUES
(1, 0.90, 'Simple/Standard'),
(2, 1.00, 'Moderate Complexity'),
(3, 1.10, 'Complex'),
(4, 1.20, 'Very Complex'),
(5, 1.30, 'Extremely Complex');
`;

db.exec(otherTables);

console.log('SQLite database created successfully!');
console.log(`Database location: ${dbPath}`);

// Close database
db.close();

console.log('\nNext steps:');
console.log('1. Update DATABASE_URL to use SQLite: sqlite:dev.db');
console.log('2. Run the CSV import script');
console.log('3. Start the development server');
