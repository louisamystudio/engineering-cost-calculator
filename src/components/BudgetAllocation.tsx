import type { BudgetBreakdown, ShareOverrides } from '../types';
import * as Slider from '@radix-ui/react-slider';

interface BudgetAllocationProps {
  budgets: BudgetBreakdown;
  shareOverrides: ShareOverrides;
  onShareOverridesChange: (overrides: ShareOverrides) => void;
}

export default function BudgetAllocation({
  budgets,
  shareOverrides,
  onShareOverridesChange,
}: BudgetAllocationProps) {
  const handleShareChange = (field: keyof ShareOverrides, value: number) => {
    const newOverrides = {
      ...shareOverrides,
      [field]: value / 100, // Convert percentage to decimal
    };
    onShareOverridesChange(newOverrides);
  };

  // Calculate current shares as percentages
  const shellShare = ((shareOverrides.shell ?? (budgets.shell.total / budgets.totalBudget)) * 100);
  const interiorShare = ((shareOverrides.interior ?? (budgets.interior.total / budgets.totalBudget)) * 100);
  const landscapeShare = ((shareOverrides.landscape ?? (budgets.landscape.total / budgets.totalBudget)) * 100);
  
  // Calculate remaining percentage when adjusting shares
  const totalShare = shellShare + interiorShare + landscapeShare;
  const isValidTotal = Math.abs(totalShare - 100) < 0.1;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-heading">Budget Allocation</h2>
        <div className="text-sm text-gray-500">
          Working Minimum Budget: ${budgets.totalBudget.toLocaleString()}
        </div>
      </div>

      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-label text-blue-700 mb-1">New Construction Budget</div>
          <div className="text-2xl font-semibold text-blue-900 mb-2">
            ${budgets.newBudget.toLocaleString()}
          </div>
          <div className="text-sm text-blue-600">
            {((budgets.newBudget / budgets.totalBudget) * 100).toFixed(1)}% of total
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-label text-green-700 mb-1">Remodel Budget</div>
          <div className="text-2xl font-semibold text-green-900 mb-2">
            ${budgets.remodelBudget.toLocaleString()}
          </div>
          <div className="text-sm text-green-600">
            {((budgets.remodelBudget / budgets.totalBudget) * 100).toFixed(1)}% of total
          </div>
        </div>
      </div>

      {/* Component Budgets with Share Override Controls */}
      <div className="space-y-6">
        <div className={`p-4 border rounded-lg ${!isValidTotal ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-label">Component Budgets</h3>
            <div className={`text-sm ${isValidTotal ? 'text-gray-500' : 'text-red-600 font-medium'}`}>
              Total: {totalShare.toFixed(1)}%
              {!isValidTotal && ' (Must equal 100%)'}
            </div>
          </div>

          <div className="space-y-4">
            {/* Shell Budget */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-label">Shell Budget</label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">${budgets.shell.total.toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                      value={shellShare.toFixed(1)}
                      onChange={(e) => handleShareChange('shell', parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[shellShare]}
                onValueChange={([value]) => handleShareChange('shell', value)}
                min={0}
                max={100}
                step={0.1}
              >
                <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                  <Slider.Range className="absolute bg-blue-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-300" />
              </Slider.Root>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>New: ${budgets.shell.new.toLocaleString()}</span>
                <span>Remodel: ${budgets.shell.remodel.toLocaleString()}</span>
              </div>
            </div>

            {/* Interior Budget */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-label">Interior Budget</label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">${budgets.interior.total.toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                      value={interiorShare.toFixed(1)}
                      onChange={(e) => handleShareChange('interior', parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[interiorShare]}
                onValueChange={([value]) => handleShareChange('interior', value)}
                min={0}
                max={100}
                step={0.1}
              >
                <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                  <Slider.Range className="absolute bg-purple-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-purple-500 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </Slider.Root>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>New: ${budgets.interior.new.toLocaleString()}</span>
                <span>Remodel: ${budgets.interior.remodel.toLocaleString()}</span>
              </div>
            </div>

            {/* Landscape Budget */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-label">Landscape Budget</label>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium">${budgets.landscape.total.toLocaleString()}</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="w-16 px-2 py-1 text-sm border border-gray-300 rounded"
                      value={landscapeShare.toFixed(1)}
                      onChange={(e) => handleShareChange('landscape', parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                </div>
              </div>
              <Slider.Root
                className="relative flex items-center select-none touch-none w-full h-5"
                value={[landscapeShare]}
                onValueChange={([value]) => handleShareChange('landscape', value)}
                min={0}
                max={100}
                step={0.1}
              >
                <Slider.Track className="bg-gray-200 relative grow rounded-full h-2">
                  <Slider.Range className="absolute bg-green-500 rounded-full h-full" />
                </Slider.Track>
                <Slider.Thumb className="block w-5 h-5 bg-white border-2 border-green-500 rounded-full shadow-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-300" />
              </Slider.Root>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                <span>New: ${budgets.landscape.new.toLocaleString()}</span>
                <span>Remodel: ${budgets.landscape.remodel.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
