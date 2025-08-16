import { useState } from 'react';
import { Button } from '@/components/ui/button';
import EquationDisplay from '@/components/calculator/equation-display';
import ControlPanel from '@/components/calculator/control-panel';
import InteractiveGraph from '@/components/calculator/interactive-graph';
import DataTable from '@/components/calculator/data-table';
import { generateRangeData, calculateBothEquations, RangeData, EquationType } from '@/lib/calculations';

export default function Calculator() {
  // Equation selection state
  const [selectedEquation, setSelectedEquation] = useState<EquationType>('original');
  
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
  const calculations = calculateBothEquations(singleValue);
  const currentPoint = {
    x: singleValue,
    y: calculations.original,
    yAlt: calculations.alternative
  };

  const handleGenerateRange = () => {
    const data = generateRangeData(rangeStart, rangeEnd, rangeInterval, selectedEquation);
    setTableData(data);
  };

  const handleResetZoom = () => {
    setGraphXMin(100);
    setGraphXMax(10000);
  };

  const handleExportData = () => {
    if (tableData.length > 0) {
      let csvContent = '';
      if (selectedEquation === 'both') {
        csvContent = tableData.map(row => 
          `${row.squareFeet},${row.hourlyFactor.toFixed(5)},${row.totalHours.toFixed(2)},${row.hoursDifference?.toFixed(2) || '-'},${row.hourlyFactorAlt?.toFixed(5) || '-'},${row.totalHoursAlt?.toFixed(2) || '-'},${row.hoursDifferenceAlt?.toFixed(2) || '-'}`
        ).join('\n');
        csvContent = `Square Feet,Original HF,Original Hours,Original Hours Diff,Alternative HF,Alternative Hours,Alternative Hours Diff\n${csvContent}`;
      } else if (selectedEquation === 'alternative') {
        csvContent = tableData.map(row => 
          `${row.squareFeet},${row.hourlyFactorAlt?.toFixed(5) || '-'},${row.totalHoursAlt?.toFixed(2) || '-'},${row.hoursDifferenceAlt?.toFixed(2) || '-'}`
        ).join('\n');
        csvContent = `Square Feet,Hourly Factor,Total Hours,Hours Difference\n${csvContent}`;
      } else {
        csvContent = tableData.map(row => 
          `${row.squareFeet},${row.hourlyFactor.toFixed(5)},${row.totalHours.toFixed(2)},${row.hoursDifference?.toFixed(2) || '-'}`
        ).join('\n');
        csvContent = `Square Feet,Hourly Factor,Total Hours,Hours Difference\n${csvContent}`;
      }
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-auto sm:h-16 py-3 sm:py-0">
            <div className="flex items-center space-x-3 mb-3 sm:mb-0">
              <div className="w-10 h-10 bg-scientific-blue rounded-lg flex items-center justify-center">
                <span className="text-white font-mono font-semibold text-lg">HF</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-dark-slate">Hourly Factor Calculator</h1>
                <p className="text-xs sm:text-sm text-gray-500">Interactive visualization & data analysis</p>
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                onClick={handleExportData}
                disabled={tableData.length === 0}
                className="px-2 sm:px-4 py-2 text-xs sm:text-sm text-scientific-blue hover:bg-blue-50 rounded-lg font-medium transition-colors duration-200"
              >
                <span className="hidden sm:inline">Export Data</span>
                <span className="sm:hidden">Export</span>
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        <EquationDisplay selectedEquation={selectedEquation} />

        {/* Split Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
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
            selectedEquation={selectedEquation}
            setSelectedEquation={setSelectedEquation}
          />

          {/* Right Panel: Graph and Data Table */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <InteractiveGraph
              currentPoint={currentPoint}
              graphXMin={graphXMin}
              graphXMax={graphXMax}
              showGrid={showGrid}
              onResetZoom={handleResetZoom}
              selectedEquation={selectedEquation}
            />

            <DataTable
              data={tableData}
              onExportCSV={handleExportData}
              selectedEquation={selectedEquation}
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
