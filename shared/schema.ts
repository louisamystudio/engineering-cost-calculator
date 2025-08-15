import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal } from "drizzle-orm/pg-core";
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
