import type { CostData } from '../types';
import { parseCostData, getBuildingUses, getBuildingTypes, getBuildingTiers } from '../utils/csv-parser';
import costsCSV from '../data/costs.csv?raw';

// Cache for parsed data
let costDataCache: Map<string, CostData> | null = null;
let buildingUsesCache: string[] | null = null;
let buildingTypesCache: Map<string, string[]> | null = null;
let buildingTiersCache: Map<string, string[]> | null = null;

/**
 * Get all cost data from the CSV file
 */
export function getAllCostData(): Map<string, CostData> {
  if (!costDataCache) {
    costDataCache = parseCostData(costsCSV);
  }
  return costDataCache;
}

/**
 * Get cost data for a specific building configuration
 */
export function getCostData(buildingUse: string, buildingType: string, buildingTier: string): CostData | null {
  const allData = getAllCostData();
  const key = `${buildingUse}|${buildingType}|${buildingTier}`;
  return allData.get(key) || null;
}

/**
 * Get cost data with fallback to default residential if not found
 */
export function getCostDataWithFallback(buildingUse: string, buildingType: string, buildingTier: string): CostData {
  const costData = getCostData(buildingUse, buildingType, buildingTier);
  
  if (costData) {
    return costData;
  }
  
  // Fallback to Custom Houses Mid if not found
  const fallback = getCostData('Residential', 'Custom Houses', 'Mid');
  if (fallback) {
    return fallback;
  }
  
  // Ultimate fallback with reasonable defaults
  return {
    shellNewMin: 150,
    shellNewTarget: 200,
    shellNewMax: 250,
    shellRemodelMin: 100,
    shellRemodelTarget: 140,
    shellRemodelMax: 180,
    interiorNewMin: 30,
    interiorNewTarget: 45,
    interiorNewMax: 60,
    interiorRemodelMin: 40,
    interiorRemodelTarget: 60,
    interiorRemodelMax: 80,
    landscapeNewMin: 10,
    landscapeNewTarget: 15,
    landscapeNewMax: 25,
    landscapeRemodelMin: 12,
    landscapeRemodelTarget: 18,
    landscapeRemodelMax: 30,
    shellShare: 0.70,
    interiorShare: 0.20,
    landscapeShare: 0.10,
    structuralShare: 0.35,
    civilShare: 0.07,
    mechanicalShare: 0.10,
    electricalShare: 0.08,
    plumbingShare: 0.05,
    telecomShare: 0.03,
  };
}

/**
 * Get all available building uses
 */
export function getAllBuildingUses(): string[] {
  if (!buildingUsesCache) {
    buildingUsesCache = getBuildingUses(costsCSV);
  }
  return buildingUsesCache;
}

/**
 * Get building types for a specific building use
 */
export function getBuildingTypesForUse(buildingUse: string): string[] {
  if (!buildingTypesCache) {
    buildingTypesCache = new Map();
  }
  
  if (!buildingTypesCache.has(buildingUse)) {
    const types = getBuildingTypes(costsCSV, buildingUse);
    buildingTypesCache.set(buildingUse, types);
  }
  
  return buildingTypesCache.get(buildingUse) || [];
}

/**
 * Get building tiers for a specific building use and type
 */
export function getBuildingTiersForType(buildingUse: string, buildingType: string): string[] {
  if (!buildingTiersCache) {
    buildingTiersCache = new Map();
  }
  
  const key = `${buildingUse}|${buildingType}`;
  if (!buildingTiersCache.has(key)) {
    const tiers = getBuildingTiers(costsCSV, buildingUse, buildingType);
    buildingTiersCache.set(key, tiers);
  }
  
  return buildingTiersCache.get(key) || [];
}

/**
 * Validate that a building configuration exists
 */
export function validateBuildingConfiguration(buildingUse: string, buildingType: string, buildingTier: string): boolean {
  const costData = getCostData(buildingUse, buildingType, buildingTier);
  return costData !== null;
}

/**
 * Get default building configuration (first available option)
 */
export function getDefaultBuildingConfiguration(): { buildingUse: string; buildingType: string; buildingTier: string; } {
  const uses = getAllBuildingUses();
  if (uses.length === 0) {
    return { buildingUse: 'Residential', buildingType: 'Custom Houses', buildingTier: 'Mid' };
  }
  
  const firstUse = uses[0];
  const types = getBuildingTypesForUse(firstUse);
  if (types.length === 0) {
    return { buildingUse: firstUse, buildingType: 'Custom Houses', buildingTier: 'Mid' };
  }
  
  const firstType = types[0];
  const tiers = getBuildingTiersForType(firstUse, firstType);
  if (tiers.length === 0) {
    return { buildingUse: firstUse, buildingType: firstType, buildingTier: 'Mid' };
  }
  
  return { buildingUse: firstUse, buildingType: firstType, buildingTier: tiers[0] };
}
