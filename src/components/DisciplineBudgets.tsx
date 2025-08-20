import type { DisciplineBudget, DisciplineOverrides, ServiceToggles } from '../types';
import * as Switch from '@radix-ui/react-switch';

interface DisciplineBudgetsProps {
  disciplineBudgets: DisciplineBudget;
  disciplineOverrides: DisciplineOverrides;
  onDisciplineOverridesChange: (overrides: DisciplineOverrides) => void;
  serviceToggles: ServiceToggles;
  onServiceTogglesChange: (toggles: ServiceToggles) => void;
}

export default function DisciplineBudgets({
  disciplineBudgets,
  disciplineOverrides,
  onDisciplineOverridesChange,
  serviceToggles,
  onServiceTogglesChange,
}: DisciplineBudgetsProps) {
  const handleDisciplineOverride = (field: keyof DisciplineOverrides, value: number) => {
    onDisciplineOverridesChange({
      ...disciplineOverrides,
      [field]: value / 100, // Convert percentage to decimal
    });
  };

  const handleServiceToggle = (field: keyof ServiceToggles, value: boolean) => {
    onServiceTogglesChange({
      ...serviceToggles,
      [field]: value,
    });
  };

  const disciplines = [
    {
      key: 'architecture' as keyof DisciplineBudget,
      label: 'Architecture',
      description: 'Design + Consultant Admin.',
      color: 'blue',
      defaultInHouse: true,
    },
    {
      key: 'structural' as keyof DisciplineBudget,
      label: 'Structural',
      description: 'Structural engineering',
      color: 'gray',
      defaultInHouse: false,
    },
    {
      key: 'civil' as keyof DisciplineBudget,
      label: 'Civil / Site',
      description: 'Civil and site engineering',
      color: 'orange',
      defaultInHouse: false,
    },
    {
      key: 'mechanical' as keyof DisciplineBudget,
      label: 'Mechanical',
      description: 'HVAC, energy, pools',
      color: 'red',
      defaultInHouse: false,
    },
    {
      key: 'electrical' as keyof DisciplineBudget,
      label: 'Electrical',
      description: 'Power and lighting',
      color: 'yellow',
      defaultInHouse: false,
    },
    {
      key: 'plumbing' as keyof DisciplineBudget,
      label: 'Plumbing',
      description: 'Plumbing engineering',
      color: 'cyan',
      defaultInHouse: false,
    },
    {
      key: 'telecom' as keyof DisciplineBudget,
      label: 'Telecom',
      description: 'Telecommunications',
      color: 'purple',
      defaultInHouse: false,
    },
    {
      key: 'interior' as keyof DisciplineBudget,
      label: 'Interior Design',
      description: 'Interior design services',
      color: 'pink',
      defaultInHouse: true,
    },
    {
      key: 'landscape' as keyof DisciplineBudget,
      label: 'Landscape',
      description: 'Landscape architecture',
      color: 'green',
      defaultInHouse: true,
    },
  ];

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; border: string; text: string; }> = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
      gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900' },
      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-900' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900' },
      cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-900' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900' },
      green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900' },
    };
    return colorMap[color] || colorMap.gray;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-heading">Discipline Budgets</h2>
        <div className="text-sm text-gray-500">
          Configure discipline percentages and in-house vs outsourced services
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {disciplines.map(({ key, label, description, color, defaultInHouse }) => {
          const budget = disciplineBudgets[key];
          const isInHouse = serviceToggles[key] ?? defaultInHouse;
          const colors = getColorClasses(color);
          
          return (
            <div
              key={key}
              className={`border rounded-lg p-4 ${colors.bg} ${colors.border}`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className={`font-medium ${colors.text}`}>{label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{description}</p>
                </div>
                <div className="ml-2">
                  <Switch.Root
                    className={`w-8 h-4 rounded-full relative shadow-inner transition-colors ${
                      isInHouse ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                    checked={isInHouse}
                    onCheckedChange={(checked) => handleServiceToggle(key, checked)}
                  >
                    <Switch.Thumb className="block w-3 h-3 bg-white rounded-full shadow-md transform transition-transform data-[state=checked]:translate-x-4 translate-x-0.5" />
                  </Switch.Root>
                  <div className="text-xs text-gray-500 mt-1 text-center">
                    {isInHouse ? 'In-House' : 'Outsourced'}
                  </div>
                </div>
              </div>

              {/* Budget Display */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className={`font-semibold ${colors.text}`}>
                    ${budget.total.toLocaleString()}
                  </span>
                </div>
                {budget.new > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">New</span>
                    <span className="text-gray-700">${budget.new.toLocaleString()}</span>
                  </div>
                )}
                {budget.remodel > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Remodel</span>
                    <span className="text-gray-700">${budget.remodel.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Engineering Discipline Percentage Override (not for interior/landscape) */}
              {!['interior', 'landscape', 'architecture'].includes(key) && (
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 block">
                    % of Shell Budget
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                      value={((disciplineOverrides[key as keyof DisciplineOverrides] ?? 0) * 100).toFixed(1)}
                      onChange={(e) => handleDisciplineOverride(key as keyof DisciplineOverrides, parseFloat(e.target.value) || 0)}
                      min="0"
                      max="50"
                      step="0.1"
                      placeholder="Default"
                    />
                    <span className="text-xs text-gray-500">%</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Advanced Settings */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-label">Advanced Settings</h3>
            <p className="text-xs text-gray-500">Configure calculation methods and discipline assignments</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="btn-secondary text-sm">
              Save Preset
            </button>
            <button className="btn-secondary text-sm">
              Import
            </button>
            <button className="btn-secondary text-sm">
              Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
