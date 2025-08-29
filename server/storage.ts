import { 
  users, 
  type User, 
  type InsertUser,
<<<<<<< HEAD

=======
>>>>>>> main
  type BuildingCostRange,
  type EngineeringCost,
  hoursLeverage,
  type HoursLeverage,
  type InsertHoursLeverage,
  laborOverhead,
  type LaborOverhead,
  type InsertLaborOverhead,
  hourlyRates,
  type HourlyRates,
  type InsertHourlyRates,
  feeConfig,
  type FeeConfig,
  type InsertFeeConfig,
  categoryMultipliers,
  type CategoryMultiplier,
  type InsertCategoryMultiplier,
  projects,
  type Project,
  type InsertProject,
  projectCalculations,
  type ProjectCalculation,
  type InsertProjectCalculation,
  projectFees,
  type ProjectFee,
  type InsertProjectFee,
  projectHours,
  type ProjectHours,
  type InsertProjectHours,
  buildingCostData,
  type BuildingCostData,
  type InsertBuildingCostData
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Budget Calculator methods
  getAllBuildingTypes(): Promise<string[]>;
  getTiersByBuildingType(buildingType: string): Promise<number[]>;
  getBuildingCostRange(buildingType: string, tier: number): Promise<BuildingCostRange | undefined>;
  getEngineeringCosts(buildingType: string, tier: number): Promise<EngineeringCost[]>;
  
  // Hours Leverage methods
  getAllHoursLeverage(): Promise<HoursLeverage[]>;
  createHoursLeverage(data: InsertHoursLeverage): Promise<HoursLeverage>;
  updateHoursLeverage(id: string, data: Partial<InsertHoursLeverage>): Promise<HoursLeverage | undefined>;
  deleteHoursLeverage(id: string): Promise<boolean>;
  getHoursLeverageByPhase(phase: string): Promise<HoursLeverage | undefined>;
  
  // Labor Overhead methods
  getAllLaborOverhead(): Promise<LaborOverhead[]>;
  createLaborOverhead(data: InsertLaborOverhead): Promise<LaborOverhead>;
  updateLaborOverhead(role: string, data: Partial<InsertLaborOverhead>): Promise<LaborOverhead | undefined>;
  
  // Hourly Rates methods
  getAllHourlyRates(): Promise<HourlyRates[]>;
  createHourlyRates(data: InsertHourlyRates): Promise<HourlyRates>;
  updateHourlyRates(role: string, data: Partial<InsertHourlyRates>): Promise<HourlyRates | undefined>;
  
  // Fee Config methods
  getAllFeeConfig(): Promise<FeeConfig[]>;
  getFeeConfigValue(key: string): Promise<number | undefined>;
  updateFeeConfig(key: string, value: number): Promise<FeeConfig | undefined>;
  
  // Category Multipliers methods
  getAllCategoryMultipliers(): Promise<CategoryMultiplier[]>;
  getCategoryMultiplier(category: number): Promise<CategoryMultiplier | undefined>;
  createCategoryMultiplier(data: InsertCategoryMultiplier): Promise<CategoryMultiplier>;
  
  // Projects methods
  getAllProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(data: InsertProject): Promise<Project>;
  updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string): Promise<boolean>;
  getDemoProject(): Promise<Project | undefined>;
  
  // Project Calculations methods
  getProjectCalculations(projectId: string): Promise<ProjectCalculation | undefined>;
  createProjectCalculations(data: InsertProjectCalculation): Promise<ProjectCalculation>;
  updateProjectCalculations(projectId: string, data: InsertProjectCalculation): Promise<ProjectCalculation | undefined>;
  
  // Project Fees methods
  getProjectFees(projectId: string): Promise<ProjectFee[]>;
  createProjectFee(data: InsertProjectFee): Promise<ProjectFee>;
  deleteProjectFees(projectId: string): Promise<boolean>;
  
  // Project Hours methods
  getProjectHours(projectId: string): Promise<ProjectHours[]>;
  createProjectHours(data: InsertProjectHours): Promise<ProjectHours>;
  deleteProjectHours(projectId: string): Promise<boolean>;
  
  // Building data methods
  getAllBuildingUses(): Promise<string[]>;
  getBuildingTypesByUse(buildingUse: string): Promise<string[]>;
  getBuildingTiersByType(buildingType: string): Promise<string[]>;
  getBuildingTypeCategory(buildingType: string): Promise<number | undefined>;
  getBuildingCostData(buildingType: string, buildingTier: string): Promise<BuildingCostData | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Budget Calculator methods
  async getAllBuildingTypes(): Promise<string[]> {
    const results = await db
      .selectDistinct({ buildingType: buildingCostData.buildingType })
      .from(buildingCostData);
    return results.map(r => r.buildingType).sort();
  }

  async getTiersByBuildingType(buildingType: string): Promise<number[]> {
    const results = await db
      .selectDistinct({ buildingTier: buildingCostData.buildingTier })
      .from(buildingCostData)
      .where(eq(buildingCostData.buildingType, buildingType));
    // Map tier names to numbers: Low=1, Mid=2, High=3
    const tierMap: Record<string, number> = { 'Low': 1, 'Mid': 2, 'High': 3 };
    return results
      .map((r: { buildingTier: string }) => tierMap[r.buildingTier] || 2)
      .filter((v: number, i: number, a: number[]) => a.indexOf(v) === i)
      .sort();
  }

  async getBuildingCostRange(buildingType: string, tier: number): Promise<BuildingCostRange | undefined> {
    // Map tier number to text: 1=Low, 2=Mid, 3=High
    const tierText = tier === 1 ? 'Low' : tier === 2 ? 'Mid' : 'High';
    const [result] = await db
      .select()
      .from(buildingCostData)
      .where(
        and(
          eq(buildingCostData.buildingType, buildingType),
<<<<<<< HEAD
          eq(buildingCostData.buildingTier, tierText)
        )
      );
    
    if (!result) return undefined;
    
    // Convert to BuildingCostRange format
    return {
      buildingType: result.buildingType,
      tier,
      allInMin: parseInt(result.shellNewMin) + parseInt(result.interiorNewMin) + parseInt(result.outdoorNewMin),
      allInMax: parseInt(result.shellNewMax) + parseInt(result.interiorNewMax) + parseInt(result.outdoorNewMax),
      archShare: (parseFloat(result.projectShellShare) / 100).toString(),
      intShare: (parseFloat(result.projectInteriorShare) / 100).toString(),
      landShare: (parseFloat(result.projectLandscapeShare) / 100).toString()
    };
  }

  async getEngineeringCosts(buildingType: string, tier: number): Promise<EngineeringCost[]> {
    // This legacy method returns empty array since we now use getEngineeringCostData
    // which provides engineering percentages from building_cost_data_v6
    // TODO: Remove this method and update any callers to use new data structure
    return [];
=======
          eq(buildingCostData.buildingTier, tierString)
        )
      );
    
    if (!data) return undefined;
    
    // Calculate all-in min/max values from the component costs
    const allInMin = Number(data.shellNewMin) + Number(data.interiorNewMin) + Number(data.outdoorNewMin);
    const allInMax = Number(data.shellNewMax) + Number(data.interiorNewMax) + Number(data.outdoorNewMax);
    
    return {
      buildingType: data.buildingType,
      tier: tier,
      allInMin: allInMin,
      allInMax: allInMax,
      archShare: data.projectShellShare,
      intShare: data.projectInteriorShare,
      landShare: data.projectLandscapeShare
    } as BuildingCostRange;
  }

  async getEngineeringCosts(buildingType: string, tier: number): Promise<EngineeringCost[]> {
    // For now, return engineering cost data derived from buildingCostData
    const tierString = `Tier ${tier}`;
    const [data] = await db
      .select()
      .from(buildingCostData)
      .where(
        and(
          eq(buildingCostData.buildingType, buildingType),
          eq(buildingCostData.buildingTier, tierString)
        )
      );
      
    if (!data) return [];
    
    // Create engineering cost entries from the design shares
    const costs: EngineeringCost[] = [];
    
    if (Number(data.structuralDesignShare) > 0) {
      costs.push({
        buildingType,
        tier,
        category: 'Structural',
        percentAvg: (Number(data.structuralDesignShare) / 100).toFixed(3),
        percentMin: data.structuralDesignShare,
        percentMax: data.structuralDesignShare,
        costMinPsf: data.structuralDesignShare,
        costMaxPsf: data.structuralDesignShare
      } as EngineeringCost);
    }
    
    if (Number(data.civilDesignShare) > 0) {
      costs.push({
        buildingType,
        tier,
        category: 'Civil & Site',
        percentAvg: (Number(data.civilDesignShare) / 100).toFixed(3),
        percentMin: data.civilDesignShare,
        percentMax: data.civilDesignShare,
        costMinPsf: data.civilDesignShare,
        costMaxPsf: data.civilDesignShare
      } as EngineeringCost);
    }
    
    if (Number(data.mechanicalDesignShare) > 0) {
      costs.push({
        buildingType,
        tier,
        category: 'Mechanical',
        percentAvg: (Number(data.mechanicalDesignShare) / 100).toFixed(3),
        percentMin: data.mechanicalDesignShare,
        percentMax: data.mechanicalDesignShare,
        costMinPsf: data.mechanicalDesignShare,
        costMaxPsf: data.mechanicalDesignShare
      } as EngineeringCost);
    }
    
    if (Number(data.electricalDesignShare) > 0) {
      costs.push({
        buildingType,
        tier,
        category: 'Electrical',
        percentAvg: (Number(data.electricalDesignShare) / 100).toFixed(3),
        percentMin: data.electricalDesignShare,
        percentMax: data.electricalDesignShare,
        costMinPsf: data.electricalDesignShare,
        costMaxPsf: data.electricalDesignShare
      } as EngineeringCost);
    }
    
    if (Number(data.plumbingDesignShare) > 0) {
      costs.push({
        buildingType,
        tier,
        category: 'Plumbing',
        percentAvg: (Number(data.plumbingDesignShare) / 100).toFixed(3),
        percentMin: data.plumbingDesignShare,
        percentMax: data.plumbingDesignShare,
        costMinPsf: data.plumbingDesignShare,
        costMaxPsf: data.plumbingDesignShare
      } as EngineeringCost);
    }
    
    if (Number(data.telecommunicationDesignShare) > 0) {
      costs.push({
        buildingType,
        tier,
        category: 'Low-Voltage',
        percentAvg: (Number(data.telecommunicationDesignShare) / 100).toFixed(3),
        percentMin: data.telecommunicationDesignShare,
        percentMax: data.telecommunicationDesignShare,
        costMinPsf: data.telecommunicationDesignShare,
        costMaxPsf: data.telecommunicationDesignShare
      } as EngineeringCost);
    }
    
    return costs;
>>>>>>> main
  }

  // Hours Leverage methods
  async getAllHoursLeverage(): Promise<HoursLeverage[]> {
    const results = await db.select().from(hoursLeverage);
    return results;
  }

  async createHoursLeverage(data: InsertHoursLeverage): Promise<HoursLeverage> {
    const [result] = await db.insert(hoursLeverage).values(data).returning();
    return result;
  }

  async updateHoursLeverage(id: string, data: Partial<InsertHoursLeverage>): Promise<HoursLeverage | undefined> {
    const [result] = await db
      .update(hoursLeverage)
      .set(data)
      .where(eq(hoursLeverage.id, id))
      .returning();
    return result || undefined;
  }

  async deleteHoursLeverage(id: string): Promise<boolean> {
    const result = await db.delete(hoursLeverage).where(eq(hoursLeverage.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getHoursLeverageByPhase(phase: string): Promise<HoursLeverage | undefined> {
    const [result] = await db
      .select()
      .from(hoursLeverage)
      .where(eq(hoursLeverage.phase, phase));
    return result || undefined;
  }

  // Labor Overhead methods
  async getAllLaborOverhead(): Promise<LaborOverhead[]> {
    const results = await db.select().from(laborOverhead);
    return results;
  }

  async createLaborOverhead(data: InsertLaborOverhead): Promise<LaborOverhead> {
    const [result] = await db.insert(laborOverhead).values(data).returning();
    return result;
  }

  async updateLaborOverhead(role: string, data: Partial<InsertLaborOverhead>): Promise<LaborOverhead | undefined> {
    const [result] = await db
      .update(laborOverhead)
      .set(data)
      .where(eq(laborOverhead.role, role))
      .returning();
    return result || undefined;
  }

  // Hourly Rates methods
  async getAllHourlyRates(): Promise<HourlyRates[]> {
    const results = await db.select().from(hourlyRates);
    return results;
  }

  async createHourlyRates(data: InsertHourlyRates): Promise<HourlyRates> {
    const [result] = await db.insert(hourlyRates).values(data).returning();
    return result;
  }

  async updateHourlyRates(role: string, data: Partial<InsertHourlyRates>): Promise<HourlyRates | undefined> {
    const [result] = await db
      .update(hourlyRates)
      .set(data)
      .where(eq(hourlyRates.role, role))
      .returning();
    return result || undefined;
  }

  // Fee Config methods
  async getAllFeeConfig(): Promise<FeeConfig[]> {
    const results = await db.select().from(feeConfig);
    return results;
  }

  async getFeeConfigValue(key: string): Promise<number | undefined> {
    const [result] = await db
      .select()
      .from(feeConfig)
      .where(eq(feeConfig.settingKey, key));
    return result ? parseFloat(result.settingValue) : undefined;
  }

  async updateFeeConfig(key: string, value: number): Promise<FeeConfig | undefined> {
    const [result] = await db
      .update(feeConfig)
      .set({ settingValue: value.toString() })
      .where(eq(feeConfig.settingKey, key))
      .returning();
    return result || undefined;
  }
  
  // Category Multipliers methods
  async getAllCategoryMultipliers(): Promise<CategoryMultiplier[]> {
<<<<<<< HEAD
    const results = await db.select().from(categoryMultipliers);
    return results;
  }
  
  async getCategoryMultiplier(category: number): Promise<CategoryMultiplier | undefined> {
    const [result] = await db
      .select()
      .from(categoryMultipliers)
      .where(eq(categoryMultipliers.category, category));
    return result || undefined;
=======
    // Get distinct categories from building cost data
    const results = await db
      .selectDistinct({ category: buildingCostData.category })
      .from(buildingCostData)
      .orderBy(buildingCostData.category);
    
    // Map categories with their descriptions and multipliers
    const categoryDescriptions: Record<number, { description: string, multiplier: number }> = {
      1: { description: "Simple project - basic complexity", multiplier: 1.0 },
      2: { description: "Low complexity - minimal coordination required", multiplier: 1.05 },
      3: { description: "Standard complexity - typical project requirements", multiplier: 1.1 },
      4: { description: "High complexity - significant coordination needed", multiplier: 1.2 },
      5: { description: "Very high complexity - extensive coordination and specialized requirements", multiplier: 1.3 }
    };
    
    // Format the response to match CategoryMultiplier type
    return results.map(row => ({
      id: `category-${row.category}`,
      category: row.category,
      multiplier: categoryDescriptions[row.category]?.multiplier.toFixed(2) || "1.00",
      description: categoryDescriptions[row.category]?.description || `Category ${row.category}`
    }));
  }
  
  async getCategoryMultiplier(category: number): Promise<CategoryMultiplier | undefined> {
    // Check if category exists in building cost data
    const [result] = await db
      .selectDistinct({ category: buildingCostData.category })
      .from(buildingCostData)
      .where(eq(buildingCostData.category, category));
    
    if (!result) return undefined;
    
    // Map categories with their descriptions and multipliers
    const categoryDescriptions: Record<number, { description: string, multiplier: number }> = {
      1: { description: "Simple project - basic complexity", multiplier: 1.0 },
      2: { description: "Low complexity - minimal coordination required", multiplier: 1.05 },
      3: { description: "Standard complexity - typical project requirements", multiplier: 1.1 },
      4: { description: "High complexity - significant coordination needed", multiplier: 1.2 },
      5: { description: "Very high complexity - extensive coordination and specialized requirements", multiplier: 1.3 }
    };
    
    return {
      id: `category-${result.category}`,
      category: result.category,
      multiplier: categoryDescriptions[result.category]?.multiplier.toFixed(2) || "1.00",
      description: categoryDescriptions[result.category]?.description || `Category ${result.category}`
    };
>>>>>>> main
  }
  
  async createCategoryMultiplier(data: InsertCategoryMultiplier): Promise<CategoryMultiplier> {
    const [result] = await db.insert(categoryMultipliers).values(data).returning();
    return result;
  }
  
  // Projects methods
  async getAllProjects(): Promise<Project[]> {
    const results = await db.select().from(projects).orderBy(projects.createdAt);
    return results;
  }
  
  async getProject(id: string): Promise<Project | undefined> {
    const [result] = await db.select().from(projects).where(eq(projects.id, id));
    return result || undefined;
  }
  
  async createProject(data: InsertProject): Promise<Project> {
    const [result] = await db.insert(projects).values(data).returning();
    return result;
  }
  
  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const [result] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result || undefined;
  }
  
  async deleteProject(id: string): Promise<boolean> {
    // Delete related data first
    await db.delete(projectHours).where(eq(projectHours.projectId, id));
    await db.delete(projectFees).where(eq(projectFees.projectId, id));
    await db.delete(projectCalculations).where(eq(projectCalculations.projectId, id));
    // Delete the project
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  
  async getDemoProject(): Promise<Project | undefined> {
    const [result] = await db.select().from(projects).where(eq(projects.isDemo, true));
    return result || undefined;
  }
  
  // Project Calculations methods
  async getProjectCalculations(projectId: string): Promise<ProjectCalculation | undefined> {
    const [result] = await db
      .select()
      .from(projectCalculations)
      .where(eq(projectCalculations.projectId, projectId));
    return result || undefined;
  }
  
  async createProjectCalculations(data: InsertProjectCalculation): Promise<ProjectCalculation> {
    const [result] = await db.insert(projectCalculations).values(data).returning();
    return result;
  }
  
  async updateProjectCalculations(projectId: string, data: InsertProjectCalculation): Promise<ProjectCalculation | undefined> {
    // Delete existing calculations
    await db.delete(projectCalculations).where(eq(projectCalculations.projectId, projectId));
    // Insert new calculations
    const [result] = await db.insert(projectCalculations).values(data).returning();
    return result || undefined;
  }
  
  // Project Fees methods
  async getProjectFees(projectId: string): Promise<ProjectFee[]> {
    const results = await db
      .select()
      .from(projectFees)
      .where(eq(projectFees.projectId, projectId));
    return results;
  }
  
  async createProjectFee(data: InsertProjectFee): Promise<ProjectFee> {
    const [result] = await db.insert(projectFees).values(data).returning();
    return result;
  }
  
  async deleteProjectFees(projectId: string): Promise<boolean> {
    const result = await db.delete(projectFees).where(eq(projectFees.projectId, projectId));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Project Hours methods
  async getProjectHours(projectId: string): Promise<ProjectHours[]> {
    const results = await db
      .select()
      .from(projectHours)
      .where(eq(projectHours.projectId, projectId));
    return results;
  }
  
  async createProjectHours(data: InsertProjectHours): Promise<ProjectHours> {
    const [result] = await db.insert(projectHours).values(data).returning();
    return result;
  }
  
  async deleteProjectHours(projectId: string): Promise<boolean> {
    const result = await db.delete(projectHours).where(eq(projectHours.projectId, projectId));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Building data methods
<<<<<<< HEAD
=======
  async getBuildingTypeCategory(buildingType: string): Promise<number | undefined> {
    // Get the category for a specific building type from building cost data
    const [result] = await db
      .selectDistinct({ category: buildingCostData.category })
      .from(buildingCostData)
      .where(eq(buildingCostData.buildingType, buildingType));
    
    return result?.category;
  }

>>>>>>> main
  async getAllBuildingUses(): Promise<string[]> {
    // Get building uses from the new comprehensive database
    const results = await db
      .selectDistinct({ buildingUse: buildingCostData.buildingUse })
      .from(buildingCostData);
    
<<<<<<< HEAD
    return results.map((r: { buildingUse: string }) => r.buildingUse).filter((use: string) => use !== null);
=======
    return results.map(r => r.buildingUse).filter(use => use !== null);
>>>>>>> main
  }
  
  async getBuildingTypesByUse(buildingUse: string): Promise<string[]> {
    // Get building types from the new comprehensive database
    const results = await db
      .selectDistinct({ buildingType: buildingCostData.buildingType })
      .from(buildingCostData)
      .where(eq(buildingCostData.buildingUse, buildingUse));
    
<<<<<<< HEAD
    return results.map((r: { buildingType: string }) => r.buildingType).filter((type: string) => type !== null);
=======
    return results.map(r => r.buildingType).filter(type => type !== null);
>>>>>>> main
  }
  
  async getBuildingTiersByType(buildingType: string): Promise<string[]> {
    // Get available tiers from the new comprehensive database
    const results = await db
      .selectDistinct({ buildingTier: buildingCostData.buildingTier })
      .from(buildingCostData)
      .where(eq(buildingCostData.buildingType, buildingType));
    
<<<<<<< HEAD
    return results.map((r: { buildingTier: string }) => r.buildingTier).filter((tier: string) => tier !== null);
=======
    return results.map(r => r.buildingTier).filter(tier => tier !== null);
>>>>>>> main
  }
  
  async getBuildingCostData(buildingType: string, buildingTier: string): Promise<BuildingCostData | undefined> {
    const [result] = await db
      .select()
      .from(buildingCostData)
      .where(
        and(
          eq(buildingCostData.buildingType, buildingType),
          eq(buildingCostData.buildingTier, buildingTier)
        )
      );
    return result || undefined;
  }
}

export const storage = new DatabaseStorage();
