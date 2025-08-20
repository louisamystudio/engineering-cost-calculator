import { useState, useEffect, useCallback } from 'react';
import type { ProjectInput, CalculationResult, ShareOverrides, DisciplineOverrides, CostTargetOverrides, ServiceToggles } from './types';
import { calculateProject } from './lib/calculations';
import { getCostDataWithFallback, getAllBuildingUses, getBuildingTypesForUse, getBuildingTiersForType, getDefaultBuildingConfiguration } from './lib/data-service';
import ProjectInputs from './components/ProjectInputs';
import BudgetAllocation from './components/BudgetAllocation';
import DisciplineBudgets from './components/DisciplineBudgets';
import FeeAnalysis from './components/FeeAnalysis';
import HoursAnalysis from './components/HoursAnalysis';
import SanityCheck from './components/SanityCheck';

function App() {
  // Get default configuration
  const defaultConfig = getDefaultBuildingConfiguration();
  
  // Project input state
  const [projectInput, setProjectInput] = useState<ProjectInput>({
    buildingUse: defaultConfig.buildingUse,
    buildingType: defaultConfig.buildingType,
    buildingTier: defaultConfig.buildingTier,
    category: 3, // Category 3 (Medium cost, 1.1x multiplier)
    newArea: 2000,
    existingArea: 2000,
    siteArea: 1000,
    historicMultiplier: 1.0,
    remodelMultiplier: 0.5,
    isHistoric: false,
  });
  
  // Override states
  const [shareOverrides, setShareOverrides] = useState<ShareOverrides>({});
  const [disciplineOverrides, setDisciplineOverrides] = useState<DisciplineOverrides>({});
  const [costTargetOverrides, setCostTargetOverrides] = useState<CostTargetOverrides>({});
  const [serviceToggles, setServiceToggles] = useState<ServiceToggles>({
    architecture: true,
    interior: true,
    landscape: true,
    structural: false,
    civil: false,
    mechanical: false,
    electrical: false,
    plumbing: false,
    telecom: false,
  });
  
  // Bottom-up calculation parameters
  const [labourRate, setLabourRate] = useState(40);
  const [overheadRate, setOverheadRate] = useState(50);
  const [markupFactor, setMarkupFactor] = useState(2.2);
  const [discount, setDiscount] = useState(0.15);
  
  // Calculation results
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  
  // Available options for dropdowns
  const [availableBuildingUses] = useState(() => getAllBuildingUses());
  const [availableBuildingTypes, setAvailableBuildingTypes] = useState<string[]>([]);
  const [availableBuildingTiers, setAvailableBuildingTiers] = useState<string[]>([]);
  
  // Update available building types when building use changes
  useEffect(() => {
    const types = getBuildingTypesForUse(projectInput.buildingUse);
    setAvailableBuildingTypes(types);
    
    // Reset building type if current one is not available
    if (types.length > 0 && !types.includes(projectInput.buildingType)) {
      setProjectInput(prev => ({ ...prev, buildingType: types[0] }));
    }
  }, [projectInput.buildingUse, projectInput.buildingType]);
  
  // Update available building tiers when building type changes
  useEffect(() => {
    const tiers = getBuildingTiersForType(projectInput.buildingUse, projectInput.buildingType);
    setAvailableBuildingTiers(tiers);
    
    // Reset building tier if current one is not available
    if (tiers.length > 0 && !tiers.includes(projectInput.buildingTier)) {
      setProjectInput(prev => ({ ...prev, buildingTier: tiers[0] }));
    }
  }, [projectInput.buildingUse, projectInput.buildingType, projectInput.buildingTier]);
  
  // Debounced calculation function
  const performCalculation = useCallback(() => {
    setIsCalculating(true);
    setCalculationError(null);
    
    try {
      // Get cost data for the current configuration
      const costData = getCostDataWithFallback(
        projectInput.buildingUse,
        projectInput.buildingType,
        projectInput.buildingTier
      );
      
      // Perform calculation
      const result = calculateProject(
        projectInput,
        costData,
        shareOverrides,
        disciplineOverrides,
        costTargetOverrides,
        serviceToggles,
        labourRate,
        overheadRate,
        markupFactor,
        discount
      );
      
      setCalculationResult(result);
    } catch (error) {
      console.error('Calculation error:', error);
      setCalculationError(error instanceof Error ? error.message : 'An error occurred during calculation');
    } finally {
      setIsCalculating(false);
    }
  }, [
    projectInput,
    shareOverrides,
    disciplineOverrides,
    costTargetOverrides,
    serviceToggles,
    labourRate,
    overheadRate,
    markupFactor,
    discount,
  ]);
  
  // Debounce calculation updates
  useEffect(() => {
    const timeoutId = setTimeout(performCalculation, 300);
    return () => clearTimeout(timeoutId);
  }, [performCalculation]);
  
  // Update historic multiplier when isHistoric changes
  const handleHistoricToggle = (isHistoric: boolean) => {
    setProjectInput(prev => ({
      ...prev,
      isHistoric,
      historicMultiplier: isHistoric ? 1.2 : 1.0,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display text-gray-900 mb-2">
            Engineering Cost Calculator
          </h1>
          <p className="text-body">
            Configure your project parameters to calculate engineering costs and fees
          </p>
          {isCalculating && (
            <div className="mt-2 text-sm text-primary-600">
              Calculating...
            </div>
          )}
          {calculationError && (
            <div className="mt-2 text-sm text-error bg-red-50 border border-red-200 rounded-md p-3">
              {calculationError}
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-1 space-y-6">
            <ProjectInputs
              projectInput={projectInput}
              onProjectInputChange={setProjectInput}
              availableBuildingUses={availableBuildingUses}
              availableBuildingTypes={availableBuildingTypes}
              availableBuildingTiers={availableBuildingTiers}
              onHistoricToggle={handleHistoricToggle}
              costData={calculationResult?.costData}
              costTargetOverrides={costTargetOverrides}
              onCostTargetOverridesChange={setCostTargetOverrides}
            />
          </div>
          
          {/* Right Column - Results */}
          <div className="lg:col-span-2 space-y-6">
            {calculationResult && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card">
                    <div className="text-label mb-1">Total Budget</div>
                    <div className="text-heading-lg text-primary-600">
                      ${calculationResult.budgets.totalBudget.toLocaleString()}
                    </div>
                  </div>
                  <div className="card">
                    <div className="text-label mb-1">Market Fee</div>
                    <div className="text-heading-lg text-green-600">
                      ${calculationResult.topDownFees.marketFee.toLocaleString()}
                    </div>
                  </div>
                  <div className="card">
                    <div className="text-label mb-1">Louis Amy Fee</div>
                    <div className="text-heading-lg text-blue-600">
                      ${calculationResult.topDownFees.louisAmyFee.toLocaleString()}
                    </div>
      </div>
      <div className="card">
                    <div className="text-label mb-1">Total Hours</div>
                    <div className="text-heading-lg text-purple-600">
                      {Math.round(calculationResult.hoursAnalysis.totalProjectHours)}
                    </div>
                  </div>
                </div>
                
                {/* Budget Allocation */}
                <BudgetAllocation
                  budgets={calculationResult.budgets}
                  shareOverrides={shareOverrides}
                  onShareOverridesChange={setShareOverrides}
                />
                
                {/* Discipline Budgets */}
                <DisciplineBudgets
                  disciplineBudgets={calculationResult.disciplineBudgets}
                  disciplineOverrides={disciplineOverrides}
                  onDisciplineOverridesChange={setDisciplineOverrides}
                  serviceToggles={serviceToggles}
                  onServiceTogglesChange={setServiceToggles}
                />
                
                {/* Professional Fees Analysis */}
                <FeeAnalysis
                  topDownFees={calculationResult.topDownFees}
                  bottomUpCosts={calculationResult.bottomUpCosts}
                  labourRate={labourRate}
                  onLabourRateChange={setLabourRate}
                  overheadRate={overheadRate}
                  onOverheadRateChange={setOverheadRate}
                  markupFactor={markupFactor}
                  onMarkupFactorChange={setMarkupFactor}
                  discount={discount}
                  onDiscountChange={setDiscount}
                />
                
                {/* Hours Analysis */}
                <HoursAnalysis hoursAnalysis={calculationResult.hoursAnalysis} />
                
                {/* Sanity Check */}
                <SanityCheck
                  topDownFee={calculationResult.topDownFees.marketFee}
                  bottomUpFee={calculationResult.bottomUpCosts.fee}
                  totalBudget={calculationResult.budgets.totalBudget}
                  totalArea={projectInput.newArea + projectInput.existingArea}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;