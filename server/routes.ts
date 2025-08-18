import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { budgetInputSchema, feeMatrixInputSchema, feeMatrixV2InputSchema, comprehensiveProjectInputSchema } from "@shared/schema";
import { calculateMinimumBudget } from "@shared/budget-calculations";
import { calculateFeeMatrix } from "@shared/fee-matrix-calculations";
import { computeFeeMatrixV2 } from "./services/feeMatrixV2";
import { projectCalculator } from "./services/projectCalculator";

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

  // Fee Matrix V2 (Bottom-Up) API Routes
  
  // Get all hours leverage data
  app.get("/api/datasets/hours-leverage", async (req, res) => {
    try {
      const hoursLeverage = await storage.getAllHoursLeverage();
      res.json(hoursLeverage);
    } catch (error) {
      console.error("Error fetching hours leverage data:", error);
      res.status(500).json({ error: "Failed to fetch hours leverage data" });
    }
  });

  // Calculate fee matrix v2 (bottom-up)
  app.post("/api/calc/fee-matrix/v2", async (req, res) => {
    try {
      // Validate input
      const validationResult = feeMatrixV2InputSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: validationResult.error.issues 
        });
      }

      const input = validationResult.data;

      // Calculate fee matrix v2
      const result = await computeFeeMatrixV2(input);

      res.json(result);
    } catch (error) {
      console.error("Error calculating fee matrix v2:", error);
      res.status(500).json({ error: "Failed to calculate fee matrix v2" });
    }
  });

  // Get fee calculation defaults
  app.get("/api/fee-defaults", async (req, res) => {
    try {
      const [laborOverhead, hourlyRates, feeConfig] = await Promise.all([
        storage.getAllLaborOverhead(),
        storage.getAllHourlyRates(),
        storage.getAllFeeConfig(),
      ]);

      const configMap = Object.fromEntries(
        feeConfig.map(item => [item.settingKey, parseFloat(item.settingValue)])
      );

      res.json({
        laborOverhead,
        hourlyRates,
        config: configMap,
      });
    } catch (error) {
      console.error("Error fetching fee defaults:", error);
      res.status(500).json({ error: "Failed to fetch fee defaults" });
    }
  });

  // Comprehensive Project Calculator Routes
  
  // Get all projects
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  });
  
  // Get single project with calculations
  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      
      const [calculations, fees, hours] = await Promise.all([
        storage.getProjectCalculations(req.params.id),
        storage.getProjectFees(req.params.id),
        storage.getProjectHours(req.params.id)
      ]);
      
      res.json({ project, calculations, fees, hours });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });
  
  // Create or update project with calculations
  app.post("/api/projects/calculate", async (req, res) => {
    try {
      const validationResult = comprehensiveProjectInputSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid input", 
          details: validationResult.error.issues 
        });
      }
      
      const result = await projectCalculator.calculateProject(validationResult.data);
      res.json(result);
    } catch (error) {
      console.error("Error calculating project:", error);
      res.status(500).json({ error: "Failed to calculate project" });
    }
  });
  
  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const success = await storage.deleteProject(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ error: "Failed to delete project" });
    }
  });
  
  // Get building uses
  app.get("/api/building-uses", async (req, res) => {
    try {
      const uses = await storage.getAllBuildingUses();
      res.json(uses);
    } catch (error) {
      console.error("Error fetching building uses:", error);
      res.status(500).json({ error: "Failed to fetch building uses" });
    }
  });
  
  // Get building types by use
  app.get("/api/building-uses/:use/types", async (req, res) => {
    try {
      const types = await storage.getBuildingTypesByUse(decodeURIComponent(req.params.use));
      res.json(types);
    } catch (error) {
      console.error("Error fetching building types:", error);
      res.status(500).json({ error: "Failed to fetch building types" });
    }
  });
  
  // Get building tiers by type
  app.get("/api/building-types/:type/available-tiers", async (req, res) => {
    try {
      const tiers = await storage.getBuildingTiersByType(decodeURIComponent(req.params.type));
      res.json(tiers);
    } catch (error) {
      console.error("Error fetching building tiers:", error);
      res.status(500).json({ error: "Failed to fetch building tiers" });
    }
  });
  
  // Get category multipliers
  app.get("/api/category-multipliers", async (req, res) => {
    try {
      const multipliers = await storage.getAllCategoryMultipliers();
      res.json(multipliers);
    } catch (error) {
      console.error("Error fetching category multipliers:", error);
      res.status(500).json({ error: "Failed to fetch category multipliers" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
