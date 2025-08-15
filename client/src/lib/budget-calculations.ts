import { calculateMinimumBudget } from '@shared/budget-calculations';
import type { BudgetInput, BudgetCalculationResult, BuildingCostRange, EngineeringCost } from '@shared/schema';

export { calculateMinimumBudget };

// Unit test for the acceptance case
export function runAcceptanceTest(): boolean {
  // Test data for "Mid-Range Standard Residential", tier 1, 1000 new + 4407 existing
  const testInput: BudgetInput = {
    building_type: "Mid-Range Standard Residential",
    tier: 1,
    new_area_ft2: 1000,
    existing_area_ft2: 4407,
    site_area_m2: 972.98
  };
  
  const testCostRange: BuildingCostRange = {
    buildingType: "Mid-Range Standard Residential",
    tier: 1,
    allInMin: 300,
    allInMax: 320,
    archShare: "0.66" as any,
    intShare: "0.22" as any,
    landShare: "0.12" as any
  };
  
  const testEngineeringCosts: EngineeringCost[] = [
    {
      buildingType: "Mid-Range Standard Residential",
      tier: 1,
      category: "Civil & Site",
      percentAvg: "3.3%",
      percentMin: "0" as any,
      percentMax: "0" as any,
      costMinPsf: "0" as any,
      costMaxPsf: "0" as any
    },
    {
      buildingType: "Mid-Range Standard Residential", 
      tier: 1,
      category: "Structural",
      percentAvg: "9.57%",
      percentMin: "0" as any,
      percentMax: "0" as any,
      costMinPsf: "0" as any,
      costMaxPsf: "0" as any
    },
    {
      buildingType: "Mid-Range Standard Residential",
      tier: 1, 
      category: "Mechanical",
      percentAvg: "3.96%",
      percentMin: "0" as any,
      percentMax: "0" as any,
      costMinPsf: "0" as any,
      costMaxPsf: "0" as any
    },
    {
      buildingType: "Mid-Range Standard Residential",
      tier: 1,
      category: "Electrical", 
      percentAvg: "2.97%",
      percentMin: "0" as any,
      percentMax: "0" as any,
      costMinPsf: "0" as any,
      costMaxPsf: "0" as any
    }
  ];
  
  const result = calculateMinimumBudget(testInput, testCostRange, testEngineeringCosts);
  
  // Expected values from the specification
  const expected = {
    totalSf: 5407,
    totalLow: 1622100,
    totalHigh: 1730240,
    proposed: 1676170,
    shellMin: 1106272.2,
    interiorMin: 368757.4,
    landscapeMin: 201140.4,
    workingBudget: 1676170
  };
  
  const tolerance = 0.01;
  const checks = [
    Math.abs(result.area.total_sf - expected.totalSf) < tolerance,
    Math.abs(result.total_cost.low - expected.totalLow) < tolerance,
    Math.abs(result.total_cost.high - expected.totalHigh) < tolerance,
    Math.abs(result.total_cost.proposed - expected.proposed) < tolerance,
    Math.abs(result.minimum_budgets.shell - expected.shellMin) < tolerance,
    Math.abs(result.minimum_budgets.interior - expected.interiorMin) < tolerance,
    Math.abs(result.minimum_budgets.landscape - expected.landscapeMin) < tolerance,
    Math.abs(result.working_budget - expected.workingBudget) < tolerance
  ];
  
  return checks.every(check => check);
}