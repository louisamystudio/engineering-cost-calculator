import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import * as XLSX from "xlsx";
import { z } from "zod";
import { insertSpreadsheetFileSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure multer for file uploads
  const upload = multer({ storage: multer.memoryStorage() });

  // Upload and process Excel file
  app.post("/api/upload-excel", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (!req.file.originalname.match(/\.(xlsx|xls)$/)) {
        return res.status(400).json({ error: "Only Excel files are allowed" });
      }

      // Parse Excel file
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      
      // Create spreadsheet file record
      const spreadsheetFile = await storage.createSpreadsheetFile({
        filename: req.file.filename || `upload_${Date.now()}`,
        originalName: req.file.originalname,
      });

      let totalRowsProcessed = 0;

      // Process each sheet
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length === 0) continue;

        // Get headers (first row)
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1);

        // Create sheet record
        const sheet = await storage.createSpreadsheetSheet({
          fileId: spreadsheetFile.id,
          sheetName: sheetName,
          headers: headers,
          rowCount: dataRows.length,
        });

        // Process data rows
        for (let i = 0; i < dataRows.length; i++) {
          const rowData = dataRows[i] as any[];
          
          // Convert array to object using headers as keys
          const rowObject: Record<string, any> = {};
          headers.forEach((header, index) => {
            rowObject[header] = rowData[index] || null;
          });

          await storage.createSpreadsheetRow({
            sheetId: sheet.id,
            rowIndex: i,
            data: rowObject,
          });
        }
        
        totalRowsProcessed += dataRows.length;
      }

      res.json({
        message: "Excel file uploaded and processed successfully",
        fileId: spreadsheetFile.id,
        sheets: workbook.SheetNames.length,
        totalRows: totalRowsProcessed,
      });
    } catch (error) {
      console.error("Error processing Excel file:", error);
      res.status(500).json({ error: "Failed to process Excel file" });
    }
  });

  // Get all uploaded files
  app.get("/api/spreadsheets", async (req, res) => {
    try {
      const files = await storage.getAllSpreadsheetFiles();
      res.json(files);
    } catch (error) {
      console.error("Error fetching spreadsheets:", error);
      res.status(500).json({ error: "Failed to fetch spreadsheets" });
    }
  });

  // Get specific file with its sheets
  app.get("/api/spreadsheets/:fileId", async (req, res) => {
    try {
      const fileWithSheets = await storage.getSpreadsheetFileWithSheets(req.params.fileId);
      if (!fileWithSheets) {
        return res.status(404).json({ error: "File not found" });
      }
      res.json(fileWithSheets);
    } catch (error) {
      console.error("Error fetching spreadsheet:", error);
      res.status(500).json({ error: "Failed to fetch spreadsheet" });
    }
  });

  // Get data from a specific sheet
  app.get("/api/sheets/:sheetId/data", async (req, res) => {
    try {
      const data = await storage.getSpreadsheetData(req.params.sheetId);
      res.json(data);
    } catch (error) {
      console.error("Error fetching sheet data:", error);
      res.status(500).json({ error: "Failed to fetch sheet data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
