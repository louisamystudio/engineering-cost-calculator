import type { FeeAnalysis as FeeAnalysisType, BottomUpCosts } from '../types';
import * as Tabs from '@radix-ui/react-tabs';

interface FeeAnalysisProps {
  topDownFees: FeeAnalysisType;
  bottomUpCosts: BottomUpCosts;
  labourRate: number;
  onLabourRateChange: (rate: number) => void;
  overheadRate: number;
  onOverheadRateChange: (rate: number) => void;
  markupFactor: number;
  onMarkupFactorChange: (factor: number) => void;
  discount: number;
  onDiscountChange: (discount: number) => void;
}

export default function FeeAnalysis({
  topDownFees,
  bottomUpCosts,
  labourRate,
  onLabourRateChange,
  overheadRate,
  onOverheadRateChange,
  markupFactor,
  onMarkupFactorChange,
  discount,
  onDiscountChange,
}: FeeAnalysisProps) {
  return (
    <div className="card">
      <h2 className="text-heading mb-4">Professional Fees Analysis</h2>
      
      <Tabs.Root defaultValue="top-down" className="w-full">
        <Tabs.List className="grid w-full grid-cols-2 mb-6">
          <Tabs.Trigger
            value="top-down"
            className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-primary-600 data-[state=active]:border-primary-500"
          >
            Top-Down Analysis
          </Tabs.Trigger>
          <Tabs.Trigger
            value="bottom-up"
            className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 border-b-2 border-transparent data-[state=active]:text-primary-600 data-[state=active]:border-primary-500"
          >
            Bottom-Up Analysis
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="top-down" className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-label text-green-700 mb-1">Total Market Fee</div>
              <div className="text-2xl font-semibold text-green-900">
                ${topDownFees.marketFee.toLocaleString()}
              </div>
              <div className="text-sm text-green-600">
                5.0% of construction
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-label text-blue-700 mb-1">Total Louis Amy Fee</div>
              <div className="text-2xl font-semibold text-blue-900">
                ${topDownFees.louisAmyFee.toLocaleString()}
              </div>
              <div className="text-sm text-blue-600">
                4.6% of construction
              </div>
            </div>
          </div>

          {/* Detailed Fee Analysis Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-700">Discipline</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">% of Cost</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Rate/ft²</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Market Fee</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Louis Amy</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Consultant</th>
                  <th className="px-3 py-2 text-right font-medium text-gray-700">Coordination</th>
                  <th className="px-3 py-2 text-center font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {topDownFees.lines.map((line, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{line.scope}</td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {line.percentOfCost ? `${(line.percentOfCost * 100).toFixed(1)}%` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      ${line.ratePerSqFt.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                      ${line.marketFee.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right text-blue-600">
                      {line.louisAmyFee > 0 ? `$${line.louisAmyFee.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {line.consultantFee > 0 ? `$${line.consultantFee.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {line.coordinationFee > 0 ? `$${line.coordinationFee.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        line.isInHouse
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {line.isInHouse ? 'In-House' : 'Outsourced'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td className="px-3 py-2 text-gray-900">TOTAL</td>
                  <td className="px-3 py-2 text-right text-gray-700">5.0%</td>
                  <td className="px-3 py-2 text-right text-gray-700">$13.23</td>
                  <td className="px-3 py-2 text-right text-gray-900">
                    ${topDownFees.marketFee.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-blue-600">
                    ${topDownFees.louisAmyFee.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    ${(topDownFees.marketFee - topDownFees.louisAmyFee).toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    $680
                  </td>
                  <td className="px-3 py-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Tabs.Content>

        <Tabs.Content value="bottom-up" className="space-y-6">
          {/* Bottom-Up Parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-label block mb-2">Labor Rate ($/hr)</label>
              <input
                type="number"
                className="input-base"
                value={labourRate}
                onChange={(e) => onLabourRateChange(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="text-label block mb-2">Overhead Rate ($/hr)</label>
              <input
                type="number"
                className="input-base"
                value={overheadRate}
                onChange={(e) => onOverheadRateChange(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="text-label block mb-2">Markup Factor</label>
              <input
                type="number"
                className="input-base"
                value={markupFactor}
                onChange={(e) => onMarkupFactorChange(parseFloat(e.target.value) || 1)}
                min="1"
                max="5"
                step="0.1"
              />
            </div>
            <div>
              <label className="text-label block mb-2">Discount %</label>
              <input
                type="number"
                className="input-base"
                value={discount * 100}
                onChange={(e) => onDiscountChange((parseFloat(e.target.value) || 0) / 100)}
                min="0"
                max="100"
                step="1"
              />
            </div>
          </div>

          {/* Fee Calculation Breakdown */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-label mb-4">Fee Calculation Breakdown</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-body">Total Hours</span>
                <span className="font-semibold text-purple-600">
                  {Math.round(bottomUpCosts.totalHours)} hrs
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">× Labor Rate</span>
                <span className="text-gray-700">${labourRate}/hr</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-body">Labor Cost</span>
                <span className="text-gray-900">${bottomUpCosts.labourCost.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">+ Overhead</span>
                <span className="text-gray-700">${overheadRate}/hr × {Math.round(bottomUpCosts.totalHours)} hrs</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-body">With Overhead</span>
                <span className="text-gray-900">${bottomUpCosts.withOverhead.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">× Markup</span>
                <span className="text-gray-700">{(markupFactor * 100).toFixed(0)}%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-body">With Markup</span>
                <span className="text-gray-900">${bottomUpCosts.withMarkup.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">- Discount</span>
                <span className="text-gray-700">{(discount * 100).toFixed(0)}%</span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                <span className="text-label">Bottom-Up Fee</span>
                <span className="text-xl font-semibold text-green-600">
                  ${bottomUpCosts.fee.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Top-Down vs Bottom-Up Comparison */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-label mb-3">Top-Down vs Bottom-Up Comparison</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-600">Top-Down (Market)</div>
                <div className="text-2xl font-semibold text-gray-900">
                  ${topDownFees.marketFee.toLocaleString()}
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">Bottom-Up</div>
                <div className="text-2xl font-semibold text-gray-900">
                  ${bottomUpCosts.fee.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-sm text-gray-600">Variance</div>
              <div className={`text-lg font-medium ${
                Math.abs(topDownFees.marketFee - bottomUpCosts.fee) / topDownFees.marketFee > 0.15
                  ? 'text-red-600'
                  : 'text-green-600'
              }`}>
                {(((topDownFees.marketFee - bottomUpCosts.fee) / topDownFees.marketFee) * 100).toFixed(1)}%
              </div>
              {Math.abs(topDownFees.marketFee - bottomUpCosts.fee) / topDownFees.marketFee > 0.15 && (
                <div className="text-xs text-red-600 mt-1">
                  ⚠️ Variance exceeds 15% - review parameters
                </div>
              )}
            </div>
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
