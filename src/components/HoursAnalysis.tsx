import type { HoursAnalysis as HoursAnalysisType } from '../types';

interface HoursAnalysisProps {
  hoursAnalysis: HoursAnalysisType;
}

export default function HoursAnalysis({ hoursAnalysis }: HoursAnalysisProps) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-heading">Hours Distribution & Analysis</h2>
        <div className="text-sm text-gray-500">
          Comprehensive phase-based hours allocation with role distribution
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center mb-4">
          <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center mr-3">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="text-label">Total Project Hours</div>
            <div className="text-display text-purple-600">
              {Math.round(hoursAnalysis.totalProjectHours)} hrs
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hours Distribution by Phase */}
        <div>
          <h3 className="text-heading mb-4">Hours Distribution</h3>
          <p className="text-body mb-4">Detailed phase and role distribution for project hours.</p>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-label mb-3">Detailed Phase & Role Distribution</h4>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 font-medium text-gray-700">Phase</th>
                      <th className="text-right py-2 font-medium text-gray-700">Total Hours</th>
                      <th className="text-right py-2 font-medium text-gray-700">%</th>
                      <th className="text-right py-2 font-medium text-gray-700">Designer 1</th>
                      <th className="text-right py-2 font-medium text-gray-700">Designer 2</th>
                      <th className="text-right py-2 font-medium text-gray-700">Architect</th>
                      <th className="text-right py-2 font-medium text-gray-700">Engineer</th>
                      <th className="text-right py-2 font-medium text-gray-700">Principal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {hoursAnalysis.phases.map((phase, index) => {
                      // Calculate role distribution for this phase
                      const roleLeverage: Record<string, Record<string, number>> = {
                        'Discovery': { designer1: 0.37, designer2: 0.37, architect: 0.10, engineer: 0.02, principal: 0.14 },
                        'Creative - Conceptual': { designer1: 0.00, designer2: 0.00, architect: 0.95, engineer: 0.00, principal: 0.05 },
                        'Creative - Schematic': { designer1: 0.32, designer2: 0.32, architect: 0.32, engineer: 0.02, principal: 0.02 },
                        'Creative - Preliminary': { designer1: 0.32, designer2: 0.32, architect: 0.32, engineer: 0.02, principal: 0.02 },
                        'Technical - Schematic': { designer1: 0.26, designer2: 0.26, architect: 0.10, engineer: 0.32, principal: 0.06 },
                        'Technical - Preliminary': { designer1: 0.26, designer2: 0.26, architect: 0.10, engineer: 0.32, principal: 0.06 },
                      };
                      
                      const leverage = roleLeverage[phase.phase] || {};
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="py-2 text-gray-900">{phase.phase}</td>
                          <td className="py-2 text-right font-medium">{Math.round(phase.hours)}</td>
                          <td className="py-2 text-right text-gray-600">{(phase.percentage * 100).toFixed(0)}%</td>
                          <td className="py-2 text-right text-gray-600">{Math.round(phase.hours * (leverage.designer1 || 0))}</td>
                          <td className="py-2 text-right text-gray-600">{Math.round(phase.hours * (leverage.designer2 || 0))}</td>
                          <td className="py-2 text-right text-gray-600">{Math.round(phase.hours * (leverage.architect || 0))}</td>
                          <td className="py-2 text-right text-gray-600">{Math.round(phase.hours * (leverage.engineer || 0))}</td>
                          <td className="py-2 text-right text-gray-600">{Math.round(phase.hours * (leverage.principal || 0))}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="border-t border-gray-200 font-medium">
                    <tr>
                      <td className="py-2 text-gray-900">Total</td>
                      <td className="py-2 text-right">{Math.round(hoursAnalysis.totalProjectHours)}</td>
                      <td className="py-2 text-right">100%</td>
                      <td className="py-2 text-right">{Math.round(hoursAnalysis.roles.find(r => r.role === 'Designer 1')?.hours || 0)}</td>
                      <td className="py-2 text-right">{Math.round(hoursAnalysis.roles.find(r => r.role === 'Designer 2')?.hours || 0)}</td>
                      <td className="py-2 text-right">{Math.round(hoursAnalysis.roles.find(r => r.role === 'Architect')?.hours || 0)}</td>
                      <td className="py-2 text-right">{Math.round(hoursAnalysis.roles.find(r => r.role === 'Engineer')?.hours || 0)}</td>
                      <td className="py-2 text-right">{Math.round(hoursAnalysis.roles.find(r => r.role === 'Principal')?.hours || 0)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Role Distribution Overview */}
        <div>
          <h3 className="text-heading mb-4">Role Distribution Overview</h3>
          
          <div className="space-y-3">
            {hoursAnalysis.roles.map((role, index) => {
              const colors = [
                'bg-blue-500',
                'bg-green-500', 
                'bg-purple-500',
                'bg-orange-500',
                'bg-red-500'
              ];
              const bgColors = [
                'bg-blue-50',
                'bg-green-50',
                'bg-purple-50', 
                'bg-orange-50',
                'bg-red-50'
              ];
              
              return (
                <div key={index} className={`${bgColors[index]} rounded-lg p-3`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${colors[index]} mr-2`}></div>
                      <span className="text-label">{role.role}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{Math.round(role.hours)} hrs</div>
                      <div className="text-sm text-gray-600">{(role.percentage * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${colors[index]} h-2 rounded-full transition-all duration-300`}
                      style={{ width: `${role.percentage * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Hours Configuration */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="text-label mb-3">Hours Configuration</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Hours per ft² Factor</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    className="flex-1"
                    min="0.1"
                    max="0.5"
                    step="0.01"
                    defaultValue="0.22"
                  />
                  <span className="text-sm font-medium w-12">0.22</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Effective Rate</div>
                <div className="text-lg font-semibold">880 hrs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
