import { 
  type ComprehensiveProjectInput,
  type Project,
  type ProjectCalculation,
  type ProjectFee,
  type ProjectHours
} from "@shared/schema";
import { storage } from "../storage";

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
      shellShareOverride: input.shellShareOverride?.toString(),
      interiorShareOverride: input.interiorShareOverride?.toString(),
      landscapeShareOverride: input.landscapeShareOverride?.toString(),
      // Convert new override fields to strings
      telecomPercentageOverride: input.telecomPercentageOverride?.toString(),
      structuralPercentageOverride: input.structuralPercentageOverride?.toString(),
      civilPercentageOverride: input.civilPercentageOverride?.toString(),
      mechanicalPercentageOverride: input.mechanicalPercentageOverride?.toString(),
      electricalPercentageOverride: input.electricalPercentageOverride?.toString(),
      plumbingPercentageOverride: input.plumbingPercentageOverride?.toString(),
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
      isDemo: input.projectName === 'Demo Project'
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
    return multiplierData ? parseFloat(multiplierData.multiplier) : (0.8 + 0.1 * category);
  }
  
  private async getBuildingCostData(input: ComprehensiveProjectInput) {
    // Use the new comprehensive database structure
    // buildingTier in the input maps directly to building_tier in database
    let mappedBuildingType = input.buildingTier || input.buildingType;
    
    // Handle legacy building type mappings
    if (input.buildingType === 'Residence - Private') {
      mappedBuildingType = 'Custom Houses'; // Default to Custom Houses for private residences
    }
    
    // Map design level to tier text for the new database
    const tierMap: Record<number, string> = {
      1: 'Low-end',
      2: 'Mid', 
      3: 'High-end'
    };
    const tierText = tierMap[input.designLevel] || 'Mid';
    
    // Get comprehensive data from new database structure
    const comprehensiveData = await storage.getBuildingCostData(mappedBuildingType, tierText);
    
    if (comprehensiveData) {
      // Convert comprehensive data to the expected format for existing calculator logic
      return {
        allInMin: (parseFloat(comprehensiveData.shellNewMin) + parseFloat(comprehensiveData.interiorNewMin) + 
                  parseFloat(comprehensiveData.outdoorNewMin)).toString(),
        allInMax: (parseFloat(comprehensiveData.shellNewMax) + parseFloat(comprehensiveData.interiorNewMax) + 
                  parseFloat(comprehensiveData.outdoorNewMax)).toString(),
        archShare: (parseFloat(comprehensiveData.projectShellShare) / 100).toString(),
        intShare: (parseFloat(comprehensiveData.projectInteriorShare) / 100).toString(),
        landShare: (parseFloat(comprehensiveData.projectLandscapeShare) / 100).toString(),
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
    // Calculate cost per square foot
    const newCostMin = parseFloat(costData.allInMin) * input.historicMultiplier;
    const newCostMax = parseFloat(costData.allInMax) * input.historicMultiplier;
    const newCostTarget = input.newConstructionTargetCost || (newCostMin + newCostMax) / 2;
    
    const remodelCostMin = newCostMin * input.remodelMultiplier;
    const remodelCostMax = newCostMax * input.remodelMultiplier;
    const remodelCostTarget = input.remodelTargetCost || (remodelCostMin + remodelCostMax) / 2;
    
    // Calculate budgets
    const newBudget = input.newBuildingArea * newCostTarget;
    const remodelBudget = input.existingBuildingArea * remodelCostTarget;
    const totalBudget = newBudget + remodelBudget;
    
    // Get share percentages
    const shellShare = input.shellShareOverride || parseFloat(costData.archShare || '0.70');
    const interiorShare = input.interiorShareOverride || parseFloat(costData.intShare || '0.20');
    const landscapeShare = input.landscapeShareOverride || parseFloat(costData.landShare || '0.10');
    
    // Calculate category budgets
    const shellBudgetNew = newBudget * shellShare;
    const shellBudgetExisting = remodelBudget * shellShare;
    const shellBudgetTotal = shellBudgetNew + shellBudgetExisting;
    
    const interiorBudgetNew = newBudget * interiorShare;
    const interiorBudgetExisting = remodelBudget * interiorShare;
    const interiorBudgetTotal = interiorBudgetNew + interiorBudgetExisting;
    
    const landscapeBudgetNew = newBudget * landscapeShare;
    const landscapeBudgetExisting = remodelBudget * landscapeShare;
    const landscapeBudgetTotal = landscapeBudgetNew + landscapeBudgetExisting;
    
    // Get engineering percentages (simplified for now)
    const engineeringPercentages = await this.getEngineeringPercentages(input);
    
    // Calculate engineering budgets with proper new/remodel ratio
    // For structural: Remodel areas are reduced by remodel multiplier
    // For other disciplines: Standard remodel calculation
    const structuralBudgetNew = newBudget * engineeringPercentages.structural * shellShare;
    const structuralBudgetRemodel = remodelBudget * engineeringPercentages.structural * shellShare * 0.5; // 50% reduction for remodel
    const structuralBudget = structuralBudgetNew + structuralBudgetRemodel;
    
    const civilBudgetNew = newBudget * engineeringPercentages.civil * shellShare;
    const civilBudgetRemodel = remodelBudget * engineeringPercentages.civil * shellShare * 0.5;
    const civilBudget = civilBudgetNew + civilBudgetRemodel;
    
    const mechanicalBudgetNew = newBudget * engineeringPercentages.mechanical * shellShare;
    const mechanicalBudgetRemodel = remodelBudget * engineeringPercentages.mechanical * shellShare * 0.5;
    const mechanicalBudget = mechanicalBudgetNew + mechanicalBudgetRemodel;
    
    const electricalBudgetNew = newBudget * engineeringPercentages.electrical * shellShare;
    const electricalBudgetRemodel = remodelBudget * engineeringPercentages.electrical * shellShare * 0.5;
    const electricalBudget = electricalBudgetNew + electricalBudgetRemodel;
    
    const plumbingBudgetNew = newBudget * engineeringPercentages.plumbing * shellShare;
    const plumbingBudgetRemodel = remodelBudget * engineeringPercentages.plumbing * shellShare * 0.5;
    const plumbingBudget = plumbingBudgetNew + plumbingBudgetRemodel;
    
    const telecomBudgetNew = newBudget * engineeringPercentages.telecom * shellShare;
    const telecomBudgetRemodel = remodelBudget * engineeringPercentages.telecom * shellShare * 0.5;
    const telecomBudget = telecomBudgetNew + telecomBudgetRemodel;
    
    // Architecture budget = Shell budget MINUS all engineering budgets
    const totalEngineeringBudget = structuralBudget + civilBudget + mechanicalBudget + electricalBudget + plumbingBudget + telecomBudget;
    const architectureBudget = shellBudgetTotal - totalEngineeringBudget;
    
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
    // Default engineering percentages from Python code
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
    return {
      structural: input.structuralPercentageOverride ?? defaultPercentages.structural,
      civil: input.civilPercentageOverride ?? defaultPercentages.civil,
      mechanical: input.mechanicalPercentageOverride ?? defaultPercentages.mechanical,
      electrical: input.electricalPercentageOverride ?? defaultPercentages.electrical,
      plumbing: input.plumbingPercentageOverride ?? defaultPercentages.plumbing,
      telecom: input.telecomPercentageOverride ?? defaultPercentages.telecom
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
    
    const averagePricingPerHour = Math.round(
      (laborRate + overheadRate) * markupFactor
    );
    
    const totalArea = input.newBuildingArea + input.existingBuildingArea;
    const newBudget = parseFloat(calculations.newBudget);
    const remodelBudget = parseFloat(calculations.remodelBudget);
    const totalBudget = parseFloat(calculations.totalBudget);
    
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
        hours: (scanBuildingFee / averagePricingPerHour).toString(),
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
        hours: (scanSiteFee / averagePricingPerHour).toString(),
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
        isInhouse: true,
        feeAdjustment: input.architectureFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Interior design', 
        budget: parseFloat(calculations.interiorBudgetTotal), 
        isInhouse: true,
        feeAdjustment: input.interiorFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Landscape architecture', 
        budget: parseFloat(calculations.landscapeBudgetTotal), 
        isInhouse: true,
        feeAdjustment: input.landscapeFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Structural engineer', 
        budget: parseFloat(calculations.structuralBudget), 
        isInhouse: true,
        feeAdjustment: input.structuralFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Civil / site engineer', 
        budget: parseFloat(calculations.civilBudget), 
        isInhouse: true,
        feeAdjustment: input.civilFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Mechanical (HVAC, energy, pools)', 
        budget: parseFloat(calculations.mechanicalBudget), 
        isInhouse: false,
        feeAdjustment: input.mechanicalFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Electrical (power / lighting)', 
        budget: parseFloat(calculations.electricalBudget), 
        isInhouse: false,
        feeAdjustment: input.electricalFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Plumbing engineer', 
        budget: parseFloat(calculations.plumbingBudget), 
        isInhouse: true,
        feeAdjustment: input.plumbingFeeAdjustment ?? 1.0
      },
      { 
        scope: 'Telecomunication', 
        budget: parseFloat(calculations.telecomBudget), 
        isInhouse: false,
        feeAdjustment: input.telecomFeeAdjustment ?? 1.0
      }
    ];
    
    for (const disc of disciplines) {
      // Architecture should use higher fee percentage according to spreadsheet analysis
      let basePercentage = 0.07; // Default 7% base
      
      if (disc.scope.includes('Architecture')) {
        // Architecture fee should be approximately 28% based on spreadsheet analysis 
        // ($118,000 on $418,687 budget = 28.2%)
        basePercentage = 0.282;
      } else if (disc.scope.includes('Interior')) {
        basePercentage = 0.06;
      } else if (disc.scope.includes('Landscape')) {
        basePercentage = 0.05;
      } else {
        // Engineering disciplines - simpler percentage based on curve
        basePercentage = 0.07498 + 0.007824 * Math.pow(disc.budget / 1000000, -0.7495);
      }
      
      // Apply fee adjustment (discount or premium)
      const adjustedMarketFee = basePercentage * disc.budget * disc.feeAdjustment;
      const louisAmyFee = disc.isInhouse ? adjustedMarketFee : 0;
      const coordinationFee = disc.isInhouse ? 0 : adjustedMarketFee * this.COORDINATION_FEE_PERCENT;
      const consultantFee = disc.isInhouse ? 0 : adjustedMarketFee;
      
      fees.push({
        id: '',
        projectId: project.id,
        scope: disc.scope,
        percentOfCost: basePercentage.toString(),
        ratePerSqFt: (adjustedMarketFee / totalArea).toString(),
        marketFee: adjustedMarketFee.toString(),
        louisAmyFee: louisAmyFee.toString(),
        hours: disc.isInhouse ? (louisAmyFee / averagePricingPerHour).toString() : '0',
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
    
    // Calculate total hours from fees
    const totalMarketFee = fees.reduce((sum, f) => sum + parseFloat(f.marketFee), 0);
    const totalLAHours = fees
      .filter(f => f.isInhouse)
      .reduce((sum, f) => sum + parseFloat(f.hours || '0'), 0);
    
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