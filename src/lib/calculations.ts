import type {
  ProjectInput,
  CostData,
  BudgetBreakdown,
  DisciplineBudget,
  FeeAnalysis,
  FeeLine,
  BottomUpCosts,
  HoursAnalysis,
  HoursPhaseDistribution,
  HoursRoleDistribution,
  CalculationResult,
  ShareOverrides,
  DisciplineOverrides,
  CostTargetOverrides,
  ServiceToggles
} from '../types';

// Constants for the fee percentage curve (from the Excel model)
const FEE_A = 0.07498;
const FEE_B = 0.007824;
const FEE_P = -0.7495;

// Constants for the hours calculation (non‑linear) from the Excel model
const HOURS_A = 0.21767;
const HOURS_B = 11.21274;
const HOURS_P = -0.53816;
const HOURS_SUB = 0.08;

/**
 * Compute the category multiplier from a category number (1–5).
 * Category 1 maps to 0.9, 2 maps to 1.0, … up to 5 mapping to 1.3.
 */
export function getCategoryMultiplier(category: number): number {
  return 0.8 + 0.1 * category;
}

/**
 * Apply historic multiplier to cost data
 */
export function applyHistoricMultiplier(costData: CostData, historicMultiplier: number): CostData {
  return {
    ...costData,
    shellNewMin: costData.shellNewMin * historicMultiplier,
    shellNewTarget: costData.shellNewTarget * historicMultiplier,
    shellNewMax: costData.shellNewMax * historicMultiplier,
    interiorNewMin: costData.interiorNewMin * historicMultiplier,
    interiorNewTarget: costData.interiorNewTarget * historicMultiplier,
    interiorNewMax: costData.interiorNewMax * historicMultiplier,
    landscapeNewMin: costData.landscapeNewMin * historicMultiplier,
    landscapeNewTarget: costData.landscapeNewTarget * historicMultiplier,
    landscapeNewMax: costData.landscapeNewMax * historicMultiplier,
  };
}

/**
 * Apply cost target overrides to cost data
 */
export function applyCostTargetOverrides(
  costData: CostData, 
  overrides: CostTargetOverrides
): CostData {
  return {
    ...costData,
    shellNewTarget: overrides.shellNew ?? costData.shellNewTarget,
    shellRemodelTarget: overrides.shellRemodel ?? costData.shellRemodelTarget,
    interiorNewTarget: overrides.interiorNew ?? costData.interiorNewTarget,
    interiorRemodelTarget: overrides.interiorRemodel ?? costData.interiorRemodelTarget,
    landscapeNewTarget: overrides.landscapeNew ?? costData.landscapeNewTarget,
    landscapeRemodelTarget: overrides.landscapeRemodel ?? costData.landscapeRemodelTarget,
  };
}

/**
 * Apply share overrides to cost data
 */
export function applyShareOverrides(costData: CostData, overrides: ShareOverrides): CostData {
  const shell = overrides.shell ?? costData.shellShare;
  const interior = overrides.interior ?? costData.interiorShare;
  const landscape = overrides.landscape ?? costData.landscapeShare;
  
  // Validate that shares sum to 1.0
  const total = shell + interior + landscape;
  if (Math.abs(total - 1.0) > 0.001) {
    throw new Error(`Share overrides must sum to 100%. Current total: ${(total * 100).toFixed(1)}%`);
  }
  
  return {
    ...costData,
    shellShare: shell,
    interiorShare: interior,
    landscapeShare: landscape,
  };
}

/**
 * Apply discipline overrides to cost data
 */
export function applyDisciplineOverrides(
  costData: CostData, 
  overrides: DisciplineOverrides
): CostData {
  const structural = overrides.structural ?? costData.structuralShare;
  const civil = overrides.civil ?? costData.civilShare;
  const mechanical = overrides.mechanical ?? costData.mechanicalShare;
  const electrical = overrides.electrical ?? costData.electricalShare;
  const plumbing = overrides.plumbing ?? costData.plumbingShare;
  const telecom = overrides.telecom ?? costData.telecomShare;
  
  // Architecture gets the remainder
  const engineeringTotal = structural + civil + mechanical + electrical + plumbing + telecom;
  
  // Validate that engineering disciplines don't exceed 100%
  if (engineeringTotal > 1.0) {
    throw new Error(`Engineering disciplines cannot exceed 100%. Current total: ${(engineeringTotal * 100).toFixed(1)}%`);
  }
  
  return {
    ...costData,
    structuralShare: structural,
    civilShare: civil,
    mechanicalShare: mechanical,
    electricalShare: electrical,
    plumbingShare: plumbing,
    telecomShare: telecom,
  };
}

/**
 * Calculate the budget breakdown for a project based on input and cost data.
 */
export function calculateBudgets(input: ProjectInput, costData: CostData): BudgetBreakdown {
  // Calculate budgets using target costs
  const newBudget = input.newArea * (
    costData.shellNewTarget + 
    costData.interiorNewTarget + 
    costData.landscapeNewTarget
  );
  
  const remodelBudget = input.existingArea * (
    costData.shellRemodelTarget + 
    costData.interiorRemodelTarget + 
    costData.landscapeRemodelTarget
  );
  
  const totalBudget = newBudget + remodelBudget;
  
  // Component budgets using shares
  const shellBudgetNew = newBudget * costData.shellShare;
  const shellBudgetRemodel = remodelBudget * costData.shellShare;
  const interiorBudgetNew = newBudget * costData.interiorShare;
  const interiorBudgetRemodel = remodelBudget * costData.interiorShare;
  const landscapeBudgetNew = newBudget * costData.landscapeShare;
  const landscapeBudgetRemodel = remodelBudget * costData.landscapeShare;
  
  return {
    newBudget,
    remodelBudget,
    totalBudget,
    shell: { 
      new: shellBudgetNew, 
      remodel: shellBudgetRemodel, 
      total: shellBudgetNew + shellBudgetRemodel 
    },
    interior: { 
      new: interiorBudgetNew, 
      remodel: interiorBudgetRemodel, 
      total: interiorBudgetNew + interiorBudgetRemodel 
    },
    landscape: { 
      new: landscapeBudgetNew, 
      remodel: landscapeBudgetRemodel, 
      total: landscapeBudgetNew + landscapeBudgetRemodel 
    },
  };
}

/**
 * Calculate discipline budgets for engineering and design. Structural remodel
 * budgets are reduced by the remodel multiplier.
 */
export function calculateDisciplineBudgets(
  budgets: BudgetBreakdown, 
  costData: CostData, 
  remodelMultiplier: number
): DisciplineBudget {
  const { shell, interior, landscape } = budgets;
  
  // Engineering discipline budgets from shell
  const structuralNew = shell.new * costData.structuralShare;
  const structuralRemodel = shell.remodel * costData.structuralShare * remodelMultiplier;
  
  const civilNew = shell.new * costData.civilShare;
  const civilRemodel = shell.remodel * costData.civilShare;
  
  const mechanicalNew = shell.new * costData.mechanicalShare;
  const mechanicalRemodel = shell.remodel * costData.mechanicalShare;
  
  const electricalNew = shell.new * costData.electricalShare;
  const electricalRemodel = shell.remodel * costData.electricalShare;
  
  const plumbingNew = shell.new * costData.plumbingShare;
  const plumbingRemodel = shell.remodel * costData.plumbingShare;
  
  const telecomNew = shell.new * costData.telecomShare;
  const telecomRemodel = shell.remodel * costData.telecomShare;
  
  // Architecture gets the remainder of shell budget
  const engineeringNew = structuralNew + civilNew + mechanicalNew + electricalNew + plumbingNew + telecomNew;
  const engineeringRemodel = structuralRemodel + civilRemodel + mechanicalRemodel + electricalRemodel + plumbingRemodel + telecomRemodel;
  
  const architectureNew = shell.new - engineeringNew;
  const architectureRemodel = shell.remodel - engineeringRemodel;
  
  return {
    structural: { 
      new: structuralNew, 
      remodel: structuralRemodel, 
      total: structuralNew + structuralRemodel 
    },
    civil: { 
      new: civilNew, 
      remodel: civilRemodel, 
      total: civilNew + civilRemodel 
    },
    mechanical: { 
      new: mechanicalNew, 
      remodel: mechanicalRemodel, 
      total: mechanicalNew + mechanicalRemodel 
    },
    electrical: { 
      new: electricalNew, 
      remodel: electricalRemodel, 
      total: electricalNew + electricalRemodel 
    },
    plumbing: { 
      new: plumbingNew, 
      remodel: plumbingRemodel, 
      total: plumbingNew + plumbingRemodel 
    },
    telecom: { 
      new: telecomNew, 
      remodel: telecomRemodel, 
      total: telecomNew + telecomRemodel 
    },
    architecture: { 
      new: architectureNew, 
      remodel: architectureRemodel, 
      total: architectureNew + architectureRemodel 
    },
    interior: { 
      new: interior.new, 
      remodel: interior.remodel, 
      total: interior.total 
    },
    landscape: { 
      new: landscape.new, 
      remodel: landscape.remodel, 
      total: landscape.total 
    },
  };
}

/**
 * Calculate top‑down fees for all scopes using the fee curve formula
 */
export function calculateTopDownFees(
  input: ProjectInput,
  budgets: BudgetBreakdown,
  disciplineBudgets: DisciplineBudget,
  categoryMultiplier: number,
  serviceToggles: ServiceToggles
): FeeAnalysis {
  const totalArea = input.newArea + input.existingArea;
  const { newBudget, remodelBudget, totalBudget } = budgets;
  
  // Helper to compute percent of project cost using the fee curve
  function calculateFeePercentage(budgetRef: number, includeRemodelBoost: boolean): number {
    if (totalBudget === 0) return 0;
    
    const basePct = FEE_A + FEE_B * Math.pow(budgetRef / 1_000_000, FEE_P);
    let pct = basePct * categoryMultiplier;
    
    // Adjust for new vs remodel ratio
    pct *= ((0.95 * newBudget) + (1.05 * remodelBudget)) / totalBudget;
    
    // Apply remodel complexity boost for design disciplines
    if (includeRemodelBoost) {
      pct *= (1 + (1 - input.remodelMultiplier));
    }
    
    return pct;
  }
  
  const lines: FeeLine[] = [];
  let marketFeeSum = 0;
  let louisAmySum = 0;
  
  // Scan to BIM fees (if applicable)
  if (input.existingArea > 0) {
    const scanBuildingRate = (0.6 + 0.006 * Math.pow((1000 + input.existingArea) / 1_000_000, FEE_P)) * categoryMultiplier;
    const scanBuildingFee = scanBuildingRate * input.existingArea;
    
    lines.push({
      scope: 'Scan to BIM - Building',
      percentOfCost: null,
      ratePerSqFt: scanBuildingRate,
      marketFee: scanBuildingFee,
      louisAmyFee: scanBuildingFee,
      consultantFee: 0,
      coordinationFee: 0,
      isInHouse: true,
    });
    
    marketFeeSum += scanBuildingFee;
    louisAmySum += scanBuildingFee;
  }
  
  if (input.siteArea > 0) {
    const scanSiteRate = (1 + 0.00091 * Math.pow(input.siteArea / 1_000_000, -0.005)) * categoryMultiplier / (3.28 ** 2) + 0.08;
    const scanSiteFee = scanSiteRate * input.siteArea;
    
    lines.push({
      scope: 'Scan to BIM - Site',
      percentOfCost: null,
      ratePerSqFt: scanSiteRate / (3.28 ** 2), // Convert to per sq ft
      marketFee: scanSiteFee,
      louisAmyFee: scanSiteFee,
      consultantFee: 0,
      coordinationFee: 0,
      isInHouse: true,
    });
    
    marketFeeSum += scanSiteFee;
    louisAmySum += scanSiteFee;
  }
  
  // Define scopes with their properties
  const scopes = [
    { key: 'architecture' as keyof DisciplineBudget, label: 'Architecture (Design + Consultant Admin.)', remodelBoost: true, defaultInHouse: true },
    { key: 'interior' as keyof DisciplineBudget, label: 'Interior design', remodelBoost: true, defaultInHouse: true },
    { key: 'landscape' as keyof DisciplineBudget, label: 'Landscape architecture', remodelBoost: true, defaultInHouse: true },
    { key: 'structural' as keyof DisciplineBudget, label: 'Structural engineer', remodelBoost: false, defaultInHouse: false },
    { key: 'civil' as keyof DisciplineBudget, label: 'Civil / site engineer', remodelBoost: false, defaultInHouse: false },
    { key: 'mechanical' as keyof DisciplineBudget, label: 'Mechanical (HVAC, energy, pools)', remodelBoost: false, defaultInHouse: false },
    { key: 'electrical' as keyof DisciplineBudget, label: 'Electrical (power / lighting)', remodelBoost: false, defaultInHouse: false },
    { key: 'plumbing' as keyof DisciplineBudget, label: 'Plumbing engineer', remodelBoost: false, defaultInHouse: false },
    { key: 'telecom' as keyof DisciplineBudget, label: 'Telecommunication', remodelBoost: false, defaultInHouse: false },
  ];
  
  scopes.forEach(({ key, label, remodelBoost, defaultInHouse }) => {
    const scopeBudget = disciplineBudgets[key].total;
    const isInHouse = serviceToggles[key] ?? defaultInHouse;
    
    if (scopeBudget > 0) {
      const pct = calculateFeePercentage(scopeBudget, remodelBoost);
      const marketFee = pct * scopeBudget;
      const ratePerSqFt = totalArea > 0 ? (marketFee / totalArea) : 0;
      
      let louisAmy = 0;
      let consultant = 0;
      let coordination = 0;
      
      if (isInHouse) {
        louisAmy = marketFee;
      } else {
        consultant = marketFee;
        coordination = marketFee * 0.15; // 15% coordination fee
      }
      
      lines.push({
        scope: label,
        percentOfCost: pct,
        ratePerSqFt,
        marketFee,
        louisAmyFee: louisAmy,
        consultantFee: consultant,
        coordinationFee: coordination,
        isInHouse,
      });
      
      marketFeeSum += marketFee;
      louisAmySum += louisAmy;
    }
  });
  
  return {
    marketFee: marketFeeSum,
    louisAmyFee: louisAmySum,
    lines,
  };
}

/**
 * Calculate total project hours using the non‑linear formula
 */
export function calculateTotalHours(input: ProjectInput, categoryMultiplier: number): number {
  const area = input.newArea + input.existingArea;
  if (area === 0) return 0;
  
  const baseFactor = (HOURS_A + HOURS_B * Math.pow(area, HOURS_P) - HOURS_SUB) * categoryMultiplier;
  const newFactor = baseFactor * 0.9;
  const remodelFactor = baseFactor * 0.8;
  
  const newHours = newFactor * input.newArea;
  const remodelHours = remodelFactor * input.existingArea * 1.15; // 15% uplift for remodel
  
  return newHours + remodelHours;
}

/**
 * Calculate bottom‑up costs using labour and overhead rates
 */
export function calculateBottomUpCosts(
  totalHours: number,
  labourRate: number = 40,
  overheadRate: number = 50,
  markupFactor: number = 2.2,
  discount: number = 0.15
): BottomUpCosts {
  const labourCost = totalHours * labourRate;
  const withOverhead = labourCost + (totalHours * overheadRate);
  const withMarkup = withOverhead * markupFactor;
  const fee = withMarkup * (1 - discount);
  
  return {
    totalHours,
    labourCost,
    withOverhead,
    withMarkup,
    fee,
  };
}

/**
 * Distribute total hours across phases and roles using fixed percentages
 */
export function calculateHoursDistribution(totalHours: number): HoursAnalysis {
  const phaseData = [
    { phase: 'Discovery', percent: 0.08 },
    { phase: 'Creative - Conceptual', percent: 0.08 },
    { phase: 'Creative - Schematic', percent: 0.34 },
    { phase: 'Creative - Preliminary', percent: 0.08 },
    { phase: 'Technical - Schematic', percent: 0.34 },
    { phase: 'Technical - Preliminary', percent: 0.08 },
  ];
  
  const roleLeverage: Record<string, Record<string, number>> = {
    'Discovery': { designer1: 0.37, designer2: 0.37, architect: 0.10, engineer: 0.02, principal: 0.14 },
    'Creative - Conceptual': { designer1: 0.00, designer2: 0.00, architect: 0.95, engineer: 0.00, principal: 0.05 },
    'Creative - Schematic': { designer1: 0.32, designer2: 0.32, architect: 0.32, engineer: 0.02, principal: 0.02 },
    'Creative - Preliminary': { designer1: 0.32, designer2: 0.32, architect: 0.32, engineer: 0.02, principal: 0.02 },
    'Technical - Schematic': { designer1: 0.26, designer2: 0.26, architect: 0.10, engineer: 0.32, principal: 0.06 },
    'Technical - Preliminary': { designer1: 0.26, designer2: 0.26, architect: 0.10, engineer: 0.32, principal: 0.06 },
  };
  
  const phases: HoursPhaseDistribution[] = [];
  const roleTotals: Record<string, number> = {
    designer1: 0,
    designer2: 0,
    architect: 0,
    engineer: 0,
    principal: 0,
  };
  
  phaseData.forEach(({ phase, percent }) => {
    const hours = totalHours * percent;
    phases.push({ phase, hours, percentage: percent });
    
    const leverage = roleLeverage[phase];
    Object.keys(leverage).forEach(role => {
      roleTotals[role] += hours * leverage[role];
    });
  });
  
  const roles: HoursRoleDistribution[] = [
    { role: 'Designer 1', hours: roleTotals.designer1, percentage: roleTotals.designer1 / totalHours },
    { role: 'Designer 2', hours: roleTotals.designer2, percentage: roleTotals.designer2 / totalHours },
    { role: 'Architect', hours: roleTotals.architect, percentage: roleTotals.architect / totalHours },
    { role: 'Engineer', hours: roleTotals.engineer, percentage: roleTotals.engineer / totalHours },
    { role: 'Principal', hours: roleTotals.principal, percentage: roleTotals.principal / totalHours },
  ];
  
  return {
    totalProjectHours: totalHours,
    phases,
    roles,
  };
}

/**
 * Main calculation function that orchestrates all calculations
 */
export function calculateProject(
  input: ProjectInput,
  costData: CostData,
  shareOverrides: ShareOverrides = {},
  disciplineOverrides: DisciplineOverrides = {},
  costTargetOverrides: CostTargetOverrides = {},
  serviceToggles: ServiceToggles = {
    architecture: true,
    interior: true,
    landscape: true,
    structural: false,
    civil: false,
    mechanical: false,
    electrical: false,
    plumbing: false,
    telecom: false,
  },
  labourRate: number = 40,
  overheadRate: number = 50,
  markupFactor: number = 2.2,
  discount: number = 0.15
): CalculationResult {
  // Apply all overrides to cost data
  let adjustedCostData = applyHistoricMultiplier(costData, input.historicMultiplier);
  adjustedCostData = applyCostTargetOverrides(adjustedCostData, costTargetOverrides);
  adjustedCostData = applyShareOverrides(adjustedCostData, shareOverrides);
  adjustedCostData = applyDisciplineOverrides(adjustedCostData, disciplineOverrides);
  
  const categoryMultiplier = getCategoryMultiplier(input.category);
  
  // Calculate all components
  const budgets = calculateBudgets(input, adjustedCostData);
  const disciplineBudgets = calculateDisciplineBudgets(budgets, adjustedCostData, input.remodelMultiplier);
  const topDownFees = calculateTopDownFees(input, budgets, disciplineBudgets, categoryMultiplier, serviceToggles);
  
  const totalHours = calculateTotalHours(input, categoryMultiplier);
  const bottomUpCosts = calculateBottomUpCosts(totalHours, labourRate, overheadRate, markupFactor, discount);
  const hoursAnalysis = calculateHoursDistribution(totalHours);
  
  return {
    budgets,
    disciplineBudgets,
    topDownFees,
    bottomUpCosts,
    hoursAnalysis,
    categoryMultiplier,
    costData: adjustedCostData,
  };
}
