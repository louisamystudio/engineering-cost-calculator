import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { calculateHourlyFactor, calculateBothEquations, EquationType } from '@/lib/calculations';

interface ControlPanelProps {
  singleValue: number;
  setSingleValue: (value: number) => void;
  rangeStart: number;
  setRangeStart: (value: number) => void;
  rangeEnd: number;
  setRangeEnd: (value: number) => void;
  rangeInterval: number;
  setRangeInterval: (value: number) => void;
  onGenerateRange: () => void;
  graphXMin: number;
  setGraphXMin: (value: number) => void;
  graphXMax: number;
  setGraphXMax: (value: number) => void;
  showGrid: boolean;
  setShowGrid: (value: boolean) => void;
  selectedEquation: EquationType;
  setSelectedEquation: (value: EquationType) => void;
}

export default function ControlPanel({
  singleValue,
  setSingleValue,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
  rangeInterval,
  setRangeInterval,
  onGenerateRange,
  graphXMin,
  setGraphXMin,
  graphXMax,
  setGraphXMax,
  showGrid,
  setShowGrid,
  selectedEquation,
  setSelectedEquation
}: ControlPanelProps) {
  const [singleResult, setSingleResult] = useState({ original: 0, alternative: 0 });

  useEffect(() => {
    if (singleValue > 0) {
      setSingleResult(calculateBothEquations(singleValue));
    } else {
      setSingleResult({ original: 0, alternative: 0 });
    }
  }, [singleValue]);

  const handleGenerateRange = () => {
    if (rangeStart >= rangeEnd) {
      alert('Start value must be less than end value');
      return;
    }
    if (rangeInterval <= 0) {
      alert('Interval must be greater than 0');
      return;
    }
    onGenerateRange();
  };

  return (
    <div className="lg:col-span-1 space-y-6">
      {/* Equation Selection */}
      <div className="bg-white rounded-xl shadow-lg border border-light-border p-6">
        <h3 className="text-lg font-semibold text-dark-slate mb-4 flex items-center">
          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
          Equation Selection
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="equationSelect" className="block text-sm font-medium text-dark-slate mb-2">
              Choose Equation(s)
            </Label>
            <Select value={selectedEquation} onValueChange={setSelectedEquation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select equation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original Equation</SelectItem>
                <SelectItem value="alternative">Alternative Equation (Original - 0.08)</SelectItem>
                <SelectItem value="both">Both Equations</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Single Value Calculator */}
      <div className="bg-white rounded-xl shadow-lg border border-light-border p-6">
        <h3 className="text-lg font-semibold text-dark-slate mb-4 flex items-center">
          <span className="w-2 h-2 bg-scientific-blue rounded-full mr-2"></span>
          Single Value Calculator
        </h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="singleValue" className="block text-sm font-medium text-dark-slate mb-2">
              Square Feet
            </Label>
            <Input
              id="singleValue"
              type="number"
              className="w-full px-4 py-3 border border-light-border rounded-lg focus:ring-2 focus:ring-scientific-blue focus:border-transparent font-mono text-lg"
              placeholder="1000"
              min="1"
              step="0.01"
              value={singleValue || ''}
              onChange={(e) => setSingleValue(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-3">
            {(selectedEquation === 'original' || selectedEquation === 'both') && (
              <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 border border-light-border">
                <div className="text-sm font-medium text-gray-600 mb-1">Original Equation Result</div>
                <div className="font-mono text-2xl font-bold text-dark-slate">
                  {singleResult.original.toFixed(5)}
                </div>
              </div>
            )}
            {(selectedEquation === 'alternative' || selectedEquation === 'both') && (
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-light-border">
                <div className="text-sm font-medium text-gray-600 mb-1">Alternative Equation Result</div>
                <div className="font-mono text-2xl font-bold text-dark-slate">
                  {singleResult.alternative.toFixed(5)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Range Calculator */}
      <div className="bg-white rounded-xl shadow-lg border border-light-border p-6">
        <h3 className="text-lg font-semibold text-dark-slate mb-4 flex items-center">
          <span className="w-2 h-2 bg-calculation-green rounded-full mr-2"></span>
          Range Calculator
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="rangeStart" className="block text-sm font-medium text-dark-slate mb-2">
                Start (sq-ft)
              </Label>
              <Input
                id="rangeStart"
                type="number"
                className="w-full px-3 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-calculation-green focus:border-transparent font-mono"
                placeholder="100"
                min="1"
                step="1"
                value={rangeStart || ''}
                onChange={(e) => setRangeStart(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="rangeEnd" className="block text-sm font-medium text-dark-slate mb-2">
                End (sq-ft)
              </Label>
              <Input
                id="rangeEnd"
                type="number"
                className="w-full px-3 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-calculation-green focus:border-transparent font-mono"
                placeholder="5000"
                min="1"
                step="1"
                value={rangeEnd || ''}
                onChange={(e) => setRangeEnd(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="rangeInterval" className="block text-sm font-medium text-dark-slate mb-2">
              Interval
            </Label>
            <Input
              id="rangeInterval"
              type="number"
              className="w-full px-3 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-calculation-green focus:border-transparent font-mono"
              placeholder="100"
              min="1"
              step="1"
              value={rangeInterval || ''}
              onChange={(e) => setRangeInterval(parseFloat(e.target.value) || 0)}
            />
          </div>
          <Button
            onClick={handleGenerateRange}
            className="w-full bg-calculation-green text-white py-3 px-4 rounded-lg hover:bg-green-600 font-medium transition-colors duration-200"
          >
            Generate Data Table
          </Button>
        </div>
      </div>

      {/* Graph Controls */}
      <div className="bg-white rounded-xl shadow-lg border border-light-border p-6">
        <h3 className="text-lg font-semibold text-dark-slate mb-4 flex items-center">
          <span className="w-2 h-2 bg-accent-purple rounded-full mr-2"></span>
          Graph Controls
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="xMin" className="block text-sm font-medium text-dark-slate mb-2">
                X Min
              </Label>
              <Input
                id="xMin"
                type="number"
                className="w-full px-3 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-accent-purple focus:border-transparent font-mono text-sm"
                placeholder="0"
                value={graphXMin || ''}
                onChange={(e) => setGraphXMin(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <Label htmlFor="xMax" className="block text-sm font-medium text-dark-slate mb-2">
                X Max
              </Label>
              <Input
                id="xMax"
                type="number"
                className="w-full px-3 py-2 border border-light-border rounded-lg focus:ring-2 focus:ring-accent-purple focus:border-transparent font-mono text-sm"
                placeholder="10000"
                value={graphXMax || ''}
                onChange={(e) => setGraphXMax(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-dark-slate">Show Grid</span>
            <Switch
              checked={showGrid}
              onCheckedChange={setShowGrid}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
