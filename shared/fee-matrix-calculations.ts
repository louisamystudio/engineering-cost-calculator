import type { 
  BudgetCalculationResult, 
  FeeMatrixInput, 
  FeeMatrixResult,
  DisciplineFee,
  ScanningFee 
} from './schema';

// Fee curve constants from the Excel sheet
const FEE_CURVE_CONSTANTS = {
  a: 0.07498,
  b: 0.007824,
  c: -0.7495,
};

// Hourly factor constants
const HOURLY_FACTOR_CONSTANTS = {
  a: 0.21767,
  b: 11.21274,
  c: -0.53816,
  adjustment: -0.08,
};

// Scanning rates
const SCANNING_RATES = {
  existing_building_scan: 1.2,
  site_scan: 1.2,
};

// Discipline configuration: which are internal vs consultants
const DISCIPLINE_CONFIG = {
  'Architecture': { is_internal: true, budget_key: 'shell' },
  'Interior': { is_internal: true, budget_key: 'interior' },
  'Landscape': { is_internal: true, budget_key: 'landscape' },
  'Structural': { is_internal: false, budget_key: 'Structural' },
  'Civil & Site': { is_internal: true, budget_key: 'Civil & Site' },
  'Mechanical': { is_internal: false, budget_key: 'Mechanical' },
  'Electrical': { is_internal: false, budget_key: 'Electrical' },
  'Plumbing': { is_internal: true, budget_key: 'Plumbing' },
  'Low-Voltage': { is_internal: false, budget_key: 'Low-Voltage' },
};

/**
 * Calculate fee percentage using the complexity-adjusted curve
 */
function calculateFeePercentage(budget: number, complexityMultiplier: number): number {
  const { a, b, c } = FEE_CURVE_CONSTANTS;
  return (a + b * Math.pow(budget / 1_000_000, c)) * (1 + complexityMultiplier);
}

/**
 * Calculate hourly factor from total building area
 */
function calculateHourlyFactor(totalBuildingArea: number): number {
  const { a, b, c, adjustment } = HOURLY_FACTOR_CONSTANTS;
  return a + b * Math.pow(totalBuildingArea, c) + adjustment;
}

/**
 * Calculate scanning fees
 */
function calculateScanningFees(
  budgetResult: BudgetCalculationResult,
  discountRate: number,
  averageBillableRate: number
): ScanningFee[] {
  const scanningFees: ScanningFee[] = [];
  
  const existingArea = budgetResult.inputs.existing_area_ft2;
  const siteArea = budgetResult.inputs.site_area_m2 || 0;

  // Existing Building Scan to BIM
  if (existingArea > 0) {
    const fee = SCANNING_RATES.existing_building_scan * existingArea;
    const discountedFee = fee * (1 - discountRate);
    scanningFees.push({
      service: 'Existing Building Scan to BIM',
      area: existingArea,
      rate: SCANNING_RATES.existing_building_scan,
      fee,
      discounted_fee: discountedFee,
      hours: discountedFee / averageBillableRate,
    });
  }

  // Site Scan to BIM
  if (siteArea > 0) {
    const fee = SCANNING_RATES.site_scan * siteArea;
    const discountedFee = fee * (1 - discountRate);
    scanningFees.push({
      service: 'Site Scan to BIM',
      area: siteArea,
      rate: SCANNING_RATES.site_scan,
      fee,
      discounted_fee: discountedFee,
      hours: discountedFee / averageBillableRate,
    });
  }

  return scanningFees;
}

/**
 * Get budget value for a discipline
 */
function getDisciplineBudget(budgetResult: BudgetCalculationResult, discipline: string): number {
  const config = DISCIPLINE_CONFIG[discipline as keyof typeof DISCIPLINE_CONFIG];
  if (!config) return 0;

  switch (config.budget_key) {
    case 'shell':
      return budgetResult.minimum_budgets.shell;
    case 'interior':
      return budgetResult.minimum_budgets.interior;
    case 'landscape':
      return budgetResult.minimum_budgets.landscape;
    default:
      // Engineering disciplines
      return budgetResult.engineering_budgets[config.budget_key] || 0;
  }
}

/**
 * Calculate discipline fees
 */
function calculateDisciplineFees(
  budgetResult: BudgetCalculationResult,
  complexityMultiplier: number,
  discountRate: number,
  averageBillableRate: number
): DisciplineFee[] {
  const disciplineFees: DisciplineFee[] = [];
  const totalBuildingArea = budgetResult.area.total_sf;

  Object.keys(DISCIPLINE_CONFIG).forEach(discipline => {
    const config = DISCIPLINE_CONFIG[discipline as keyof typeof DISCIPLINE_CONFIG];
    const budget = getDisciplineBudget(budgetResult, discipline);
    
    if (budget <= 0) return;

    const percentage = calculateFeePercentage(budget, complexityMultiplier);
    const fee = percentage * budget;
    const ratePsf = fee / totalBuildingArea;

    let discountedFee: number | undefined;
    let consultantFee: number | undefined;
    let hours: number | undefined;

    if (config.is_internal) {
      discountedFee = fee * (1 - discountRate);
      hours = discountedFee / averageBillableRate;
    } else {
      consultantFee = fee;
    }

    disciplineFees.push({
      discipline,
      budget,
      percentage,
      fee,
      discounted_fee: discountedFee,
      consultant_fee: consultantFee,
      rate_psf: ratePsf,
      hours,
      is_internal: config.is_internal,
    });
  });

  return disciplineFees;
}

/**
 * Main fee matrix calculation function
 */
export function calculateFeeMatrix(input: FeeMatrixInput): FeeMatrixResult {
  const { budget_result, complexity_multiplier, discount_rate, average_billable_rate } = input;
  
  // Calculate scanning fees
  const scanningFees = calculateScanningFees(budget_result, discount_rate, average_billable_rate);
  
  // Calculate discipline fees
  const disciplineFees = calculateDisciplineFees(
    budget_result, 
    complexity_multiplier, 
    discount_rate, 
    average_billable_rate
  );

  // Calculate totals
  const scanningTotal = scanningFees.reduce((sum, fee) => sum + fee.fee, 0);
  const disciplineTotal = disciplineFees.reduce((sum, fee) => sum + fee.fee, 0);
  const marketFee = scanningTotal + disciplineTotal;

  const consultantTotal = disciplineFees.reduce((sum, fee) => sum + (fee.consultant_fee || 0), 0);
  const scanningDiscountedTotal = scanningFees.reduce((sum, fee) => sum + fee.discounted_fee, 0);
  const disciplineDiscountedTotal = disciplineFees.reduce((sum, fee) => sum + (fee.discounted_fee || 0), 0);
  const discountedTotal = scanningDiscountedTotal + disciplineDiscountedTotal;

  const overallPercentage = marketFee / budget_result.total_cost.proposed;
  const ratePerFt2 = marketFee / budget_result.area.total_sf;

  const scanningHours = scanningFees.reduce((sum, fee) => sum + (fee.hours || 0), 0);
  const disciplineHours = disciplineFees.reduce((sum, fee) => sum + (fee.hours || 0), 0);
  const totalHours = scanningHours + disciplineHours;

  // Calculate hourly factor and raw design hours
  const hfValue = calculateHourlyFactor(budget_result.area.total_sf);
  const rawDesignHours = hfValue * budget_result.area.total_sf;

  // Calculate cost base breakdown
  const interiorDiscountedFee = disciplineFees.find(d => d.discipline === 'Interior')?.discounted_fee || 0;
  const landscapeDiscountedFee = disciplineFees.find(d => d.discipline === 'Landscape')?.discounted_fee || 0;
  const shellCostBase = discountedTotal - interiorDiscountedFee - landscapeDiscountedFee;

  return {
    inputs: input,
    scanning_fees: scanningFees,
    discipline_fees: disciplineFees,
    totals: {
      market_fee: Math.round(marketFee * 100) / 100,
      consultant_total: Math.round(consultantTotal * 100) / 100,
      discounted_total: Math.round(discountedTotal * 100) / 100,
      overall_percentage: Math.round(overallPercentage * 10000) / 100, // Convert to percentage
      rate_per_ft2: Math.round(ratePerFt2 * 100) / 100,
      total_hours: Math.round(totalHours * 100) / 100,
    },
    hourly_factor: {
      hf_value: Math.round(hfValue * 100000) / 100000,
      raw_design_hours: Math.round(rawDesignHours * 100) / 100,
      total_building_area: budget_result.area.total_sf,
    },
    cost_base: {
      shell_cost_base: Math.round(shellCostBase * 100) / 100,
      interior_cost_base: Math.round(interiorDiscountedFee * 100) / 100,
      landscape_cost_base: Math.round(landscapeDiscountedFee * 100) / 100,
    },
  };
}