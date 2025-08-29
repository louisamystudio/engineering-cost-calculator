import { 
  type ComprehensiveProjectInput,
  type Project,
  type ProjectCalculation,
  type ProjectFee,
  type ProjectHours
} from "@shared/schema";
import { storage } from "../storage";
import { safeParseFloat, roundTo, clamp, validatePercentageSum } from "../utils/numberUtils";

interface CalculationResult {
  project: Project;
  calculations: ProjectCalculation;
  fees: ProjectFee[];
  hours: ProjectHours[];
}

export class ProjectCalculatorService {
  // Average hourly rates from the Python code
  private readonly AVERAGE_LABOR_COST_PER_HOUR = 35.73;
  private readonly AVERAGE_OVERHEAD_COST_PER_HOUR = 46.10;
  private readonly MARKUP_FACTOR = 2.0; // 100% markup
  private readonly COORDINATION_FEE_PERCENT = 0.15;
  
  // Phase distribution percentages
  private readonly PHASE_DISTRIBUTION = [
    { phase: 'Discovery', percent: 0.08 },
    { phase: 'Creative - Conceptual', percent: 0.08 },
    { phase: 'Creative - Schematic', percent: 0.34 },
    { phase: 'Creative - Preliminary', percent: 0.08 },
    { phase: 'Technical - Schematic', percent: 0.34 },
    { phase: 'Technical - Preliminary', percent: 0.08 }
  ];
  
  // Leverage percentages by role and phase (from CSV)
  private readonly ROLE_LEVERAGE = {
    'Discovery': { designer1: 0.37, designer2: 0.37, architect: 0.10, engineer: 0.02, principal: 0.14 },
    'Creative - Conceptual': { designer1: 0, designer2: 0, architect: 0.95, engineer: 0, principal: 0.05 },
    'Creative - Schematic': { designer1: 0.32, designer2: 0.32, architect: 0.32, engineer: 0.02, principal: 0.02 },
    'Creative - Preliminary': { designer1: 0.32, designer2: 0.32, architect: 0.32, engineer: 0.02, principal: 0.02 },
    'Technical - Schematic': { designer1: 0.26, designer2: 0.26, architect: 0.10, engineer: 0.32, principal: 0.06 },
    'Technical - Preliminary': { designer1: 0.26, designer2: 0.26, architect: 0.10, engineer: 0.32, principal: 0.06 }
  };
  
  // In-house vs outsourced scopes
  private readonly INHOUSE_SCOPES = new Set([
    'Scan to Bim - Building',
    'Scan to Bim - Site',
    'Architecture (Design + Consultant Admin.)',
    'Interior design',
    'Landscape architecture',
    'Structural engineer',
    'Civil / site engineer',
    'Plumbing engineer'
  ]);

  async calculateProject(input: ComprehensiveProjectInput): Promise<CalculationResult> {
    // Create or update the project
    const project = await this.createOrUpdateProject(input);
    
    // Get category multiplier
    const categoryMultiplier = await this.getCategoryMultiplier(input.category);
    
    // Get building cost data
    const costData = await this.getBuildingCostData(input);
    
    // Calculate costs and budgets
    const calculations = await this.calculateBudgets(project, input, costData, categoryMultiplier);
    
    // Calculate fees
    const fees = await this.calculateFees(project, calculations, input, categoryMultiplier);
    
    // Calculate hours distribution
    const hours = await this.calculateHours(project, fees, calculations);
    
    // Save all calculations to database
    await this.saveCalculations(project.id, calculations, fees, hours);
    
    return { project, calculations, fees, hours };
  }
  
  private async createOrUpdateProject(input: ComprehensiveProjectInput): Promise<Project> {
    // Check if we're updating an existing project or creating a new one
    const existingDemo = await storage.getDemoProject();
    
    // Convert number fields to strings for database storage
    const projectData = {
      ...input,
      newBuildingArea: input.newBuildingArea.toString(),
      existingBuildingArea: input.existingBuildingArea.toString(),
      siteArea: input.siteArea.toString(),
      historicMultiplier: input.historicMultiplier.toString(),
      remodelMultiplier: input.remodelMultiplier.toString(),
      newConstructionTargetCost: input.newConstructionTargetCost?.toString(),
      remodelTargetCost: input.remodelTargetCost?.toString(),
      newConstructionTargetCostOverride: input.newConstructionTargetCostOverride?.toString(),
      remodelTargetCostOverride: input.remodelTargetCostOverride?.toString(),
      shellShareOverride: input.shellShareOverride?.toString(),
      interiorShareOverride: input.interiorShareOverride?.toString(),
      landscapeShareOverride: input.landscapeShareOverride?.toString(),
      structuralShareOverride: input.structuralShareOverride?.toString(),
      civilShareOverride: input.civilShareOverride?.toString(),
      mechanicalShareOverride: input.mechanicalShareOverride?.toString(),
      electricalShareOverride: input.electricalShareOverride?.toString(),
      plumbingShareOverride: input.plumbingShareOverride?.toString(),
      telecomShareOverride: input.telecomShareOverride?.toString(),
      // Convert new override fields to strings
      telecomPercentageOverride: input.telecomPercentageOverride?.toString(),
      structuralPercentageOverride: input.structuralPercentageOverride?.toString(),
      civilPercentageOverride: input.civilPercentageOverride?.toString(),
      mechanicalPercentageOverride: input.mechanicalPercentageOverride?.toString(),
      electricalPercentageOverride: input.electricalPercentageOverride?.toString(),
      plumbingPercentageOverride: input.plumbingPercentageOverride?.toString(),
      architecturePercentageOverride: input.architecturePercentageOverride?.toString(),
      interiorDesignPercentageOverride: input.interiorDesignPercentageOverride?.toString(),
      landscapePercentageOverride: input.landscapePercentageOverride?.toString(),
      laborRateOverride: input.laborRateOverride?.toString(),
      overheadRateOverride: input.overheadRateOverride?.toString(),
      markupFactorOverride: input.markupFactorOverride?.toString(),
      architectureFeeAdjustment: input.architectureFeeAdjustment?.toString(),
      interiorFeeAdjustment: input.interiorFeeAdjustment?.toString(),
      landscapeFeeAdjustment: input.landscapeFeeAdjustment?.toString(),
      structuralFeeAdjustment: input.structuralFeeAdjustment?.toString(),
      civilFeeAdjustment: input.civilFeeAdjustment?.toString(),
      mechanicalFeeAdjustment: input.mechanicalFeeAdjustment?.toString(),
      electricalFeeAdjustment: input.electricalFeeAdjustment?.toString(),
      plumbingFeeAdjustment: input.plumbingFeeAdjustment?.toString(),
      telecomFeeAdjustment: input.telecomFeeAdjustment?.toString(),
      contractDiscountOverride: input.contractDiscountOverride?.toString(),
      isDemo: input.projectName === 'Demo Project',
      // Add new fields
      useNonLinearHours: input.useNonLinearHours ?? false,
      architectureInhouse: input.architectureInhouse ?? true,
      interiorDesignInhouse: input.interiorDesignInhouse ?? true,
      landscapeInhouse: input.landscapeInhouse ?? true,
      structuralInhouse: input.structuralInhouse ?? false,
      civilInhouse: input.civilInhouse ?? false,
      mechanicalInhouse: input.mechanicalInhouse ?? false,
      electricalInhouse: input.electricalInhouse ?? false,
      plumbingInhouse: input.plumbingInhouse ?? false,
      telecomInhouse: input.telecomInhouse ?? false,
      scanToBimEnabled: input.scanToBimEnabled ?? false,
      scanToBimArea: input.scanToBimArea?.toString() ?? '0',
      scanToBimRate: input.scanToBimRate?.toString() ?? '0.5'
    };
    
    if (existingDemo && input.projectName === 'Demo Project') {
      // Update existing demo project
      const updated = await storage.updateProject(existingDemo.id, projectData);
      return updated!;
    } else {
      // Create new project
      const project = await storage.createProject(projectData);
      return project;
    }
  }
  
  private async getCategoryMultiplier(category: number): Promise<number> {
    const multiplierData = await storage.getCategoryMultiplier(category);
    return multiplierData ? safeParseFloat(multiplierData.multiplier, 0.8 + 0.1 * category) : (0.8 + 0.1 * category);
  }
  
  private async getBuildingCostData(input: ComprehensiveProjectInput) {
    // Use the new comprehensive database structure
    // Ensure we pass the correct building type and normalized tier label
    let mappedBuildingType = input.buildingType;
    
    // Handle legacy building type mappings
    if (input.buildingType === 'Residence - Private') {
      mappedBuildingType = 'Custom Houses'; // Default to Custom Houses for private residences
    }
    
    // Map design level to tier text used in the seeded data (Low/Mid/High)
    const tierMap: Record<number, string> = {
      1: 'Low',
      2: 'Mid', 
      3: 'High'
    };
    const tierText = tierMap[input.designLevel] || 'Mid';
    
    // Get comprehensive data from new database structure
    const comprehensiveData = await storage.getBuildingCostData(mappedBuildingType, tierText);
    
    if (comprehensiveData) {
      // Convert comprehensive data to the expected format for existing calculator logic
      const newAllInMin = safeParseFloat(comprehensiveData.shellNewMin) + safeParseFloat(comprehensiveData.interiorNewMin) + safeParseFloat(comprehensiveData.outdoorNewMin);
      const newAllInMax = safeParseFloat(comprehensiveData.shellNewMax) + safeParseFloat(comprehensiveData.interiorNewMax) + safeParseFloat(comprehensiveData.outdoorNewMax);
      const remodelAllInMin = safeParseFloat(comprehensiveData.shellRemodelMin) + safeParseFloat(comprehensiveData.interiorRemodelMin) + safeParseFloat(comprehensiveData.outdoorRemodelMin);
      const remodelAllInMax = safeParseFloat(comprehensiveData.shellRemodelMax) + safeParseFloat(comprehensiveData.interiorRemodelMax) + safeParseFloat(comprehensiveData.outdoorRemodelMax);

      return {
        // New construction all-in psf
        allInMin: newAllInMin.toString(),
        allInMax: newAllInMax.toString(),
        // Remodel all-in psf (explicitly from CSV)
        remodelAllInMin: remodelAllInMin.toString(),
        remodelAllInMax: remodelAllInMax.toString(),
        archShare: (safeParseFloat(comprehensiveData.projectShellShare) / 100).toString(),
        intShare: (safeParseFloat(comprehensiveData.projectInteriorShare) / 100).toString(),
        landShare: (safeParseFloat(comprehensiveData.projectLandscapeShare) / 100).toString(),
        comprehensiveData // Pass along the full data for advanced calculations
      };
    } else {
      // Fallback to default values that properly use design level
      const defaults: Record<string, any> = {
        'High-End Custom Residential': {
          1: { allInMin: 400, allInMax: 500, archShare: 0.60, intShare: 0.25, landShare: 0.15 },
          2: { allInMin: 600, allInMax: 700, archShare: 0.60, intShare: 0.25, landShare: 0.15 },
          3: { allInMin: 800, allInMax: 900, archShare: 0.60, intShare: 0.25, landShare: 0.15 }
        },
        'Mid-Range Standard Residential': {
          1: { allInMin: 300, allInMax: 320, archShare: 0.66, intShare: 0.22, landShare: 0.12 },
          2: { allInMin: 340, allInMax: 360, archShare: 0.66, intShare: 0.22, landShare: 0.12 },
          3: { allInMin: 380, allInMax: 400, archShare: 0.66, intShare: 0.22, landShare: 0.12 }
        },
        'Hospitality (Hotel/Resort)': {
          1: { allInMin: 400, allInMax: 500, archShare: 0.60, intShare: 0.30, landShare: 0.10 },
          2: { allInMin: 500, allInMax: 600, archShare: 0.60, intShare: 0.30, landShare: 0.10 },
          3: { allInMin: 600, allInMax: 700, archShare: 0.60, intShare: 0.30, landShare: 0.10 }
        },
        'Commercial / Mixed-Use': {
          1: { allInMin: 150, allInMax: 250, archShare: 0.70, intShare: 0.20, landShare: 0.10 },
          2: { allInMin: 250, allInMax: 330, archShare: 0.70, intShare: 0.20, landShare: 0.10 },
          3: { allInMin: 330, allInMax: 400, archShare: 0.70, intShare: 0.20, landShare: 0.10 }
        }
      };
      
      const tierDefaults = defaults[mappedBuildingType]?.[input.designLevel] || 
                          defaults['Mid-Range Standard Residential'][2];
      
      return {
        allInMin: tierDefaults.allInMin,
        allInMax: tierDefaults.allInMax,
        archShare: tierDefaults.archShare.toString(),
        intShare: tierDefaults.intShare.toString(),
        landShare: tierDefaults.landShare.toString()
      };
    }
  }
  
  private async calculateBudgets(
    project: Project,
    input: ComprehensiveProjectInput,
    costData: any,
    categoryMultiplier: number
  ): Promise<ProjectCalculation> {
    // Use all-in psf from CSV for new and remodel, with historic multiplier
    const newCostMin = safeParseFloat(costData.allInMin) * input.historicMultiplier;
    const newCostMax = safeParseFloat(costData.allInMax) * input.historicMultiplier;
    const newCostTarget = input.newConstructionTargetCost || (newCostMin + newCostMax) / 2;

    // Prefer explicit remodel all-in psf from CSV; fallback to remodelMultiplier scaling if unavailable
    const csvRemodelMin = safeParseFloat(costData.remodelAllInMin);
    const csvRemodelMax = safeParseFloat(costData.remodelAllInMax);
    const remodelCostMin = (csvRemodelMin > 0 ? csvRemodelMin * input.historicMultiplier : newCostMin * input.remodelMultiplier);
    const remodelCostMax = (csvRemodelMax > 0 ? csvRemodelMax * input.historicMultiplier : newCostMax * input.remodelMultiplier);
    const remodelCostTarget = input.remodelTargetCost || (remodelCostMin + remodelCostMax) / 2;
    
    // Calculate budgets using exact Excel logic
    const newBudget = input.newBuildingArea * newCostTarget;
    const remodelBudget = input.existingBuildingArea * remodelCostTarget;
    const totalBudget = newBudget + remodelBudget;
    
    // Get share percentages with overrides and validation
    let shellShare = clamp(input.shellShareOverride || safeParseFloat(costData.archShare, 0.70), 0, 1);
    let interiorShare = clamp(input.interiorShareOverride || safeParseFloat(costData.intShare, 0.20), 0, 1);
    let landscapeShare = clamp(input.landscapeShareOverride || safeParseFloat(costData.landShare, 0.10), 0, 1);
    
    // Validate shares sum to 1.0
    const totalShares = shellShare + interiorShare + landscapeShare;
    if (Math.abs(totalShares - 1.0) > 0.01) {
      console.warn(`Budget shares sum to ${totalShares} instead of 1.0 - normalizing`);
      // Normalize shares if they don't sum to 1.0
      const normalizedShellShare = shellShare / totalShares;
      const normalizedInteriorShare = interiorShare / totalShares;
      const normalizedLandscapeShare = landscapeShare / totalShares;
      shellShare = normalizedShellShare;
      interiorShare = normalizedInteriorShare;
      landscapeShare = normalizedLandscapeShare;
    }
    
    // Calculate category budgets with exact Excel splits
    const shellBudgetNew = newBudget * shellShare;
    const shellBudgetRemodel = remodelBudget * shellShare;
    const shellBudgetTotal = shellBudgetNew + shellBudgetRemodel;
    
    const interiorBudgetNew = newBudget * interiorShare;
    const interiorBudgetRemodel = remodelBudget * interiorShare;
    const interiorBudgetTotal = interiorBudgetNew + interiorBudgetRemodel;
    
    const landscapeBudgetNew = newBudget * landscapeShare;
    const landscapeBudgetRemodel = remodelBudget * landscapeShare;
    const landscapeBudgetTotal = landscapeBudgetNew + landscapeBudgetRemodel;
    
    // Get engineering percentages with exact Excel formulas
    const engineeringPercentages = await this.getEngineeringPercentages(input);
    
    // Calculate architecture share as per Excel: (1 - (sum of all engineering percentages)) * shellShare
    const totalEngineeringPercentage = engineeringPercentages.structural + engineeringPercentages.civil +
                                       engineeringPercentages.mechanical + engineeringPercentages.electrical +
                                       engineeringPercentages.plumbing + engineeringPercentages.telecom;
    
    // Enforce minimum Architecture share and proportionally-scale engineering if needed
    const archFloor = input.architecturePercentageOverride ?? 0.10; // default 10%
    let engSumWorking = totalEngineeringPercentage;
    if (engSumWorking > 1.0 - archFloor) {
      console.warn(`Engineering shares ${(engSumWorking * 100).toFixed(1)}% exceed available ${(100 - archFloor * 100).toFixed(1)}% — scaling`);
      const scale = (1.0 - archFloor) / engSumWorking;
      engineeringPercentages.structural *= scale;
      engineeringPercentages.civil *= scale;
      engineeringPercentages.mechanical *= scale;
      engineeringPercentages.electrical *= scale;
      engineeringPercentages.plumbing *= scale;
      engineeringPercentages.telecom *= scale;
      engSumWorking = engineeringPercentages.structural + engineeringPercentages.civil + engineeringPercentages.mechanical + engineeringPercentages.electrical + engineeringPercentages.plumbing + engineeringPercentages.telecom;
    }
    
    // Architecture is the remainder of shell after engineering, with a minimum floor
    const architecturePercentage = Math.max(archFloor, 1 - engSumWorking);
    
    // Calculate engineering budgets with proper new/remodel split
    // Note: shellBudgetRemodel already includes the remodel cost reduction
    // So we don't apply remodelMultiplier again - just apply the percentage directly
    const architectureBudgetNew = shellBudgetNew * architecturePercentage;
    const architectureBudgetRemodel = shellBudgetRemodel * architecturePercentage;
    const architectureBudget = architectureBudgetNew + architectureBudgetRemodel;
    
    // All engineering disciplines use the same approach - percentage of shell budget
    const structuralBudgetNew = shellBudgetNew * engineeringPercentages.structural;
    const structuralBudgetRemodel = shellBudgetRemodel * engineeringPercentages.structural;
    const structuralBudget = structuralBudgetNew + structuralBudgetRemodel;
    
    const civilBudgetNew = shellBudgetNew * engineeringPercentages.civil;
    const civilBudgetRemodel = shellBudgetRemodel * engineeringPercentages.civil;
    const civilBudget = civilBudgetNew + civilBudgetRemodel;
    
    const mechanicalBudgetNew = shellBudgetNew * engineeringPercentages.mechanical;
    const mechanicalBudgetRemodel = shellBudgetRemodel * engineeringPercentages.mechanical;
    const mechanicalBudget = mechanicalBudgetNew + mechanicalBudgetRemodel;
    
    const electricalBudgetNew = shellBudgetNew * engineeringPercentages.electrical;
    const electricalBudgetRemodel = shellBudgetRemodel * engineeringPercentages.electrical;
    const electricalBudget = electricalBudgetNew + electricalBudgetRemodel;
    
    const plumbingBudgetNew = shellBudgetNew * engineeringPercentages.plumbing;
    const plumbingBudgetRemodel = shellBudgetRemodel * engineeringPercentages.plumbing;
    const plumbingBudget = plumbingBudgetNew + plumbingBudgetRemodel;
    
    const telecomBudgetNew = shellBudgetNew * engineeringPercentages.telecom;
    const telecomBudgetRemodel = shellBudgetRemodel * engineeringPercentages.telecom;
    const telecomBudget = telecomBudgetNew + telecomBudgetRemodel;
    
    return {
      id: '', // Will be set by database
      projectId: project.id,
      newCostMin: newCostMin.toString(),
      newCostMax: newCostMax.toString(),
      newCostTarget: newCostTarget.toString(),
      remodelCostMin: remodelCostMin.toString(),
      remodelCostMax: remodelCostMax.toString(),
      remodelCostTarget: remodelCostTarget.toString(),
      newBudget: newBudget.toString(),
      remodelBudget: remodelBudget.toString(),
      totalBudget: totalBudget.toString(),
      shellBudgetTotal: shellBudgetTotal.toString(),
      interiorBudgetTotal: interiorBudgetTotal.toString(),
      landscapeBudgetTotal: landscapeBudgetTotal.toString(),
      architectureBudget: architectureBudget.toString(),
      structuralBudget: structuralBudget.toString(),
      civilBudget: civilBudget.toString(),
      mechanicalBudget: mechanicalBudget.toString(),
      electricalBudget: electricalBudget.toString(),
      plumbingBudget: plumbingBudget.toString(),
      telecomBudget: telecomBudget.toString(),
      calculatedAt: new Date()
    };
  }
  
  private async getEngineeringPercentages(input: ComprehensiveProjectInput) {
    // Prefer engineering design shares from the comprehensive DB when available
    try {
      const tierMap: Record<number, string> = { 1: 'Low', 2: 'Mid', 3: 'High' };
      const buildingType = input.buildingType;
      const buildingTier = tierMap[input.designLevel] || 'Mid';
      const data = await storage.getBuildingCostData(buildingType, buildingTier);
      if (data) {
        const perc = {
          structural: safeParseFloat(data.structuralDesignShare?.toString() || '0') / 100,
          civil: safeParseFloat(data.civilDesignShare?.toString() || '0') / 100,
          mechanical: safeParseFloat(data.mechanicalDesignShare?.toString() || '0') / 100,
          electrical: safeParseFloat(data.electricalDesignShare?.toString() || '0') / 100,
          plumbing: safeParseFloat(data.plumbingDesignShare?.toString() || '0') / 100,
          telecom: safeParseFloat(data.telecommunicationDesignShare?.toString() || '0') / 100,
        };
        
        // Apply overrides if provided
        const engineeringPercentages = {
          structural: input.structuralPercentageOverride ?? perc.structural,
          civil: input.civilPercentageOverride ?? perc.civil,
          mechanical: input.mechanicalPercentageOverride ?? perc.mechanical,
          electrical: input.electricalPercentageOverride ?? perc.electrical,
          plumbing: input.plumbingPercentageOverride ?? perc.plumbing,
          telecom: input.telecomPercentageOverride ?? perc.telecom,
        };
        
        // Calculate Architecture percentage as: 1 - sum of engineering percentages (Excel Line 38)
        const engineeringSum = engineeringPercentages.structural + engineeringPercentages.civil + 
                              engineeringPercentages.mechanical + engineeringPercentages.electrical + 
                              engineeringPercentages.plumbing + engineeringPercentages.telecom;
        
        return {
          ...engineeringPercentages,
          architecture: input.architecturePercentageOverride ?? Math.max(0, 1 - engineeringSum)
        };
      }
    } catch (e) {
      // fall back to defaults below
    }

    // Default engineering percentages when DB shares are unavailable
    const defaults: Record<string, any> = {
      'High-End Custom Residential': {
        1: { structural: 0.31, civil: 0.06, mechanical: 0.08, electrical: 0.05, plumbing: 0.04, telecom: 0.025 },
        2: { structural: 0.30, civil: 0.07, mechanical: 0.09, electrical: 0.06, plumbing: 0.05, telecom: 0.035 },
        3: { structural: 0.29, civil: 0.075, mechanical: 0.10, electrical: 0.07, plumbing: 0.05, telecom: 0.04 }
      },
      'Mid-Range Standard Residential': {
        1: { structural: 0.28, civil: 0.05, mechanical: 0.06, electrical: 0.045, plumbing: 0.035, telecom: 0.015 },
        2: { structural: 0.27, civil: 0.05, mechanical: 0.06, electrical: 0.045, plumbing: 0.035, telecom: 0.015 },
        3: { structural: 0.26, civil: 0.05, mechanical: 0.06, electrical: 0.045, plumbing: 0.035, telecom: 0.015 }
      },
      'Hospitality 4-Star': {
        1: { structural: 0.23, civil: 0.065, mechanical: 0.125, electrical: 0.075, plumbing: 0.04, telecom: 0.035 }
      },
      'Commercial Class A': {
        2: { structural: 0.24, civil: 0.05, mechanical: 0.115, electrical: 0.10, plumbing: 0.03, telecom: 0.035 }
      }
    };
    
    let tierKey = input.buildingTier;
    if (input.buildingTier === 'Hospitality (Hotel/Resort)') {
      tierKey = 'Hospitality 4-Star';
    } else if (input.buildingTier === 'Commercial / Mixed-Use') {
      tierKey = 'Commercial Class A';
    }
    
    const defaultPercentages = defaults[tierKey]?.[input.designLevel] || 
                              defaults['Mid-Range Standard Residential'][2];
    
    // Apply overrides if provided
    const engineeringPercentages = {
      structural: input.structuralPercentageOverride ?? defaultPercentages.structural,
      civil: input.civilPercentageOverride ?? defaultPercentages.civil,
      mechanical: input.mechanicalPercentageOverride ?? defaultPercentages.mechanical,
      electrical: input.electricalPercentageOverride ?? defaultPercentages.electrical,
      plumbing: input.plumbingPercentageOverride ?? defaultPercentages.plumbing,
      telecom: input.telecomPercentageOverride ?? defaultPercentages.telecom
    };
    
    // Calculate Architecture percentage as: 1 - sum of engineering percentages (Excel Line 38)
    const engineeringSum = engineeringPercentages.structural + engineeringPercentages.civil + 
                          engineeringPercentages.mechanical + engineeringPercentages.electrical + 
                          engineeringPercentages.plumbing + engineeringPercentages.telecom;
    
    return {
      ...engineeringPercentages,
      architecture: input.architecturePercentageOverride ?? Math.max(0, 1 - engineeringSum)
    };
  }
  
  private async calculateFees(
    project: Project,
    calculations: ProjectCalculation,
    input: ComprehensiveProjectInput,
    categoryMultiplier: number
  ): Promise<ProjectFee[]> {
    const fees: ProjectFee[] = [];
    
    // Use override values if provided, otherwise use defaults
    const laborRate = input.laborRateOverride ?? this.AVERAGE_LABOR_COST_PER_HOUR;
    const overheadRate = input.overheadRateOverride ?? this.AVERAGE_OVERHEAD_COST_PER_HOUR;
    const markupFactor = input.markupFactorOverride ?? this.MARKUP_FACTOR;
    const contractDiscount = input.contractDiscountOverride ?? 0.15;
    
    const averagePricingPerHour = Math.round(
      (laborRate + overheadRate) * markupFactor * (1 - contractDiscount)
    );
    
    const totalArea = input.newBuildingArea + input.existingBuildingArea;
    const newBudget = safeParseFloat(calculations.newBudget);
    const remodelBudget = safeParseFloat(calculations.remodelBudget);
    const totalBudget = safeParseFloat(calculations.totalBudget);
    
    // Calculate new construction and remodel shares for fee weighting
    const newConstructionShare = totalBudget > 0 ? newBudget / totalBudget : 0;
    const remodelShare = totalBudget > 0 ? remodelBudget / totalBudget : 0;
    
    // Scan to BIM fees
    if (input.existingBuildingArea > 0) {
      const scanBuildingRate = (0.6 + 0.006 * Math.pow((1000 + input.existingBuildingArea) / 1000000, -0.7495)) * categoryMultiplier;
      const scanBuildingFee = scanBuildingRate * input.existingBuildingArea;
      
      fees.push({
        id: '',
        projectId: project.id,
        scope: 'Scan to Bim - Building',
        percentOfCost: null,
        ratePerSqFt: scanBuildingRate.toString(),
        marketFee: scanBuildingFee.toString(),
        louisAmyFee: scanBuildingFee.toString(),
        hours: ((averagePricingPerHour > 0 ? (scanBuildingFee / averagePricingPerHour) : 0)).toString(),
        coordinationFee: '0',
        consultantFee: '0',
        isInhouse: true
      });
    }
    
    if (input.siteArea > 0) {
      const scanSiteRate = (1 + 0.00091 * Math.pow(input.siteArea / 1000000, -0.005)) * categoryMultiplier / Math.pow(3.28, 2) + 0.08;
      const scanSiteFee = scanSiteRate * input.siteArea * Math.pow(3.28, 2);
      
      fees.push({
        id: '',
        projectId: project.id,
        scope: 'Scan to Bim - Site',
        percentOfCost: null,
        ratePerSqFt: scanSiteRate.toString(),
        marketFee: scanSiteFee.toString(),
        louisAmyFee: scanSiteFee.toString(),
        hours: ((averagePricingPerHour > 0 ? (scanSiteFee / averagePricingPerHour) : 0)).toString(),
        coordinationFee: '0',
        consultantFee: '0',
        isInhouse: true
      });
    }
    
    // Design discipline fees with fee adjustments
    const disciplines = [
      { 
        scope: 'Architecture (Design + Consultant Admin.)', 
        budget: parseFloat(calculations.architectureBudget), 
        isInhouse: project.architectureInhouse,
        feeAdjustment: input.architectureFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Interior design', 
        budget: parseFloat(calculations.interiorBudgetTotal), 
        isInhouse: project.interiorDesignInhouse,
        feeAdjustment: input.interiorFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Landscape architecture', 
        budget: parseFloat(calculations.landscapeBudgetTotal), 
        isInhouse: project.landscapeInhouse,
        feeAdjustment: input.landscapeFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Structural engineer', 
        budget: parseFloat(calculations.structuralBudget), 
        isInhouse: project.structuralInhouse,
        feeAdjustment: input.structuralFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Civil / site engineer', 
        budget: parseFloat(calculations.civilBudget), 
        isInhouse: project.civilInhouse,
        feeAdjustment: input.civilFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Mechanical (HVAC, energy, pools)', 
        budget: parseFloat(calculations.mechanicalBudget), 
        isInhouse: project.mechanicalInhouse,
        feeAdjustment: input.mechanicalFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Electrical (power / lighting)', 
        budget: parseFloat(calculations.electricalBudget), 
        isInhouse: project.electricalInhouse,
        feeAdjustment: input.electricalFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Plumbing engineer', 
        budget: parseFloat(calculations.plumbingBudget), 
        isInhouse: project.plumbingInhouse,
        feeAdjustment: input.plumbingFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Telecommunication', 
        budget: parseFloat(calculations.telecomBudget), 
        isInhouse: project.telecomInhouse,
        feeAdjustment: input.telecomFeeAdjustment ?? 1.0
      }
    ];
    
    for (const disc of disciplines) {
      let feePercentage: number;
      let marketFee: number;
      
      // Use exact Excel formulas for fee calculations
      const budgetInMillions = disc.budget / 1000000;
      const baseFeeFormula = 0.07498 + 0.007824 * Math.pow(budgetInMillions, -0.7495);
      
      if (disc.scope.includes('Architecture')) {
        // Excel formula for Architecture (Line 86): 
        // =((((0.07498+0.007824*($B$28/1000000)^(-0.7495))*($B$79)*$B$77*0.95)+((0.07498+0.007824*($B$28/1000000)^(-0.7495))*($B$79)*$B$78*1.05))/$B$76)*(1+(1-$B$12))
        // Where B28=Architecture Budget, B79=Category Multiplier, B77=New Share, B78=Remodel Share, B76=Total Budget, B12=Remodel Multiplier
        const architectureBudgetInMillions = disc.budget / 1000000;
        const baseFeeFormula = 0.07498 + 0.007824 * Math.pow(architectureBudgetInMillions, -0.7495);
        
        const newWeightedFee = baseFeeFormula * categoryMultiplier * newConstructionShare * 0.95;
        const remodelWeightedFee = baseFeeFormula * categoryMultiplier * remodelShare * 1.05;
        
        // Prevent division by zero and infinite values
        if (totalBudget <= 0) {
          feePercentage = 0;
          marketFee = 0;
        } else {
          feePercentage = ((newWeightedFee + remodelWeightedFee) / totalBudget) * (1 + (1 - input.remodelMultiplier));
          marketFee = feePercentage * disc.budget;
        }
      } else if (disc.scope.includes('Interior') || disc.scope.includes('Landscape')) {
        // Excel formulas for Interior (Line 87) and Landscape (Line 88) - same as Architecture
        // =((((0.07498+0.007824*(Budget/1000000)^(-0.7495))*($B$79)*$B$77*0.95)+((0.07498+0.007824*(Budget/1000000)^(-0.7495))*($B$79)*$B$78*1.05))/$B$76)*(1+(1-$B$12))
        const budgetInMillions = disc.budget / 1000000;
        const baseFeeFormula = 0.07498 + 0.007824 * Math.pow(budgetInMillions, -0.7495);
        
        const newWeightedFee = baseFeeFormula * categoryMultiplier * newConstructionShare * 0.95;
        const remodelWeightedFee = baseFeeFormula * categoryMultiplier * remodelShare * 1.05;
        
        // Prevent division by zero and infinite values
        if (totalBudget <= 0) {
          feePercentage = 0;
          marketFee = 0;
        } else {
          feePercentage = ((newWeightedFee + remodelWeightedFee) / totalBudget) * (1 + (1 - input.remodelMultiplier));
          marketFee = feePercentage * disc.budget;
        }
      } else {
        // Engineering disciplines (Lines 89-94): Excel formula without (1+(1-remodelMultiplier)) factor
        // =(((0.07498+0.007824*(Budget/1000000)^(-0.7495))*($B$79)*$B$77*0.95)+((0.07498+0.007824*(Budget/1000000)^(-0.7495))*($B$79)*$B$78*1.05))/$B$76
        const budgetInMillions = disc.budget / 1000000;
        const baseFeeFormula = 0.07498 + 0.007824 * Math.pow(budgetInMillions, -0.7495);
        
        const newWeightedFee = baseFeeFormula * categoryMultiplier * newConstructionShare * 0.95;
        const remodelWeightedFee = baseFeeFormula * categoryMultiplier * remodelShare * 1.05;
        
        // Prevent division by zero and infinite values
        if (totalBudget <= 0) {
          feePercentage = 0;
          marketFee = 0;
        } else {
          feePercentage = (newWeightedFee + remodelWeightedFee) / totalBudget;
          marketFee = feePercentage * disc.budget;
        }
      }
      
      // Apply fee adjustment (discount or premium)
      const adjustedMarketFee = marketFee * disc.feeAdjustment;
      const louisAmyFee = disc.isInhouse ? adjustedMarketFee : 0;
      const coordinationFee = disc.isInhouse ? 0 : adjustedMarketFee * this.COORDINATION_FEE_PERCENT;
      const consultantFee = disc.isInhouse ? 0 : adjustedMarketFee;
      
      // Clamp percentOfCost to database constraints (precision 5, scale 4: -9.9999 to 9.9999)
      const clampedPercentOfCost = Math.max(-9.9999, Math.min(9.9999, feePercentage));
      
      fees.push({
        id: '',
        projectId: project.id,
        scope: disc.scope,
        percentOfCost: clampedPercentOfCost.toString(),
        ratePerSqFt: (totalArea > 0 ? (adjustedMarketFee / totalArea) : 0).toString(),
        marketFee: adjustedMarketFee.toString(),
        louisAmyFee: louisAmyFee.toString(),
        hours: disc.isInhouse ? ((averagePricingPerHour > 0 ? (louisAmyFee / averagePricingPerHour) : 0)).toString() : '0',
        coordinationFee: coordinationFee.toString(),
        consultantFee: consultantFee.toString(),
        isInhouse: disc.isInhouse
      });
    }
    
    return fees;
  }
  
  private async calculateHours(
    project: Project,
    fees: ProjectFee[],
    calculations: ProjectCalculation
  ): Promise<ProjectHours[]> {
    const hours: ProjectHours[] = [];
    
    // Get category multiplier for hours calculation
    const categoryMultiplier = await this.getCategoryMultiplier(project.category);
    
    // Calculate hours using exact Excel formulas (Lines 141-144)
    const newArea = parseFloat(project.newBuildingArea);
    const existingArea = parseFloat(project.existingBuildingArea);
    const totalArea = newArea + existingArea;
    
    let totalLAHours: number;
    
    if (project.useNonLinearHours ?? false) {
      // Use exact Excel non-linear hours factor formulas (Lines 114-115)
      // New Construction Hours Factor: =(0.21767+11.21274*((B7+B8) ^ -0.53816)- 0.08)*$B$79*0.9
      // Existing to Remodel Hours Factor: =(0.21767+11.21274*((B8+B7) ^ -0.53816)- 0.08)*$B$79*0.77
      
      let newConstructionHours = 0;
      let existingRemodelHours = 0;
      
      if (newArea > 0) {
        // Excel: Lines 114 & 116 - New Construction Hours Factor * New Area
        const newHoursFactor = (0.21767 + 11.21274 * Math.pow(totalArea, -0.53816) - 0.08) * categoryMultiplier * 0.9;
        newConstructionHours = newHoursFactor * newArea;
      }
      
      if (existingArea > 0) {
        // Excel: Lines 115 & 117 - Existing Hours Factor * Existing Area * 1.15
        const existingHoursFactor = (0.21767 + 11.21274 * Math.pow(totalArea, -0.53816) - 0.08) * categoryMultiplier * 0.77;
        existingRemodelHours = existingHoursFactor * existingArea * 1.15; // 1.15 remodel adjustment from Excel
      }
      
      totalLAHours = newConstructionHours + existingRemodelHours;
    } else {
      // Linear formula: hours based on fee / rate
      totalLAHours = fees
        .filter(f => f.isInhouse)
        .reduce((sum, f) => sum + parseFloat(f.hours || '0'), 0);
    }
    
    // Distribute hours by phase
    for (const phase of this.PHASE_DISTRIBUTION) {
      const phaseHours = totalLAHours * phase.percent;
      const leverage = this.ROLE_LEVERAGE[phase.phase as keyof typeof this.ROLE_LEVERAGE];
      
      hours.push({
        id: '',
        projectId: project.id,
        phase: phase.phase,
        phasePercent: phase.percent.toString(),
        totalHours: phaseHours.toString(),
        designer1Hours: (phaseHours * leverage.designer1).toString(),
        designer2Hours: (phaseHours * leverage.designer2).toString(),
        architectHours: (phaseHours * leverage.architect).toString(),
        engineerHours: (phaseHours * leverage.engineer).toString(),
        principalHours: (phaseHours * leverage.principal).toString()
      });
    }
    
    return hours;
  }
  
  private async saveCalculations(
    projectId: string,
    calculations: ProjectCalculation,
    fees: ProjectFee[],
    hours: ProjectHours[]
  ): Promise<void> {
    // Save or update calculations
    await storage.updateProjectCalculations(projectId, {
      projectId,
      newCostMin: calculations.newCostMin,
      newCostMax: calculations.newCostMax,
      newCostTarget: calculations.newCostTarget,
      remodelCostMin: calculations.remodelCostMin,
      remodelCostMax: calculations.remodelCostMax,
      remodelCostTarget: calculations.remodelCostTarget,
      newBudget: calculations.newBudget,
      remodelBudget: calculations.remodelBudget,
      totalBudget: calculations.totalBudget,
      shellBudgetTotal: calculations.shellBudgetTotal,
      interiorBudgetTotal: calculations.interiorBudgetTotal,
      landscapeBudgetTotal: calculations.landscapeBudgetTotal,
      architectureBudget: calculations.architectureBudget,
      structuralBudget: calculations.structuralBudget,
      civilBudget: calculations.civilBudget,
      mechanicalBudget: calculations.mechanicalBudget,
      electricalBudget: calculations.electricalBudget,
      plumbingBudget: calculations.plumbingBudget,
      telecomBudget: calculations.telecomBudget
    });
    
    // Delete and recreate fees
    await storage.deleteProjectFees(projectId);
    for (const fee of fees) {
      await storage.createProjectFee({
        projectId,
        scope: fee.scope,
        percentOfCost: fee.percentOfCost,
        ratePerSqFt: fee.ratePerSqFt,
        marketFee: fee.marketFee,
        louisAmyFee: fee.louisAmyFee,
        hours: fee.hours,
        coordinationFee: fee.coordinationFee,
        consultantFee: fee.consultantFee,
        isInhouse: fee.isInhouse
      });
    }
    
    // Delete and recreate hours
    await storage.deleteProjectHours(projectId);
    for (const hour of hours) {
      await storage.createProjectHours({
        projectId,
        phase: hour.phase,
        phasePercent: hour.phasePercent,
        totalHours: hour.totalHours,
        designer1Hours: hour.designer1Hours,
        designer2Hours: hour.designer2Hours,
        architectHours: hour.architectHours,
        engineerHours: hour.engineerHours,
        principalHours: hour.principalHours
      });
    }
  }
}

export const projectCalculator = new ProjectCalculatorService();
