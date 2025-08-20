interface SanityCheckProps {
  topDownFee: number;
  bottomUpFee: number;
  totalBudget: number;
  totalArea: number;
}

export default function SanityCheck({
  topDownFee,
  bottomUpFee,
  totalBudget,
  totalArea,
}: SanityCheckProps) {
  const variance = ((topDownFee - bottomUpFee) / topDownFee) * 100;
  const isVarianceHigh = Math.abs(variance) > 15;
  
  const marketPct = (topDownFee / totalBudget) * 100;
  const bottomUpPct = (bottomUpFee / totalBudget) * 100;
  
  const marketRatePerFt = totalArea > 0 ? topDownFee / totalArea : 0;
  const bottomUpRatePerFt = totalArea > 0 ? bottomUpFee / totalArea : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-heading">Sanity Check & Contract Price</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          isVarianceHigh 
            ? 'bg-red-100 text-red-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {isVarianceHigh ? '⚠️ High Variance' : '✅ Within Range'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee Comparison */}
        <div>
          <h3 className="text-label mb-4">Fee Method Comparison</h3>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-label text-green-700">Top-Down (Market)</span>
                <span className="text-xl font-semibold text-green-900">
                  ${topDownFee.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-green-600">
                <div>
                  <span className="block">% of Construction</span>
                  <span className="font-medium">{marketPct.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="block">Rate per ft²</span>
                  <span className="font-medium">${marketRatePerFt.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-label text-blue-700">Bottom-Up</span>
                <span className="text-xl font-semibold text-blue-900">
                  ${bottomUpFee.toLocaleString()}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-600">
                <div>
                  <span className="block">% of Construction</span>
                  <span className="font-medium">{bottomUpPct.toFixed(1)}%</span>
                </div>
                <div>
                  <span className="block">Rate per ft²</span>
                  <span className="font-medium">${bottomUpRatePerFt.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className={`border rounded-lg p-4 ${
              isVarianceHigh 
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex justify-between items-center">
                <span className="text-label">Variance</span>
                <span className={`text-xl font-semibold ${
                  isVarianceHigh ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                </span>
              </div>
              {isVarianceHigh && (
                <div className="mt-2 text-sm text-red-600">
                  ⚠️ Variance exceeds ±15%. Consider reviewing your parameters.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contract Pricing */}
        <div>
          <h3 className="text-label mb-4">Contract Pricing</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-label block mb-2">Manual Discount Override</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  className="input-base flex-1"
                  placeholder="Enter discount %"
                  min="0"
                  max="50"
                  step="1"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Override the calculated discount with a custom value
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-body">Base Fee (Market)</span>
                  <span>${topDownFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Maximum Discount</span>
                  <span>{Math.max(0, variance).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Applied Discount</span>
                  <span>15%</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold">
                  <span>Contract Price</span>
                  <span className="text-primary-600">
                    ${(topDownFee * 0.85).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-label text-blue-700 mb-2">Recommended Actions</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                {isVarianceHigh ? (
                  <>
                    <li>• Review labour and overhead rates</li>
                    <li>• Check markup factor and discount</li>
                    <li>• Verify project complexity category</li>
                    <li>• Consider adjusting discipline percentages</li>
                  </>
                ) : (
                  <>
                    <li>• Fees are well-aligned between methods</li>
                    <li>• Parameters appear reasonable</li>
                    <li>• Ready for contract pricing</li>
                  </>
                )}
              </ul>
            </div>

            <div className="flex space-x-2">
              <button className="btn-primary flex-1">
                Generate Proposal
              </button>
              <button className="btn-secondary">
                Export Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
