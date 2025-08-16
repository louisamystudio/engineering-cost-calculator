import type { BudgetInput, BudgetCalculationResult, BuildingCostRange, EngineeringCost } from './schema';

// Parse percentage string to decimal (e.g., "6.0%" -> 0.06)
function parsePercentage(percentStr: string): number {
  if (typeof percentStr !== 'string') return 0;
  const cleaned = percentStr.replace('%', '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num / 100;
}

// Engineering discipline categories we expect
const ENGINEERING_DISCIPLINES = [
  'Civil & Site',
  'Structural', 
  'Mechanical',
  'Electrical',
  'Plumbing',
  'Low-Voltage'
];

export function calculateMinimumBudget(
  input: BudgetInput,
  costRange: BuildingCostRange,
  engineeringCosts: EngineeringCost[]
): BudgetCalculationResult {
  const notes: string[] = [];
  
  // Basic calculations
  const total_sf = input.new_area_ft2 + input.existing_area_ft2;
  const total_low = total_sf * costRange.allInMin;
  const total_high = total_sf * costRange.allInMax;
  const proposed = (total_low + total_high) / 2;
  
  // Calculate construction ratios (New Construction vs Existing to Remodel)
  const new_construction_ratio = input.new_area_ft2 / total_sf;
  const existing_remodel_ratio = input.existing_area_ft2 / total_sf;
  
  // Convert shares from decimal strings to numbers
  const shell_share = parseFloat(costRange.archShare.toString());
  const interior_share = parseFloat(costRange.intShare.toString());
  const landscape_share = parseFloat(costRange.landShare.toString());
  
  // Check if shares sum to approximately 1.0
  const shareSum = shell_share + interior_share + landscape_share;
  if (Math.abs(shareSum - 1.0) > 0.005) {
    notes.push(`Warning: Project shares sum to ${shareSum.toFixed(3)} instead of 1.000`);
  }
  
  // Calculate minimum budgets
  const shell_min = proposed * shell_share;
  const interior_min = proposed * interior_share;
  const land_min = proposed * landscape_share;
  
  // Process engineering costs with enhanced formula
  const engineering_budgets: Record<string, number> & { sum: number } = { sum: 0 };
  const design_shares: Record<string, number> = {};
  
  let total_eng_percent = 0;
  
  // Initialize all disciplines to 0
  ENGINEERING_DISCIPLINES.forEach(discipline => {
    engineering_budgets[discipline] = 0;
  });
  
  // Process available engineering cost data with enhanced formula
  // Formula: (proposed * percentage * new_ratio) + (proposed * percentage * existing_ratio * 0.5)
  engineeringCosts.forEach(engCost => {
    const category = engCost.category;
    const percent = parsePercentage(engCost.percentAvg);
    
    if (ENGINEERING_DISCIPLINES.includes(category)) {
      const new_portion = proposed * percent * new_construction_ratio;
      const existing_portion = proposed * percent * existing_remodel_ratio * 0.5;
      engineering_budgets[category] = new_portion + existing_portion;
      total_eng_percent += percent;
    }
  });
  
  // Check for missing disciplines
  const missingDisciplines = ENGINEERING_DISCIPLINES.filter(
    discipline => engineering_budgets[discipline] === 0
  );
  if (missingDisciplines.length > 0) {
    notes.push(`Missing engineering data for: ${missingDisciplines.join(', ')}`);
  }
  
  // Calculate sum of engineering budgets
  engineering_budgets.sum = ENGINEERING_DISCIPLINES.reduce(
    (sum, discipline) => sum + engineering_budgets[discipline], 0
  );
  
  // Calculate architecture budget (shell budget minus engineering)
  const architecture_budget = Math.max(0, shell_min - engineering_budgets.sum);
  
  if (architecture_budget === 0) {
    notes.push('Architecture budget clamped to $0 (engineering costs exceed shell budget)');
  }
  
  // Calculate design shares
  const arch_design_share = shell_share * (1 - total_eng_percent);
  design_shares['Architecture'] = arch_design_share;
  design_shares['Interior'] = interior_share;
  design_shares['Landscape'] = landscape_share;
  
  // Add engineering design shares
  ENGINEERING_DISCIPLINES.forEach(discipline => {
    const engCost = engineeringCosts.find(ec => ec.category === discipline);
    if (engCost) {
      design_shares[discipline] = shell_share * parsePercentage(engCost.percentAvg);
    } else {
      design_shares[discipline] = 0;
    }
  });
  
  // Calculate detailed breakdown for each discipline
  const discipline_breakdown: any = {};
  
  // Architecture breakdown
  discipline_breakdown.architecture = {
    total: architecture_budget,
    new_construction: architecture_budget * new_construction_ratio,
    existing_remodel: architecture_budget * existing_remodel_ratio,
  };
  
  // Interior breakdown
  discipline_breakdown.interior = {
    total: interior_min,
    new_construction: interior_min * new_construction_ratio,
    existing_remodel: interior_min * existing_remodel_ratio,
  };
  
  // Landscape breakdown
  discipline_breakdown.landscape = {
    total: land_min,
    new_construction: land_min * new_construction_ratio,
    existing_remodel: land_min * existing_remodel_ratio,
  };
  
  // Engineering disciplines breakdown
  ENGINEERING_DISCIPLINES.forEach(discipline => {
    const engCost = engineeringCosts.find(ec => ec.category === discipline);
    if (engCost) {
      const percent = parsePercentage(engCost.percentAvg);
      const new_portion = proposed * percent * new_construction_ratio;
      const existing_portion = proposed * percent * existing_remodel_ratio * 0.5;
      
      discipline_breakdown[discipline.toLowerCase().replace(/[^a-z0-9]/g, '_')] = {
        total: engineering_budgets[discipline],
        new_construction: new_portion,
        existing_remodel: existing_portion,
      };
    }
  });
  
  // Working budget calculation (sum of all disciplines)
  const working_budget = architecture_budget + interior_min + land_min + engineering_budgets.sum;
  
  return {
    inputs: input,
    all_in: {
      min_psf: costRange.allInMin,
      max_psf: costRange.allInMax
    },
    area: {
      total_sf
    },
    total_cost: {
      low: Math.round(total_low * 100) / 100,
      high: Math.round(total_high * 100) / 100,
      proposed: Math.round(proposed * 100) / 100
    },
    shares: {
      shell: shell_share,
      interior: interior_share,
      landscape: landscape_share
    },
    minimum_budgets: {
      shell: Math.round(shell_min * 100) / 100,
      interior: Math.round(interior_min * 100) / 100,
      landscape: Math.round(land_min * 100) / 100
    },
    design_shares,
    engineering_budgets: Object.fromEntries(
      Object.entries(engineering_budgets).map(([key, value]) => [
        key, 
        Math.round(value * 100) / 100
      ])
    ) as Record<string, number> & { sum: number },
    architecture_budget: Math.round(architecture_budget * 100) / 100,
    working_budget: Math.round(working_budget * 100) / 100,
    construction_ratios: {
      new_construction: Math.round(new_construction_ratio * 1000) / 1000,
      existing_remodel: Math.round(existing_remodel_ratio * 1000) / 1000,
    },
    discipline_breakdown: Object.fromEntries(
      Object.entries(discipline_breakdown).map(([key, breakdown]: [string, any]) => [
        key,
        {
          total: Math.round(breakdown.total * 100) / 100,
          new_construction: Math.round(breakdown.new_construction * 100) / 100,
          existing_remodel: Math.round(breakdown.existing_remodel * 100) / 100,
        }
      ])
    ) as any,
    notes
  };
}