import type { ProjectInput, CostData, CostTargetOverrides } from '../types';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';

interface ProjectInputsProps {
  projectInput: ProjectInput;
  onProjectInputChange: (input: ProjectInput) => void;
  availableBuildingUses: string[];
  availableBuildingTypes: string[];
  availableBuildingTiers: string[];
  onHistoricToggle: (isHistoric: boolean) => void;
  costData?: CostData;
  costTargetOverrides: CostTargetOverrides;
  onCostTargetOverridesChange: (overrides: CostTargetOverrides) => void;
}

export default function ProjectInputs({
  projectInput,
  onProjectInputChange,
  availableBuildingUses,
  availableBuildingTypes,
  availableBuildingTiers,
  onHistoricToggle,
  costData,
  costTargetOverrides,
  onCostTargetOverridesChange,
}: ProjectInputsProps) {
  const handleInputChange = (field: keyof ProjectInput, value: any) => {
    onProjectInputChange({
      ...projectInput,
      [field]: value,
    });
  };

  const handleCostTargetChange = (field: keyof CostTargetOverrides, value: number) => {
    onCostTargetOverridesChange({
      ...costTargetOverrides,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Project Information */}
      <div className="card">
        <h2 className="text-heading mb-4">Project Information</h2>
        
        <div className="space-y-4">
          {/* Building Use */}
          <div>
            <label className="text-label block mb-2">Building Use</label>
            <select
              className="input-base"
              value={projectInput.buildingUse}
              onChange={(e) => handleInputChange('buildingUse', e.target.value)}
            >
              {availableBuildingUses.map((use) => (
                <option key={use} value={use}>
                  {use}
                </option>
              ))}
            </select>
          </div>

          {/* Building Type */}
          <div>
            <label className="text-label block mb-2">Building Type</label>
            <select
              className="input-base"
              value={projectInput.buildingType}
              onChange={(e) => handleInputChange('buildingType', e.target.value)}
            >
              {availableBuildingTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Building Tier */}
          <div>
            <label className="text-label block mb-2">Building Tier</label>
            <select
              className="input-base"
              value={projectInput.buildingTier}
              onChange={(e) => handleInputChange('buildingTier', e.target.value)}
            >
              {availableBuildingTiers.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Design Parameters */}
      <div className="card">
        <h2 className="text-heading mb-4">Design Parameters</h2>
        
        <div className="space-y-4">
          {/* Category */}
          <div>
            <label className="text-label block mb-2">
              Project Category
              <span className="text-xs text-gray-500 ml-2">
                (Category {projectInput.category} - {(0.8 + 0.1 * projectInput.category).toFixed(1)}x multiplier)
              </span>
            </label>
            <div className="space-y-2">
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[projectInput.category]}
                onValueChange={([value]) => handleInputChange('category', value)}
                min={1}
                max={5}
                step={1}
              >
                <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                  <Slider.Range className="absolute bg-primary-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary-500 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </Slider.Root>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Category 1 (Lowest cost)</span>
                <span>Category 5 (Highest cost)</span>
              </div>
            </div>
          </div>

          {/* Historic Property */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-label">Historic Property</label>
              <p className="text-xs text-gray-500">20% cost increase when enabled</p>
            </div>
            <Switch.Root
              className="w-11 h-6 bg-gray-200 rounded-full relative shadow-inner data-[state=checked]:bg-primary-500"
              checked={projectInput.isHistoric}
              onCheckedChange={onHistoricToggle}
            >
              <Switch.Thumb className="block w-5 h-5 bg-white rounded-full shadow-md transform transition-transform data-[state=checked]:translate-x-5 translate-x-0.5" />
            </Switch.Root>
          </div>
        </div>
      </div>

      {/* Building Areas */}
      <div className="card">
        <h2 className="text-heading mb-4">Building Areas</h2>
        
        <div className="space-y-4">
          {/* New Building Area */}
          <div>
            <label className="text-label block mb-2">
              New Building Area (ft²)
            </label>
            <input
              type="number"
              className="input-base"
              value={projectInput.newArea}
              onChange={(e) => handleInputChange('newArea', parseInt(e.target.value) || 0)}
              min="0"
              step="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the square footage of new construction
            </p>
          </div>

          {/* Existing Building Area */}
          <div>
            <label className="text-label block mb-2">
              Existing Building Area (ft²)
            </label>
            <input
              type="number"
              className="input-base"
              value={projectInput.existingArea}
              onChange={(e) => handleInputChange('existingArea', parseInt(e.target.value) || 0)}
              min="0"
              step="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the square footage of existing building to be remodeled
            </p>
          </div>

          {/* Site Area */}
          <div>
            <label className="text-label block mb-2">
              Site Area (ft²)
            </label>
            <input
              type="number"
              className="input-base"
              value={projectInput.siteArea}
              onChange={(e) => handleInputChange('siteArea', parseInt(e.target.value) || 0)}
              min="0"
              step="100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter the total site area for landscaping calculations
            </p>
          </div>

          {/* Remodel Cost Factor */}
          <div>
            <label className="text-label block mb-2">
              Remodel Cost Factor
              <span className="text-xs text-gray-500 ml-2">
                ({(projectInput.remodelMultiplier * 100).toFixed(0)}% of new construction cost)
              </span>
            </label>
            <div className="space-y-2">
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[projectInput.remodelMultiplier]}
                onValueChange={([value]) => handleInputChange('remodelMultiplier', value)}
                min={0.3}
                max={0.8}
                step={0.05}
              >
                <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                  <Slider.Range className="absolute bg-primary-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-primary-500 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
              </Slider.Root>
              <div className="flex justify-between text-xs text-gray-500">
                <span>30%</span>
                <span>80%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cost Ranges */}
      {costData && (
        <div className="card">
          <h2 className="text-heading mb-4">Cost Ranges & Targets</h2>
          <p className="text-body mb-4">
            Adjust target costs within the min/max ranges for your building configuration.
          </p>
          
          <div className="space-y-6">
            {/* Shell Costs */}
            <div>
              <h3 className="text-label mb-3">Shell Construction</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">New Construction ($/ft²)</label>
                  <div className="space-y-2">
                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-5"
                      value={[costTargetOverrides.shellNew ?? costData.shellNewTarget]}
                      onValueChange={([value]) => handleCostTargetChange('shellNew', value)}
                      min={costData.shellNewMin}
                      max={costData.shellNewMax}
                      step={1}
                    >
                      <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                        <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" />
                    </Slider.Root>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>${costData.shellNewMin}</span>
                      <span className="font-medium">${(costTargetOverrides.shellNew ?? costData.shellNewTarget).toFixed(0)}</span>
                      <span>${costData.shellNewMax}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Remodel ($/ft²)</label>
                  <div className="space-y-2">
                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-5"
                      value={[costTargetOverrides.shellRemodel ?? costData.shellRemodelTarget]}
                      onValueChange={([value]) => handleCostTargetChange('shellRemodel', value)}
                      min={costData.shellRemodelMin}
                      max={costData.shellRemodelMax}
                      step={1}
                    >
                      <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                        <Slider.Range className="absolute bg-green-500 rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-green-500 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-300" />
                    </Slider.Root>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>${costData.shellRemodelMin}</span>
                      <span className="font-medium">${(costTargetOverrides.shellRemodel ?? costData.shellRemodelTarget).toFixed(0)}</span>
                      <span>${costData.shellRemodelMax}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interior Costs */}
            <div>
              <h3 className="text-label mb-3">Interior</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">New Construction ($/ft²)</label>
                  <div className="space-y-2">
                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-5"
                      value={[costTargetOverrides.interiorNew ?? costData.interiorNewTarget]}
                      onValueChange={([value]) => handleCostTargetChange('interiorNew', value)}
                      min={costData.interiorNewMin}
                      max={costData.interiorNewMax}
                      step={1}
                    >
                      <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                        <Slider.Range className="absolute bg-purple-500 rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-purple-500 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    </Slider.Root>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>${costData.interiorNewMin}</span>
                      <span className="font-medium">${(costTargetOverrides.interiorNew ?? costData.interiorNewTarget).toFixed(0)}</span>
                      <span>${costData.interiorNewMax}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Remodel ($/ft²)</label>
                  <div className="space-y-2">
                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-5"
                      value={[costTargetOverrides.interiorRemodel ?? costData.interiorRemodelTarget]}
                      onValueChange={([value]) => handleCostTargetChange('interiorRemodel', value)}
                      min={costData.interiorRemodelMin}
                      max={costData.interiorRemodelMax}
                      step={1}
                    >
                      <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                        <Slider.Range className="absolute bg-purple-500 rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-purple-500 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    </Slider.Root>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>${costData.interiorRemodelMin}</span>
                      <span className="font-medium">${(costTargetOverrides.interiorRemodel ?? costData.interiorRemodelTarget).toFixed(0)}</span>
                      <span>${costData.interiorRemodelMax}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Landscape Costs */}
            <div>
              <h3 className="text-label mb-3">Landscape</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">New Construction ($/ft²)</label>
                  <div className="space-y-2">
                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-5"
                      value={[costTargetOverrides.landscapeNew ?? costData.landscapeNewTarget]}
                      onValueChange={([value]) => handleCostTargetChange('landscapeNew', value)}
                      min={costData.landscapeNewMin}
                      max={costData.landscapeNewMax}
                      step={1}
                    >
                      <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                        <Slider.Range className="absolute bg-green-500 rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-green-500 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-300" />
                    </Slider.Root>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>${costData.landscapeNewMin}</span>
                      <span className="font-medium">${(costTargetOverrides.landscapeNew ?? costData.landscapeNewTarget).toFixed(0)}</span>
                      <span>${costData.landscapeNewMax}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Remodel ($/ft²)</label>
                  <div className="space-y-2">
                    <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-5"
                      value={[costTargetOverrides.landscapeRemodel ?? costData.landscapeRemodelTarget]}
                      onValueChange={([value]) => handleCostTargetChange('landscapeRemodel', value)}
                      min={costData.landscapeRemodelMin}
                      max={costData.landscapeRemodelMax}
                      step={1}
                    >
                      <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                        <Slider.Range className="absolute bg-green-500 rounded-full h-full" />
                      </Slider.Track>
                      <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-green-500 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-300" />
                    </Slider.Root>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>${costData.landscapeRemodelMin}</span>
                      <span className="font-medium">${(costTargetOverrides.landscapeRemodel ?? costData.landscapeRemodelTarget).toFixed(0)}</span>
                      <span>${costData.landscapeRemodelMax}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
