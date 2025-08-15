import { EquationType } from '@/lib/calculations';

interface EquationDisplayProps {
  selectedEquation: EquationType;
}

export default function EquationDisplay({ selectedEquation }: EquationDisplayProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-light-border p-6 mb-8">
      <h2 className="text-lg font-semibold text-dark-slate mb-4">Hourly Factor Equations</h2>
      
      {/* Original Equation */}
      <div className={`bg-gray-50 rounded-lg p-4 border border-light-border mb-4 transition-opacity duration-200 ${
        selectedEquation === 'alternative' ? 'opacity-50' : 'opacity-100'
      }`}>
        <div className="text-sm font-medium text-gray-600 mb-2">Original Equation:</div>
        <div className="font-mono text-lg text-center">
          <span className="text-dark-slate">HF = </span>
          <span className="text-scientific-blue font-semibold">0.21767</span>
          <span className="text-dark-slate"> + </span>
          <span className="text-calculation-green font-semibold">11.21274</span>
          <span className="text-dark-slate"> × (sq-feet)</span>
          <sup className="text-accent-purple font-semibold">-0.53816</sup>
        </div>
      </div>

      {/* Alternative Equation */}
      <div className={`bg-gray-50 rounded-lg p-4 border border-light-border transition-opacity duration-200 ${
        selectedEquation === 'original' ? 'opacity-50' : 'opacity-100'
      }`}>
        <div className="text-sm font-medium text-gray-600 mb-2">Alternative Equation:</div>
        <div className="font-mono text-lg text-center">
          <span className="text-dark-slate">HF = </span>
          <span className="text-scientific-blue font-semibold">0.21767</span>
          <span className="text-dark-slate"> + </span>
          <span className="text-calculation-green font-semibold">11.21274</span>
          <span className="text-dark-slate"> × (sq-feet)</span>
          <sup className="text-accent-purple font-semibold">-0.53816</sup>
          <span className="text-red-500 font-semibold"> - 0.08</span>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 text-center mt-4">
        Where sq-feet is the square footage input value
      </div>
    </div>
  );
}
