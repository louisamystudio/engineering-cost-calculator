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
  type BuildingCost
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import fs from "fs";
import path from "path";
import { randomUUID } from "node:crypto";

async function getDb() {
  const mod = await import("./db");
  return mod.db as any;
}

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
  getEngineeringCostsByDiscipline(buildingType: string, tier: number, discipline: string): Promise<EngineeringCosts | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const db = await getDb();
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const db = await getDb();
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Budget Calculator methods
  async getAllBuildingTypes(): Promise<string[]> {
    const db = await getDb();
    const results = await db
      .selectDistinct({ buildingType: buildingCostRangesView.buildingType })
      .from(buildingCostRangesView);
    return results.map(r => r.buildingType);
  }

  async getTiersByBuildingType(buildingType: string): Promise<number[]> {
    const db = await getDb();
    const results = await db
      .selectDistinct({ tier: buildingCostRangesView.tier })
      .from(buildingCostRangesView)
      .where(eq(buildingCostRangesView.buildingType, buildingType));
    return results.map(r => r.tier).sort();
  }

  async getBuildingCostRange(buildingType: string, tier: number): Promise<BuildingCostRange | undefined> {
    const db = await getDb();
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
    const db = await getDb();
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
    const db = await getDb();
    const results = await db.select().from(hoursLeverage);
    return results;
  }

  async createHoursLeverage(data: InsertHoursLeverage): Promise<HoursLeverage> {
    const db = await getDb();
    const [result] = await db.insert(hoursLeverage).values(data).returning();
    return result;
  }

  async updateHoursLeverage(id: string, data: Partial<InsertHoursLeverage>): Promise<HoursLeverage | undefined> {
    const db = await getDb();
    const [result] = await db
      .update(hoursLeverage)
      .set(data)
      .where(eq(hoursLeverage.id, id))
      .returning();
    return result || undefined;
  }

  async deleteHoursLeverage(id: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(hoursLeverage).where(eq(hoursLeverage.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getHoursLeverageByPhase(phase: string): Promise<HoursLeverage | undefined> {
    const db = await getDb();
    const [result] = await db
      .select()
      .from(hoursLeverage)
      .where(eq(hoursLeverage.phase, phase));
    return result || undefined;
  }

  // Labor Overhead methods
  async getAllLaborOverhead(): Promise<LaborOverhead[]> {
    const db = await getDb();
    const results = await db.select().from(laborOverhead);
    return results;
  }

  async createLaborOverhead(data: InsertLaborOverhead): Promise<LaborOverhead> {
    const db = await getDb();
    const [result] = await db.insert(laborOverhead).values(data).returning();
    return result;
  }

  async updateLaborOverhead(role: string, data: Partial<InsertLaborOverhead>): Promise<LaborOverhead | undefined> {
    const db = await getDb();
    const [result] = await db
      .update(laborOverhead)
      .set(data)
      .where(eq(laborOverhead.role, role))
      .returning();
    return result || undefined;
  }

  // Hourly Rates methods
  async getAllHourlyRates(): Promise<HourlyRates[]> {
    const db = await getDb();
    const results = await db.select().from(hourlyRates);
    return results;
  }

  async createHourlyRates(data: InsertHourlyRates): Promise<HourlyRates> {
    const db = await getDb();
    const [result] = await db.insert(hourlyRates).values(data).returning();
    return result;
  }

  async updateHourlyRates(role: string, data: Partial<InsertHourlyRates>): Promise<HourlyRates | undefined> {
    const db = await getDb();
    const [result] = await db
      .update(hourlyRates)
      .set(data)
      .where(eq(hourlyRates.role, role))
      .returning();
    return result || undefined;
  }

  // Fee Config methods
  async getAllFeeConfig(): Promise<FeeConfig[]> {
    const db = await getDb();
    const results = await db.select().from(feeConfig);
    return results;
  }

  async getFeeConfigValue(key: string): Promise<number | undefined> {
    const db = await getDb();
    const [result] = await db
      .select()
      .from(feeConfig)
      .where(eq(feeConfig.settingKey, key));
    return result ? parseFloat(result.settingValue) : undefined;
  }

  async updateFeeConfig(key: string, value: number): Promise<FeeConfig | undefined> {
    const db = await getDb();
    const [result] = await db
      .update(feeConfig)
      .set({ settingValue: value.toString() })
      .where(eq(feeConfig.settingKey, key))
      .returning();
    return result || undefined;
  }
  
  // Category Multipliers methods
  async getAllCategoryMultipliers(): Promise<CategoryMultiplier[]> {
    const db = await getDb();
    const results = await db.select().from(categoryMultipliers);
    return results;
  }
  
  async getCategoryMultiplier(category: number): Promise<CategoryMultiplier | undefined> {
    const db = await getDb();
    const [result] = await db
      .select()
      .from(categoryMultipliers)
      .where(eq(categoryMultipliers.category, category));
    return result || undefined;
  }
  
  async createCategoryMultiplier(data: InsertCategoryMultiplier): Promise<CategoryMultiplier> {
    const db = await getDb();
    const [result] = await db.insert(categoryMultipliers).values(data).returning();
    return result;
  }
  
  // Projects methods
  async getAllProjects(): Promise<Project[]> {
    const db = await getDb();
    const results = await db.select().from(projects).orderBy(projects.createdAt);
    return results;
  }
  
  async getProject(id: string): Promise<Project | undefined> {
    const db = await getDb();
    const [result] = await db.select().from(projects).where(eq(projects.id, id));
    return result || undefined;
  }
  
  async createProject(data: InsertProject): Promise<Project> {
    const db = await getDb();
    const [result] = await db.insert(projects).values(data).returning();
    return result;
  }
  
  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const db = await getDb();
    const [result] = await db
      .update(projects)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return result || undefined;
  }
  
  async deleteProject(id: string): Promise<boolean> {
    const db = await getDb();
    // Delete related data first
    await db.delete(projectHours).where(eq(projectHours.projectId, id));
    await db.delete(projectFees).where(eq(projectFees.projectId, id));
    await db.delete(projectCalculations).where(eq(projectCalculations.projectId, id));
    // Delete the project
    const result = await db.delete(projects).where(eq(projects.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  
  async getDemoProject(): Promise<Project | undefined> {
    const db = await getDb();
    const [result] = await db.select().from(projects).where(eq(projects.isDemo, true));
    return result || undefined;
  }
  
  // Project Calculations methods
  async getProjectCalculations(projectId: string): Promise<ProjectCalculation | undefined> {
    const db = await getDb();
    const [result] = await db
      .select()
      .from(projectCalculations)
      .where(eq(projectCalculations.projectId, projectId));
    return result || undefined;
  }
  
  async createProjectCalculations(data: InsertProjectCalculation): Promise<ProjectCalculation> {
    const db = await getDb();
    const [result] = await db.insert(projectCalculations).values(data).returning();
    return result;
  }
  
  async updateProjectCalculations(projectId: string, data: InsertProjectCalculation): Promise<ProjectCalculation | undefined> {
    const db = await getDb();
    // Delete existing calculations
    await db.delete(projectCalculations).where(eq(projectCalculations.projectId, projectId));
    // Insert new calculations
    const [result] = await db.insert(projectCalculations).values(data).returning();
    return result || undefined;
  }
  
  // Project Fees methods
  async getProjectFees(projectId: string): Promise<ProjectFee[]> {
    const db = await getDb();
    const results = await db
      .select()
      .from(projectFees)
      .where(eq(projectFees.projectId, projectId));
    return results;
  }
  
  async createProjectFee(data: InsertProjectFee): Promise<ProjectFee> {
    const db = await getDb();
    const [result] = await db.insert(projectFees).values(data).returning();
    return result;
  }
  
  async deleteProjectFees(projectId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(projectFees).where(eq(projectFees.projectId, projectId));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Project Hours methods
  async getProjectHours(projectId: string): Promise<ProjectHours[]> {
    const db = await getDb();
    const results = await db
      .select()
      .from(projectHours)
      .where(eq(projectHours.projectId, projectId));
    return results;
  }
  
  async createProjectHours(data: InsertProjectHours): Promise<ProjectHours> {
    const db = await getDb();
    const [result] = await db.insert(projectHours).values(data).returning();
    return result;
  }
  
  async deleteProjectHours(projectId: string): Promise<boolean> {
    const db = await getDb();
    const result = await db.delete(projectHours).where(eq(projectHours.projectId, projectId));
    return (result.rowCount ?? 0) > 0;
  }
  
  // Building data methods
  async getAllBuildingUses(): Promise<string[]> {
    const db = await getDb();
    const results = await db
      .selectDistinct({ buildingUse: buildingTypes.buildingUse })
      .from(buildingTypes);
    return results.map(r => r.buildingUse);
  }
  
  async getBuildingTypesByUse(buildingUse: string): Promise<string[]> {
    const db = await getDb();
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
    const [result] = await db
      .select()
      .from(buildingCost2025Parcial)
      .where(
        and(
          eq(buildingCost2025Parcial.buildingType, buildingType),
          eq(buildingCost2025Parcial.tier, tier)
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

// Simple JSON storage implementation (subset for read endpoints)
class JsonStorage implements IStorage {
  private baseDir = path.resolve(import.meta.dirname, "..", "database");

  private async load<T = any>(name: string): Promise<T> {
    const file = path.resolve(this.baseDir, name);
    const raw = await fs.promises.readFile(file, "utf-8");
    return JSON.parse(raw);
  }
  private async loadOrEmpty<T = any>(name: string, fallback: T): Promise<T> {
    const file = path.resolve(this.baseDir, name);
    if (!fs.existsSync(file)) return fallback;
    return this.load<T>(name);
  }
  private async save<T = any>(name: string, data: T): Promise<void> {
    const file = path.resolve(this.baseDir, name);
    await fs.promises.writeFile(file, JSON.stringify(data, null, 2), "utf-8");
  }

  async getUser(_id: string): Promise<User | undefined> { return undefined; }
  async getUserByUsername(_username: string): Promise<User | undefined> { return undefined; }
  async createUser(_user: InsertUser): Promise<User> { throw new Error("Not implemented"); }

  async getAllBuildingTypes(): Promise<string[]> {
    const rows: any[] = await this.load("Building-Cost-2025-Parcial.json");
    return Array.from(new Set(rows.map(r => r.building_type)));
  }
  async getTiersByBuildingType(buildingType: string): Promise<number[]> {
    const rows: any[] = await this.load("Building-Cost-2025-Parcial.json");
    return Array.from(new Set(rows.filter(r => r.building_type === buildingType).map(r => r.tier))).sort();
  }
  async getBuildingCostRange(buildingType: string, tier: number): Promise<BuildingCostRange | undefined> {
    const rows: any[] = await this.load("Building-Cost-2025-Parcial.json");
    const r = rows.find(x => x.building_type === buildingType && x.tier === tier);
    if (!r) return undefined;
    return {
      buildingType: r.building_type,
      tier: r.tier,
      allInMin: r.all_in_min,
      allInMax: r.all_in_max,
      archShare: r.arch_share,
      intShare: r.int_share,
      landShare: r.land_share,
    } as unknown as BuildingCostRange;
  }
  async getEngineeringCosts(buildingType: string, tier: number): Promise<EngineeringCost[]> {
    const rows: any[] = await this.load("Engineering_Costs.json");
    return rows
      .filter(r => r.building_type === buildingType && r.numeric_tier === tier)
      .map(r => ({
        buildingType: r.building_type,
        tier: r.numeric_tier,
        category: r.category_simple,
        percentAvg: r.percent_avg,
        percentMin: r.percent_min,
        percentMax: r.percent_max,
        costMinPsf: r.cost_min_psf,
        costMaxPsf: r.cost_max_psf,
      } as unknown as EngineeringCost));
  }

  async getAllHoursLeverage(): Promise<HoursLeverage[]> {
    const rows: any[] = await this.load("hours_leverage.json");
    return rows.map(r => ({
      id: r.id,
      phase: r.phase,
      hoursPct: r.hours_pct,
      adminPct: r.admin_pct,
      designer1Pct: r.designer1_pct,
      designer2Pct: r.designer2_pct,
      architectPct: r.architect_pct,
      engineerPct: r.engineer_pct,
      principalPct: r.principal_pct,
      totalPercent: r.total_percent,
    }));
  }
  async createHoursLeverage(_data: InsertHoursLeverage): Promise<HoursLeverage> { throw new Error("Not implemented"); }
  async updateHoursLeverage(_id: string, _data: Partial<InsertHoursLeverage>): Promise<HoursLeverage | undefined> { return undefined; }
  async deleteHoursLeverage(_id: string): Promise<boolean> { return false; }
  async getHoursLeverageByPhase(phase: string): Promise<HoursLeverage | undefined> {
    const all = await this.getAllHoursLeverage();
    return all.find(r => r.phase === phase);
  }

  async getAllLaborOverhead(): Promise<LaborOverhead[]> {
    const rows: any[] = await this.load("labor_overhead.json");
    return rows.map(r => ({ role: r.role, laborAnnual: r.labor_overhead ?? r.labor_annual ?? r.labor, overheadAnnual: r.overhead_annual } as any));
  }
  async createLaborOverhead(_data: InsertLaborOverhead): Promise<LaborOverhead> { throw new Error("Not implemented"); }
  async updateLaborOverhead(_role: string, _data: Partial<InsertLaborOverhead>): Promise<LaborOverhead | undefined> { return undefined; }

  async getAllHourlyRates(): Promise<HourlyRates[]> {
    const rows: any[] = await this.load("hourly_rates.json");
    return rows.map(r => ({ role: r.role, louisAmyRate: r.louis_amy_rate, marketRate: r.market_rate } as any));
  }
  async createHourlyRates(_data: InsertHourlyRates): Promise<HourlyRates> { throw new Error("Not implemented"); }
  async updateHourlyRates(_role: string, _data: Partial<InsertHourlyRates>): Promise<HourlyRates | undefined> { return undefined; }

  async getAllFeeConfig(): Promise<FeeConfig[]> {
    const file = path.resolve(this.baseDir, "fee_config.json");
    if (!fs.existsSync(file)) {
      return [{ settingKey: "markup", settingValue: "0.30" } as any];
    }
    const rows: any[] = await this.load("fee_config.json");
    return rows.map(r => ({ settingKey: r.setting_key, settingValue: r.setting_value } as any));
  }
  async getFeeConfigValue(key: string): Promise<number | undefined> {
    const all = await this.getAllFeeConfig();
    const found = all.find(r => (r as any).settingKey === key);
    return found ? parseFloat((found as any).settingValue) : undefined;
  }
  async updateFeeConfig(_key: string, _value: number): Promise<FeeConfig | undefined> { throw new Error("Not implemented"); }

  async getAllCategoryMultipliers(): Promise<CategoryMultiplier[]> {
    const rows: any[] = await this.load("category_multipliers.json");
    return rows as any;
  }
  async getCategoryMultiplier(category: number): Promise<CategoryMultiplier | undefined> {
    const rows: any[] = await this.load("category_multipliers.json");
    return rows.find(r => r.category === category) as any;
  }
  async createCategoryMultiplier(_data: InsertCategoryMultiplier): Promise<CategoryMultiplier> { throw new Error("Not implemented"); }

  async getAllProjects(): Promise<Project[]> {
    return this.loadOrEmpty<Project[]>("projects.json", []);
  }
  async getProject(id: string): Promise<Project | undefined> {
    const rows = await this.getAllProjects();
    return rows.find(r => (r as any).id === id);
  }
  async createProject(data: InsertProject): Promise<Project> {
    const rows = await this.getAllProjects();
    const now = new Date().toISOString();
    const row: any = {
      id: randomUUID(),
      projectName: (data as any).projectName,
      buildingUse: (data as any).buildingUse,
      buildingType: (data as any).buildingType,
      buildingTier: (data as any).buildingTier,
      designLevel: (data as any).designLevel,
      category: (data as any).category,
      newBuildingArea: (data as any).newBuildingArea,
      existingBuildingArea: (data as any).existingBuildingArea,
      siteArea: (data as any).siteArea,
      historicMultiplier: (data as any).historicMultiplier ?? 1,
      remodelMultiplier: (data as any).remodelMultiplier ?? 0.5,
      createdAt: now,
      updatedAt: now,
      isDemo: (data as any).isDemo ?? false,
      newConstructionTargetCost: (data as any).newConstructionTargetCost ?? null,
      remodelTargetCost: (data as any).remodelTargetCost ?? null,
      shellShareOverride: (data as any).shellShareOverride ?? null,
      interiorShareOverride: (data as any).interiorShareOverride ?? null,
      landscapeShareOverride: (data as any).landscapeShareOverride ?? null,
    };
    rows.push(row);
    await this.save("projects.json", rows);
    return row as Project;
  }
  async updateProject(id: string, data: Partial<InsertProject>): Promise<Project | undefined> {
    const rows = await this.getAllProjects();
    const idx = rows.findIndex(r => (r as any).id === id);
    if (idx === -1) return undefined;
    const merged: any = { ...(rows[idx] as any), ...data, updatedAt: new Date().toISOString() };
    rows[idx] = merged as Project;
    await this.save("projects.json", rows);
    return merged as Project;
  }
  async deleteProject(id: string): Promise<boolean> {
    const rows = await this.getAllProjects();
    const next = rows.filter(r => (r as any).id !== id);
    await this.save("projects.json", next);
    await this.save("project_fees.json", (await this.loadOrEmpty<any[]>("project_fees.json", [])).filter(r => r.projectId !== id));
    await this.save("project_hours.json", (await this.loadOrEmpty<any[]>("project_hours.json", [])).filter(r => r.projectId !== id));
    await this.save("project_calculations.json", (await this.loadOrEmpty<any[]>("project_calculations.json", [])).filter(r => r.projectId !== id));
    return next.length !== rows.length;
  }
  async getDemoProject(): Promise<Project | undefined> {
    const rows = await this.getAllProjects();
    return rows.find(r => (r as any).isDemo) as any;
  }
  async getProjectCalculations(projectId: string): Promise<ProjectCalculation | undefined> {
    const rows = await this.loadOrEmpty<ProjectCalculation[]>("project_calculations.json", []);
    return rows.find(r => (r as any).projectId === projectId);
  }
  async createProjectCalculations(data: InsertProjectCalculation): Promise<ProjectCalculation> {
    const rows = await this.loadOrEmpty<any[]>("project_calculations.json", []);
    const row: any = { id: randomUUID(), ...data };
    rows.push(row);
    await this.save("project_calculations.json", rows);
    return row as ProjectCalculation;
  }
  async updateProjectCalculations(projectId: string, data: InsertProjectCalculation): Promise<ProjectCalculation | undefined> {
    let rows = await this.loadOrEmpty<any[]>("project_calculations.json", []);
    rows = rows.filter(r => r.projectId !== projectId);
    const row: any = { id: randomUUID(), ...data };
    rows.push(row);
    await this.save("project_calculations.json", rows);
    return row as ProjectCalculation;
  }
  async getProjectFees(projectId: string): Promise<ProjectFee[]> {
    const rows = await this.loadOrEmpty<ProjectFee[]>("project_fees.json", []);
    return rows.filter(r => (r as any).projectId === projectId);
  }
  async createProjectFee(data: InsertProjectFee): Promise<ProjectFee> {
    const rows = await this.loadOrEmpty<any[]>("project_fees.json", []);
    const row: any = { id: randomUUID(), ...data };
    rows.push(row);
    await this.save("project_fees.json", rows);
    return row as ProjectFee;
  }
  async deleteProjectFees(projectId: string): Promise<boolean> {
    const rows = await this.loadOrEmpty<any[]>("project_fees.json", []);
    const next = rows.filter(r => r.projectId !== projectId);
    await this.save("project_fees.json", next);
    return next.length !== rows.length;
  }
  async getProjectHours(projectId: string): Promise<ProjectHours[]> {
    const rows = await this.loadOrEmpty<ProjectHours[]>("project_hours.json", []);
    return rows.filter(r => (r as any).projectId === projectId);
  }
  async createProjectHours(data: InsertProjectHours): Promise<ProjectHours> {
    const rows = await this.loadOrEmpty<any[]>("project_hours.json", []);
    const row: any = { id: randomUUID(), ...data };
    rows.push(row);
    await this.save("project_hours.json", rows);
    return row as ProjectHours;
  }
  async deleteProjectHours(projectId: string): Promise<boolean> {
    const rows = await this.loadOrEmpty<any[]>("project_hours.json", []);
    const next = rows.filter(r => r.projectId !== projectId);
    await this.save("project_hours.json", next);
    return next.length !== rows.length;
  }

  async getAllBuildingUses(): Promise<string[]> {
    const rows: any[] = await this.load("Building_Types.json");
    return Array.from(new Set(rows.map(r => r.building_use)));
  }
  async getBuildingTypesByUse(buildingUse: string): Promise<string[]> {
    const rows: any[] = await this.load("Building_Types.json");
    return Array.from(new Set(rows.filter(r => r.building_use === buildingUse).map(r => r.building_type)));
  }
  async getBuildingTiersByType(buildingType: string): Promise<string[]> {
    const mapping: Record<string, string[]> = {
      'Hospitality (Hotel/Resort)': ['Hospitality (Hotel/Resort)', 'Hospitality 4-Star'],
      'Commercial / Mixed-Use': ['Commercial / Mixed-Use', 'Commercial Class A'],
    };
    return mapping[buildingType] || [buildingType];
  }
  async getBuildingCostData(buildingType: string, tier: number): Promise<BuildingCost | undefined> {
    const rows: any[] = await this.load("Building-Cost-2025-Parcial.json");
    const r = rows.find(x => x.building_type === buildingType && x.tier === tier);
    if (!r) return undefined;
    return {
      id: r.id,
      buildingType: r.building_type,
      tier: r.tier,
      shellMin: r.shell_min,
      shellMax: r.shell_max,
      allInMin: r.all_in_min,
      allInMax: r.all_in_max,
      archShare: r.arch_share,
      intShare: r.int_share,
      landShare: r.land_share,
    } as any;
  }
  async getEngineeringCostsByDiscipline(buildingType: string, tier: number, discipline: string): Promise<EngineeringCosts | undefined> {
    const rows: any[] = await this.load("Engineering_Costs.json");
    return rows.find(x => x.building_type === buildingType && x.numeric_tier === tier && x.category_simple === discipline) as any;
  }
}

const storageImpl: IStorage = (!process.env.DATABASE_URL || process.env.STORAGE === 'json')
  ? new JsonStorage()
  : new DatabaseStorage();

export const storage = storageImpl;
