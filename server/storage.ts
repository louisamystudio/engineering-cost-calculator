import { 
  users, 
  spreadsheetFiles,
  spreadsheetSheets, 
  spreadsheetRows,
  type User, 
  type InsertUser,
  type SpreadsheetFile,
  type InsertSpreadsheetFile,
  type SpreadsheetSheet,
  type InsertSpreadsheetSheet,
  type SpreadsheetRow,
  type InsertSpreadsheetRow
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Spreadsheet methods
  createSpreadsheetFile(file: InsertSpreadsheetFile): Promise<SpreadsheetFile>;
  createSpreadsheetSheet(sheet: InsertSpreadsheetSheet): Promise<SpreadsheetSheet>;
  createSpreadsheetRow(row: InsertSpreadsheetRow): Promise<SpreadsheetRow>;
  getAllSpreadsheetFiles(): Promise<SpreadsheetFile[]>;
  getSpreadsheetFileWithSheets(fileId: string): Promise<{ file: SpreadsheetFile; sheets: SpreadsheetSheet[] } | null>;
  getSpreadsheetData(sheetId: string): Promise<SpreadsheetRow[]>;
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
      .values([insertUser])
      .returning();
    return user;
  }

  // Spreadsheet methods
  async createSpreadsheetFile(file: InsertSpreadsheetFile): Promise<SpreadsheetFile> {
    const [created] = await db
      .insert(spreadsheetFiles)
      .values([file])
      .returning();
    return created;
  }

  async createSpreadsheetSheet(sheet: InsertSpreadsheetSheet): Promise<SpreadsheetSheet> {
    const [created] = await db
      .insert(spreadsheetSheets)
      .values([sheet])
      .returning();
    return created;
  }

  async createSpreadsheetRow(row: InsertSpreadsheetRow): Promise<SpreadsheetRow> {
    const [created] = await db
      .insert(spreadsheetRows)
      .values([row])
      .returning();
    return created;
  }

  async getAllSpreadsheetFiles(): Promise<SpreadsheetFile[]> {
    return db.select().from(spreadsheetFiles);
  }

  async getSpreadsheetFileWithSheets(fileId: string): Promise<{ file: SpreadsheetFile; sheets: SpreadsheetSheet[] } | null> {
    const [file] = await db.select().from(spreadsheetFiles).where(eq(spreadsheetFiles.id, fileId));
    if (!file) return null;
    
    const sheets = await db.select().from(spreadsheetSheets).where(eq(spreadsheetSheets.fileId, fileId));
    return { file, sheets };
  }

  async getSpreadsheetData(sheetId: string): Promise<SpreadsheetRow[]> {
    return db.select().from(spreadsheetRows).where(eq(spreadsheetRows.sheetId, sheetId));
  }
}

export const storage = new DatabaseStorage();
