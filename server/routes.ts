import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { budgetInputSchema, feeMatrixInputSchema } from "@shared/schema";
import { calculateMinimumBudget } from "@shared/budget-calculations";
import { calculateFeeMatrix } from "@shared/fee-matrix-calculations";

export async function registerRoutes(app: Express): Promise<Server> {
  // Budget Calculator API Routes
  
  // Get all building types
  app.get("/api/building-types", async (req, res) => {
    try {
      const buildingTypes = await storage.getAllBuildingTypes();
      res.json(buildingTypes);
    } catch (error) {
      console.error("Error fetching building types:", error);
      res.status(500).json({ error: "Failed to fetch building types" });
    }
  });

  // Get tiers for a specific building type
  app.get("/api/building-types/:type/tiers", async (req, res) => {
    try {
      const buildingType = decodeURIComponent(req.params.type);
      const tiers = await storage.getTiersByBuildingType(buildingType);
      res.json({ building_type: buildingType, tiers });
    } catch (error) {
      console.error("Error fetching tiers:", error);
      res.status(500).json({ error: "Failed to fetch tiers" });
    }
  });

  // Calculate minimum budget
  app.post("/api/calc/minimum-budget", async (req, res) => {
    try {
      // Validate input
      const validationResult = budgetInputSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: validationResult.error.issues 
        });
      }

      const input = validationResult.data;

      // Get cost range data
      const costRange = await storage.getBuildingCostRange(input.building_type, input.tier);
      if (!costRange) {
        return res.status(404).json({ 
          error: `No cost data found for building type "${input.building_type}" tier ${input.tier}` 
        });
      }

      // Get engineering costs
      const engineeringCosts = await storage.getEngineeringCosts(input.building_type, input.tier);

      // Calculate budget
      const result = calculateMinimumBudget(input, costRange, engineeringCosts);

      res.json(result);
    } catch (error) {
      console.error("Error calculating minimum budget:", error);
      res.status(500).json({ error: "Failed to calculate budget" });
    }
  });

  // Calculate fee matrix
  app.post("/api/calc/fee-matrix", async (req, res) => {
    try {
      // Validate input
      const validationResult = feeMatrixInputSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: validationResult.error.issues 
        });
      }

      const input = validationResult.data;

      // Calculate fee matrix
      const result = calculateFeeMatrix(input);

      res.json(result);
    } catch (error) {
      console.error("Error calculating fee matrix:", error);
      res.status(500).json({ error: "Failed to calculate fee matrix" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
