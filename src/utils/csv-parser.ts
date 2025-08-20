import type { CostData } from '../types';

// CSV parsing utility
export function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split('\n');
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"' && inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip next quote
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  });
}

// Parse cost data from CSV
export function parseCostData(csvText: string): Map<string, CostData> {
  const rows = parseCSV(csvText);
  const headers = rows[0];
  const costDataMap = new Map<string, CostData>();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < headers.length || !row[0]) continue; // Skip empty rows
    
    const buildingUse = row[0];
    const buildingType = row[1];
    const buildingTier = row[3];
    const key = `${buildingUse}|${buildingType}|${buildingTier}`;
    
    const costData: CostData = {
      shellNewMin: parseFloat(row[4]) || 0,
      shellRemodelMin: parseFloat(row[5]) || 0,
      shellNewTarget: parseFloat(row[6]) || 0,
      shellRemodelTarget: parseFloat(row[7]) || 0,
      shellNewMax: parseFloat(row[8]) || 0,
      shellRemodelMax: parseFloat(row[9]) || 0,
      interiorNewMin: parseFloat(row[10]) || 0,
      interiorRemodelMin: parseFloat(row[11]) || 0,
      interiorNewTarget: parseFloat(row[12]) || 0,
      interiorRemodelTarget: parseFloat(row[13]) || 0,
      interiorNewMax: parseFloat(row[14]) || 0,
      interiorRemodelMax: parseFloat(row[15]) || 0,
      landscapeNewMin: parseFloat(row[16]) || 0,
      landscapeRemodelMin: parseFloat(row[17]) || 0,
      landscapeNewTarget: parseFloat(row[18]) || 0,
      landscapeRemodelTarget: parseFloat(row[19]) || 0,
      landscapeNewMax: parseFloat(row[20]) || 0,
      landscapeRemodelMax: parseFloat(row[21]) || 0,
      shellShare: parseFloat(row[28]) / 100 || 0.7, // Convert percentage to decimal
      interiorShare: parseFloat(row[29]) / 100 || 0.2,
      landscapeShare: parseFloat(row[30]) / 100 || 0.1,
      structuralShare: parseFloat(row[34]) / 100 || 0.35,
      civilShare: parseFloat(row[35]) / 100 || 0.07,
      mechanicalShare: parseFloat(row[36]) / 100 || 0.10,
      electricalShare: parseFloat(row[37]) / 100 || 0.08,
      plumbingShare: parseFloat(row[38]) / 100 || 0.05,
      telecomShare: parseFloat(row[39]) / 100 || 0.03,
    };
    
    costDataMap.set(key, costData);
  }
  
  return costDataMap;
}

// Get building types for a given building use
export function getBuildingTypes(csvText: string, buildingUse: string): string[] {
  const rows = parseCSV(csvText);
  const types = new Set<string>();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[0] === buildingUse && row[1]) {
      types.add(row[1]);
    }
  }
  
  return Array.from(types);
}

// Get building tiers for a given building use and type
export function getBuildingTiers(csvText: string, buildingUse: string, buildingType: string): string[] {
  const rows = parseCSV(csvText);
  const tiers = new Set<string>();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[0] === buildingUse && row[1] === buildingType && row[3]) {
      tiers.add(row[3]);
    }
  }
  
  return Array.from(tiers);
}

// Get all building uses
export function getBuildingUses(csvText: string): string[] {
  const rows = parseCSV(csvText);
  const uses = new Set<string>();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[0]) {
      uses.add(row[0]);
    }
  }
  
  return Array.from(uses);
}
