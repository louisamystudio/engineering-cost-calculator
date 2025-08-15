import { 
  users, 
  type User, 
  type InsertUser,
  buildingCostRangesView,
  engineeringCostsView,
  buildingTypesView,
  type BuildingCostRange,
  type EngineeringCost,
  type BuildingTypeView
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
}

export const storage = new DatabaseStorage();
