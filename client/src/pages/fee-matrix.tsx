import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Calculator, Building, DollarSign, Clock, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import type { BudgetCalculationResult, FeeMatrixInput, FeeMatrixResult } from '@shared/schema';

interface FeeMatrixFormData {
  complexity_multiplier: number;
  discount_rate: number;
  average_billable_rate: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

function formatHours(hours: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(hours);
}

export default function FeeMatrix() {
  const [formData, setFormData] = useState<FeeMatrixFormData>({
    complexity_multiplier: 0.3,
    discount_rate: 0.15,
    average_billable_rate: 172.17,
  });

  const [budgetResult, setBudgetResult] = useState<BudgetCalculationResult | null>(null);
  const [result, setResult] = useState<FeeMatrixResult | null>(null);
  const queryClient = useQueryClient();

  // Calculate fee matrix mutation
  const calculateFeeMatrix = useMutation<FeeMatrixResult, Error, FeeMatrixInput>({
    mutationFn: async (input: FeeMatrixInput) => {
      const response = await fetch('/api/calc/fee-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) {
        throw new Error('Failed to calculate fee matrix');
      }
      return response.json();
    },
    onSuccess: (data: FeeMatrixResult) => {
      setResult(data);
    },
  });

  // Auto-calculate when form changes
  useEffect(() => {
    if (budgetResult) {
      const input: FeeMatrixInput = {
        budget_result: budgetResult,
        complexity_multiplier: formData.complexity_multiplier,
        discount_rate: formData.discount_rate,
        average_billable_rate: formData.average_billable_rate,
      };
      calculateFeeMatrix.mutate(input);
    }
  }, [formData, budgetResult]);

  const handleInputChange = (field: keyof FeeMatrixFormData, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, variant = 'default' }: {
    title: string;
    value: string;
    subtitle?: string;
    icon: any;
    variant?: 'default' | 'success' | 'warning';
  }) => (
    <Card className={`relative overflow-hidden ${
      variant === 'success' ? 'border-green-200 bg-green-50' : 
      variant === 'warning' ? 'border-yellow-200 bg-yellow-50' : ''
    }`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="bg-gray-50 font-inter text-dark-slate min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-light-border shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between h-auto sm:h-16 py-3 sm:py-0">
            <div className="flex items-center space-x-3 mb-3 sm:mb-0">
              <div className="w-10 h-10 bg-scientific-blue rounded-lg flex items-center justify-center">
                <Calculator className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-dark-slate">Fee Matrix Calculator</h1>
                <p className="text-xs sm:text-sm text-gray-500">Professional fee calculation & analysis</p>
              </div>
            </div>
            <div className="flex items-center justify-center sm:justify-end space-x-4">
              <Badge variant="outline" className="px-2 sm:px-3 py-1 text-xs sm:text-sm">
                Live Calculation
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {!budgetResult && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please complete the Minimum Budget Calculator first to proceed with fee calculations.
              <Button 
                variant="link" 
                className="p-0 ml-2 h-auto"
                onClick={() => window.location.href = '/minimum-budget'}
              >
                Go to Budget Calculator →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Fee Parameters
                </CardTitle>
                <CardDescription>
                  Adjust complexity and billing parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="complexity">Complexity Multiplier</Label>
                  <Input
                    id="complexity"
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={formData.complexity_multiplier}
                    onChange={(e) => handleInputChange('complexity_multiplier', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                  <p className="text-xs text-gray-500">Default: 0.3 (30%)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount Rate</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.discount_rate}
                    onChange={(e) => handleInputChange('discount_rate', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                  <p className="text-xs text-gray-500">Default: 0.15 (15%)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billable-rate">Average Billable Rate ($/hr)</Label>
                  <Input
                    id="billable-rate"
                    type="number"
                    step="0.01"
                    min="1"
                    value={formData.average_billable_rate}
                    onChange={(e) => handleInputChange('average_billable_rate', parseFloat(e.target.value) || 0)}
                    className="text-right"
                  />
                  <p className="text-xs text-gray-500">Default: $172.17/hr</p>
                </div>

                {calculateFeeMatrix.isPending && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-scientific-blue"></div>
                  </div>
                )}

                <Button 
                  onClick={() => {
                    // For demo purposes, use sample budget data
                    const sampleBudgetResult: BudgetCalculationResult = {
                      inputs: { building_type: 'Sample', tier: 1, new_area_ft2: 3000, existing_area_ft2: 2000, site_area_m2: 500 },
                      all_in: { min_psf: 200, max_psf: 300 },
                      area: { total_sf: 5000 },
                      total_cost: { low: 1000000, high: 1500000, proposed: 1250000 },
                      shares: { shell: 0.65, interior: 0.25, landscape: 0.1 },
                      minimum_budgets: { shell: 812500, interior: 312500, landscape: 125000 },
                      design_shares: { 'Architecture': 0.45, 'Interior': 0.25, 'Landscape': 0.1 },
                      engineering_budgets: { 
                        'Structural': 50000, 
                        'Civil & Site': 30000, 
                        'Mechanical': 40000, 
                        'Electrical': 35000, 
                        'Plumbing': 25000, 
                        'Low-Voltage': 20000,
                        sum: 200000 
                      },
                      architecture_budget: 612500,
                      working_budget: 1250000,
                      construction_ratios: { new_construction: 0.6, existing_remodel: 0.4 },
                      discipline_breakdown: {
                        architecture: { total: 612500, new_construction: 367500, existing_remodel: 245000 },
                        interior: { total: 312500, new_construction: 187500, existing_remodel: 125000 },
                        landscape: { total: 125000, new_construction: 75000, existing_remodel: 50000 },
                      },
                      notes: []
                    };
                    setBudgetResult(sampleBudgetResult);
                  }}
                  className="w-full"
                  variant="outline"
                >
                  Load Sample Data
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3 space-y-6">
            {result && (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <StatCard
                    title="Market Fee"
                    value={formatCurrency(result.totals.market_fee)}
                    subtitle={`${formatPercent(result.totals.overall_percentage)}`}
                    icon={DollarSign}
                    variant="success"
                  />
                  <StatCard
                    title="Rate per SF"
                    value={`$${result.totals.rate_per_ft2.toFixed(2)}`}
                    subtitle={`${result.hourly_factor.total_building_area.toLocaleString()} SF`}
                    icon={Building}
                  />
                  <StatCard
                    title="Total Hours"
                    value={formatHours(result.totals.total_hours)}
                    subtitle={`${formatHours(result.hourly_factor.raw_design_hours)} raw hrs`}
                    icon={Clock}
                  />
                  <StatCard
                    title="Consultants"
                    value={formatCurrency(result.totals.consultant_total)}
                    subtitle={`${formatCurrency(result.totals.discounted_total)} internal`}
                    icon={TrendingUp}
                  />
                </div>

                {/* Fee Breakdown Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Fee Breakdown by Discipline
                    </CardTitle>
                    <CardDescription>
                      Detailed fee allocation across all services and disciplines
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Service/Discipline</TableHead>
                            <TableHead className="text-right">Budget</TableHead>
                            <TableHead className="text-right">Fee %</TableHead>
                            <TableHead className="text-right">Market Fee</TableHead>
                            <TableHead className="text-right">Internal Fee</TableHead>
                            <TableHead className="text-right">Consultant Fee</TableHead>
                            <TableHead className="text-right">Rate/SF</TableHead>
                            <TableHead className="text-right">Hours</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {/* Scanning Services */}
                          {result.scanning_fees.map((fee, index) => (
                            <TableRow key={`scan-${index}`} className="bg-blue-50">
                              <TableCell className="font-medium">{fee.service}</TableCell>
                              <TableCell className="text-right">-</TableCell>
                              <TableCell className="text-right">-</TableCell>
                              <TableCell className="text-right">{formatCurrency(fee.fee)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(fee.discounted_fee)}</TableCell>
                              <TableCell className="text-right">-</TableCell>
                              <TableCell className="text-right">${fee.rate.toFixed(2)}/unit</TableCell>
                              <TableCell className="text-right">{fee.hours ? formatHours(fee.hours) : '-'}</TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Discipline Services */}
                          {result.discipline_fees.map((fee, index) => (
                            <TableRow key={`disc-${index}`} className={fee.is_internal ? '' : 'bg-yellow-50'}>
                              <TableCell className="font-medium">
                                {fee.discipline}
                                {!fee.is_internal && (
                                  <Badge variant="secondary" className="ml-2 text-xs">External</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(fee.budget)}</TableCell>
                              <TableCell className="text-right">{formatPercent(fee.percentage)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(fee.fee)}</TableCell>
                              <TableCell className="text-right">
                                {fee.discounted_fee ? formatCurrency(fee.discounted_fee) : '-'}
                              </TableCell>
                              <TableCell className="text-right">
                                {fee.consultant_fee ? formatCurrency(fee.consultant_fee) : '-'}
                              </TableCell>
                              <TableCell className="text-right">${fee.rate_psf.toFixed(2)}</TableCell>
                              <TableCell className="text-right">{fee.hours ? formatHours(fee.hours) : '-'}</TableCell>
                            </TableRow>
                          ))}
                          
                          {/* Totals Row */}
                          <TableRow className="border-t-2 font-bold bg-gray-100">
                            <TableCell>Total</TableCell>
                            <TableCell className="text-right">-</TableCell>
                            <TableCell className="text-right">{formatPercent(result.totals.overall_percentage)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(result.totals.market_fee)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(result.totals.discounted_total)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(result.totals.consultant_total)}</TableCell>
                            <TableCell className="text-right">${result.totals.rate_per_ft2.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{formatHours(result.totals.total_hours)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Base & Hourly Factor */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Cost Base Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Shell Cost Base:</span>
                          <span className="font-medium">{formatCurrency(result.cost_base.shell_cost_base)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Interior Cost Base:</span>
                          <span className="font-medium">{formatCurrency(result.cost_base.interior_cost_base)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Landscape Cost Base:</span>
                          <span className="font-medium">{formatCurrency(result.cost_base.landscape_cost_base)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span className="text-sm">Total:</span>
                          <span>{formatCurrency(result.totals.discounted_total)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Hourly Factor Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Hourly Factor:</span>
                          <span className="font-medium">{result.hourly_factor.hf_value.toFixed(5)} hr/SF</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Building Area:</span>
                          <span className="font-medium">{result.hourly_factor.total_building_area.toLocaleString()} SF</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Raw Design Hours:</span>
                          <span className="font-medium">{formatHours(result.hourly_factor.raw_design_hours)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-bold">
                          <span className="text-sm">Fee-Based Hours:</span>
                          <span>{formatHours(result.totals.total_hours)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}