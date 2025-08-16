import { sql } from "drizzle-orm";
import { pgTable, pgView, text, varchar, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const buildingCost2025Parcial = pgTable("Building-Cost-2025-Parcial", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buildingType: text("building_type").notNull(),
  tier: integer("tier").notNull(),
  shellMin: integer("shell_min").notNull(),
  shellMax: integer("shell_max").notNull(),
  allInMin: integer("all_in_min").notNull(),
  allInMax: integer("all_in_max").notNull(),
  archShare: decimal("arch_share", { precision: 5, scale: 2 }).notNull(),
  intShare: decimal("int_share", { precision: 5, scale: 2 }).notNull(),
  landShare: decimal("land_share", { precision: 5, scale: 2 }).notNull(),
});

export const insertBuildingCostSchema = createInsertSchema(buildingCost2025Parcial).omit({
  id: true,
});

export type InsertBuildingCost = z.infer<typeof insertBuildingCostSchema>;
export type BuildingCost = typeof buildingCost2025Parcial.$inferSelect;

export const engineeringCosts = pgTable("Engineering_Costs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull(),
  buildingType: text("building_type").notNull(),
  numericTier: integer("numeric_tier").notNull(),
  categorySimple: text("category_simple").notNull(),
  percentAvg: text("percent_avg").notNull(),
  percentMin: integer("percent_min").notNull(),
  percentMax: integer("percent_max").notNull(),
  costMinPSF: decimal("cost_min_psf", { precision: 8, scale: 2 }).notNull(),
  costMaxPSF: decimal("cost_max_psf", { precision: 8, scale: 2 }).notNull(),
});

export const insertEngineeringCostsSchema = createInsertSchema(engineeringCosts).omit({
  id: true,
});

export type InsertEngineeringCosts = z.infer<typeof insertEngineeringCostsSchema>;
export type EngineeringCosts = typeof engineeringCosts.$inferSelect;

export const buildingTypes = pgTable("Building_Types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  buildingUse: text("building_use").notNull(),
  buildingType: text("building_type").notNull(),
  feeCategory: text("fee_category").notNull(),
  costCategory: text("cost_category").notNull(),
});

export const insertBuildingTypesSchema = createInsertSchema(buildingTypes).omit({
  id: true,
});

export type InsertBuildingTypes = z.infer<typeof insertBuildingTypesSchema>;
export type BuildingTypes = typeof buildingTypes.$inferSelect;

// Database Views for Budget Calculator
export const buildingCostRangesView = pgTable("building_cost_ranges", {
  buildingType: text("building_type").notNull(),
  tier: integer("tier").notNull(),
  allInMin: integer("all_in_min").notNull(),
  allInMax: integer("all_in_max").notNull(),
  archShare: decimal("arch_share").notNull(),
  intShare: decimal("int_share").notNull(),
  landShare: decimal("land_share").notNull(),
});

export const engineeringCostsView = pgTable("engineering_costs_v", {
  buildingType: text("building_type").notNull(),
  tier: integer("tier").notNull(),
  category: text("category").notNull(),
  percentAvg: text("percent_avg").notNull(),
  percentMin: decimal("percent_min").notNull(),
  percentMax: decimal("percent_max").notNull(),
  costMinPsf: decimal("cost_min_psf").notNull(),
  costMaxPsf: decimal("cost_max_psf").notNull(),
});

export const buildingTypesView = pgView("building_types_v").as((qb) => {
  return qb.select({
    buildingType: buildingTypes.buildingType,
    buildingUse: buildingTypes.buildingUse,
    feeCategory: buildingTypes.feeCategory,
    costCategory: buildingTypes.costCategory,
  }).from(buildingTypes);
});

// Budget Calculator Types
export const budgetInputSchema = z.object({
  building_type: z.string(),
  tier: z.number().int().min(1).max(3),
  new_area_ft2: z.number().positive(),
  existing_area_ft2: z.number().min(0),
  site_area_m2: z.number().optional(),
});

export type BudgetInput = z.infer<typeof budgetInputSchema>;

export type BudgetCalculationResult = {
  inputs: BudgetInput;
  all_in: { min_psf: number; max_psf: number };
  area: { total_sf: number };
  total_cost: { low: number; high: number; proposed: number };
  shares: { shell: number; interior: number; landscape: number };
  minimum_budgets: { shell: number; interior: number; landscape: number };
  design_shares: Record<string, number>;
  engineering_budgets: Record<string, number> & { sum: number };
  architecture_budget: number;
  working_budget: number;
  // New construction vs existing breakdown
  construction_ratios: { new_construction: number; existing_remodel: number };
  // Detailed breakdown for each discipline
  discipline_breakdown: {
    architecture: { total: number; new_construction: number; existing_remodel: number };
    interior: { total: number; new_construction: number; existing_remodel: number };
    landscape: { total: number; new_construction: number; existing_remodel: number };
    [discipline: string]: { total: number; new_construction: number; existing_remodel: number };
  };
  notes: string[];
};

export type BuildingCostRange = typeof buildingCostRangesView.$inferSelect;
export type EngineeringCost = typeof engineeringCostsView.$inferSelect;
export type BuildingTypeView = typeof buildingTypesView.$inferSelect;
