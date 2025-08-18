import { sql } from "drizzle-orm";
import { pgTable, pgView, text, varchar, integer, decimal, timestamp, boolean, real } from "drizzle-orm/pg-core";
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
  site_area_m2: z.number().min(0).default(0),
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

export const hoursLeverage = pgTable("hours_leverage", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phase: text("phase").notNull(),
  hoursPct: decimal("hours_pct", { precision: 5, scale: 4 }),
  adminPct: decimal("admin_pct", { precision: 5, scale: 4 }).default("0").notNull(),
  designer1Pct: decimal("designer1_pct", { precision: 5, scale: 4 }).default("0").notNull(),
  designer2Pct: decimal("designer2_pct", { precision: 5, scale: 4 }).default("0").notNull(),
  architectPct: decimal("architect_pct", { precision: 5, scale: 4 }).default("0").notNull(),
  engineerPct: decimal("engineer_pct", { precision: 5, scale: 4 }).default("0").notNull(),
  principalPct: decimal("principal_pct", { precision: 5, scale: 4 }).default("0").notNull(),
  totalPercent: decimal("total_percent", { precision: 5, scale: 4 }).default("1"),
});

export const laborOverhead = pgTable("labor_overhead", {
  role: text("role").primaryKey(),
  laborAnnual: decimal("labor_annual", { precision: 10, scale: 2 }).notNull(),
  overheadAnnual: decimal("overhead_annual", { precision: 10, scale: 2 }).notNull(),
});

export const hourlyRates = pgTable("hourly_rates", {
  role: text("role").primaryKey(),
  louisAmyRate: decimal("louis_amy_rate", { precision: 8, scale: 2 }),
  marketRate: decimal("market_rate", { precision: 8, scale: 2 }),
});

export const feeConfig = pgTable("fee_config", {
  settingKey: text("setting_key").primaryKey(),
  settingValue: decimal("setting_value", { precision: 8, scale: 4 }).notNull(),
});

export const forecast2026 = pgTable("forecast_2026", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: text("category").notNull(),
  assumption: text("assumption"),
  designer1Amount: decimal("designer1_amount", { precision: 10, scale: 2 }),
  designer2Amount: decimal("designer2_amount", { precision: 10, scale: 2 }),
  architect1Amount: decimal("architect1_amount", { precision: 10, scale: 2 }),
  architect2Amount: decimal("architect2_amount", { precision: 10, scale: 2 }),
  principalAmount: decimal("principal_amount", { precision: 10, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
});

export const ratePricing = pgTable("rate_pricing", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  costCategory: text("cost_category").notNull(),
  designer1Rate: decimal("designer1_rate", { precision: 12, scale: 8 }),
  designer2Rate: decimal("designer2_rate", { precision: 12, scale: 8 }),
  architectRate: decimal("architect_rate", { precision: 12, scale: 8 }),
  engineerRate: decimal("engineer_rate", { precision: 12, scale: 8 }),
  principalRate: decimal("principal_rate", { precision: 12, scale: 8 }),
  averageRate: decimal("average_rate", { precision: 12, scale: 8 }),
});

export const insertHoursLeverageSchema = createInsertSchema(hoursLeverage).omit({
  id: true,
});
export const insertLaborOverheadSchema = createInsertSchema(laborOverhead);
export const insertHourlyRatesSchema = createInsertSchema(hourlyRates);
export const insertFeeConfigSchema = createInsertSchema(feeConfig);
export const insertForecast2026Schema = createInsertSchema(forecast2026).omit({
  id: true,
});
export const insertRatePricingSchema = createInsertSchema(ratePricing).omit({
  id: true,
});

export type InsertHoursLeverage = z.infer<typeof insertHoursLeverageSchema>;
export type HoursLeverage = typeof hoursLeverage.$inferSelect;
export type InsertLaborOverhead = z.infer<typeof insertLaborOverheadSchema>;
export type LaborOverhead = typeof laborOverhead.$inferSelect;
export type InsertHourlyRates = z.infer<typeof insertHourlyRatesSchema>;
export type HourlyRates = typeof hourlyRates.$inferSelect;
export type InsertFeeConfig = z.infer<typeof insertFeeConfigSchema>;
export type FeeConfig = typeof feeConfig.$inferSelect;
export type InsertForecast2026 = z.infer<typeof insertForecast2026Schema>;
export type Forecast2026 = typeof forecast2026.$inferSelect;
export type InsertRatePricing = z.infer<typeof insertRatePricingSchema>;
export type RatePricing = typeof ratePricing.$inferSelect;

export type BuildingCostRange = typeof buildingCostRangesView.$inferSelect;
export type EngineeringCost = typeof engineeringCostsView.$inferSelect;
export type BuildingTypeView = typeof buildingTypesView.$inferSelect;

// Fee Matrix Types
export const feeMatrixInputSchema = z.object({
  budget_result: z.any(), // BudgetCalculationResult
  complexity_multiplier: z.number().min(0).max(2).default(0.3),
  discount_rate: z.number().min(0).max(1).default(0.15),
  average_billable_rate: z.number().positive().default(172.17),
});

export type FeeMatrixInput = z.infer<typeof feeMatrixInputSchema>;

export type DisciplineFee = {
  discipline: string;
  budget: number;
  percentage: number;
  fee: number;
  discounted_fee?: number;
  consultant_fee?: number;
  rate_psf: number;
  hours?: number;
  is_internal: boolean;
};

export type ScanningFee = {
  service: string;
  area: number;
  rate: number;
  fee: number;
  discounted_fee: number;
  hours?: number;
};

export type FeeMatrixResult = {
  inputs: FeeMatrixInput;
  scanning_fees: ScanningFee[];
  discipline_fees: DisciplineFee[];
  totals: {
    market_fee: number;
    consultant_total: number;
    discounted_total: number;
    overall_percentage: number;
    rate_per_ft2: number;
    total_hours: number;
  };
  hourly_factor: {
    hf_value: number;
    raw_design_hours: number;
    total_building_area: number;
  };
  cost_base: {
    shell_cost_base: number;
    interior_cost_base: number;
    landscape_cost_base: number;
  };
};

// Category Multipliers Table for the comprehensive calculator
export const categoryMultipliers = pgTable("category_multipliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  category: integer("category").notNull().unique(), // 1-5
  multiplier: decimal("multiplier", { precision: 3, scale: 2 }).notNull(), // 0.9 - 1.3
  description: text("description"),
});

// Projects Table for storing project data
export const projects = pgTable("projects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectName: text("project_name").notNull(),
  buildingUse: text("building_use").notNull(),
  buildingType: text("building_type").notNull(),
  buildingTier: text("building_tier").notNull(),
  designLevel: integer("design_level").notNull(), // 1-3
  category: integer("category").notNull(), // 1-5
  newBuildingArea: decimal("new_building_area", { precision: 10, scale: 2 }).notNull(),
  existingBuildingArea: decimal("existing_building_area", { precision: 10, scale: 2 }).notNull(),
  siteArea: decimal("site_area", { precision: 10, scale: 2 }).notNull(),
  historicMultiplier: decimal("historic_multiplier", { precision: 3, scale: 2 }).notNull().default("1.0"),
  remodelMultiplier: decimal("remodel_multiplier", { precision: 3, scale: 2 }).notNull().default("0.5"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isDemo: boolean("is_demo").default(false),
  // Cost overrides (if user adjusts sliders)
  newConstructionTargetCost: decimal("new_construction_target_cost", { precision: 10, scale: 2 }),
  remodelTargetCost: decimal("remodel_target_cost", { precision: 10, scale: 2 }),
  // Share overrides (if user adjusts sliders)
  shellShareOverride: decimal("shell_share_override", { precision: 5, scale: 4 }),
  interiorShareOverride: decimal("interior_share_override", { precision: 5, scale: 4 }),
  landscapeShareOverride: decimal("landscape_share_override", { precision: 5, scale: 4 }),
});

// Project Calculations Table for storing calculation results
export const projectCalculations = pgTable("project_calculations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  // Cost calculations
  newCostMin: decimal("new_cost_min", { precision: 10, scale: 2 }).notNull(),
  newCostMax: decimal("new_cost_max", { precision: 10, scale: 2 }).notNull(),
  newCostTarget: decimal("new_cost_target", { precision: 10, scale: 2 }).notNull(),
  remodelCostMin: decimal("remodel_cost_min", { precision: 10, scale: 2 }).notNull(),
  remodelCostMax: decimal("remodel_cost_max", { precision: 10, scale: 2 }).notNull(),
  remodelCostTarget: decimal("remodel_cost_target", { precision: 10, scale: 2 }).notNull(),
  // Budget totals
  newBudget: decimal("new_budget", { precision: 12, scale: 2 }).notNull(),
  remodelBudget: decimal("remodel_budget", { precision: 12, scale: 2 }).notNull(),
  totalBudget: decimal("total_budget", { precision: 12, scale: 2 }).notNull(),
  // Shell/Interior/Landscape budgets
  shellBudgetTotal: decimal("shell_budget_total", { precision: 12, scale: 2 }).notNull(),
  interiorBudgetTotal: decimal("interior_budget_total", { precision: 12, scale: 2 }).notNull(),
  landscapeBudgetTotal: decimal("landscape_budget_total", { precision: 12, scale: 2 }).notNull(),
  // Discipline budgets
  architectureBudget: decimal("architecture_budget", { precision: 12, scale: 2 }).notNull(),
  structuralBudget: decimal("structural_budget", { precision: 12, scale: 2 }).notNull(),
  civilBudget: decimal("civil_budget", { precision: 12, scale: 2 }).notNull(),
  mechanicalBudget: decimal("mechanical_budget", { precision: 12, scale: 2 }).notNull(),
  electricalBudget: decimal("electrical_budget", { precision: 12, scale: 2 }).notNull(),
  plumbingBudget: decimal("plumbing_budget", { precision: 12, scale: 2 }).notNull(),
  telecomBudget: decimal("telecom_budget", { precision: 12, scale: 2 }).notNull(),
  calculatedAt: timestamp("calculated_at").defaultNow().notNull(),
});

// Project Fees Table for storing fee calculations
export const projectFees = pgTable("project_fees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  scope: text("scope").notNull(),
  percentOfCost: decimal("percent_of_cost", { precision: 5, scale: 4 }),
  ratePerSqFt: decimal("rate_per_sq_ft", { precision: 10, scale: 4 }),
  marketFee: decimal("market_fee", { precision: 12, scale: 2 }).notNull(),
  louisAmyFee: decimal("louis_amy_fee", { precision: 12, scale: 2 }).notNull(),
  hours: decimal("hours", { precision: 10, scale: 2 }),
  coordinationFee: decimal("coordination_fee", { precision: 12, scale: 2 }),
  consultantFee: decimal("consultant_fee", { precision: 12, scale: 2 }),
  isInhouse: boolean("is_inhouse").default(true),
});

// Project Hours Distribution Table
export const projectHours = pgTable("project_hours", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  projectId: varchar("project_id").notNull().references(() => projects.id),
  phase: text("phase").notNull(),
  phasePercent: decimal("phase_percent", { precision: 5, scale: 4 }).notNull(),
  totalHours: decimal("total_hours", { precision: 10, scale: 2 }).notNull(),
  designer1Hours: decimal("designer1_hours", { precision: 10, scale: 2 }),
  designer2Hours: decimal("designer2_hours", { precision: 10, scale: 2 }),
  architectHours: decimal("architect_hours", { precision: 10, scale: 2 }),
  engineerHours: decimal("engineer_hours", { precision: 10, scale: 2 }),
  principalHours: decimal("principal_hours", { precision: 10, scale: 2 }),
});

// Insert schemas for new tables
export const insertCategoryMultipliersSchema = createInsertSchema(categoryMultipliers).omit({
  id: true,
});
export const insertProjectsSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const insertProjectCalculationsSchema = createInsertSchema(projectCalculations).omit({
  id: true,
  calculatedAt: true,
});
export const insertProjectFeesSchema = createInsertSchema(projectFees).omit({
  id: true,
});
export const insertProjectHoursSchema = createInsertSchema(projectHours).omit({
  id: true,
});

// Types for new tables
export type CategoryMultiplier = typeof categoryMultipliers.$inferSelect;
export type InsertCategoryMultiplier = z.infer<typeof insertCategoryMultipliersSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectsSchema>;
export type ProjectCalculation = typeof projectCalculations.$inferSelect;
export type InsertProjectCalculation = z.infer<typeof insertProjectCalculationsSchema>;
export type ProjectFee = typeof projectFees.$inferSelect;
export type InsertProjectFee = z.infer<typeof insertProjectFeesSchema>;
export type ProjectHours = typeof projectHours.$inferSelect;
export type InsertProjectHours = z.infer<typeof insertProjectHoursSchema>;

// Comprehensive Project Input Schema
export const comprehensiveProjectInputSchema = z.object({
  projectName: z.string().min(1),
  buildingUse: z.string().min(1),
  buildingType: z.string().min(1),
  buildingTier: z.string().min(1),
  designLevel: z.number().int().min(1).max(3),
  category: z.number().int().min(1).max(5),
  newBuildingArea: z.number().min(0),
  existingBuildingArea: z.number().min(0),
  siteArea: z.number().min(0),
  historicMultiplier: z.number().min(1).default(1.0),
  remodelMultiplier: z.number().min(0).max(1).default(0.5),
  // Optional overrides
  newConstructionTargetCost: z.number().optional(),
  remodelTargetCost: z.number().optional(),
  shellShareOverride: z.number().min(0).max(1).optional(),
  interiorShareOverride: z.number().min(0).max(1).optional(),
  landscapeShareOverride: z.number().min(0).max(1).optional(),
});

export type ComprehensiveProjectInput = z.infer<typeof comprehensiveProjectInputSchema>;

// Fee Matrix V2 Types (Bottom-Up)
export const feeMatrixV2InputSchema = z.object({
  totalAreaFt2: z.number().positive(),
  hoursFactor: z.number().positive().default(0.220),
  totalHours: z.number().int().positive().optional(),
  complexityMultiplier: z.number().min(0).max(2).default(0.3),
  scenarioDiscountLouisAmy: z.number().min(0).max(1).default(0.35),
  scenarioDiscountMarket: z.number().min(0).max(1).default(0.35),
});

export type FeeMatrixV2Input = z.infer<typeof feeMatrixV2InputSchema>;

export type SectionII = {
  roles: Record<string, {
    laborPerHour: number;
    overheadPerHour: number;
    costPerHour: number;
    pricePerHour: number;
  }>;
  simpleAverageRate: number;
  weightedAverageRate: number;
};

export type SectionIII = {
  totalAreaFt2: number;
  hoursFactor: number;
  totalHoursPlanned: number;
  phases: Array<{
    name: string;
    months: number | null;
    percent: number | null;
    hours: number;
  }>;
  totalMonths: number;
};

export type SectionIV = {
  matrix: Record<string, Record<string, number>>;
  roleTotalsRounded: Record<string, number>;
  roundedGrandTotal: number;
  plannedGrandTotal: number;
};

export type SectionV = {
  byRole: Record<string, {
    hours: number;
    pricePerHour: number;
    pricing: number;
    labor: number;
    overhead: number;
    totalCost: number;
    profit: number;
    margin: number;
  }>;
  totals: {
    hours: number;
    pricing: number;
    labor: number;
    overhead: number;
    totalCost: number;
    profit: number;
    margin: number;
  };
};

export type SectionVI = {
  scenarios: Array<{
    name: string;
    byRole: Record<string, number>;
    total: number;
    pctOfProjectBudget: number;
  }>;
};

export type FeeMatrixV2Result = {
  inputs: FeeMatrixV2Input;
  sectionII: SectionII;
  sectionIII: SectionIII;
  sectionIV: SectionIV;
  sectionV: SectionV;
  sectionVI: SectionVI;
};
