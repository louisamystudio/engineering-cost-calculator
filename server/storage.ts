import { 
  users, 
  type User, 
  type InsertUser,
  buildingCostRangesView,
  engineeringCostsView,
  buildingTypesView,
  type BuildingCostRange,
  type EngineeringCost,
  type BuildingTypeView,
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
  buildingTypes,
  type BuildingTypes,
  engineeringCosts,
  type EngineeringCosts,
  buildingCost2025Parcial,
  type BuildingCost,
  type ComprehensiveBuildingCost
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
  getBuildingCostData(buildingType: string, tier: number): Promise<BuildingCost | undefined>;
  getComprehensiveBuildingCostData(buildingType: string, buildingTier: string): Promise<ComprehensiveBuildingCost | undefined>;
  getEngineeringCostsByDiscipline(buildingType: string, tier: number, discipline: string): Promise<EngineeringCosts | undefined>;
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
      .selectDistinct({ buildingType: buildingCostRangesView.buildingType })
      .from(buildingCostRangesView);
    return results.map(r => r.buildingType);
  }

  async getTiersByBuildingType(buildingType: string): Promise<number[]> {
    const results = await db
      .selectDistinct({ tier: buildingCostRangesView.tier })
      .from(buildingCostRangesView)
      .where(eq(buildingCostRangesView.buildingType, buildingType));
    return results.map(r => r.tier).sort();
  }

  async getBuildingCostRange(buildingType: string, tier: number): Promise<BuildingCostRange | undefined> {
    const [result] = await db
      .select()
      .from(buildingCostRangesView)
      .where(
        and(
          eq(buildingCostRangesView.buildingType, buildingType),
          eq(buildingCostRangesView.tier, tier)
        )
      );
    return result || undefined;
  }

  async getEngineeringCosts(buildingType: string, tier: number): Promise<EngineeringCost[]> {
    const results = await db
      .select()
      .from(engineeringCostsView)
      .where(
        and(
          eq(engineeringCostsView.buildingType, buildingType),
          eq(engineeringCostsView.tier, tier)
        )
      );
    return results;
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
    const results = await db.select().from(categoryMultipliers);
    return results;
  }
  
  async getCategoryMultiplier(category: number): Promise<CategoryMultiplier | undefined> {
    const [result] = await db
      .select()
      .from(categoryMultipliers)
      .where(eq(categoryMultipliers.category, category));
    return result || undefined;
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
  async getAllBuildingUses(): Promise<string[]> {
    const results = await db
      .selectDistinct({ buildingUse: buildingTypes.buildingUse })
      .from(buildingTypes);
    return results.map(r => r.buildingUse);
  }
  
  async getBuildingTypesByUse(buildingUse: string): Promise<string[]> {
    const results = await db
      .selectDistinct({ buildingType: buildingTypes.buildingType })
      .from(buildingTypes)
      .where(eq(buildingTypes.buildingUse, buildingUse));
    return results.map(r => r.buildingType);
  }
  
  async getBuildingTiersByType(buildingType: string): Promise<string[]> {
    // Map building types to their available tiers
    const tierMap: Record<string, string[]> = {
      'High-End Custom Residential': ['High-End Custom Residential'],
      'Mid-Range Standard Residential': ['Mid-Range Standard Residential'],
      'Hospitality (Hotel/Resort)': ['Hospitality (Hotel/Resort)', 'Hospitality 4-Star'],
      'Commercial / Mixed-Use': ['Commercial / Mixed-Use', 'Commercial Class A'],
    };
    return tierMap[buildingType] || [buildingType];
  }
  
  async getBuildingCostData(buildingType: string, tier: number): Promise<BuildingCost | undefined> {
    // Map tier number to tier text
    const tierMap: Record<number, string> = {
      1: 'Low-end',
      2: 'Mid', 
      3: 'High-end'
    };
    
    const tierText = tierMap[tier] || 'Mid';
    
    const [result] = await db
      .select()
      .from(buildingCost2025Parcial)
      .where(
        and(
          eq(buildingCost2025Parcial.buildingType, buildingType),
          eq(buildingCost2025Parcial.buildingTier, tierText)
        )
      );
    return result || undefined;
  }
  
  async getComprehensiveBuildingCostData(buildingType: string, buildingTier: string): Promise<ComprehensiveBuildingCost | undefined> {
    const [result] = await db
      .select()
      .from(buildingCost2025Parcial)
      .where(
        and(
          eq(buildingCost2025Parcial.buildingType, buildingType),
          eq(buildingCost2025Parcial.buildingTier, buildingTier)
        )
      );
    return result || undefined;
  }
  
  async getEngineeringCostsByDiscipline(buildingType: string, tier: number, discipline: string): Promise<EngineeringCosts | undefined> {
    const [result] = await db
      .select()
      .from(engineeringCosts)
      .where(
        and(
          eq(engineeringCosts.buildingType, buildingType),
          eq(engineeringCosts.numericTier, tier),
          eq(engineeringCosts.categorySimple, discipline)
        )
      );
    return result || undefined;
  }
}

export const storage = new DatabaseStorage();
