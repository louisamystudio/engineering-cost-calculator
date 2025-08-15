import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
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

// Spreadsheet tables
export const spreadsheetFiles = pgTable("spreadsheet_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const spreadsheetSheets = pgTable("spreadsheet_sheets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fileId: varchar("file_id").notNull().references(() => spreadsheetFiles.id, { onDelete: "cascade" }),
  sheetName: text("sheet_name").notNull(),
  headers: jsonb("headers"),
  rowCount: integer("row_count").default(0),
});

export const spreadsheetRows = pgTable("spreadsheet_rows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sheetId: varchar("sheet_id").notNull().references(() => spreadsheetSheets.id, { onDelete: "cascade" }),
  rowIndex: integer("row_index").notNull(),
  data: jsonb("data").$type<Record<string, any>>().notNull(),
});

// Insert schemas for spreadsheet tables
export const insertSpreadsheetFileSchema = createInsertSchema(spreadsheetFiles).omit({
  id: true,
  uploadedAt: true,
});

export const insertSpreadsheetSheetSchema = createInsertSchema(spreadsheetSheets).omit({
  id: true,
});

export const insertSpreadsheetRowSchema = createInsertSchema(spreadsheetRows).omit({
  id: true,
});

// Types
export type InsertSpreadsheetFile = z.infer<typeof insertSpreadsheetFileSchema>;
export type SpreadsheetFile = typeof spreadsheetFiles.$inferSelect;

export type InsertSpreadsheetSheet = z.infer<typeof insertSpreadsheetSheetSchema>;
export type SpreadsheetSheet = typeof spreadsheetSheets.$inferSelect;

export type InsertSpreadsheetRow = z.infer<typeof insertSpreadsheetRowSchema>;
export type SpreadsheetRow = typeof spreadsheetRows.$inferSelect;
