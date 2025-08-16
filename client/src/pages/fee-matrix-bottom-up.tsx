import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calculator, Building, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { FeeMatrixV2Input, FeeMatrixV2Result } from '@shared/schema';

interface FormData {
  totalAreaFt2: number;
  hoursFactor: number;
  totalHours?: number;
  complexityMultiplier: number;
  scenarioDiscountLouisAmy: number;
  scenarioDiscountMarket: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export default function FeeMatrixBottomUp() {
  const [formData, setFormData] = useState<FormData>({
    totalAreaFt2: 5000,
    hoursFactor: 0.220,
    complexityMultiplier: 0.3,
    scenarioDiscountLouisAmy: 0.35,
    scenarioDiscountMarket: 0.35,
  });

  const queryClient = useQueryClient();

  // Fetch fee defaults
  const { data: defaults } = useQuery({
    queryKey: ['/api/fee-defaults'],
  });

  // Calculate fee matrix mutation
  const calculateMutation = useMutation({
    mutationFn: async (input: FeeMatrixV2Input) => {
      const response = await apiRequest('POST', '/api/calc/fee-matrix/v2', input);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calc/fee-matrix/v2'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? parseFloat(value) || 0 : value,
    }));
  };

  const result = calculateMutation.data as FeeMatrixV2Result | undefined;

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fee Matrix - Bottom Up</h1>
          <p className="text-gray-600">Calculate project fees using hours leverage and bottom-up costing approach.</p>
        </div>

        {/* Input Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Project Parameters
            </CardTitle>
            <CardDescription>
              Enter project details to calculate comprehensive fee matrix
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="totalAreaFt2">Total Area (sq ft)</Label>
                  <Input
                    id="totalAreaFt2"
                    type="number"
                    value={formData.totalAreaFt2}
                    onChange={(e) => handleInputChange('totalAreaFt2', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hoursFactor">Hours Factor</Label>
                  <Input
                    id="hoursFactor"
                    type="number"
                    step="0.001"
                    value={formData.hoursFactor}
                    onChange={(e) => handleInputChange('hoursFactor', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="totalHours">Total Hours (override)</Label>
                  <Input
                    id="totalHours"
                    type="number"
                    value={formData.totalHours || ''}
                    onChange={(e) => handleInputChange('totalHours', e.target.value)}
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="complexityMultiplier">Complexity Multiplier</Label>
                  <Input
                    id="complexityMultiplier"
                    type="number"
                    step="0.1"
                    value={formData.complexityMultiplier}
                    onChange={(e) => handleInputChange('complexityMultiplier', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="scenarioDiscountLouisAmy">Louis Amy Discount (%)</Label>
                  <Input
                    id="scenarioDiscountLouisAmy"
                    type="number"
                    step="0.01"
                    value={formData.scenarioDiscountLouisAmy * 100}
                    onChange={(e) => handleInputChange('scenarioDiscountLouisAmy', parseFloat(e.target.value) / 100)}
                  />
                </div>
                <div>
                  <Label htmlFor="scenarioDiscountMarket">Market Discount (%)</Label>
                  <Input
                    id="scenarioDiscountMarket"
                    type="number"
                    step="0.01"
                    value={formData.scenarioDiscountMarket * 100}
                    onChange={(e) => handleInputChange('scenarioDiscountMarket', parseFloat(e.target.value) / 100)}
                  />
                </div>
              </div>

              <Button type="submit" disabled={calculateMutation.isPending} className="w-full">
                {calculateMutation.isPending ? 'Calculating...' : 'Calculate Fee Matrix'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {calculateMutation.error && (
          <Alert className="mb-6">
            <AlertDescription>
              Error calculating fee matrix: {calculateMutation.error.message}
            </AlertDescription>
          </Alert>
        )}

        {result && result.sectionII && (
          <div className="space-y-8">
            {/* Section II - Cost & Pricing Per Hour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Section II - Cost & Pricing Per Hour
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Labour/hr</TableHead>
                      <TableHead className="text-right">Overhead/hr</TableHead>
                      <TableHead className="text-right">Cost/hr</TableHead>
                      <TableHead className="text-right">Price/hr</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(result.sectionII.roles).map(([role, data]) => (
                      <TableRow key={role}>
                        <TableCell className="font-medium">{role}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.laborPerHour)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.overheadPerHour)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.costPerHour)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(data.pricePerHour)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Simple Average Rate:</span>
                    <span className="font-medium">{formatCurrency(result.sectionII.simpleAverageRate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Weighted Average Rate:</span>
                    <span className="font-medium">{formatCurrency(result.sectionII.weightedAverageRate)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section III - Project Hours & Leverage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Section III - Project Hours & Leverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">Sq Ft:</span>
                    <div className="font-medium">{formatNumber(result.sectionIII.totalAreaFt2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Hours Factor:</span>
                    <div className="font-medium">{result.sectionIII.hoursFactor}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Hours:</span>
                    <div className="font-medium">{formatNumber(result.sectionIII.totalHoursPlanned)}</div>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phase</TableHead>
                      <TableHead className="text-right">Months</TableHead>
                      <TableHead className="text-right">% Allocation</TableHead>
                      <TableHead className="text-right">Hours per Stage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.sectionIII.phases.map((phase) => (
                      <TableRow key={phase.name}>
                        <TableCell className="font-medium">{phase.name}</TableCell>
                        <TableCell className="text-right">{phase.months ?? '-'}</TableCell>
                        <TableCell className="text-right">
                          {phase.percent ? formatPercent(phase.percent) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">{formatNumber(phase.hours)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 text-sm">
                  <span className="text-gray-600">Total Months: </span>
                  <span className="font-medium">{result.sectionIII.totalMonths}</span>
                </div>
              </CardContent>
            </Card>

            {/* Section IV - Project Hours Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Section IV - Project Hours Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Phase</TableHead>
                      {Object.keys(result.sectionIV.roleTotalsRounded).map(role => (
                        <TableHead key={role} className="text-right">{role}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(result.sectionIV.matrix).map(([phase, roleHours]) => (
                      <TableRow key={phase}>
                        <TableCell className="font-medium">{phase}</TableCell>
                        {Object.keys(result.sectionIV.roleTotalsRounded).map(role => (
                          <TableCell key={role} className="text-right">
                            {formatNumber(roleHours[role] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-medium">
                      <TableCell>Totals</TableCell>
                      {Object.entries(result.sectionIV.roleTotalsRounded).map(([role, hours]) => (
                        <TableCell key={role} className="text-right">{formatNumber(hours)}</TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Planned Grand Total:</span>
                    <span className="font-medium">{formatNumber(result.sectionIV.plannedGrandTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rounded Grand Total:</span>
                    <span className="font-medium">{formatNumber(result.sectionIV.roundedGrandTotal)}</span>
                  </div>
                  {result.sectionIV.plannedGrandTotal !== result.sectionIV.roundedGrandTotal && (
                    <Badge variant="outline" className="text-xs">
                      Difference: {result.sectionIV.roundedGrandTotal - result.sectionIV.plannedGrandTotal}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section V - Project Budget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Section V - Project Budget
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Hours</TableHead>
                      <TableHead className="text-right">Price/hr</TableHead>
                      <TableHead className="text-right">Pricing</TableHead>
                      <TableHead className="text-right">Labour</TableHead>
                      <TableHead className="text-right">Overhead</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">Profit</TableHead>
                      <TableHead className="text-right">Margin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(result.sectionV.byRole).map(([role, data]) => (
                      <TableRow key={role}>
                        <TableCell className="font-medium">{role}</TableCell>
                        <TableCell className="text-right">{formatNumber(data.hours)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.pricePerHour)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(data.pricing)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.labor)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.overhead)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.totalCost)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(data.profit)}</TableCell>
                        <TableCell className="text-right">{formatPercent(data.margin)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-medium">
                      <TableCell>Totals</TableCell>
                      <TableCell className="text-right">{formatNumber(result.sectionV.totals.hours)}</TableCell>
                      <TableCell className="text-right">-</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.sectionV.totals.pricing)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.sectionV.totals.labor)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.sectionV.totals.overhead)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.sectionV.totals.totalCost)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(result.sectionV.totals.profit)}</TableCell>
                      <TableCell className="text-right">{formatPercent(result.sectionV.totals.margin)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Section VI - Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Section VI - Scenarios
                </CardTitle>
                <CardDescription>
                  Fee comparison across different scenarios and rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Role</TableHead>
                      {result.sectionVI.scenarios.map(scenario => (
                        <TableHead key={scenario.name} className="text-right">{scenario.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.keys(result.sectionIV.roleTotalsRounded).map(role => (
                      <TableRow key={role}>
                        <TableCell className="font-medium">{role}</TableCell>
                        {result.sectionVI.scenarios.map(scenario => (
                          <TableCell key={scenario.name} className="text-right">
                            {formatCurrency(scenario.byRole[role] || 0)}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                    <TableRow className="border-t-2 font-medium">
                      <TableCell>Total</TableCell>
                      {result.sectionVI.scenarios.map(scenario => (
                        <TableCell key={scenario.name} className="text-right">
                          {formatCurrency(scenario.total)}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow className="text-sm text-gray-600">
                      <TableCell>% of Project Budget</TableCell>
                      {result.sectionVI.scenarios.map(scenario => (
                        <TableCell key={scenario.name} className="text-right">
                          {formatPercent(scenario.pctOfProjectBudget)}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}