export default function EquationDisplay() {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-light-border p-6 mb-8">
      <h2 className="text-lg font-semibold text-dark-slate mb-4">Hourly Factor Equation</h2>
      <div className="bg-gray-50 rounded-lg p-4 border border-light-border">
        <div className="font-mono text-lg text-center">
          <span className="text-dark-slate">HF = </span>
          <span className="text-scientific-blue font-semibold">0.21767</span>
          <span className="text-dark-slate"> + </span>
          <span className="text-calculation-green font-semibold">11.21274</span>
          <span className="text-dark-slate"> × (sq-feet)</span>
          <sup className="text-accent-purple font-semibold">-0.53816</sup>
        </div>
        <div className="text-sm text-gray-600 text-center mt-2">
          Where sq-feet is the square footage input value
        </div>
      </div>
    </div>
  );
}
