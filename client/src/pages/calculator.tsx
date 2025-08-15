import { useState } from 'react';
import { Button } from '@/components/ui/button';
import EquationDisplay from '@/components/calculator/equation-display';
import ControlPanel from '@/components/calculator/control-panel';
import InteractiveGraph from '@/components/calculator/interactive-graph';
import DataTable from '@/components/calculator/data-table';
import { generateRangeData, calculateHourlyFactor, RangeData } from '@/lib/calculations';

export default function Calculator() {
  // Single value calculator state
  const [singleValue, setSingleValue] = useState(1000);
  
  // Range calculator state
  const [rangeStart, setRangeStart] = useState(100);
  const [rangeEnd, setRangeEnd] = useState(5000);
  const [rangeInterval, setRangeInterval] = useState(100);
  
  // Graph controls state
  const [graphXMin, setGraphXMin] = useState(100);
  const [graphXMax, setGraphXMax] = useState(10000);
  const [showGrid, setShowGrid] = useState(true);
  
  // Data table state
  const [tableData, setTableData] = useState<RangeData[]>([]);

  // Calculate current point for graph
  const currentPoint = {
    x: singleValue,
    y: calculateHourlyFactor(singleValue)
  };

  const handleGenerateRange = () => {
    const data = generateRangeData(rangeStart, rangeEnd, rangeInterval);
    setTableData(data);
  };

  const handleResetZoom = () => {
    setGraphXMin(100);
    setGraphXMax(10000);
  };

  const handleExportData = () => {
    if (tableData.length > 0) {
      const csvContent = tableData.map(row => 
        `${row.squareFeet},${row.hourlyFactor.toFixed(5)},${row.difference?.toFixed(5) || '-'}`
      ).join('\n');
      
      const blob = new Blob([`Square Feet,Hourly Factor,Difference\n${csvContent}`], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'hourly-factor-data.csv');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-gray-50 font-inter text-dark-slate min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-light-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-scientific-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-mono font-semibold text-lg">HF</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-dark-slate">Hourly Factor Calculator</h1>
                <p className="text-sm text-gray-500">Interactive visualization & data analysis</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleExportData}
                disabled={tableData.length === 0}
                className="px-4 py-2 text-scientific-blue hover:bg-blue-50 rounded-lg font-medium transition-colors duration-200"
              >
                Export Data
              </Button>
              <button className="p-2 text-gray-500 hover:text-dark-slate rounded-lg transition-colors duration-200">
                <span className="sr-only">Settings</span>
                ⚙️
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EquationDisplay />

        {/* Split Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ControlPanel
            singleValue={singleValue}
            setSingleValue={setSingleValue}
            rangeStart={rangeStart}
            setRangeStart={setRangeStart}
            rangeEnd={rangeEnd}
            setRangeEnd={setRangeEnd}
            rangeInterval={rangeInterval}
            setRangeInterval={setRangeInterval}
            onGenerateRange={handleGenerateRange}
            graphXMin={graphXMin}
            setGraphXMin={setGraphXMin}
            graphXMax={graphXMax}
            setGraphXMax={setGraphXMax}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
          />

          {/* Right Panel: Graph and Data Table */}
          <div className="lg:col-span-2 space-y-6">
            <InteractiveGraph
              currentPoint={currentPoint}
              graphXMin={graphXMin}
              graphXMax={graphXMax}
              showGrid={showGrid}
              onResetZoom={handleResetZoom}
            />

            <DataTable
              data={tableData}
              onExportCSV={handleExportData}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-light-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Hourly Factor Calculator v1.0 - Built with precision and accuracy
            </div>
            <div className="text-xs text-gray-500 font-mono">
              Equation: 0.21767 + 11.21274 × (sq-feet)^(-0.53816)
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
