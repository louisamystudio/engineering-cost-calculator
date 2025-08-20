// Core project input types
export interface ProjectInput {
  /** Building use (e.g. "Residential", "Commercial") */
  buildingUse: string;
  /** Building type (e.g. "Custom Houses", "Condominiums") */
  buildingType: string;
  /** Building tier (Low, Mid, High) */
  buildingTier: string;
  /** Category (1-5) controlling the cost multiplier (0.9-1.3) */
  category: number;
  /** New construction area in square feet */
  newArea: number;
  /** Existing area to remodel in square feet */
  existingArea: number;
  /** Site area in square feet (for landscaping calculations) */
  siteArea: number;
  /** Historic property multiplier (1.0 for none, 1.2 for historic) */
  historicMultiplier: number;
  /** Remodel cost multiplier (fraction of new cost applied to remodel) */
  remodelMultiplier: number;
  /** Whether the building is historic (optional convenience flag) */
  isHistoric?: boolean;
}

// Cost data from the database
export interface CostData {
  /** Minimum shell cost per ft² for new construction */
  shellNewMin: number;
  /** Target shell cost per ft² for new construction */
  shellNewTarget: number;
  /** Maximum shell cost per ft² for new construction */
  shellNewMax: number;
  /** Minimum shell cost per ft² for remodel */
  shellRemodelMin: number;
  /** Target shell cost per ft² for remodel */
  shellRemodelTarget: number;
  /** Maximum shell cost per ft² for remodel */
  shellRemodelMax: number;
  /** Minimum interior cost per ft² for new construction */
  interiorNewMin: number;
  /** Target interior cost per ft² for new construction */
  interiorNewTarget: number;
  /** Maximum interior cost per ft² for new construction */
  interiorNewMax: number;
  /** Minimum interior cost per ft² for remodel */
  interiorRemodelMin: number;
  /** Target interior cost per ft² for remodel */
  interiorRemodelTarget: number;
  /** Maximum interior cost per ft² for remodel */
  interiorRemodelMax: number;
  /** Minimum landscape cost per ft² for new construction */
  landscapeNewMin: number;
  /** Target landscape cost per ft² for new construction */
  landscapeNewTarget: number;
  /** Maximum landscape cost per ft² for new construction */
  landscapeNewMax: number;
  /** Minimum landscape cost per ft² for remodel */
  landscapeRemodelMin: number;
  /** Target landscape cost per ft² for remodel */
  landscapeRemodelTarget: number;
  /** Maximum landscape cost per ft² for remodel */
  landscapeRemodelMax: number;
  /** Fraction of the total budget allocated to shell/architecture */
  shellShare: number;
  /** Fraction allocated to interior design */
  interiorShare: number;
  /** Fraction allocated to landscape design */
  landscapeShare: number;
  /** Engineering discipline shares */
  structuralShare: number;
  civilShare: number;
  mechanicalShare: number;
  electricalShare: number;
  plumbingShare: number;
  telecomShare: number;
}

export interface BudgetBreakdown {
  newBudget: number;
  remodelBudget: number;
  totalBudget: number;
  shell: { new: number; remodel: number; total: number; };
  interior: { new: number; remodel: number; total: number; };
  landscape: { new: number; remodel: number; total: number; };
}

export interface DisciplineBudget {
  structural: { new: number; remodel: number; total: number; };
  civil: { new: number; remodel: number; total: number; };
  mechanical: { new: number; remodel: number; total: number; };
  electrical: { new: number; remodel: number; total: number; };
  plumbing: { new: number; remodel: number; total: number; };
  telecom: { new: number; remodel: number; total: number; };
  architecture: { new: number; remodel: number; total: number; };
  interior: { new: number; remodel: number; total: number; };
  landscape: { new: number; remodel: number; total: number; };
}

export interface FeeLine {
  scope: string;
  percentOfCost: number | null;
  ratePerSqFt: number;
  marketFee: number;
  louisAmyFee: number;
  consultantFee: number;
  coordinationFee: number;
  isInHouse: boolean;
}

export interface FeeAnalysis {
  /** Total market fee (sum of all scopes) */
  marketFee: number;
  /** Total Louis Amy fee (in‑house) */
  louisAmyFee: number;
  /** Breakdown of fees by scope */
  lines: FeeLine[];
}

export interface BottomUpCosts {
  totalHours: number;
  labourCost: number;
  withOverhead: number;
  withMarkup: number;
  fee: number;
}

export interface HoursPhaseDistribution {
  phase: string;
  hours: number;
  percentage: number;
}

export interface HoursRoleDistribution {
  role: string;
  hours: number;
  percentage: number;
}

export interface HoursAnalysis {
  totalProjectHours: number;
  phases: HoursPhaseDistribution[];
  roles: HoursRoleDistribution[];
}

// Service toggles and overrides
export interface ServiceToggles {
  [key: string]: boolean;
  architecture: boolean;
  interior: boolean;
  landscape: boolean;
  structural: boolean;
  civil: boolean;
  mechanical: boolean;
  electrical: boolean;
  plumbing: boolean;
  telecom: boolean;
}

export interface ShareOverrides {
  shell?: number;
  interior?: number;
  landscape?: number;
}

export interface DisciplineOverrides {
  structural?: number;
  civil?: number;
  mechanical?: number;
  electrical?: number;
  plumbing?: number;
  telecom?: number;
}

export interface CostTargetOverrides {
  shellNew?: number;
  shellRemodel?: number;
  interiorNew?: number;
  interiorRemodel?: number;
  landscapeNew?: number;
  landscapeRemodel?: number;
}

// Complete calculation result
export interface CalculationResult {
  budgets: BudgetBreakdown;
  disciplineBudgets: DisciplineBudget;
  topDownFees: FeeAnalysis;
  bottomUpCosts: BottomUpCosts;
  hoursAnalysis: HoursAnalysis;
  categoryMultiplier: number;
  costData: CostData;
}
